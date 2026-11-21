"""FinalCut v14.2: real 320/390px Chromium, async saves/slots, stale writes and quota recovery."""
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from functools import partial
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
errors=[]
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  for width in (320,390):
   context=browser.new_context(viewport={'width':width,'height':780},is_mobile=True,has_touch=True,reduced_motion='reduce')
   page=context.new_page()
   page.route('https://fonts.googleapis.com/**',lambda route:route.abort())
   page.route('https://fonts.gstatic.com/**',lambda route:route.abort())
   page.on('pageerror',lambda error:errors.append(str(error)))
   page.goto('http://127.0.0.1:%s/'%server.server_port,wait_until='domcontentloaded')
   page.evaluate("""() => {
     Engine.newGame({studioName:'Small Screen House',founderName:'Mobile Creator',homeRegion:'northamerica'});
     UI.go('newproject');
   }""")
   status=page.evaluate("""() => ({
     viewport:innerWidth,body:document.documentElement.scrollWidth,
     nav:document.getElementById('mobile-nav-toggle').getBoundingClientRect().height,
     motion:matchMedia('(prefers-reduced-motion: reduce)').matches
   })""")
   assert status['body']<=status['viewport']+3,('horizontal overflow',width,status)
   assert status['nav']>=42,('undersized nav target',width,status)
   assert status['motion'],('missing reduced motion preference',width,status)
   page.evaluate("UI.go('saves')")
   status=page.evaluate("({viewport:innerWidth,body:document.documentElement.scrollWidth})")
   assert status['body']<=status['viewport']+3,('save manager overflow',width,status)
   context.close()
  context=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
  page=context.new_page()
  page.route('https://fonts.googleapis.com/**',lambda route:route.abort())
  page.route('https://fonts.gstatic.com/**',lambda route:route.abort())
  page.on('pageerror',lambda error:errors.append(str(error)))
  page.goto('http://127.0.0.1:%s/'%server.server_port,wait_until='domcontentloaded')
  page.evaluate("""() => {
    Engine.newGame({studioName:'Archive Polish Test',founderName:'Mobile Producer',homeRegion:'northamerica'});
    window.__workers=0;window.Worker=new Proxy(window.Worker,{
      construct(target,args){window.__workers++;return Reflect.construct(target,args);}
    });
    Engine.state.filmArchive.rivals=Array.from({length:1750},(_,i)=>({
      id:'rival:long:'+i,rivalId:-1,studio:'Archive Studio '+i,
      title:'Film '+i,format:'feature',stage:'done',quality:65,critic:66,
      releaseWeek:1,genre:'drama',budget:400000,gross:110000+i,
      memo:'Many independent film stories remain part of the history. '.repeat(32)
    }));
    SaveSlots.list();
  }""")
  initial=page.evaluate("""() => {
    const t=performance.now();
    window.__saveDone=false;
    window.__savePromise=UI.saveNow().then(()=>{window.__saveDone=true;});
    return {callMs:performance.now()-t,status:document.querySelector('#main .alert')?.textContent||''};
  }""")
  assert initial['callMs']<1200,('save click blocked the UI',initial)
  assert 'Saving campaign' in initial['status'],initial
  page.wait_for_function("window.__saveDone===true",timeout=90000)
  saved=page.evaluate("""() => ({
    workers:window.__workers,
    status:document.querySelector('#main .alert')?.textContent||'',
    payload:localStorage.getItem('backlot_save')?.length||0,
    slots:SaveSlots.list().slots.length,
    version:Engine.state.version
  })""")
  assert saved['workers']>=1,saved
  assert 'latest progress is safe' in saved['status'],saved
  assert saved['payload']>500000,saved
  assert saved['version']==13 and saved['slots']==1,saved
  print('PASS long manual save and visible status',{'msToYield':round(initial['callMs'],1),'chars':saved['payload']})
  # A clone must retain all data but have a distinct campaignId.
  source_id=page.evaluate("Engine.state.campaignId")
  clone_id=page.evaluate("async() => (await SaveSlots.duplicate('Independent backup')).slotId")
  assert page.evaluate("SaveSlots.list().slots.length")==2
  page.evaluate("window.confirm=()=>true")
  t=page.evaluate("""() => {
    const t=performance.now();
    window.__quitDone=false;
    UI.quit().then(()=>{window.__quitDone=true;});
    return performance.now()-t;
  }""")
  assert t<1200,('quit save click blocked mobile main thread',t)
  page.wait_for_function("window.__quitDone===true",timeout=90000)
  assert page.evaluate("Engine.state===null")
  title_ms=page.evaluate("() => {const t=performance.now();SaveSlots.list();return performance.now()-t;}")
  assert title_ms<500,('title screen re-decoded entire archive',title_ms)
  page.evaluate("(slot) => SaveSlots.activate(slot)",clone_id)
  check=page.evaluate("""() => ({
    id:Engine.state.campaignId,
    archives:Engine.state.filmArchive.rivals.length,
    active:SaveSlots.list().activeId,
    version:Engine.state.version
  })""")
  assert check['id']!=source_id and check['archives']==1750 and check['active']==clone_id
  assert check['version']==13
  # A failed write must leave the active campaign accessible and report failure.
  quota=page.evaluate("""async() => {
    const original=Storage.prototype.setItem;
    Storage.prototype.setItem=function(key,value){
      if(key==='backlot_save')throw new DOMException('Quota exceeded','QuotaExceededError');
      return original.call(this,key,value);
    };
    try{await UI.saveNow();return {error:document.querySelector('#main .alert')?.textContent||'',
      stillLoaded:!!Engine.state};}
    finally{Storage.prototype.setItem=original;}
  }""")
  assert quota['stillLoaded'] and ('Saving was interrupted' in quota['error'] or 'storage is full' in quota['error']),quota
  # A stale explicit worker response must not overwrite a newer synchronous save.
  stale=page.evaluate("""async() => {
    const old=Engine.saveAsync();
    Engine.state.cash=123456789;
    if(!Engine.save())throw Error('latest synchronous save failed');
    const ok=await old;
    return {ok,cash:Engine.state.cash};
  }""")
  assert not stale['ok'] and stale['cash']==123456789,stale
  page.reload(wait_until='domcontentloaded')
  page.evaluate("Engine.load()")
  assert page.evaluate("Engine.state.cash")==123456789
  assert page.evaluate("Engine.state.filmArchive.rivals.length")==1750
  assert not errors,errors
  print('PASS v14.2 Chromium 320/390px, reduced motion, async manual/quit/copy, stale worker and quota recovery',
        {'saveCalls':saved['workers'],'titleMetaMs':round(title_ms,1)})
  context.close();browser.close()
finally:
 server.shutdown();server.server_close()
