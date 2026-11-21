'use strict';
// v14.6 — title variety, fan persistence, loyal retention, and bounded sequel benefits.
const A=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const memory=new Map();
const ctx={console,Date,Math,JSON,localStorage:{
  getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,String(v)),
  removeItem:k=>memory.delete(k)
}};
vm.createContext(ctx);
for(const file of ['content.js','engine.js'])
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx,{filename:file});
const E=ctx.Engine;
E.newGame({studioName:'Followers QA',founderName:'Studio Founder'});
A.equal(E.state.endRunPresented.length,0);
const names=new Set(Array.from({length:250},()=>E.randomTitle('drama')));
A(names.size>=185,'movie titles should produce substantial variety');
A.equal(E.state.version,13,'save version must remain compatible');
const p={
  id:777,stage:'done',title:'An Enduring Film',format:'short',genre:'drama',topic:'smalltown',
  releaseWeek:0,quality:94,audience:90,estimatedScreeningViewers:150000,
  cast:{director:'founder',writer:'founder'},budget:10000,spent:10000,revenue:30000,
  awards:[],festResults:[]
};
E.state.projects.push(p);
const atLaunch=E.filmFollowing(p);
A(atLaunch.active>0 && atLaunch.loyal>0,'release must create a following');
E.state.week=260;
const fiveYears=E.filmFollowing(p);
A(fiveYears.active<atLaunch.active,'followers should decline over time');
A(fiveYears.loyal>0,'high-quality film retains loyal fans after years');
A(fiveYears.loyal>atLaunch.loyal*.5,'enduring quality must preserve a meaningful core');
const studio=E.studioFollowing();
A(studio.active>0 && studio.loyal>0,'studio inherits bounded cross-film awareness');
const sequel=E.sequelContinuity(p,{director:'founder',writer:'founder'},[]);
A(sequel.returningFans===fiveYears.loyal,'sequel should use current loyal following');
A(sequel.audienceLift>=0&&sequel.audienceLift<=6,'fan boost must be bounded');
const released=E.filmHistory().find(f=>f.projectId===p.id);
A(released&&released.following.loyal===fiveYears.loyal,'Filmography should expose following');
E.save();
A(E.load().ok,'new follower model does not break save/load');
delete E.state.endRunPresented;
E.save();A(E.load().ok);
A(E.state.endRunPresented.includes(p.id),'old saves must not replay completed releases');
console.log('PASS v14.6 title variety, loyal retention, sequel cap, studio followers and save migration');
