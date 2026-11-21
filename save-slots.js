// Final Cut v13.7 — browser-local multi-save library.
// The active campaign always remains at the legacy backlot_save key. Other
// campaigns are stored in IndexedDB to avoid the localStorage ~5MiB quota.
// No cloud sync; saves are isolated by campaignId (including custom posters).
var SaveSlots=(function(){
  'use strict';
  const INDEX='finalcut-save-index-v1', ACTIVE='backlot_save';
  const DB='finalcut-save-library', STORE='snapshots', VERSION=1;
  let openPromise=null;
  function storage(){try{return typeof localStorage==='undefined'?null:localStorage;}catch(_){return null;}}
  function fail(message){throw new Error(message);}
  function id(){return 's'+Date.now().toString(36)+'-'+Math.floor(Math.random()*1e9).toString(36);}
  function cleanName(value,fallback){
    return String(value==null?'':value).replace(/\s+/g,' ').trim().slice(0,48)||fallback||'Untitled studio';
  }
  function readIndex(){
    const ls=storage();if(!ls)return {version:VERSION,activeId:null,slots:[]};
    try {
      const x=JSON.parse(ls.getItem(INDEX));
      if(!x||x.version!==VERSION||!Array.isArray(x.slots))throw Error('No index');
      const slots=x.slots.filter(s=>s&&typeof s.id==='string'&&/^s[a-z0-9-]{4,99}$/.test(s.id))
        .map(s=>({id:s.id,name:cleanName(s.name,s.studio),studio:String(s.studio||'Untitled Pictures'),
          year:Number(s.year)||1970,week:Number(s.week)||0,updatedAt:Number(s.updatedAt)||0,
          campaignId:typeof s.campaignId==='string'?s.campaignId:null,version:Number(s.version)||13,releases:Number(s.releases)||0}));
      return {version:VERSION,activeId:slots.some(s=>s.id===x.activeId)?x.activeId:null,slots};
    }catch(_){return {version:VERSION,activeId:null,slots:[]};}
  }
  function writeIndex(x){
    const ls=storage();if(!ls)fail('Local browser storage is disabled.');
    try{ls.setItem(INDEX,JSON.stringify(x));}catch(_){fail('Cannot update the save list. Check browser storage permissions.');}
  }
  function summary(payload){return Engine.inspectSave(payload);}
  function summaryFromState(){
    const s=Engine.state;if(!s)return null;
    return {campaignId:s.campaignId||null,studio:s.studio?.name||'Untitled Pictures',
      week:s.week,year:Engine.dateOf(s.week).year,version:s.version,releases:s.studio?.releases||0};
  }
  function entry(key,info,name){
    return {id:key,name:cleanName(name,info.studio),studio:info.studio,
      year:info.year,week:info.week,version:info.version,
      campaignId:info.campaignId||null,releases:info.releases||0,updatedAt:Date.now()};
  }
  function refreshEntry(x,info){
    const s=x.slots.find(s=>s.id===x.activeId);
    if(s&&info){s.studio=info.studio;s.week=info.week;s.year=info.year;s.version=info.version;
      s.campaignId=info.campaignId||s.campaignId;s.releases=info.releases||0;s.updatedAt=Date.now();}
  }
  // Repair crash/restart gaps by matching the actual active campaign ID rather
  // than blindly trusting the index. Legacy saves get a named entry untouched.
  function ensure(){
    const x=readIndex(),ls=storage(),raw=ls&&ls.getItem(ACTIVE),info=Engine.state?summaryFromState():(raw&&summary(raw));
    if(!info)return x;
    const active=x.slots.find(s=>s.id===x.activeId);
    if(active&&(!active.campaignId||!info.campaignId||active.campaignId===info.campaignId))return x;
    const matched=x.slots.find(s=>s.campaignId&&s.campaignId===info.campaignId);
    if(matched)x.activeId=matched.id;
    else {const newId=id();x.slots.push(entry(newId,info,info.studio));x.activeId=newId;}
    writeIndex(x);return x;
  }
  function list(){
    const x=ensure(),info=summaryFromState();
    if(info)refreshEntry(x,info);
    return {activeId:x.activeId,slots:x.slots.map(s=>({...s,active:s.id===x.activeId})),
      available:!!storage()};
  }
  function db(){
    if(typeof indexedDB==='undefined')return Promise.reject(Error('IndexedDB is unavailable. Please enable browser site storage.'));
    if(!openPromise)openPromise=new Promise((resolve,reject)=>{
      const req=indexedDB.open(DB,1);
      req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE);};
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error||Error('Cannot open save library.'));
      req.onblocked=()=>reject(Error('Close other FinalCut tabs before switching saves.'));
    }).catch(err=>{openPromise=null;throw err;});
    return openPromise;
  }
  async function put(key,payload){
    const d=await db();return new Promise((resolve,reject)=>{
      const tx=d.transaction(STORE,'readwrite');tx.objectStore(STORE).put(payload,key);
      tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error||Error('Save archive failed.'));
      tx.onabort=()=>reject(tx.error||Error('Save archive was cancelled.'));
    });
  }
  async function get(key){
    const d=await db();return new Promise((resolve,reject)=>{
      const tx=d.transaction(STORE,'readonly'),req=tx.objectStore(STORE).get(key);
      req.onsuccess=()=>resolve(req.result||null);
      req.onerror=()=>reject(req.error||Error('Cannot read archived save.'));
    });
  }
  async function del(key){
    const d=await db();return new Promise((resolve,reject)=>{
      const tx=d.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(key);
      tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error||Error('Cannot delete archived save.'));
    });
  }
  function currentRaw(){
    const ls=storage();return ls&&ls.getItem(ACTIVE);
  }
  function setCurrent(raw){
    const ls=storage();if(!ls)fail('Local browser storage is disabled.');
    try{if(raw==null)ls.removeItem(ACTIVE);else ls.setItem(ACTIVE,raw);}
    catch(_){fail('The active save exceeds browser storage. Export a backup and free up space.');}
  }
  function posterRefresh(){if(typeof PosterStore!=='undefined')PosterStore.resetCache();}
  // Browser autosaves are the active campaign; archive when leaving a slot.
  async function archiveActive(index){
    const x=index||ensure();
    if(!x.activeId)return;
    if(Engine.state){
      if(!Engine.save())fail('The current campaign could not be saved. Switching was cancelled.');
    }
    const raw=currentRaw(),info=raw&&summary(raw);
    if(!info)fail('The active campaign cannot be archived because its save is missing or damaged.');
    await put(x.activeId,raw);
    refreshEntry(x,info);
  }
  function manualSave(){
    if(!Engine.state)return {ok:false,reason:'No campaign is running.'};
    const x=ensure();
    if(!Engine.save())return {ok:false,reason:'The browser could not store this campaign. Export a backup and check free space.'};
    refreshEntry(x,summaryFromState());writeIndex(x);
    return {ok:true};
  }
  async function beginNew(opts){
    const x=ensure(),before=currentRaw(),beforeId=x.activeId;
    if(beforeId)await archiveActive(x);
    const newId=id();
    try{
      const state=Engine.newGame(opts||{});
      if(!Engine.save())fail('Could not save the new game.');
      const meta=summaryFromState();
      x.slots.push(entry(newId,meta,meta.studio));x.activeId=newId;writeIndex(x);
      posterRefresh();return {ok:true,slotId:newId,state};
    }catch(err){
      setCurrent(before);
      if(before)Engine.load();else Engine.closeSession();
      posterRefresh();
      throw err;
    }
  }
  async function activate(slotId){
    const x=ensure(),target=x.slots.find(s=>s.id===slotId);
    if(!target)fail('Save slot not found.');
    if(slotId===x.activeId){
      const result=Engine.load();if(!result.ok)fail(result.reason);
      posterRefresh();refreshEntry(x,summaryFromState());writeIndex(x);
      return {ok:true};
    }
    const raw=await get(slotId);
    if(!raw||!summary(raw))fail('This save is missing or damaged. The current campaign is unchanged.');
    const old=currentRaw(),oldId=x.activeId;
    if(oldId)await archiveActive(x);
    try{
      setCurrent(raw);
      const result=Engine.load();if(!result.ok)fail(result.reason);
      x.activeId=slotId;refreshEntry(x,summaryFromState());writeIndex(x);
      posterRefresh();return {ok:true};
    }catch(err){
      setCurrent(old);
      x.activeId=oldId;
      if(old)Engine.load();else Engine.closeSession();
      posterRefresh();throw err;
    }
  }
  function rename(slotId,name){
    const x=ensure(),slot=x.slots.find(s=>s.id===slotId);
    if(!slot)fail('Save slot not found.');
    slot.name=cleanName(name,slot.studio);writeIndex(x);
    return {ok:true,name:slot.name};
  }
  // Branch the active save without sharing custom-poster IDs. A copy is an
  // independent campaign, not a second bookmark of a mutable campaign.
  async function duplicate(name){
    const x=ensure();
    if(!x.activeId||!Engine.state)fail('Load a campaign before making a copy.');
    if(!Engine.save())fail('The active game could not be saved.');
    const clone=JSON.parse(JSON.stringify(Engine.state));
    const oldCampaign=clone.campaignId;
    clone.campaignId='branch-'+id();
    const slotId=id(),posterIds=clone.projects.filter(p=>p.posterCustom).map(p=>p.id);
    const raw=Engine.encodeSavePayload(clone);
    try{
      if(posterIds.length){
        if(typeof PosterStore==='undefined'||!PosterStore.copyCampaign)fail('Custom posters could not be copied. Update the game.');
        await PosterStore.copyCampaign(oldCampaign,clone.campaignId,posterIds);
      }
      await put(slotId,raw);
      x.slots.push(entry(slotId,summary(raw),name||clone.studio.name+' (copy)'));
      writeIndex(x);
      return {ok:true,slotId};
    }catch(err){
      try{await del(slotId);}catch(_){}
      if(posterIds.length&&typeof PosterStore!=='undefined'&&PosterStore.deleteCampaign)
        try{await PosterStore.deleteCampaign(clone.campaignId);}catch(_){}
      throw err;
    }
  }
  async function remove(slotId){
    const x=ensure(),slot=x.slots.find(s=>s.id===slotId);
    if(!slot)fail('Save slot not found.');
    const old=currentRaw(),oldId=x.activeId,others=x.slots.filter(s=>s.id!==slotId);
    if(slotId===x.activeId){
      if(others.length){
        const next=others[0],raw=await get(next.id);
        if(!raw||!summary(raw))fail('Another save could not be read. No saves were deleted.');
        try{
          setCurrent(raw);
          const result=Engine.load();if(!result.ok)fail(result.reason);
          x.activeId=next.id;x.slots=others;writeIndex(x);
          posterRefresh();
        }catch(err){
          setCurrent(old);x.activeId=oldId;if(old)Engine.load();
          posterRefresh();throw err;
        }
      }else{
        // Save management metadata is removed first; both operations are
        // synchronous localStorage writes. Any failure leaves the save intact.
        x.slots=[];x.activeId=null;
        writeIndex(x);Engine.clearSave();Engine.closeSession();posterRefresh();
      }
    }else{
      x.slots=others;writeIndex(x);
    }
    try{await del(slotId);}catch(_){} // index is canonical; orphan snapshot is harmless
    if(slot.campaignId&&typeof PosterStore!=='undefined'&&PosterStore.deleteCampaign)
      try{await PosterStore.deleteCampaign(slot.campaignId);}catch(_){}
    return {ok:true,activeId:x.activeId};
  }
  // Imports create a NEW independent slot. Existing campaigns and their poster
  // namespaces are never replaced; the imported poster collection is restored
  // under a new campaignId by the caller.
  async function importCampaign(game){
    if(!game||!Array.isArray(game.projects)||!Number.isInteger(game.version)||game.version>13||game.version<8)
      fail('This is not a supported FinalCut campaign.');
    const x=ensure(),before=currentRaw(),beforeId=x.activeId;
    if(beforeId)await archiveActive(x);
    const clone=JSON.parse(JSON.stringify(game));
    clone.campaignId='import-'+id();
    const raw=Engine.encodeSavePayload(clone),slotId=id();
    try{
      setCurrent(raw);
      const result=Engine.load();if(!result.ok)fail(result.reason);
      x.slots.push(entry(slotId,summaryFromState(),clone.studio?.name||'Imported studio'));
      x.activeId=slotId;writeIndex(x);posterRefresh();
      return {ok:true,slotId};
    }catch(err){
      setCurrent(before);
      if(before)Engine.load();else Engine.closeSession();
      posterRefresh();throw err;
    }
  }
  function activeName(){
    const x=ensure();return x.slots.find(s=>s.id===x.activeId)?.name||null;
  }
  return {list,manualSave,beginNew,activate,rename,duplicate,remove,
    importCampaign,activeName,archiveActive};
})();
