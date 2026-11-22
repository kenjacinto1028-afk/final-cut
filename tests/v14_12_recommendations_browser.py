"""v14.12 recommended actions: real greenlight, stage-aware offers, persistence, mobile."""
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
errors=[]
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  page=browser.new_page(viewport={'width':1280,'height':850})
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(f'http://127.0.0.1:{server.server_port}/',wait_until='domcontentloaded')
  page.evaluate("""()=>{
    Engine.newGame({studioName:'Recommendation Test',founderName:'Director'});
    Engine.state.cash+=750000;
    UI.go('newproject');
  }""")
  page.locator('.fc-v14-pitches').get_by_role('button',name='Create an original').click()
  page.get_by_role('button',name='Greenlight',exact=True).click()
  assert page.locator('#fc-greenlight-recommendations [role="dialog"]').is_visible()
  assert page.locator('#fc-greenlight-recommendations .fc-recommendation-item').count()>=1
  assert page.locator('#fc-greenlight-recommendations .fc-recommendation-item').count()<=3
  film=page.evaluate('Engine.state.projects.at(-1).id')
  # First recommendation is grounded in an actual eligible film action.
  original=page.evaluate('(id)=>UI.recommendationItems(Engine.getProject(id))',film)
  assert 1<=len(original)<=3,original
  assert all(x['reason'] and x['tradeoff'] and x['action'] for x in original)
  # Recommendations are advisory and never spend or sign on the player's behalf.
  cash=page.evaluate('Engine.state.cash')
  page.evaluate('(id)=>{UI.recommendationItems(Engine.getProject(id)); UI.render()}',film)
  assert page.evaluate('Engine.state.cash')==cash
  page.set_viewport_size({'width':390,'height':780})
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+2')
  bounds=page.locator('.fc-recommendation-dialog').bounding_box()
  assert bounds['width']<=390 and bounds['x']>=0,bounds
  page.locator('#fc-greenlight-recommendations .fc-recommendation-item button').first.click()
  assert page.locator('#fc-greenlight-recommendations').is_hidden()
  assert page.locator('#drawer.open').count()==1
  assert page.locator('#drawer .fc-film-action-row').count()==1
  assert page.evaluate('Engine.state.cash')==cash, 'Review navigation must not automatically purchase an action'
  # Dismissal is scoped to this film and stage and survives normal saves.
  page.evaluate('UI.closeDrawer()')
  before=page.evaluate('(id)=>UI.recommendationItems(Engine.getProject(id))',film)
  assert before
  selected=before[0]['id']
  page.evaluate('([id,item])=>UI.recommendationDismiss(id,item,false)',[film,selected])
  assert not any(x['id']==selected for x in page.evaluate('(id)=>UI.recommendationItems(Engine.getProject(id))',film))
  page.evaluate('Engine.save()')
  assert page.evaluate('Engine.load().ok')
  assert not any(x['id']==selected for x in page.evaluate('(id)=>UI.recommendationItems(Engine.getProject(id))',film))
  # Snooze should expire at the real in-game week, not calendar time.
  remain=page.evaluate('(id)=>UI.recommendationItems(Engine.getProject(id))',film)
  if remain:
   second=remain[0]['id']
   page.evaluate('([id,item])=>UI.recommendationDismiss(id,item,true)',[film,second])
   assert not any(x['id']==second for x in page.evaluate('(id)=>UI.recommendationItems(Engine.getProject(id))',film))
   page.evaluate('Engine.state.week+=4')
   assert any(x['id']==second for x in page.evaluate('(id)=>UI.recommendationItems(Engine.getProject(id))',film))
  # Later release-stage logic must not keep offering prerelease marketing.
  page.evaluate("""(id)=>{
    const p=Engine.getProject(id);
    p.stage='release';p.releaseWeek=Engine.state.week-1;
    p.weeksInRelease=1;p.hype=22;p.quality=71;p.critic=65;
    UI.go('projects');
  }""",film)
  release=page.evaluate('(id)=>UI.recommendationItems(Engine.getProject(id))',film)
  assert all(x['action'] in ('festivals','performance','promotions') for x in release),release
  page.evaluate("""(id)=>{
    const p=Engine.getProject(id);p.stage='done';p.result='Hit';
    UI.go('filmography');
  }""",film)
  catalog=page.evaluate('(id)=>UI.recommendationItems(Engine.getProject(id))',film)
  assert any(x['id']=='continuation' for x in catalog),catalog
  assert all(x['action'] in ('legacy','festivals') for x in catalog)
  # A project without an eligible catalog opportunity shows an empty list.
  page.evaluate("""(id)=>{
    const p=Engine.getProject(id);
    p.releaseWeek=null;p.result='';p.quality=12;p.critic=10;p.audience=10;
  }""",film)
  assert page.evaluate('(id)=>UI.recommendationItems(Engine.getProject(id))',film)==[]
  # Even after many simulated weeks, recommendations never create repeated
  # interrupting popups. The advisory system is evaluated on demand.
  page.evaluate("""()=>{
    for(let i=0;i<520;i++){
      Engine.state.week++;
      UI.go(i%2?'dashboard':'projects');
    }
  }""")
  assert page.locator('#fc-greenlight-recommendations').is_hidden()
  assert not errors,errors
  browser.close()
finally:
 server.shutdown();server.server_close()
print('PASS v14.12 greenlight prompt, direct actions, stage-aware suggestions, mobile and save persistence')
