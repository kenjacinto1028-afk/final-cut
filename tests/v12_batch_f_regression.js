// Batch F integration checks: paid ensembles, historical IDs, sequel hype, personal awards.
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const map=new Map(),ls={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
const M=Object.create(Math);M.random=()=>0.55;
const ctx={Math:M,Date,JSON,console,localStorage:ls};vm.createContext(ctx);
for(const f of ['content.js','engine.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});
const E=ctx.Engine,C=ctx.CONTENT;let passed=0;
const check=(name,fn)=>{fn();passed++;console.log('PASS',name)};
E.newGame({studioName:'Verification Studio',founderName:'Jane Example',homeRegion:'europe'});
let s=E.state;s.cash=60000000;s.studio.tier=4;s.studio.fame=90;s.studio.releases=30;
const avail=role=>E.talent().filter(t=>t.role===role&&!t.contract);
const actors=avail('actor'),crew=avail('crew'),directors=avail('director'),writers=avail('writer');
assert(actors.length>=2&&crew.length>=2&&directors.length&&writers.length);
const cast={director:directors[0].id,writer:writers[0].id,lead:actors[0].id,crew:crew[0].id};
const opts={format:'feature',tier:3,genre:'drama',topic:'smalltown',title:'First Ensemble',cast,supporting:[actors[1].id],specialists:[crew[1].id],backgroundCrew:1};
check('feature cap permits optional casts without tier or fame locks',()=>{
 assert(E.ensembleCaps('feature',3).supporting>=1);assert(E.ensembleCaps('feature',3).specialists>=1);
 assert.equal(E.ensembleCaps('short',2).supporting,0);
});
check('extra named cast and background crew cost money',()=>{
 const base=E.previewProject({...opts,supporting:[],specialists:[],backgroundCrew:0});
 const full=E.previewProject(opts);assert(full.ok,full.reason);assert(base.ok,base.reason);
 assert(full.fees>base.fees);assert(full.crewPackageCost>0);assert(full.prodBudget<base.prodBudget);
});
check('same individual cannot fill the lead and supporting roles',()=>{
 const bad=E.previewProject({...opts,supporting:[cast.lead]});assert(!bad.ok&&/one role/i.test(bad.reason),bad.reason);
});
const started=E.startProject(opts);assert(started.ok,started.reason);let p=started.project;
check('credits, ensemble and additional personnel are attached to production',()=>{
 assert.deepEqual(Array.from(p.supporting),[actors[1].id]);
 assert.deepEqual(Array.from(p.specialists),[crew[1].id]);
 assert.equal(p.backgroundCrew,1);
 assert(E.talentStatus(actors[1]).projectId===p.id);
 assert(E.talentStatus(crew[1]).projectId===p.id);
});
check('full career profiles only directors/writers',()=>{
 assert(E.talentCareer(cast.director));assert(E.talentCareer(cast.writer));
 assert.equal(E.talentCareer(cast.lead),null);assert.equal(E.talentCareer(cast.crew),null);
 assert(E.recognition(directors[0]).name);
});
check('film completion preserves ensemble and credits with stable IDs',()=>{
 for(let i=0;i<160&&p.stage!=='done'&&!s.gameOver;i++){
  while(s.pending)E.choose(s.pending.choices.length-1);
  E.nextTurn();
 }
 assert.equal(p.stage,'done','project stage '+p.stage);
 assert(p.qualityBreakdown.ensemble>0,JSON.stringify(p.qualityBreakdown));
 const record=E.filmById('player:'+p.id);
 assert.deepEqual(Array.from(record.creditIds.supporting),[actors[1].id]);
 assert(record.credits.supporting.includes(actors[1].name));
 assert(E.talentCareer(cast.director).films.some(f=>f.id===record.id));
 assert(E.talentCareer(cast.writer).films.some(f=>f.id===record.id));
});
check('sequel suggestions are optional and preserve original IDs',()=>{
 p.result='Hit';p.stage='done';
 const suggestion=E.sequelCastSuggestion(p);
 assert.equal(suggestion.lead,cast.lead);
 assert.equal(suggestion.director,cast.director);
 assert(suggestion.supporting.includes(actors[1].id));
});
check('recasting reduces hype but never applies a skill-quality penalty',()=>{
 const before=E.sequelContinuity(p,{...cast},p.supporting);
 const after=E.sequelContinuity(p,{...cast,lead:actors[1].id},[]);
 assert(before.hype>after.hype,{before,after});
 assert(before.notes.some(x=>x.slot==='lead'&&x.returned));
 assert(after.notes.some(x=>x.slot==='lead'&&!x.returned));
});
check('all current individual-award recipients are actors, directors, writers',()=>{
 assert(C.AWARDS.ceremonies.every(c=>c.categories.every(x=>!x.slot||['supporting','lead','director','writer'].includes(x.slot))));
 assert(C.AWARDS.categories.some(c=>c.id==='supporting'));
 assert(!C.AWARDS.categories.some(c=>/editing|cinematography|score/i.test(c.id)));
});
check('ceremonies credit personal honors, never Best Picture to an entire crew',()=>{
 const p2=JSON.parse(JSON.stringify(p));p2.id=s.nextId++;p2.title='Second Ensemble';p2.releaseWeek=14;p2.quality=93;p2.critic=95;p2.hype=80;p2.gross=5000000;p2.stage='done';p2.awards=[];
 s.projects.push(p2);
 p.releaseWeek=12;p.quality=95;p.critic=96;p.hype=80;p.gross=5000000;p.awards=[];
 s.week=60; // Week 9 of 1971; Golden Reel is week 10.
 while(s.pending)E.choose(0);
 E.nextTurn();while(s.pending)E.choose(0);
 assert(s.awards.judged['1971:golden'],'Golden Reel not judged');
 const personal=p.awards.concat(p2.awards).filter(x=>x.personId!=null);
 assert(personal.length>0,'no personal category nominees');
 assert(personal.every(x=>['actor','director','writer'].includes(x.role)));
 assert(p.awards.concat(p2.awards).filter(x=>x.cat==='picture').every(x=>x.personId==null));
 assert(!crew[0].awardHistory||crew[0].awardHistory.length===0);
 assert(directors[0].awardHistory&&directors[0].awardHistory.length>0);
});
check('v12 save continues loading with archived personal credits',()=>{
 assert(E.save());const before=E.state.projects.length;assert(E.load().ok);assert.equal(E.state.projects.length,before);
 assert(E.talentCareer(cast.writer).films.length>=1);
});
check('multi-decade archives use compact, lossless browser saves',()=>{
 s=E.state;
 const one=E.filmById('player:'+p.id);
 s.filmArchive.rivals=Array.from({length:1400},(_,i)=>({...one,id:'rival:99:'+i,projectId:null,studio:'Archive Studio',rivalId:99,title:'Title '+i,
   awards:[{year:1980,cat:'picture',category:'Best Picture',won:i%3===0}],festResults:[{id:'local',result:'Official Selection',year:1980}]}));
 const before=JSON.stringify(s);
 assert(before.length>500000);
 assert(E.save());
 const packed=ls.getItem('backlot_save');
 assert(packed.startsWith('FCP1'),'compact save prefix expected');
 assert(packed.length<before.length*.85,'saved bytes should be at least 15% smaller');
 assert(E.load().ok);
 assert.equal(E.state.filmArchive.rivals.length,1400);
 assert.equal(E.state.filmArchive.rivals[1399].title,'Title 1399');
 assert.equal(E.state.projects.length,s.projects.length);
});
console.log('TOTAL',passed,'v12 Batch F regression checks');
