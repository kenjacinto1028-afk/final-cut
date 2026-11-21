'use strict';
// v14.8 market trends must come from real history, not fabricated deltas.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const saved=new Map(),ctx={console,Date,Math,JSON,localStorage:{
 getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,String(v)),removeItem:k=>saved.delete(k)
}};
vm.createContext(ctx);
for(const file of ['content.js','engine.js'])
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx,{filename:file});
const Engine=ctx.Engine;
Engine.newGame({studioName:'v14.8 Trends QA',founderName:'Tester'});
assert.equal(Engine.state.version,13,'preserve current save format');
assert.equal(Engine.state.market.demandHistory.length,1);
assert.equal(Engine.demandMovers('genres').valid,false);
assert.equal(Engine.demandMovers('topics').valid,false);
let attempts=0;
while(Engine.state.week<9 && attempts++<200){
 if(Engine.state.pending) Engine.choose(Engine.state.pending.choices.length-1);
 else Engine.nextTurn();
}
assert(Engine.state.week>=9,'market history should survive game progression');
const genre=Engine.demandMovers('genres'),topics=Engine.demandMovers('topics');
assert(genre.valid && topics.valid,'trend requires eight completed in-game weeks');
assert(genre.risers.length<=3&&genre.fallers.length<=3);
assert(topics.risers.length<=3&&topics.fallers.length<=3);
assert(genre.risers.every(x=>x.delta>0)&&genre.fallers.every(x=>x.delta<0));
assert(topics.risers.every(x=>x.delta>0)&&topics.fallers.every(x=>x.delta<0));
const before=JSON.stringify(Engine.state.market);
Engine.demandMovers('topics');Engine.demandMovers('genres');
assert.equal(JSON.stringify(Engine.state.market),before,'read-only dashboard must not change market');
Engine.save();
assert(Engine.load().ok,'market history survives save/load');
assert(Engine.demandMovers('genres').valid,'history still valid after load');
delete Engine.state.market.demandHistory;
Engine.save();assert(Engine.load().ok,'older saves without trend snapshots load');
assert.equal(Engine.demandMovers('genres').valid,false,'old save must not fabricate history');
assert.equal(Engine.state.market.demandHistory.length,1,'old save gets truthful baseline');
console.log('PASS v14.8 genuine genre/topic history, non-mutating UI read, save/legacy compatibility');
