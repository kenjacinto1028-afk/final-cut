'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),A=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),saved=new Map(),screen=new Map();
const storage={getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,String(v)),removeItem:k=>saved.delete(k)};
function node(id){return {
 get innerHTML(){return screen.get(id)||''},set innerHTML(v){screen.set(id,String(v))},
 hidden:false,classList:{add(){},remove(){},toggle(){}},setAttribute(){},querySelectorAll(){return []},querySelector(){return null},style:{},focus(){}};
}
const document={addEventListener(){},getElementById:node,querySelectorAll(){return []},body:{classList:{add(){},remove(){},toggle(){}}}};
const ctx={console,Math,Date,JSON,localStorage:storage,document,window:{},setTimeout:()=>0,clearTimeout(){}};
vm.createContext(ctx);
for(const file of ['content.js','engine.js','ui.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
const E=ctx.Engine,UI=ctx.UI;
function pass(label){console.log('PASS',label)}
E.newGame({studioName:'Final Cut v13.5 QA',founderName:'QA Director',homeRegion:'northamerica'});
UI.go('projects');
A(screen.get('main').includes('Production Center'));A(screen.get('main').includes('Your first picture begins here'));
pass('New game sees actual FinalCut Production Center');
const short=E.startProject({title:'The Last Daylight',format:'short',genre:'drama',topic:'smalltown',tier:0,cast:{director:'founder',writer:'founder'}});
A(short.ok,short.reason);UI.go('projects');
let h=screen.get('main');
for(const item of ['The Last Daylight','Studio slate','Overview','Early quality range','WEEKLY BOX OFFICE','All projects'])A(h.includes(item),'Missing '+item);
UI.centerSelectTab('timeline'); A(screen.get('main').includes('Production milestones'),'Timeline tab shows the full milestones');
UI.centerSelectTab('management');A(screen.get('main').includes('Promotions'),'Management tab shows film actions');
pass('Real short-film slate, milestones, forecast range, archive');
const p=short.project;let elapsed=0;
while(p.stage!=='done'&&elapsed<120&&!E.state.gameOver){
 if(E.state.pending) E.choose(E.state.pending.choices.length-1);
 E.nextTurn();elapsed++;
}
A.equal(p.stage,'done');A(elapsed<120);
UI.go('projects');h=screen.get('main');A(h.includes('Complete'));A(h.includes('The Last Daylight'));
pass('Automatic weekly progression through completion');
A.equal(E.state.version,13);E.save();A(E.load().ok);
UI.go('projects');A(screen.get('main').includes('The Last Daylight'));
pass('Save compatibility and restored Production Center');
A.equal(E.TUNING.maxReleaseWeeks,20);A(E.TUNING.legs.max>0.81);
const strong=E.state.studio;
strong.tier=2;strong.fame=60;E.state.cash+=2000000;
const film=E.startProject({title:'Autumn of Cinema',format:'feature',genre:'drama',topic:'smalltown',tier:0,cast:{director:'founder',writer:'founder'}});
A(film.ok,film.reason);
const feature=film.project;let weeks=0;
while(feature.stage!=='release'&&weeks<120&&!E.state.gameOver){
 if(E.state.pending)E.choose(E.state.pending.choices.length-1);
 E.nextTurn();weeks++;
}
A.equal(feature.stage,'release');
for(let i=0;i<5;i++){if(E.state.pending)E.choose(E.state.pending.choices.length-1);E.nextTurn();}
A(feature.gross>=0);A(Number.isFinite(feature.lastWeekGross));
UI.go('projects');h=screen.get('main');A(h.includes('Autumn of Cinema'));A(h.includes('In theaters'));
UI.centerFocus(feature.id);UI.centerSelectTab('performance');h=screen.get('main');A(h.includes('Theatrical gross'));
pass('Feature theatrical run and reported weekly gross from real engine');
console.log('PASS Final Cut v13.5 integration; save v'+E.state.version+', feature gross '+feature.gross);
