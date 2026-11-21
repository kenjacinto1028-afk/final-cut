"""Real Chromium visual smoke for FinalCut v13.8 performance monitoring.
Captures actual in-game UI, not a generated mockup.
"""
from pathlib import Path
from functools import partial
from threading import Thread
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parent.parent
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
URL=f'http://127.0.0.1:{server.server_port}/'
errors=[]
try:
 with sync_playwright() as play:
  browser=play.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  page=browser.new_page(viewport={'width':1830,'height':1020})
  page.route('https://fonts.googleapis.com/**',lambda r:r.abort())
  page.route('https://fonts.gstatic.com/**',lambda r:r.abort())
  page.on('pageerror',lambda err:errors.append(str(err)))
  page.goto(URL,wait_until='domcontentloaded')
  assert page.evaluate('typeof Engine.projectPulse')=='function'
  assert page.evaluate('typeof UI.toggleFilmMonitor')=='function'
  page.evaluate("Engine.newGame({studioName:'Performance Studio',founderName:'Producer'});UI.render()")
  assert page.locator('#film-monitor').is_visible()
  assert page.locator('#film-monitor').get_by_role('heading',name='Project monitor').count()==1
  # Real feature: shorts have $0 theatrical gross but nonzero screening receipts.
  page.evaluate("""()=>{
   const p=Engine.startProject({title:'Little Festival Film',format:'short',tier:0,genre:'drama',topic:'smalltown',cast:{director:'founder',writer:'founder'}});
   if(!p.ok)throw Error(p.reason);
   let n=0;while(p.project.stage!=='done' && n++<60){
      if(Engine.state.pending)Engine.choose(Engine.state.pending.choices.length-1);
      Engine.nextTurn();
   }
   if(p.project.stage!=='done')throw Error('short never finished');
   UI.go('filmography');
  }""")
  assert page.locator('h1',has_text='My Filmography').count()==1
  table=page.locator('.fc-finance-table')
  assert table.get_by_role('columnheader',name='Box office').count()==1
  assert table.get_by_role('columnheader',name='Studio receipts').count()==1
  assert table.get_by_role('columnheader',name='Profit / loss').count()==1
  row=table.locator('tbody tr',has_text='Little Festival Film').first
  assert row.count()==1
  assert '—' in row.inner_text()
  assert page.evaluate("Engine.state.projects[0].revenue")>0
  assert page.evaluate("Engine.state.projects[0].gross")==0
  assert page.locator('.fc-film-financial-strip').is_visible()
  page.screenshot(path='/tmp/finalcut-v13_8-filmography.png',animations='disabled',full_page=False)
  # Actual feature release, weekly tickets and an optional post-opening action.
  result=page.evaluate("""()=>{
    Engine.state.studio.tier=3;Engine.state.studio.fame=85;Engine.state.cash=5000000;
    const f=Engine.startProject({title:'Cinema Rising',format:'feature',tier:1,genre:'drama',topic:'smalltown',cast:{director:'founder',writer:'founder'}});
    if(!f.ok)throw Error(f.reason);
    let i=0;
    while((f.project.stage!=='release'||f.project.weeksInRelease<1)&&i++<90){
      if(Engine.state.pending)Engine.choose(Engine.state.pending.choices.length-1);
      Engine.nextTurn();
    }
    if(f.project.stage!=='release'||f.project.weeksInRelease<1)throw Error('Theaters did not open');
    // Event timing can leave a legitimate decision modal open. Resolve it
    // before testing the clickable release controls, as a player would.
    let choices=0;while(Engine.state.pending&&choices++<12)
      Engine.choose(Engine.state.pending.choices.length-1);
    UI.go('dashboard');
    return {id:f.project.id,gross:f.project.gross,tickets:Engine.filmAdmissions(f.project)};
  }""")
  assert result['gross']>0 and result['tickets']>0,result
  assert page.locator('#film-monitor').is_visible()
  assert page.locator('.fc-monitor-card').count()>=1
  assert page.locator('#film-monitor').get_by_text('Cinema Rising').count()==1
  bounds=page.evaluate("""()=>{
    const m=document.getElementById('main').getBoundingClientRect();
    const d=document.getElementById('film-monitor').getBoundingClientRect();
    return {mainRight:m.right,dockLeft:d.left};
  }""")
  assert bounds['mainRight']<=bounds['dockLeft']+2,bounds
  page.screenshot(path='/tmp/finalcut-v13_8-dock-desktop.png',animations='disabled')
  card=page.locator('.fc-monitor-card',has_text='Cinema Rising')
  assert card.locator('.fc-pulse-chart').count()==1
  assert 'admissions' in card.inner_text()
  # Promotional action should be optional and charged exactly once.
  quote=page.evaluate("(id)=>Engine.releasePushQuote(id)",result['id'])
  assert quote['ok'],quote
  money_before=page.evaluate("Engine.state.cash")
  page.once('dialog',lambda dialog:dialog.accept())
  card.get_by_role('button',name='Invest').click()
  page.wait_for_function('(id)=>!!Engine.getProject(id).releasePush',arg=result['id'])
  assert page.evaluate('Engine.state.cash')==money_before-quote['cost']
  assert page.evaluate('(id)=>Engine.releasePushQuote(id).ok',result['id'])==False
  # Studio film drawer: weekly graph and modeled audience; on top of the dock.
  page.locator('.fc-monitor-card',has_text='Cinema Rising').get_by_role('button',name='Cinema Rising').click()
  assert page.locator('#drawer.open').count()==1
  page.evaluate("UI.closePremiereReport();UI.filmHubSelect('performance')")
  assert page.locator('#drawer .fc-performance-board').count()==1
  layers=page.evaluate("""()=>{
     const drawer=parseInt(getComputedStyle(document.getElementById('drawer')).zIndex);
     const monitor=parseInt(getComputedStyle(document.getElementById('film-monitor')).zIndex);
     return {drawer,monitor};
  }""")
  assert layers['drawer']>layers['monitor'],layers
  page.screenshot(path='/tmp/finalcut-v13_8-film-details.png',animations='disabled',full_page=False)
  page.evaluate('UI.closeDrawer();UI.go("projects")')
  assert page.locator('.fc-center .fc-performance-board').count()==1
  assert page.locator('.fc-performance-metrics').count()>=1
  page.screenshot(path='/tmp/finalcut-v13_8-production-center.png',animations='disabled')
  # New data remains in the v13 autosave after browser reload.
  page.evaluate('Engine.save()')
  page.reload(wait_until='domcontentloaded')
  page.get_by_role('button',name='Continue',exact=False).first.click()
  page.wait_for_function("(id)=>!!Engine.getProject(id)",arg=result['id'])
  assert page.evaluate("(id)=>Engine.filmAdmissions(Engine.getProject(id))",result['id'])>0
  assert page.evaluate("(id)=>Engine.projectPulse(Engine.getProject(id)).history.length",result['id'])>0
  # Responsive monitor: closed view stays within viewport, open dock is reversible.
  page.set_viewport_size({'width':390,'height':800})
  page.evaluate("UI.go('filmography')")
  if page.locator('#film-monitor').is_visible():page.evaluate('UI.toggleFilmMonitor()')
  assert not page.locator('#film-monitor').is_visible()
  scroll=page.evaluate('({width:document.documentElement.scrollWidth,viewport:innerWidth})')
  assert scroll['width']<=scroll['viewport']+2,scroll
  page.get_by_role('button',name='Show project monitor').click()
  assert page.locator('#film-monitor').is_visible()
  dock=page.locator('#film-monitor').bounding_box()
  assert dock['width']<=392,dock
  page.screenshot(path='/tmp/finalcut-v13_8-dock-mobile.png',animations='disabled')
  page.get_by_role('button',name='Collapse project monitor').click()
  assert not page.locator('#film-monitor').is_visible()
  assert not errors,errors
  print('PASS v13.8 browser: filmography receipts, simulated theatrical reach, live monitor, promotion, details and mobile')
  browser.close()
finally:
 server.shutdown();server.server_close()
