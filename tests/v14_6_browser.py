"""FinalCut v14.6 critical end-to-end UI checks: release lifecycle, fans and navigation."""
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from functools import partial
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
errors=[]
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  page=browser.new_page(viewport={'width':1366,'height':840})
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto('http://127.0.0.1:%s/'%server.server_port,wait_until='domcontentloaded')
  data=page.evaluate(""" + """"" + """() => {
    Engine.newGame({studioName:'Followers Test Studio',founderName:'Founder'});
    UI.go('dashboard');UI.openTutorial();
    const r=Engine.startProject({title:'The Quiet Letter',format:'short',tier:0,
      genre:'drama',topic:'smalltown',cast:{director:'founder',writer:'founder'}});
    if(!r.ok)throw Error(r.reason);
    const p=r.project;let n=0;
    while(p.releaseWeek==null&&n++<90) {
      if(Engine.state.pending)Engine.choose(Engine.state.pending.choices.length-1);
      else Engine.nextTurn();
    }
    if(p.releaseWeek==null)throw Error('no premiere');
    UI.render();
    return {id:p.id,stage:p.stage};
  }""" + """"" + """)
  assert page.locator('#premiere-report').is_visible(),'premiere must appear while tour is active'
  assert 'PREMIERE REPORT' in page.locator('#premiere-report').inner_text()
  assert page.locator('#tutorial').is_visible()
  page.locator('#premiere-report').get_by_role('button',name='Close & continue').click()
  page.evaluate('UI.closeTutorial()')
  page.evaluate('UI.go("projects");UI.toggleFilmMonitor(true)')
  # Monitor directly exposes project details while screening is ongoing.
  assert page.locator('#film-monitor').get_by_role('button',name='Project Details · Film Hub').count()>=1
  page.evaluate(""" + """"" + """(id)=>{
    const p=Engine.getProject(id);let n=0;
    while(p.stage!=='done'&&n++<90){
      if(Engine.state.pending)Engine.choose(Engine.state.pending.choices.length-1);
      else Engine.nextTurn();
    }
    if(p.stage!=='done')throw Error('release did not end');
    UI.render();
  }""" + """"" + """,data['id'])
  assert 'RELEASE WRAP-UP' in page.locator('#premiere-report').inner_text()
  page.locator('#premiere-report').get_by_role('button',name='Close & continue').click()
  page.evaluate('UI.go("rankings");UI.setFilmFilter("genre","horror");UI.go("filmography")')
  assert page.locator('#main').get_by_text('The Quiet Letter').count()>=1,'player film must not be hidden by Industry filters'
  page.evaluate('(id)=>UI.openProject(id)',data['id'])
  assert 'followers' in page.locator('#drawer').inner_text().lower()
  page.evaluate('UI.closeDrawer();UI.go("studio_profile")')
  assert 'Studio following' in page.locator('#main').inner_text()
  # In-game confirmation is cancelable and does not silently execute.
  page.evaluate('void UI.clearLeaderboard()')
  assert page.locator('.fc-game-dialog').is_visible()
  assert page.locator('.fc-game-dialog').get_by_role('button',name='Cancel').count()==1
  page.locator('.fc-game-dialog [data-no]').click()
  assert not page.locator('.fc-game-dialog').count()
  assert not errors,errors
  print('PASS v14.6 immediate premiere during tour, run wrap-up, Filmography, fans and in-game confirmation')
  browser.close()
finally:
 server.shutdown();server.server_close()
