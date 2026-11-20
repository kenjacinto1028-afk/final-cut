// Final Cut v10 integration regression; run: node tests/v10_regression.js
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'..'), store=new Map();
const storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const ctx={console,Math,Date,JSON,localStorage:storage};vm.createContext(ctx);
for(const file of ['content.js','engine.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
const E=ctx.Engine,C=ctx.CONTENT;let n=0;
function check(label,fn){fn();console.log('PASS '+(++n)+'. '+label)}
function tick(count){for(let i=0;i<count&&!E.state.gameOver;i++){while(E.state.pending)E.choose(0);E.nextTurn()}}
check('5 regions and selected home at new game',()=>{
 assert.equal(C.REGIONS.length,5);E.newGame({studioName:'World Studio',founderName:'Tester',homeRegion:'asiapacific'});
 assert.equal(E.state.studio.homeRegion,'asiapacific');assert.equal(E.homeRegion(),'asiapacific');
});
check('Six starting rivals are indie/mid and 15 maximum',()=>{
 assert.equal(E.activeRivals().length,6);assert(E.activeRivals().every(r=>r.tier===1||r.tier===2));assert.equal(E.TUNING.rivals.maxCount,15);
 assert(new Set(E.activeRivals().map(r=>r.name)).size===6);assert(C.RIVAL_NAMES.length>=48);
});
check('Festival growth is capped at 2 specialists per decade',()=>{
 assert.equal(C.AWARDS.circuit.length,16);
 for(const y of [1970,1980,1990,2000,2010,2020])assert.equal(C.AWARDS.circuit.filter(f=>f.startYear<=y).length,6+2*Math.max(0,(y-1970)/10));
 assert(C.AWARDS.circuit.every(f=>f.week>=1&&f.week<=52&&f.formats));
});
check('Four annual ceremonies roll out over decades',()=>{
 assert.equal(C.AWARDS.ceremonies.length,4);
 assert.deepEqual(Array.from(C.AWARDS.ceremonies,c=>c.startYear),[1970,1980,1990,2000]);
});
check('Budgeted region expansions are optional, validated and home is always included',()=>{
 const p={budget:60000,genre:'drama'};
 const home=E.regionQuote(p,['asiapacific']);const full=E.regionQuote(p,C.REGIONS.map(r=>r.id));
 assert.equal(home.cost,0);assert(full.cost>0);assert(full.openingMult>1);
 assert.equal(full.regions.length,5);assert.equal(E.regionQuote(p,['unknown','europe','europe']).regions.length,2);
});
check('Starting player film has canonical history and immutable credits',()=>{
 const p=E.startProject({format:'short',tier:0,title:'First Vision',genre:'drama',topic:C.TOPICS.find(t=>t.good.includes('drama')).id,cast:{director:'founder',writer:'founder'}});
 assert(p.ok,p.reason);tick(50);
 const f=E.filmById('player:'+p.project.id);
 assert(f&&f.title==='First Vision');assert.equal(f.credits.director,'Tester');assert.equal(f.format,'short');
 assert(f.festResults.every(x=>x.festival));
});
check('AI films persist with named cast and a stable historic ID',()=>{
 const oldCount=E.state.filmArchive.rivals.length;tick(50);
 const films=E.state.filmArchive.rivals;
 assert(films.length>oldCount,'Expected film archive to grow');
 assert(films.every(x=>x.id.startsWith('rival:')));
 assert(films.some(x=>x.credits.director&&x.credits.lead));
 const before=films.map(x=>x.id);tick(60);
 assert(before.every(id=>E.filmById(id)),'Archive dropped a previously recorded movie');
});
check('International release finances reconcile to territory gross',()=>{
 const s=E.state;s.studio.tier=1;s.studio.fame=40;s.cash=800000;
 const topic=C.TOPICS.find(x=>x.good.includes('drama')).id;
 const r=E.startProject({format:'feature',tier:0,title:'International Feature',genre:'drama',topic,cast:{director:'founder',writer:'founder'}});
 assert(r.ok,r.reason);
 const p=r.project;
 assert(E.setDistribution(p.id,['asiapacific','northamerica','europe']).ok);
 assert.equal(p.regions.length,3);
 let guard=0;
 while(p.stage!=='done'&&guard++<150&&!s.gameOver){while(s.pending){const d=s.pending;if(d.id==='regions')E.choose(d.choices.length-1);else E.choose(0)}E.nextTurn()}
 assert.equal(p.stage,'done');assert(p.distributionCost>0);
 assert(p.gross>0);assert.equal(Object.values(p.regionalGross).reduce((a,b)=>a+b,0),p.gross);
 assert(p.regionalRevenue&&Object.keys(p.regionalRevenue).length===3);
 const f=E.filmById('player:'+p.id);assert.equal(f.gross,p.gross);assert.equal(f.regions.length,3);
 assert(!E.setDistribution(p.id,['europe']).ok);
});
check('World and studio rankings use the same records and stable IDs',()=>{
 const all=E.filmRankings({format:'feature'}),mine=E.filmRankings({format:'feature',mine:true});
 assert(all.length>=mine.length&&all.some(x=>x.rivalId!=null));assert(mine.length>0);
 assert(mine.every(x=>x.projectId!=null));
 assert(mine.every((x,i)=>x.studioRank===i+1));
 assert(mine.every(x=>all.some(y=>x.id===y.id&&x.worldRank===y.worldRank)));
 const byTopic=E.filmRankings({format:'feature',topic:mine[0].topic});assert(byTopic.every(f=>f.topic===mine[0].topic));
});
check('Every major historical record is kept without reroll on save/load',()=>{
 const before=E.filmHistory(),sample=before[0];assert(E.save());
 const saveText=store.get('backlot_save');assert(saveText.length<5e6,`Save already too large: ${saveText.length}`);
 assert(E.load().ok);assert.equal(E.filmById(sample.id).title,sample.title);
 assert.equal(E.filmHistory().length,before.length);
});
check('v9 game migrates region, judged history and incomplete archives honestly',()=>{
 const s=JSON.parse(store.get('backlot_save'));s.version=9;delete s.studio.homeRegion;delete s.filmArchive;
 delete s.awards.judged;store.set('backlot_save',JSON.stringify(s));
 assert(E.load().ok);assert.equal(E.state.version,10);assert.equal(E.homeRegion(),'northamerica');
 assert(E.state.filmArchive.incompleteBefore!=null);assert(E.state.awards.judged);
});
check('Annual ceremonies eventually judge without duplicate rerolls',()=>{
 E.newGame({studioName:'Award test',founderName:'Nominee'});
 E.state.week=52*30+36; // Year 2000 week 38 is Audience Spotlight
 while(E.state.pending)E.choose(0);
 E.nextTurn();
 assert(E.state.awards.judged['2000:audience']);
 const count=Object.keys(E.state.awards.judged).length;
 E.save();assert(E.load().ok);
 assert.equal(Object.keys(E.state.awards.judged).length,count);
});
console.log('All '+n+' v10 checks passed.');
