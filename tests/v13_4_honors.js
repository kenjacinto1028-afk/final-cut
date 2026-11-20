// v13.4 week-52 recap integration: simulation unchanged; UI state persists.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const mem=new Map(),localStorage={getItem:k=>mem.get(k)??null,setItem:(k,v)=>mem.set(k,String(v)),removeItem:k=>mem.delete(k)};
const ctx={console,Math,Date,JSON,localStorage};vm.createContext(ctx);
for(const f of ['content.js','engine.js'])vm.runInContext(fs.readFileSync(path.resolve(__dirname,'..',f),'utf8'),ctx,{filename:f});
const E=ctx.Engine;
E.newGame({studioName:'Recap House'});
assert.equal(E.state.yearEndPresented.length,0);
E.state.week=50;E.state.events.nextWeek=9999;
const start=E.state.cash;
const n=E.advance();
assert.equal(n,1,'Advance should stop at the final week of the year');
assert.equal(E.dateOf().year,1970);assert.equal(E.dateOf().week,52);
assert.equal(E.state.annualReviews.length,1);
const cash=E.state.cash,score=E.scoreInfo().value,history=E.state.awards.history.length;
E.state.yearEndPresented.push(1970);E.save();assert(E.load().ok);
assert.equal(E.state.yearEndPresented[0],1970);
assert.equal(E.state.cash,cash);assert.equal(E.scoreInfo().value,score);
assert.equal(E.state.awards.history.length,history);
// Old v13 save should treat all previously recorded reviews as already viewed.
const old=JSON.parse(mem.get('backlot_save'));delete old.yearEndPresented;
mem.set('backlot_save',JSON.stringify(old));assert(E.load().ok);
assert.equal(E.state.yearEndPresented[0],1970);
console.log('PASS v13.4 week-52 advance stop, no double awards/cash, dismissal persistence and migration. Starting cash:',start);
