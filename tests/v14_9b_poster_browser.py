"""v14.9b regression: custom posters are independent of source files and reload correctly."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from tempfile import TemporaryDirectory
from threading import Thread
import struct
import zlib
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *args): pass

def png(width=400,height=600):
    def chunk(name,data):
        return struct.pack('>I',len(data))+name+data+struct.pack('>I',zlib.crc32(name+data)&0xffffffff)
    raw=(b'\0'+bytes((45,130,102,255))*width)*height
    return (b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',width,height,8,6,0,0,0))+
            chunk(b'IDAT',zlib.compress(raw,9))+chunk(b'IEND',b''))

server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
errors=[]
try:
    with TemporaryDirectory(prefix='finalcut-original-poster-') as folder, sync_playwright() as pw:
        source=Path(folder)/'the-apprentice-original.png'
        source.write_bytes(png())
        browser=pw.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
        page=browser.new_page(viewport={'width':1366,'height':900},reduced_motion='reduce')
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto(f'http://127.0.0.1:{server.server_port}/',wait_until='domcontentloaded')

        film=page.evaluate("""()=>{
          Engine.newGame({studioName:'Poster Proof',founderName:'Director'});
          const r=Engine.startProject({title:'The Apprentice',format:'short',tier:0,
            genre:'drama',topic:'smalltown',cast:{director:'founder',writer:'founder'}});
          if(!r.ok)throw Error(r.reason);
          UI.go('projects');UI.openProject(r.project.id);
          return {id:r.project.id};
        }""")
        pid=film['id']
        picker=page.locator('#drawer .poster-picker input[type="file"]')
        picker.set_input_files(str(source))
        page.locator('#poster-editor').wait_for(state='visible',timeout=8000)
        page.locator('#poster-editor').get_by_role('button',name='Use this poster').click()
        page.wait_for_function('(id)=>!!Engine.getProject(id).posterCustom',arg=pid)
        assert page.evaluate('(id)=>PosterStore.missing([id]).then(x=>x.length===0)',pid)
        page.locator('#main .fc-feature-art img.poster-custom').wait_for()
        page.wait_for_function("document.querySelector('#main .fc-feature-art img.poster-custom').naturalWidth>0")
        original_url=page.locator('#main .fc-feature-art img.poster-custom').get_attribute('src')
        assert original_url.startswith('blob:')
        # Delete the actual disk file. The browser must keep its independent IndexedDB blob.
        source.unlink()
        assert not source.exists()
        page.evaluate('UI.closeDrawer();Engine.save()')
        page.reload(wait_until='domcontentloaded')
        page.evaluate("""()=>{
          const loaded=Engine.load();if(!loaded.ok)throw Error(loaded.reason);
          UI.go('projects');
        }""")
        page.locator('#main .fc-feature-art img.poster-custom').wait_for(timeout=8000)
        page.wait_for_function("document.querySelector('#main .fc-feature-art img.poster-custom').naturalWidth>0")
        assert page.locator('#main .fc-feature-art .fc-custom-poster-loading').count()==0
        assert page.evaluate('(id)=>PosterStore.missing([id]).then(x=>x.length===0)',pid)
        assert page.locator('#main .fc-feature h2').inner_text()=='The Apprentice'
        page.screenshot(path='/tmp/finalcut-v14-9b-poster-restored.png',animations='disabled')
        # Previously the featured-production poster was stuck on "Custom poster loading…".
        page.evaluate('(id)=>UI.openProject(id)',pid)
        assert page.locator('#drawer img.poster-custom').count()>=1
        page.evaluate('UI.closeDrawer()')

        # Simulate actual missing browser artwork separately from deleting the PC file.
        page.evaluate("""async (id)=>{
          const key=Engine.state.campaignId+':player:'+id;
          await new Promise((resolve,reject)=>{
            const open=indexedDB.open('finalcut-custom-posters',1);
            open.onerror=()=>reject(open.error);
            open.onsuccess=()=>{
              const db=open.result,tx=db.transaction('posters','readwrite');
              tx.objectStore('posters').delete(key);
              tx.oncomplete=()=>{db.close();resolve();};
              tx.onerror=()=>reject(tx.error);
            };
          });
          PosterStore.resetCache();UI.go('projects');
        }""",pid)
        page.locator('#main .fc-feature-art .fc-custom-poster-loading[data-fc-poster-state="missing"]').wait_for(timeout=8000)
        text=page.locator('#main .fc-feature-art .fc-custom-poster-loading').inner_text()
        assert 'Custom poster unavailable' in text and 'Re-upload' in text,text
        assert page.locator('#main .fc-feature-art img.poster-custom').count()==0
        page.screenshot(path='/tmp/finalcut-v14-9b-poster-missing.png',animations='disabled')

        # Re-uploading should clear the missing state without changing film history.
        source.write_bytes(png())
        page.evaluate('(id)=>UI.openProject(id)',pid)
        page.locator('#drawer .poster-picker input[type="file"]').set_input_files(str(source))
        page.locator('#poster-editor').get_by_role('button',name='Use this poster').click()
        page.locator('#main .fc-feature-art img.poster-custom').wait_for(timeout=8000)
        page.wait_for_function("document.querySelector('#main .fc-feature-art img.poster-custom').naturalWidth>0")
        assert page.evaluate('(id)=>PosterStore.missing([id]).then(x=>x.length===0)',pid)

        # On phone-sized layout the image stays present and the game remains scrollable.
        page.evaluate('UI.closeDrawer()')
        page.set_viewport_size({'width':390,'height':800})
        assert page.locator('#main .fc-feature-art img.poster-custom').count()==1
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+3')
        page.screenshot(path='/tmp/finalcut-v14-9b-poster-mobile.png',animations='disabled')
        assert not errors,errors
        print('PASS v14.9b source-file deletion, reload, missing-storage notice, reupload and mobile poster')
        browser.close()
finally:
    server.shutdown()
    server.server_close()
