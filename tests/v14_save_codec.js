// FCP2 is additive, lossless, and compatible with plain JSON/FCP1/v13 saves.
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const A=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
let raw=null;
const browserStore={
 getItem:key=>key==='backlot_save'?raw:null,
 setItem:(key,value)=>{if(key!=='backlot_save')return;if(value.length>5*1024*1024)throw Error('QuotaExceededError');raw=value;},
 removeItem:key=>{if(key==='backlot_save')raw=null;}
};
const ctx={console,Date,Math,JSON,localStorage:browserStore};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root,'content.js'),'utf8'),ctx);
vm.runInContext(fs.readFileSync(path.join(root,'engine.js'),'utf8'),ctx);
const E=ctx.Engine;
E.newGame({studioName:'FCP2 Compatibility',founderName:'Saver',homeRegion:'northamerica'});
// Older plain JSON remains valid.
const plain=JSON.stringify(E.state);raw=plain;A(E.load().ok,'plain v13 JSON');
A.equal(E.state.studio.name,'FCP2 Compatibility');
// Force older FCP1 compact format, preserving arbitrary user metadata.
E.state.legacyField=Array.from({length:7500},(_,i)=>({chapter:i,genre:'Drama',title:'Film '+i,writer:'Author',awards:[]}));
const fcp1=E.encodeSavePayload(E.state);
A(fcp1.startsWith('FCP1'),'expected an older FCP1-format save');
raw=fcp1;A(E.load().ok,'older FCP1 save roundtrip');
A.equal(E.state.legacyField.length,7500);
delete E.state.legacyField;
// Build a representative enormous lossless archive with Unicode user titles.
E.state.sampleHistory=Array.from({length:48000},(_,i)=>({
 id:i,studio:'Northwind Studio '+(i%12),year:1970+(i%61),
 title:'The Dragon 🐉 & Cinema 🎬 '+i+'—'+((i*2654435761)>>>0).toString(36),
 genre:i%3?'drama':'horror',result:i%5?'Hit':'Flop',
 story:'Filmmaking choices affect artists, rivals and awards. '.repeat(2),
 finances:{revenue:i*37,spent:i*23,critics:i%100,legacy:'Festival impact'},
 awards:[],credits:[i%11,i%29]
}));
const original=JSON.stringify(E.state.sampleHistory),started=Date.now();
const long=E.encodeSavePayload(E.state),elapsed=Date.now()-started;
A(long.startsWith('FCP2'),'lifetime-size payload must use FCP2 compression');
A(long.length<5*1024*1024,'lifetime-size payload must fit a simulated 5MiB quota');
A(E.inspectSave(long),'summary reader must support FCP2');
A(E.save(),'real engine save must succeed under 5MiB quota');
A.equal(raw,long);
A(E.load().ok,'FCP2 save must reload');
A.equal(JSON.stringify(E.state.sampleHistory),original,'all historical fields and Unicode preserved');
A(elapsed<15000,'compression must complete without excessive blocking');
console.log('PASS plain JSON, FCP1 legacy, FCP2 >5MiB raw, full unchanged Unicode/film history, real quota + reload',
 JSON.stringify({rawChars:JSON.stringify(E.state).length,compactChars:long.length,encodeMs:elapsed}));
