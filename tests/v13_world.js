const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path');
const dir=path.resolve(__dirname,'..'),ctx={console,Date,JSON,Math};vm.createContext(ctx);
for(const f of ['content.js','engine.js'])vm.runInContext(fs.readFileSync(path.join(dir,f),'utf8'),ctx,{filename:f});
const E=ctx.Engine; E.newGame({studioName:'Test Pictures'});const s=E.state;
assert.equal(E.activeRivals().length,6);assert.equal(E.worldYearbook().yearbook.length,0);
s.projects.push({id:999,title:'Strong Independent',format:'feature',releaseWeek:22,quality:95,critic:91,gross:700000,budget:350000,stage:'done',regions:['northamerica','europe'],awards:[],festResults:[]});
s.filmArchive.rivals.push({id:'rival:1:999',rivalId:1,studio:E.activeRivals()[0].name,format:'feature',releaseWeek:22,quality:80,critic:82,gross:900000,budget:350000,stage:'done',regions:['europe'],awards:[],festResults:[]});
s.week=51; E.nextTurn();
const rows=E.worldStandings(1,'critics',1970);assert(rows.length>=2);
// Rivals can legitimately win a randomized year's critics leaderboard. Check
// ordering, unique studio entries, and that the yearbook records the actual winner.
assert(rows.some(r=>r.id==='you'));
assert.equal(new Set(rows.map(r=>r.id)).size,rows.length);
assert(rows.every((r,i)=>r.rank===i+1 && (i===0 || rows[i-1].critics>=r.critics)));
assert.equal(E.worldYearbook().yearbook[0].year,1970);
assert.equal(E.worldYearbook().yearbook[0].critics,rows[0].name);
assert(E.activeRivals().filter(r=>r.industryLeader).length>=2);
assert(E.rivalInfo(E.activeRivals()[0].id).identity);
console.log('PASS v13 annual studio rankings, rotating industry leaders and yearbook');
