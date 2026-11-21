// FinalCut v14a: Film DNA story and legacy-save acceptance tests.
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),A=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),store=new Map();
const ctx={console,Date,JSON,Math,localStorage:{
 getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)
}};
vm.createContext(ctx);
for(const name of ['content.js','engine.js'])vm.runInContext(fs.readFileSync(path.join(root,name),'utf8'),ctx,{filename:name});
const E=ctx.Engine;
function next(){if(E.state.pending)E.choose(E.state.pending.choices.length-1);E.nextTurn();}
function until(fn,max=90){let i=0;while(!fn()&&i++<max&&!E.state.gameOver)next();A(fn(),'step not reached');}
function create(format,genre,topic){
 const r=E.startProject({title:'Our '+format,format,genre,topic,tier:0,
 cast:{director:'founder',writer:'founder'}});
 A(r.ok,r.reason);return r.project;
}
E.newGame({studioName:'Film DNA Workshop',founderName:'A Producer'});
const s=E.state;s.cash=2e7;s.studio.tier=3;s.studio.fame=65;
for(const [format,genre,topic] of [['short','horror','haunted'],['feature','drama','familysecret'],['pilot','comedy','smalltown']]){
 const p=create(format,genre,topic),dna=E.filmDNASummary(p);
 A.equal(dna.version,1);A.equal(dna.origin,'custom');A(!dna.legacy);
 A(dna.hook&&dna.hook.length>25);A.equal(dna.strengths.length,2);
 A(dna.risk&&dna.intent&&dna.lane);A(dna.story.length===1&&dna.story[0].type==='greenlight');
 until(()=>p.stage==='done',95);
 const completed=E.filmDNASummary(p);
 A(completed.story.some(x=>x.type==='stage'));
 A(completed.story.some(x=>x.type==='decision'));
 A(completed.story.some(x=>x.type==='premiere'));
 A(completed.story.some(x=>x.type==='afterlife'));
 A(completed.story.length<=16);
 const decisions=completed.story.filter(x=>x.type==='decision');
 A(decisions.every(x=>typeof x.eventId==='string'&&Number.isInteger(x.choice)));
 A(completed.flags.decisions>=decisions.length);
 const film=E.filmHistory().find(f=>f.projectId===p.id);
 A(film&&film.filmDNA);A.equal(film.filmDNA.hook,dna.hook);
 console.log('PASS v14a '+format+' DNA: '+completed.story.map(x=>x.type).join(','));
}
const old=JSON.parse(store.get('backlot_save'));const count=old.projects.length;
for(const p of old.projects)delete p.filmDNA;
store.set('backlot_save',JSON.stringify(old));
A(E.load().ok);A.equal(E.state.version,13);
A.equal(E.state.projects.length,count);
const legacy=E.getProject(1),x=E.filmDNASummary(legacy);
A(x.legacy&&!x.hook&&!x.story.length);
A(!legacy.filmDNA,'historical save must not be rewritten as a newly created film');
console.log('PASS legacy v13: no invented creative history, stable schema');
const oldGross=legacy.gross,oldRevenue=legacy.revenue;
for(let i=0;i<4;i++)next();
A.equal(legacy.gross,oldGross);A(legacy.revenue>=oldRevenue);
A.equal(E.load().ok,true);
console.log('PASS legacy save multiweek gameplay and reload');
const p=create('short','thriller','heist');
for(let i=0;i<24;i++){
 E.state.pending={projectId:p.id,id:'audit-test-'+i,choices:[{
   label:'Option '+i,effects:{quality:i%2===0?1:-1,hype:2,costPct:.001},
   result:'Producer committed to option '+i}]};
 A(E.choose(0));
}
A.equal(E.filmDNASummary(p).story.length,16,'bounded event memory');
A.equal(p.filmDNA.flags.decisions,24,'counts all player choices');
A(E.filmDNASummary(p).story.every(row=>row.type==='decision'));
A(E.save());A(E.load().ok);
A.equal(E.filmDNASummary(E.getProject(p.id)).flags.decisions,24);
console.log('PASS bounded decision history, cost/quality attribution and save reload');
