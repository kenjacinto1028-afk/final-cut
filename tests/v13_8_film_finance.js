// FinalCut v13.8 film economy / transparency regression.
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),storage=new Map();
const ctx={console,Date,JSON,Math,
 localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)}};
vm.createContext(ctx);
for(const p of ['content.js','engine.js'])vm.runInContext(fs.readFileSync(path.join(root,p),'utf8'),ctx,{filename:p});
const E=ctx.Engine;
const next=()=>{if(E.state.pending)E.choose(E.state.pending.choices.length-1);return E.nextTurn();};
function until(fn,limit=90){let i=0;while(!fn()&&i++<limit&&!E.state.gameOver)next();assert(fn(),'Sim did not reach expected state after '+i+' weeks');return i;}
function make(format,name,tier){const r=E.startProject({format,title:name,genre:'drama',topic:'smalltown',tier,
 cast:{director:'founder',writer:'founder'}});assert(r.ok,r.reason);return r.project;}
E.newGame({studioName:'Film QA Workshop',founderName:'Maker',homeRegion:'northamerica'});
const short=make('short','Quiet Small Story',0);
until(()=>short.stage==='done',60);
assert.equal(short.gross,0,'shorts do not sell feature film box-office tickets');
assert(short.revenue>0,'short screening revenue must exist');
const ps=E.projectPulse(short);
assert(ps.history.length>0&&ps.history.some(w=>w.revenue>0),'actual screening income is tracked in weekly ledger');
const sf=E.filmHistory().find(f=>f.projectId===short.id);
assert.equal(sf.profit,short.revenue-short.spent);
assert.equal(sf.gross,0);assert.equal(sf.revenue,short.revenue);
assert.equal(sf.estimatedAdmissions,null,'do not invent film festival attendance');
console.log('PASS shorts: zero box office but earned studio receipts and net P/L');

E.state.studio.tier=3;E.state.studio.fame=85;E.state.cash=5000000;
const film=make('feature','The Studio Reckoning',1);
until(()=>film.stage==='release',80);
until(()=>film.weeksInRelease===1,5);
assert(film.gross>0);
const before=film.gross, q=E.releasePushQuote(film.id);
assert(q.ok, q.reason);
const cash=E.state.cash,spent=film.spent;
assert(E.pushRelease(film.id).ok);
assert.equal(cash-E.state.cash,q.cost);assert.equal(film.spent-spent,q.cost);
assert(!E.releasePushQuote(film.id).ok,'cannot repeat post-opening promotion');
assert(!E.pushRelease(film.id).ok,'repeat cannot deduct money');
until(()=>film.stage==='done',30);
assert(film.weeksInRelease<=E.TUNING.maxReleaseWeeks);
assert(film.gross>before);
assert(film.estimatedAdmissions>0);
const last=E.projectPulse(film);
assert(last.history.length<=32,'track max 32 weekly samples per film');
assert(last.history.some(w=>w.gross>0&&w.admissions>0));
const record=E.filmHistory().find(f=>f.projectId===film.id);
assert.equal(record.profit,film.revenue-film.spent);
assert.equal(record.estimatedAdmissions,film.estimatedAdmissions);
assert.equal(record.revenue,film.revenue);
const actual=film.gross,recorded=film.estimatedAdmissions;
assert(Math.abs(recorded-actual/E.estimatedTicketPrice(film.releaseWeek))<actual*.15,
  'estimated admissions must match disclosed ticket-price assumptions');
const preRights=film.revenue;
for(let i=0;i<20;i++)next();
assert(film.revenue>=preRights,'future rights payments accrue to the same project');
assert.equal(E.filmHistory().find(f=>f.projectId===film.id).profit,film.revenue-film.spent);
assert(E.projectPulse(film).history.length<=32);
console.log('PASS feature: booked box office, modeled tickets, bounded publicity, weekly ledger and rights');

// An old v13 campaign with no performance fields can still load. No prior
// moviegoers or week-by-week figures are invented as historical records.
const origRaw=storage.get('backlot_save');
assert(origRaw&&origRaw[0]==='{','fixture should use plain JSON');
const save=JSON.parse(origRaw),legacy=save.projects.find(p=>p.id===film.id);
delete legacy.estimatedAdmissions;delete legacy.performanceHistory;
storage.set('backlot_save',JSON.stringify(save));
assert(E.load().ok);
const oldFilm=E.getProject(film.id);
assert.equal(oldFilm.gross,actual);
assert(E.filmAdmissions(oldFilm)>0);
assert.equal(E.projectPulse(oldFilm).history.length,0);
assert(E.projectPulse(oldFilm).legacy);
console.log('PASS older v13 save: historic totals preserved, no manufactured weekly history');

// Every project type is eligible for direct revenue/profit reporting.
const pilot=make('pilot','A Network Special',0);
until(()=>pilot.stage==='done',40);
const pf=E.filmHistory().find(f=>f.projectId===pilot.id);
assert(pf);
assert.equal(pf.gross,0);
assert.equal(pf.profit,pilot.revenue-pilot.spent);
console.log('PASS pilot: network receipts separate from theatrical box office');
console.log('PASS v13.8 full film financial regression; save schema '+E.state.version);
