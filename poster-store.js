// Final Cut v11 — custom poster storage (browser-only, IndexedDB).
// Original image bytes stay outside the weekly save; they are never uploaded.
var PosterStore = (function () {
  'use strict';
  const DB = 'finalcut-custom-posters', STORE = 'posters';
  let openPromise = null;
  const cache = new Map(), requested = new Set(), lookupFailures = new Map();
  function campaign() {
    return (typeof Engine !== 'undefined' && Engine.state && Engine.state.campaignId) || 'legacy';
  }
  function key(projectId) { return campaign() + ':player:' + Number(projectId); }
  function db() {
    if (typeof indexedDB === 'undefined') return Promise.reject(new Error('Poster storage is unavailable in this browser.'));
    if (!openPromise) openPromise = new Promise((resolve, reject) => {
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(STORE)) r.result.createObjectStore(STORE); };
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error || new Error('Cannot open poster storage.'));
    }).catch(e => { openPromise = null; throw e; });
    return openPromise;
  }
  async function readByKey(k) {
    const d = await db();
    return new Promise((resolve, reject) => {
      const t = d.transaction(STORE, 'readonly'), r = t.objectStore(STORE).get(k);
      r.onsuccess = () => resolve(r.result || null);
      r.onerror = () => reject(r.error);
    });
  }
  async function writeByKey(k, blob) {
    const d = await db();
    return new Promise((resolve, reject) => {
      const t = d.transaction(STORE, 'readwrite');
      t.objectStore(STORE).put(blob, k);
      t.oncomplete = resolve;
      t.onerror = () => reject(t.error);
    });
  }
  async function deleteByKey(k) {
    const d = await db();
    return new Promise((resolve, reject) => {
      const t = d.transaction(STORE, 'readwrite');
      t.objectStore(STORE).delete(k);
      t.oncomplete = resolve;
      t.onerror = () => reject(t.error);
    });
  }
  function signal() { if (typeof document !== 'undefined') document.dispatchEvent(new Event('finalcut-poster-change')); }
  function status(projectId) {
    const k = key(projectId);
    return cache.has(k) ? 'ready' : (lookupFailures.get(k) || 'loading');
  }
  function memo(k, blob) {
    if (cache.has(k)) URL.revokeObjectURL(cache.get(k));
    cache.set(k, URL.createObjectURL(blob)); lookupFailures.delete(k); signal();
  }
  function url(projectId) {
    const k = key(projectId);
    if (cache.has(k)) return cache.get(k);
    if (!requested.has(k) && !lookupFailures.has(k)) {
      requested.add(k);
      readByKey(k).then(blob => {
        if (blob instanceof Blob && blob.size > 0) memo(k, blob);
        else { lookupFailures.set(k, 'missing'); signal(); }
      }).catch(() => { lookupFailures.set(k, 'error'); signal(); })
        .finally(() => requested.delete(k));
    }
    return null;
  }
  async function put(projectId, blob) {
    if (!(blob instanceof Blob) || !/^image\/(jpeg|png|webp)$/.test(blob.type) || blob.size > 750000) throw new Error('Poster must be an optimized JPG, PNG or WebP under 750 KB.');
    const k = key(projectId);
    await writeByKey(k, blob); memo(k, blob);
  }
  async function remove(projectId) {
    const k=key(projectId);await deleteByKey(k);
    if(cache.has(k))URL.revokeObjectURL(cache.get(k));cache.delete(k);
    lookupFailures.set(k, 'missing');signal();
  }
  function asDataURL(blob) { return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob);}); }
  async function missing(projectIds) {
    const ids=[];
    for (const id of projectIds) { if (!await readByKey(key(id))) ids.push(Number(id)); }
    return ids;
  }
  async function bundle(projectIds) {
    const posters={};
    for(const id of projectIds){const b=await readByKey(key(id));if(!b)throw new Error('Custom poster '+id+' is missing from local storage. Restore it, or choose a generated poster before exporting.');posters[id]=await asDataURL(b);}
    return posters;
  }
  async function restore(posters) {
    for(const [id,value] of Object.entries(posters||{})) {
      if (!/^\d+$/.test(String(id)) || typeof value!=='string' || !/^data:image\/(jpeg|png|webp);base64,/.test(value) || value.length>1100000) continue;
      const blob = await(await fetch(value)).blob();
      if(blob.size <= 750000) await put(Number(id), blob);
    }
  }
  async function copyCampaign(fromCampaign,toCampaign,projectIds) {
    if(!fromCampaign||!toCampaign||fromCampaign===toCampaign)throw new Error('Invalid poster copy destination.');
    // Read every original before writing any copy; missing uploads must never
    // produce a new save pointing at someone else's or nonexistent artwork.
    const copies=[];
    for(const id of projectIds){
      const blob=await readByKey(fromCampaign+':player:'+Number(id));
      if(!blob)throw new Error('Custom poster '+id+' is missing. Restore it or use a generated poster before copying.');
      copies.push([toCampaign+':player:'+Number(id),blob]);
    }
    for(const [k,blob] of copies)await writeByKey(k,blob);
  }
  async function deleteCampaign(campaignId) {
    if(typeof campaignId!=='string'||!campaignId)return;
    const prefix=campaignId+':player:',d=await db();
    await new Promise((resolve,reject)=>{
      const tx=d.transaction(STORE,'readwrite'),req=tx.objectStore(STORE).openCursor();
      req.onsuccess=()=>{const cur=req.result;if(!cur)return;
        if(typeof cur.key==='string'&&cur.key.startsWith(prefix))cur.delete();
        cur.continue();
      };
      tx.oncomplete=resolve;
      tx.onerror=()=>reject(tx.error||Error('Could not delete campaign artwork.'));
    });
    for(const k of [...cache.keys()])if(k.startsWith(prefix)){
      URL.revokeObjectURL(cache.get(k));cache.delete(k);requested.delete(k);lookupFailures.delete(k);
    }
    signal();
  }
  function resetCache() {
    cache.forEach(u=>URL.revokeObjectURL(u));cache.clear();requested.clear();lookupFailures.clear();
  }
  return { url, status, put, remove, missing, bundle, restore, resetCache,
    copyCampaign, deleteCampaign };
})();
