/* FinalCut v14.4 — pure, versioned budget planning helpers.
 * Keeps legacy v13 films untouched; only projects with budgetPlan opt in. */
var FinalCutBudget = (function () {
  'use strict';
  const KEYS = ['prep','shoot','post','marketing','distribution','reserve'];
  const VARIANTS = {
    micro:   {name:'Micro-short', format:'short', minYear:1970, target:420, weeks:[1,1,1,1]},
    short:   {name:'Short film', format:'short', minYear:1970, target:1050, weeks:[2,1,3,3]},
    mid:     {name:'Mid-length film', format:'short', minYear:1970, target:4500, weeks:[3,2,4,4]},
    feature: {name:'Feature film', format:'feature', minYear:1970, target:25000, weeks:[6,4,6,8]},
    pilot:   {name:'TV pilot', format:'pilot', minYear:1970, target:24500, weeks:[3,2,3,2]},
    web:     {name:'Web episode', format:'pilot', minYear:1995, target:4000, weeks:[2,1,2,2]}
  };
  const SCOPE = {intimate:1, standard:2.6, ambitious:5.6};
  const LABELS = {prep:'Development & pre-production',shoot:'Filming',post:'Post-production',
    marketing:'Marketing',distribution:'Distribution',reserve:'Contingency'};
  const BASE = {prep:0.15,shoot:0.47,post:0.20,marketing:0.08,distribution:0.05,reserve:0.05};
  function bounded(n,min,max){return Math.min(max,Math.max(min,n));}
  function variant(id){return VARIANTS[id]||VARIANTS.short;}
  function media(id){return variant(id).format;}
  function stageWeeks(id){const w=variant(id).weeks;return {development:w[0],preproduction:w[1],shoot:w[2],post:w[3]};}
  function budgetClass(format,budget){
    const bands=format==='short'?[2000,6000,16000]:format==='pilot'?[30000,90000,240000]:[40000,120000,1000000];
    return budget<bands[0]?'Micro':budget<bands[1]?'Low':budget<bands[2]?'Mid':'High';
  }
  function recommended(total,vision,preset){
    const available=Math.max(0,Math.round(total)||0);
    const w=Object.assign({},BASE);
    if(vision==='prestige'){w.post+=0.04;w.marketing-=0.03;w.distribution-=0.01;}
    if(vision==='bold'){w.shoot+=0.05;w.prep+=0.01;w.marketing-=0.03;w.post-=0.03;}
    if(preset==='craft'){w.prep+=0.05;w.post+=0.08;w.marketing-=0.07;w.distribution-=0.04;w.reserve-=0.02;}
    if(preset==='audience'){w.marketing+=0.11;w.distribution+=0.07;w.shoot-=0.09;w.post-=0.06;w.prep-=0.03;}
    if(preset==='lean'){w.reserve+=0.08;w.marketing-=0.04;w.distribution-=0.03;w.post-=0.01;}
    const plan={};let remaining=available;
    for(const k of KEYS.slice(0,-1)){plan[k]=Math.round(available*Math.max(0,w[k]));remaining-=plan[k];}
    plan.reserve=Math.max(0,remaining);
    return plan;
  }
  function evaluate(opts){
    opts=opts||{};
    const kind=VARIANTS[opts.variant]?opts.variant:opts.format==='feature'?'feature':opts.format==='pilot'?'pilot':'short';
    const v=variant(kind), scope=SCOPE[opts.scope]?opts.scope:'intimate';
    const cap=Math.max(0,Math.round(Number(opts.cap)||0)),fees=Math.max(0,Math.round(Number(opts.fees)||0));
    const scriptFee=Math.max(0,Math.round(Number(opts.scriptFee)||0));
    const crew=Math.max(0,cap-fees-scriptFee);
    const plan=opts.plan&&typeof opts.plan==='object'?Object.fromEntries(KEYS.map(k=>[k,Math.round(Number(opts.plan[k])||0)])):recommended(crew,opts.vision,opts.preset);
    const allocated=KEYS.reduce((n,k)=>n+plan[k],0),unallocated=cap-fees-scriptFee-allocated;
    const target=v.target*SCOPE[scope];
    const need={prep:target*.15,shoot:target*.59,post:target*.26};
    const ratios=Object.fromEntries(['prep','shoot','post'].map(k=>[k,bounded(plan[k]/Math.max(1,need[k]),0,1.5)]));
    const weight={prep:0.25,shoot:0.50,post:0.25};
    const adequacy=Object.keys(ratios).reduce((a,k)=>a+weight[k]*Math.min(1,ratios[k]),0);
    const risks=[];
    if(unallocated<0)risks.push('Allocated costs exceed the spending limit.');
    if(cap<fees+scriptFee)risks.push('Hiring and screenplay fees exceed the cap.');
    for(const k of ['prep','shoot','post'])if(ratios[k]<0.60)risks.push(LABELS[k]+' is underfunded for '+scope+' scope.');
    const level=adequacy>=.92&&unallocated>=0?'Comfortable':adequacy>=.66&&unallocated>=0?'Lean but achievable':'Underfunded';
    const qualityEffect=Math.round(bounded((adequacy-.83)*18,-14,8));
    const delayWeeks=Math.min(5,Math.max(0,Math.round((.88-adequacy)*5)));
    return {kind,format:v.format,name:v.name,scope,cap,fees,scriptFee,plan,allocated,unallocated,
      contingency:plan.reserve,production:plan.prep+plan.shoot+plan.post,need,ratios,adequacy,
      level,risks,qualityEffect,delayWeeks,budgetClass:budgetClass(v.format,cap),
      plannedWeeks:Object.values(stageWeeks(kind)).reduce((a,b)=>a+b,0)};
  }
  function milestoneCost(plan,stage,spent,planned){
    const total=stage==='development'||stage==='preproduction'?'prep':stage;
    const limit=Math.max(0,Number(plan[total])||0), used=Math.max(0,Number(spent[total])||0);
    const left=Math.max(0,limit-used);
    const weeks=Math.max(1,Number(planned[total])||1);
    return Math.min(left,Math.ceil(limit/weeks));
  }
  return {KEYS,VARIANTS,SCOPE,LABELS,media,variant,stageWeeks,budgetClass,recommended,evaluate,milestoneCost};
})();
