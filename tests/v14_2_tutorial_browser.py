"""v14.3d: first-film tutorial actually guides and gates real user actions."""
from pathlib import Path
from threading import Thread
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from functools import partial
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
  context=browser.new_context(viewport={'width':1366,'height':850},reduced_motion='reduce')
  page=context.new_page()
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.route('https://fonts.googleapis.com/**',lambda route:route.abort())
  page.route('https://fonts.gstatic.com/**',lambda route:route.abort())
  page.goto('http://127.0.0.1:%s/'%server.server_port,wait_until='domcontentloaded')
  title=page.locator('#tutorial-title')
  def next_step():
   button=page.locator('#tutorial').get_by_role('button',name='Next',exact=True)
   assert button.is_enabled(),(title.inner_text(),page.locator('.tutorial-live').inner_text())
   button.click()
  def step(n,name):
   assert title.inner_text()==name,(n,title.inner_text(),name)
   assert '%d / 23'%n in page.locator('.tutorial-kicker').inner_text()
  def sidebar(section):
   # The five-section navigation uses contextual subtabs; traverse the same
   # public route as the clicked subtab rather than assuming 20 sidebar links.
   page.evaluate("(s)=>UI.go(s)",section)
  # Title preview can be skipped and does not start a campaign.
  page.get_by_role('button',name='How to play').click()
  step(1,'Welcome to your studio')
  assert page.evaluate('Engine.state===null')
  next_step();step(2,'Check your starting cash')
  page.keyboard.press('Escape')
  assert page.locator('#tutorial').is_hidden()
  # A returning player may browse guidance without mandatory greenlighting.
  page.evaluate("""()=>{
    Engine.newGame({studioName:'First Picture Studio',founderName:'Independent Producer'});
    UI.go('dashboard');UI.openTutorial();
  }""")
  page.locator('#tutorial').get_by_role('button',name='Browse feature reference').click()
  step(5,'Pick format, cast and budget')
  assert page.locator('.tutorial-live').inner_text().startswith('✓ Ready')
  page.locator('#tutorial').get_by_role('button',name='Start guided first film').click()
  step(1,'Welcome to your studio')
  # Game-state-independent introduction / cash step.
  next_step();step(2,'Check your starting cash')
  next_step();step(3,'Open New Project')
  sidebar('newproject');step(4,'Choose a screenplay')
  assert page.locator('#tutorial').get_by_role('button',name='Next',exact=True).is_disabled()
  page.locator('.fc-v14-pitches').get_by_role('button',name='Create an original').click()
  assert page.locator('#tutorial').get_by_role('button',name='Next',exact=True).is_enabled()
  next_step();step(5,'Pick format, cast and budget')
  assert page.locator('#main .form').count()>0
  next_step();step(6,'Greenlight a real film')
  assert page.locator('#tutorial').get_by_role('button',name='Next',exact=True).is_disabled()
  initial_cash=page.evaluate('Engine.state.cash')
  page.get_by_role('button',name='Greenlight',exact=True).click()
  new=page.evaluate("""()=>{
    const p=Engine.state.projects.at(-1);
    return {id:p.id,title:p.title,cash:Engine.state.cash,year:Engine.dateOf().year};
  }""")
  assert new['cash']<=initial_cash,'Upfront fees should never add free cash'
  next_step();step(7,'Go to Production Center')
  sidebar('projects');step(8,'Open its Film Hub')
  page.locator('.fc-center').get_by_role('button',name='Open project details').click()
  assert page.locator('#drawer .fc-filmhub-guide').count()==1
  next_step();step(9,'Click Next week')
  page.evaluate('UI.closeDrawer()')
  prior=page.evaluate('Engine.state.week')
  page.locator('#topbar button[data-guide="week"]').click()
  assert page.evaluate('Engine.state.week')==prior+1
  next_step();step(10,'Use Advance to next decision')
  # Resolve any opportunistic event from the first week before advancing.
  if page.evaluate('!!Engine.state.pending'):
   page.locator('#modal .choice').first.click()
  page.locator('#topbar [data-guide="advance"]').click()
  next_step();step(11,'Handle real dilemmas')
  if page.evaluate('!!Engine.state.pending'):
   assert page.locator('#tutorial .tutorial-live').inner_text().startswith('Action required')
   page.locator('#modal .choice').first.click()
  next_step();step(12,'Advance until your premiere')
  weeks=0
  while not page.evaluate('(id)=>Engine.getProject(id).releaseWeek!=null',new['id']):
   if page.evaluate('!!Engine.state.pending'):
    page.locator('#modal .choice').first.click()
   else:
    # Exercise actual Advance to next decision instead of changing the game
    # state through Engine directly.
    button=page.locator('#topbar [data-guide="advance"]')
    if button.is_enabled():
     button.click()
    else:
     page.evaluate('UI.render()')
   weeks+=1
   if weeks>75:raise AssertionError('First film never reached premiere')
  next_step();step(13,'Open release performance')
  page.evaluate('UI.go("projects")')
  page.locator('.fc-center').get_by_role('button',name='Open project details').click()
  page.evaluate("UI.filmHubSelect('performance')")
  assert page.locator('#drawer .fc-performance-board').count()>=1
  next_step();step(14,'Advance another screening week')
  page.evaluate('UI.closeDrawer()')
  if page.evaluate('(id)=>Engine.getProject(id).stage!=="done"',new['id']):
   if page.evaluate('!!Engine.state.pending'):page.locator('#modal .choice').first.click()
   page.locator('#topbar [data-guide="week"]').click()
  next_step();step(15,'Read direct profit or loss')
  page.locator('.fc-center').get_by_role('button',name='Open project details').click()
  page.evaluate("UI.filmHubSelect('performance')")
  assert 'Direct P/L' in page.locator('#drawer .fc-performance-board').inner_text()
  next_step();step(16,'Visit My Filmography')
  sidebar('filmography');step(17,'Open your released film')
  page.locator('#main .fc-finance-table tbody tr',has_text=new['title']).locator('td a').first.click()
  assert page.locator('#drawer').get_by_role('button',name='Open Film Hub',exact=False).count()==1
  next_step();step(18,"Understand a film's second life")
  assert 'normally quality 60+' in page.locator('#tutorial-description').inner_text()
  next_step();step(19,'Explore World Film Archive')
  sidebar('archive');step(20,'Compare rival release dates')
  sidebar('calendar');step(21,'Review studio identity')
  sidebar('studio_profile');step(22,'Save your career')
  sidebar('saves');step(23,'Start your next picture')
  page.locator('#tutorial').get_by_role('button',name='Finish guide').click()
  assert page.locator('#tutorial').is_hidden()
  assert page.evaluate('Engine.state.version')==13
  assert page.evaluate('Engine.state.projects.length')>=1
  assert page.evaluate('Engine.state.cash')!=initial_cash
  # Reopen, minimize and resume; keyboard must leave nonmodal tutorial.
  page.evaluate('UI.openTutorial()')
  page.locator('#tutorial').get_by_role('button',name='Minimize tutorial').click()
  assert page.locator('#tutorial .tutorial-minibar').is_visible()
  page.locator('#tutorial').get_by_role('button',name='Resume tutorial').click()
  page.locator('#tutorial').get_by_role('button',name='Next',exact=True).focus()
  page.keyboard.press('Tab')
  assert page.evaluate('!document.activeElement.closest("#tutorial")')
  page.keyboard.press('Escape')
  assert page.locator('#tutorial').is_hidden()
  # The nonmodal tutorial can finish with a legitimate new premiere report.
  page.evaluate('UI.closePremiereReport()')
  for width in (320,390):
   page.set_viewport_size({'width':width,'height':780})
   page.evaluate('UI.go("dashboard");UI.openTutorial()')
   box=page.locator('.tutorial-card').bounding_box()
   assert box and box['width']<=width and box['y']>=0,(width,box)
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+3'),width
   page.get_by_role('button',name='Menu').click()
   sidebar('dashboard')
   page.locator('#tutorial').get_by_role('button',name='Skip tutorial').click()
  assert not errors,errors
  print('PASS v14.3d real first-film tutorial: script selection, greenlight, Next week, Advance, decisions, actual premiere, profits, filmography, archive, mobile')
  context.close();browser.close()
finally:
 server.shutdown();server.server_close()
