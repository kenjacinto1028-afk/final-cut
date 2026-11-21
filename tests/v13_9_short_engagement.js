// FinalCut v13.9: short screening economics, festival afterlife and modeled reach.
'use strict';
const A=require('node:assert/strict'),FS=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..'),storage=new Map();
const ctx={console,Date,JSON,Math,localStorage:{
  getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)}};
vm.createContext(ctx);
for(const file of ['content.js','engine.js'])vm.runInContext(FS.readFileSync(path.join(ROOT,file),'utf8'),ctx,{filename:file});
const E=ctx.Engine;
function next(){
  if(E.state.pending)E.choose(E.state.pending.choices.length-1);
  return E.nextTurn();
}
function until(fn,max=90){
  let i=0;
  while(!fn()&&i++<max&&!E.state.gameOver)next();
  A(fn(),'Condition not reached within '+max+' weeks');
}
function make(format,title,tier=0){
  const r=E.startProject({title,format,tier,genre:'drama',topic:'smalltown',
    cast:{director:'founder',writer:'founder'}});
  A(r.ok,r.reason);return r.project;
}
E.newGame({studioName:'Festival Test Workshop',founderName:'Film Creator',homeRegion:'northamerica'});
const short=make('short','The Winter Cinema');
until(()=>short.stage==='done',90);
A(short.shortRunWeeks>=3&&short.shortRunWeeks<=12);
A.equal(short.weeksInRelease,short.shortRunWeeks);
A.equal(short.shortRunCollected,short.shortRunTarget,'weekly payments must sum to same baseline');
A.equal(short.revenue,short.shortRunTarget,'no extra invented screening money');
A.equal(short.gross,0,'short films are not theatrical features');
A(E.shortAudience(short)>0);
const paid=E.projectPulse(short).history.filter(r=>r.revenue>0);
A.equal(paid.length,short.shortRunWeeks,'each screening week should book real receipts');
A.equal(paid.reduce((n,r)=>n+r.revenue,0),short.shortRunTarget,'weekly ledger balances');
A(paid.every(x=>x.screenings>0),'each paid week should record estimated screening visits');
const high=E.shortScreeningWeeks({quality:90,audience:90,hype:85,regions:['northamerica','europe']});
const low=E.shortScreeningWeeks({quality:28,audience:32,hype:10,regions:['northamerica']});
A(high>low+3&&high<=12&&low>=3,JSON.stringify({high,low}));
console.log('PASS screen circuits: '+short.shortRunWeeks+' paying weeks, total '+short.revenue+', reaches '+E.shortAudience(short)+' (modeled); strong run '+high+', weak run '+low);

// Publicity can be purchased after completion while the original scheduled
// festivals remain judged by the same juries.
const festival=E.shortFestivalStatus(short);A(festival && festival.planned>=1);
const press=E.shortPostReleaseQuote(short.id,'press');
A(press.ok,press.reason);
let balance=E.state.cash,spent=short.spent;
A(E.shortPostReleaseAction(short.id,'press').ok);
A.equal(E.state.cash,balance-press.cost);A.equal(short.spent,spent+press.cost);
A(!E.shortPostReleaseQuote(short.id,'press').ok);
A(!E.shortPostReleaseAction(short.id,'press').ok,'press kit cannot be purchased twice');
const earlyRevenue=short.revenue;
for(let i=0;i<52;i++)next();
A.equal(short.revenue,earlyRevenue,'press alone must not mint cash');
A((short.festResults||[]).length>0,'postrelease festivals should judge the film on calendar');
A(E.shortFestivalStatus(short).judged>0);
console.log('PASS festival afterlife: '+short.festResults.length+' jury entries after the screening run');

// A sufficiently good short can earn a small explicitly booked four-week encore.
// Give the independent test film acclaim so quote is not contingent on RNG.
E.newGame({studioName:'Encore Test Workshop',founderName:'Film Creator'});
const encoreFilm=make('short','Last Encore');
until(()=>encoreFilm.stage==='done',90);
encoreFilm.quality=80;E.state.cash+=10000;
const quote=E.shortPostReleaseQuote(encoreFilm.id,'encore');
A(quote.ok,quote.reason);balance=E.state.cash;spent=encoreFilm.spent;
A(E.shortPostReleaseAction(encoreFilm.id,'encore').ok);
A.equal(E.state.cash,balance-quote.cost);
A.equal(encoreFilm.spent,spent+quote.cost);
A(!E.shortPostReleaseQuote(encoreFilm.id,'encore').ok);
const beforeEncore=encoreFilm.revenue,beforeViews=E.shortAudience(encoreFilm);
for(let i=0;i<4;i++)next();
A.equal(encoreFilm.revenue-beforeEncore,quote.total,'encore receipts match the capped quoted total');
A.equal(encoreFilm.shortEncore.paid,quote.total);
A(E.shortAudience(encoreFilm)>beforeViews);
A.equal(encoreFilm.stage,'done','encore happens after film completion');
A.equal(E.state.version,13);
console.log('PASS one-time encore: '+quote.total+' paid in four weeks, after release');

// Old v13.8 saves, which held only a lifetime short receipt, are not paid again.
const raw=storage.get('backlot_save');A(raw&&raw[0]==='{');
const snap=JSON.parse(raw),historic=snap.projects.find(p=>p.id===encoreFilm.id);
delete historic.estimatedScreeningViewers;delete historic.shortRunWeeks;delete historic.shortRunTarget;
delete historic.shortRunCollected;delete historic.shortEncore;delete historic.shortFestivalPressKit;
historic.performanceHistory=[];
storage.set('backlot_save',JSON.stringify(snap));
A(E.load().ok);
const old=E.getProject(encoreFilm.id),oldReceipts=old.revenue;
A(E.shortAudience(old)>0,'legacy short reach is only estimated from receipts');
A.equal(E.projectPulse(old).history.length,0,'never fabricate missing historical weekly data');
for(let i=0;i<5;i++)next();
A.equal(old.revenue,oldReceipts,'legacy completed short must not replay income');
console.log('PASS legacy v13 short: original totals and save format unchanged, reach explicitly modeled');

// TV pickups provide estimated household *episode impressions*, not unique
// household counts. Rejected pilots show no fictional views.
let picked=null;
for(let j=0;j<7&&!picked;j++){
  E.newGame({studioName:'TV Family '+j,founderName:'Producer'});
  const st=E.state;st.studio.tier=3;st.studio.fame=80;st.cash=5e6;
  const pilot=make('pilot','Network Drama '+j,0);
  pilot.qualityMod=80;pilot.hypeMod=85;
  until(()=>pilot.stage==='done',80);
  if(pilot.result==='Picked up')picked=pilot;
}
A(picked,'Expected network pickup within seven high-score attempts');
for(let i=0;i<3;i++)next();
A(E.estimatedTvHouseholds(picked)>0);
A(E.projectPulse(picked).history.some(row=>row.households>0),'weekly TV impressions should be modeled per episode');
A.equal(E.estimatedTvHouseholds({format:'pilot'}),null,'older pilots without ratings cannot invent households');
console.log('PASS TV: modeled household episode impressions '+E.estimatedTvHouseholds(picked));
console.log('PASS v13.9 feature mechanics; save v'+E.state.version);
