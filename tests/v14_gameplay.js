// FinalCut v14 — integrated creative/business/living-industry acceptance.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),data=fs.readFileSync(path.join(root,'content.js'),'utf8'),
  engine=fs.readFileSync(path.join(root,'engine.js'),'utf8');
function game(name){
  const db=new Map(),store={getItem:k=>db.get(k)??null,setItem:(k,v)=>db.set(k,String(v)),removeItem:k=>db.delete(k)};
  const context={console,Date,JSON,Math,localStorage:store};
  vm.createContext(context);vm.runInContext(data,context);vm.runInContext(engine,context);
  const E=context.Engine;E.newGame({studioName:name,founderName:'Film Director',homeRegion:'northamerica'});
  return {E,db};
}
function next(E){
  if(E.state.pending)E.choose(E.state.pending.choices.length-1);
  return E.nextTurn();
}
function until(E,fn,limit=130){
  let n=0;while(!fn()&&n++<limit&&!E.state.gameOver)next(E);
  assert(fn(),'condition not reached in '+limit+' weeks');return n;
}
function short(E,title,opts={}){
  const r=E.startProject({title,format:'short',genre:'drama',topic:'smalltown',tier:0,
    cast:{director:'founder',writer:'founder'},...opts});
  assert(r.ok,r.reason);return r.project;
}
const {E,db}=game('V14 Creative House');
const start=E.v14MarketInfo(),initial=JSON.stringify(start.pitches);
assert.equal(start.pitches.length,3);
assert.equal(JSON.stringify(E.v14MarketInfo().pitches),initial,'quarterly slate must not reroll');
assert.equal(start.pitches[0].fee,0,'starting pitch must be affordable');
assert(start.pitches.some(x=>x.strengths.length===2&&x.hook.length>10));
let quote=E.v14ScriptQuote({pitchId:start.pitches[0].id,format:start.pitches[0].format,
  genre:start.pitches[0].genre,topic:start.pitches[0].topic});
assert(quote.ok);
let pitch=start.pitches[0];
let p=short(E,pitch.title,{format:pitch.format,genre:pitch.genre,topic:pitch.topic,
  pitchId:pitch.id,vision:pitch.vision});
assert.equal(p.dna.hook,pitch.hook);
assert.equal(p.dna.pitchId,pitch.id);
assert.equal(p.spent,quote.fee);
assert(!E.v14ScriptQuote({pitchId:pitch.id,format:pitch.format,genre:pitch.genre,topic:pitch.topic}).ok);
const conflict=E.v14Identity('you');
assert.equal(conflict.primary,'developing');
assert(E.v14Storyboard(p).some(e=>e.kind==='script'));
console.log('PASS a–b: Film DNA, retained story and non-rerolling affordable scripted pitches');

// Natural film production with consequential contextual issue. A real decision
// modifies remembered creative flags and the actual cost/quality/time path.
let decision=null,n=0;
while(p.stage!=='release'&&n++<70){
  if(E.state.pending){
    if(E.state.pending.id?.startsWith('v14_issue_')){
      decision=E.state.pending;
      assert.equal(decision.choices.length,3);
      assert(decision.choices.every(x=>x.effects));
      E.choose(1);
    }else E.choose(E.state.pending.choices.length-1);
  }else E.nextTurn();
}
assert(decision,'film should receive one meaningful risk-driven production challenge');
assert(p.dna.choiceFlags.includes('supported'));
assert(p.storyChoices>=1);
assert(p.spent>p.fees);
assert.equal(p.stage,'release');
assert(p.quality>0&&p.hype>=0);
assert(E.v14Storyboard(p).some(x=>x.kind==='premiere'));
until(E,()=>p.stage==='done',35);
assert(p.revenue>0);
assert(E.v14FilmLegacy(p).kind);
console.log('PASS c–d: contextual creative decisions, release consequences and permanent film story');

// Delegation must choose an automatic response, without repeated popups.
const s2=game('Delegated Creator').E;
assert(s2.v14SetDelegation('director').ok);
const second=short(s2,'Independent Journey',{vision:'prestige'});
until(s2,()=>second.stage==='release',70);
assert(second.flags.v14Issue && second.dna.choiceFlags.includes('authentic'));
assert(second.storyChoices>=1);
assert(s2.v14Storyboard(second).some(x=>x.kind==='production'));
assert(s2.v14SetDelegation('commercial').ok);
assert(!s2.v14SetDelegation('spam').ok);
console.log('PASS creative delegation: one decision remembered; no project interruption for delegated issue');

// Feature film, public competing slate and one meaningful mid-run choice.
const fsGame=game('Competitive Releases'),F=fsGame.E;
F.state.studio.fame=90;F.state.studio.tier=3;F.state.cash=10_000_000;
const f=F.startProject({title:'A Great Opening',format:'feature',genre:'thriller',topic:'heist',
  tier:1,vision:'bold',releasePosition:'targeted',cast:{director:'founder',writer:'founder'}});
assert(f.ok,f.reason);
const ft=f.project;
assert.equal(ft.dna.vision,'bold');
assert.equal(F.v14ReleaseCalendar().length,12);
assert(F.v14SetReleasePlan(ft.id,'prestige').ok);
assert.equal(ft.releasePosition,'prestige');
until(F,()=>ft.stage==='release',120);
assert(!F.v14SetReleasePlan(ft.id,'wide').ok);
until(F,()=>ft.weeksInRelease>=1,5);
const response=F.v14ReleaseResponseQuote(ft.id,'focus');
assert(response.ok,response.reason);
const cash=F.state.cash,spent=ft.spent;
assert(F.v14ReleaseResponse(ft.id,'focus').ok);
assert.equal(F.state.cash,cash-response.cost);
assert.equal(ft.spent,spent+response.cost);
assert(!F.v14ReleaseResponseQuote(ft.id,'expand').ok,'one post-opening response');
until(F,()=>ft.stage==='done',30);
assert(ft.gross>0&&F.v14FilmLegacy(ft).kind);
assert(F.v14Storyboard(ft).some(x=>x.kind==='release'));
console.log('PASS e: competitive calendar, different release positioning and one non-guaranteed mid-run choice');

// Afterlife licensing trades guaranteed upfront receipts for lower future
// windows. Works without altering historical box office or attendance.
const eligible=F.v14AfterlifeQuote(ft.id,'license');
assert(eligible.ok,eligible.reason);
const pastGross=ft.gross,windowBefore=(ft.windows||[]).reduce((n,w)=>n+Math.max(0,w.total-w.paid),0);
const beforeMoney=F.state.cash;
assert(F.v14AfterlifeAction(ft.id,'license').ok);
assert.equal(F.state.cash-beforeMoney,eligible.upfront);
assert.equal(ft.gross,pastGross);
const windowAfter=(ft.windows||[]).reduce((n,w)=>n+Math.max(0,w.total-w.paid),0);
assert(windowAfter<windowBefore);
assert(!F.v14AfterlifeQuote(ft.id,'license').ok);
assert(F.v14Storyboard(ft).some(x=>x.kind==='afterlife'));
console.log('PASS g: catalog second life, tradeoff and unaltered opening gross');

// Studio ambitions, evidence-based identity and actual rival script competition.
const ambition=F.v14Ambitions();
assert.equal(ambition.options.length,3);
assert(F.v14PickAmbition(ambition.options[0].id).ok);
assert(!F.v14PickAmbition(ambition.options[0].id).ok);
const my=F.v14Identity('you'),rivals=F.activeRivals();
assert(my.label&&Array.isArray(my.evidence));
assert(rivals.length>0);
const their=F.v14Identity(rivals[0].id);assert(their.label);
for(let i=0;i<80;i++)next(F);
const memory=F.v14Rivalry();
assert(Array.isArray(memory)&&memory.length<=24);
assert.equal(F.v14MarketInfo().pitches.length,3);
assert(F.load().ok);
assert.equal(F.state.version,13);
assert(F.v14Dna(F.getProject(ft.id)));
assert(F.v14Storyboard(F.getProject(ft.id)).length>0);
console.log('PASS f–g: evidence-backed player/rival identities, ambition, rival memory and saved film DNA');

// Existing v13 campaigns have no new Film DNA; preserve all old historical
// records and hydrate the new studio features without rewriting film results.
const save=JSON.parse(fsGame.db.get('backlot_save'));
delete save.v14;
for(const project of save.projects){delete project.dna;delete project.story;delete project.storyChoices;}
const oldGross=save.projects.find(x=>x.id===ft.id).gross;
fsGame.db.set('backlot_save',JSON.stringify(save));
assert(F.load().ok);
const oldFilm=F.getProject(ft.id);
assert.equal(oldFilm.gross,oldGross);
assert.equal(F.v14Dna(oldFilm),null);
assert.equal(F.v14Storyboard(oldFilm).length,0);
assert(F.v14MarketInfo().pitches.length===3);
console.log('PASS legacy v13: historical financials unchanged, new features hydrate lazily');

// Check performance/survival over two separate long campaigns; this test
// exercises occasional fresh productions rather than a passive infinite world.
for(let seed=0;seed<2;seed++){
  const W=game('Full Career '+seed).E;W.state.cash=2e7;W.state.studio.fame=50;W.state.studio.tier=2;
  W.v14SetDelegation(seed?'commercial':'director');
  let launches=0;
  for(let week=0;week<780;week++){
    if(week%30===0&&W.activeProjects().length<W.capacity()){
      const offer=W.v14MarketInfo().pitches.find(x=>!x.claimedBy&&x.format==='short');
      const r=offer?W.startProject({title:offer.title,format:offer.format,genre:offer.genre,
          topic:offer.topic,tier:0,pitchId:offer.id,
          cast:{director:'founder',writer:'founder'}}):
        W.startProject({title:'Original '+seed+'-'+week,format:'short',genre:'drama',
          topic:'smalltown',tier:0,cast:{director:'founder',writer:'founder'}});
      if(r.ok)launches++;
    }
    if(!next(W))break;
  }
  const finished=W.state.projects.filter(x=>x.stage==='done');
  assert(launches>=18,'not enough film launches '+launches);
  assert(finished.length>=17);
  assert(W.v14Identity('you').count>=3);
  assert(W.state.v14.rivalry.length<=24);
  assert(W.state.v14.classChanges.length<=12);
  assert(W.state.version===13);
  assert(W.load().ok);
  console.log('PASS 15-year world',seed,JSON.stringify({launches,finished:finished.length,identity:W.v14Identity('you').label,
    year:W.dateOf().year,cash:W.state.cash,rivals:W.activeRivals().length}));
}
console.log('PASS FinalCut v14 integrated model and save compatibility');


// The earned identity must not treat ordinary genre consistency as a cult.
const lanes=[
 {name:'critical drama',want:'prestige',format:'feature',genre:'drama',critic:86,audience:62,
   budget:500000,spent:520000,revenue:610000,gross:900000,vision:'prestige',awards:1},
 {name:'commercial comedy',want:'commercial',format:'feature',genre:'comedy',critic:57,audience:84,
   budget:600000,spent:625000,revenue:1350000,gross:2600000,vision:'mainstream',awards:0},
 {name:'cult horror',want:'genre',format:'feature',genre:'horror',critic:61,audience:63,
   budget:120000,spent:130000,revenue:195000,gross:172000,vision:'bold',awards:0},
 {name:'indie shorts',want:'indie',format:'short',genre:'drama',critic:62,audience:55,
   budget:8500,spent:8000,revenue:11100,gross:0,vision:'prestige',awards:0},
 {name:'network pilots',want:'tv',format:'pilot',genre:'drama',critic:65,audience:64,
   budget:32000,spent:27000,revenue:41000,gross:0,vision:'mainstream',awards:0}
];
for(const lane of lanes){
 const G=game('Identity '+lane.name).E;
 G.state.week=52*7;
 const films=Array.from({length:8},(_,i)=>({
   id:i+1,title:lane.name+' #'+(i+1),stage:'done',format:lane.format,
   genre:lane.genre,topic:'smalltown',releaseWeek:52*4+i*13,
   quality:lane.critic,critic:lane.critic,audience:lane.audience,
   budget:lane.budget,spent:lane.spent,revenue:lane.revenue,gross:lane.gross,
   dna:{vision:lane.vision},awards:lane.awards?[{won:true}]:[],festResults:[]
 }));
 G.state.projects.push(...films);
 const player=G.v14Identity('you');
 assert.equal(player.candidate,lane.want,lane.name+' should classify by actual films and results: '+JSON.stringify(player));
 G.state.filmArchive.rivals=films.map((f,i)=>Object.assign({},f,{id:'rival:99:'+i,rivalId:99}));
 const rival=G.v14Identity('99');
 assert.equal(rival.candidate,lane.want,'AI '+lane.name+' uses same rules');
 console.log('PASS studio identity',lane.name,player.label,'player and rival');
}
