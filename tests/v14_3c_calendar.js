// v14.3c: type-aware calendar, real collision warnings and conservative forecasts.
'use strict';
const A=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const memory=new Map();
const ctx={console,Date,Math,JSON,localStorage:{getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)}};
vm.createContext(ctx);
for(const f of ['content.js','engine.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),ctx,{filename:f});
const E=ctx.Engine;
E.newGame({studioName:'Test Calendar',founderName:'Producer'});
const r=E.startProject({title:'Seaside Short',format:'short',tier:0,genre:'drama',
 topic:'smalltown',cast:{director:'founder',writer:'founder'}});
A(r.ok,r.reason);
const p=r.project;
p.stage='post';p.stageWeeksLeft=2;
const pilot={...p,id:p.id+200,title:'Pilot Demo',format:'pilot',stage:'post',stageWeeksLeft:3};
E.state.projects.push(pilot);
const rival=E.activeRivals()[0];
rival.films.push({id:'qa-v143',stage:'planned',week:E.state.week+2,genre:'drama',topic:'smalltown',
 title:'Rival Film',format:'feature',budget:250000});
let c=E.v14ReleaseCalendar();
A.equal(c.length,12);
let mine=c.flatMap(w=>w.mine);
A(mine.some(f=>f.id===p.id&&f.format==='short'&&f.estimate));
A(mine.some(f=>f.id===pilot.id&&f.format==='pilot'&&f.estimate));
const contested=c.find(w=>w.week===E.state.week+2).rivals.find(f=>f.title==='Rival Film');
A(contested);
A.equal(contested.format,'feature');
A(contested.genreMatches.includes('Seaside Short'));
A(contested.topicMatches.includes('Seaside Short'));
A(contested.sameWeek.includes('Seaside Short'));
p.stage='release';p.releaseWeek=E.state.week-1;
c=E.v14ReleaseCalendar();
A(c[0].mine.some(f=>f.id===p.id&&f.status==='screening now'));
A.equal(E.state.version,13);
console.log('PASS v14.3c calendar shows shorts/TV forecasts, truthful rival features and same genre/topic competition');
