"""v14.11: compact monitor, stage labels, film tabs, and concise help."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
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
  page=browser.new_page(viewport={'width':1440,'height':850})
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto('http://127.0.0.1:%s/'%server.server_port,wait_until='domcontentloaded')
  result=page.evaluate("""()=>{
    Engine.newGame({studioName:'Readability QA',founderName:'Director'});
    Engine.state.cash+=200000;
    const r=Engine.startProject({title:'A Quiet Summer',format:'short',genre:'romance',topic:'firstlove',tier:0,cast:{director:'founder',writer:'founder'}});
    if(!r.ok)throw Error(r.reason);
    UI.go('projects');
    return {id:r.project.id};
  }""")
  assert page.locator('.fc-center-tabs button').count()==5
  assert page.locator('.fc-stats').count()==1
  assert page.locator('.fc-stats em.fc-visually-hidden').count()==5
  assert page.locator('.fc-center').get_by_text('Production milestones').count()==0
  page.locator('.fc-center-tabs').get_by_role('button',name='Timeline').click()
  assert page.locator('.fc-center').get_by_text('Production milestones').count()==1
  page.locator('.fc-center-tabs').get_by_role('button',name='Manage').click()
  assert page.locator('.fc-film-action-row button').count()>=6
  page.locator('.fc-film-action-row').get_by_role('button',name='Budget').click()
  assert page.locator('.fc-budget-review').count()==1
  page.evaluate('(id)=>UI.openProject(id)',result['id'])
  assert page.locator('.fc-project-detail-tabs button').count()==6
  assert page.locator('#drawer').get_by_text('Current stage').count()>=1
  page.locator('.fc-project-detail-tabs').get_by_role('button',name='Manage').click()
  assert page.locator('#drawer').get_by_text('Optional budget review').count()>=1
  page.evaluate("UI.closeDrawer(); UI.go('dashboard')")
  if page.locator('#film-monitor').is_hidden(): page.evaluate("UI.toggleFilmMonitor()")
  assert page.locator('.fc-monitor-card').count()==1
  assert page.locator('.fc-monitor-status').get_by_text('Development').count()==1
  assert page.locator('.fc-monitor-expand').count()==1
  assert not page.locator('.fc-monitor-expand').evaluate('(e)=>e.open')
  assert page.locator('.fc-monitor-quick-metrics span').count()==3
  page.locator('.fc-monitor-expand summary').click()
  assert page.locator('.fc-monitor-expand').evaluate('(e)=>e.open')
  page.evaluate("UI.go('market')")
  assert page.locator('.fc-brief-explanation').count()>=1
  assert not page.locator('.fc-brief-explanation').first.evaluate('(e)=>e.open')
  page.evaluate("UI.go('rivals')")
  assert page.locator('.fc-brief-explanation').count()>=1
  page.evaluate("(id)=>{Engine.getProject(id).stage='done';UI.go('dashboard')}",result['id'])
  assert page.locator('.fc-monitor-card').count()==0
  page.set_viewport_size({'width':390,'height':820})
  page.evaluate("UI.go('projects')")
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+2'), 'horizontal overflow on mobile'
  assert not errors,errors
  browser.close()
finally:
 server.shutdown();server.server_close()
print('PASS v14.11 tabs, compact monitor and mobile readable density')
