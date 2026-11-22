'use strict';
// v15a/v15b regressions: preauthorized marketing and entirely offline poster designs.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..');
const scripts=['content.js','engine.js','media.js'].map(n=>[n,fs.readFileSync(path.join(root,n),'utf8')]);
function world(){
  let v=3117;
  const random=Object.create(Math);
  random.random=()=>{v=(Math.imul(v,1664525)+1013904223)>>>0;return v/4294967296;};
  const map=new Map(),localStorage={getItem:k=>map.get(k)||null,setItem:(k,x)=>map.set(k,String(x)),removeItem:k=>map.delete(k)};
  const ctx={console,Date,Math:random,JSON,localStorage};
  vm.createContext(ctx);
  for(const [name,src] of scripts)vm.runInContext(src,ctx,{filename:name});
  ctx.Engine.newGame({studioName:'Vintage Poster QA',founderName:'Director Tester'});
  ctx.Engine.state.cash=1000000;
  return ctx;
}
function finishMarketing(E,p){
  const pending=[];
  for(let i=0;i<130&&!p.flags.marketingDone;i++){
    if(E.state.pending){pending.push(E.state.pending.id);E.choose(E.state.pending.choices.length-1);}
    else E.nextTurn();
  }
  assert.equal(p.flags.marketingDone,true,'campaign should resolve after post-production');
  return pending;
}
const base={title:'The Last Postmark',format:'short',mediaVariant:'short',budgetCap:1500,
  scope:'intimate',genre:'drama',topic:'smalltown',
  cast:{director:'founder',writer:'founder',lead:'',crew:''}};
{
  const {Engine:E,Media:M}=world();
  const request={...base,marketingPlan:{intensity:'medium',target:'genre',message:'story'}};
  const quote=E.v15MarketingQuote(request);
  assert(quote.cost>0&&quote.estimatedHype>0,'plan quotes funded campaign');
  assert(quote.cost<=E.previewProject(request).allocation.marketing,'campaign within marketing bucket');
  const start=E.startProject(request);assert(start.ok,start.reason);
  const p=start.project;
  assert.equal(p.marketingPlan.intensity,'medium');
  assert.equal(p.marketingSpend,0,'nothing spent immediately');
  assert(!p.flags.marketingDone,'settlement scheduled for post-production');
  const pending=finishMarketing(E,p);
  assert(!pending.includes('marketing'),'no duplicate required marketing decision');
  assert.equal(p.marketingSpend,p.marketingPlan.spent,'record actual expense once');
  assert.equal(p.marketingSpend,p.budgetPlan.spent.marketing,'allocation ledger matches');
  assert(p.marketingSpend<=quote.cost&&p.spent<=p.budget,'budget integrity');
  assert(p.marketingPlan.hypeGained>=0);
  const before=[p.spent,p.marketingSpend,p.hypeMod];
  for(let i=0;i<8;i++){if(E.state.pending)E.choose(E.state.pending.choices.length-1);else E.nextTurn();}
  assert.deepEqual([p.spent-p.budgetPlan.spent.prep-p.budgetPlan.spent.shoot-p.budgetPlan.spent.post-p.budgetPlan.spent.distribution-p.budgetPlan.spent.reserve,p.marketingSpend].map(Math.round),
    [p.fees+p.marketingSpend,p.marketingSpend].map(Math.round),'marketing charged once, direct spend reconciles');
  assert(E.save());assert(E.load().ok,'legacy v13 save format loads');
  const loaded=E.getProject(p.id);
  assert.equal(loaded.marketingPlan.spent,before[1],'planned campaign survives reload');
  assert.equal(E.state.version,13,'no save migration needed');
  const example={...loaded,title:'The Last Postmark',posterStyleId:8,
    castNames:{lead:'Alex Actor',director:'Rosa Director',writer:'Lee Writer'}};
  const svg=M.posterSVG(example,{styleId:8});
  assert(svg.includes('<svg')&&svg.includes('WRITTEN BY Lee Writer')&&svg.includes('DIRECTED BY Rosa Director'));
  assert(svg.includes('STARRING Alex Actor')&&svg.includes('The Last Postmark'));
  assert.equal(svg,M.posterSVG(example,{styleId:8}),'generated poster is deterministic');
  assert.notEqual(svg,M.posterSVG({...example,topic:'roadtrip'},{styleId:8}),'topic changes artwork');
  assert.notEqual(svg,M.posterSVG({...example,title:'The Clock'},{styleId:8}),'title changes artwork');
  assert.notEqual(svg,M.posterSVG({...example,genre:'horror'},{styleId:8}),'genre changes artwork');
  assert.equal((svg.match(/<svg/g)||[]).length,(svg.match(/<\/svg>/g)||[]).length,'SVG elements balanced');
  assert(M.posterSVG(example,{styleId:31}).includes('WRITTEN BY Lee Writer'));
  assert(M.posterSVG(example,{styleId:0}).includes('Written by Lee Writer'),'old poster selections show credits');
  assert(E.setPosterStyle(p.id,31).ok);
  const prior=loaded.posterStyleId;
  assert(E.regeneratePosterSet(p.id).ok);
  assert.equal(loaded.posterStyleId,prior,'regeneration preserves selected poster');
  assert.equal(loaded.posterDesignBatch,1);
  assert(E.save()&&E.load().ok&&E.getProject(p.id).posterDesignBatch===1);
  assert(M.posterSVG({...example,title:'<Test & Title>'},{styleId:9}).includes('&lt;'),'XML title escaped');
  console.log('PASS v15a paid campaign, no duplicate prompt, budget/save, v15b scene, credits, seeded variants');
}
{
  const {Engine:E}=world();
  const r=E.startProject({...base,title:'No Campaign',marketingPlan:{intensity:'none',target:'general',message:'story'}});
  assert(r.ok,r.reason);const p=r.project;
  finishMarketing(E,p);
  assert.equal(p.marketingSpend,0);
  assert.equal(p.marketingPlan.hypeGained,0);
  console.log('PASS v15a opt-out requires no spend or hype');
}
{
  const {Engine:E}=world();
  E.state.studio.tier=3;E.state.studio.fame=75;
  const old=E.startProject({title:'Legacy No Marketing Plan',format:'feature',tier:0,genre:'drama',
    topic:'smalltown',cast:{director:'founder',writer:'founder'}});
  assert(old.ok,old.reason);
  const p=old.project;assert(!p.marketingPlan);
  let seen=false;
  for(let i=0;i<130&&!seen;i++){
    if(E.state.pending){
      if(E.state.pending.id==='marketing'){seen=true;break;}
      E.choose(E.state.pending.choices.length-1);
    }else E.nextTurn();
  }
  assert(seen,'existing projects without a plan still see the legacy marketing prompt');
  console.log('PASS legacy projects retain original post-production choice');
}
