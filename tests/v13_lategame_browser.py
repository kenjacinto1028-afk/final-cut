"""Browser assertions for v13 late-game UI; all art/save testing is separate."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re,shutil
ROOT=Path(__file__).resolve().parent.parent
errors=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1280,'height':900})
 page.on('pageerror',lambda e:errors.append(str(e)))
 text=(ROOT/'index.html').read_text()
 body=re.sub(r'<script.*?</script>','',text.split('<body>')[1].split('</body>')[0],flags=re.S)
 page.set_content('<html><head></head><body>'+body+'</body></html>')
 page.add_style_tag(content=(ROOT/'style.css').read_text())
 for f in ['content.js','engine.js','poster-store.js','media.js','ui.js']:
  page.add_script_tag(content=(ROOT/f).read_text())
 page.evaluate('document.dispatchEvent(new Event("DOMContentLoaded"))')
 page.evaluate('''() => {
   Engine.newGame({studioName:'Golden Lantern',homeRegion:'northamerica'});
   const s=Engine.state;s.week=(2000-1970)*52;s.cash=90000000;s.studio.tier=3;s.studio.fame=90;
   s.projects.push({id:777,title:'The Quiet Constellation',format:'feature',stage:'done',releaseWeek:52*8,startWeek:52*8-28,
    genre:'drama',topic:'smalltown',quality:88,critic:91,budget:350000,gross:1600000,revenue:650000,spent:350000,cast:{},awards:[],festResults:[],regions:['northamerica']});
   s.nextId=778;UI.go('dashboard');
 }''')
 assert page.locator('.reputation-strip').count()==1
 assert page.locator('.legacy-actions').count()==1
 page.locator('.legacy-actions summary').click()
 assert page.locator('.legacy-option-grid button').count()==4
 quote=page.evaluate('Engine.initiativeQuote("prestige")')
 assert quote['ok']
 page.get_by_role('button',name=re.compile('Invest')).first.click()
 assert page.evaluate('Engine.state.legacyPlay.initiative.id')=='prestige'
 page.locator('.legacy-actions summary').click()
 assert page.locator('.legacy-reissue-list button').count()==1
 page.locator('.legacy-reissue-list button').click()
 assert page.evaluate('Engine.state.legacyPlay.reissues.length')==1
 assert page.evaluate('Engine.getProject(777).gross')==1600000
 page.screenshot(path=str(ROOT/'tests/v13_lategame_dashboard.png'),full_page=True)
 page.evaluate("UI.go('rivals')")
 assert 'Rivalry leaderboards' in page.locator('#main').inner_text()
 page.evaluate("UI.go('score')")
 assert 'Studio legacy' in page.locator('#main').inner_text()
 page.evaluate("""() => { const s=Engine.state,c=Engine.scoreInfo();s.score={value:c.value,parts:c.parts,counts:c.counts,profit:c.profit,rank:1,year:2031,week:s.week,reason:'lock',legacyRecap:Engine.legacyRecap()};UI.go('score'); }""")
 assert 'Final studio legacy recap' in page.locator('#main').inner_text()
 assert 'The Quiet Constellation' in page.locator('#main').inner_text()
 page.evaluate("UI.go('awards')")
 assert 'Current prestige' in page.locator('#main').inner_text()
 page.set_viewport_size({'width':390,'height':844})
 page.evaluate("UI.go('dashboard')")
 page.screenshot(path=str(ROOT/'tests/v13_lategame_mobile.png'),full_page=True)
 browser.close()
assert not errors,errors
print('PASS v13 browser late-game dashboard, optional initiative, capped reissue, rivals, score and mobile')
