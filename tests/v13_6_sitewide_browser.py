"""FinalCut v13.6: visual/system smoke in Chromium (screens, controls, mobile).

Loads source directly as v13 browser tests do, without requiring network fonts or
remote IndexedDB. Screenshots are CI artifacts, not fictional mockups.
"""
from pathlib import Path
import re, os
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parent.parent
ART=Path(os.environ.get("FINALCUT_UI_SHOTS","/tmp/finalcut-ab-ui-screenshots"))
ART.mkdir(parents=True,exist_ok=True)
errors=[]
screens=["dashboard","projects","newproject","filmography","tv","founder","log",
         "talent","roster","staff","finance","market","rivals","news",
         "archive","rankings","awards","score"]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,args=["--no-sandbox","--disable-dev-shm-usage"])
    page=browser.new_page(viewport={"width":1440,"height":920},device_scale_factor=1)
    page.on("pageerror",lambda err: errors.append(str(err)))
    html=(ROOT/"index.html").read_text()
    assert '<link rel="stylesheet" href="theme-ab.css">' in html
    body=html.split("<body>")[1].split("</body>")[0]
    body=re.sub(r"<script.*?</script>","",body,flags=re.S)
    page.set_content('<html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>'+body+"</body></html>")
    for css in ("style.css","theme-ab.css"): page.add_style_tag(content=(ROOT/css).read_text())
    page.evaluate("""() => {
      const entries=new Map();
      Object.defineProperty(window,'localStorage',{configurable:true,value:{
        getItem:k=>entries.get(k)||null,setItem:(k,v)=>entries.set(k,String(v)),removeItem:k=>entries.delete(k)
      }});
    }""")
    for script in ("content.js","engine.js","poster-store.js","media.js","ui.js"):
        page.add_script_tag(content=(ROOT/script).read_text())
    page.evaluate("document.dispatchEvent(new Event('DOMContentLoaded'))")
    def rgb(selector):
        return page.locator(selector).first.evaluate("(e)=>getComputedStyle(e).backgroundColor")
    def dark(selector):
        v=rgb(selector)
        vals=[int(x) for x in re.findall(r"\d+",v)[:3]]
        assert len(vals)==3 and max(vals)<115,(selector,v)
    dark("body")
    dark("#main")
    page.get_by_role("button",name="Start new game").click()
    assert page.evaluate("Engine.state.version")==13
    page.locator("#tutorial").get_by_role("button",name="Skip tutorial").click()
    dark("#nav")
    dark("#topbar")
    for view in screens:
        page.evaluate("(v)=>UI.go(v)",view)
        assert page.locator("#main").inner_text().strip(),view
        assert not errors,(view,errors)
        if view not in ("dashboard","projects"):
            assert page.locator(".fc-page-prelude").count()==1,view
        if view in ("dashboard","finance","talent","rivals","awards","filmography","projects"):
            page.screenshot(path=str(ART/("desktop_"+view+".png")),animations="disabled",full_page=False)
    page.evaluate("UI.go('dashboard')")
    assert page.locator(".fc-dashboard-head").count()==1
    assert page.locator(".fc-dashboard-actions button").count()==2
    page.locator(".fc-dashboard-actions").get_by_role("button",name="Production Center").click()
    assert page.locator(".fc-center").count()==1
    page.evaluate("UI.go('awards')")
    assert page.locator("details.fc-reference").count()==2
    assert page.locator("details.fc-reference[open]").count()==0
    page.locator("details.fc-reference").first.locator("summary").click()
    assert page.locator("details.fc-reference[open]").count()==1
    page.evaluate("UI.go('talent')")
    talent_id=page.evaluate("Engine.talent().find(t=>t.role==='director').id")
    page.evaluate("(id)=>UI.openTalent(id)",talent_id)
    assert page.locator("#drawer.open").count()==1
    dark("#drawer")
    page.screenshot(path=str(ART/"desktop_talent_drawer.png"),animations="disabled")
    page.evaluate("UI.closeDrawer()")
    # Nonmodal tutorial must allow navigation even while visible.
    page.evaluate("UI.openTutorial()")
    assert page.locator("#tutorial").is_visible()
    page.evaluate("UI.go('finance')")
    assert page.get_by_role("heading",name="Finance",exact=True).is_visible()
    page.locator("#tutorial").get_by_role("button",name="Skip tutorial").click()
    # Mobile menu toggles without covering the interactive page after selection.
    for width in (390,360):
        page.set_viewport_size({"width":width,"height":800})
        page.evaluate("UI.go('dashboard')")
        assert page.locator("#mobile-nav-toggle").is_visible()
        page.locator("#mobile-nav-toggle").click()
        assert page.locator("#nav").is_visible()
        page.locator("#nav [data-section='overview']").click()
        page.locator("#main .fc-section-tabs [data-view='finance']").click()
        assert not page.locator("#nav").is_visible()
        assert page.get_by_role("heading",name="Finance",exact=True).is_visible()
        # The page can contain horizontally scrolling tables, but the document cannot.
        horizontal=page.evaluate("()=>({page:document.documentElement.scrollWidth,window:innerWidth})")
        assert horizontal["page"]<=horizontal["window"]+2,(width,horizontal)
        page.screenshot(path=str(ART/f"mobile_{width}_finance.png"),animations="disabled",full_page=False)
        page.evaluate("UI.go('projects')")
        horizontal=page.evaluate("()=>({page:document.documentElement.scrollWidth,window:innerWidth})")
        assert horizontal["page"]<=horizontal["window"]+2,(width,horizontal)
        page.screenshot(path=str(ART/f"mobile_{width}_production.png"),animations="disabled",full_page=False)
    assert not errors,errors
    print("PASS: %d screens, dark palette, desktop/mobile, navigation, drawer, awards and tutorial"%(len(screens)))
    browser.close()
