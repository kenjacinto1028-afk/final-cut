'use strict';
// Final Cut v15c–h: persistent living world, real player responses and 15-year stress.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..');
const scripts=['content.js','engine.js'].map(name=>fs.readFileSync(path.join(root,name),'utf8'));
function world(seed=224){
  const map=new Map();
  const math=Object.create(Math);
  math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const ctx={Math:math,Date,JSON,console,localStorage:{
    getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)}};
  vm.createContext(ctx);
  scripts.forEach(src=>vm.runInContext(src,ctx));
  const E=ctx.Engine;
  E.newGame({studioName:'Living QA Pictures',founderName:'Casey Studio'});
  return {E,ctx,math,map};
}
function syntheticFilm(E){
  const s=E.state;s.studio.tier=3;s.studio.fame=75;s.cash=10000000;
  const input={title:'Audience At Dusk',format:'feature',tier:0,genre:'drama',topic:'smalltown',
    cast:{director:'founder',writer:'founder'},vision:'prestige',
    marketingPlan:{intensity:'small',target:'critics',message:'prestige'}};
  const made=E.startProject(input);
  assert(made.ok,made.reason);
  const p=made.project;
  p.stage='done';p.releaseWeek=20;p.quality=88;p.critic=83;p.audience=89;
  p.hype=77;p.gross=400000;p.revenue=110000;p.result='Hit';
  return p;
}
{
  const {E}=world(),r=E.activeRivals()[0];
  const p1=E.v15RivalProfile(r.id);
  assert(p1.trait&&p1.ambition&&Number.isFinite(p1.relation));
  assert(['Competitive challenger','Methodical producer','Prestige visionary','Industry connector','High-stakes opportunist'].includes(p1.trait));
  assert(r.livingHistory.length>=1,'rival ambitions must leave a stable record');
  r.playerRelation=-32;
  assert.equal(E.v15RivalProfile(r.id).label,'Rival');
  assert(E.save()&&E.load().ok);
  assert.equal(E.v15RivalProfile(r.id).trait,p1.trait,'personality survives loading');
  assert.equal(E.v15RivalProfile(r.id).relation,-32);
  E.state.week=52;
  const p2=E.v15RivalProfile(r.id);
  assert.equal(p2.ambition.length>0,true);
  assert(E.getRival(r.id).livingHistory.length>=2,'a new year should record an updated ambition');
  console.log('PASS v15c personality, yearly goal, relationship, saved history');
}
{
  const {E}=world(),s=E.state;
  const t=E.talent().find(x=>x.role==='actor');
  const stage=E.v15TalentProfile(t.id);
  assert(stage.age>=18&&stage.goal&&stage.stage);
  t.contract={type:'exclusive',salary:100,endWeek:200,morale:95,idle:0,warned:false};
  t.fame=80;t.career.fameAtLastDemand=20;t.career.birthYear=1940;
  s.cash=10000000;s.week=51;
  E.nextTurn();
  const pending=[s.pending,...s.queue].filter(Boolean);
  assert(pending.some(x=>x.scope==='career_demand'&&x.talentId===t.id),
    'a high-fame underpaid retained artist should request real terms');
  for(let tries=0;tries<15&&s.pending&&s.pending.scope!=='career_demand';tries++)E.choose(s.pending.choices.length-1);
  assert.equal(s.pending?.scope,'career_demand');
  const before=s.cash;
  E.choose(0);
  assert(t.contract.salary>100);
  assert(s.cash<before,'accepted bonus actually costs money');
  assert.equal(t.career.lastDemandYear,E.dateOf().year);
  assert(E.save()&&E.load().ok);
  assert(E.v15TalentProfile(t.id).currentSalary>100);
  console.log('PASS v15d persisted careers, annual demand and actual paid raise');
}
{
  const {E,math}=world(),t=E.talent().find(x=>x.role==='writer');
  t.career.birthYear=1890;t.career.retireAge=62;
  E.state.week=51;math.random=()=>0;
  E.nextTurn();
  const bio=E.v15TalentProfile(t.id);
  assert(bio.retired&&bio.stage==='Retired');
  assert(!E.contractQuote(t.id,1,false).ok,'retired artists cannot be signed');
  assert(E.slotOptions('writer','short','drama','smalltown',1500).find(x=>x.id===t.id)?.busy);
  console.log('PASS v15d late-career retirement and casting guard');
}
{
  const {E,math}=world(),p=syntheticFilm(E);
  E.state.week=91;
  const before=E.filmFollowing(p);
  const q=E.v15FanEventQuote(p.id);
  assert(q.ok,q.reason);
  const originalCash=E.state.cash;
  const signed=E.v15HostFanEvent(p.id);
  assert(signed.ok&&signed.cost===q.cost);
  assert.equal(originalCash-E.state.cash,q.cost);
  assert(E.filmFollowing(p).loyal>=before.loyal);
  assert(!E.v15FanEventQuote(p.id).ok,'repeat paid fan action must cool down');
  assert(E.v15FanStatus(p.id).history.length>=1);
  const cash=E.state.cash;
  E.state.week=104;math.random=()=>0;
  E.v15OpportunityTick();
  const offers=E.v15ActiveOffers();
  assert(offers.length>=1,'eligible acclaimed film should draw an industry offer');
  assert(offers[0].cost>=0&&offers[0].expiresWeek>E.state.week);
  const outcome=E.v15OfferAction(offers[0].id,'accept');
  assert(outcome.ok&&outcome.status==='accepted');
  assert(E.state.cash===cash+outcome.receipts-outcome.cost);
  assert(!E.v15ActiveOffers().some(o=>o.id===offers[0].id));
  assert(!E.v15OfferAction(offers[0].id,'accept').ok,'deal cannot pay twice');
  assert(p.v15IndustryDeals.includes(offers[0].kind));
  assert(E.save()&&E.load().ok);
  assert(E.v15OfferList().find(o=>o.id===offers[0].id).status==='accepted');
  console.log('PASS v15e–f grounded fans, paid engagement, actual negotiated deal and replay guard');
}
{
  const {E,math}=world(),p=syntheticFilm(E);
  for(const [year,expected] of [[1970,'traditional'],[1997,'forums'],[2007,'web'],[2015,'social'],[2025,'shortform']]){
    E.state.week=(year-1970)*52;
    assert.equal(E.v15MediaEra().id,expected,'calendar channel '+year);
  }
  E.state.week=(2015-1970)*52+12;
  p.releaseWeek=E.state.week-30;
  math.random=()=>0;
  E.nextTurn();
  assert(E.v15MediaFeed().length>=1,'public media discussion expected at a quarterly trigger');
  const headline=E.v15MediaFeed()[0];
  assert.equal(headline.era,'social');
  assert(/Social|Influencer|Trailer|Fan/.test(headline.channel));
  const quote=E.v15MediaQuote(p.id);
  assert(quote.ok,quote.reason);
  const before=[E.state.cash,p.marketingSpend||0];
  const reply=E.v15MediaRespond(p.id,'engage');
  assert(reply.ok);
  assert.equal(before[0]-E.state.cash,quote.cost);
  assert.equal((p.marketingSpend||0)-before[1],quote.cost);
  assert(!E.v15MediaQuote(p.id).ok,'media response is one time');
  assert(E.save()&&E.load().ok);
  assert(E.v15MediaFeed()[0].era==='social');
  console.log('PASS v15g real historical era gates, publicity ledger and bounded response');
}
for(const seed of [11,73]){
  const {E}=world(seed),s=E.state;
  s.cash=40000000;s.studio.fame=70;s.studio.tier=3;
  E.setFastSimulationTesting(true);
  let launched=0,attempts=0;
  while(s.week<52*15&&attempts++<1800&&!s.gameOver){
    if(s.pending){E.choose(s.pending.choices.length-1);continue;}
    if(s.week%29===0&&E.activeProjects().length<E.capacity()){
      const input={title:'Living '+seed+' '+s.week,format:'short',mediaVariant:'short',
        budgetCap:1500,scope:'intimate',genre:s.week%2?'horror':'drama',topic:s.week%2?'haunted':'smalltown',
        cast:{director:'founder',writer:'founder'},marketingPlan:{intensity:'small',target:'genre',message:'story'}};
      if(E.startProject(input).ok)launched++;
    }
    E.nextTurn();
  }
  assert(s.week>=52*15&&!s.gameOver,'funded 15-year simulation must remain playable');
  assert(launched>=9,'player must have produced a substantial slate');
  assert(s.projects.filter(p=>p.releaseWeek!=null).length>=7);
  assert(s.projects.every(p=>p.spent>=0&&Number.isFinite(p.spent)&&Number.isFinite(p.revenue)));
  assert(s.rivals.list.every(r=>(r.livingHistory||[]).length<=12));
  assert((s.v15?.offers||[]).length<=24);
  assert((s.v15?.media||[]).length<=30);
  assert(s.talent.every(t=>t.skill>=1&&t.skill<=100&&t.fame>=0&&t.fame<=100));
  assert(Number.isFinite(s.cash)&&Number.isFinite(s.debt));
  assert(E.save()&&E.load().ok,'complete long-running world should remain reloadable');
  console.log('PASS v15h 15-year funded world',JSON.stringify({
    seed,week:s.week,launched,released:s.projects.filter(p=>p.releaseWeek!=null).length,
    offers:s.v15?.offers?.length||0,media:s.v15?.media?.length||0,cash:Math.round(s.cash)}));
}
console.log('PASS FINAL CUT v15c-h LIVING INDUSTRY');
