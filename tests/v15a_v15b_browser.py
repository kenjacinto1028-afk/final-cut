"""v15a/v15b: live New Project marketing workflow and offline poster picker."""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from functools import partial
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
  page=browser.new_page(viewport={'width':1440,'height':900},reduced_motion='reduce')
  page.on('pageerror',lambda error:errors.append(str(error)))
  page.route('https://fonts.googleapis.com/**',lambda route:route.abort())
  page.route('https://fonts.gstatic.com/**',lambda route:route.abort())
  page.goto('http://127.0.0.1:%s/'%server.server_port,wait_until='domcontentloaded')
  page.evaluate("""()=>{
    Engine.newGame({studioName:'Poster QA Studio',founderName:'Test Director'});
    Engine.state.cash=1000000;
    UI.go('newproject');
  }""")
  assert page.locator('#main .fc-marketing-step').count()==1,'marketing step must be within New Project'
  step=page.locator('#main .fc-marketing-step')
  assert 'No payment now' in step.inner_text()
  step.locator('select').nth(0).select_option('small')
  step.locator('select').nth(1).select_option('genre')
  step.locator('select').nth(2).select_option('story')
  assert 'Planned opening campaign' in page.locator('.fc-marketing-preview').inner_text()
  page.locator('#main button.primary',has_text='Greenlight').last.click()
  film=page.evaluate("""()=>{
    const p=Engine.state.projects.at(-1);
    return {id:p.id,title:p.title,plan:p.marketingPlan,spend:p.marketingSpend};
  }""")
  assert film['plan']['intensity']=='small' and film['plan']['target']=='genre'
  assert film['spend']==0,'marketing should not be charged at greenlight'
  page.evaluate("""(id)=>{
    if(typeof UI.recommendationClose==='function')UI.recommendationClose();
    UI.go('projects');UI.openProject(id);UI.projectDetailSelect('details');
  }""",film['id'])
  assert page.locator('#drawer .fc-poster-studio').count()==1
  buttons=page.locator('#drawer .fc-poster-grid .poster-variant')
  assert buttons.count()==4,'four poster designs should be visible'
  designs=buttons.evaluate_all('(els)=>els.map(el=>el.querySelector("svg")?.outerHTML)')
  assert len(set(designs))==4,'four distinct illustrated layouts expected'
  buttons.first.click()
  chosen=page.evaluate("(id)=>Engine.getProject(id).posterStyleId",film['id'])
  assert 8<=chosen<=31,'selected design must be from new offline library'
  page.locator('#drawer').get_by_role('button',name='Regenerate 4 designs').click()
  after=page.evaluate("(id)=>Engine.getProject(id)",film['id'])
  assert after['posterStyleId']==chosen,'regenerating must retain chosen design'
  assert after['posterDesignBatch']==1
  page.evaluate("Engine.save();Engine.load()")
  assert page.evaluate("(id)=>Engine.getProject(id).posterDesignBatch",film['id'])==1
  svg=page.evaluate("""()=>{
    const p=Engine.state.projects.at(-1);
    return Media.posterSVG({...p,castNames:{director:'Director Example',writer:'Writer Example',lead:'Actor Example'}},{styleId:8});
  }""")
  assert 'DIRECTED BY Director Example' in svg and 'WRITTEN BY Writer Example' in svg
  assert 'STARRING Actor Example' in svg
  for width in (320,390):
   page.set_viewport_size({'width':width,'height':760})
   page.evaluate('UI.closeDrawer();UI.go("newproject")')
   assert page.locator('.fc-marketing-inputs select').count()==3
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+3'),width
   page.evaluate('(id)=>{UI.openProject(id);UI.projectDetailSelect("details");}',film['id'])
   assert page.locator('.fc-poster-grid .poster-variant').count()==4
  assert not errors,errors
  print('PASS v15a marketing planner, v15b four offline poster choices, credited artwork, regeneration, save and mobile')
  browser.close()
finally:
 server.shutdown();server.server_close()
