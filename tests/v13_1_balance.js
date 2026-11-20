const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),ctx={console,Math,Date,JSON};vm.createContext(ctx);
for(const f of ['content.js','engine.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});
const E=ctx.Engine;E.newGame({studioName:'Balance Test'});const s=E.state;
const A=E.TUNING.awards;
assert(A.festivalMaxStudioWinsPerYear<=2 && A.goldenMaxWinsPerStudio<=1);
assert(A.festivalWinFloorBonus>0 && A.indieWinMin<A.goldenWinMin);
assert(E.TUNING.reputation.buzzWeeklyDecay<0.98);
// Critically strong, profitable independent hits contribute a bounded legacy bonus.
const add=(id,budget,critic)=>s.projects.push({id,format:'feature',stage:'done',result:'Hit',budget,critic,releaseWeek:1,awards:[],festResults:[]});
add(101,350000,80);const regular=E.scoreInfo().parts.hits;
add(102,120000,59);assert.equal(E.scoreInfo().parts.hits,regular+Math.round((8*Math.sqrt(2)-8)*10)/10);
const before=E.scoreInfo().parts.hits;
add(103,120000,85);
assert(E.scoreInfo().parts.hits>before);
const withIndie=E.scoreInfo().parts.hits;
const c=E.scoreInfo().counts;assert.equal(c.indieHits,1);assert(withIndie-regular<=E.TUNING.score.indieHitMax+10);
// No auto-first rule in the world rankings: results are based on actual scores.
const rows=E.worldStandings(1,'critics',1970);assert(rows.length>=1);
assert(rows.every((x,i)=>x.rank===i+1));
console.log('PASS v13.1 award scarcity, small-film legacy bonus and dynamic rankings');
