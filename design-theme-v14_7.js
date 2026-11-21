// FinalCut v14.7 palette controller. Presentation-only; no Engine/save mutations.
var DesignTheme = (function () {
  'use strict';
  const KEY='finalcut-ui-palette-v14-7';
  const PALETTES=Object.freeze([
    {id:'gold',name:'Warm Gold',color:'#D4B483',caption:'Marquee brass'},
    {id:'sage',name:'Sage',color:'#84A98C',caption:'Celluloid green'},
    {id:'amber',name:'Amber',color:'#E09F3E',caption:'Projection light'},
    {id:'crimson',name:'Crimson Velvet',color:'#D96B7C',caption:'Premiere velvet'},
    {id:'cyan',name:'Cyan Noir',color:'#5BC0BE',caption:'Editing room'},
    {id:'terracotta',name:'Terracotta Sunset',color:'#E07A5F',caption:'New Hollywood'}
  ]);
  const known=new Set(PALETTES.map(x=>x.id));
  let active='gold';
  try {
    const stored=localStorage.getItem(KEY);
    if(known.has(stored)) active=stored;
  } catch (_) { /* localStorage can be disabled */ }
  function apply(){
    const root=document.documentElement;
    if(root)root.dataset.fcPalette=active;
    document.querySelectorAll('[data-palette-option]').forEach(btn=>{
      const on=btn.dataset.paletteOption===active;
      btn.classList.toggle('is-active',on);
      btn.setAttribute('aria-pressed',String(on));
      btn.setAttribute('aria-label',(on?'Active palette: ':'Use palette: ')+PALETTES.find(x=>x.id===btn.dataset.paletteOption)?.name);
      btn.title=PALETTES.find(x=>x.id===btn.dataset.paletteOption)?.name||'Palette';
    });
    document.querySelectorAll('[data-active-palette]').forEach(label=>{
      label.textContent=PALETTES.find(x=>x.id===active).name;
    });
  }
  function set(id){
    if(!known.has(id))return false;
    active=id;
    try{localStorage.setItem(KEY,id);}catch(_){}
    apply();
    return true;
  }
  function picker(){
    const buttons=PALETTES.map(p=>'<button type="button" data-palette-option="'+p.id+
      '" class="fc-palette-swatch'+(active===p.id?' is-active':'')+
      '" style="--palette-swatch:'+p.color+'" onclick="DesignTheme.set(&quot;'+p.id+'&quot;)" title="'+p.name+
      '" aria-label="Use palette: '+p.name+'" aria-pressed="'+(active===p.id)+'"><span aria-hidden="true"></span></button>').join('');
    return '<section class="fc-palette-picker" aria-label="Studio interface color palette">'+
      '<div class="fc-palette-picker-head"><small>STUDIO PALETTE</small><strong data-active-palette>'+
      PALETTES.find(x=>x.id===active).name+'</strong></div>'+
      '<div class="fc-palette-swatches" role="group" aria-label="Choose one of six palettes">'+buttons+'</div></section>';
  }
  if(typeof document!=='undefined')apply();
  return {set,apply,picker,current:()=>active,options:()=>PALETTES.map(x=>({...x}))};
}());
