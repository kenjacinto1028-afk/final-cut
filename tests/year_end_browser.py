"""v13.4 year-end honors, real UI, reduced motion, SFX, saved dismissal (isolated Chromium origin)."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re, shutil
ROOT = Path(__file__).resolve().parent.parent
errors = []
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=shutil.which('chromium'), headless=True, args=['--no-sandbox','--disable-dev-shm-usage'])
    page = browser.new_page(viewport={'width':1320,'height':850})
    page.on('pageerror',lambda e:errors.append(str(e)))
    body = re.sub(r'<script.*?</script>','',(ROOT/'index.html').read_text().split('<body>')[1].split('</body>')[0], flags=re.S)
    page.set_content('<html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>'+body+'</body></html>')
    page.add_style_tag(content=(ROOT/'style.css').read_text())
    page.evaluate('''() => {
      const db=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>db.get(k)||null,setItem:(k,v)=>db.set(k,String(v)),removeItem:k=>db.delete(k)}});
    }''')
    for f in ['content.js','engine.js','poster-store.js','media.js','ui.js']:
        page.add_script_tag(content=(ROOT/f).read_text())
    page.evaluate("document.dispatchEvent(new Event('DOMContentLoaded'))")
    page.locator('#f_studio').fill('Orchid Pictures')
    page.get_by_role('button',name='Start new game').click()
    page.locator('#tutorial').get_by_role('button',name='Skip tutorial').click()
    page.evaluate('Engine.state.week=50;UI.render()')
    page.get_by_role('button',name='Next week').click()
    assert page.evaluate('Engine.dateOf().week') == 52
    assert page.locator('#year-end-awards').is_visible()
    assert page.get_by_role('heading',name='Year-End Honors').is_visible()
    assert page.locator('#year-end-awards').get_by_text('No releases this year').count()==0 # hidden until reveal
    assert page.locator('#year-end-awards [aria-modal="true"]').count()==1
    b=page.evaluate('({cash:Engine.state.cash,week:Engine.state.week,awards:Engine.state.awards.history.length})')
    page.get_by_role('button',name='Reveal the winners').click()
    assert 'No qualifying annual ceremony results' in page.locator('#year-end-awards').inner_text()
    page.wait_for_timeout(450)  # let the entry animation finish before the screenshot
    page.screenshot(path=str(ROOT/'tests/year_end_desktop.png'),full_page=True)
    page.get_by_role('button',name='Close',exact=True).click()
    assert page.locator('#year-end-awards').is_hidden()
    assert page.evaluate('Engine.state.yearEndPresented.includes(1970)')
    assert page.evaluate('({cash:Engine.state.cash,week:Engine.state.week,awards:Engine.state.awards.history.length})')==b
    page.evaluate('Engine.save();Engine.load();UI.render()')
    assert page.locator('#year-end-awards').is_hidden()
    # A pending gameplay decision always takes priority over the presentation.
    page.evaluate("""() => {Engine.state.yearEndPresented=[];Engine.state.pending={scope:'test',text:'A production question',choices:[{label:'Proceed',effects:{}}]};UI.render()}""")
    assert page.locator('#year-end-awards').is_hidden()
    assert page.locator('#modal').is_visible()
    page.evaluate('Engine.state.pending=null;UI.render()')
    assert page.locator('#year-end-awards').is_visible()
    page.get_by_role('button',name='Close',exact=True).click()
    # Likewise, the interactive first-run guide stays usable; awards appear once it ends.
    page.evaluate('Engine.state.yearEndPresented=[];UI.openTutorial();UI.render()')
    assert page.locator('#year-end-awards').is_hidden()
    page.locator('#tutorial').get_by_role('button',name='Skip tutorial').click()
    assert page.locator('#year-end-awards').is_visible()
    page.get_by_role('button',name='Close',exact=True).click()
    page.get_by_role('button',name='Next week').click()
    assert page.evaluate('Engine.dateOf().year')==1971
    page.evaluate('''() => {
      const s=Engine.state;
      s.projects.push({id:900,stage:'done',format:'feature',title:'Cobalt Dawn',genre:'drama',topic:'smalltown',releaseWeek:68,gross:820000,critic:92,awards:[],festResults:[{year:1971,festival:'Northfield International',kind:'winner',result:'International Grand Prize'}]});
      s.awards.history.push({id:'golden',year:1971,name:'The Golden Reel Awards',cats:[
        {id:'picture',name:'Best Picture',nominees:[{title:'Cobalt Dawn',studio:s.studio.name,projectId:900,filmId:'player:900',winner:true},{title:'Another Film',studio:'New Line Studio',projectId:null,winner:false}]},
        {id:'direction',name:'Best Direction',nominees:[{title:'Rival Breakthrough',studio:'Cedar Pictures',projectId:null,winner:true}]}]});
      s.week=102; UI.render();
    }''')
    page.get_by_role('button',name='Next week').click()
    assert page.evaluate('Engine.dateOf().year===1971&&Engine.dateOf().week===52')
    assert page.locator('#year-end-awards').is_visible()
    cash=page.evaluate('Engine.state.cash')
    page.evaluate('Media.setReduceMotion(true)')
    page.get_by_role('button',name='Reveal the winners').click()
    text=page.locator('#year-end-awards').inner_text()
    assert 'Cobalt Dawn' in text and 'Best Picture' in text and 'International Grand Prize' in text and 'Rival Breakthrough' in text, text
    assert page.locator('#year-end-awards').get_by_text('Your major wins').count()==1
    assert page.evaluate('getComputedStyle(document.querySelector(".year-end-card")).animationDuration')=='0s'
    page.evaluate('Media.setReduceMotion(false)')
    page.locator('#year-sound-btn').click()
    assert page.locator('#year-sound-btn').inner_text() == '♫ Sound On'
    page.evaluate('Media.setVolume(.18);Media.uiSound("navigate");Media.uiSound("reveal")')
    assert page.evaluate('Media.settings.sfx && Math.abs(Media.settings.volume-.18)<.001')
    page.set_viewport_size({'width':390,'height':730})
    box=page.locator('.year-end-card').bounding_box()
    assert box and box['width']<=390 and box['height']<=730, box
    page.wait_for_timeout(450)
    page.screenshot(path=str(ROOT/'tests/year_end_mobile.png'),full_page=True)
    page.keyboard.press('Escape')
    assert page.locator('#year-end-awards').is_hidden()
    assert page.evaluate('Engine.state.yearEndPresented.includes(1971)')
    assert page.evaluate('Engine.state.cash')==cash
    page.evaluate('Engine.save();Engine.load();UI.render()')
    assert page.locator('#year-end-awards').is_hidden()
    page.evaluate("UI.go('awards')")
    page.get_by_role('button',name='Replay 1971 Year-End Honors').click()
    assert page.locator('#year-end-awards').is_visible()
    page.get_by_role('button',name='Reveal the winners').click()
    page.get_by_role('button',name='View Awards').click()
    assert page.locator('#year-end-awards').is_hidden()
    assert 'Awards' in page.locator('#main h1').inner_text()
    # Existing save migration marks old reports seen rather than replaying history.
    page.evaluate('''() => {Engine.save();const obj=JSON.parse(localStorage.getItem('backlot_save'));delete obj.yearEndPresented;localStorage.setItem('backlot_save',JSON.stringify(obj));Engine.load();UI.render()}''')
    assert page.locator('#year-end-awards').is_hidden()
    assert page.evaluate('Engine.state.yearEndPresented.includes(1970)&&Engine.state.yearEndPresented.includes(1971)')
    assert not errors,errors
    browser.close()
print('PASS v13.4 honors: 1970 empty results, 1971 real wins/festivals/rivals, no double grants, save/reload, migration, replay, mobile, reduced motion and SFX, zero errors')
