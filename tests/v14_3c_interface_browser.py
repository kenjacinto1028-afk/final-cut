"""v14.3c: in-game festival confirmation, readable charts and world archive."""
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
  page=browser.new_page(viewport={'width':1400,'height':900})
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto('http://127.0.0.1:%s/'%server.server_port,wait_until='domcontentloaded')
  result=page.evaluate("""()=>{
    Engine.newGame({studioName:'Poster Arts',founderName:'Director'});
    const r=Engine.startProject({title:'The Little Film',format:'short',tier:0,genre:'drama',topic:'smalltown',
      cast:{director:'founder',writer:'founder'}});
    if(!r.ok)throw Error(r.reason);
    let count=0;
    while(r.project.stage!=='release'&&count++<90){
      if(Engine.state.pending)Engine.choose(Engine.state.pending.choices.length-1);
      else Engine.nextTurn();
    }
    if(r.project.stage!=='release')throw Error('No short released');
    // Two further screening weeks put real values into the weekly ledger.
    for(let i=0;i<2;i++){
      if(Engine.state.pending)Engine.choose(Engine.state.pending.choices.length-1);
      else Engine.nextTurn();
    }
    UI.go('projects');UI.openProject(r.project.id);
    return {id:r.project.id,year:Engine.dateOf().year};
  }""")
  page.evaluate("UI.closePremiereReport();UI.filmHubSelect('performance')")
  assert page.locator('#drawer .fc-chart-summary').count()>=1
  assert page.locator('#drawer .fc-pulse-column').count()>=2
  bar=page.locator('#drawer .fc-pulse-column').last
  bar.focus()
  assert ' · ' in page.locator('#drawer .fc-chart-selection').last.inner_text()
  assert page.locator('#drawer .fc-chart-data').count()>=1
  page.locator('#drawer .fc-chart-data').first.locator('summary').click()
  assert page.locator('#drawer .fc-chart-data table tbody tr').count()>=1
  assert page.locator('#drawer .fc-help').count()>=2
  help_button=page.locator('#drawer .fc-help button').first
  help_button.click()
  assert help_button.get_attribute('aria-expanded')=='true'
  assert page.locator('#drawer .fc-help-info:not([hidden])').count()>=1
  # Actual festival event is conditional; the modal always works when quote is eligible.
  press=page.evaluate("(id)=>Engine.shortPostReleaseQuote(id,'press')",result['id'])
  if press['ok']:
   original=page.evaluate('Engine.state.cash')
   page.evaluate("(id)=>UI.shortReleaseAction(id,'press')",result['id'])
   assert page.locator('#film-action-modal [role="dialog"]').is_visible()
   assert 'guarantee' in page.locator('#film-action-modal').inner_text().lower()
   assert '+4 merit' in page.locator('#film-action-modal').inner_text()
   page.keyboard.press('Escape')
   assert page.locator('#film-action-modal').is_hidden()
   assert page.evaluate('Engine.state.cash')==original
   page.evaluate("(id)=>UI.shortReleaseAction(id,'press')",result['id'])
   page.locator('#film-action-confirm').click()
   assert page.evaluate('Engine.state.cash')==original-press['cost']
   assert not page.evaluate("(id)=>Engine.shortPostReleaseQuote(id,'press').ok",result['id'])
  page.evaluate('UI.closeDrawer();UI.go("archive")')
  assert 'Studio receipts' in page.locator('#main .fc-finance-table table thead').first.evaluate('el=>el.textContent')
  row=page.locator('#main .fc-finance-table tbody tr',has_text='The Little Film')
  assert row.count()==1
  assert row.locator('td').nth(5).inner_text().strip()=='—','Short must not be shown as a $0 theatrical film'
  assert '$' in row.locator('td').nth(6).inner_text(),'Short studio screening receipts should be visible'
  page.evaluate('UI.go("calendar")')
  assert page.locator('.fc-v14-calendar>div').count()==12
  if page.locator('.fc-v14-rival').count():
   assert 'Feature film' in page.locator('.fc-v14-calendar').inner_text()
  for width in (320,390):
   page.set_viewport_size({'width':width,'height':780})
   for view in ('calendar','rivals','archive','projects'):
    page.evaluate('(v)=>UI.go(v)',view)
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+3'),(width,view)
  assert not errors,errors
  print('PASS v14.3c: in-game festival risk confirmation, numeric screening charts, tooltips, format-aware archives and mobile')
  browser.close()
finally:
 server.shutdown();server.server_close()
