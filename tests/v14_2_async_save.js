// v14.2 small-save and no-worker compatibility, title cache and manual save contracts.
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),A=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const memory=new Map();
const localStorage={setItem(k,v){memory.set(k,String(v));},getItem(k){return memory.get(k)??null;},removeItem(k){memory.delete(k);}};
const ctx={console,Date,Math,JSON,localStorage};
vm.createContext(ctx);
for(const p of ['content.js','engine.js','save-slots.js'])
  vm.runInContext(fs.readFileSync(path.join(root,p),'utf8'),ctx,{filename:p});
(async()=>{
 const E=ctx.Engine,S=ctx.SaveSlots;
 E.newGame({studioName:'Save Contract',founderName:'Producer',homeRegion:'northamerica'});
 A.equal(E.state.version,13);
 A.equal(typeof E.saveAsync,'function');
 A.equal(typeof E.encodeSavePayloadAsync,'function');
 A.equal(typeof S.manualSave,'function');
 A.equal(typeof S.manualSaveAsync,'function');
 A(S.manualSave().ok);
 const before=memory.get('backlot_save');
 A(before,'active campaign not written');
 E.state.cash+=12345;
 const res=await S.manualSaveAsync();
 A(res.ok,'missing-Worker async save must safely use existing sync codec');
 A.equal(S.list().slots.length,1);
 A.equal(E.inspectSave(memory.get('backlot_save')).version,13);
 A.equal(E.state.cash,ctx.Engine.state.cash);
 E.closeSession();
 A.equal(S.list().slots.length,1,'title screen must still find original active campaign');
 A(E.load().ok,'legacy/compact loader still works');
 A.equal(E.state.version,13);
 const isolated={...E.state,campaignId:'branch-contract-test'};
 const encoded=await E.encodeSavePayloadAsync(isolated);
 A.equal(E.inspectSave(encoded).campaignId,'branch-contract-test');
 console.log('PASS v14.2 legacy manual save, missing-Worker fallback, title cache, independent campaign encoding');
})().catch(err=>{console.error(err);process.exitCode=1;});
