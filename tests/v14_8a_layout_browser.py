"""v14.8a screenshot-driven Dashboard classification and Studio Wire placement."""
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
        page=browser.new_page(viewport={'width':1440,'height':900},reduced_motion='reduce')
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto('http://127.0.0.1:%s/'%server.server_port,wait_until='domcontentloaded')
        page.evaluate("""()=>{
            Engine.newGame({studioName:'Layout QA',founderName:'Tester'});
            UI.go('dashboard');
            if(document.getElementById('app').classList.contains('monitor-open'))UI.toggleFilmMonitor();
        }""")
        assert page.locator('.fc-dashboard-identity-card').count()==1
        assert page.locator('.fc-v14-dashboard-identity').count()==0
        assert page.locator('.fc-dashboard-identity-label').inner_text()=='Developing identity'
        assert page.locator('.fc-dashboard-identity-card details').count()==0
        assert page.locator('.fc-dashboard-identity-link').count()==1
        assert page.locator('.studio-wire .fc-wire-tabs button').count()==3
        # The redesigned card must use the same palette tokens as the rest of the game.
        for color in ('sage','cyan','gold'):
            page.evaluate('(color)=>DesignTheme.set(color)',color)
            assert page.evaluate('DesignTheme.current()')==color
            assert page.locator('.fc-dashboard-identity-card').count()==1
        def check_identity(max_height=114):
            card=page.locator('.fc-dashboard-identity-card').bounding_box()
            btn=page.locator('.fc-dashboard-identity-link').bounding_box()
            assert card['height']<=max_height,card
            assert card['x']-1<=btn['x'] and btn['x']+btn['width']<=card['x']+card['width']+1,(card,btn)
            assert card['y']-1<=btn['y'] and btn['y']+btn['height']<=card['y']+card['height']+1,(card,btn)
        def check_side():
            left=page.locator('.dashboard-primary').bounding_box()
            right=page.locator('.studio-wire').bounding_box()
            assert right['x']>left['x']+left['width']-3,(left,right)
            assert abs(right['y']-left['y'])<=5,(left,right)
        def check_stack():
            left=page.locator('.dashboard-primary').bounding_box()
            right=page.locator('.studio-wire').bounding_box()
            assert right['y']>=left['y']+left['height']-5,(left,right)
        check_identity()
        check_side()
        page.screenshot(path='/tmp/finalcut-v14-8a-desktop.png',animations='disabled',full_page=True)
        # Button stays correctly aligned and opens detailed classification.
        page.locator('.fc-dashboard-identity-link').click()
        assert page.locator('#main .fc-v14-identity details').count()==1
        assert 'What earned this classification?' in page.locator('#main').inner_text()
        page.evaluate("UI.go('dashboard');document.getElementById('content').scrollTop=0;window.scrollTo(0,0)")
        check_identity()
        page.set_viewport_size({'width':1200,'height':880})
        check_side()
        check_identity()
        page.screenshot(path='/tmp/finalcut-v14-8a-laptop.png',animations='disabled')
        # Right-hand live monitor may be open; keep the wire beside the main
        # dashboard where room permits and stack where space is constrained.
        page.set_viewport_size({'width':1440,'height':900})
        page.evaluate('UI.toggleFilmMonitor()')
        check_side()
        check_identity()
        page.screenshot(path='/tmp/finalcut-v14-8a-monitor.png',animations='disabled')
        page.set_viewport_size({'width':1200,'height':880})
        check_stack()
        page.evaluate('UI.toggleFilmMonitor()')
        check_side()
        # A narrower viewport intentionally stacks Wire under the dashboard.
        page.set_viewport_size({'width':1024,'height':850})
        check_stack()
        for width in (390,320):
            page.set_viewport_size({'width':width,'height':800})
            page.evaluate('UI.render()')
            check_identity(180)
            check_stack()
            actual=page.evaluate('document.documentElement.scrollWidth')
            assert actual<=width+3,(width,actual)
            assert page.locator('.studio-wire .fc-wire-tabs button').count()==3
            page.screenshot(path='/tmp/finalcut-v14-8a-mobile-%s.png'%width,animations='disabled')
        assert not errors,errors
        print('PASS v14.8a compact identity, in-card button, Studio Wire side/stack, monitor and mobile')
        browser.close()
finally:
    server.shutdown();server.server_close()
