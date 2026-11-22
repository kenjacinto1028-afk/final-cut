"""v14.10: Next Action, active monitor, annual studio planning, save persistence."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re, shutil
ROOT=Path(__file__).resolve().parent.parent
errors=[]
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':1280,'height':850})
    page.on('pageerror',lambda e:errors.append(str(e)))
    body=re.sub(r'<script.*?</script>','',(ROOT/'index.html').read_text().split('<body>')[1].split('</body>')[0],flags=re.S)
    page.set_content('<html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>'+body+'</body></html>')
    page.evaluate("""() => {
      const db=new Map();
      Object.defineProperty(window,'localStorage',{configurable:true,value:{
        getItem:k=>db.has(k)?db.get(k):null,
        setItem:(k,v)=>db.set(k,String(v)),
        removeItem:k=>db.delete(k)
      }});
    }""")
    for css in ['style.css','theme-ab.css','design-v14_7.css','mobile-v14_9.css']:
        page.add_style_tag(content=(ROOT/css).read_text())
    for js in ['content.js','engine.js','poster-store.js','save-slots.js','media.js','design-theme-v14_7.js','ui.js']:
        page.add_script_tag(content=(ROOT/js).read_text())
    page.evaluate("document.dispatchEvent(new Event('DOMContentLoaded'))")
    page.locator('#f_studio').fill('Annual QA Studio')
    page.get_by_role('button',name='Start new game').click()
    if page.locator('#tutorial').is_visible():
        page.locator('#tutorial').get_by_role('button',name='Skip tutorial').click()
    page.evaluate("UI.go('dashboard')")
    assert page.locator('.fc-dashboard-actions button').first.inner_text()=='All caught up'
    assert page.locator('.fc-dashboard-actions button').first.is_disabled()
    page.evaluate("Engine.state.week=50; UI.render()")
    page.get_by_role('button',name='Next week').click()
    assert page.evaluate('Engine.dateOf().week')==52
    page.get_by_role('button',name='Reveal the winners').click()
    page.get_by_role('button',name='Plan Next Year').click()
    assert page.get_by_role('heading',name='Plan for 1971').is_visible()
    page.get_by_role('button',name=re.compile('Profitability')).click()
    page.get_by_role('button',name=re.compile('Prestige')).click()
    assert page.evaluate("Engine.state.yearPlans.find(p=>p.year===1970).priorities.length")==2
    page.get_by_role('button',name=re.compile('Franchises')).click()
    assert page.evaluate("Engine.state.yearPlans.find(p=>p.year===1970).priorities.length")==2
    page.locator('.fc-annual-task').first.get_by_role('button',name='Accept').click()
    assert page.evaluate("Engine.state.yearPlans[0].opportunities[0].status")=='accepted'
    page.get_by_role('button',name='Save Annual Plan').click()
    page.evaluate("UI.go('dashboard')")
    assert page.get_by_text('Annual plan',exact=False).count()>0
    page.evaluate("UI.nextAction()")
    assert page.evaluate("Engine.state.yearPlans[0].opportunities[0].reviewed")
    page.evaluate("Engine.save()")
    assert page.evaluate("Engine.load().ok")
    assert page.evaluate("Engine.state.yearPlans[0].priorities.length")==2
    page.evaluate("UI.go('studio_profile')")
    assert page.get_by_role('heading',name=re.compile('Annual Studio Strategy')).is_visible()
    assert not errors, errors
    browser.close()
print('PASS v14.10 annual planning, priority routing, and persisted decisions')
