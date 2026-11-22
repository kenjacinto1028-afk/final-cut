"""Final Cut v15 living-world actual-browser walkthrough: desktop, 390px, 320px."""
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
  page=browser.new_page(viewport={'width':1420,'height':900},reduced_motion='reduce')
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.route('https://fonts.googleapis.com/**',lambda r:r.abort())
  page.route('https://fonts.gstatic.com/**',lambda r:r.abort())
  page.goto('http://127.0.0.1:%s/'%server.server_port,wait_until='domcontentloaded')
  page.evaluate("""()=>{
    Engine.newGame({studioName:'Living World Browser QA',founderName:'Sam Tester'});
    Engine.state.cash=10000000;
    Engine.state.studio.fame=75;
    Engine.state.studio.tier=3;
    UI.go('rivals');
  }""")
  assert page.locator('#main').get_by_text('Ambition',exact=True).count()>=1
  assert page.locator('#main').get_by_text('Rivalry',exact=True).count()>=1
  page.locator('#main table tbody tr').first.click()
  assert 'Personality' in page.locator('#main').inner_text()
  assert 'Yearly ambition' in page.locator('#main').inner_text()
  page.evaluate("""()=>{
    UI.go('talent');
    UI.openTalent(Engine.talent()[0].id);
  }""")
  text=page.locator('#drawer').inner_text()
  assert 'Career ambition' in text and 'Age and stage' in text
  page.evaluate('UI.closeDrawer()')
  film=page.evaluate("""()=>{
    const input={title:'The Living Audience',format:'feature',tier:0,genre:'drama',topic:'smalltown',
      cast:{director:'founder',writer:'founder'},marketingPlan:{intensity:'small',target:'genre',message:'story'}};
    const r=Engine.startProject(input);if(!r.ok)throw Error(r.reason);
    const p=r.project;
    p.stage='done';p.releaseWeek=76;p.quality=85;p.critic=83;p.audience=88;
    p.hype=70;p.gross=400000;p.estimatedAdmissions=Engine.admissionsFromGross(p.gross,p.releaseWeek);p.revenue=110000;p.result='Hit';
    Engine.state.week=104;
    Engine.save();
    UI.openProject(p.id);
    return p.id;
  }""")
  assert page.locator('#drawer').get_by_text('Audience community',exact=True).count()>=1
  assert 'Host fan screening' in page.locator('#drawer').inner_text()
  page.evaluate('UI.closeDrawer()')
  created=page.evaluate("""()=>{
    Math.random=()=>0;
    Engine.v15OpportunityTick();
    UI.go('news');
    return Engine.v15ActiveOffers().map(x=>x.id);
  }""")
  assert created,'eligible feature should receive an offer'
  assert page.locator('#main .fc-opportunities .fc-opportunity').count()>=1
  assert page.locator('#main .fc-opportunity').first.get_by_role('button',name='Counteroffer (may fail)').count()>=1
  page.evaluate('(id)=>{Engine.v15OfferAction(id,"accept");UI.go("news");}',created[0])
  assert page.locator('#main').get_by_text('Recent outcomes',exact=False).count()>=1
  assert 'Print, radio and television' in page.locator('#main .fc-media-culture').inner_text()
  media=page.evaluate("""(id)=>{
    const p=Engine.getProject(id);
    Engine.state.week=52*45+12;
    p.releaseWeek=Engine.state.week-30;
    const advanced=Engine.nextTurn();
    UI.go('news');
    return {advanced,feed:Engine.v15MediaFeed()};
  }""",film)
  assert media['advanced'] and media['feed'],'era-gated public conversation should occur'
  assert media['feed'][0]['era']=='social'
  assert 'Social platforms and influencers' in page.locator('.fc-media-culture').inner_text()
  assert page.locator('#main').get_by_role('button',name='Fund response',exact=False).count()>=1
  for width in (390,320):
   page.set_viewport_size({'width':width,'height':780})
   page.evaluate('UI.go("news")')
   assert page.locator('.fc-media-culture').count()==1
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+3'),('news',width)
   page.evaluate('UI.go("rivals")')
   assert page.get_by_text('Ambition',exact=True).count()>=1
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+3'),('rivals',width)
  assert not errors,errors
  print('PASS v15c-h rival ambition, artist careers, Film Hub fans, real offers, chronological media and mobile')
  browser.close()
finally:
 server.shutdown();server.server_close()
