// FinalCut v14: long-horizon stability and strategy reports. Test figures are
// synthetic game simulations, not real historical industry data.
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),
 A=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),data=fs.readFileSync(path.join(root,'content.js'),'utf8'),
 engine=fs.readFileSync(path.join(root,'engine.js'),'utf8');
function start(name){
 const db=new Map(),st={getItem:k=>db.get(k)||null,setItem:(k,v)=>db.set(k,String(v)),removeItem:k=>db.delete(k)};
 const c={console,Date,JSON,Math,localStorage:st};vm.createContext(c);vm.runInContext(data,c);vm.runInContext(engine,c);
 const E=c.Engine;E.newGame({studioName:name,founderName:'Creative Director',homeRegion:'northamerica'});
 return {E,db};
}
const strategies=[
 {name:'Indie / prestige',vision:'prestige',policy:'director',format:'short'},
 {name:'Commercial portfolio',vision:'mainstream',policy:'commercial',format:'feature'},
 {name:'Genre / hybrid',vision:'bold',policy:'ask',format:'feature'}
];
const results=[];
for(const [idx,spec] of strategies.entries()){
 const horizonYears=idx===0?61:15; // one full career, two additional styles
 const {E,db}=start('Long Career '+spec.name),s=E.state;
 // This is a stress test with a funded established studio, not an economic
 // viability verdict for starter cash. Early-game affordability has its own tests.
 s.cash=40_000_000;s.studio.tier=3;s.studio.fame=70;
 E.v14SetDelegation(spec.policy);
 A(E.setFastSimulationTesting(true),'Fast career QA must be Node-only');
 let started=0,dilemmas=0,profitable=0,flops=0,pressured=0,lastLaunchWeek=-1,attemptedLaunches=0;
 const rejected={};
 let attempts=0;
 while(s.week<52*horizonYears&&attempts++<52*horizonYears*4&&!s.gameOver){
   if(s.pending){
     if(s.pending.id?.startsWith('v14_issue_'))dilemmas++;
     E.choose(s.pending.choices.length-1);
     continue; // resolving a decision does not advance the week
   }
   const week=s.week;
   if(week%28===0&&lastLaunchWeek!==week&&E.activeProjects().length<E.capacity()){
     lastLaunchWeek=week;
     const fmt=idx===0?'short':week%3===0?'short':'feature';
     const title='Film '+idx+'-'+week,genre=idx===2?'horror':idx===1?'comedy':'drama';
     const topic=idx===2?'haunted':idx===1?'roadtrip':'smalltown';
     const opts={title,format:fmt,tier:0,genre,topic,
       vision:spec.vision,releasePosition:idx===0?'prestige':idx===1?'wide':'targeted',
       cast:{director:idx===0?'founder':'',writer:idx===0?'founder':'',lead:'',crew:''}};
     attemptedLaunches++;
     const r=E.startProject(opts);if(r.ok)started++;else rejected[r.reason||'unknown']=(rejected[r.reason||'unknown']||0)+1;
   }
   E.nextTurn();
 }
 const done=s.projects.filter(p=>p.stage==='done');
 profitable=done.filter(p=>p.revenue>p.spent).length;
 flops=done.filter(p=>p.format==='feature'&&p.result==='Flop').length;
 const share=done.length?Math.round(profitable/done.length*100):0;
 const kinds=Object.create(null);
 for(const p of done){const kind=E.v14FilmLegacy(p)?.kind||'none';kinds[kind]=(kinds[kind]||0)+1;}
 const history=s.v14.classChanges||[],role=E.v14Identity('you');
 const quality=done.reduce((n,p)=>n+(p.quality||0),0)/Math.max(1,done.length);
 const score=done.reduce((n,p)=>n+Math.max(0,Math.min(100,p.audience||0)),0)/Math.max(1,done.length);
 A(E.setFastSimulationTesting(false));
 A(E.save(),'Full normal final persistence must succeed');
 const stored=db.get('backlot_save')||'';
 const years=Math.floor(s.week/52);
 A(!s.gameOver,'funded multi-decade stress game ended prematurely');
 A(s.week>=52*horizonYears,'simulation ended before '+horizonYears+' years');
 console.log('CAREER DEBUG',JSON.stringify({studio:spec.name,years:horizonYears,week:s.week,attemptedLaunches,
    started,completed:done.length,active:E.activeProjects().length,rejected,cash:s.cash,fame:s.studio.fame}));
 A(done.length>=(horizonYears===61?75:20),
   'too few complete films; '+JSON.stringify({started,done:done.length,rejected}));
 A(s.version===13);
 A(Number.isFinite(s.cash)&&Number.isFinite(s.debt));
 A(s.v14.rivalry.length<=24);
 A(s.v14.classChanges.length<=12);
 A(Object.keys(s.v14.partnerships).length<=36);
 A(s.projects.every(p=>!p.dna||p.story.length<=14));
 A(E.load().ok,'save reload failed after full career');
 const r={studio:spec.name,years,started,completed:done.length,profitable,profitRate:share,flops,
   qualityAvg:+quality.toFixed(1),audienceAvg:+score.toFixed(1),classification:role.label,
   classChanges:history.length,rivalry:s.v14.rivalry.length,awards:done.reduce((n,p)=>n+
     (p.awards||[]).filter(a=>a.won).length,0),cash:Math.round(s.cash),
   saveBytes:stored.length,filmLegacies:kinds};
 results.push(r);console.log('PASS '+horizonYears+'-year stress',JSON.stringify(r));
}
const rates=results.map(x=>x.profitRate);
console.log('OBSERVED funded strategy outcomes (different horizons): '+results.map(x=>x.studio+' '+x.years+'y '+x.profitRate+'% profitable').join(' / '));
console.log('NOTE This is a funded stress sweep; no claim of equal profitability or fully balanced awards.');
console.log('PASS v14 full 1970–2031 career plus two 15-year alternative-studio stress runs');
