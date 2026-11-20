# Optional visual smoke test. Requires Python Playwright and a Chromium browser.
# Injects local files to avoid requiring a web server or external connections.
from pathlib import Path
import shutil
import re
from playwright.sync_api import sync_playwright
p=Path(__file__).resolve().parent.parent; errors=[]
with sync_playwright() as pl:
 browser=pl.chromium.launch(executable_path=shutil.which('chromium') or shutil.which('google-chrome'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1440,'height':900}, device_scale_factor=1)
 page.on('pageerror',lambda exc: errors.append(str(exc)))
 html=(p/'index.html').read_text()
 body=html.split('<body>')[1].split('</body>')[0]
 body=re.sub(r'<script.*?</script>', '', body, flags=re.S)
 page.set_content('<html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>'+body+'</body></html>')
 page.add_style_tag(content=(p/'style.css').read_text())
 for s in ['content.js','engine.js','media.js','ui.js']:
  page.add_script_tag(content=(p/s).read_text())
 page.evaluate("document.dispatchEvent(new Event('DOMContentLoaded'))")
 print('loaded',page.locator('h1').all_inner_texts())
 page.get_by_role('button',name='Start new game').click()
 page.screenshot(path=str(p/'tests/browser_dashboard.png'),full_page=True)
 views=['New project','Projects','Talent','Staff & HR','Market','Awards','Finance','News','Score','Dashboard']
 metrics={}
 for v in views:
  page.locator('#nav').get_by_role('button',name=v,exact=True).click()
  metrics[v]={'title':page.locator('#main h1').first.inner_text() if page.locator('#main h1').count() else '(none)','content_length':len(page.locator('#main').inner_text())}
  if v=='New project': page.screenshot(path=str(p/'tests/browser_project.png'),full_page=True)
  if v=='Market': page.screenshot(path=str(p/'tests/browser_market.png'),full_page=True)
 print('browser views:',metrics)
 print('errors:',errors)
 for i in range(5):page.get_by_role('button',name='Next week').click()
 assert 'STUDIO WIRE' in page.locator('#main').inner_text().upper()
 page.set_viewport_size({'width':390,'height':844})
 page.screenshot(path=str(p/'tests/browser_mobile.png'),full_page=True)
 print('mobile horizontal overflow',page.evaluate('document.documentElement.scrollWidth > document.documentElement.clientWidth'))
 mobile_menu = page.get_by_role('button', name='Menu')
 assert mobile_menu.is_visible()
 mobile_menu.click()
 assert page.locator('#app').evaluate('(el) => el.classList.contains("menu-open")')
 page.locator('#nav').get_by_role('button',name='Market',exact=True).click()
 assert not page.locator('#app').evaluate('(el) => el.classList.contains("menu-open")')
 assert 'MARKET' in page.locator('#main').inner_text().upper()
 assert mobile_menu.get_attribute('aria-expanded') == 'false'
 print('mobile toggle and navigation passed')
 browser.close()
if errors: raise SystemExit('Page errors: '+'; '.join(errors))
