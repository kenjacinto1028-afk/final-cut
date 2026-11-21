// v14.3b: finite promotions, sponsor balance and persisted review tiers.
'use strict';
const A=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const memory=new Map();
const ctx={console,Date,Math,JSON,localStorage:{getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)}};
vm.createContext(ctx);
for(const f of ['content.js','engine.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),ctx,{filename:f});
const E=ctx.Engine;
function make(title) {
 const r=E.startProject({title,format:'short',tier:0,genre:'drama',topic:'smalltown',cast:{director:'founder',writer:'founder'}});
 A(r.ok,r.reason);return r.project;
}
function premiere(p) {
 let n=0;while(p.stage!=='release'&&n++<90){
  if(E.state.pending)E.choose(E.state.pending.choices.length-1);
  else E.nextTurn();
 }
 A.equal(p.stage,'release');
}
E.newGame({studioName:'Film Press Studio',founderName:'Producer'});
const p=make('First Evening');
A.equal(E.filmSponsorQuote(p.id).ok,false,'new studio should not have sponsorship');
const q=['local','targeted','broad'].map(k=>E.filmPromotionQuote(p.id,k)).find(x=>x.ok);
A(q,'small short must afford at least one campaign');
const balance=E.state.cash;
A(E.filmPromote(p.id,q.kind).ok);
A.equal(E.state.cash,balance-q.cost);
A.equal(p.marketingSpend,q.cost);
A.equal(E.filmPromote(p.id,q.kind).ok,false,'campaign once only');
E.state.studio.fame=28;E.state.reputation.buzz=30;E.state.reputation.currentPrestige=10;
const s=E.filmSponsorQuote(p.id);
A(s.ok,s.reason);
A(s.upfront>0&&s.upfront<=p.budget*.1);
const cash=E.state.cash,receipts=p.revenue;
A(E.acceptFilmSponsor(p.id).ok);
A.equal(E.state.cash,cash+s.upfront);
A.equal(p.revenue,receipts+s.upfront);
A.equal(E.acceptFilmSponsor(p.id).ok,false);
A.equal(E.declineFilmSponsor(p.id).ok,false);
premiere(p);
A(p.pressReviews.length>=1&&p.pressReviews.length<=4);
A(p.pressReviews.every(r=>r.tier>=1&&r.score>0&&r.score<=100&&r.text.length>12));
A(Math.abs(p.pressHypeDelta)<=6);
A.equal(E.filmSponsorQuote(p.id).ok,false);
const before=JSON.stringify(p.pressReviews);
A(E.save());
A(E.load().ok);
A.equal(JSON.stringify(E.getProject(p.id).pressReviews),before);
A.equal(E.filmHistory().find(f=>f.projectId===p.id).pressReviews.length,p.pressReviews.length);
E.newGame({studioName:'Established Studio',founderName:'Producer'});
E.state.studio.fame=85;E.state.reputation.buzz=80;E.state.reputation.currentPrestige=60;
const high=make('Major Picture');premiere(high);
A(high.pressReviews.length>=3,'established studio should receive more reviews');
A(high.pressReviews.some(r=>r.tier>=3),'established studio should attract high-tier critics');
A.equal(E.state.version,13);
console.log('PASS v14.3b sponsor gate, once-only campaign, correct cash ledger, review tiers and save roundtrip');
