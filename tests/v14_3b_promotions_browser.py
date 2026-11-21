"""v14.3b UI promotion, sponsor and critic journey in Chromium."""
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
  page=browser.new_page(viewport={'width':1366,'height':850})
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto('http://127.0.0.1:%s/'%server.server_port,wait_until='domcontentloaded')
  data=page.evaluate("""()=>{
    Engine.newGame({studioName:'Campaign Cinema',founderName:'A Producer'});
    const r=Engine.startProject({title:'Harbor Lights',format:'short',tier:0,genre:'drama',
     topic:'smalltown',cast:{director:'founder',writer:'founder'}});
    if(!r.ok)throw Error(r.reason);
    UI.go('projects');UI.openProject(r.project.id);
    return {id:r.project.id};
  }""")
  assert page.locator('#drawer .fc-film-promotion').count()==1
  assert 'No sponsor approaches yet' in page.locator('#drawer .fc-film-promotion').inner_text()
  assert page.locator('#drawer .fc-film-promotion button:not([disabled])').count()>=1
  page.once('dialog',lambda d:d.accept())
  page.locator('#drawer .fc-film-promotion button:not([disabled])').first.click()
  assert page.evaluate('(id)=>!!Engine.getProject(id).promotionCampaign',data['id'])
  page.evaluate("""(id)=>{
    Engine.state.studio.fame=25;
    Engine.state.reputation.buzz=35;
    Engine.state.reputation.currentPrestige=12;
    UI.openProject(id);
  }""",data['id'])
  assert page.locator('#drawer .fc-sponsor-offer').count()==1
  page.once('dialog',lambda d:d.accept())
  page.locator('#drawer .fc-sponsor-offer').get_by_role('button',name='Accept partnership').click()
  assert page.evaluate('(id)=>!!Engine.getProject(id).sponsor',data['id'])
  outcome=page.evaluate("""(id)=>{
    const f=Engine.getProject(id);let n=0;
    while(f.stage!=='release'&&n++<90){
      if(Engine.state.pending)Engine.choose(Engine.state.pending.choices.length-1);
      else Engine.nextTurn();
    }
    UI.closeDrawer();UI.go('filmography');
    const film=Engine.filmHistory().find(x=>x.projectId===id);
    UI.openFilm(film.id);
    return {stage:f.stage,reviews:f.pressReviews.length};
  }""",data['id'])
  assert outcome['stage']=='release'
  assert outcome['reviews']>=1
  page.evaluate("UI.filmHubSelect('reviews')")
  assert page.locator('#drawer .fc-film-review-list article').count()==outcome['reviews']
  assert 'Local Critic' in page.locator('#drawer .fc-film-press').inner_text() or 'Regional Critic' in page.locator('#drawer .fc-film-press').inner_text()
  for width in (320,390):
   page.set_viewport_size({'width':width,'height':810})
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+3'),width
  assert not errors,errors
  print('PASS v14.3b: pre-release promotion, gated sponsors, individual critic reviews, mobile')
  browser.close()
finally:
 server.shutdown();server.server_close()
