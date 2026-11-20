"""Real Chromium IndexedDB persistence test with an HTTP origin (not mocked)."""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
from tempfile import TemporaryDirectory
from PIL import Image
from playwright.sync_api import sync_playwright
import os, shutil, functools

ROOT=Path(__file__).resolve().parents[1]
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
thread=Thread(target=server.serve_forever,daemon=True);thread.start()
url=f'http://127.0.0.1:{server.server_port}/index.html'
errors=[]
try:
 with TemporaryDirectory() as temp, sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  context=browser.new_context(viewport={'width':1200,'height':900},accept_downloads=True)
  page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(url,wait_until='domcontentloaded')
  page.locator('#f_region').select_option('europe')
  page.get_by_role('button',name='Start new game').click()
  page.locator('#tutorial').get_by_role('button', name='Skip tutorial').click()
  pid=page.evaluate("""() => {
   const topic=CONTENT.TOPICS.find(t=>t.good.includes('drama')).id;
   const r=Engine.startProject({format:'short',tier:0,title:'Origin Persistence Test',genre:'drama',topic,cast:{director:'founder',writer:'founder'}});
   if(!r.ok)throw Error(r.reason);return r.project.id;
  }""")
  page.evaluate('(id)=>UI.openProject(id)',pid)
  pic=Path(temp)/'poster.png'
  im=Image.new('RGB',(420,620),'#344966');im.save(pic)
  page.locator('#drawer input[type=file]').set_input_files(str(pic))
  page.locator('#poster-crop').wait_for(state='visible',timeout=12000)
  page.locator('#poster-editor button',has_text='Use this poster').click()
  page.wait_for_function('(id)=>Engine.getProject(id).posterCustom===true&&!!PosterStore.url(id)',arg=pid)
  original=page.evaluate('(id)=>PosterStore.url(id)',pid)
  assert original.startswith('blob:'),original
  # Real IndexedDB, same origin, fresh JavaScript heap after navigation.
  page.reload(wait_until='domcontentloaded')
  page.wait_for_function('()=>Engine.state && Engine.state.projects.length>0',timeout=10000)
  loaded=page.evaluate('(id)=>({custom:Engine.getProject(id).posterCustom,url:PosterStore.url(id)})',pid)
  if loaded['url'] is None:
   page.wait_for_function('(id)=>!!PosterStore.url(id)',arg=pid,timeout=10000)
   loaded=page.evaluate('(id)=>({custom:Engine.getProject(id).posterCustom,url:PosterStore.url(id)})',pid)
  assert loaded['custom'] and loaded['url'].startswith('blob:'),loaded
  page.evaluate('(id)=>UI.openProject(id)',pid)
  assert page.locator('#drawer .poster-custom').count()>=1
  with page.expect_download() as dl:page.evaluate('UI.exportBackup()')
  backup=Path(temp)/'save.json';dl.value.save_as(backup)
  assert 'data:image/' in backup.read_text()
  # New browser context has a new origin store. Import should restore the image.
  isolated=browser.new_context(viewport={'width':1200,'height':900},accept_downloads=True)
  page2=isolated.new_page();page2.on('pageerror',lambda e:errors.append(str(e)))
  page2.goto(url,wait_until='domcontentloaded')
  page2.evaluate("""() => {const inp=document.createElement('input');inp.type='file';inp.id='real-import';document.body.appendChild(inp)}""")
  page2.locator('#real-import').set_input_files(str(backup))
  page2.on('dialog',lambda d:d.accept())
  page2.evaluate("UI.importBackup(document.getElementById('real-import'))")
  page2.wait_for_function('(id)=>Engine.state&&Engine.getProject(id)?.posterCustom&&!!PosterStore.url(id)',arg=pid,timeout=15000)
  page2.reload(wait_until='domcontentloaded')
  page2.wait_for_function('(id)=>Engine.state&&Engine.getProject(id)?.posterCustom&&!!PosterStore.url(id)',arg=pid,timeout=15000)
  isolated.close();context.close();browser.close()
 assert not errors,errors
 print('PASS Chromium real-origin IndexedDB poster upload -> reload -> export -> fresh context import -> reload')
finally:
 server.shutdown();server.server_close()
