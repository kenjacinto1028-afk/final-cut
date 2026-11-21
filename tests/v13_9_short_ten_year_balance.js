// Ten-year balance sweep for two independent FinalCut short-film worlds.
'use strict';
const A=require('node:assert/strict'),FS=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
function world(seed){
  const storage=new Map();
  const context={console,Date,JSON,Math,localStorage:{getItem:k=>storage.get(k)||null,
    setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)}};
  vm.createContext(context);
  for(const p of ['content.js','engine.js'])vm.runInContext(FS.readFileSync(path.join(root,p),'utf8'),context,{filename:p});
  const E=context.Engine;
  E.newGame({studioName:'Festival World '+seed,founderName:'Creator '+seed,homeRegion:'northamerica'});
  const state=E.state;state.cash=2000000;state.studio.tier=2;state.studio.fame=40;
  let produced=0,attempts=0;
  for(let week=0;week<520;week++){
    if(week%14===0 && week<500){
      attempts++;
      const r=E.startProject({title:'Short '+seed+'-'+week,format:'short',genre:'drama',
        topic:'smalltown',tier:week%3,cast:{director:'founder',writer:'founder'}});
      if(r.ok)produced++;
    }
    if(state.pending)E.choose(state.pending.choices.length-1);
    E.nextTurn();
    if(state.gameOver)break;
  }
  // Complete any short in final stages; never subsidize failing films.
  for(let week=0;week<18&&!state.gameOver;week++){
    if(state.pending)E.choose(state.pending.choices.length-1);
    E.nextTurn();
  }
  const done=state.projects.filter(p=>p.format==='short'&&p.stage==='done');
  A(done.length>=12,'World '+seed+' released too few shorts: '+done.length);
  for(const p of done){
    A.equal(p.shortRunCollected,p.shortRunTarget,'Mismatch for '+p.title);
    A.equal(p.revenue,p.shortRunTarget,'Unexpected new income for '+p.title);
    A(p.shortRunWeeks>=3&&p.shortRunWeeks<=12);
    A.equal(p.shortRunWeeks,p.weeksInRelease);
    A(E.shortAudience(p)>0);
  }
  const receipts=done.reduce((sum,p)=>sum+p.revenue,0),targets=done.reduce((sum,p)=>sum+p.shortRunTarget,0);
  A.equal(receipts,targets,'New weekly model must preserve original short-film target receipts.');
  A(state.week>=520,'Simulation ended before ten years');
  A.equal(state.version,13);
  A(E.load().ok,'Save reload failed after ten seasons');
  return {world:seed,attempts,produced,released:done.length,years:Math.floor(state.week/52),
    receipts,target:targets,cash:Math.round(state.cash),
    minRun:Math.min(...done.map(x=>x.shortRunWeeks)),
    maxRun:Math.max(...done.map(x=>x.shortRunWeeks))};
}
const results=[world('A'),world('B')];
results.forEach(r=>console.log('PASS multi-year short economy',JSON.stringify(r)));
console.log('PASS two independent ten-year runs, no duplicated short revenue or save-format changes');
