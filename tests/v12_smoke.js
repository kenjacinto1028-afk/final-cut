// A-E build-level smoke checks only. Full automated suites are Batch F.
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('node:assert/strict');
const base = path.resolve(__dirname, '..');
const mem = new Map();
const storage = { getItem: k => mem.get(k) ?? null, setItem: (k,v) => mem.set(k,String(v)), removeItem: k => mem.delete(k) };
const ctx = { console, localStorage: storage, Math, JSON, Date };
vm.createContext(ctx);
for (const file of ['content.js','engine.js']) vm.runInContext(fs.readFileSync(path.join(base,file),'utf8'),ctx,{filename:file});
const E=ctx.Engine;
let passed=0;
function check(n,fn){fn();passed++;console.log('PASS',n)}
E.newGame({studioName:'V12 Local',founderName:'Test Founder',homeRegion:'europe'});
check('game loads with version 12 and region',()=>{assert.equal(E.state.version,12);assert.equal(E.state.studio.homeRegion,'europe')});
check('recognition labels and regions on talent',()=>{assert(E.talent().length>20);for(const t of E.talent()){assert(t.homeRegion);assert(t.career);assert(E.recognition(t).name);}});
check('independent skill and fame impacts',()=>{
 const veteran={skill:91,fame:7,role:'actor',homeRegion:'europe',affinity:['drama']},star={skill:24,fame:94,role:'actor',homeRegion:'europe',affinity:['drama']};
 const a=E.talentContribution(veteran,'lead','drama','europe'),b=E.talentContribution(star,'lead','drama','europe');
 assert(a.quality>b.quality);assert(b.hype>a.hype);assert.equal(E.recognition(star).name,'Global Star');
});
check('casting options have no fame or tier gating',()=>{
 const first=E.slotOptions('lead','short','drama','smalltown',10000);assert(first.length>4);assert(first.every(x=>x.id!=null));assert(first.every(x=>x.recognition));
});
let p;
check('start short film without paid cast',()=>{
 const r=E.startProject({title:'The Last Shift',format:'short',genre:'drama',topic:'smalltown',tier:0,cast:{director:'founder',writer:'founder'}});
 assert(r.ok,r.reason);p=r.project;
});
check('advance to completed release without crash',()=>{
 for(let i=0;i<120 && p.stage!=='done' && !E.state.gameOver;i++){
  while(E.state.pending)E.choose(E.state.pending.choices.length-1);
  E.nextTurn();
 }
 assert.equal(p.stage,'done');assert(p.qualityBreakdown);assert(p.hypeBreakdown);
 assert.equal(p.quality,p.qualityBreakdown.result);assert.equal(p.hype,p.hypeBreakdown.result);
});
check('historic film stores scoring attribution',()=>{
 const f=E.filmById('player:'+p.id);assert(f.qualityBreakdown);assert(f.hypeBreakdown);assert(f.review);
});
check('v11 save migrates without removing talent contracts or films',()=>{
 const st=E.state,existing=st.projects.length;st.version=11;st.talent.forEach(t=>{delete t.career;delete t.homeRegion});
 assert(E.save());assert(E.load().ok);assert.equal(E.state.version,12);assert.equal(E.state.projects.length,existing);
 assert(E.state.talent.every(t=>t.homeRegion&&t.career));
});
check('four new creative tradeoff dilemmas are present and valid',()=>{
 const ids=['dev_star_or_script','dev_new_voice','shoot_celebrity_press','shoot_performance_take'];
 for (const id of ids) {
   const decision=ctx.CONTENT.DECISIONS.find(x=>x.id===id);
   assert(decision, id+' not found');
   assert(decision.choices.length>=3,id+' lacks tradeoffs');
   assert(decision.choices.some(c=>c.effects.quality>0));
   assert(decision.choices.some(c=>c.effects.hype>0 || c.effects.costPct<0));
 }
});
check('fee responds separately to fame and craft',()=>{
 const t=E.talent().find(x=>x.role==='actor');assert(t);
 const base={...t, skill:50, fame:50};
 const lowCraft=E.talentFee({...base,skill:20},'feature');
 const highCraft=E.talentFee({...base,skill:90},'feature');
 const lowFame=E.talentFee({...base,fame:10},'feature');
 const highFame=E.talentFee({...base,fame:90},'feature');
 assert(highCraft>lowCraft);
 assert(highFame>lowFame);
});
console.log('TOTAL',passed,'v12 A-E smoke checks');
