"""v14.3a: every title exposes film decisions, earnings and eligible future actions."""
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
 with sync_playwright() as play:
  browser=play.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  page=browser.new_page(viewport={'width':1366,'height':880})
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(f'http://127.0.0.1:{server.server_port}/',wait_until='domcontentloaded')
  result=page.evaluate("""()=>{
    Engine.newGame({studioName:'Film Hub Proof',founderName:'Producer'});
    const r=Engine.startProject({title:'Quiet Mail',format:'short',tier:0,
      genre:'drama',topic:'smalltown',cast:{director:'founder',writer:'founder'}});
    if(!r.ok)throw Error(r.reason);
    UI.go('projects');UI.openProject(r.project.id);
    return {id:r.project.id};
  }""")
  assert page.locator('#drawer .fc-filmhub-guide').count()==1
  guide=page.locator('#drawer .fc-filmhub-guide').inner_text()
  assert 'Release & performance' in guide and 'screening' in guide
  assert 'Encore screening run' in guide and 'Only your released short films qualify' in guide
  page.evaluate('UI.closeDrawer()')
  # Simulate real production before inspecting locked/available post-release labels.
  page.evaluate("""(id)=>{
    const p=Engine.getProject(id);let n=0;
    while(p.stage!=='done'&&n++<90){
      if(Engine.state.pending)Engine.choose(Engine.state.pending.choices.length-1);
      else Engine.nextTurn();
    }
    if(p.stage!=='done')throw Error('Short did not complete');
    UI.go('filmography');UI.openProject(id);
  }""",result['id'])
  assert page.locator('#drawer .fc-filmhub-guide').count()==1
  guide=page.locator('#drawer .fc-filmhub-guide').inner_text()
  assert 'Encore screening run' in guide
  assert 'Festival press kit' in guide
  assert 'Weekly screening receipts' in guide
  film=page.evaluate("(id)=>Engine.filmHistory().find(f=>f.projectId===id)",result['id'])
  page.evaluate("(id)=>{UI.closeDrawer();UI.go('filmography');UI.openFilm(id)}",film['id'])
  assert page.locator('#drawer').get_by_role('button',name='Open Film Hub',exact=False).count()==1
  page.evaluate('UI.closePremiereReport()')
  page.locator('#drawer').get_by_role('button',name='Open Film Hub',exact=False).click()
  assert page.locator('#drawer').get_by_text('What can I do next?').count()==1
  # The generated movie still must no longer replace a custom uploaded poster.
  page.evaluate("""async (id)=>{
    const p=Engine.getProject(id);
    const b=atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO8boFoAAAAASUVORK5CYII=');
    await PosterStore.put(id,new Blob([Uint8Array.from(b,c=>c.charCodeAt(0))],{type:'image/png'}));
    p.posterCustom=true;Engine.save();UI.closeDrawer();UI.go('filmography');
    const film=Engine.filmHistory().find(f=>f.projectId===id);
    UI.openFilm(film.id);
  }""",result['id'])
  assert page.locator('#drawer img.poster-custom').count()==1
  assert page.locator('#drawer .film-still').count()==0
  assert page.locator('#drawer .fc-illustrative-still').count()==0
  for width in (320,390):
   page.set_viewport_size({'width':width,'height':760})
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+3'),width
   assert page.locator('#drawer .fc-filmhub-open button').count()==1
  assert not errors,errors
  print('PASS v14.3a: film hub, lifecycle eligibility, short screening ledger, live filmography link and custom-poster integrity')
  browser.close()
finally:
 server.shutdown();server.server_close()
