"""v14.8: Studio Wire, real trends, quiet-week stop, film timeline and saved filters."""
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
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
  page=browser.new_page(viewport={'width':1440,'height':850})
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto('http://127.0.0.1:%s/'%server.server_port,wait_until='domcontentloaded')
  page.evaluate("""()=>{
    Engine.newGame({studioName:'QoL QA',founderName:'Director'});
    UI.go('dashboard');
  }""")
  assert page.locator('.fc-wire-tabs button').count()==3
  assert page.locator('.fc-qol-notifications').count()==1
  assert page.get_by_role('button',name='Next Action').count()>=1
  assert page.get_by_role('button',name='Skip Quiet Weeks').count()>=1
  before=page.evaluate("JSON.stringify(Engine.state.market)")
  page.locator('.fc-wire-tabs').get_by_role('button',name='Market Trends').click()
  assert page.locator('.fc-wire-empty').is_visible()
  assert page.evaluate("JSON.stringify(Engine.state.market)")==before
  page.locator('.fc-wire-trend-kind').get_by_role('button',name='Topics').click()
  assert page.locator('.fc-wire-trend-kind button.is-active').inner_text()=='Topics'
  page.locator('.fc-wire-tabs').get_by_role('button',name='Rival Releases').click()
  assert page.locator('.studio-wire').get_by_role('button',name='Full Rivals Calendar').count()==1
  page.locator('.fc-wire-tabs').get_by_role('button',name='News').click()
  assert page.locator('.fc-wire-filters').count()>=1
  page.get_by_role('button',name='Skip Quiet Weeks').click()
  week=page.evaluate('Engine.state.week')
  assert 0<=week<=8,week
  # Existing world models should remain playable: create one real short and follow its lifecycle.
  project=page.evaluate("""()=>{
    const r=Engine.startProject({title:'An Unfinished Journey',format:'short',tier:0,
       genre:'drama',topic:'smalltown',cast:{director:'founder',writer:'founder'}});
    if(!r.ok)throw Error(r.reason);
    UI.go('dashboard');return r.project.id;
  }""")
  page.evaluate('(id)=>UI.openProject(id)',project)
  assert 'Film Timeline' in page.locator('#drawer').inner_text()
  page.evaluate('UI.closeDrawer();UI.go("newproject")')
  assert 'Release Conflict Check' in page.locator('#main').inner_text()
  page.evaluate('UI.go("filmography");UI.setFilmFilter("genre","horror");UI.go("market");UI.go("filmography")')
  assert page.locator('.archive-filters select').count()>=2
  assert page.evaluate('document.querySelector(".archive-filters").innerText.includes("Genre")')
  assert page.locator('#main select').filter(has=page.locator('option[value="horror"]')).count()>=1
  page.evaluate('UI.resetMyFilmographyFilters()')
  assert page.evaluate('document.querySelector(".archive-filters select").value')=='all'
  page.evaluate('UI.go("dashboard")')
  page.evaluate("""(id)=>{
    let p=Engine.getProject(id),n=0;
    while(p.stage!=='done'&&n++<105){
       if(Engine.state.pending)Engine.choose(Engine.state.pending.choices.length-1);
       else Engine.nextTurn();
    }
    if(p.stage!=='done')throw Error('film did not complete');
    Engine.state.premierePresented.push(p.id);
    Engine.state.endRunPresented.push(p.id);
    UI.render();
  }""",project)
  page.evaluate('(id)=>UI.openProject(id)',project)
  assert 'Release Postmortem' in page.locator('#drawer').inner_text()
  page.evaluate('UI.closeDrawer();UI.go("filmography")')
  assert 'Understanding the numbers' in page.locator('#main').inner_text()
  page.evaluate('UI.go("dashboard");UI.setWireTab("trends")')
  assert page.locator('.fc-wire-trend-kind').count()==1
  assert 'TOP RISING' in page.locator('.studio-wire').inner_text()
  for width in (390,320):
   page.set_viewport_size({'width':width,'height':800})
   page.evaluate('UI.render()')
   assert page.evaluate('document.documentElement.scrollWidth')<=width+4
  assert not errors,errors
  print('PASS v14.8 studio tabs, non-mutating trend data, skip weeks, timeline, draft conflicts, filters, film postmortem and mobile')
  browser.close()
finally:
 server.shutdown();server.server_close()
