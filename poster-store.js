// Final Cut v11 — custom poster storage (browser-only, IndexedDB).
// Original image bytes stay outside the weekly save; they are never uploaded.
var PosterStore = (function () {
  'use strict';
  const DB = 'finalcut-custom-posters', STORE = 'posters';
  let openPromise = null;
  const cache = new Map(), requested = new Set();
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
  function memo(k, blob) {
    if (cache.has(k)) URL.revokeObjectURL(cache.get(k));
    cache.set(k, URL.createObjectURL(blob)); signal();
  }
  function url(projectId) {
    const k = key(projectId);
    if (cache.has(k)) return cache.get(k);
    if (!requested.has(k)) {
      requested.add(k);
      readByKey(k).then(blob => { if (blob) memo(k,blob); }).catch(() => {}).finally(() => requested.delete(k));
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
    if(cache.has(k))URL.revokeObjectURL(cache.get(k));cache.delete(k);signal();
  }
  function asDataURL(blob) { return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob);}); }
  async function bundle(projectIds) {
    const posters={};
    for(const id of projectIds){const b=await readByKey(key(id));if(b)posters[id]=await asDataURL(b);}
    return posters;
  }
  async function restore(posters) {
    for(const [id,value] of Object.entries(posters||{})) {
      if (!/^\d+$/.test(String(id)) || typeof value!=='string' || !/^data:image\/(jpeg|png|webp);base64,/.test(value) || value.length>1100000) continue;
      const blob = await(await fetch(value)).blob();
      if(blob.size <= 750000) await put(Number(id), blob);
    }
  }
  function resetCache() {
    cache.forEach(u=>URL.revokeObjectURL(u));cache.clear();requested.clear();
  }
  return { url, put, remove, bundle, restore, resetCache };
})();
