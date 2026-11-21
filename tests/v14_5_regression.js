// v14.5: scripted premiere persistence, screenplay readiness and grounded market rankings.
'use strict';
const A=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const memory=new Map(),ctx={console,Date,Math,JSON,
  localStorage:{getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)}};
vm.createContext(ctx);
for(const file of ['content.js','engine.js'])
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx,{filename:file});
const E=ctx.Engine;
E.newGame({studioName:'Premiere Proof',founderName:'Director'});
A.equal(E.state.premierePresented.length,0);
const pitch=E.v14MarketInfo().pitches.find(p=>p.lane==='prestige');
A(pitch&&pitch.fee>0,'the paid screenplay should have an actual rights fee');
const opts={title:pitch.title,format:pitch.format,tier:0,pitchId:pitch.id,
  genre:pitch.genre,topic:pitch.topic,vision:pitch.vision,pitchApproach:'standard',
  cast:{director:'founder',writer:'founder'}};
const r=E.startProject(opts);A(r.ok,r.reason);
const p=r.project;
A(p.scriptFee>0,'paid script must charge rights');
A.equal(p.dna.origin,'marketplace');
let turns=0;
while(p.releaseWeek==null&&turns++<90){
  if(E.state.pending)E.choose(E.state.pending.choices.length-1);
  else E.nextTurn();
}
A(p.releaseWeek!=null,'short film premiered');
A.equal(p.qualityBreakdown.scriptReadiness,2);
A.equal(p.pressReviews.length>0,true);
A.deepEqual(Array.from(E.state.premierePresented),[],'report must remain available until dismissed');
E.state.premierePresented.push(p.id);
A(E.save());
A(E.load().ok);
A.equal(E.state.premierePresented.includes(p.id),true);
delete E.state.premierePresented;A(E.save());A(E.load().ok);
A.equal(E.state.premierePresented.includes(p.id),true,'migration must not replay old releases');
const originals=E.startProject({title:'Original Study',format:'short',tier:0,
  genre:pitch.genre,topic:pitch.topic,vision:pitch.vision,
  cast:{director:'founder',writer:'founder'}});
A(originals.ok,originals.reason);
A.equal(originals.project.scriptFee||0,0);
A.equal(originals.project.dna.origin,'original');
// Historical gross charts use actual market receipts rather than worldwide gross.
const base={format:'feature',genre:'drama',topic:'smalltown',year:E.dateOf().year,releaseWeek:0,
  stage:'done',quality:70,critic:72,audience:75,budget:40000,awards:[],festResults:[],
  regions:['northamerica','europe']};
E.state.filmArchive.rivals=[
  {...base,id:'rival:a',title:'Big at Home',studio:'Studio A',gross:900000,
    regionalGross:{europe:200,northamerica:899800}},
  {...base,id:'rival:b',title:'Big in Europe',studio:'Studio B',gross:500000,
    regionalGross:{europe:70000,northamerica:430000}}
];
const world=E.filmRankings({format:'feature',criterion:'gross'});
const europe=E.filmRankings({format:'feature',criterion:'gross',region:'europe'});
A.equal(world[0].id,'rival:a');
A.equal(europe[0].id,'rival:b');
A.equal(E.filmRankings({format:'feature',criterion:'audience',period:'year'}).length,2);
A.equal(E.filmRankings({format:'feature',criterion:'gross',reach:'worldwide'}).length,0);
A.equal(E.filmRankings({format:'feature',criterion:'gross',reach:'international'}).length,2);
A.equal(E.state.version,13,'save schema remains 13');
console.log('PASS v14.5 premiere persistence and migration, paid script readiness, original control and market-accurate chart rankings');
