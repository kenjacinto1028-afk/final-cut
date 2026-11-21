// v14.4a: funded TV payouts, popularity-based renewals and sample normal-start flexible budgets.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=['content.js','engine.js'].map(f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8')).join('\n');
function rng(seed){return ()=>{seed|=0;seed=(seed+0x6D2B79F5)|0;let x=Math.imul(seed^seed>>>15,1|seed);x=x+Math.imul(x^x>>>7,61|x)^x;return ((x^x>>>14)>>>0)/4294967296;};}
function newGame(seed=1, fixed=null){
  const math=Object.create(Math);math.random=fixed==null?rng(seed):()=>fixed;
  const storage=new Map();
  const localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)};
  const ctx={Math:math,console:{log(){}},Date,JSON,localStorage};vm.createContext(ctx);vm.runInContext(source,ctx);
  const E=ctx.Engine;
  E.newGame({studioName:'Budget Balance',founderName:'Founder',homeRegion:'northamerica'});
  E.TEST_BUDGET=ctx.FinalCutBudget; // pure planning module for simulated user choices
  return E;
}
function advance(E,n,predicate){
  for(let i=0;i<n&&!predicate();i++){
    if(E.state.pending)E.choose(E.state.pending.choices.length-1);
    else E.nextTurn();
    if(E.state.gameOver)break;
  }
  return predicate();
}
const founderCast={director:'founder',writer:'founder',lead:'',crew:''};
const defaultBase={title:'The Measured Pilot',format:'pilot',mediaVariant:'pilot',
  genre:'drama',topic:'smalltown',scope:'intimate',tier:0,cast:founderCast};
{
  const E=newGame(1,.01);
  E.state.studio.tier=3;E.state.studio.fame=75;E.state.cash=2000000;
  const cap=300000;
  const quote=E.previewProject({...defaultBase,budgetCap:cap});
  assert(quote.ok,quote.reason);
  const available=cap-quote.fees-quote.scriptFee;
  const allocation={prep:1500,shoot:3000,post:1800,marketing:1800,distribution:0,
    reserve:available-8100};
  const q=E.previewProject({...defaultBase,budgetCap:cap,allocation});
  assert(q.ok,q.reason);
  assert(q.feasibility.unallocated===0);
  const project=E.startProject({...defaultBase,budgetCap:cap,allocation}).project;
  assert(project);
  E.state.studio.fame=80;
  E.state.reputation.buzz=40;E.state.reputation.currentPrestige=40;
  const offer=E.filmSponsorQuote(project.id);
  assert(offer.ok,offer.reason);
  assert(offer.upfront<1000,'future reserve cannot mint a giant sponsor check');
  const signed=E.acceptFilmSponsor(project.id);
  assert(signed.ok&&signed.upfront===offer.upfront);
  const promo=E.filmPromotionQuote(project.id,'broad');
  assert(promo.ok&&promo.cost<1000,
    'pre-release campaign should price committed scope, not idle cap');
  assert(advance(E,85,()=>project.stage==='done'),'TV pilot must finish');
  const spent=project.budgetPlan.spent;
  const funded=project.fees+(project.scriptFee||0)+spent.prep+spent.shoot+spent.post;
  const ratio=project.result==='Picked up'?E.TUNING.tv.pilotFeeShare:E.TUNING.tv.passFeeShare;
  assert.equal(project.revenue-signed.upfront,Math.round(funded*ratio),
    'no picked-up or passed pilot can collect a license fee on unused reserve');
  assert(project.revenue<cap*.04,'unspent cap must not create a windfall');
  console.log('V144A_PILOT '+JSON.stringify({cap,funded,reserve:allocation.reserve,
    received:project.revenue,sponsor:signed.upfront,promotionQuote:promo.cost,result:project.result}));
}
function sampleRenewal(flexible){
  const E=newGame(flexible?19:23,.01);
  E.state.cash=2000000;
  E.TUNING.tv.ratingQuality=.45; // controlled breakout demand for bonus cap test
  const talent=E.state.talent.find(t=>t.role==='actor');
  assert(talent,'baseline actor');
  talent.fame=95;
  const s={id:999,projectId:-1,title:'Breakout Series',genre:'drama',topic:'smalltown',
    season:1,episodes:4,aired:3,epCost:10000,firstEpCost:10000,fee:11000,
    quality:95,hype:95,ratings:[18,18,18],seasonAvgs:[],status:'airing',hiatusLeft:0,
    revenue:0,cost:0,flexibleSeries:flexible,mediaVariant:'pilot',scope:'intimate',
    castIds:[talent.id],talentStrategy:'retain',nextEpisodeCount:8,seasonHistory:[],
    sponsor:null,sponsorOffer:null,sponsorRevenue:0,sponsorOffersMade:1,
    lastSeasonCost:0,starDemand:1,renewalChance:null,ratingsTrend:0,showMomentum:0};
  E.state.series.push(s);
  assert(E.nextTurn(),'series advanced');
  assert.equal(s.season,2,'controlled positive renewal');
  const observedBonus=s.revenue-11000;
  if(flexible){
    assert(observedBonus<=2200,'flexible audience performance bonus must be bounded');
    assert(s.fee>Math.round(11000*(1+E.TUNING.tv.renewFeeRaise)),
      'popular new series should earn a measured network fee increase');
    assert(s.epCost>10000,'famous actors must still ask for substantial renewal raises');
    assert(s.fee<s.epCost*1.5,'network raise must not guarantee excessive profit');
  } else {
    assert.equal(s.fee,Math.round(11000*(1+E.TUNING.tv.renewFeeRaise)),
      'existing pre-v14.4 series keep their renewal formula');
    assert(observedBonus>2200,'legacy rating bonuses remain unchanged');
  }
  console.log('V144A_RENEWAL '+JSON.stringify({flexible,epCost:s.epCost,fee:s.fee,
    bonus:observedBonus,starDemand:s.starDemand,season:s.season}));
}
sampleRenewal(true);sampleRenewal(false);
// A small normal-start cohort exercises genuine flexible projects instead of legacy bot tiers.
for(const mode of ['lean','craft','audience','balanced']){
  const E=newGame(6100+['lean','craft','audience','balanced'].indexOf(mode));
  let greenlit=0,completed=0,spent=0,earned=0;
  const baseCash=E.state.cash;
  for(let w=0;w<416&&!E.state.gameOver;w++){
    if(E.state.pending){E.choose(E.state.pending.choices.length-1);continue;}
    if(E.activeProjects().length===0 && E.state.cash>=2200){
      const cap=Math.min(Math.max(1500,Math.round(E.state.cash*.23)),mode==='craft'?4800:3600);
      const opts={title:'Independent '+mode+' '+(greenlit+1),format:'short',mediaVariant:'short',
        budgetCap:cap,scope:'intimate',tier:0,genre:'drama',topic:'smalltown',
        cast:founderCast};
      const estimate=E.previewProject(opts);
      if(estimate.ok){
        // Exercise actual allocation strategies, not just different project names.
        const spendable=cap-estimate.fees-estimate.scriptFee;
        const allocation=E.TEST_BUDGET.recommended(spendable,'balanced',
          mode==='balanced'?null:mode);
        const project=E.startProject({...opts,allocation});
        if(project.ok)greenlit++;
      }
    }
    E.nextTurn();
  }
  const p=E.state.projects.filter(x=>x.budgetPlan);
  completed=p.filter(x=>x.stage==='done'||x.stage==='release').length;
  spent=p.reduce((a,x)=>a+(x.spent||0),0);
  earned=p.reduce((a,x)=>a+(x.revenue||0),0);
  assert(Number.isFinite(E.state.cash)&&Number.isFinite(spent)&&Number.isFinite(earned));
  assert(p.every(x=>x.spent<=x.budget+0.001),'no new flexible project may exceed its cap');
  console.log('V144A_NORMAL_START '+JSON.stringify({mode,started:greenlit,
    completed,bankrupt:!!E.state.gameOver,cash:E.state.cash,
    grossReceipts:earned,directSpending:spent,baseCash}));
}
console.log('PASS: v14.4a funded TV fees, bounded rating income, legacy renewals and 4 normal-start flexible samples');
