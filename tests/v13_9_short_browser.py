"""Playwright acceptance: live quality/hype, short weekly receipts, estimated
screening visits, festival afterlife and reversible mobile dock in actual game.
"""
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parent.parent
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{server.server_port}/'
errors=[]
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  page=browser.new_page(viewport={'width':1810,'height':920})
  page.route('https://fonts.googleapis.com/**',lambda r:r.abort())
  page.route('https://fonts.gstatic.com/**',lambda r:r.abort())
  page.on('pageerror',lambda error:errors.append(str(error)))
  page.goto(url,wait_until='domcontentloaded')
  assert page.evaluate('Engine.TUNING.shortScreening.maxWeeks')==12
  result=page.evaluate("""()=>{
     Engine.newGame({studioName:'Short Screening Test',founderName:'Young Producer'});
     const r=Engine.startProject({title:'Olden Family',format:'short',tier:0,genre:'drama',topic:'smalltown',
       cast:{director:'founder',writer:'founder'}});
     if(!r.ok)throw Error(r.reason);
     let i=0;
     while(r.project.stage!=='release'&&i++<80){
       if(Engine.state.pending)Engine.choose(Engine.state.pending.choices.length-1);
       Engine.nextTurn();
     }
     if(r.project.stage!=='release')throw Error('Short not released');
     UI.go('projects');
     return {id:r.project.id,run:r.project.shortRunWeeks,quality:r.project.quality,hype:r.project.hype};
  }""")
  assert 3<=result['run']<=12,result
  assert page.locator('#film-monitor').is_visible()
  dock=page.locator('#film-monitor')
  card=dock.locator('.fc-monitor-card',has_text='Olden Family')
  assert card.count()==1
  assert 'Quality' in card.inner_text() and 'Hype' in card.inner_text()
  assert 'screening visits' in card.inner_text()
  assert page.locator('.fc-center .fc-performance-board').count()==1
  board=page.locator('.fc-center .fc-performance-board')
  for phrase in ['Film quality','Release hype','Est. screening visits','FESTIVAL EXPOSURE',
                 'Weekly estimated screening visits','Weekly studio receipts']:
    assert phrase in board.inner_text(),phrase
  page.screenshot(path='/tmp/finalcut-v13_9-screening-desktop.png',animations='disabled')
  # Weekly receipts in real source rows, rather than a single festival lump.
  perweek=page.evaluate("""(id)=>{
    const film=Engine.getProject(id),weeks=[];
    while(film.stage==='release'){
      if(Engine.state.pending)Engine.choose(Engine.state.pending.choices.length-1);
      const before=film.revenue,wk=Engine.state.week;
      Engine.nextTurn();
      if(Engine.state.week!==wk)weeks.push(film.revenue-before);
      if(weeks.length>12)throw Error('Run exceeded maximum');
    }
    UI.go('projects');
    return {weeks,total:film.shortRunTarget,collected:film.shortRunCollected,
      visits:Engine.shortAudience(film),status:Engine.shortFestivalStatus(film)};
  }""",result['id'])
  assert perweek['total']==perweek['collected'],perweek
  assert perweek['visits']>0
  assert sum(perweek['weeks'])>0
  assert len(perweek['weeks'])>=result['run']-1  # opening week may have already run
  assert page.locator('.fc-short-festivals').count()>=1
  assert 'After-release opportunities' in page.locator('.fc-center').inner_text()
  assert page.locator('.fc-film-health').count()>=1
  page.screenshot(path='/tmp/finalcut-v13_9-festival-afterlife.png',animations='disabled')
  quote=page.evaluate("(id)=>Engine.shortPostReleaseQuote(id,'press')",result['id'])
  if quote['ok']:
   current=page.evaluate('Engine.state.cash')
   # In-game film campaign dialog replaces native browser confirm.
   page.evaluate('UI.closePremiereReport()')
   page.locator('.fc-center .fc-short-choice',has_text='festival press kit').get_by_role('button').click()
   assert page.locator('#film-action-modal [role="dialog"]').is_visible()
   page.locator('#film-action-confirm').click()
   page.wait_for_function("(id)=>!!Engine.getProject(id).shortFestivalPressKit",arg=result['id'])
   assert page.evaluate('Engine.state.cash')==current-quote['cost']
   assert page.evaluate("(id)=>Engine.shortPostReleaseQuote(id,'press').ok",result['id'])==False
  # Force a fully acclaimed title to exercise the eligibility rule for a
  # separate four-week encore; game still books the costs and real receipts.
  page.evaluate("(id)=>{Engine.getProject(id).quality=80;UI.go('projects')}",result['id'])
  encore=page.evaluate("(id)=>Engine.shortPostReleaseQuote(id,'encore')",result['id'])
  assert encore['ok'],encore
  # In-game film campaign dialog replaces native browser confirm.
  page.locator('.fc-center .fc-short-choice',has_text='encore screenings').get_by_role('button').click()
  assert page.locator('#film-action-modal [role="dialog"]').is_visible()
  page.locator('#film-action-confirm').click()
  page.wait_for_function("(id)=>!!Engine.getProject(id).shortEncore",arg=result['id'])
  total=page.evaluate("(id)=>Engine.getProject(id).revenue",result['id'])
  after=page.evaluate("""(id)=>{
    const f=Engine.getProject(id);
    for(let i=0;i<4;i++){
      if(Engine.state.pending)Engine.choose(Engine.state.pending.choices.length-1);
      Engine.nextTurn();
    }
    UI.go('filmography');
    return {difference:f.revenue,paid:f.shortEncore.paid,visits:Engine.shortAudience(f)};
  }""",result['id'])
  assert after['difference']-total==encore['total'],(after,total,encore)
  assert after['paid']==encore['total']
  assert after['visits']>perweek['visits']
  table=page.locator('.fc-finance-table')
  assert table.get_by_role('columnheader',name='Reach (est.)').count()==1
  row=table.locator('tbody tr',has_text='Olden Family')
  assert row.count()==1 and 'visits' in row.inner_text()
  assert 'Quality' in row.inner_text() and 'Hype' in row.inner_text()
  page.screenshot(path='/tmp/finalcut-v13_9-filmography.png',animations='disabled')
  # Save and reload the same campaign without upgrading the v13 format.
  page.evaluate('Engine.save()')
  page.reload(wait_until='domcontentloaded')
  page.get_by_role('button',name='Continue',exact=False).first.click()
  page.wait_for_function("(id)=>!!Engine.getProject(id)",arg=result['id'])
  assert page.evaluate('Engine.state.version')==13
  assert page.evaluate("(id)=>Engine.getProject(id).shortEncore.paid",result['id'])==encore['total']
  # Small screens can close/open the right-side monitor and still use the game.
  page.set_viewport_size({'width':390,'height':800})
  page.evaluate("UI.go('projects')")
  if page.locator('#film-monitor').is_visible():page.evaluate('UI.toggleFilmMonitor()')
  size=page.evaluate('({doc:document.documentElement.scrollWidth,w:innerWidth})')
  assert size['doc']<=size['w']+2,size
  page.get_by_role('button',name='Show project monitor').click()
  assert page.locator('#film-monitor').is_visible()
  assert 'screening visits' in page.locator('#film-monitor').inner_text()
  page.screenshot(path='/tmp/finalcut-v13_9-mobile-monitor.png',animations='disabled')
  page.get_by_role('button',name='Collapse project monitor').click()
  assert not page.locator('#film-monitor').is_visible()
  assert not errors,errors
  print('PASS v13.9 live browser: quality/hype, weekly short receipts, festival opportunities, encore, audience reach, Filmography and mobile')
  browser.close()
finally:
 server.shutdown();server.server_close()
