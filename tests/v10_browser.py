"""V10 browser integration smoke: run `python tests/v10_browser.py`."""
from pathlib import Path
import re, shutil
from playwright.sync_api import sync_playwright
p=Path(__file__).resolve().parent.parent
errors=[]
with sync_playwright() as pl:
    browser=pl.chromium.launch(executable_path=shutil.which('chromium') or shutil.which('google-chrome'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':1440,'height':900})
    page.on('pageerror',lambda exc: errors.append(str(exc)))
    body=(p/'index.html').read_text().split('<body>')[1].split('</body>')[0]
    body=re.sub(r'<script.*?</script>', '',body,flags=re.S)
    page.set_content('<html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>'+body+'</body></html>')
    page.add_style_tag(content=(p/'style.css').read_text())
    for f in ['content.js','engine.js','media.js','ui.js']:
        page.add_script_tag(content=(p/f).read_text())
    page.evaluate("document.dispatchEvent(new Event('DOMContentLoaded'))")
    assert page.locator('#f_region option').count()==5
    page.locator('#f_region').select_option('asiapacific')
    page.get_by_role('button',name='Start new game').click()
    assert page.evaluate('Engine.homeRegion()')=='asiapacific'
    assert page.evaluate('Engine.activeRivals().length')==6
    screens={'My Filmography':'My Filmography','World Film Archive':'World Film Archive','Film Rankings':'Film Rankings','Rivals':'Rivals','Awards':'Awards','New project':'New project'}
    for button,title in screens.items():
        page.locator('#nav').get_by_role('button',name=button,exact=True).click()
        assert title.lower() in page.locator('#main h1').first.inner_text().lower(),button
        assert len(page.locator('#main').inner_text())>90,button
    page.locator('#nav').get_by_role('button',name='My Filmography',exact=True).click()
    assert page.get_by_role('button',name='My Rankings').count()>0
    page.get_by_role('button',name='My Rankings').click()
    assert 'Ranking' in page.locator('#main').inner_text()
    page.locator('#nav').get_by_role('button',name='Film Rankings',exact=True).click()
    assert page.locator('select').count()>=6
    # Populate real player/AI films and inspect the clickable history drawer.
    page.evaluate("""() => {
      const E=Engine, s=E.state;
      s.studio.tier=1; s.studio.fame=35; s.cash=1500000;
      const topic=CONTENT.TOPICS.find(t=>t.good.includes('drama')).id;
      const r=E.startProject({format:'feature',tier:0,title:'Sea of Memories',genre:'drama',topic,cast:{director:'founder',writer:'founder'}});
      if(!r.ok)throw Error('Cannot greenlight sample: '+r.reason);
      E.setDistribution(r.project.id,['asiapacific','europe']);
      for(let i=0;i<140 && r.project.stage!=='done' && !s.gameOver;i++){
        while(s.pending) E.choose(s.pending.id==='regions' ? s.pending.choices.length-1 : 0);
        E.nextTurn();
      }
      if(r.project.stage!=='done')throw Error('film did not finish');
    }""")
    page.evaluate('UI.render()')
    page.locator('#nav').get_by_role('button',name='My Filmography',exact=True).click()
    page.get_by_role('button',name='All My Films').click()
    page.get_by_role('link',name='Sea of Memories').first.click()
    assert page.locator('#drawer').get_attribute('aria-hidden')=='false'
    detail=page.locator('#drawer').inner_text()
    for expected in ('Sea of Memories','Europe','Cast and crew','Performance'):
        assert expected.lower() in detail.lower(),(expected,detail[:450])
    page.evaluate('UI.closeDrawer()')
    page.get_by_role('button',name='My Rankings').click()
    assert 'Sea of Memories' in page.locator('#main').inner_text()
    page.locator('#nav').get_by_role('button',name='World Film Archive',exact=True).click()
    assert page.locator('#main a').count()>0
    page.locator('#nav').get_by_role('button',name='Film Rankings',exact=True).click()
    assert page.locator('#main a').count()>0
    page.screenshot(path=str(p/'tests/v10_film_rankings.png'),full_page=True)
    page.set_viewport_size({'width':390,'height':844})
    page.screenshot(path=str(p/'tests/v10_mobile_archive.png'),full_page=True)
    assert page.get_by_role('button',name='Menu').is_visible()
    page.get_by_role('button',name='Menu').click()
    page.locator('#nav').get_by_role('button',name='My Filmography',exact=True).click()
    assert not page.locator('#app').evaluate('(el) => el.classList.contains("menu-open")')
    print('V10 browser: 6 new screens + selected home region + actual film details + rankings + mobile navigation passed')
    print('JS errors:',errors)
    browser.close()
assert not errors,errors
