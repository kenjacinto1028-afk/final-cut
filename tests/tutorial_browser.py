"""v13.3 live, click-through, accessible nonmodal walkthrough in local Chromium."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re, shutil

ROOT = Path(__file__).resolve().parent.parent
errors = []

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=shutil.which('chromium'), headless=True,
                                args=['--no-sandbox','--disable-dev-shm-usage'])
    page = browser.new_page(viewport={'width': 1360, 'height': 850})
    page.on('pageerror', lambda e: errors.append(str(e)))
    html = (ROOT/'index.html').read_text().split('<body>')[1].split('</body>')[0]
    html = re.sub(r'<script.*?</script>', '', html, flags=re.S)
    page.set_content('<html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' + html + '</body></html>')
    page.add_style_tag(content=(ROOT/'style.css').read_text())
    page.evaluate('''() => {
      const db = new Map();
      Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>db.get(k)||null,setItem:(k,v)=>db.set(k,String(v)),removeItem:k=>db.delete(k)}});
    }''')
    for script in ['content.js','engine.js','poster-store.js','media.js','ui.js']:
        page.add_script_tag(content=(ROOT/script).read_text())
    page.evaluate("document.dispatchEvent(new Event('DOMContentLoaded'))")

    def heading():
        return page.locator('#tutorial-title').inner_text()
    def next_step():
        page.locator('#tutorial').get_by_role('button',name='Next',exact=True).click()
    def nav(label):
        page.locator('#nav').get_by_role('button',name=label,exact=True).click()
    def assert_nonmodal():
        assert page.locator('#tutorial [role="complementary"]').is_visible()
        assert page.locator('#tutorial [aria-modal="true"]').count() == 0
        assert page.locator('#tutorial').evaluate('e=>getComputedStyle(e).position') == 'fixed'
        assert page.evaluate('getComputedStyle(document.body).overflow') != 'hidden'

    # Start-screen preview stays informational; no studio needed.
    page.get_by_role('button', name='How to play').click()
    assert_nonmodal()
    assert '1 / 13' in page.locator('.tutorial-kicker').inner_text()
    assert page.evaluate('Engine.state === null')
    page.keyboard.press('Escape')
    assert page.locator('#tutorial').is_hidden()

    # New studio opens guide; we can click the highlighted Dashboard link *under* it.
    page.locator('#f_studio').fill('Orchid Pictures')
    page.get_by_role('button', name='Start new game').click()
    assert_nonmodal()
    week = page.evaluate('Engine.state.week')
    cash = page.evaluate('Engine.state.cash')
    assert heading() == 'Welcome to Final Cut'
    assert page.locator('#nav [data-view="dashboard"]').evaluate('e=>e.classList.contains("tutorial-target")')
    nav('Dashboard')
    assert heading() == 'Read your dashboard', heading()
    assert page.locator('#main .strip').first.evaluate('e=>e.classList.contains("tutorial-target")')

    next_step()
    assert heading() == 'Open New Project'
    nav('New project')
    assert heading() == 'Plan your film'
    assert 'New project' in page.locator('#main h1').first.inner_text()
    # Real form remains interactive without closing the guide.
    page.locator('#main .form').first.locator('select').first.select_option('short')
    assert page.locator('#tutorial').is_visible()
    assert page.evaluate('Engine.state.week') == week
    next_step()
    assert heading() == 'Choose talent and crew'
    assert page.locator('#main .form.cast').is_visible()
    # The user can minimize while reading the cast list, then resume at the same step.
    page.locator('#tutorial').get_by_role('button',name='Minimize tutorial').click()
    assert page.locator('.tutorial-minibar').is_visible()
    assert page.locator('#tutorial-title').count() == 0
    page.locator('#tutorial').get_by_role('button',name='Resume tutorial').click()
    assert heading() == 'Choose talent and crew'

    next_step()
    assert heading() == 'View your projects'
    nav('Projects')
    assert heading() == 'Move production forward'
    assert 'Projects' in page.locator('#main h1').first.inner_text()
    assert page.locator('#topbar [data-guide="advance"]').is_visible()
    next_step()
    assert heading() == 'Open My Filmography'
    nav('My Filmography')
    assert heading() == 'Learn from your film history'
    next_step()
    assert heading() == 'Check studio finances'
    # Alternate "Open section" button does the same as clicking the highlighted nav.
    page.locator('#tutorial').get_by_role('button',name='Open Finance').click()
    assert heading() == 'Study rival studios'
    assert 'Finance' in page.locator('.crumb').inner_text()
    nav('Rivals')
    assert heading() == 'Watch festivals and awards'
    nav('Awards')
    assert heading() == 'Your next move'
    assert page.locator('#tutorial').get_by_role('button',name='Open New project').count() == 1
    assert page.evaluate('Engine.state.week') == week
    assert page.evaluate('Engine.state.cash') == cash
    page.screenshot(path=str(ROOT/'tests/tutorial_interactive_desktop.png'))
    page.locator('#tutorial').get_by_role('button',name='Finish · Plan a film').click()
    assert page.locator('#tutorial').is_hidden()
    assert 'New project' in page.locator('.crumb').inner_text()

    # Existing saves never auto-run the guide and users can replay/skip.
    nav_button = page.locator('#nav').get_by_role('button',name='? Tutorial')
    nav_button.click()
    assert heading() == 'Welcome to Final Cut'
    # Tab can leave the tutorial, rather than being trapped in it.
    page.locator('#tutorial').get_by_role('button', name='Next', exact=True).focus()
    page.keyboard.press('Tab')
    assert not page.evaluate('document.activeElement.closest("#tutorial") !== null'), 'Guide must not trap Tab'
    page.keyboard.press('Escape')
    assert page.locator('#tutorial').is_hidden()
    page.evaluate('Engine.save();Engine.load();UI.render()')
    assert page.locator('#tutorial').is_hidden()

    # Mobile: hidden nav is available via Menu and the guide remains docked and skippable.
    page.set_viewport_size({'width':390, 'height':740})
    page.get_by_role('button',name='Menu').click()
    nav('? Tutorial')
    assert_nonmodal()
    assert page.locator('#mobile-nav-toggle').evaluate('e=>e.classList.contains("tutorial-target")')
    guide_box = page.locator('.tutorial-card').bounding_box()
    assert guide_box and guide_box['width'] <= 390 and guide_box['y'] >= 0
    assert page.locator('#mobile-nav-toggle').is_visible()
    page.get_by_role('button',name='Menu').click()
    nav('Dashboard')
    assert heading() == 'Read your dashboard'
    assert 'Dashboard' in page.locator('.crumb').inner_text()
    page.screenshot(path=str(ROOT/'tests/tutorial_interactive_mobile.png'))
    page.locator('#tutorial').get_by_role('button',name='Skip tutorial').click()
    assert page.locator('#tutorial').is_hidden()
    assert not page.locator('.tutorial-target').count()
    assert not errors, errors
    browser.close()

print('PASS v13.3 interactive tutorial: 13 steps, click-through nav, auto-advance, preview, working forms, minimize, keyboard, mobile, save/reload, 0 JS errors')
