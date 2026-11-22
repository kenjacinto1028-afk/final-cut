'use strict';
const A=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),memory=new Map();
const context={console,Math,Date,JSON,localStorage:{
  getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)
}};
vm.createContext(context);
for(const file of ['content.js','engine.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
const E=context.Engine;
E.newGame({studioName:'Critic Diversity QA',founderName:'Director'});
E.state.cash+=1000000;
function make(title,genre,topic){
  const r=E.startProject({title,format:'short',tier:0,genre,topic,cast:{director:'founder',writer:'founder'}});
  A(r.ok,r.reason);
  let steps=0;
  while(!r.project.pressReviews?.length&&steps++<150&&!E.state.gameOver){
    if(E.state.pending)E.choose(E.state.pending.choices.length-1);
    else E.nextTurn();
  }
  A(r.project.pressReviews?.length>0,'critic coverage generated for '+title);
  return r.project;
}
const a=make('Letters by the Pier','drama','smalltown');
const b=make('The House Behind Us','horror','haunted');
const c=make('After the First Dance','romance','firstlove');
A(a.pressReviews[0].text.includes('small-town life'),a.pressReviews[0].text);
A(b.pressReviews[0].text.includes('the haunted setting'),b.pressReviews[0].text);
A(c.pressReviews[0].text.includes('first love'),c.pressReviews[0].text);
A.notEqual(a.pressReviews[0].text,b.pressReviews[0].text);
for(const p of [a,b,c]){
  for(const r of p.pressReviews){
    A(r.score>=5&&r.score<=100,'numeric rating preserved');
    A(r.tier>=1&&r.tier<=4,'review tier preserved');
    A(r.text.length>25&&r.text.length<240,'readable concise line');
  }
}
A.equal(E.state.version,13,'save schema unchanged');
E.save();A(E.load().ok,'critic text persists');
A(E.state.projects.some(p=>p.pressReviews?.some(r=>r.text.includes('first love'))));
console.log('PASS v14.11 critic prose reflects genre/topic while preserving ratings and saves');
