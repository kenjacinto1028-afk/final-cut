"""Final Cut v11 browser UI smoke with in-page local storage simulation.
Navigation to local/remote URLs is blocked by this test sandbox; run full
IndexedDB/browser-persistence test manually on the deployed site.
"""
from pathlib import Path
from tempfile import TemporaryDirectory
from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright
import shutil,re
ROOT=Path(__file__).resolve().parent.parent
errors=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1365,'height':900},accept_downloads=True)
 page.on('pageerror',lambda e:errors.append(str(e)))
 body=(ROOT/'index.html').read_text().split('<body>')[1].split('</body>')[0]
 body=re.sub(r'<script.*?</script>','',body,flags=re.S)
 page.set_content('<html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>'+body+'</body></html>')
 page.add_style_tag(content=(ROOT/'style.css').read_text())
 page.evaluate('''() => {
    const saves=new Map(), posters=new Map();
    Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>saves.get(k)||null,setItem:(k,v)=>saves.set(k,String(v)),removeItem:k=>saves.delete(k)}});
    const database={objectStoreNames:{contains:()=>true},createObjectStore:()=>{},transaction:()=>{
      const tx={};tx.objectStore=()=>({
        get:(k)=>{const req={};queueMicrotask(()=>{req.result=posters.get(k);req.onsuccess?.();});return req;},
        put:(v,k)=>{posters.set(k,v);queueMicrotask(()=>tx.oncomplete?.());},
        delete:(k)=>{posters.delete(k);queueMicrotask(()=>tx.oncomplete?.());}
      });return tx;
    }};
    Object.defineProperty(window,'indexedDB',{configurable:true,value:{open:()=>{
      const req={result:database};queueMicrotask(()=>req.onsuccess?.());return req;
    }}});
 }''')
 for f in ['content.js','engine.js','poster-store.js','media.js','ui.js']:
  page.add_script_tag(content=(ROOT/f).read_text())
 page.evaluate("document.dispatchEvent(new Event('DOMContentLoaded'))")
 assert page.locator('#f_region option').count()==5
 page.locator('#f_region').select_option('europe')
 page.get_by_role('button',name='Start new game').click()
 page.locator('#tutorial').get_by_role('button', name='Skip tutorial').click()
 assert page.evaluate('Engine.state.version')>=12
 assert page.evaluate('Engine.homeRegion()')=='europe'
 # Budget-scaled optional ensemble hiring UI and director/writer-only full careers.
 page.evaluate("() => {Engine.state.cash=80000000;Engine.state.studio.tier=4;Engine.state.studio.fame=90;UI.setDraft('format','feature');UI.setDraft('tier',3)}")
 page.locator('#nav').get_by_role('button',name='New project',exact=True).click()
 assert 'Optional ensemble and specialist crew' in page.locator('#main').inner_text()
 assert 'Supporting actor' in page.locator('#main').inner_text()
 assert 'Specialist crew' in page.locator('#main').inner_text()
 artist_ids=page.evaluate("() => ({director:Engine.talent().find(t=>t.role==='director').id, writer:Engine.talent().find(t=>t.role==='writer').id, actor:Engine.talent().find(t=>t.role==='actor').id})")
 for role in ('director','writer'):
  page.evaluate('(id)=>UI.openTalent(id)',artist_ids[role])
  assert 'Full career profile' in page.locator('#drawer').inner_text()
 page.evaluate('(id)=>UI.openTalent(id)',artist_ids['actor'])
 assert 'Full career profile' not in page.locator('#drawer').inner_text()
 page.evaluate('UI.closeDrawer()')
 for page_name in ['My Filmography','World Film Archive','Film Rankings','Rivals','Awards','New project']:
  page.locator('#nav').get_by_role('button',name=page_name,exact=True).click()
  assert len(page.locator('#main').inner_text())>70,page_name
 pid=page.evaluate("""() => {
   const topic=CONTENT.TOPICS.find(t=>t.good.includes('drama')).id;
   const r=Engine.startProject({format:'short',tier:0,title:'Blue Comet',genre:'drama',topic,cast:{director:'founder',writer:'founder'}});
   if(!r.ok)throw Error(r.reason);return r.project.id;
 }""")
 page.evaluate('(id)=>UI.openProject(id)',pid)
 assert page.locator('#drawer').get_attribute('aria-hidden')=='false'
 assert page.locator('.poster-variants button').count()==3
 assert 'Distribution planning' in page.locator('#drawer').inner_text()
 page.locator('.poster-variants button').first.click()
 assert page.evaluate('(id)=>Number.isInteger(Engine.getProject(id).posterStyleId)',pid)
 with TemporaryDirectory() as tmp:
  pic=Path(tmp)/'poster.png'
  im=Image.new('RGB',(400,600),'#304875');draw=ImageDraw.Draw(im)
  draw.ellipse((80,100,320,350),fill='#f8b83e');draw.rectangle((60,400,340,520),fill='#111e34');im.save(pic)
  page.locator('#drawer input[type=file]').set_input_files(str(pic))
  page.locator('#poster-crop').wait_for(state='visible',timeout=15000)
  page.screenshot(path=str(ROOT/'tests/v12_poster_editor.png'),full_page=True)
  page.locator('#poster-editor button',has_text='Use this poster').click()
  page.wait_for_function('(id)=>Engine.getProject(id).posterCustom===true',arg=pid)
  page.wait_for_function('(id)=>!!PosterStore.url(id)',arg=pid)
  page.screenshot(path=str(ROOT/'tests/v12_custom_poster.png'),full_page=True)
  with page.expect_download() as dl:page.evaluate('UI.exportBackup()')
  saved=Path(tmp)/'backup.json';dl.value.save_as(saved)
  assert 'data:image/' in saved.read_text()
  # Simulate re-initialized module and async retrieval from the same mock DB.
  page.add_script_tag(content=(ROOT/'poster-store.js').read_text())
  page.wait_for_function('(id)=>!!PosterStore.url(id)',arg=pid)
  page.evaluate('(id)=>UI.removePoster(id)',pid)
  page.wait_for_function('(id)=>Engine.getProject(id).posterCustom===false',arg=pid)
  page.on('dialog',lambda dialog:dialog.accept())
  # Confirm import of poster JSON restores missing image.
  page.evaluate("""() => {const input=document.createElement('input');input.type='file';input.id='test-import';document.body.appendChild(input)}""")
  page.locator('#test-import').set_input_files(str(saved))
  page.evaluate("UI.importBackup(document.getElementById('test-import'))")
  page.wait_for_function('(id)=>Engine.getProject(id).posterCustom===true',arg=pid)
  page.wait_for_function('(id)=>!!PosterStore.url(id)',arg=pid)
  # A generated design must override uploaded artwork, not merely change a hidden style ID.
  page.evaluate('(id)=>UI.openProject(id)',pid)
  page.get_by_role('button',name='Generated default').click()
  page.wait_for_function('(id)=>Engine.getProject(id).posterCustom===false',arg=pid)
 page.evaluate('(id)=>UI.openProject(id)',pid)
 assert 'Distribution planning' in page.locator('#drawer').inner_text()
 page.screenshot(path=str(ROOT/'tests/v12_short_distribution.png'),full_page=True)
 page.evaluate('Media.setReduceMotion(true)')
 page.evaluate('Media.setReduceMotion(false)')
 page.evaluate('UI.closeDrawer()')
 page.set_viewport_size({'width':390,'height':844})
 page.screenshot(path=str(ROOT/'tests/v12_mobile.png'),full_page=True)
 assert page.get_by_role('button',name='Menu').is_visible()
 page.get_by_role('button',name='Menu').click()
 assert page.locator('#nav').is_visible()
 browser.close()
assert not errors, errors
print('PASS v12 browser UI: initial region, navigation, short distribution, poster styles, crop, simulated poster persistence, backup export/import, mobile, 0 JS errors')
