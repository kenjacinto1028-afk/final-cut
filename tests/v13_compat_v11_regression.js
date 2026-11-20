// v11 gameplay and format regression: node tests/v11_regression.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const store = new Map();
const localStorage = { getItem(k) { return store.get(k) ?? null; }, setItem(k,v) { store.set(k,String(v)); }, removeItem(k) { store.delete(k); } };
const ctx = { console, localStorage, Date, Math, JSON };
vm.createContext(ctx);
for (const f of ['content.js','engine.js','media.js']) vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});
const E=ctx.Engine,C=ctx.CONTENT, M=ctx.Media;
let count=0;
const check=(name,fn)=>{fn();count++;console.log('PASS',count,name)};
function start(type='short',title='Stage One') {
  const topic=C.TOPICS.find(t=>t.good.includes('drama'))?.id||C.TOPICS[0].id;
  const r=E.startProject({format:type,tier:0,title,genre:'drama',topic,cast:{director:'founder',writer:'founder'}});
  assert(r.ok,r.reason);return r.project;
}
function complete(p, limit=150){let n=0;while(p.stage!=='done'&&n++<limit&&!E.state.gameOver){while(E.state.pending) { const d=E.state.pending; E.choose(d.id==='regions'?d.choices.length-1:0); }E.nextTurn()}assert.equal(p.stage,'done')}
check('new save version and campaign scoping for custom posters',()=>{
  E.newGame({studioName:'Marquee',founderName:'Studio Founder',homeRegion:'europe'});
  assert.equal(E.state.version,13);assert(E.state.campaignId);assert(Array.isArray(E.state.annualReviews));
  assert.equal(E.homeRegion(),'europe');
});
check('short films can select and price their regional screening circuit before release',()=>{
  let p=start('short','Short International');let q=E.regionQuote(p,['europe','asiapacific','latinamerica']);
  assert(q.cost>0);assert(q.cost<p.budget/2);
  assert(E.setDistribution(p.id,['europe','asiapacific','latinamerica']).ok);
  assert.equal(p.regions.length,3);
  complete(p);
  assert(p.regions.length===3);assert.equal(p.gross,0);assert(p.distributionCost>0);assert(p.revenue>=0);
  assert(!E.setDistribution(p.id,['northamerica']).ok);
});
check('releases store audience, contextual reception, original poster selection',()=>{
  const p=E.state.projects[0];assert(p.audience>=1&&p.audience<=100);assert(p.review?.headline&&p.review?.text);
  assert(E.setPosterStyle(p.id,7).ok);assert.equal(p.posterStyleId,7);
  assert(!E.setPosterStyle(p.id,8).ok);
});
check('eight poster families have distinct deterministic SVG designs',()=>{
  const p=E.state.projects[0];const svg=[];
  for(let i=0;i<8;i++){p.posterStyleId=i;svg.push(M.posterSVG(p));}
  assert.equal(new Set(svg).size,8);assert(svg.every(s=>s.includes('<svg')));
  p.posterStyleId=2;assert.equal(svg[2],M.posterSVG(p));
  assert(M.portraitSVG);assert(M.filmStillSVG);
});
check('player saves store custom-poster references but no embedded images',()=>{
  const p=E.state.projects[0];p.posterCustom=true;
  assert(E.save());const s=store.get('backlot_save');
  assert(s.includes('"posterCustom":true'));assert(!s.includes('data:image/'));
  assert(E.load().ok);assert.equal(E.getProject(p.id).posterCustom,true);
});
check('sequel history includes original and numbered installments without skips',()=>{
  E.newGame({studioName:'Saga Studio',founderName:'Tester'});
  const s=E.state;s.studio.tier=1;s.studio.fame=55;s.cash=1500000;
  const original=start('feature','The First Movie');original.stage='done';original.result='Hit';original.releaseWeek=5;
  assert(E.sequelEligibility(original.id).ok);
  const sequel=E.startProject({format:'feature',tier:0,title:'The Second Movie',genre:'drama',topic:original.topic,cast:{director:'founder',writer:'founder'},sequelOf:original.id});
  assert(sequel.ok,sequel.reason);assert.equal(sequel.project.installment,2);
  assert.equal(original.installment,1);assert(original.franchiseId);
  assert(E.franchiseFilms(original.franchiseId).some(f=>f.projectId===original.id));
  sequel.project.stage='done';sequel.project.result='Hit';sequel.project.releaseWeek=10;
  const third=E.startProject({format:'feature',tier:0,title:'The Third Movie',genre:'drama',topic:original.topic,cast:{director:'founder',writer:'founder'},sequelOf:sequel.project.id});
  assert(third.ok,third.reason);assert.equal(third.project.installment,3);
});
check('year-end reviews are persistent and not duplicated',()=>{
  E.newGame({studioName:'Annual Studio',founderName:'Tester'});
  E.state.week=50;
  while(E.state.pending)E.choose(0);
  E.nextTurn();assert(E.state.annualReviews.some(x=>x.year===1970));
  assert(E.save());assert(E.load().ok);
  const y=E.state.annualReviews.length;
  E.state.week=50;E.nextTurn();assert.equal(E.state.annualReviews.length,y);
});
check('v10 save migrates with historical film state intact',()=>{
  E.newGame({studioName:'Older Studio',founderName:'Tester'});
  const p=start('short','Legacy Film');p.posterStyleId=3;
  E.save();const old=JSON.parse(store.get('backlot_save'));old.version=10;delete old.campaignId;delete old.annualReviews;delete old.projects[0].posterCustom;
  store.set('backlot_save',JSON.stringify(old));assert(E.load().ok);assert.equal(E.state.version,13);
  assert(E.state.campaignId);assert(Array.isArray(E.state.annualReviews));assert.equal(E.getProject(p.id).posterCustom,false);assert.equal(E.getProject(p.id).posterStyleId,3);
});
check('rival archived film reviews can be derived without save bloat',()=>{
  const f={title:'Rival Picture',genre:'drama',topic:C.TOPICS[0].id,critic:85,audience:60,quality:77};
  assert(E.receptionText(f).headline);assert(E.receptionText(f).text);
  assert(Array.isArray(E.filmHistory()));
});
console.log(`All ${count} v11 checks passed.`);
