"""v14.1: exercise actual worker-backed large saves in a mobile Chromium page.
A synthetic archive is used so no in-game history or awards are fabricated.
"""
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
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  context=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True)
  page=context.new_page()
  page.route('https://fonts.googleapis.com/**',lambda r:r.abort())
  page.route('https://fonts.gstatic.com/**',lambda r:r.abort())
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto('http://127.0.0.1:%s/'%server.server_port,wait_until='domcontentloaded')
  page.evaluate("""() => {
    Engine.newGame({studioName:'Mobile Archive Test',founderName:'Mobile Producer',homeRegion:'northamerica'});
    Engine.state.filmArchive.rivals=Array.from({length:1750},(_,i)=>({
      id:'historical:'+i,rivalId:-1,studio:'Archive Studio '+i,title:'Long-run feature '+i,
      format:'feature',stage:'done',quality:61,critic:62,releaseWeek:1,
      gross:100000+i,genre:'drama',budget:400000,
      memo:'Audience and creator relationships deserve complete archival integrity. '.repeat(18)
    }));
    window.__mobileBefore=localStorage.getItem('backlot_save')?.length;
  }""")
  # Test responsive event loop, not a raw speed claim across hardware.
  dt=page.evaluate("""() => {
    const a=performance.now();Engine.nextTurn();
    return performance.now()-a;
  }""")
  assert dt<1400,'Large-history weekly advance blocked mobile UI for %.0f ms'%dt
  page.wait_for_function("localStorage.getItem('backlot_save')?.length>100000 && Engine.inspectSave(localStorage.getItem('backlot_save'))?.year>=1970",timeout=40000)
  check=page.evaluate("""() => ({
    archive:Engine.state.filmArchive.rivals.length,
    stored:localStorage.getItem('backlot_save').length,
    source:Engine.inspectSave(localStorage.getItem('backlot_save')),
    pageWidth:document.documentElement.scrollWidth,
    viewWidth:window.innerWidth
  })""")
  assert check['archive']==1750
  assert check['pageWidth']<=check['viewWidth']+3,check
  # The active autosave must contain every archived film.
  page.reload(wait_until='domcontentloaded')
  page.evaluate("Engine.load()")
  assert page.evaluate("Engine.state.filmArchive.rivals.length")==1750
  # Rapid successive turns must coalesce queued archives while preserving
  # the last state (older worker completions must never overwrite progress).
  page.evaluate("""() => {
    for(let i=0;i<4;i++){if(Engine.state.pending)Engine.choose(Engine.state.pending.choices.length-1);Engine.nextTurn();}
    Engine.state.cash=987654;
  }""")
  page.wait_for_function("Engine.inspectSave(localStorage.getItem('backlot_save'))?.week>=4",timeout=40000)
  # A newer explicit sync save must never be overwritten by an older Worker.
  page.evaluate("""() => {Engine.nextTurn();Engine.state.cash=123456789; if(!Engine.save())throw Error('manual save failed');}""")
  page.wait_for_timeout(1500)
  page.reload(wait_until='domcontentloaded')
  page.evaluate("Engine.load()")
  assert page.evaluate("Engine.state.cash")==123456789
  assert not errors,errors
  print('PASS v14.1 mobile Chromium worker autosave, full archive, reload, manual-save ordering, 390px viewport',
        {'advanceMs':round(dt,1),'savedChars':check['stored']})
  context.close();browser.close()
finally:
 server.shutdown();server.server_close()
