'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const content=fs.readFileSync(path.join(root,'content.js'),'utf8');
const engine=fs.readFileSync(path.join(root,'engine.js'),'utf8');
function world(seed){
  const store=new Map(),math=Object.create(Math);
  math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const ctx={console,Date,Math:math,JSON,localStorage:{
    getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}};
  vm.createContext(ctx);vm.runInContext(content,ctx);vm.runInContext(engine,ctx);
  const E=ctx.Engine;E.newGame({studioName:'Lifecycle QA',founderName:'Director'});
  return {E,store,ctx,math};
}
// Probe each phase, a saved preproduction -> shoot dependency and relationships.
{
 const {E,ctx,math}=world(100),s=E.state;
 math.random=()=>0;
 s.cash=4_000_000;s.studio.fame=65;s.studio.tier=3;
 const r=E.startProject({title:'Chain Study',format:'feature',tier:0,genre:'drama',topic:'smalltown',
   cast:{director:'founder',writer:'founder'}});
 assert(r.ok,r.reason);
 const p=r.project,t=E.talent().find(t=>t.role==='actor');assert(t);
 p.cast.lead=t.id;
 let expected=[];
 function phase(stage,expect,choice=0,left=4){
   s.week+=5;p.stage=stage;p.stageWeeksLeft=left;
   const picked=E.lifecycleTick(p);
   assert.equal(picked,true,'lifecycle trigger '+expect);
   assert.equal(s.pending.lifecyclePhase,expect,'phase '+expect);
   expected.push(s.pending.id);E.choose(choice);
   assert.equal(s.pending,null,'resolve '+expect);
 }
 phase('development','development',0);
 assert(p.lifecycle.tags.includes('authentic'));
 p.usedEvents.push('lc_pre_location','lc_pre_cast','lc_pre_sponsor');
 phase('preproduction','preproduction',2);
 assert(p.lifecycle.tags.includes('technical_risk'),'preproduction risk remembered');
 p.usedEvents.push('lc_shoot_chemistry','lc_shoot_setback','lc_shoot_weather','lc_shoot_conflict');
 phase('shoot','shoot',0);
 assert(expected.at(-1)==='lc_shoot_risk_echo','on-set consequence should depend on earlier risk');
 phase('post','post',0,3);
 phase('post','preRelease',0,1);
 p.releaseWeek=s.week-1;p.weeksInRelease=1;
 phase('release','release');
 p.releaseWeek=s.week-5;p.weeksInRelease=7;
 phase('done','afterRelease',0);
 assert.equal(p.lifecycle.history.length,7,'max seven bounded events for features');
 assert(p.lifecycle.tags.includes('technical_risk'));
 assert(t.studioBond>50,'filmmaking choices change collaborator bond');
 assert(E.talentFee(t,'feature')>0);
 assert.equal(E.lifecycleQuote(p.id).limit,7);
 const size=JSON.stringify(p.lifecycle).length;assert(size<9000,'bounded film event save');
 assert(E.save());assert(E.load().ok,'chain and bond survive save');
 assert.equal(E.lifecycleQuote(p.id).history.length,7);
 assert.equal(E.getTalent(t.id).studioBond,t.studioBond);
 assert.equal(E.state.version,13);
 console.log('PASS seven phases, conditional risk echo, career bond and persistence');
}
// Delegation resolves routine opportunities but never automatically decides a
// high-stakes sponsorship, rights dispute or major cast conflict.
{
 const {E,math}=world(101);math.random=()=>0;
 E.state.cash=1_000_000;
 const p=E.startProject({title:'Delegation Study',format:'short',tier:0,genre:'drama',
   topic:'smalltown',cast:{director:'founder',writer:'founder'}}).project;
 assert(E.v14SetDelegation('director').ok);
 E.state.week+=5;p.stage='preproduction';p.stageWeeksLeft=4;
 assert.equal(E.lifecycleTick(p),false,'routine event delegates with no interruption');
 assert.equal(E.state.pending,null);
 assert.equal(p.lifecycle.history.length,1);
 E.state.week+=5;p.usedEvents.push('lc_pre_cast');p.usedEvents.push('lc_pre_location');
 assert.equal(E.lifecycleTick(p),false,'only one decision per stage');
 p.lifecycle.counts.preproduction=0;
 assert.equal(E.lifecycleTick(p),true,'sponsorship must still request a player decision');
 assert.equal(E.state.pending.id,'lc_pre_sponsor');
 E.choose(2);
 assert.equal(p.lifecycle.history.length,2);
 console.log('PASS delegation routes routine work and pauses only significant choices');
}
// Two long-running, deliberately funded studios stress bounded event cadence
// and persistence. These are structural stress runs, not economic balance claims.
for(const [idx,policy] of ['ask','commercial'].entries()){
 const {E}=world(210+idx),s=E.state;
 s.cash=50_000_000;s.studio.fame=70;s.studio.tier=3;
 E.v14SetDelegation(policy);
 assert(E.setFastSimulationTesting(true));
 let started=0,attempt=0,lastStart=-1;
 while(s.week<52*12&&attempt++<3800&&!s.gameOver){
   if(s.pending){E.choose((s.week+idx)%s.pending.choices.length);continue;}
   if(s.week%25===0&&lastStart!==s.week&&E.activeProjects().length<E.capacity()){
     lastStart=s.week;
     const fmt=(s.week+idx)%2===0?'short':'feature';
     const title='Life '+idx+'-'+s.week;
     const r=E.startProject({title,format:fmt,tier:0,genre:idx?'horror':'drama',
       topic:idx?'haunted':'smalltown',cast:{director:'founder',writer:'founder'}});
     if(r.ok)started++;
   }
   E.nextTurn();
 }
 assert(s.week>=624&&!s.gameOver,'12-year campaign remains playable');
 const done=s.projects.filter(p=>p.stage==='done'),hist=s.projects.map(p=>p.lifecycle?.history||[]);
 const total=hist.reduce((n,h)=>n+h.length,0);
 assert(started>=12&&done.length>=10,'real film lifecycle across full simulation');
 assert(total>=12,'film opportunities must happen in long simulations');
 assert(hist.every((h,i)=>h.length<=(s.projects[i].format==='feature'?7:5)),'event cap must hold');
 assert(hist.every(h=>h.every(x=>typeof x.consequence==='string'&&x.consequence.length<260)));
 assert(Number.isFinite(s.cash)&&Number.isFinite(s.debt));
 assert(E.setFastSimulationTesting(false));assert(E.save(),'store complete world');
 assert(E.load().ok,'reload 12-year history');
 console.log('PASS 12-year funded studio',JSON.stringify({policy,started,completed:done.length,events:total,
   eventsPerFilm:+(total/Math.max(1,started)).toFixed(2),cash:Math.round(s.cash)}));
}
console.log('PASS v14.11a–f event chains, discretion, bounded economy and legacy saves');
