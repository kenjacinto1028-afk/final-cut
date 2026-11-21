"""FinalCut v14.9: phone-first title/dashboard/navigation and desktop non-regression."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *args): pass

server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Quiet, directory=str(ROOT)))
Thread(target=server.serve_forever, daemon=True).start()
errors=[]
try:
    with sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
        for width in (320, 390, 768):
            page=browser.new_page(viewport={'width':width,'height':800},
                                  is_mobile=True,has_touch=True,device_scale_factor=2,
                                  reduced_motion='reduce')
            page.on('pageerror',lambda e:errors.append(str(e)))
            page.goto('http://127.0.0.1:%s/'%server.server_port,wait_until='domcontentloaded')
            assert page.locator('#main h1').inner_text()=='Final Cut'
            assert not page.locator('#mobile-bottom-nav').is_visible()
            assert page.locator('.fc-mobile-header').is_hidden()
            assert page.locator('#f_studio').is_visible()
            assert page.locator('#f_region').is_visible()
            titlewidth=page.locator('#main').bounding_box()['width']
            assert titlewidth >= width*.95, (width,titlewidth)
            assert page.locator('#f_studio').bounding_box()['width']>= width*.76
            assert page.evaluate('document.documentElement.scrollWidth')<=width+3
            page.screenshot(path='/tmp/finalcut-v14-9-title-%s.png'%width,animations='disabled')

            page.evaluate("""()=>{
              Engine.newGame({studioName:'Phone QA',founderName:'Tester'});
              UI.go('dashboard');
            }""")
            assert page.locator('#mobile-bottom-nav').is_visible()
            assert page.locator('#nav').is_hidden()
            assert page.locator('#mobile-bottom-nav button[aria-current="page"]').count()==1
            assert page.locator('#mobile-bottom-nav button[aria-current="page"]').get_attribute('data-mobile-section')=='overview'
            assert page.locator('.studio-wire .fc-wire-tabs button').count()==3
            assert page.locator('.fc-dashboard-actions button').count()==4
            assert page.locator('#topbar [data-guide="week"]').is_visible()
            assert page.locator('#topbar [data-guide="advance"]').is_visible()
            assert page.locator('#mobile-nav-toggle').bounding_box()['height']>=44
            assert page.locator('#mobile-bottom-nav button').first.bounding_box()['height']>=44
            assert page.locator('#main').bounding_box()['width'] >= width*.95
            assert page.evaluate('document.documentElement.scrollWidth')<=width+3, (width,'dashboard overflow')
            assert float(page.evaluate('parseFloat(getComputedStyle(document.body).fontSize)'))>=14
            page.screenshot(path='/tmp/finalcut-v14-9-dashboard-%s.png'%width,full_page=True,animations='disabled')

            page.locator('#mobile-bottom-nav [data-mobile-section="productions"]').click()
            assert page.locator('#mobile-bottom-nav [data-mobile-section="productions"]').get_attribute('aria-current')=='page'
            assert page.locator('#main .fc-section-tabs').count()==1
            assert page.evaluate('document.documentElement.scrollWidth')<=width+3, (width,'production overflow')
            page.locator('#mobile-nav-toggle').click()
            assert page.locator('#nav').is_visible()
            assert page.locator('#mobile-nav-toggle').get_attribute('aria-expanded')=='true'
            assert page.locator('#nav .fc-menu-close').is_visible()
            page.locator('#nav [data-view="newproject"]').click()
            assert page.locator('#nav').is_hidden()
            assert page.locator('#mobile-nav-toggle').get_attribute('aria-expanded')=='false'
            assert page.locator('#mobile-bottom-nav [data-mobile-section="productions"]').get_attribute('aria-current')=='page'
            page.locator('#mobile-bottom-nav [data-mobile-section="history"]').click()
            assert page.locator('#mobile-bottom-nav [data-mobile-section="history"]').get_attribute('aria-current')=='page'
            page.locator('#mobile-nav-toggle').click()
            page.keyboard.press('Escape')
            assert page.locator('#nav').is_hidden()
            page.screenshot(path='/tmp/finalcut-v14-9-history-%s.png'%width,animations='disabled')
            page.close()

        desktop=browser.new_page(viewport={'width':1440,'height':900},reduced_motion='reduce')
        desktop.on('pageerror',lambda e:errors.append(str(e)))
        desktop.goto('http://127.0.0.1:%s/'%server.server_port,wait_until='domcontentloaded')
        desktop.evaluate("()=>{Engine.newGame({studioName:'Desktop QA',founderName:'Tester'});UI.go('dashboard')}")
        assert desktop.locator('#mobile-bottom-nav').is_hidden()
        assert desktop.locator('.fc-mobile-header').is_hidden()
        assert desktop.locator('#nav').is_visible()
        assert desktop.locator('.dashboard-layout').evaluate('(el)=>getComputedStyle(el).gridTemplateColumns').count('px')>=2
        assert desktop.evaluate('document.documentElement.scrollWidth')<=1443
        desktop.screenshot(path='/tmp/finalcut-v14-9-desktop.png',animations='disabled')
        desktop.close()
        assert not errors,errors
        print('PASS v14.9 phone title, responsive dashboard, bottom nav, menu, desktop and 320/390/768 viewports')
        browser.close()
finally:
    server.shutdown()
    server.server_close()
