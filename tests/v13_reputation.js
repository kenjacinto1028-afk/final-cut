const fs=require('node:fs'), vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const dir=path.resolve(__dirname,'..'),db=new Map(),ls={getItem:k=>db.get(k)||null,setItem:(k,v)=>db.set(k,String(v)),removeItem:k=>db.delete(k)};
const ctx={console,Date,JSON,Math,localStorage:ls};vm.createContext(ctx);
for(const f of ['content.js','engine.js'])vm.runInContext(fs.readFileSync(path.join(dir,f),'utf8'),ctx,{filename:f});
const e=ctx.Engine; e.newGame({studioName:'Reputation Test',homeRegion:'asia'});const s=e.state;
assert.equal(s.version,13);assert(e.reputationInfo().buzz>=0);
s.studio.fame=100;s.reputation.buzz=60;s.reputation.prestigeEvents=[{week:0,points:60,kind:'award',filmId:null}];s.reputation.lifetimeLegacy=42;
const base=e.reputationInfo();
for(let i=0;i<100;i++){while(s.pending)e.choose(0);e.nextTurn();}
const late=e.reputationInfo();assert(late.buzz<base.buzz,{base,late});assert(late.currentPrestige<80,{base,late});assert.equal(late.lifetimeLegacy,42);assert(s.studio.fame>=80);
const old=JSON.parse(JSON.stringify(s));old.version=12;delete old.reputation;db.set('backlot_save',JSON.stringify(old));assert(e.load().ok);assert.equal(e.state.version,13);assert(e.reputationInfo().lifetimeLegacy>=0);console.log('PASS v13 fame separated from buzz / rolling prestige / permanent legacy / migration');
