// v14.1 large-campaign save encoder.
// Worker has no access to localStorage, so the main thread owns each committed write.
// Import the same canonical codec; no alternative format or truncated history.
'use strict';
importScripts('content.js','engine.js');
self.onmessage=function(event){
 const data=event.data;
 if(!data||data.type!=='encode')return;
 try{
  const packed=Engine.encodeSavePayload(data.snapshot);
  self.postMessage({type:'encoded',generation:data.generation,campaignId:data.campaignId,payload:packed});
 }catch(error){
  self.postMessage({type:'failed',generation:data.generation,campaignId:data.campaignId,reason:String(error?.message||error)});
 }
};
