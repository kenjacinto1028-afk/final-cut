// FinalCut v14.12: real rival eligibility, attainable award floors and financial recap.
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),A=require('node:assert/strict');
const c={console,Date,JSON,Math,localStorage:{getItem(){return null;},setItem(){},removeItem(){}}};
vm.createContext(c);
for(const name of ['content.js','engine.js'])vm.runInContext(fs.readFileSync(path.resolve(__dirname,'..',name),'utf8'),c,{filename:name});
const E=c.Engine,T=E.TUNING.awards;
A(T.goldenWinMin<T.goldenWinMin+30&&T.goldenWinMin>=T.minScore,'Winning must retain a merit floor');
A(T.goldenWinMin<=85,'Best Picture cannot require an unattainable score in early years');
E.newGame({studioName:'Annual QA',homeRegion:'northamerica'});
E.state.cash=100_000_000;
E.setFastSimulationTesting(true);
let iterations=0;
while(E.state.week<156&&iterations++<2000&&!E.state.gameOver){
  if(E.state.pending){E.choose(0);continue;}
  E.nextTurn();
}
A(E.state.week>=156,'Test did not reach three complete industry years');
const recs=E.state.awards.history.filter(x=>x.year>=1971&&x.year<=1973);
const nominated=recs.flatMap(x=>x.cats||[]).filter(x=>(x.nominees||[]).length>=2);
const awarded=nominated.filter(cat=>cat.nominees.some(n=>n.winner));
const rivals=E.state.filmArchive.rivals.filter(f=>f.releaseWeek!=null);
console.log('AWARDS YEAR AUDIT',JSON.stringify({year:E.dateOf().year,rivalFilms:rivals.length,ceremonies:recs.length,eligibleCategories:nominated.length,awarded:awarded.length}));
A(rivals.length>0,'Rival release archive must be populated');
A(nominated.length>0,'At least one category should have eligible nominees over the first three years');
A(awarded.length>0,'The industry must recognize at least some qualifying films over three years');
const snap=E.state.annualReviews[0];
A(snap&&Object.hasOwn(snap,'topGrossId'),'Year-end history records its highest earning film');
A(E.setFastSimulationTesting(false));
console.log('PASS v14.12 early-industry awards, recorded year-end summary and saved market competitors');
