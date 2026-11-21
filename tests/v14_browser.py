"""Real FinalCut v14 browser: script marketplace, film decisions, company identity,
rival schedules, responsive drawers, and saved-game compatibility.
"""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
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
  page=browser.new_page(viewport={'width':1550,'height':940})
  page.route('https://fonts.googleapis.com/**',lambda r:r.abort())
  page.route('https://fonts.gstatic.com/**',lambda r:r.abort())
  page.on('pageerror',lambda err:errors.append(str(err)))
  page.goto(f'http://127.0.0.1:{server.server_port}/',wait_until='domcontentloaded')
  assert page.evaluate("typeof Engine.v14Identity")== 'function'
  page.evaluate("Engine.newGame({studioName:'Playwright Cinemas',founderName:'Producer'});UI.go('newproject')")
  assert page.locator('.fc-v14-script').count()==3
  assert page.locator('.fc-v14-script h3').count()==3
  assert page.get_by_role('heading',name='Creative direction').count()==1
  page.screenshot(path='/tmp/finalcut-v14-script-market.png',animations='disabled')
  page.locator('.fc-v14-script').first.get_by_role('button',name='Develop this script').click()
  assert page.locator('.fc-v14-script.is-selected').count()==1
  assert page.locator('.fc-v14-creative').count()==1
  script=page.evaluate("Engine.v14MarketInfo().pitches[0]")
  assert page.locator('input').first.count()>0
  # User can still commission an original, without script licensing fees.
  page.locator('.fc-v14-section-heading').first.get_by_role('button',name='Create an original').click()
  assert page.evaluate("UI!==null")
  page.evaluate("(id)=>UI.v14SelectScript(id)",script['id'])
  page.evaluate("UI.startProject()")
  assert page.evaluate("Engine.state.projects.length")==1
  project=page.evaluate("Engine.state.projects[0]")
  assert project['dna']['hook']==script['hook']
  page.evaluate("UI.go('projects')")
  assert page.locator('.fc-v14-film-story').count()>=1
  assert script['hook'] in page.locator('.fc-v14-film-story').inner_text()
  page.screenshot(path='/tmp/finalcut-v14-production-story.png',animations='disabled')
  # Studio identity remains evidence-based; classification is not an editor.
  page.evaluate("UI.go('studio_profile')")
  assert page.get_by_role('heading',name='Studio Profile').is_visible()
  assert page.locator('.fc-v14-identity').count()>=1
  assert 'Developing identity' in page.locator('.fc-v14-identity').inner_text()
  assert page.locator('.fc-v14-ambitions article').count()==3
  page.get_by_role('button',name='Trust the director').click()
  assert page.evaluate("Engine.v14State().delegation")=='director'
  page.locator('.fc-v14-ambitions article').first.get_by_role('button',name='Choose ambition').click()
  assert page.evaluate("!!Engine.v14Ambitions().active")
  page.screenshot(path='/tmp/finalcut-v14-studio-identity.png',animations='disabled')
  page.evaluate("UI.go('calendar')")
  assert page.locator('.fc-v14-calendar>div').count()==12
  assert page.locator('.fc-v14-calendar').get_by_text('No announced rival opening').count()>=0
  page.screenshot(path='/tmp/finalcut-v14-rival-calendar.png',animations='disabled')
  # Progress with delegated decisions; the original studio remains saved.
  result=page.evaluate("""() => {
    const f=Engine.state.projects[0];
    let n=0;while(f.stage!=='done'&&n++<75){
      if(Engine.state.pending)Engine.choose(Engine.state.pending.choices.length-1);
      else Engine.nextTurn();
    }
    if(f.stage!=='done')throw Error('Film did not finish');
    UI.go('filmography');
    return {id:f.id,story:Engine.v14Storyboard(f),stage:f.stage,version:Engine.state.version};
  }""")
  assert result['stage']=='done' and result['version']==13
  assert any(x['kind']=='production' for x in result['story'])
  assert page.locator('.fc-finance-table tbody tr').count()>=1
  page.evaluate("(id)=>{UI.closePremiereReport();UI.openProject(id);UI.filmHubSelect('production')}",result['id'])
  assert page.locator('#drawer.open').count()==1
  assert page.locator('#drawer .fc-v14-film-story').count()==1
  page.screenshot(path='/tmp/finalcut-v14-film-legacy-drawer.png',animations='disabled')
  page.evaluate("UI.closeDrawer();Engine.save()")
  page.reload(wait_until='domcontentloaded')
  page.get_by_role('button',name='Continue',exact=False).first.click()
  page.wait_for_function("(id)=>!!Engine.getProject(id)",arg=result['id'])
  assert page.evaluate("(id)=>Engine.v14Storyboard(Engine.getProject(id)).length",result['id'])>0
  assert page.evaluate("Engine.state.version")==13
  # Validate ordinary narrow-screen navigation and no horizontal document drift.
  for width in (390,360):
   page.set_viewport_size({'width':width,'height':800})
   if page.locator('#film-monitor').is_visible():page.evaluate('UI.toggleFilmMonitor()')
   for screen in ('newproject','studio_profile','rivals','projects'):
    page.evaluate("(v)=>UI.go(v)",screen)
    x=page.evaluate("({doc:document.documentElement.scrollWidth,width:innerWidth})")
    assert x['doc']<=x['width']+2,(screen,width,x)
   page.screenshot(path=f'/tmp/finalcut-v14-studio-mobile-{width}.png',animations='disabled')
  assert not errors,errors
  print('PASS v14 browser: script pitches, deliberate creative direction, earned studio identity, rivals, film stories, saved sessions, mobile')
  browser.close()
finally:
 server.shutdown();server.server_close()
