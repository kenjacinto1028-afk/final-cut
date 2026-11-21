"""FinalCut v14a — actual Chromium Film DNA and mobile drawer acceptance.
Uses the real browser, save storage and project/film detail UI.
"""
from pathlib import Path
from functools import partial
from threading import Thread
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parent.parent
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
URL=f'http://127.0.0.1:{server.server_port}/'
errors=[]
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  page=browser.new_page(viewport={'width':1620,'height':920})
  page.route('https://fonts.googleapis.com/**',lambda r:r.abort())
  page.route('https://fonts.gstatic.com/**',lambda r:r.abort())
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(URL,wait_until='domcontentloaded')
  result=page.evaluate("""()=>{
   Engine.newGame({studioName:'DNA Cinema',founderName:'Founder'});
   const r=Engine.startProject({title:'The Hidden Summer',format:'short',
     tier:0,genre:'horror',topic:'haunted',cast:{director:'founder',writer:'founder'}});
   if(!r.ok)throw Error(r.reason);
   UI.go('projects');UI.openProject(r.project.id);
   return {id:r.project.id,hook:r.project.filmDNA.hook};
  }""")
  drawer=page.locator('#drawer')
  assert drawer.locator('.fc-film-dna').count()==1
  assert result['hook'] in drawer.locator('.fc-film-hook').inner_text()
  for text in ['Sharp','atmosphere','Creative direction','Production story']:
   assert text.lower() in drawer.locator('.fc-film-dna').inner_text().lower(),text
  page.screenshot(path='/tmp/finalcut-v14a-project-dna.png',animations='disabled')
  records=page.evaluate("""(id)=>{
    let n=0;const film=Engine.getProject(id);
    while(film.stage!=='done'&&n++<70){
      if(Engine.state.pending)Engine.choose(Engine.state.pending.choices.length-1);
      Engine.nextTurn();
    }
    if(film.stage!=='done')throw Error('Short did not finish');
    UI.closeDrawer();UI.go('filmography');UI.openFilm('player:'+id);
    return {count:Engine.filmDNASummary(film).story.length,
      decisionCount:Engine.filmDNASummary(film).story.filter(x=>x.type==='decision').length};
  }""",result['id'])
  assert records['count']>=4,records
  assert records['decisionCount']>=1,records
  assert drawer.locator('.fc-film-story li').count()>=4
  assert 'Released with quality' in drawer.locator('.fc-film-dna').inner_text()
  page.screenshot(path='/tmp/finalcut-v14a-film-archive.png',animations='disabled')
  # The v13 autosave and campaign-specific Film DNA remain stable after reload.
  page.evaluate('Engine.save()')
  page.reload(wait_until='domcontentloaded')
  page.get_by_role('button',name='Continue',exact=False).first.click()
  assert page.evaluate('Engine.state.version')==13
  assert page.evaluate("(id)=>Engine.filmDNASummary(Engine.getProject(id)).hook",result['id'])==result['hook']
  page.set_viewport_size({'width':390,'height':800})
  page.evaluate("""(id)=>{UI.go('filmography');UI.openFilm('player:'+id)}""",result['id'])
  assert drawer.locator('.fc-film-dna').count()==1
  bounds=drawer.locator('.fc-film-dna').bounding_box()
  assert bounds['width']<=390,bounds
  page.screenshot(path='/tmp/finalcut-v14a-mobile-dna.png',animations='disabled')
  assert not errors,errors
  print('PASS v14a Chromium: Film DNA, real decision timeline, legacy v13 save schema and 390px drawer')
  browser.close()
finally:
 server.shutdown();server.server_close()
