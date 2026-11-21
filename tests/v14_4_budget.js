// FinalCut v14.4 custom budgets, stage ledger, media continuations and episodic income.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..');
const sources=['content.js','engine.js'].map(f=>fs.readFileSync(path.join(root,f),'utf8'));
const mock=Math.random;
function game(seed=0.07){
  const db=new Map();
  const store={getItem:k=>db.get(k)??null,setItem:(k,v)=>db.set(k,String(v)),removeItem:k=>db.delete(k)};
  const math=Object.create(Math);math.random=()=>seed;
  const ctx={Math:math,console,Date,JSON,localStorage:store};
  vm.createContext(ctx);sources.forEach(src=>vm.runInContext(src,ctx));
  const E=ctx.Engine;E.newGame({studioName:'Flexible Pictures',founderName:'Test Director',homeRegion:'northamerica'});
  return {E,ctx,db};
}
function advance(E,limit,condition){
  for(let i=0;i<limit&&!condition();i++){
    if(E.state.pending)E.choose(E.state.pending.choices.length-1);
    else E.nextTurn();
  }
  assert(condition(),'expected condition not reached after '+limit+' weeks');
}
const {E,ctx}=game();
const B=ctx.FinalCutBudget;
assert.equal(B.budgetClass('short',1999),'Micro');
assert.equal(B.budgetClass('short',2000),'Low');
assert.equal(B.media('mid'),'short');
assert.equal(B.media('web'),'pilot');
const defaultPlan=B.evaluate({variant:'short',scope:'intimate',cap:1500,fees:300});
assert.equal(Object.values(defaultPlan.plan).reduce((a,b)=>a+b,0),1200);
assert.equal(defaultPlan.unallocated,0);
assert.notEqual(defaultPlan.level,'Underfunded');
const alloc={prep:200,shoot:700,post:300,marketing:200,distribution:100,reserve:100};
const exact=B.evaluate({variant:'short',scope:'intimate',cap:2000,fees:400,plan:alloc});
assert.equal(exact.unallocated,0);
assert.equal(exact.plan.reserve,100);
assert(B.evaluate({variant:'short',cap:2000,fees:400,plan:{...alloc,shoot:900}}).unallocated<0);
console.log('PASS: custom budget classifications, allocation integrity and viability');
const base={title:'A Quiet Letter',format:'short',mediaVariant:'short',budgetCap:1500,scope:'intimate',
  tier:0,genre:'drama',topic:'smalltown',cast:{director:'founder',writer:'founder',lead:'',crew:''}};
const q=E.previewProject(base);assert(q.ok,q.reason);
assert(q.feasibility&&q.allocation&&q.weekly===0);
const made=E.startProject(base);assert(made.ok,made.reason);
const p=made.project;assert.equal(p.budgetPlan.cap,1500);
const startCash=E.state.cash;
E.nextTurn();
assert(p.budgetPlan.spent.prep>0);
assert.equal(startCash-E.state.cash,E.state.lastWeek.costs-E.state.lastWeek.income,
  'cash changes must match the income/expense ledger exactly');
assert.equal(E.state.lastWeek.production,p.budgetPlan.spent.prep,
  'preparation spending is included in weekly production expense once'); 
const originalSpent=p.spent;
advance(E,110,()=>p.stage==='done');
assert(p.spent>=originalSpent);
assert(p.budgetPlan.spent.prep<=p.budgetPlan.allocation.prep);
assert(p.budgetPlan.spent.shoot<=p.budgetPlan.allocation.shoot);
assert(p.budgetPlan.spent.post<=p.budgetPlan.allocation.post);
assert(p.spent<=p.budget,'no silent spending beyond custom cap');
assert(E.v144BudgetInfo(p).projectedRemaining>=0);
assert(E.load().ok&&E.state.version===13);
assert(E.v144BudgetInfo(p.id).cap===1500);
console.log('PASS: staged cost booking, cap safety, short completion and v13 save roundtrip');
const parent=E.getProject(p.id);parent.quality=82;parent.critic=85;
const eligibility=E.sequelEligibility(parent.id);assert(eligibility.ok,eligibility.reason);
E.state.studio.fame=65;E.state.studio.tier=3;E.state.cash=1_000_000;
const lead=E.slotOptions('lead','pilot','drama','smalltown',30000)
  .find(x=>typeof x.id==='number'&&!x.busy&&!x.elite&&x.fee<=1500);
assert(lead,'expected affordable supporting lead for a low-budget pilot');
const fameBefore=E.getTalent(lead.id).fame;
const follow={title:'The Quiet Letters',format:'pilot',mediaVariant:'pilot',budgetCap:30000,
  episodeCount:6,scope:'intimate',tier:0,genre:'drama',topic:'smalltown',
  sequelOf:parent.id,continuationType:'adaptation',
  cast:{director:'founder',writer:'founder',lead:lead.id,crew:''}};
const fq=E.previewProject(follow);assert(fq.ok,fq.reason);
const f=E.startProject(follow);assert(f.ok,f.reason);
assert.equal(f.project.sequelOf,parent.id);assert.equal(f.project.continuationType,'adaptation');
assert.notEqual(f.project.quality,parent.quality,'new story has its own quality');
advance(E,100,()=>f.project.stage==='done');
assert(f.project.quality>0);
assert(f.project.budgetPlan!=null);
assert(E.state.series.length>=1,'pilot should be picked up with seeded chance');
const series=E.state.series.at(-1);
assert(series.flexibleSeries);
series.quality=95;series.hype=90;
assert.equal(series.episodes,6);
assert(series.firstEpCost>0 && series.firstEpCost<=Math.round(f.project.budget*.92),
  'episode cost is grounded in funded production, excluding unspent reserve');
const pre=series.revenue;
advance(E,8,()=>series.sponsorOffer!=null);
const offer=series.sponsorOffer;assert(offer.perEpisode>0);
assert.equal(E.seriesFeasibility(series.id).guaranteedSponsorship,0,
  'unsigned sponsor offer must not be projected as confirmed cash');
assert(E.signSeriesSponsor(series.id).ok);
assert(E.seriesFeasibility(series.id).guaranteedSponsorship>=offer.perEpisode,
  'signed recurring sponsor may be included only for future aired episodes');
const beforeSponsor=series.sponsorRevenue;
advance(E,5,()=>series.sponsorRevenue>beforeSponsor);
assert(series.sponsorRevenue>=offer.perEpisode);
assert(series.revenue>pre);
assert(E.seriesPlan(series.id,'retain',8).ok);
advance(E,30,()=>series.season>=2||series.status==='ended');
assert.equal(series.seasonHistory.length,1);
assert(E.getTalent(lead.id).fame>=fameBefore,'actual credited series talent must retain or gain fame');
if(series.season>=2){
 assert(series.starDemand>=1);
 assert(series.epCost>=series.firstEpCost*.6);
 assert.equal(series.nextEpisodeCount,8);
}
console.log('PASS: short→TV adaptation, independent pilot, episode sponsors and renewal economics');
const short2000=E.previewProject({...base,title:'Budget 2K',budgetCap:2000});
assert(short2000.ok,short2000.reason);assert.equal(short2000.feasibility.budgetClass,'Low');
console.log('PASS FinalCut v14.4 budget and series contract suite');
