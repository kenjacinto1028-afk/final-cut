"""Final Cut v13.7 — real browser save-slot integration and migration coverage.

Uses the actual local-host origin and Chromium IndexedDB instead of a fake
in-memory save store. Exercises the user controls and campaign poster isolation.
"""
from pathlib import Path
from tempfile import TemporaryDirectory
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from playwright.sync_api import sync_playwright
import shutil,os

ROOT=Path(__file__).resolve().parent.parent
assert (ROOT/"save-slots.js").exists()
class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
server=ThreadingHTTPServer(("127.0.0.1",0),partial(QuietHandler,directory=str(ROOT)))
thread=Thread(target=server.serve_forever,daemon=True);thread.start()
BASE="http://127.0.0.1:%d/"%server.server_port
errors=[]
try:
 with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,args=["--no-sandbox","--disable-dev-shm-usage"])
    context=browser.new_context(viewport={"width":1330,"height":840},accept_downloads=True)
    page=context.new_page()
    page.route("https://fonts.googleapis.com/**",lambda r:r.abort())
    page.route("https://fonts.gstatic.com/**",lambda r:r.abort())
    page.on("pageerror",lambda err:errors.append(str(err)))
    page.goto(BASE,wait_until="domcontentloaded")
    assert page.evaluate("typeof SaveSlots")=="object"
    assert page.evaluate("Engine.hasSave()")==False
    # Simulate a real v13 save created before SaveSlots existed.
    page.evaluate("Engine.newGame({studioName:'Legacy Lantern',founderName:'Old Director',homeRegion:'europe'})")
    legacy_raw=page.evaluate("localStorage.getItem('backlot_save')")
    assert page.evaluate("localStorage.getItem('finalcut-save-index-v1')") is None
    page.reload(wait_until="domcontentloaded")
    assert page.evaluate("SaveSlots.list().slots.length")==1
    assert page.evaluate("localStorage.getItem('backlot_save')")==legacy_raw,"Legacy save was rewritten during slot discovery"
    assert page.locator("button",has_text="Continue Legacy Lantern").count()==1
    assert "Legacy Lantern" in page.get_by_role("button",name="Manage saved games (1)").inner_text()
    # Start a second game: existing studio must survive inside IndexedDB.
    page.locator("#f_studio").fill("Aurora Pictures")
    page.locator("#f_founder").fill("Director Two")
    page.get_by_role("button",name="Start new game").click()
    page.wait_for_function("Engine.state?.studio.name==='Aurora Pictures'")
    page.locator("#tutorial").get_by_role("button",name="Skip tutorial").click()
    slots=page.evaluate("SaveSlots.list()")
    assert len(slots["slots"])==2,slots
    legacy_id=next(s["id"] for s in slots["slots"] if s["studio"]=="Legacy Lantern")
    aurora_id=slots["activeId"]
    assert legacy_id!=aurora_id
    # Construct a real short film and custom artwork on Aurora.
    project_id=page.evaluate("""async () => {
      const r=Engine.startProject({
        title:'A Quiet Sea',format:'short',genre:'drama',topic:'smalltown',tier:0,
        cast:{director:'founder',writer:'founder'}
      });
      if(!r.ok)throw Error(r.reason);
      await PosterStore.put(r.project.id,new Blob(['custom-aurora-poster'],{type:'image/png'}));
      r.project.posterCustom=true;Engine.save();
      return r.project.id;
    }""")
    page.evaluate("UI.go('saves')")
    assert page.locator(".fc-save-card").count()==2
    assert page.locator(".tb-save-slot").count()==1
    page.screenshot(path="/tmp/finalcut-save-library-desktop.png",animations="disabled")
    original_campaign=page.evaluate("Engine.state.campaignId")
    original_cash=page.evaluate("Engine.state.cash")
    # Save as new independent branch; artwork must be copied into its namespace.
    page.once("dialog",lambda d:d.accept("Alternate Cut"))
    page.get_by_role("button",name="Make a copy").first.click()
    page.wait_for_function("SaveSlots.list().slots.length===3")
    copy=page.evaluate("SaveSlots.list().slots.find(s=>s.name==='Alternate Cut')")
    assert copy and copy["campaignId"]!=original_campaign
    copy_id=copy["id"]
    page.locator(".fc-save-card",has_text="Alternate Cut").get_by_role("button",name="Load campaign").click()
    page.wait_for_function("(id)=>SaveSlots.list().activeId===id",arg=copy_id)
    assert page.evaluate("Engine.getProject(%s).posterCustom"%project_id)==True
    assert page.evaluate("async (id)=>(await PosterStore.missing([id])).length",project_id)==0
    page.evaluate("Engine.state.cash += 17001;Engine.save()")
    # Renaming must not alter its campaign ID or copy.
    page.evaluate("UI.go('saves')")
    page.once("dialog",lambda d:d.accept("Director's Alternate"))
    page.locator(".fc-save-card",has_text="Alternate Cut").get_by_role("button",name="Rename").click()
    assert page.evaluate("(id)=>SaveSlots.list().slots.find(s=>s.id===id).name",copy_id)=="Director's Alternate"
    # Returning to Aurora restores its independent cash and original artwork.
    page.locator(".fc-save-card",has_text="Aurora Pictures").get_by_role("button",name="Load campaign").click()
    page.wait_for_function("(id)=>SaveSlots.list().activeId===id",arg=aurora_id)
    assert page.evaluate("Engine.state.cash")==original_cash
    assert page.evaluate("Engine.state.campaignId")==original_campaign
    assert page.evaluate("async (id)=>(await PosterStore.missing([id])).length",project_id)==0
    # Save & restore across a browser reload; the active v13 autosave persists.
    page.evaluate("Engine.state.week=11;Engine.save()")
    page.reload(wait_until="domcontentloaded")
    assert page.evaluate("SaveSlots.list().slots.length")==3
    assert page.evaluate("SaveSlots.list().slots.find(s=>s.active).week")==11
    page.get_by_role("button",name="Continue Aurora Pictures").click()
    page.wait_for_function("Engine.state?.studio.name==='Aurora Pictures'")
    assert page.evaluate("Engine.state.week")==11
    # Export/Import must create a fourth independent save and carry its poster.
    with TemporaryDirectory() as tmp:
      with page.expect_download() as dl:page.evaluate("UI.exportBackup()")
      exported=Path(tmp)/"studio.json";dl.value.save_as(exported)
      page.evaluate("UI.go('saves')")
      page.locator(".fc-save-import input").set_input_files(str(exported))
      page.wait_for_function("SaveSlots.list().slots.length===4")
      imported=page.evaluate("SaveSlots.list().slots.find(s=>s.active)")
      assert imported["campaignId"]!=original_campaign
      assert page.evaluate("Engine.getProject(%s).posterCustom"%project_id)==True
      assert page.evaluate("async (id)=>(await PosterStore.missing([id])).length",project_id)==0
    # Switch to pre-v13.7 original, and check that the studio was not overwritten.
    page.evaluate("UI.go('saves')")
    page.locator(".fc-save-card",has_text="Legacy Lantern").get_by_role("button",name="Load campaign").click()
    page.wait_for_function("Engine.state?.studio.name==='Legacy Lantern'")
    assert page.evaluate("Engine.state.version")==13
    assert page.evaluate("Engine.state.founder.name")=="Old Director"
    # Delete an inactive branch; the unrelated active studio stays intact.
    page.evaluate("UI.go('saves')")
    page.once("dialog",lambda d:d.accept())
    page.locator(".fc-save-card",has_text="Director's Alternate").get_by_role("button",name="Delete").click()
    page.wait_for_function("SaveSlots.list().slots.length===3")
    assert page.evaluate("Engine.state.studio.name")=="Legacy Lantern"
    # Mobile: library remains inside viewport with useful actions.
    page.set_viewport_size({"width":390,"height":800})
    page.evaluate("UI.go('saves')")
    overflow=page.evaluate("({doc:document.documentElement.scrollWidth,viewport:innerWidth})")
    assert overflow["doc"]<=overflow["viewport"]+2,overflow
    page.screenshot(path="/tmp/finalcut-save-library-mobile.png",animations="disabled")
    # Returning to title must preserve active campaign instead of deleting it.
    page.once("dialog",lambda d:d.accept())
    page.evaluate("UI.quit()")
    assert page.evaluate("Engine.state===null")
    assert page.evaluate("Engine.hasSave()")==True
    assert page.evaluate("SaveSlots.list().slots.length")==3
    assert not errors,errors
    print("PASS v13.7 legacy migration, 4 independent slots, branching with custom posters, "+
          "rename, switch, reload, backup import, delete, safe title, mobile layout")
    context.close();browser.close()
finally:
 server.shutdown();server.server_close()
