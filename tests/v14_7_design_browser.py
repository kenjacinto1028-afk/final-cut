"""FinalCut v14.7: prototype visual system on the real gameplay UI."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parent.parent
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
errors=[]
try:
    with sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
        context=browser.new_context(viewport={'width':1440,'height':900},reduced_motion='reduce')
        page=context.new_page()
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto('http://127.0.0.1:%s/'%server.server_port,wait_until='domcontentloaded')
        page.evaluate("""()=>{
            Engine.newGame({studioName:'Palette QA',founderName:'Designer'});
            UI.go('dashboard');
        }""")
        assert page.locator('#nav [data-palette-option]').count()==6
        assert page.locator('#nav .fc-main-nav').count()==5
        assert page.locator('.fc-wire-filters button').count()==4
        assert 'Cash runway' in page.locator('#main').inner_text()
        assert page.locator('#topbar .tb-cash').is_visible()
        assert page.locator('#nav .fc-nav-create').is_visible()
        assert page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--ds-canvas').trim()")=='#14191A'
        assert page.evaluate("getComputedStyle(document.getElementById('topbar')).backgroundColor")=='rgb(23, 29, 30)'
        assert page.evaluate('Engine.state.version')==13
        original=page.evaluate("({week:Engine.state.week,cash:Engine.state.cash,projects:Engine.state.projects.length})")
        expected={'gold':'#D4B483','sage':'#84A98C','amber':'#E09F3E','crimson':'#D96B7C','cyan':'#5BC0BE','terracotta':'#E07A5F'}
        for name,accent in expected.items():
            page.locator('#nav [data-palette-option="%s"]'%name).click()
            assert page.evaluate('DesignTheme.current()')==name
            assert page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--ds-accent').trim()")==accent
            assert page.locator('#nav [data-palette-option="%s"]'%name).get_attribute('aria-pressed')=='true'
            assert page.locator('#nav [data-active-palette]').inner_text().strip()
        assert page.evaluate("({week:Engine.state.week,cash:Engine.state.cash,projects:Engine.state.projects.length})")==original
        page.locator('.fc-wire-filters button',has_text='Market').click()
        assert page.locator('.fc-wire-filters button.is-active').inner_text()=='Market'
        page.locator('.fc-wire-filters button',has_text='All').click()
        assert page.locator('.fc-wire-filters button.is-active').inner_text()=='All'
        if not page.locator('#film-monitor').is_visible():
            page.evaluate('UI.toggleFilmMonitor()')
        assert page.locator('#film-monitor').is_visible()
        page.screenshot(path='/tmp/finalcut-v14-7-desktop.png',animations='disabled',full_page=True)
        page.reload(wait_until='domcontentloaded')
        assert page.evaluate('DesignTheme.current()')=='terracotta'
        assert page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--ds-accent').trim()")=='#E07A5F'
        page.evaluate("UI.go('dashboard')")
        for width in (390,320):
            page.set_viewport_size({'width':width,'height':780})
            page.evaluate('UI.render()')
            actual=page.evaluate('document.documentElement.scrollWidth')
            assert actual<=width+3,(width,actual)
            page.get_by_role('button',name='Menu').click()
            assert page.locator('#nav [data-palette-option]').count()==6
            page.locator('#nav [data-palette-option="gold"]').click()
            assert page.evaluate('DesignTheme.current()')=='gold'
            page.evaluate('UI.toggleMobileNav()')
            page.screenshot(path='/tmp/finalcut-v14-7-mobile-%s.png'%width,animations='disabled')
        assert not errors,errors
        print('PASS v14.7 six palettes, persistence, live studio dashboard, wire filters, monitor, desktop/mobile')
        context.close();browser.close()
finally:
    server.shutdown();server.server_close()
