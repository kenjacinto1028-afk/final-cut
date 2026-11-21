// v14.1 cross-region standard-start balance and long-save regression.
'use strict';
const assert=require('node:assert/strict'),{run}=require('../sim.js');
const regions=['northamerica','europe','asiapacific'];
const strategies=['prestige','blockbuster','cheap','careful'];
const rows=[];
process.env.SAVE_VERIFY='1';
for(const [ri,region] of regions.entries()){
 process.env.SIM_REGION=region;
 for(const [si,strategy] of strategies.entries()){
  const x=run(strategy,2401+ri*10+si,{});
  assert(Number.isFinite(x.value)&&Number.isFinite(x.cash),strategy+' non-finite score/cash');
  assert(x.features>=100,strategy+' did not create a meaningful full-career sample');
  assert(x.savedOkay&&x.reloadedOkay,strategy+' long campaign must fit 5 MiB and reload');
  assert(x.activeRivals>=5,region+' competitors disappeared');
  const wins=Object.values(x.ceremonyWinners||{}).reduce((a,b)=>a+b,0);
  const row={region,strategy,score:x.value,netCash:x.cash,features:x.features,flops:x.flops,
    playerQuality:x.playerQualityAvg,rivalQuality:x.rivalQualityAvg,majorWins:wins,
    rivalAwards:x.rivalAwardWins,saveChars:x.packedSaveChars,activeRivals:x.activeRivals};
  rows.push(row);
  console.log('V14_1_CASE '+JSON.stringify(row));
 }
}
const average=(key,arr)=>Math.round(arr.reduce((sum,r)=>sum+r[key],0)/arr.length);
const summary=Object.fromEntries(strategies.map(strategy=>{
 const a=rows.filter(x=>x.strategy===strategy);
 return [strategy,{n:a.length,averageCash:average('netCash',a),averageFlops:average('flops',a),
  averageScore:average('score',a),averageAwards:average('majorWins',a),
  averagePlayerQuality:average('playerQuality',a),averageRivalQuality:average('rivalQuality',a)}];
}));
console.log('V14_1_SUMMARY '+JSON.stringify(summary));
console.log('PASS v14.1 twelve 61-year standard-start worlds, save compatibility and rival survival');
