"""v14.5 release report, contextual navigation, Film Hub and mobile layout."""
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
  page=browser.new_page(viewport={'width':1366,'height':840})
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto('http://127.0.0.1:%s/'%server.server_port,wait_until='domcontentloaded')
  data=page.evaluate("""() => {
    Engine.newGame({studioName:'Release Studio',founderName:'Founder'});
    UI.go('dashboard');
    const r=Engine.startProject({title:'A Film That Travels',format:'short',tier:0,
      genre:'drama',topic:'smalltown',cast:{director:'founder',writer:'founder'}});
    if(!r.ok)throw Error(r.reason);
    const p=r.project;
    let n=0;while(p.releaseWeek==null&&n++<90){
      if(Engine.state.pending)Engine.choose(Engine.state.pending.choices.length-1);
      else Engine.nextTurn();
    }
    if(p.releaseWeek==null)throw Error('no premiere');
    UI.go('projects');
    return {id:p.id,reportLength:p.pressReviews.length};
  }""")
  assert page.locator('#nav .fc-main-nav').count()==5
  assert page.locator('#premiere-report').is_visible()
  assert 'Release reach' in page.locator('#premiere-report').inner_text()
  assert 'What the critics say' in page.locator('#premiere-report').inner_text()
  assert data['reportLength']>=1
  page.locator('#premiere-report').get_by_role('button',name='Close & continue').click()
  assert not page.locator('#premiere-report').is_visible()
  assert page.evaluate('(id)=>Engine.state.premierePresented.includes(id)',data['id'])
  page.evaluate('(id)=>UI.openProject(id)',data['id'])
  assert page.locator('#drawer .fc-hub-tabs button').count()==6
  assert page.locator('#drawer .fc-filmhub-guide').count()==1
  page.locator('#drawer .fc-hub-tabs').get_by_role('button',name='Reviews').click()
  assert page.locator('#drawer .fc-film-review-list article').count()>=1
  assert 'Critic' in page.locator('#drawer .fc-film-review-list').inner_text()
  page.locator('#drawer .fc-hub-tabs').get_by_role('button',name='Reach & Rankings').click()
  assert 'North America' in page.locator('#drawer .fc-hub-panel').inner_text()
  page.locator('#drawer .fc-hub-tabs').get_by_role('button',name='Performance').click()
  assert page.locator('#drawer .fc-performance-board').count()==1
  page.evaluate("UI.closeDrawer();UI.go('calendar')")
  assert page.locator('#main .fc-v14-calendar').count()==1
  page.evaluate("UI.go('rankings')")
  assert page.locator('#main .archive-filters').count()==1
  assert page.locator('#main .archive-filters select').count()>=6
  for width in (320,390):
   page.set_viewport_size({'width':width,'height':760})
   page.evaluate("UI.go('filmography')")
   size=page.evaluate("({page:document.documentElement.scrollWidth,viewport:innerWidth})")
   assert size['page']<=size['viewport']+3,(width,size)
   page.evaluate("UI.go('dashboard')")
   page.locator('#mobile-nav-toggle').click()
   assert page.locator('#nav').is_visible()
   page.locator('#nav [data-section="industry"]').click()
   assert not page.locator('#nav').is_visible()
   assert page.locator('#main .fc-section-tabs button').count()>=4
  assert not errors,errors
  print('PASS v14.5 premiere dialog, saved dismissal, six-tab Film Hub, reviews, market chart filters, mobile navigation')
  browser.close()
finally:
 server.shutdown();server.server_close()
