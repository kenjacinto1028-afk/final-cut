"""v13.2 short in-game tutorial, isolated browser UI (no network required)."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re, shutil

ROOT = Path(__file__).resolve().parent.parent
errors = []

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=shutil.which('chromium'), headless=True, args=['--no-sandbox', '--disable-dev-shm-usage'])
    page = browser.new_page(viewport={'width': 1280, 'height': 840})
    page.on('pageerror', lambda error: errors.append(str(error)))
    html = (ROOT / 'index.html').read_text().split('<body>')[1].split('</body>')[0]
    html = re.sub(r'<script.*?</script>', '', html, flags=re.S)
    page.set_content('<html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+html+'</body></html>')
    page.add_style_tag(content=(ROOT / 'style.css').read_text())
    page.evaluate('''() => {
      const db = new Map();
      Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>db.get(k)||null,setItem:(k,v)=>db.set(k,String(v)),removeItem:k=>db.delete(k)}});
    }''')
    for script in ['content.js', 'engine.js', 'poster-store.js', 'media.js', 'ui.js']:
        page.add_script_tag(content=(ROOT / script).read_text())
    page.evaluate("document.dispatchEvent(new Event('DOMContentLoaded'))")

    # Preview is available from the start screen without creating a save.
    page.get_by_role('button', name='How to play').click()
    assert page.locator('#tutorial [role=dialog]').is_visible()
    assert '1 / 5' in page.locator('.tutorial-kicker').inner_text()
    assert page.evaluate('Engine.state === null')
    page.keyboard.press('Escape')
    assert page.locator('#tutorial').is_hidden()

    page.locator('#f_studio').fill('Orchid Pictures')
    page.get_by_role('button', name='Start new game').click()
    assert page.locator('#tutorial [role=dialog]').is_visible()
    assert page.locator('#main').is_visible()
    week = page.evaluate('Engine.state.week')
    cash = page.evaluate('Engine.state.cash')
    assert page.locator('#tutorial-title').inner_text() == 'Welcome to your studio'
    # Focus remains inside the dialog, including reverse Tab from its title.
    page.keyboard.press('Shift+Tab')
    assert page.evaluate('document.activeElement.closest("#tutorial") !== null')
    page.locator('#tutorial').get_by_role('button', name='Next').click()
    assert page.locator('#tutorial-title').inner_text() == 'Plan a first film'
    page.locator('#tutorial').get_by_role('button', name='Back').click()
    assert page.locator('#tutorial-title').inner_text() == 'Welcome to your studio'
    # Focus remains inside the dialog, including reverse Tab from its title.
    page.keyboard.press('Shift+Tab')
    assert page.evaluate('document.activeElement.closest("#tutorial") !== null')
    for i in range(4):
        page.locator('#tutorial').get_by_role('button', name='Next').click()
    assert page.locator('#tutorial-title').inner_text() == 'Release, review and grow'
    assert '5 / 5' in page.locator('.tutorial-kicker').inner_text()
    assert page.evaluate('Engine.state.week') == week
    assert page.evaluate('Engine.state.cash') == cash
    page.screenshot(path=str(ROOT / 'tests/tutorial_desktop.png'))
    page.locator('#tutorial').get_by_role('button', name='Plan my first film').click()
    assert page.locator('#tutorial').is_hidden()
    assert 'New project' in page.locator('.crumb').inner_text()
    assert page.evaluate('Engine.state.week') == week

    # Replay/skip can be used during any active save; no game data changes.
    page.locator('#nav').get_by_role('button', name='? Tutorial').click()
    assert page.locator('#tutorial').is_visible()
    page.locator('#tutorial').get_by_role('button', name='Skip tutorial').click()
    assert page.locator('#tutorial').is_hidden()
    page.evaluate('Engine.save(); Engine.load(); UI.render()')
    assert page.locator('#tutorial').is_hidden(), 'Existing loaded saves must not reopen tutorial automatically'

    # Mobile layout and close control remain reachable.
    page.set_viewport_size({'width': 390, 'height': 740})
    page.get_by_role('button', name='Menu').click()
    page.locator('#nav').get_by_role('button', name='? Tutorial').click()
    assert page.locator('#tutorial').is_visible()
    assert page.evaluate('document.querySelector(".tutorial-card").getBoundingClientRect().width <= window.innerWidth')
    page.screenshot(path=str(ROOT / 'tests/tutorial_mobile.png'))
    page.locator('#tutorial').get_by_role('button', name='Close tutorial').click()
    assert page.locator('#tutorial').is_hidden()

    # No permanent tutorial-visited flag is stored: a new game can show it again.
    assert page.evaluate('localStorage.getItem("finalcut_tutorial_seen") === null')
    assert not errors, errors
    browser.close()
print('PASS tutorial UI: 5 steps, Back/Next, start preview, skip/replay, existing save, keyboard, mobile, no time/cash changes, 0 JS errors')
