// FinalCut v14 normal-start diagnostic. No injected cash, fame or tier.
'use strict';
const assert=require('node:assert/strict');
const {run}=require('../sim.js');
const strategies=['prestige','blockbuster','cheap','careful'];
const regions=[{name:'northamerica',seed:2401},{name:'europe',seed:2411}];
const results=[];
process.env.SAVE_VERIFY='1';
delete process.env.UNTIL;
for(const r of regions){
 process.env.SIM_REGION=r.name;
 for(const [idx,strategy] of strategies.entries()){
  const result=run(strategy,r.seed+idx,{});
  assert(Number.isFinite(result.cash),'Non-finite balance for '+strategy);
  assert(Number.isFinite(result.value),'Non-finite career score for '+strategy);
  assert(result.features>=0&&result.shorts>=0&&result.flops>=0,'Invalid film counts');
  assert(result.flops<=result.features,'Flop count exceeds features');
  assert(result.saveBytes>0&&result.archiveBytes>=0,'Invalid storage estimate');
  assert(result.activeRivals>=0,'Invalid rival count');
  const totalAwards=Object.values(result.ceremonyWinners||{}).reduce((n,v)=>n+v,0);
  const totalNoAward=Object.values(result.ceremonyUnawarded||{}).reduce((n,v)=>n+v,0);
  const profile={
   region:r.name,strategy,seed:r.seed+idx,finalYear:result.year,
   reason:result.reason,score:result.value,netCash:result.cash,
   features:result.features,shorts:result.shorts,flops:result.flops,
   flopRate:result.features?Math.round(100*result.flops/result.features):null,
   playerQuality:result.playerQualityAvg,rivalQuality:result.rivalQualityAvg,
   awardsWon:totalAwards,unawardedCategories:totalNoAward,
   rivalAwardWins:result.rivalAwardWins,activeRivals:result.activeRivals,
   fame:result.fame,prestige:result.prestige,currentBuzz:result.currentBuzz,
   currentPrestige:result.currentPrestige,lifetimeLegacy:result.lifetimeLegacy,
   saveBytes:result.saveBytes,packedSaveChars:result.packedSaveChars,
   encodedSaveChars:result.encodedSaveChars,encodedSaveUtf8Bytes:result.encodedSaveUtf8Bytes,
   saveRoundtrip:!!result.reloadedOkay,archiveCount:result.archiveCount
  };
  const flags=[];
  if(profile.features>=12&&profile.flopRate===0)flags.push('no-feature-flops');
  if(profile.features>=12&&profile.flopRate>65)flags.push('frequent-feature-flops');
  if(profile.playerQuality-profile.rivalQuality>15)flags.push('player-rival-quality-gap');
  if(profile.activeRivals<4)flags.push('rival-attrition');
  if(!profile.saveRoundtrip)flags.push(profile.encodedSaveChars>5*1024*1024?'save-over-5mib':'save-failed-within-5mib');
  if(profile.saveBytes>4000000)flags.push('large-save');
  profile.flags=flags;
  results.push(profile);
  console.log('V14_BALANCE_CASE '+JSON.stringify(profile));
 }
}
const summary={
 strategies:Object.fromEntries(strategies.map(strategy=>{
  const rows=results.filter(r=>r.strategy===strategy);
  const average=key=>Math.round(rows.reduce((sum,r)=>sum+(r[key]||0),0)/rows.length);
  return [strategy,{runs:rows.length,avgScore:average('score'),avgNetCash:average('netCash'),
   avgFeatures:average('features'),avgFlops:average('flops'),
   avgAwards:average('awardsWon'),avgRivalWins:average('rivalAwardWins'),
   allSaveRoundtrips:rows.every(r=>r.saveRoundtrip)}];
 })),
 regions:regions.map(r=>r.name),runs:results.length,
 warnings:results.flatMap(r=>r.flags.map(flag=>r.region+'/'+r.strategy+': '+flag))
};
console.log('V14_BALANCE_SUMMARY '+JSON.stringify(summary));
console.log('PASS v14 normal-start balance diagnostic ('+results.length+' careers): warnings are evidence for analysis, not automatic tuning approval.');
