"""FinalCut v14.2 updated interactive tutorial: 26 navigable, non-modal steps."""
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
# Every published step is checked, including navigation to its actual page.
steps=[
 ('Welcome to Final Cut','dashboard',True),
 ('Your studio at a glance','dashboard',False),
 ('Open New Project','newproject',True),
 ('Discover scripts and film DNA','newproject',False),
 ('Trade money for script access','newproject',False),
 ('Choose your creative direction','newproject',False),
 ('Build a realistic budget','newproject',False),
 ('Cast, collaborations and sequels','newproject',False),
 ('Open Production Center','projects',True),
 ("Follow each film's story",'projects',False),
 ('Handle creative dilemmas','projects',False),
 ('Advance without micromanaging','projects',False),
 ('Study competing studios','rivals',True),
 ('Read the release calendar','rivals',False),
 ('Plan the opening strategy','projects',True),
 ('Respond after opening week','projects',False),
 ('Shorts, TV and audience reach','filmography',True),
 ('Keep films alive after release','filmography',False),
 ('Earn your company classification','studio_profile',True),
 ('Pick ambitions and delegation','studio_profile',False),
 ('Understand the new film economy','finance',True),
 ('Awards and year-end honors','awards',True),
 ('Explore industry history','archive',True),
 ('Open your Saved Games','saves',True),
 ('Save safely on desktop or phone','saves',False),
 ('Make your next movie','newproject',False)
]
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  context=browser.new_context(viewport={'width':1366,'height':900},reduced_motion='reduce')
  page=context.new_page()
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.route('https://fonts.googleapis.com/**',lambda r:r.abort())
  page.route('https://fonts.gstatic.com/**',lambda r:r.abort())
  page.goto('http://127.0.0.1:%s/'%server.server_port,wait_until='domcontentloaded')
  # Title-screen tutorial is an informational preview; it cannot mutate the studio.
  page.get_by_role('button',name='How to play').click()
  assert page.locator('#tutorial [role="complementary"]').is_visible()
  assert page.locator('.tutorial-kicker').inner_text().endswith('1 / 26')
  assert page.evaluate('Engine.state===null')
  assert not page.locator('#tutorial [aria-modal="true"]').count()
  assert page.evaluate("getComputedStyle(document.body).overflow!=='hidden'")
  page.keyboard.press('Escape')
  assert page.locator('#tutorial').is_hidden()
  page.evaluate("""() => {
    Engine.newGame({studioName:'Guide Test Studio',founderName:'Producer',homeRegion:'northamerica'});
    UI.go('dashboard'); UI.openTutorial();
  }""")
  assert page.locator('#tutorial').is_visible()
  initial=page.evaluate("""() => ({
    cash:Engine.state.cash,week:Engine.state.week,films:Engine.state.projects.length,
    releases:Engine.state.studio.releases
  })""")
  # Shortcut for existing players starts with the actual script marketplace.
  page.locator('#tutorial').get_by_role('button',name='Jump to new features').click()
  assert page.locator('#tutorial-title').inner_text()=='Discover scripts and film DNA'
  assert '4 / 26' in page.locator('.tutorial-kicker').inner_text()
  page.locator('#tutorial').get_by_role('button',name='Back').click()
  assert page.locator('#tutorial-title').inner_text()=='Open New Project'
  page.evaluate('UI.openTutorial()')
  # Guided navigation never needs a film to be produced or a budget approved.
  for i,(heading,view,visit) in enumerate(steps):
    actual=page.locator('#tutorial-title').inner_text()
    assert actual==heading,('unexpected tutorial step',i+1,actual,heading)
    assert '%d / 26'%(i+1) in page.locator('.tutorial-kicker').inner_text()
    assert page.locator('#tutorial-description').inner_text()
    assert page.locator('.tutorial-location').is_visible()
    assert not page.locator('#tutorial [aria-modal="true"]').count()
    if visit:
      # Must work through real sidebar navigation rather than forcing a next click.
      nav=page.locator('#nav [data-view="%s"]'%view)
      assert nav.is_visible(),('missing linked navigation',heading)
      assert nav.evaluate("e=>e.classList.contains('tutorial-target')"),('link not highlighted',heading)
      nav.click()
    else:
      # If on another view, Open section must navigate without advancing.
      open_button=page.locator('#tutorial .tutorial-actions button').filter(has_text='Open ')
      if open_button.count():
        open_button.click()
        assert page.locator('#tutorial-title').inner_text()==heading
      if i==6:
        # The film planner remains fully usable while the guide is open.
        assert page.locator('#main .form').count()>0
        assert page.locator('#main select').count()>0
      if i==19:
        assert page.locator('#main .fc-v14-profile-section').count()>0
      if i==13:
        assert page.locator('#main .fc-v14-calendar').count()>0
      if i==24:
        assert page.locator('#main .fc-save-list').count()>0
        assert 'NOT automatically sync' in page.locator('#tutorial-description').inner_text()
      if i<25:page.locator('#tutorial').get_by_role('button',name='Next',exact=True).click()
  assert page.locator('#tutorial-title').inner_text()=='Make your next movie'
  page.locator('#tutorial').get_by_role('button',name='Finish · Plan a film').click()
  assert page.locator('#tutorial').is_hidden()
  assert 'New project' in page.locator('.crumb').inner_text()
  after=page.evaluate("""() => ({
    cash:Engine.state.cash,week:Engine.state.week,films:Engine.state.projects.length,
    releases:Engine.state.studio.releases
  })""")
  assert initial==after,('guide spent money or advanced game',initial,after)
  assert not page.locator('.tutorial-target').count()
  # Reopen, minimize, resume and keyboard exit; no keyboard trap.
  page.evaluate('UI.openTutorial()')
  page.locator('#tutorial').get_by_role('button',name='Minimize tutorial').click()
  assert page.locator('.tutorial-minibar').is_visible()
  page.locator('#tutorial').get_by_role('button',name='Resume tutorial').click()
  assert page.locator('#tutorial-title').inner_text()==steps[0][0]
  page.locator('#tutorial').get_by_role('button',name='Next',exact=True).focus()
  page.keyboard.press('Tab')
  assert page.evaluate("document.activeElement.closest('#tutorial')===null"),'Tutorial trapped Tab'
  page.keyboard.press('Escape')
  assert page.locator('#tutorial').is_hidden()
  # 320px and 390px responsive phone widths, menu link remains clickable.
  for width in (320,390):
    page.set_viewport_size({'width':width,'height':780})
    page.evaluate('UI.go("dashboard");UI.openTutorial()')
    guide=page.locator('.tutorial-card').bounding_box()
    assert guide and guide['width']<=width and guide['y']>=0,('guide off phone screen',width,guide)
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+3'),('horizontal overflow',width)
    assert page.locator('#mobile-nav-toggle').evaluate("el=>el.classList.contains('tutorial-target')")
    page.get_by_role('button',name='Menu').click()
    page.locator('#nav [data-view="dashboard"]').click()
    assert page.locator('#tutorial-title').inner_text()==steps[1][0]
    page.locator('#tutorial').get_by_role('button',name='Skip tutorial').click()
    assert page.locator('#tutorial').is_hidden()
  assert not errors,errors
  print('PASS FinalCut tutorial: 26 current steps, v14.1 balance, v14.2 saves, page navigation, no spend, preview, shortcut, accessibility, 320/390px mobile')
  context.close();browser.close()
finally:
 server.shutdown();server.server_close()
