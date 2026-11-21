// ===== SECTION: HEADER =====
// Final Cut — ui.js
// Displays state and forwards clicks to Engine. No game rules here.
var UI = (function () {
  'use strict';

// ===== SECTION: HELPERS =====
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function money(n) { const s = '$' + Math.abs(Math.round(n)).toLocaleString('en-US'); return n < 0 ? '-' + s : s; }
  function dateLabel(week) { const d = Engine.dateOf(week); return 'Wk ' + d.week + ', ' + d.year; }
  function nameOf(list, id) { const x = list.find(i => i.id === id); return x ? x.name : id; }
  function roleName(t) {
    if (t.role === 'crew') return nameOf(CONTENT.CREW_SPECIALTIES, t.specialty);
    return nameOf(CONTENT.TALENT_ROLES, t.role);
  }
  function traitNames(t) { return Engine.traitsOf(t).map(tr => tr.name).join(', '); }
  function effectHint(e) {
    if (!e) return '';
    const parts = [];
    if (e.cash) parts.push('Cash ' + (e.cash > 0 ? '+' : '') + money(e.cash));
    if (e.quality) parts.push('Quality ' + (e.quality > 0 ? '▲' : '▼'));
    if (e.hype) parts.push('Hype ' + (e.hype > 0 ? '▲' : '▼'));
    if (e.costPct) parts.push('Cost ' + (e.costPct > 0 ? '+' : '') + Math.round(e.costPct * 100) + '%');
    if (e.marketing) parts.push('Marketing ' + Math.round(e.marketing * 100) + '% of budget');
    if (e.weeks > 0) parts.push('Delay ' + e.weeks + ' wk');
    if (e.weeks < 0) parts.push('Saves ' + (-e.weeks) + ' wk');
    if (e.fame) parts.push('Fame ' + (e.fame > 0 ? '▲' : '▼'));
    if (e.critics) parts.push('Critics ' + (e.critics > 0 ? '▲' : '▼'));
    if (e.market) parts.push('Genre demand ' + (e.market > 0 ? '▲' : '▼'));
    if (e.talentFame) parts.push('Star fame ' + (e.talentFame > 0 ? '▲' : '▼'));
    if (e.talentMorale) parts.push('Star morale ' + (e.talentMorale > 0 ? '▲' : '▼'));
    if (e.rosterMorale) parts.push('Roster morale ' + (e.rosterMorale > 0 ? '▲' : '▼'));
    if (e.staffMorale) parts.push('Staff morale ' + (e.staffMorale > 0 ? '▲' : '▼'));
    if (e.pay) parts.push('Pay +' + Math.round(e.pay * 100) + '%');
    if (e.morale) parts.push('Morale ' + (e.morale > 0 ? '▲' : '▼'));
    if (e.strike) parts.push('Strike ' + e.strike + ' wk');
    if (e.fire) parts.push('Lose ' + Math.round(e.fire * 100) + '% of staff');
    return parts.join(' · ') || 'No change';
  }
  function tierName(i) { return (CONTENT.GROWTH_TIERS[i] || { name: 'Tier ' + i }).name; }
  function pctBar(v, max) { return '<div class="bar"><div style="width:' + Math.max(0, Math.min(100, Math.round(v / max * 100))) + '%"></div></div>'; }
  function mult(m) { return '×' + Number(m).toFixed(2); }
  let flash = '';
  function setFlash(msg) { flash = msg || ''; }

// ===== SECTION: MEDIA_HELPERS =====
  // 8.3–8.5: small display helpers over Media (art, count-up numbers, toggles). Nothing here changes game state.
  function hasMedia() { return typeof Media !== 'undefined'; }
  function isPicture(name) { return /picture/i.test(String(name || '')); }
  // A money value that counts up when it changed (Media.countUp runs after every render). key must be unique per value.
  function cu(key, n) { return '<span data-key="' + esc(key) + '" data-count="' + Math.round(n) + '">' + money(n) + '</span>'; }
  function posterFor(f) {
    const id = f.projectId == null ? (typeof f.id === 'number' ? f.id : null) : f.projectId;
    const p = id == null ? null : Engine.getProject(id);
    const u = p && p.posterCustom && typeof PosterStore !== 'undefined' ? PosterStore.url(p.id) : null;
    return u ? '<img class="poster-custom" alt="Custom poster for ' + esc(f.title) + '" src="' + esc(u) + '">' : (hasMedia() ? Media.posterSVG(p || f) : '');
  }
  // Three curated design alternatives; can always restore the seeded default.
  function designChoices(p) {
    const seed = p.title.split('').reduce((n,c)=>n*31+c.charCodeAt(0), 17) >>> 0;
    return [seed%8,(seed+3)%8,(seed+6)%8];
  }
  function posterActions(p) {
    if(!p) return '';
    const styles=designChoices(p);
    return '<div class="poster-picker"><h3>Film poster</h3><p class="muted">Cosmetic art only — never changes film outcomes.</p>' +
      '<div class="poster-variants">' + styles.map((v,i)=>'<button class="poster-variant' + (p.posterStyleId===v?' selected':'') + '" onclick="UI.selectPosterStyle('+p.id+','+v+')" aria-label="Select poster design '+(i+1)+'">'+Media.posterSVG(p,{styleId:v})+'<small>Design '+(i+1)+'</small></button>').join('') + '</div>' +
      '<div class="actions"><label class="poster-upload">Upload custom poster <input type="file" accept="image/png,image/jpeg,image/webp" onchange="UI.beginPosterUpload('+p.id+',this)"></label>' +
      '<button onclick="UI.selectPosterStyle('+p.id+',-1)">Generated default</button>' +
      (p.posterCustom?'<button onclick="UI.removePoster('+p.id+')">Remove uploaded poster</button>':'')+'</div>' +
      '<p class="muted">Custom posters stay on this device unless included in a backup export. Choosing a generated design replaces uploaded art.</p></div>';
  }
  function portrait(t) { return hasMedia() ? '<div class="portrait">' + Media.portraitSVG(t, 120) + '</div>' : ''; }
  function eraBanner(eraId) { return hasMedia() ? '<div class="banner" aria-hidden="true">' + Media.backdropSVG(eraId) + '</div>' : ''; }
  function trophyIcon(won, picture, tip) { return hasMedia() ? '<span class="ico"' + (tip ? ' title="' + esc(tip) + '"' : '') + '>' + Media.trophySVG({ won: won, picture: picture }) + '</span>' : ''; }
  function festBadgeKind(result) { return /won|prize|winner/i.test(String(result || '')) ? 'prize' : (/select/i.test(String(result || '')) ? 'selection' : null); }
  // Trophies (won = gold, nominated = silver) and festival badges for one film.
  function awardIcons(p) {
    if (!hasMedia()) return '';
    const ico = (p.awards || []).map(a => {
      const nm = nameOf(CONTENT.AWARDS.categories, a.cat);
      return trophyIcon(!!a.won, isPicture(nm), (a.won ? 'Won ' : 'Nominated: ') + nm + ' (' + a.year + ')');
    });
    const fests = (p.festResults || []).map(f => ({ name: f.festival, result: f.result }));
    if (p.format === 'short' && p.festival && p.result && !fests.length) fests.push({ name: p.festival, result: p.result });
    fests.forEach(f => {
      const k = festBadgeKind(f.result);
      if (k) ico.push('<span class="ico" title="' + esc(f.result + ' · ' + f.name) + '">' + Media.badgeSVG(k, f.name) + '</span>');
    });
    return ico.length ? '<div class="awardrow">' + ico.join('') + '</div>' : '';
  }
  // Up to 6 gold trophies for a talent's wins.
  function talentTrophies(t) {
    const w = t.awards ? t.awards.wins : 0;
    if (!hasMedia() || !w) return '';
    let h = '';
    for (let i = 0; i < Math.min(w, 6); i++) h += trophyIcon(true, false);
    return '<div class="awardrow">' + h + '</div>';
  }
  function toggleSfx() { if (hasMedia()) { Media.toggleSfx(); render(); } }
  function toggleMotion() { if (hasMedia()) { Media.toggleReduceMotion(); render(); } }

// ===== SECTION: TABLE =====
  // Reusable table. cfg = {
  //   rows: () => [...], rowId: r => id, search: r => text, onRow: id => void, rowClass: r => 'class' (optional),
  //   columns: [{ key, label, num, value: r => sortable value (null sorts last), render: r => html (optional) }],
  //   filters: [[id, label, predicate or null]]  (first entry is the default)
  // }
  const tables = {};
  function tblRows(id) {
    const t = tables[id], cfg = t.cfg;
    let rows = cfg.rows();
    const f = (cfg.filters || []).find(x => x[0] === t.filter);
    if (f && f[2]) rows = rows.filter(f[2]);
    const q = t.q.trim().toLowerCase();
    if (q && cfg.search) rows = rows.filter(r => cfg.search(r).toLowerCase().includes(q));
    const col = cfg.columns.find(c => c.key === t.sort);
    if (col) {
      rows = rows.slice().sort((a, b) => {
        const x = col.value(a), y = col.value(b);
        if (x == null && y == null) return 0;
        if (x == null) return 1;
        if (y == null) return -1;
        return (typeof x === 'string' ? x.localeCompare(y) : x - y) * t.dir;
      });
    }
    return rows;
  }
  function tblBody(id) {
    const t = tables[id], cfg = t.cfg;
    const rows = tblRows(id);
    const head = cfg.columns.map(c =>
      '<th class="sortable' + (c.num ? ' num' : '') + '" onclick="UI.tblSort(\'' + id + '\',\'' + c.key + '\')">' + esc(c.label) +
      (t.sort === c.key ? (t.dir > 0 ? ' ▲' : ' ▼') : '') + '</th>').join('');
    const body = rows.map(r => {
      const cls = [cfg.onRow ? 'clickable' : '', cfg.rowClass ? cfg.rowClass(r) : ''].filter(Boolean).join(' ');
      return '<tr' + (cls ? ' class="' + cls + '"' : '') + (cfg.onRow ? ' onclick="UI.tblRow(\'' + id + '\',\'' + cfg.rowId(r) + '\')"' : '') + '>' +
        cfg.columns.map(c => {
          const v = c.value(r);
          const cell = c.render ? c.render(r) : (v == null ? '–' : esc(v));
          return '<td' + (c.num ? ' class="num"' : '') + '>' + cell + '</td>';
        }).join('') + '</tr>';
    }).join('');
    return '<table><thead><tr>' + head + '</tr></thead><tbody>' +
      (body || '<tr><td colspan="' + cfg.columns.length + '" class="muted">No matches.</td></tr>') + '</tbody></table>';
  }
  function tblHtml(id, cfg) {
    const t = tables[id] || (tables[id] = { sort: cfg.sort || null, dir: cfg.dir || 1, filter: cfg.filters ? cfg.filters[0][0] : '', q: '' });
    t.cfg = cfg;
    let h = '<div class="tbl-tools">';
    if (cfg.filters) {
      h += '<div class="seg">' + cfg.filters.map(f =>
        '<button class="seg-btn' + (t.filter === f[0] ? ' on' : '') + '" onclick="UI.tblFilter(\'' + id + '\',\'' + f[0] + '\')">' + esc(f[1]) + '</button>').join('') + '</div>';
    }
    if (cfg.search) h += '<input class="tbl-search" type="search" placeholder="Search" value="' + esc(t.q) + '" oninput="UI.tblSearch(\'' + id + '\',this.value)">';
    return h + '</div><div id="tbl-' + id + '" class="tbl-wrap">' + tblBody(id) + '</div>';
  }
  function tblRefresh(id) { const el = $('tbl-' + id); if (el) el.innerHTML = tblBody(id); }
  function tblSort(id, key) {
    const t = tables[id];
    if (t.sort === key) t.dir = -t.dir; else { t.sort = key; t.dir = 1; }
    tblRefresh(id);
  }
  function tblFilter(id, f) { tables[id].filter = f; render(); }
  function tblSearch(id, q) { tables[id].q = q; tblRefresh(id); }
  function tblRow(id, rid) { const t = tables[id]; if (t && t.cfg.onRow) t.cfg.onRow(rid); }

// ===== SECTION: NAV =====
  // [id, label, soon?]  soon = tab shown but disabled until that view exists.
  const GROUPS = [
    ['Studio', [['dashboard', 'Dashboard'], ['newproject', 'New project'], ['projects', 'Projects'], ['filmography', 'My Filmography'], ['tv', 'TV'], ['founder', 'Founder'], ['log', 'Log'], ['saves', 'Saved Games']]],
    ['People', [['talent', 'Talent'], ['roster', 'Roster'], ['staff', 'Staff & HR']]],
    ['Business', [['finance', 'Finance'], ['market', 'Market'], ['rivals', 'Rivals']]],
    ['World', [['news', 'News'], ['archive', 'World Film Archive'], ['rankings', 'Film Rankings'], ['awards', 'Awards'], ['score', 'Score']]]
  ];
  let view = 'dashboard';
  let hist = ['dashboard'];   // visited views, oldest first
  let hpos = 0;               // index of the current view in hist
  function closeMobileNav() {
    const app = $('app'), toggle = $('mobile-nav-toggle');
    if (app) app.classList.remove('menu-open');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }
  function toggleMobileNav() {
    const app = $('app'), toggle = $('mobile-nav-toggle');
    if (!app || !toggle) return;
    const opened = app.classList.toggle('menu-open');
    toggle.setAttribute('aria-expanded', String(opened));
  }
  let viewTransitionPending = false;
  function go(v) {
    closeMobileNav();
    if (v !== view) {
      viewTransitionPending = true;
      if (hasMedia()) Media.uiSound('navigate');
      hist = hist.slice(0, hpos + 1); hist.push(v); hpos = hist.length - 1; view = v;
    }
    // Allow actual sidebar navigation to complete an instruction; no business state changes.
    if (tutorialStep >= 0 && TUTORIAL_STEPS[tutorialStep].visit === v) {
      tutorialStep = Math.min(TUTORIAL_STEPS.length - 1, tutorialStep + 1);
      tutorialMinimized = false;
    }
    setFlash('');
    render();
  }
  function back() { if (hpos > 0) { hpos--; view = hist[hpos]; viewTransitionPending = true; if (hasMedia()) Media.uiSound('navigate'); setFlash(''); render(); } }
  function forward() { if (hpos < hist.length - 1) { hpos++; view = hist[hpos]; viewTransitionPending = true; if (hasMedia()) Media.uiSound('navigate'); setFlash(''); render(); } }
  function resetHistory() { hist = ['dashboard']; hpos = 0; view = 'dashboard'; }
  function crumb() {
    for (const g of GROUPS) {
      const v = g[1].find(x => x[0] === view);
      if (v) return '<span class="muted">' + esc(g[0]) + ' ›</span> <strong>' + esc(v[1]) + '</strong>';
    }
    return '';
  }
  function renderNav() {
    if (!Engine.state) { $('nav').innerHTML = ''; return; }
    const expiring = Engine.expiringContracts().length;
    $('nav').innerHTML = '<div class="brand">Final Cut<small>STUDIO TYCOON</small></div>' +
      GROUPS.map((g,idx) => '<div class="nav-group"><div class="nav-label">' + String(idx+1).padStart(2,'0') + '  /  ' + esc(g[0]) + '</div>' +
        g[1].map(v => v[2]
          ? '<button class="navbtn" disabled>' + esc(v[1]) + '<span class="soon">Soon</span></button>'
          : '<button data-view="' + v[0] + '" class="navbtn' + (view === v[0] ? ' active' : '') + '" onclick="UI.go(\'' + v[0] + '\')">' + esc(v[1]) +
            (v[0] === 'roster' && expiring ? '<span class="badge">' + expiring + '</span>' : '') + '</button>'
        ).join('') + '</div>').join('') +
      '<div class="nav-foot"><button class="navbtn" onclick="UI.saveNow()">Save now</button>' + soundControls() + '<button class="navbtn" onclick="UI.exportBackup()">Export save + posters</button>' +
      '<label class="navbtn backup-upload">Import backup<input type="file" accept="application/json,.json" onchange="UI.importBackup(this)"></label>' +
      '<button class="navbtn" onclick="UI.openTutorial()">? Tutorial</button>' +
      '<button class="navbtn danger-nav" onclick="UI.quit()">Return to title</button></div>';
  }
  // 8.1 music toggle and volume, 8.4 sound effects toggle, 8.5 reduce-motion toggle (Media keeps the settings; display only here).
  function soundControls() {
    if (typeof Media === 'undefined') return '';
    const m = Media.musicState(), S = Media.settings;
    let h = '<div class="sound">';
    if (m.supported) {
      h += '<button class="navbtn" onclick="UI.toggleMusic()" aria-pressed="' + m.on + '">Music: ' + (m.on ? 'On' : 'Off') +
        (m.on && m.style ? '<span class="soon">' + esc(m.style) + '</span>' : '') + '</button>' +
        '<label class="vol"><span>Volume</span><input type="range" min="0" max="100" value="' + Math.round(m.volume * 100) + '" oninput="UI.setVolume(this.value)" aria-label="Music and effects volume"></label>' +
        '<button class="navbtn" onclick="UI.toggleSfx()" aria-pressed="' + S.sfx + '">Sound effects: ' + (S.sfx ? 'On' : 'Off') + '</button><small class="sound-note">Optional: page turns, premieres and award reveals</small>';
    }
    return h + '<button class="navbtn" onclick="UI.toggleMotion()" aria-pressed="' + S.reduceMotion + '">Reduce motion: ' + (S.reduceMotion ? 'On' : 'Off') + '</button></div>';
  }

// ===== SECTION: TOPBAR =====
  // 7.1: the run score sits next to cash (live until it locks, then "final").
  function renderTop() {
    const s = Engine.state;
    if (!s) { $('topbar').innerHTML = ''; return; }
    const blocked = !!(s.pending || s.gameOver);
    const era = Engine.eraOf(Engine.dateOf().year);
    const sc = Engine.scoreInfo();
    $('topbar').innerHTML =
      '<span class="tb-hist"><button ' + (hpos > 0 ? '' : 'disabled') + ' onclick="UI.back()" aria-label="Back" title="Back">‹</button>' +
      '<button ' + (hpos < hist.length - 1 ? '' : 'disabled') + ' onclick="UI.forward()" aria-label="Forward" title="Forward">›</button></span>' +
      '<span class="crumb">' + crumb() + '</span>' +
      '<span class="tb-date">' + dateLabel() + ' <span class="muted">· ' + esc(era.name) + ' · ' + esc(nameOf(CONTENT.REGIONS, Engine.homeRegion())) + '</span></span>' +
      '<span class="tb-cash ' + (s.cash < 0 ? 'neg' : '') + '"><small>Cash</small> ' + money(s.cash) + '</span>' +
      '<span class="tb-score"><a href="#" onclick="UI.go(\'score\');return false">Score ' + sc.value + '</a>' + (sc.locked ? ' <span class="muted">final</span>' : '') + '</span>' +
      '<span class="spacer"></span>' +
      '<button ' + (blocked ? 'disabled' : '') + ' onclick="UI.nextWeek()">Next week</button>' +
      '<button data-guide="advance" class="primary" ' + (blocked ? 'disabled' : '') + ' onclick="UI.advance()">Advance to next decision</button>';
  }

// ===== SECTION: VIEW_START =====
  // Browser-local campaign library. The current slot autosaves exactly as it did
  // before v13.7; archived slots live in IndexedDB and are not overwritten.
  function viewSaveLibrary() {
    if(typeof SaveSlots==='undefined') return '<h1>Saved games</h1><p class="muted">Save slots are unavailable in this build.</p>';
    const data=SaveSlots.list();
    const slots=data.slots.slice().sort((a,b)=>b.updatedAt-a.updatedAt);
    let h='<section class="fc-save-library"><div class="fc-save-header"><div><small>STUDIO ARCHIVES / CAMPAIGN MANAGEMENT</small>'+
      '<h1>Saved games</h1><p>Run multiple independent studios. The active slot autosaves each week; other campaigns remain untouched.</p></div>'+
      '<div class="fc-save-header-actions">'+(Engine.state
        ? '<button class="primary" onclick="UI.saveNow()">Save current</button><button onclick="UI.copySave()">Save a copy</button>'
        : '<button onclick="UI.go(&quot;dashboard&quot;)">Return to title</button>')+
      '</div></div>';
    if(!slots.length) h+='<div class="fc-save-empty"><h2>No saved studios yet</h2><p>Create a studio to begin your first campaign.</p>'+
      '<button onclick="UI.quit()">Start a studio</button></div>';
    else {
      h+='<div class="fc-save-list">';
      h+=slots.map(s=>{
        const active=s.active;
        const id=esc(s.id);
        const stamp=s.updatedAt?new Date(s.updatedAt).toLocaleString():'Existing save';
        return '<article class="fc-save-card'+(active?' fc-save-active':'')+'">'+
          '<div class="fc-save-head"><div><small>'+(active?'ACTIVE AUTOSAVE':'ARCHIVED CAMPAIGN')+'</small>'+
          '<h2>'+esc(s.name)+'</h2><p>'+esc(s.studio)+(s.name!==s.studio?' · studio':'')+'</p></div>'+
          '<span class="fc-save-status">'+(active?'Playing':'Stored')+'</span></div>'+
          '<div class="fc-save-details"><span><strong>'+esc(String(s.year))+'</strong> In-game year</span>'+
          '<span><strong>'+esc(String(s.releases))+'</strong> Releases</span>'+
          '<span><strong>'+esc(stamp)+'</strong> Last saved</span></div>'+
          '<div class="fc-save-actions">'+(active
            ? '<button class="primary" onclick="UI.saveNow()">Save now</button>'
            : '<button class="primary" onclick="UI.openSave(&quot;'+id+'&quot;)">Load campaign</button>')+
          '<button onclick="UI.renameSave(&quot;'+id+'&quot;)">Rename</button>'+
          (active?'<button onclick="UI.copySave()">Make a copy</button>':'')+
          '<button class="fc-delete-save" onclick="UI.deleteSave(&quot;'+id+'&quot;)">Delete</button>'+
          '</div></article>';
      }).join('');
      h+='</div>';
    }
    h+='<div class="fc-save-footer"><div><h2>Backups and new campaigns</h2>'+
      '<p>Saves are stored only in this browser on this device. Export a backup if you want to move or protect a studio, including its uploaded posters.</p></div>'+
      '<div class="fc-save-actions">'+(Engine.state?'<button onclick="UI.exportBackup()">Export active studio + posters</button>':'')+
      '<label class="poster-upload fc-save-import">Import backup as new save<input type="file" accept="application/json,.json" onchange="UI.importBackup(this)"></label>'+
      '<button onclick="UI.quit()">Return to title / New studio</button></div></div></section>';
    return h;
  }
  function viewStart() {
    const saves=typeof SaveSlots!=='undefined'?SaveSlots.list():null;
    const active=saves&&saves.slots.find(s=>s.active);
    return '<h1>Final Cut</h1><p>1970. You have a camera, some savings and an idea.</p><p class="muted">Your campaigns are saved separately on this device. Export backups to keep copies outside the browser.</p>' +
      '<div class="form">' +
      '<label>Studio name <input id="f_studio" placeholder="Untitled Pictures"></label>' +
      '<label>Founder name <input id="f_founder" placeholder="Random if empty"></label>' +
      '<label>Home region <select id="f_region">' + CONTENT.REGIONS.map(r => '<option value="' + esc(r.id) + '">' + esc(r.name) + '</option>').join('') + '</select></label>' +
      '<button class="primary" onclick="UI.startGame()">Start new game</button>' +
      ' <button onclick="UI.openTutorial()">How to play</button>' +
      (Engine.hasSave() ? ' <button onclick="UI.loadGame()">Continue ' + esc(active?active.name:'saved game') + '</button>' : '') +
      (saves ? ' <button onclick="UI.go(&quot;saves&quot;)">Manage saved games' + (saves.slots.length?' ('+saves.slots.length+')':'') + '</button>' : '') +
      ' <label class="poster-upload">Import save + posters <input type="file" accept="application/json,.json" onchange="UI.importBackup(this)"></label>' +
      '</div><div class="start-sound">' + soundControls() + '</div>';
  }

// ===== SECTION: VIEW_DASHBOARD =====
  // 8.3: era backdrop banner on top. 8.5: gross of films in theaters counts up (cu).
  function viewDashboard() {
    const s = Engine.state;
    const d = Engine.dateOf();
    const era = Engine.eraOf(d.year);
    let h = '<div class="dashboard-layout"><section class="dashboard-primary">' + eraBanner(era.id) +
      '<div class="fc-dashboard-head"><div><div class="fc-page-id">THE STUDIO / WEEKLY OPERATIONS</div><h1>' + dateLabel() + '</h1>' +
      '<p>' + esc(s.studio.name) + ' · ' + esc(era.name) + ' era · Your productions, finances and industry pulse in one place.</p></div>' +
      '<div class="fc-dashboard-actions"><button onclick="UI.go(&quot;projects&quot;)">Production Center</button>' +
      '<button class="primary" onclick="UI.go(&quot;newproject&quot;)">+ Greenlight film</button></div></div>';
    if (s.warning.stage) {
      h += '<div class="alert">' + (s.warning.stage === 1 ? 'Missed payroll.' : 'Creditor deadline.') +
        ' Get cash above $0 by ' + dateLabel(s.warning.deadline) + (s.warning.stage === 2 ? ' or the studio goes bankrupt.' : '.') + '</div>';
    }
    if (s.pending) h += '<div class="alert"><strong>Decision waiting</strong>' + (s.queue.length ? ' (+' + s.queue.length + ' more)' : '') + '<br>' + esc(s.pending.text) + '</div>';
    const exp = Engine.expiringContracts();
    if (exp.length) {
      h += '<div class="alert"><strong>Contracts ending</strong><br>' + exp.map(t => esc(t.name) + ' (' + Engine.weeksLeft(t) + ' wk)').join(', ') +
        ' <button onclick="UI.go(\'roster\')">Roster</button></div>';
    }
    const profit = Engine.weeklyProfit();
    const rep=Engine.reputationInfo(),legacy=Engine.legacyInfo();
    h += '<div class="strip">' + stat('Cash', money(s.cash)) + stat('Weekly burn', money(Engine.weeklyBurn())) +
      stat('Weekly profit', '<span class="' + (profit < 0 ? 'neg' : '') + '">' + money(profit) + '</span>') + stat('Debt', money(s.debt)) + '</div>';
    h += '<div class="strip reputation-strip">'+stat('Lifetime fame',rep.fame+'/100')+stat('Current buzz',rep.buzz+'/100')+
      stat('Current prestige',rep.currentPrestige+'/100')+stat('Lifetime legacy',rep.lifetimeLegacy+' pts')+'</div>';
    h += '<p class="muted">Fame is your long-term public recognition; buzz reflects recent attention. Prestige follows the last five years. Lifetime legacy never decays.</p>';
    if(legacy.industryShift) h += '<div class="market-shift"><strong>Industry shift: '+esc(legacy.industryShift.name)+'</strong><p>Temporary audience interest in '+legacy.industryShift.genres.map(id=>esc(nameOf(CONTENT.GENRES,id))).join(' and ')+'. Ends '+dateLabel(legacy.industryShift.endWeek)+'.</p></div>';
    if (!s.studio.releases && s.week < 53) h += '<div class="onboarding"><strong>Getting started</strong><p>Start with a small project. Craft improves the finished film; fame attracts attention. Keep enough cash for production weeks, then choose how widely to screen your film.</p><div class="actions"><button class="primary" onclick="UI.go(&quot;newproject&quot;)">Plan your first film</button><button onclick="UI.go(&quot;market&quot;)">View market demand</button></div></div>';
    else if (s.studio.releases && s.studio.tier === 0 && s.studio.fame < 15) h += '<div class="onboarding"><strong>Grow your studio</strong><p>Film releases and festival recognition build fame. Keep an eye on profits and the Founder page for your next studio upgrade.</p></div>';
    if (s.lastWeek && s.week > 0) h += '<details class="cash-details"><summary><strong>Last week: where your cash went</strong> <span class="muted">· Net ' + money(s.lastWeek.margin == null ? s.lastWeek.income - s.lastWeek.costs : s.lastWeek.margin) + '</span></summary>' +
      '<p>Receipts ' + money(s.lastWeek.income||0) + ', production ' + money(s.lastWeek.production||0) + ', salaries ' + money(s.lastWeek.salaries||0) + ', staff ' + money(s.lastWeek.payroll||0) + ', overhead ' + money(s.lastWeek.overhead||0) + ', interest ' + money(s.lastWeek.interest||0) + ', living ' + money(s.lastWeek.living||Engine.TUNING.livingCost) + '.</p></details>';
    const act = Engine.activeProjects().length, cap = Engine.capacity();
    h += '<h2>In production <span class="muted">' + act + ' of ' + cap + '</span></h2>';
    const live = s.projects.filter(p => p.stage !== 'done').reverse();
    if (live.length) {
      h += '<div class="list">' + live.map(p => {
        const info = p.stage === 'release'
          ? (p.format === 'feature' ? 'In theaters · week ' + p.weeksInRelease + ' · gross ' + cu('gross-' + p.id, p.gross) : 'Awaiting ' + esc(p.festival))
          : CONTENT.STAGE_LABELS[p.stage] + ' · ' + Math.max(p.stageWeeksLeft, 0) + ' wk left · ' + money(p.spent) + ' of ' + money(p.budget);
        return '<button type="button" class="row" onclick="UI.openProject(' + p.id + ')"><strong>' + esc(p.title) + '</strong><span class="muted">' + info + '</span></button>';
      }).join('') + '</div>';
    }
    if (act < cap) {
      h += '<p>' + (act ? 'Room for another production.' : 'No active production.') +
        (Engine.founderFreelancing() ? ' The founder freelances for ' + money(Engine.freelanceIncome()) + '/week.' : '') +
        ' <button class="accent" onclick="UI.go(\'newproject\')">Start a project</button></p>';
    }
    if ((s.annualReviews || []).length) { const r = s.annualReviews[s.annualReviews.length - 1];
      h += '<div class="year-review"><h2>Year '+r.year+' in review</h2><p>'+r.films+' films released · '+r.awards+' awards · closing cash '+money(r.cash)+'</p>' +
        (r.topGrossId ? '<p>Highest gross: <a href="#" onclick="UI.openProject('+r.topGrossId+');return false">'+esc((Engine.getProject(r.topGrossId)||{}).title)+'</a></p>' : '') +
        '<button onclick="UI.go(\'filmography\')">Browse film history</button></div>';
    }
    h += viewLegacyActions(legacy);
    h += '</section><aside class="studio-wire"><h2>The Studio Wire</h2><p><a href="#" onclick="UI.go(\'news\');return false">All news</a></p>' + newsList(Engine.news(null, Engine.TUNING.news.headlines)) + '</aside></div>';
    return h;
  }
  function viewLegacyActions(l) {
    if(Engine.dateOf().year<1990||Engine.state.studio.tier<2)return '';
    let h='<details class="legacy-actions"><summary><strong>Studio legacy opportunities</strong> <span class="muted">· optional, occasional investments</span></summary>';
    if(l.initiative&&l.initiative.remaining>0&&l.initiative.expiresWeek>=Engine.state.week)
      h+='<p>Active initiative: '+esc(l.initiative.id)+' · '+l.initiative.remaining+' qualifying projects remaining · expires '+dateLabel(l.initiative.expiresWeek)+'.</p>';
    h+='<h3>High-stakes studio initiative</h3><div class="legacy-option-grid">'+l.initiatives.map(q=>
      '<div><strong>'+esc(q.name)+'</strong><p class="muted">'+esc(q.description)+'</p><button '+(q.ok?'':'disabled title="'+esc(q.reason)+'"')+' onclick="UI.launchInitiative(&quot;'+q.id+'&quot;)">Invest '+money(q.cost)+'</button></div>').join('')+'</div>';
    h+='<h3>Classic film revival</h3><p class="muted">Reissue a respected feature at least five years old. One revival every three years; original box office records stay unchanged.</p>';
    h+=l.reissueCandidates.length?'<div class="legacy-reissue-list">'+l.reissueCandidates.slice(0,4).map(q=>'<p><strong>'+esc(q.title)+'</strong> · '+q.ageYears+' years old · cost '+money(q.cost)+' · estimated receipts '+money(q.expected)+' <button onclick="UI.reissueClassic('+q.projectId+')">Reissue</button></p>').join('')+'</div>':'<p class="muted">No eligible classic reissues right now.</p>';
    return h+'</details>';
  }
  function newsList(items) {
    if (!items.length) return '<p class="muted">Nothing yet.</p>';
    return '<ul class="log">' + items.map(n => '<li class="t-' + n.type + '"><span class="wire-meta"><strong class="news-tag">' + esc(n.label) + '</strong><small>' + dateLabel(n.week) + '</small></span><p>' + esc(n.text) + '</p></li>').join('') + '</ul>';
  }
  function stat(label, value) { return '<div><div class="muted">' + label + '</div><div class="big">' + value + '</div></div>'; }
  function logList(items) {
    return '<ul class="log">' + items.map(l => '<li class="t-' + l.type + '"><span class="muted">' + dateLabel(l.week) + '</span> ' + esc(l.text) + '</li>').join('') + '</ul>';
  }

// ===== SECTION: VIEW_NEW_PROJECT =====
  const draft = { title: '', format: 'short', genre: 'drama', topic: 'smalltown', tier: 0,
    cast: { director: 'founder', writer: 'founder', lead: '', crew: '' },supporting:[],specialists:[],backgroundCrew:0 };
  function setDraft(key, val) {
    if (key === 'tier') val = Number(val);
    draft[key] = val;
    if (key === 'format') { draft.tier = 0;draft.supporting=[];draft.specialists=[];draft.backgroundCrew=0;if(val!=='feature') delete draft.sequelOf; }
    if (key === 'tier') { const caps=Engine.ensembleCaps(draft.format,val);draft.supporting=draft.supporting.slice(0,caps.supporting);draft.specialists=draft.specialists.slice(0,caps.specialists);draft.backgroundCrew=Math.min(draft.backgroundCrew,caps.backgroundCrew); }
    if (key !== 'title') render();
  }
  function setCast(slot, val) { draft.cast[slot] = val; render(); }
  function setExtra(kind,index,value){
    if(!['supporting','specialists'].includes(kind))return;
    const caps=Engine.ensembleCaps(draft.format,draft.tier);
    if(index<0||index>=caps[kind])return;
    draft[kind][index]=value===''?null:Number(value);render();
  }
  function setBackgroundCrew(value){draft.backgroundCrew=Math.max(0,Math.min(Engine.ensembleCaps(draft.format,draft.tier).backgroundCrew,Number(value)||0));render();}
  function extraPicker(kind,i){
    const slot=kind==='supporting'?'lead':'crew', ti=Engine.formats().find(f=>f.id===draft.format).tiers[draft.tier];
    const opts=Engine.slotOptions(slot,draft.format,draft.genre,draft.topic,ti.budget);
    const selected=String(draft[kind][i]||'');
    const used=[...Object.values(draft.cast),...draft.supporting.filter((_,j)=>kind!=='supporting'||j!==i),...draft.specialists.filter((_,j)=>kind!=='specialists'||j!==i)].map(String);
    return '<label>'+(kind==='supporting'?'Supporting actor':'Specialist crew')+' '+(i+1)+' <select onchange="UI.setExtra(\''+kind+'\','+i+',this.value)">' +
      '<option value="">No additional hire</option>' + opts.filter(x=>typeof x.id==='number').map(x=>{
      const val=String(x.id), disabled=(x.busy||used.includes(val))&&val!==selected;
      return '<option value="'+val+'"'+(selected===val?' selected':'')+(disabled?' disabled':'')+'>'+esc(x.name)+' · skill '+x.skill+' · fame '+x.fame+' · '+(x.roster?'roster':money(x.fee))+'</option>';
      }).join('')+'</select></label>';
  }
  function randomizeTitle() { draft.title = Engine.randomTitle(); render(); }
  function castPicker(slot) {
    const ti = Engine.formats().find(f => f.id === draft.format).tiers[draft.tier];
    const opts = Engine.slotOptions(slot, draft.format, draft.genre, draft.topic, ti.budget);
    const cur = String(draft.cast[slot] == null ? '' : draft.cast[slot]);
    const o = ['<option value=""' + (cur === '' ? ' selected' : '') + '>Local hire (skill ' + Engine.TUNING.talent.emptySkill + ', free)</option>'];
    opts.forEach(x => {
      const val = String(x.id);
      const fit = x.affinity && x.affinity.includes(draft.genre) ? ' ★' : '';
      const cost = x.id === 'founder' ? 'free' : (x.roster ? 'roster' : money(x.fee));
      const interest = x.elite && !x.roster ? ' · offer interest ' + Math.round(x.interest * 100) + '%' : '';
      const impact = x.contribution ? ' · Quality ' + (x.contribution.quality>=0?'+':'') + x.contribution.quality + ' / Hype +' + x.contribution.hype : '';
      const label = x.name + fit + ' · skill ' + x.skill + (x.fame != null ? ' · fame ' + x.fame : '') + (x.recognition ? ' · ' + x.recognition : '') + impact + ' · ' + cost + interest + (x.busy ? ' — busy: ' + x.busy : '');
      o.push('<option value="' + esc(val) + '"' + (val === cur ? ' selected' : '') + (x.busy && val !== cur ? ' disabled' : '') + '>' + esc(label) + '</option>');
    });
    return '<label>' + esc(CONTENT.SLOT_LABELS[slot]) + ' <select onchange="UI.setCast(\'' + slot + '\', this.value)">' + o.join('') + '</select></label>';
  }
  function viewNewProject() {
    if (!draft.title) draft.title = Engine.randomTitle();
    if (Engine.founderRole() === 'executive') ['director', 'writer'].forEach(s => { if (draft.cast[s] === 'founder') draft.cast[s] = ''; });
    const fmts = Engine.formats();
    const fmt = fmts.find(f => f.id === draft.format) || fmts[0];
    const pv = Engine.previewProject(draft);
    const opt = (val, label, sel, dis) => '<option value="' + esc(val) + '"' + (sel ? ' selected' : '') + (dis ? ' disabled' : '') + '>' + esc(label) + '</option>';
    let h = '<h1>New project</h1>' + (draft.sequelOf != null ? '<p class="franchise-card">Sequel to '+esc((Engine.getProject(draft.sequelOf)||{}).title||'')+'. Starting hype benefits from the original; repeated sequels face higher audience expectations. <button onclick="UI.cancelSequel()">Cancel sequel link</button></p>' : '') + '<p class="muted">Productions ' + Engine.activeProjects().length + ' of ' + Engine.capacity() + '</p><div class="form">';
    h += '<label>Title <input value="' + esc(draft.title) + '" oninput="UI.setDraft(\'title\', this.value)"> <button onclick="UI.randomizeTitle()">Random</button></label>';
    h += '<label>Format <select onchange="UI.setDraft(\'format\', this.value)">' +
      fmts.map(f => opt(f.id, f.name + (f.unlocked ? '' : ' (needs ' + (Engine.state.studio.tier < f.minTier ? tierName(f.minTier) : 'fame ' + f.unlockFame) + ')'), f.id === draft.format, !f.unlocked)).join('') + '</select></label>';
    h += '<label>Genre <select onchange="UI.setDraft(\'genre\', this.value)">' +
      CONTENT.GENRES.map(g => opt(g.id, g.name, g.id === draft.genre)).join('') + '</select></label>';
    h += '<label>Topic <select onchange="UI.setDraft(\'topic\', this.value)">' +
      CONTENT.TOPICS.map(t => opt(t.id, t.name, t.id === draft.topic)).join('') + '</select></label>';
    h += '<label>Budget <select onchange="UI.setDraft(\'tier\', this.value)">' +
      fmt.tiers.map((t, i) => opt(i, t.name + ' (' + money(t.budget) + ')' + (t.locked ? ' – needs ' + tierName(t.minTier) : ''), i === draft.tier, t.locked)).join('') + '</select></label>';
    if (pv.continuity && pv.continuity.notes.length) h += '<section class="franchise-card"><strong>Original cast continuity</strong><p>Estimated hype ' + (pv.continuity.hype >= 0 ? '+' : '') + pv.continuity.hype + ' from returning or recast creative leads. Replacement skills still determine quality.</p>' +
      pv.continuity.notes.map(n => '<p>' + esc(CONTENT.SLOT_LABELS[n.slot]) + ': ' + esc(n.originalName) + ' — ' + esc(n.status) + ' (' + (n.delta >= 0 ? '+' : '') + n.delta + ' hype)</p>').join('') + '</section>';
    h += '</div><h2>Cast and crew</h2><p class="muted">★ = genre fit. Fees come out of the budget; roster talent costs no fee. Fame drives initial buzz; skill drives filmmaking quality. Recognition is never a hiring gate. Elite artists may decline offers; studio reputation and creative fit help. A declined offer costs nothing.</p><div class="form cast">' +
      Engine.SLOTS.map(castPicker).join('') + '</div>';
    const caps=Engine.ensembleCaps(draft.format,draft.tier);
    if(caps.supporting||caps.specialists){
      h+='<h3>Optional ensemble and specialist crew</h3><p class="muted">Every named hire costs a fee, contributes with diminishing returns, and receives a film credit. You can leave slots empty. Extra crew packages are anonymous, not individual employees.</p><div class="form cast">';
      for(let i=0;i<caps.supporting;i++)h+=extraPicker('supporting',i);
      for(let i=0;i<caps.specialists;i++)h+=extraPicker('specialists',i);
      if(caps.backgroundCrew)h+='<label>Background production crew <select onchange="UI.setBackgroundCrew(this.value)">'+Array.from({length:caps.backgroundCrew+1},(_,i)=>'<option value="'+i+'"'+(draft.backgroundCrew===i?' selected':'')+'>'+['Standard','Expanded','Large'][i]+'</option>').join('')+'</select></label>';
      h+='</div>';
    }
    if (pv.budget) {
      h += '<p>Budget ' + money(pv.budget) + ': fees ' + money(pv.fees) + ' up front, ' + money(Math.max(pv.prodBudget, 0)) + ' production over about ' + pv.weeks +
        ' weeks (' + money(pv.weekly) + '/week). Cash if fully spent: <span class="' + (pv.cashAfter < 0 ? 'neg' : '') + '">' + money(pv.cashAfter) + '</span>. Marketing (features) is extra.</p>';
      if (pv.prodQuality < 1) h += '<p class="neg">Fees are eating into production values (' + Math.round(pv.prodQuality * 100) + '% of the tier\'s quality bonus).</p>';
    }
    if (draft.format === 'feature' || draft.format === 'pilot') {
      const mk = Engine.marketInfo();
      const g = mk.genres.find(x => x.id === draft.genre);
      const t = mk.topics.find(x => x.id === draft.topic);
      const topicDef = CONTENT.TOPICS.find(x => x.id === draft.topic);
      const fit = topicDef.good.includes(draft.genre) ? 'Excellent (+8 quality)' : topicDef.bad.includes(draft.genre) ? 'Difficult (−6 quality)' : 'Neutral';
      h += '<p class="market-insight"><strong>Genre + topic outlook</strong> · ' + esc(g.name) + ' ' + mult(g.demand) + ' · ' + esc(t.name) + ' ' + mult(t.demand) + ' · Story fit: ' + esc(fit) + '.<br><span class="muted">The topic effect is capped at ±15%, and the market may change before release.</span></p>';
      h += '<p class="muted">Demand now for ' + esc(g.name) + ': ' + mult(g.demand) + ' (popularity ' + mult(g.pop) + ' × ' + esc(mk.era.name) + ' era taste ' + mult(g.taste) + ')' +
        (draft.format === 'feature' ? ' · ' + esc(mk.cycle.name) + ' ' + mult(mk.cycle.mult) + '. Biggest possible opening this year: ' + money(mk.audienceCap) + '. You pick the release week when it\'s done.' : '.') +
        ' <a href="#" onclick="UI.go(\'market\');return false">Market</a></p>';
    }
    if (draft.format === 'pilot') h += '<p class="muted">Pilots go to the networks when finished. A pickup orders a season; ratings decide renewals. Shows: ' + Engine.tvSlotsUsed() + ' of ' + Engine.growthTier().maxSeries + '.</p>';
    if (!pv.ok) h += '<p class="neg">' + esc(pv.reason) + '</p>';
    h += '<button class="primary" ' + (pv.ok ? '' : 'disabled') + ' onclick="UI.startProject()">Greenlight</button>';
    return h;
  }

// ===== SECTION: VIEW_PROJECTS =====
  const STAGE_ORDER = ['development', 'preproduction', 'shoot', 'post', 'release', 'done'];
  function profitOf(p) { return p.stage === 'done' ? p.revenue - p.spent : null; }

  // v13.5 — Final Cut Production Center (uses existing studio, project, and
  // decision state; no simulation or save-data duplication).
  let centerProjectId = null, centerShowOlder = false;
  const CENTER_STAGES = ['development','preproduction','shoot','post','release','done'];
  function centerStage(p) {
    const labels = ['Development','Pre-production','Filming','Post-production',
      p.format === 'short' ? 'Festivals' : p.format === 'pilot' ? 'Broadcast' : 'In theaters',
      p.format === 'feature' ? 'Catalog' : 'Complete'];
    const i=Math.max(0,CENTER_STAGES.indexOf(p.stage));
    return {index:i,labels,status:labels[i]||'Completed'};
  }
  function centerWeeksLeft(p) {
    if (p.stage === 'done' || p.stage === 'release') return 0;
    const cfg=Engine.TUNING.formats[p.format],stages=cfg&&cfg.stages||{};
    const remaining=Math.max(0,p.stageWeeksLeft||0);
    return remaining+CENTER_STAGES.slice(CENTER_STAGES.indexOf(p.stage)+1,4).reduce((n,k)=>n+(stages[k]||0),0);
  }
  function centerEstimate(p) {
    if (Number.isFinite(p.critic)) return {value:p.critic+'/100',note:'Recorded critic score'};
    const scores=Engine.castSummary(p).map(x=>x.skill).filter(Number.isFinite);
    const average=scores.length?scores.reduce((n,v)=>n+v,0)/scores.length:55;
    const guide=Math.min(90,Math.max(20,Math.round(20+average*.65+(p.qualityMod||0))));
    return {value:Math.max(1,guide-15)+'–'+Math.min(100,guide+15),note:'Broad early estimate; final reviews may differ'};
  }
  function centerFocus(id) { centerProjectId=Number(id); render(); }
  function centerShowMore(){centerShowOlder=!centerShowOlder;render();}
  function centerPanel() {
    const s=Engine.state,list=s.projects.slice().reverse();
    const active=list.filter(p=>p.stage!=='done'),theaters=active.filter(p=>p.stage==='release'&&p.format==='feature');
    const chosen=list.find(p=>p.id===centerProjectId)||active[0]||list[0];
    const kicker='<div class="fc-kicker">THE DIRECTOR’S OFFICE <span>• Automatic weekly progression</span></div>';
    const header='<header class="fc-top">'+kicker+'<div class="fc-intro"><div><h1>Production Center</h1><p>Your slate from first draft to release. Studio work advances on its own; major decisions still come to you.</p></div><button class="fc-create" onclick="UI.go(&quot;newproject&quot;)">+ Greenlight project</button></div></header>';
    const summary='<div class="fc-strip"><span><strong>'+active.filter(p=>p.stage!=='release').length+'</strong> Making</span><span><strong>'+theaters.length+'</strong> In theaters</span><span><strong>'+list.filter(p=>p.stage==='done').length+'</strong> Completed</span><span><strong>'+money(s.cash)+'</strong> Available cash</span></div>';
    if(!chosen)return '<section class="fc-center">'+header+summary+'<div class="fc-empty"><h2>Your first picture begins here</h2><p>Greenlight a short film and guide the big decisions as your team produces it.</p></div></section>';
    const st=centerStage(chosen),left=centerWeeksLeft(chosen);
    const mark=st.labels.map((label,i)=>'<div class="fc-step '+(i<st.index?'is-done':i===st.index?'is-current':'')+'"><b>'+(i<st.index?'✓':i+1)+'</b><small>'+esc(label)+'</small></div>').join('');
    const estimate=centerEstimate(chosen);
    const estRelease=left>0?'Around '+dateLabel(s.week+left):chosen.releaseWeek!=null?dateLabel(chosen.releaseWeek):'Pending decision';
    const meta='<div class="fc-stats">'+
      '<div><small>Current stage</small><strong>'+esc(st.status)+'</strong><em>'+(chosen.stage==='release'?'Week '+chosen.weeksInRelease+' in release':chosen.stage==='done'?'History preserved':left+' work weeks estimated')+'</em></div>'+
      '<div><small>Budget / spent</small><strong>'+money(chosen.budget)+' / '+money(chosen.spent)+'</strong><em>Actual cash outflow, no new costs</em></div>'+
      '<div><small>'+ (chosen.critic!=null?'Critic reception':'Early quality range') +'</small><strong>'+esc(estimate.value)+'</strong><em>'+esc(estimate.note)+'</em></div>'+
      '<div><small>Release timing</small><strong>'+esc(estRelease)+'</strong><em>Dates move with setbacks or decisions</em></div>'+
      '<div><small>Recorded box office</small><strong>'+money(chosen.gross||0)+'</strong><em>'+(chosen.stage==='release'?'Last week '+money(chosen.lastWeekGross||0):chosen.stage==='done'?'Theatrical run recorded':'Not yet released')+'</em></div></div>';
    const current=s.pending&&s.pending.projectId===chosen.id;
    const decision='<div class="fc-decision"><small>STUDIO DECISIONS</small><h3>'+(current?'A decision needs your attention':'Routine work is delegated')+'</h3><p>'+(current?'A production decision is waiting. Open it to review the choices before continuing.':'Work, production costs and scheduled event decisions are processed each week. You may inspect the project or advance to the next decision at any time.')+'</p><div class="fc-actions"><button onclick="UI.openProject('+chosen.id+')">Open project details</button><button onclick="'+(s.pending?'UI.render()':'UI.advance()')+'" '+(s.pending?'disabled':'')+'>'+(s.pending?'Resolve pending decision':'Advance to next decision')+'</button></div></div>';
    const stageDetails='<section class="fc-stage-detail"><h2>Production milestones</h2><div class="fc-milestones">'+mark+'</div><div class="fc-notes"><div><small>Timeline</small><strong>'+esc(st.status)+'</strong><p>'+(chosen.stage==='release'?'Theatrical gross is booked automatically each week; stronger films can stay in theaters for up to '+Engine.TUNING.maxReleaseWeeks+' weeks.':chosen.stage==='done'?'This title is finished. Its financial and awards history stays in Filmography.':'The studio completes each phase and triggers choices at its scheduled milestones.')+'</p></div>'+decision+'</div></section>';
    const slate=list.slice(0,centerShowOlder?list.length:7).map(p=>{
      const stg=centerStage(p);
      return '<button class="fc-title '+(p.id===chosen.id?'selected':'')+'" onclick="UI.centerFocus('+p.id+')"><strong>'+esc(p.title)+'</strong><small>'+esc(nameOf(Engine.formats(),p.format))+' · '+esc(stg.status)+'</small></button>';
    }).join('');
    const old=list.length>7?'<button class="fc-more" onclick="UI.centerShowMore()">'+(centerShowOlder?'Show fewer':'Show '+(list.length-7)+' more')+'</button>':'';
    const recent=theaters.slice(0,3).map(p=>'<div class="fc-week-film"><span>'+esc(p.title)+'</span><strong>'+money(p.lastWeekGross||0)+'</strong><small>Week '+p.weeksInRelease+' · total '+money(p.gross||0)+'</small></div>').join('');
    const pulse='<div class="fc-pulse"><div><small>WEEKLY BOX OFFICE</small><h2>In theaters</h2><p>Recorded ticket gross; not a forecast. Competition and word of mouth influence future weeks.</p></div><div class="fc-pulse-list">'+(recent||'<p>No feature films currently in theaters.</p>')+'</div></div>';
    return '<section class="fc-center">'+header+summary+'<div class="fc-grid"><div class="fc-main"><div class="fc-feature"><div class="fc-feature-art" aria-hidden="true">'+posterFor(chosen)+'</div><div><small>FEATURED PRODUCTION · '+esc(nameOf(CONTENT.GENRES,chosen.genre))+'</small><h2>'+esc(chosen.title)+'</h2><span class="fc-label">'+esc(st.status)+'</span><p>'+esc(nameOf(Engine.formats(),chosen.format))+' · '+(chosen.releaseWeek!=null?'Released '+dateLabel(chosen.releaseWeek):left+' work weeks remaining (estimated)')+'</p></div></div>'+meta+stageDetails+'</div><aside class="fc-slate"><h2>Studio slate</h2>'+slate+old+'</aside></div>'+pulse+'</section>';
  }
  function viewProjects() {
    const s = Engine.state;
    if (!s.projects.length) return centerPanel();
    const fmtName = p => nameOf(Engine.formats(), p.format);
    return centerPanel() + '<details class="fc-archive"><summary>All projects · searchable production records</summary><h2>Project archive</h2>' + tblHtml('projects', {
      rows: () => Engine.state.projects.slice().reverse(),
      rowId: p => p.id,
      onRow: openProject,
      search: p => [p.title, fmtName(p), nameOf(CONTENT.GENRES, p.genre), CONTENT.STAGE_LABELS[p.stage], p.result || ''].join(' '),
      filters: [
        ['all', 'All', null],
        ['production', 'In production', p => p.stage !== 'release' && p.stage !== 'done'],
        ['release', 'In release', p => p.stage === 'release'],
        ['done', 'Done', p => p.stage === 'done']
      ],
      columns: [
        { key: 'title', label: 'Title', value: p => p.title },
        { key: 'format', label: 'Format', value: fmtName },
        { key: 'genre', label: 'Genre', value: p => nameOf(CONTENT.GENRES, p.genre) },
        { key: 'stage', label: 'Stage', value: p => STAGE_ORDER.indexOf(p.stage), render: p => CONTENT.STAGE_LABELS[p.stage] },
        { key: 'budget', label: 'Budget', num: true, value: p => p.budget, render: p => money(p.budget) },
        { key: 'profit', label: 'Profit', num: true, value: profitOf, render: p => profitOf(p) == null ? '–' : '<span class="' + (profitOf(p) < 0 ? 'neg' : '') + '">' + money(profitOf(p)) + '</span>' },
        { key: 'result', label: 'Result', value: p => p.result }
      ]
    }) + '</details>';
  }

// ===== SECTION: FILM_ARCHIVES =====
  const filmBrowse = { tab: 'all', criterion: 'overall', genre: '', topic: '', decade: '', region: '', format: 'all', query: '', page: 0 };
  const rankTypes = [['overall','Best Overall'],['genre','Best by Genre'],['topic','Best by Topic'],
    ['gross','Top Grossing'],['critics','Critics’ Favorites'],['awards','Award Leaders']];
  function setFilmFilter(field, value) {
    if (Object.prototype.hasOwnProperty.call(filmBrowse, field)) filmBrowse[field] = value;
    if (field === 'criterion' && value === 'genre' && !filmBrowse.genre) filmBrowse.genre = CONTENT.GENRES[0].id;
    if (field === 'criterion' && value === 'topic' && !filmBrowse.topic) filmBrowse.topic = CONTENT.TOPICS[0].id;
    filmBrowse.page = 0; render();
  }
  function filmPage(offset) { filmBrowse.page = Math.max(0, filmBrowse.page + offset); render(); }
  function filmFilters(includeRank) {
    const select = (key, options) => '<label>' + esc(key === 'criterion' ? 'Ranking' : key.charAt(0).toUpperCase() + key.slice(1)) + ' <select onchange="UI.setFilmFilter(\'' + key + '\',this.value)">' +
      options.map(o => '<option value="' + esc(o[0]) + '"' + (String(filmBrowse[key]) === String(o[0]) ? ' selected' : '') + '>' + esc(o[1]) + '</option>').join('') + '</select></label>';
    let h = '<div class="archive-filters">';
    if (includeRank) h += select('criterion', rankTypes);
    h += select('format', includeRank ? [['feature','Features'],['short','Short films']] : [['all','All formats'],['feature','Features'],['short','Short films'],['pilot','TV pilots']]);
    h += select('genre', [['','All genres']].concat(CONTENT.GENRES.map(g => [g.id,g.name])));
    h += select('topic', [['','All topics']].concat(CONTENT.TOPICS.map(t => [t.id,t.name])));
    h += select('region', [['','All release markets']].concat(CONTENT.REGIONS.map(r => [r.id,r.name])));
    h += select('decade', [['','All decades']].concat([1970,1980,1990,2000,2010,2020,2030].map(y => [y,String(y)+'s'])));
    return h + '</div>';
  }
  function filmLabel(f) { return '<a href="#" onclick="UI.openFilm(\'' + esc(f.id) + '\');return false">' + esc(f.title) + '</a>'; }
  function rankOptions(mine) {
    const opts = { mine: !!mine, format: filmBrowse.format === 'all' || filmBrowse.format === 'pilot' ? 'feature' : filmBrowse.format, decade: filmBrowse.decade || null, region: filmBrowse.region || null };
    if (filmBrowse.genre) opts.genre = filmBrowse.genre;
    if (filmBrowse.topic) opts.topic = filmBrowse.topic;
    if (filmBrowse.criterion === 'genre' && !opts.genre) opts.genre = CONTENT.GENRES[0].id;
    if (filmBrowse.criterion === 'topic' && !opts.topic) opts.topic = CONTENT.TOPICS[0].id;
    opts.criterion = ['genre','topic'].includes(filmBrowse.criterion) ? 'overall' : filmBrowse.criterion;
    return opts;
  }
  const previousRanks=new Map();
  function rankMovement(f){
    if (!Number.isInteger(f.worldRank)) return '';
    const prev=previousRanks.get(f.id);
    previousRanks.set(f.id, f.worldRank);
    if (prev == null || prev === f.worldRank) return '';
    const delta=prev-f.worldRank;
    return '<small class="'+(delta>0?'rank-up':'rank-down')+'" title="Change in worldwide ranking"> '+(delta>0?'▲':'▼')+Math.abs(delta)+'</small>';
  }
  function filmTable(rows, ranked, mine) {
    const q = filmBrowse.query.toLowerCase().trim();
    if (q) rows = rows.filter(f => [f.title,f.studio,nameOf(CONTENT.GENRES,f.genre),nameOf(CONTENT.TOPICS,f.topic),Object.values(f.credits||{}).join(' '),f.review&&f.review.headline].join(' ').toLowerCase().includes(q));
    const size = 60, maxPage = Math.max(0,Math.ceil(rows.length/size)-1);
    filmBrowse.page = Math.min(filmBrowse.page,maxPage);
    const start = filmBrowse.page*size, page = rows.slice(start,start+size);
    const positions = new Map();
    if (mine && !ranked) ['feature','short'].forEach(fmt => {
      const opt = rankOptions(true); opt.format=fmt; opt.criterion='overall';
      Engine.filmRankings(opt).forEach(x => positions.set(x.id,x));
    });
    let h = '<div class="archive-search"><label>Find a film <input type="search" value="' + esc(filmBrowse.query) + '" onchange="UI.setFilmQuery(this.value)" placeholder="Title, studio, genre, topic"></label>' +
      '<span class="muted">' + rows.length + ' films · page ' + (filmBrowse.page+1) + ' of ' + (maxPage+1) + '</span></div>';
    h += '<div class="tbl-wrap"><table><thead><tr>' + (ranked ? '<th>World #</th>' + (mine ? '<th>Studio #</th>' : '') : '') +
      (mine && !ranked ? '<th>Studio #</th><th>World #</th>' : '') + '<th>Film</th><th>Studio</th><th>Year</th><th>Genre / Topic</th><th class="num">Critics</th><th class="num">Gross</th><th class="num">' + (ranked ? 'Ranking score' : 'Awards') + '</th></tr></thead><tbody>' +
      page.map(f => '<tr>' + (ranked ? '<td><strong>#' + f.worldRank + '</strong>' + rankMovement(f) + '</td>' + (mine ? '<td>#' + f.studioRank + '</td>' : '') : (mine ? '<td>' + (positions.has(f.id)?'#'+positions.get(f.id).studioRank:'—') + '</td><td>' + (positions.has(f.id)?'#'+positions.get(f.id).worldRank:'—') + '</td>' : '')) +
        '<td>' + filmLabel(f) + '</td><td>' + esc(f.studio) + (f.projectId != null ? ' <span class="muted">(you)</span>' : '') + '</td><td>' + f.year + '</td>' +
        '<td>' + esc(nameOf(CONTENT.GENRES,f.genre)) + ' / ' + esc(nameOf(CONTENT.TOPICS,f.topic || '')) + '</td><td class="num">' + (f.critic == null ? '—' : f.critic) +
        '</td><td class="num">' + money(f.gross || 0) + '</td><td class="num">' + (ranked ? f.score : (f.awards || []).filter(a => a.won).length + (f.festResults || []).filter(a => /prize|grand|winner|won/i.test(a.result || '')).length) +
        '</td></tr>').join('') +
      (!page.length ? '<tr><td colspan="10" class="muted">No films match these filters yet.</td></tr>' : '') + '</tbody></table></div>';
    if (maxPage) h += '<div class="archive-pages"><button onclick="UI.filmPage(-1)" ' + (filmBrowse.page===0?'disabled':'') + '>Previous</button>' +
      '<span>Page ' + (filmBrowse.page+1) + '/' + (maxPage+1) + '</span><button onclick="UI.filmPage(1)" ' + (filmBrowse.page===maxPage?'disabled':'') + '>Next</button></div>';
    return h;
  }
  function setFilmQuery(value) {
    filmBrowse.query = value;
    filmBrowse.page = 0;
    render();
  }
  function filmResultsMarkup() {
    const my = view === 'filmography', ranked = view === 'rankings' || (my && filmBrowse.tab === 'ranks');
    if (ranked) return filmTable(Engine.filmRankings(rankOptions(my)),true,my);
    let films = Engine.filmHistory().filter(f => !my || f.projectId != null);
    if (filmBrowse.genre) films = films.filter(f=>f.genre === filmBrowse.genre);
    if (filmBrowse.topic) films = films.filter(f=>f.topic === filmBrowse.topic);
    if (filmBrowse.region) films = films.filter(f=>(f.regions||[]).includes(filmBrowse.region));
    if (filmBrowse.decade) films = films.filter(f=>Math.floor(f.year/10)*10 === Number(filmBrowse.decade));
    if (filmBrowse.format && filmBrowse.format !== 'all') films = films.filter(f=>f.format === filmBrowse.format);
    films.sort((a,b)=>(b.releaseWeek||0)-(a.releaseWeek||0));
    return filmTable(films,false,my);
  }
  function viewFilmography() {
    return '<h1>My Filmography</h1><p class="muted">Your studio’s complete release history, including production teams, financials and awards. Studio and world positions use the same ranking formula.</p>' +
      '<div class="seg"><button class="seg-btn' + (filmBrowse.tab==='all'?' on':'') + '" onclick="UI.setFilmFilter(\'tab\',\'all\')">All My Films</button>' +
      '<button class="seg-btn' + (filmBrowse.tab==='ranks'?' on':'') + '" onclick="UI.setFilmFilter(\'tab\',\'ranks\')">My Rankings</button></div>' +
      filmFilters(filmBrowse.tab==='ranks') + '<div id="archive-search-results">' + filmResultsMarkup() + '</div>';
  }
  function viewArchive() {
    const h=Engine.state.filmArchive;
    return '<h1>World Film Archive</h1><p class="muted">Player and AI films remain here even when their studios close. ' +
      (h && h.incompleteBefore != null ? 'Older imported saves may have incomplete early AI credits and releases.' : 'New films have persistent historical records.') +
      '</p>' + filmFilters(false) + '<div id="archive-search-results">' + filmResultsMarkup() + '</div>';
  }
  function viewRankings() {
    if (filmBrowse.format === 'all' || filmBrowse.format === 'pilot') filmBrowse.format = 'feature';
    return '<h1>Film Rankings</h1><p class="muted">Worldwide lists include every archived studio film; merit balances reviews, production quality, era-adjusted reach and recognition. Short films have a separate ranking.</p>' +
      filmFilters(true) + '<div id="archive-search-results">' + filmResultsMarkup() + '</div>';
  }

// ===== SECTION: VIEW_TALENT =====
  function viewTalent() {
    return '<h1>Talent</h1><p class="muted">Everyone working in the business. Click a name for details and contracts.</p>' + tblHtml('talent', {
      rows: () => Engine.talent(),
      rowId: t => t.id,
      onRow: openTalent,
      sort: 'skill', dir: -1,
      rowClass: t => Engine.isExpiring(t) ? 'warn' : '',
      search: t => [t.name, roleName(t), traitNames(t), Engine.recognition(t).name, nameOf(CONTENT.REGIONS, t.homeRegion || 'northamerica'), (t.career && t.career.trend) || '', t.affinity.map(g => nameOf(CONTENT.GENRES, g)).join(' ')].join(' '),
      filters: [
        ['all', 'All', null],
        ['actor', 'Actors', t => t.role === 'actor'],
        ['director', 'Directors', t => t.role === 'director'],
        ['writer', 'Writers', t => t.role === 'writer'],
        ['crew', 'Crew', t => t.role === 'crew'],
        ['free', 'Available', t => Engine.talentStatus(t).label === 'Available']
      ],
      columns: [
        { key: 'name', label: 'Name', value: t => t.name },
        { key: 'role', label: 'Role', value: roleName },
        { key: 'skill', label: 'Skill', num: true, value: t => t.skill },
        { key: 'fame', label: 'Fame', num: true, value: t => t.fame },
        { key: 'tier', label: 'Recognition', value: t => Engine.recognition(t).name },
        { key: 'home', label: 'Home region', value: t => nameOf(CONTENT.REGIONS, t.homeRegion || 'northamerica') },
        { key: 'trend', label: 'Career', value: t => t.career && t.career.trend || 'Established' },
        { key: 'rel', label: 'Reliability', num: true, value: t => Engine.effReliability(t) },
        { key: 'traits', label: 'Traits', value: traitNames },
        { key: 'fee', label: 'Fee (feature)', num: true, value: t => Engine.talentFee(t, 'feature'), render: t => money(Engine.talentFee(t, 'feature')) },
        { key: 'status', label: 'Status', value: t => Engine.talentStatus(t).label }
      ]
    });
  }

// ===== SECTION: VIEW_ROSTER =====
  function viewRoster() {
    const s = Engine.state;
    const C = Engine.TUNING.contracts;
    const lowMorale = Engine.TUNING.rivals.poach.moraleBelow;
    const r = Engine.roster();
    let h = '<h1>Roster</h1><div class="strip">' + stat('Signed', r.length + ' / ' + Engine.rosterCap()) + stat('Salaries', money(Engine.weeklySalaries()) + '/wk') +
      stat('Expiring', Engine.expiringContracts().length) + '</div>';
    if (s.studio.fame < C.exclusiveFame) h += '<p class="muted">Exclusive contracts unlock at studio fame ' + C.exclusiveFame + ' (now ' + Math.round(s.studio.fame) + '). Until then, hire per project.</p>';
    else h += '<p class="muted">Sign talent from the Talent page. Roster talent costs a weekly salary but no fee per project. Rows in yellow end within ' + C.warnWeeks + ' weeks.</p>';
    if (!r.length) return h + '<p>No one under contract yet.</p>';
    h += '<p class="muted">Morale below ' + lowMorale + ' (red) makes a rival poaching offer likely. Hits, renewals and fair pay raise it; idle weeks and underpay lower it.</p>';
    return h + tblHtml('roster', {
      rows: () => Engine.roster(),
      rowId: t => t.id,
      onRow: openTalent,
      sort: 'left',
      rowClass: t => Engine.isExpiring(t) ? 'warn' : '',
      search: t => [t.name, roleName(t), traitNames(t)].join(' '),
      columns: [
        { key: 'name', label: 'Name', value: t => t.name },
        { key: 'role', label: 'Role', value: roleName },
        { key: 'skill', label: 'Skill', num: true, value: t => t.skill },
        { key: 'fame', label: 'Fame', num: true, value: t => t.fame },
        { key: 'morale', label: 'Morale', num: true, value: t => Engine.talentMorale(t), render: t => '<span class="' + (Engine.talentMorale(t) < lowMorale ? 'neg' : '') + '">' + Engine.talentMorale(t) + '</span>' },
        { key: 'salary', label: 'Salary/wk', num: true, value: t => t.contract.salary, render: t => money(t.contract.salary) },
        { key: 'ends', label: 'Ends', value: t => t.contract.endWeek, render: t => dateLabel(t.contract.endWeek) },
        { key: 'left', label: 'Weeks left', num: true, value: t => Engine.weeksLeft(t) },
        { key: 'status', label: 'Status', value: t => Engine.talentStatus(t).label }
      ]
    });
  }

// ===== SECTION: VIEW_FOUNDER =====
  function viewFounder() {
    const s = Engine.state;
    const st = s.founder.stats;
    const exec = Engine.founderRole() === 'executive';
    const row = (k, label) => '<tr><td>' + label + '</td><td class="num">' + Math.round(st[k]) + '</td><td><div class="bar"><div style="width:' + st[k] + '%"></div></div></td></tr>';
    return '<h1>' + esc(s.founder.name) + '</h1><p class="muted">' +
      (exec ? 'Runs the studio. Business cuts talent fees and salaries; Charisma adds hype to every release.' : 'Filmmaker. Can direct and write one production at a time. Signing the first exclusive contract moves the founder to running the studio.') +
      '</p><table>' + row('directing', 'Directing') + row('writing', 'Writing') + row('business', 'Business') + row('charisma', 'Charisma') + '</table>' +
      '<div class="strip">' + stat('Role', exec ? 'Executive' : 'Filmmaker') + stat('Deal discount', Math.round(Engine.dealDiscount() * 100) + '%') +
      stat('Hype from Charisma', '+' + Math.round(Engine.founderHype())) + '</div>' +
      '<h2>Studio</h2><p>Fame ' + Math.round(s.studio.fame) + ' · Critics reputation ' + s.studio.criticsRep + ' · Releases ' + s.studio.releases +
      ' · Production capacity ' + Engine.capacity() + ' · Roster cap ' + Engine.rosterCap() + '</p>' + growthBox();
  }
  function growthBox() {
    const s = Engine.state, g = Engine.growthTier(), q = Engine.upgradeQuote();
    let h = '<h2>Growth tier: ' + esc(tierName(s.studio.tier)) + '</h2><p class="muted">' + esc((CONTENT.GROWTH_TIERS[s.studio.tier] || {}).desc || '') + '</p>' +
      '<p>Productions ' + g.capacity + ' · Roster ' + g.roster + ' · TV shows ' + g.maxSeries + ' · Staff per department ' + g.deptMax + ' · Upkeep ' + money(g.upkeep) + '/wk' +
      (g.boxShare ? ' · Box office share +' + Math.round(g.boxShare * 100) + '%' : '') + '</p>';
    if (q.top || !q.next) return h + (q.top ? '<p>You are at the top tier.</p>' : '');
    const n = q.next;
    h += '<h2>Next: ' + esc(q.name) + '</h2><p class="muted">' + esc((CONTENT.GROWTH_TIERS[q.tier] || {}).desc || '') + '</p>' +
      '<p>Needs fame ' + n.fame + ' (now ' + Math.round(s.studio.fame) + '), ' + n.releases + ' releases (now ' + s.studio.releases + '), costs ' + money(n.cost) + '. ' +
      'Unlocks: productions ' + n.capacity + ', roster ' + n.roster + ', TV shows ' + n.maxSeries + ', staff per department ' + n.deptMax +
      (n.boxShare ? ', box office share +' + Math.round(n.boxShare * 100) + '%' : '') + '. Upkeep ' + money(n.upkeep) + '/wk.</p>';
    return h + '<button class="primary" ' + (q.ok ? '' : 'disabled title="' + esc(q.reason) + '"') + ' onclick="UI.upgrade()">Grow to ' + esc(q.name) + '</button>' +
      (q.ok ? '' : ' <span class="muted">' + esc(q.reason) + '</span>');
  }

// ===== SECTION: VIEW_FINANCE =====
  // Four headline numbers; everything else in collapsible details.
  function viewFinance() {
    const s = Engine.state;
    const E = Engine.TUNING.economy;
    const lw = s.lastWeek;
    const sz = Engine.studioSize();
    const qtd = Engine.quarterToDate();
    const wp = lw.income - lw.costs;
    let h = '<h1>Finance</h1><div class="strip">' + stat('Cash', '<span class="' + (s.cash < 0 ? 'neg' : '') + '">' + money(s.cash) + '</span>') +
      stat('Weekly profit', '<span class="' + (wp < 0 ? 'neg' : '') + '">' + money(wp) + '</span>') +
      stat('Quarter so far', '<span class="' + (qtd.profit < 0 ? 'neg' : '') + '">' + money(qtd.profit) + '</span>') + stat('Debt', money(s.debt)) + '</div>';
    h += '<p><button onclick="UI.loan(true)">Borrow ' + money(Engine.TUNING.loanStep) + '</button> <button onclick="UI.loan(false)">Repay ' + money(Engine.TUNING.loanStep) + '</button> ' +
      '<span class="muted">Limit ' + money(Engine.loanCap()) + ' (rises with fame) · about ' + Math.round(Engine.TUNING.weeklyInterest * 52 * 100) + '% a year.</span></p>';
    h += '<details open><summary><strong>Quarterly summary</strong></summary>' + quarterTable(s.finance.history.slice(-4), qtd) +
      '<p class="muted">Tax on each quarter\'s profit: ' + taxText(E.taxBrackets) + '. Charged at quarter end after earlier losses are used up' +
      (s.finance.lossCarry ? ' (' + money(s.finance.lossCarry) + ' of losses left to use)' : '') + '.</p></details>';
    h += '<details><summary><strong>Last week</strong></summary><p>Income ' + money(lw.income) + ', costs ' + money(lw.costs) + ' (production ' + money(lw.production || 0) + ', talent salaries ' + money(lw.salaries || 0) +
      ', staff ' + money(lw.payroll || 0) + ', overhead ' + money(lw.overhead || 0) + ', interest ' + money(lw.interest) + ').</p></details>';
    h += '<details><summary><strong>Studio size and running costs</strong></summary><p><strong>' + esc(CONTENT.STUDIO_SIZES[sz.level] || ('Level ' + sz.level)) + '</strong> (from ' +
      money(sz.trailingRevenue) + ' revenue over the last year' + (sz.nextRevenue ? '; next size at ' + money(sz.nextRevenue) : '') + ').</p>' +
      '<p>Overhead: ' + money(sz.fixedOverhead) + '/wk fixed (incl. growth-tier upkeep)' + (sz.revenueShare ? ' + ' + Math.round(sz.revenueShare * 100) + '% of weekly revenue' : '') +
      '. Office staff ' + sz.staff + ' (' + money(Engine.officePayroll()) + '/wk); departments ' + money(sz.payroll - Engine.officePayroll()) + '/wk (Staff & HR).</p></details>';
    const win = [];
    s.projects.forEach(p => (p.windows || []).forEach(w => { if (w.paid < w.total) win.push({ p: p, w: w }); }));
    h += '<details><summary><strong>Revenue windows</strong> <span class="muted">(' + win.length + ' running or upcoming)</span></summary>';
    h += win.length ? '<div class="tbl-wrap"><table><thead><tr><th>Film</th><th>Window</th><th>Starts</th><th class="num">Paid</th><th class="num">Total</th></tr></thead><tbody>' +
      win.map(x => '<tr class="clickable" onclick="UI.openProject(' + x.p.id + ')"><td>' + esc(x.p.title) + '</td><td>' + esc(Engine.windowName(x.w.id)) + '</td><td>' + dateLabel(x.w.from) +
        '</td><td class="num">' + money(x.w.paid) + '</td><td class="num">' + money(x.w.total) + '</td></tr>').join('') + '</tbody></table></div>'
      : '<p class="muted">Features earn from TV rights, home video (1980–2014) and streaming (from 2010) after they leave theaters. Each era raises or lowers these payouts (Market page).</p>';
    return h + '</details>';
  }
  // 7.5: "30% up to $500,000, 45% up to $2,000,000, 60% above" from TUNING.economy.taxBrackets.
  function taxText(br) {
    return br.map((b, i) => Math.round(b[1] * 100) + '% ' + (i + 1 < br.length ? 'up to ' + money(br[i + 1][0]) : (br.length > 1 ? 'above' : 'flat'))).join(', ');
  }
  // Columns: last closed quarters (oldest first) + quarter to date. Costs shown as negatives.
  function quarterTable(rows, qtd) {
    const cols = rows.map(r => ({ label: 'Q' + r.quarter + ' ' + r.year, r: r }));
    cols.push({ label: 'This quarter <span class="muted">(wk ' + qtd.weeks + '/' + Engine.TUNING.economy.quarterWeeks + ')</span>', r: qtd, open: true });
    const cell = (v, bold) => '<td class="num' + (v < 0 ? ' neg' : '') + '">' + (bold ? '<strong>' + money(v) + '</strong>' : money(v)) + '</td>';
    const line = (label, fn, bold) => '<tr><td>' + (bold ? '<strong>' + label + '</strong>' : label) + '</td>' + cols.map(c => {
      const v = fn(c.r, c.open);
      return v == null ? '<td class="num muted">–</td>' : cell(v, bold);
    }).join('') + '</tr>';
    return '<div class="tbl-wrap"><table><thead><tr><th></th>' + cols.map(c => '<th class="num">' + c.label + '</th>').join('') + '</tr></thead><tbody>' +
      line('Box office &amp; festivals', r => r.revenue) +
      line('Freelance', r => r.freelance) +
      line('Production', r => -r.production) +
      line('Fees, marketing &amp; deals', r => r.deals) +
      line('Talent salaries', r => -r.salaries) +
      line('Staff payroll', r => -r.payroll) +
      line('Overhead', r => -r.overhead) +
      line('Interest', r => -r.interest) +
      line('Living costs', r => -r.living) +
      line('Profit before tax', r => r.profit, true) +
      line('Tax', (r, open) => open ? null : -r.tax) +
      line('Net', (r, open) => open ? null : r.net, true) +
      '</tbody></table></div>';
  }

// ===== SECTION: VIEW_MARKET =====
  // 6.2: genre table shows popularity × era taste = demand; era effects listed below the release calendar.
  function viewMarket() {
    const mk = Engine.marketInfo();
    let h = '<h1>Market</h1><div class="strip">' + stat('Era', esc(mk.era.name)) + stat('Economy', esc(mk.cycle.name) + ' ' + mult(mk.cycle.mult)) + stat('Season', esc(mk.season.name) + ' ' + mult(mk.season.mult)) +
      stat('Rival releases this week', mk.slate[0].competitors) + stat('Biggest possible opening', money(mk.audienceCap)) + '</div>';
    h += '<p class="muted">' + esc(mk.cycle.blurb) + ' Demand = popularity × era taste. Popularity changes every quarter; era taste changes with each era. Each rival release in your opening week cuts the opening; so do your own films still in their first weeks.</p>';
    h += '<h2>Genres</h2>' + tblHtml('market', {
      rows: () => Engine.marketInfo().genres,
      rowId: g => g.id,
      sort: 'demand', dir: -1,
      columns: [
        { key: 'name', label: 'Genre', value: g => g.name },
        { key: 'pop', label: 'Popularity', num: true, value: g => g.pop, render: g => '<span class="' + (g.pop < 0.9 ? 'neg' : '') + '">' + mult(g.pop) + '</span>' },
        { key: 'taste', label: 'Era taste', num: true, value: g => g.taste, render: g => '<span class="' + (g.taste < 1 ? 'neg' : '') + '">' + mult(g.taste) + '</span>' },
        { key: 'demand', label: 'Demand', num: true, value: g => g.demand, render: g => '<strong class="' + (g.demand < 0.9 ? 'neg' : '') + '">' + mult(g.demand) + '</strong>' },
        { key: 'bar', label: '', value: g => g.demand, render: g => pctBar(g.demand, 1.8) }
      ]
    });
    h += '<h2>Topic trends</h2><p class="muted">Topic interest shifts quarterly; era taste changes over the decades. Topic effects on demand are capped at ±15% so a good story can succeed in a cooler market.</p>' + tblHtml('topicmarket', {
      rows: () => Engine.marketInfo().topics, rowId: t => t.id, sort: 'demand', dir: -1,
      columns: [
        { key: 'name', label: 'Topic', value: t => t.name },
        { key: 'pop', label: 'Interest', num: true, value: t => t.pop, render: t => mult(t.pop) },
        { key: 'taste', label: 'Era taste', num: true, value: t => t.taste, render: t => mult(t.taste) },
        { key: 'demand', label: 'Market effect', num: true, value: t => t.demand, render: t => '<strong>' + mult(t.demand) + '</strong>' }
      ]
    });
    h += '<h2>Release calendar</h2><div class="tbl-wrap"><table><thead><tr><th>Week</th><th>Season</th><th class="num">Rival releases</th><th>Named rival films</th><th class="num">Season</th></tr></thead><tbody>' +
      mk.slate.map(w => '<tr><td>' + dateLabel(w.week) + '</td><td>' + esc(w.season) + '</td><td class="num">' + w.competitors + '</td><td>' +
        (w.rivals.length ? w.rivals.map(x => esc(x.studio) + ': “' + esc(x.title) + '” <span class="muted">(' + esc(nameOf(CONTENT.GENRES, x.genre)) + ', ' + money(x.budget) + ')</span>').join('<br>') : '<span class="muted">–</span>') +
        '</td><td class="num">' + mult(w.seasonMult) + '</td></tr>').join('') +
      '</tbody></table></div>';
    const era = Engine.eraInfo();
    h += '<h2>Era: ' + esc(era.name) + ' <span class="muted">' + era.start + (era.end ? '–' + era.end : ' onward') + '</span></h2><p class="muted">' + esc(era.blurb) + '</p>' +
      '<ul class="plain">' + Engine.eraLines().map(l => '<li>' + esc(l) + '</li>').join('') + '</ul>';
    return h;
  }

// ===== SECTION: VIEW_TV =====
  function viewTV() {
    const s = Engine.state;
    const g = Engine.growthTier();
    let h = '<h1>TV</h1><p class="muted">Shows ' + Engine.tvSlotsUsed() + ' of ' + g.maxSeries + ' (pilots in production included). ' +
      (g.maxSeries ? 'Start a pilot from New project.' : 'TV opens at the ' + esc(tierName(1)) + ' tier.') + '</p>';
    if (!s.series.length) return h + '<p>No series yet.</p>';
    return h + tblHtml('tv', {
      rows: () => Engine.series().slice().reverse(),
      rowId: x => x.projectId,
      onRow: openProject,
      filters: [['all', 'All', null], ['live', 'On air / hiatus', x => x.status !== 'ended'], ['ended', 'Ended', x => x.status === 'ended']],
      columns: [
        { key: 'title', label: 'Show', value: x => x.title },
        { key: 'genre', label: 'Genre', value: x => nameOf(CONTENT.GENRES, x.genre) },
        { key: 'season', label: 'Season', num: true, value: x => x.season },
        { key: 'ep', label: 'Episode', value: x => x.aired, render: x => x.status === 'airing' ? x.aired + ' / ' + x.episodes : (x.status === 'hiatus' ? 'Hiatus · ' + x.hiatusLeft + ' wk' : 'Ended') },
        { key: 'rating', label: 'Last rating', num: true, value: x => { const r = x.ratings.length ? x.ratings : (x.lastRatings || []); return r.length ? r[r.length - 1] : null; } },
        { key: 'avgs', label: 'Season averages', value: x => x.seasonAvgs.join(' · ') || null },
        { key: 'trend', label: 'Ratings trend', num: true, value: x => x.ratingsTrend == null ? null : x.ratingsTrend, render: x => x.ratingsTrend == null ? '—' : (x.ratingsTrend>=0?'+':'')+x.ratingsTrend },
        { key: 'renew', label: 'Last renewal chance', num: true, value: x => x.renewalChance == null ? null : x.renewalChance, render: x => x.renewalChance == null ? '—' : Math.round(x.renewalChance*100)+'%' },
        { key: 'fee', label: 'Fee / cost per ep', num: true, value: x => x.fee - x.epCost, render: x => money(x.fee) + ' / ' + money(x.epCost) },
        { key: 'profit', label: 'Profit', num: true, value: x => x.revenue - x.cost, render: x => '<span class="' + (x.revenue - x.cost < 0 ? 'neg' : '') + '">' + money(x.revenue - x.cost) + '</span>' }
      ]
    });
  }

// ===== SECTION: VIEW_STAFF =====
  function viewStaff() {
    const g = Engine.growthTier();
    const S = Engine.TUNING.staff;
    let h = '<h1>Staff &amp; HR</h1>';
    if (!g.deptMax) return h + '<p>Departments open at the ' + esc(tierName(1)) + ' tier (Founder page).</p>';
    const info = Engine.staffInfo();
    h += '<div class="strip">' + stat('Staff', info.reduce((a, d) => a + d.heads, 0)) + stat('Payroll', money(info.reduce((a, d) => a + d.payroll, 0)) + '/wk') +
      stat('Cap per department', g.deptMax) + stat('Office staff', Engine.studioSize().staff) + '</div>';
    h += '<p class="muted">Effects grow with headcount × skill × morale (diminishing). Morale follows pay; layoffs and pay cuts hurt it. Below ' + S.strikeMorale + ' morale a department may strike.</p>';
    const effect = d => d.id === 'development' ? '+' + d.bonus.toFixed(1) + ' quality' : d.id === 'marketing' ? '+' + d.bonus.toFixed(1) + ' hype' :
      d.id === 'production' ? 'delays ÷' + (1 + d.bonus).toFixed(2) : '+' + Math.round(d.bonus * 100) + '% box office';
    h += info.map(d => '<div class="dept"><h2>' + esc(d.name) + ' <span class="muted">' + d.heads + ' / ' + d.max + '</span>' + (d.strikeWeeks ? ' <span class="neg">On strike · ' + d.strikeWeeks + ' wk</span>' : '') + '</h2>' +
      '<p class="muted">' + esc(d.desc) + ' · Expected new hire skill ' + d.recruitSkill + ' (studio reputation and pay influence recruitment).</p><dl>' +
      dl('Effect now', effect(d)) + dl('Skill', d.skill + ' ' + pctBar(d.skill, 100)) +
      dl('Morale', '<span class="' + (d.morale < S.strikeMorale ? 'neg' : '') + '">' + d.morale + '</span> ' + pctBar(d.morale, 100)) +
      dl('Pay', Math.round(d.payLevel * 100) + '% of market · ' + money(d.pay) + '/wk each · ' + money(d.payroll) + '/wk total') + '</dl><div class="actions">' +
      '<button onclick="UI.staff(\'' + d.id + '\',\'hire\')" ' + (d.heads >= d.max ? 'disabled' : '') + '>Hire (' + money(d.costs.hire) + ')</button>' +
      '<button onclick="UI.staff(\'' + d.id + '\',\'fire\')" ' + (d.heads ? '' : 'disabled') + '>Lay off (' + money(d.costs.fire) + ')</button>' +
      '<button onclick="UI.staff(\'' + d.id + '\',\'raise\')">Raise pay</button>' +
      '<button onclick="UI.staff(\'' + d.id + '\',\'cut\')">Cut pay</button>' +
      '<button onclick="UI.staff(\'' + d.id + '\',\'train\')" ' + (d.heads ? '' : 'disabled') + '>Train (' + money(d.costs.train) + ')</button></div></div>').join('');
    return h;
  }

// ===== SECTION: VIEW_RIVALS =====
  // Display only. Data comes from Engine.rivals(), rivalInfo() and audienceShare(). A row click selects a studio; its detail shows below the table.
  let rivalSel = null;
  function rivalInfos() { return Engine.rivals().map(r => Engine.rivalInfo(r.id)); }
  function q4Sum(r) { return r.results.reduce((a, b) => a + b, 0); }
  function signed(n) { return '<span class="' + (n < 0 ? 'neg' : '') + '">' + money(n) + '</span>'; }
  function stratLabel(r) {
    return esc(r.strategyName) + (r.strategy === r.baseStrategy ? '' : ' <span class="muted">(was ' + esc(r.baseStrategyName) + ')</span>');
  }
  function filmResult(f) {
    return f.stage === 'release' ? 'In theaters · wk ' + f.weeksIn : '<span class="' + (f.result === 'Flop' ? 'neg' : '') + '">' + esc(f.result || '–') + '</span>';
  }
  function rivalDetail(r) {
    const strat = CONTENT.RIVAL_STRATEGIES.find(x => x.id === r.strategy);
    const released = r.films.filter(f => f.stage !== 'planned').sort((a, b) => b.week - a.week);
    const planned = r.films.filter(f => f.stage === 'planned').sort((a, b) => a.week - b.week);
    const gone = r.talent.map(x => Engine.getTalent(x.id)).filter(Boolean);
    let h = '<h2>' + esc(r.name) + (r.status === 'bankrupt' ? ' <span class="neg">Bankrupt · ' + dateLabel(r.closedWeek) + '</span>' : '') + '</h2><dl>' +
      dl('Strategy', stratLabel(r) + (strat ? ' <span class="muted">· ' + esc(strat.desc) + '</span>' : '')) +
      dl('Size', esc(r.tierName)) + dl('Cash', signed(r.cash)) + dl('Fame', Math.round(r.fame)) +
      dl('Typical film', money(r.typicalBudget) + ' <span class="muted">· overhead ' + money(r.overhead) + '/wk</span>') +
      (r.focusNames.length ? dl('Chasing genres', esc(r.focusNames.join(', '))) : '') +
      dl('Quarter results', r.results.length ? r.results.map(signed).join(' · ') : '<span class="muted">None yet</span>') +
      dl('Founded', dateLabel(r.foundedWeek)) + dl('Home region', esc(nameOf(CONTENT.REGIONS,r.region))) + '</dl>';
    h += '<h3>Recent releases</h3>' + (released.length
      ? '<div class="tbl-wrap"><table><thead><tr><th>Title</th><th>Genre</th><th class="num">Budget</th><th>Opened</th><th class="num">Gross</th><th>Result</th></tr></thead><tbody>' +
        released.map(f => '<tr><td><a href="#" onclick="UI.openFilm(\'rival:' + r.id + ':' + f.id + '\');return false">' + esc(f.title) + '</a></td><td>' + esc(nameOf(CONTENT.GENRES, f.genre)) + '</td><td class="num">' + money(f.budget) + '</td><td>' + dateLabel(f.week) +
          '</td><td class="num">' + money(f.gross) + '</td><td>' + filmResult(f) + '</td></tr>').join('') + '</tbody></table></div>'
      : '<p class="muted">No releases yet.</p>');
    if (planned.length) {
      h += '<h3>Coming up</h3><div class="tbl-wrap"><table><thead><tr><th>Title</th><th>Genre</th><th class="num">Budget</th><th>Opens</th></tr></thead><tbody>' +
        planned.map(f => '<tr><td>' + esc(f.title) + '</td><td>' + esc(nameOf(CONTENT.GENRES, f.genre)) + '</td><td class="num">' + money(f.budget) + '</td><td>' + dateLabel(f.week) + '</td></tr>').join('') + '</tbody></table></div>';
    }
    h += '<h3>Talent poached from you</h3>' + (gone.length
      ? '<ul class="plain">' + gone.map(t => '<li><a href="#" onclick="UI.openTalent(' + t.id + ');return false">' + esc(t.name) + '</a> <span class="muted">· ' + esc(roleName(t)) +
          ' · under contract there until ' + dateLabel(t.contract.endWeek) + '</span></li>').join('') + '</ul>'
      : '<p class="muted">No one under contract here has left your studio. Past moves are in the Log.</p>');
    return h;
  }
  function viewRivals() {
    const act = Engine.activeRivals();
    const me = Engine.audienceShare(false).find(x => x.id === 'you');
    const poached = act.reduce((a, r) => a + Engine.rivalInfo(r.id).talent.length, 0);
    const sel = rivalSel != null && Engine.getRival(rivalSel) ? Engine.rivalInfo(rivalSel) : null;
    let h = '<h1>Rivals</h1><div class="strip">' + stat('Active studios', act.length) + stat('Your box office share this year', (me ? me.share : 0) + '%') +
      stat('Talent poached from you', poached) + '</div>';
    h += '<p class="muted">Rival films compete for your release weeks. A studio that keeps losing money chases trends; the weakest go bankrupt and upstarts replace them. Click a studio for its releases and poached talent.</p>';
    h += tblHtml('rivals', {
      rows: rivalInfos,
      rowId: r => r.id,
      onRow: id => { rivalSel = Number(id); render(); },
      sort: 'tier', dir: -1,
      search: r => [r.name, r.strategyName, r.tierName].join(' '),
      filters: [
        ['active', 'Active', r => r.status === 'active'],
        ['all', 'All', null],
        ['closed', 'Closed', r => r.status !== 'active']
      ],
      columns: [
        { key: 'name', label: 'Studio', value: r => r.name, render: r => esc(r.name) + (r.leader ? ' <span class="elite-label">Industry Leader</span>' : '') + (r.status === 'bankrupt' ? ' <span class="neg">closed</span>' : '') },
        { key: 'strategy', label: 'Identity', value: r => r.identity, render: r => esc(r.identity) + ' <span class="muted">· '+esc(r.strategyName)+'</span>' },
        { key: 'tier', label: 'Size', value: r => r.tier, render: r => esc(r.tierName) },
        { key: 'cash', label: 'Cash', num: true, value: r => r.cash, render: r => signed(r.cash) },
        { key: 'fame', label: 'Fame', num: true, value: r => Math.round(r.fame) },
        { key: 'q4', label: 'Last 4 quarters', num: true, value: r => r.results.length ? q4Sum(r) : null, render: r => r.results.length ? signed(q4Sum(r)) : '–' },
        { key: 'films', label: 'Releases', num: true, value: r => r.releases },
        { key: 'poached', label: 'Poached from you', num: true, value: r => r.talent.length }
      ]
    });
    if (sel) h += rivalDetail(sel);
    const news = Engine.state.log.filter(l => l.type === 'rival').slice(-6).reverse();
    if (news.length) h += '<h2>Rival news</h2>' + logList(news);
    const standings=(years)=>{
      const rows=Engine.worldStandings(years,'score').slice(0,10),me=Engine.worldStandings(years,'score').find(x=>x.id==='you');
      return (me?'<p><strong>Your studio:</strong> #'+me.rank+' · '+me.score+' points · '+me.films+' films</p>':'<p class="muted">Your studio has no films in this window.</p>')+
        '<div class="tbl-wrap"><table><thead><tr><th>#</th><th>Studio</th><th class="num">Score</th><th class="num">Films</th><th class="num">Critics</th><th class="num">Trophy weight</th></tr></thead><tbody>'+rows.map(x=>'<tr'+(x.id==='you'?' class="warn"':'')+'><td>'+x.rank+'</td><td>'+esc(x.name)+'</td><td class="num">'+x.score+'</td><td class="num">'+x.films+'</td><td class="num">'+x.critics+'</td><td class="num">'+x.awards+'</td></tr>').join('')+'</tbody></table></div>';
    };
    h+='<h2>Rivalry leaderboards</h2><p class="muted">Based on actual films, critic scores, era-normalized reach and earned awards. Completed years only; no artificial studio-wide bonus for rivals.</p>';
    h+='<details open><summary>Last 3 completed years</summary>'+standings(3)+'</details>';
    h+='<details><summary>Last 5 completed years</summary>'+standings(5)+'</details>';
    const world=Engine.worldYearbook();
    if(world.decadeChampions.length)h+='<h2>Decade champions</h2><div class="tbl-wrap"><table><thead><tr><th>Decade</th><th>Box office</th><th>Critics</th><th>Awards</th><th>International</th></tr></thead><tbody>'+world.decadeChampions.slice().reverse().map(y=>'<tr><td>'+y.decade+'s</td><td>'+esc(y.boxOffice||'–')+'</td><td>'+esc(y.critics||'–')+'</td><td>'+esc(y.awards||'–')+'</td><td>'+esc(y.international||'–')+'</td></tr>').join('')+'</tbody></table></div>';
    return h;
  }

// ===== SECTION: VIEW_AWARDS =====
  // 6.3. Display only: Engine.awardsInfo(). Campaigns go through Engine.awardCampaign. 8.3: trophy icons in the trophy case.
  function viewAwards() {
    const a = Engine.awardsInfo();
    let h = '<h1>Awards</h1><div class="strip">' + stat('Next ceremony', esc(a.next.name) + ' · ' + dateLabel(a.next.week) + '<div class="muted">covers ' + a.next.covers + ' releases</div>') +
      stat('Current prestige', Engine.reputationInfo().currentPrestige) + stat('Trophies', a.trophies.length) + '</div>';
    h += '<p class="muted">' + esc(a.name) + ' judges features released the year before: ' + a.categories.map(c => esc(c.name)).join(', ') +
      '. Nominations and major wins support current prestige; lifetime trophies remain permanent. Campaigns add a small edge but cannot guarantee a win.</p>';
    const lastYear = (Engine.state.annualReviews || []).slice(-1)[0];
    if (lastYear) h += '<button type="button" onclick="UI.replayYearEnd(' + lastYear.year + ')">Replay ' + lastYear.year + ' Year-End Honors</button>';
    h += '<h2>Films in the running</h2>';
    h += a.eligible.length
      ? '<div class="tbl-wrap"><table><thead><tr><th>Film</th><th>Ceremony</th><th class="num">Score</th><th class="num">Buzz</th><th>Campaign</th><th></th></tr></thead><tbody>' +
        a.eligible.map(f => '<tr><td><a href="#" onclick="UI.openProject(' + f.id + ');return false">' + esc(f.title) + '</a></td><td>' + f.year + '</td><td class="num">' + f.score + '</td><td class="num">' + f.buzz +
          '</td><td>' + esc(a.campaigns[f.campaign.level].name) + (f.campaign.spent ? ' <span class="muted">(' + money(f.campaign.spent) + ')</span>' : '') + '</td><td>' +
          f.quotes.slice(1).map(q => '<button ' + (q.ok ? '' : 'disabled title="' + esc(q.reason) + '"') + ' onclick="UI.awardCampaign(' + f.id + ',' + q.level + ')">' + esc(q.name) + ' · ' + money(q.pay || q.cost) + '</button>').join(' ') +
          '</td></tr>').join('') + '</tbody></table></div>'
      : '<p class="muted">No features waiting for a ceremony. A film is eligible the year after it opens in theaters.</p>';
    h += '<h2>Trophy case</h2>' + (a.trophies.length
      ? '<ul class="trophy-list">' + a.trophies.slice().reverse().map(t => '<li>' + trophyIcon(true, isPicture(t.cat)) + '<span><a href="#" onclick="UI.openProject(' + t.projectId + ');return false">' + esc(t.title) + '</a> <span class="muted">· ' + esc(t.cat) + ' · ' + t.year + '</span></span></li>').join('') + '</ul>'
      : '<p class="muted">None yet.</p>');
    h += '<div class="fc-awards-reference"><h2>Schedule & eligibility</h2><p class="muted">Reference information is available below when you need it.</p>';
    h += '<details class="fc-reference"><summary>Annual ceremonies · schedule and categories</summary><p class="muted">Major ceremonies arrive over the decades. A film can earn nominations in several ceremonies based on its format and eligibility.</p><ul class="plain">' +
      a.ceremonies.map(c => '<li><strong>' + esc(c.name) + '</strong> <span class="muted">· week ' + c.week + ' · since ' + c.startYear + ' · ' + esc(c.categories.join(', ')) + '</span></li>').join('') + '</ul></details>';
    h += '<details class="fc-reference"><summary>Festival circuit · schedule and rules</summary><p class="muted">Local → World, plus up to two new specialist festivals per decade. Submissions are automatic; selections and trophies are judged on each festival’s scheduled week. Runner-ups receive Jury Special Mentions. Excellent small studios remain eligible. Shorts and features can attend multiple events.</p><ul class="plain">' +
      a.circuit.map(f => '<li><strong>' + esc(f.level) + '</strong> — ' + esc(f.name) + ' <span class="muted">· week ' + f.week + ' · ' + esc(f.prize) + (f.focus ? ' · focus: ' + esc(f.focus) : '') + '</span></li>').join('') + '</ul></details>';
    h += '</div>';
    h += '<h2>Past ceremonies</h2>' + (a.history.length ? a.history.map((rec, i) =>
      '<details><summary><strong>' + rec.year + '</strong> <span class="muted">· ' + rec.covered + ' films</span></summary>' +
      rec.cats.map(c => '<p><strong>' + esc(c.name) + '</strong>'+(c.unawarded?' · No qualifying winner':'')+'</p><ul class="plain">' + c.nominees.map(n =>
        '<li>' + (n.winner ? '🏆 <strong>' : '') + (n.filmId ? '<a href="#" onclick="UI.openFilm(\'' + esc(n.filmId) + '\');return false">' + esc(n.title) + '</a>' : esc(n.title)) + (n.winner ? '</strong>' : '') + ' <span class="muted">· ' + (n.projectId != null ? '<strong>' + esc(n.studio) + '</strong>' : esc(n.studio)) + '</span></li>').join('') + '</ul>').join('') +
      '</details>').join('') : '<p class="muted">The first ceremony is in ' + a.next.year + '.</p>');
    return h;
  }

// ===== SECTION: VIEW_SCORE =====
  // 7.1 / 7.2. Display only: Engine.scoreInfo() (live or locked) and Engine.leaderboard() in the shared table.
  function scoreDetail(id, c) {
    if (id === 'awards') return c.wins + ' won (' + c.picture + ' Best Picture), ' + c.noms + ' nominations, ' + c.festPrizes + ' festival prizes, ' + c.festSelections + ' selections';
    if (id === 'hits') return c.hits + ' hit films, ' + c.shows + ' show' + (c.shows === 1 ? '' : 's') + ' with ' + Engine.TUNING.score.hitSeasons + '+ seasons';
    return '';
  }
  function viewScore() {
    const sc = Engine.scoreInfo(), T = Engine.TUNING, s = Engine.state;
    const ended = sc.reason === 'bankrupt' ? 'Bankrupt · ' + dateLabel(sc.week) : dateLabel(sc.week);
    let h = '<h1>Score</h1><div class="strip">' + stat(sc.locked ? 'Final score' : 'Score now', sc.value) +
      stat('Profit', '<span class="' + (sc.profit < 0 ? 'neg' : '') + '">' + money(sc.profit) + '</span>') +
      stat(sc.locked ? 'Locked' : 'Locks', sc.locked ? ended : 'End of ' + T.scoreLockYear) + (sc.rank ? stat('Rank on this device', '#' + sc.rank) : '') + '</div>';
    h += '<p class="muted">' + (sc.locked
      ? 'This run is over for scoring and the number is frozen' + (sc.reason === 'lock' ? '; you can keep playing.' : '.')
      : 'Your score is live and locks at the end of ' + T.scoreLockYear + '. Bankruptcy ends the run with the score so far.') + '</p>';
    h += '<h2>Breakdown</h2><div class="tbl-wrap"><table><thead><tr><th>Part</th><th class="num">Points</th><th>How it counts</th></tr></thead><tbody>' +
      CONTENT.SCORE.parts.map(p => '<tr><td><strong>' + esc(p.name) + '</strong></td><td class="num">' + Math.round(sc.parts[p.id]) + '</td><td>' + esc(p.desc) +
        (scoreDetail(p.id, sc.counts) ? ' <span class="muted">· ' + esc(scoreDetail(p.id, sc.counts)) + '</span>' : '') + '</td></tr>').join('') +
      '</tbody></table></div>';
    const rep=Engine.reputationInfo(),lp=Engine.legacyInfo();
    h+='<h2>Studio legacy</h2><div class="strip">'+stat('Lifetime fame',rep.fame) + stat('Current buzz',rep.buzz)+stat('Current prestige',rep.currentPrestige)+stat('Legacy points',rep.lifetimeLegacy)+'</div>';
    h+='<p class="muted">Lifetime achievements remain permanent even as current public attention and prestige change. Awards and older films still count toward your historical legacy.</p>';
    h+=lp.milestones.length?'<ul class="plain">'+lp.milestones.map(m=>'<li><strong>'+esc(m.description)+'</strong> · '+dateLabel(m.week)+'</li>').join('')+'</ul>':'<p class="muted">No special studio milestones yet.</p>';
    if(sc.locked){
      const recap=sc.legacyRecap||Engine.legacyRecap();
      h+='<h2>Final studio legacy recap</h2><p class="muted">The productions, creative partners and rivalries that defined your studio.</p>';
      h+=recap.films.length?'<h3>Defining films</h3><ul class="plain">'+recap.films.map(f=>'<li><a href="#" onclick="UI.openFilm(\''+esc(f.id)+'\');return false">'+esc(f.title)+'</a> · '+f.year+' · '+f.wins+' major wins</li>').join('')+'</ul>':'';
      h+=recap.partners.length?'<h3>Creative partners</h3><ul class="plain">'+recap.partners.map(p=>'<li>'+esc(p.name)+' · '+esc(p.role)+' · '+p.films+' films together</li>').join('')+'</ul>':'';
      h+='<p><strong>Recent leading rival:</strong> '+esc(recap.topRival||'None recorded')+' · <strong>Decades with a championship:</strong> '+recap.decadeTitles+'</p>';
    }
    h += '<h2>Leaderboard <span class="muted">· this device, top ' + T.score.leaderboardSize + '</span></h2>' + tblHtml('leaderboard', {
      rows: () => Engine.leaderboard().map((e, i) => Object.assign({ id: i, rank: i + 1 }, e)),
      rowId: e => e.id,
      sort: 'rank',
      rowClass: e => (sc.locked && e.rank === sc.rank ? 'warn' : ''),
      columns: [
        { key: 'rank', label: '#', num: true, value: e => e.rank },
        { key: 'name', label: 'Name', value: e => e.name },
        { key: 'studio', label: 'Studio', value: e => e.studio },
        { key: 'score', label: 'Score', num: true, value: e => e.score },
        { key: 'date', label: 'Date', value: e => e.date },
        { key: 'end', label: 'Ended', value: e => e.year, render: e => e.year + (e.reason === 'bankrupt' ? ' · bankrupt' : '') }
      ]
    });
    if (Engine.leaderboard().length) h += '<p><button onclick="UI.clearLeaderboard()">Clear leaderboard</button> <span class="muted">Saved separately from the game save.</span></p>';
    else h += '<p class="muted">No finished runs yet. A run is recorded when its score locks.</p>';
    return h;
  }

// ===== SECTION: VIEW_NEWS =====
  // 6.4. Display only: Engine.news() (real log entries grouped by CONTENT.NEWS filters) in the shared table.
  function viewNews() {
    const fs = Engine.newsFilters();
    return '<h1>News</h1><p class="muted">What has happened in your studio and the business, newest first. The last ' + Engine.TUNING.news.feedMax + ' events are kept.</p>' + tblHtml('news', {
      rows: () => Engine.news(null).map((n, i) => Object.assign({ id: i }, n)),
      rowId: n => n.id,
      search: n => n.label + ' ' + n.text,
      filters: [['all', 'All', null]].concat(fs.map(f => [f.id, f.name, n => n.cat === f.id])),
      columns: [
        { key: 'week', label: 'Date', value: n => n.week, render: n => dateLabel(n.week) },
        { key: 'cat', label: 'Section', value: n => n.label },
        { key: 'text', label: 'Headline', value: n => n.text }
      ],
      sort: 'week', dir: -1
    });
  }

// ===== SECTION: VIEW_LOG =====
  function viewLog() { return '<h1>Log</h1>' + logList(Engine.state.log.slice().reverse()); }

// ===== SECTION: DRAWER =====
  let drawer = null;     // { kind: 'project' | 'talent', id } or null
  let drawerMsg = '';
  function openProject(id) { drawer = { kind: 'project', id: Number(id) }; drawerMsg = ''; renderDrawer(); }
  function openTalent(id) { drawer = { kind: 'talent', id: Number(id) }; drawerMsg = ''; renderDrawer(); }
  function openFilm(id) { drawer = { kind: 'film', id: id }; drawerMsg = ''; renderDrawer(); }
  function filmDrawer(f) {
    let h = drawerHead(f.title, esc(f.studio) + ' · ' + esc(nameOf(CONTENT.GENRES, f.genre)) + ' / ' + esc(nameOf(CONTENT.TOPICS, f.topic || '')) + ' · ' + f.year);
    h += '<div class="poster film-detail-poster">' + posterFor(f) + '</div>';
    if(hasMedia() && f.genre) h += '<div class="film-still">' + Media.filmStillSVG(f) + '</div>';
    if(f.projectId != null) h += posterActions(Engine.getProject(f.projectId));
    if (f.franchiseId) h += '<div class="franchise-card"><strong>Franchise: '+esc(f.franchiseName||f.title)+'</strong> · installment '+(f.installment||1)+
      '<p>'+Engine.franchiseFilms(f.franchiseId).map(x=>'<a href="#" onclick="UI.openFilm(\''+esc(x.id)+'\');return false">'+esc(x.title)+'</a>').join(' · ')+'</p></div>';
    if (f.projectId != null && Engine.sequelEligibility(f.projectId).ok) h += '<button class="primary" onclick="UI.beginSequel('+f.projectId+')">Develop a sequel</button>';
    h += '<h3>Production</h3><dl>' + dl('Format', esc(f.format)) + dl('Started', f.startWeek == null ? 'Not recorded' : dateLabel(f.startWeek)) +
      dl('Released', dateLabel(f.releaseWeek)) + dl('Home region', esc(nameOf(CONTENT.REGIONS, f.region || ''))) +
      dl('Budget', money(f.budget || 0)) + dl('Status', esc(f.result || f.stage || '—')) + '</dl>';
    h += '<h3>Cast and crew</h3><dl>' + [['director','Director'],['writer','Writer'],['lead','Lead actor'],['crew','Crew']].map(a =>
      dl(a[1], (f.creditIds && typeof f.creditIds[a[0]]==='number' && ['director','writer'].includes(a[0]) && Engine.getTalent(f.creditIds[a[0]])
        ? '<a href="#" onclick="UI.openTalent('+f.creditIds[a[0]]+');return false">'+esc(f.credits[a[0]])+'</a>'
        : esc((f.credits || {})[a[0]] || 'Not recorded')))).join('') +
      ((f.credits&&f.credits.supporting||[]).length?dl('Supporting actors',esc(f.credits.supporting.join(', '))):'') +
      ((f.credits&&f.credits.specialists||[]).length?dl('Specialist crew',esc(f.credits.specialists.join(', '))):'') + '</dl>';
    if (f.talentSnapshot && Object.keys(f.talentSnapshot).length) h += '<details class="craft-breakdown"><summary>Talent at the time of production</summary>' +
      Object.keys(f.talentSnapshot).flatMap(role=>{const group=Array.isArray(f.talentSnapshot[role])?f.talentSnapshot[role]:[f.talentSnapshot[role]];
        return group.filter(Boolean).map(t=>'<p><strong>'+esc(role)+'</strong>: '+esc(t.name)+' — skill '+t.skill+', fame '+t.fame+' ('+esc(t.recognition||'Local Talent')+')</p>');}).join('') + '</details>';
    if ((f.staff || []).length) h += '<p class="muted">Studio departments at release: ' + f.staff.map(x => esc(x.department) + ' (' + x.heads + ' staff, skill ' + x.skill + ')').join('; ') + '</p>';
    h += '<h3>Performance</h3><dl>' + dl('Quality', f.quality == null ? '—' : f.quality+'/100') + dl('Critics', f.critic == null ? 'Not recorded' : f.critic+'/100') + dl('Audience', f.audience == null ? 'Not recorded' : f.audience+'/100') +
      dl('Worldwide gross', money(f.gross || 0)) + dl('Studio revenue', money(f.revenue || 0)) +
      (f.reissueRevenue?dl('Classic reissues',money(f.reissueRevenue)+' (separate from original theatrical gross)'):'') +
      dl('Profit', f.profit == null ? 'Pending' : money(f.profit)) + '</dl>';
    h += qualityDetails(f.qualityBreakdown, f.hypeBreakdown);
    if ((f.regions || []).length) h += '<h4>Distribution</h4><p>' + f.regions.map(id => esc(nameOf(CONTENT.REGIONS,id)) + (f.regionalGross && f.regionalGross[id] != null ? ' · ' + money(f.regionalGross[id]) : '')).join('<br>') + '</p>';
    h += '<h3>Recognition</h3><dl>' + dl('Annual awards', (f.awards || []).map(a => (a.won ? '🏆 ' : 'Nominated: ') + esc(a.ceremony || 'Golden Reel') + ' · ' + esc(a.category || a.cat) + (a.personName?' — '+esc(a.personName):'') + ' (' + a.year + ')').join('<br>') || 'None') +
      dl('Festivals', (f.festResults || []).map(a => esc(a.festival) + ' · ' + esc(a.result)).join('<br>') || 'None') + '</dl>';
    if ((f.decisions || []).length) h += '<h3>Production decisions</h3><p class="muted">' + f.decisions.map(esc).join(' · ') + '</p>';
    if (f.review || f.audience != null) {
      const review = f.review || Engine.receptionText(f);
      h += '<p class="film-review"><strong>' + esc(review.headline) + '</strong> — ' + esc(review.text) + '</p>';
    }
    if (f.legacy) h += '<p class="muted">Some historic credits and market data were not recorded in earlier versions.</p>';
    if (f.projectId != null) h += '<button onclick="UI.openProject(' + f.projectId + ')">Open original project record</button>';
    return h;
  }
  function qualityDetails(q, hype) {
    if (!q && !hype) return '';
    let h = '<details class="craft-breakdown"><summary><strong>Why this film scored this way</strong></summary>';
    if (q) {
      const roles=q.roles||{};
      h += '<p>Quality before diminishing returns: <strong>'+q.raw+'</strong> · Final quality: <strong>'+q.result+'/100</strong></p>' +
        (q.ensemble!=null?'<p>Supporting cast and expanded crew: <strong>+'+q.ensemble+' quality</strong> (with diminishing returns)</p>':'') +
        '<dl>'+Object.keys(roles).map(k=>dl(esc(k)+' skill contribution',Math.round(roles[k]*10)/10)).join('')+
        dl('Production resources',q.production)+dl('Genre / topic match',q.story)+dl('Creative team / traits',q.creative)+dl('Department skill',q.staff)+
        dl('Era',q.era)+dl('Your decisions',q.decisions)+dl('Uncertainty',q.variance)+'</dl>';
    }
    if (hype) h+='<p>Public awareness: <strong>'+hype.result+'/100</strong> (studio '+hype.studio+', creative publicity '+hype.publicity+', decisions '+hype.decisions+').</p>';
    return h+'</details>';
  }
  function toggleRegion(id, region, checked) {
    const p = Engine.getProject(id);
    if (!p) return;
    const next = (p.regions || [Engine.homeRegion()]).filter(x => x !== region);
    if (checked) next.push(region);
    const result = Engine.setDistribution(id, next);
    drawerMsg = result.ok ? '' : result.reason;
    renderDrawer();
  }
  function closeDrawer() { drawer = null; renderDrawer(); }
  function decisionLabel(p, id) {
    if (id === 'marketing') return 'Marketing budget for the release';
    const fixed = CONTENT.FIXED_DECISIONS ? Object.keys(CONTENT.FIXED_DECISIONS).map(k => CONTENT.FIXED_DECISIONS[k]) : [];
    const all = (CONTENT.DECISIONS || []).concat(fixed, CONTENT.TALENT_EVENTS || [], CONTENT.EVENTS || []);
    const d = all.find(x => x.id === id);
    return d ? String(d.text).replace(/\{title\}/g, p.title).replace(/\{name\}/g, 'A cast member') : id;
  }
  const dl = (k, v) => '<div class="dl"><dt>' + k + '</dt><dd>' + v + '</dd></div>';
  function drawerHead(title, sub) {
    return '<div class="drawer-head"><div><h2>' + esc(title) + '</h2><div class="muted">' + sub + '</div></div>' +
      '<button onclick="UI.closeDrawer()" aria-label="Close">✕</button></div>' + (drawerMsg ? '<div class="alert">' + esc(drawerMsg) + '</div>' : '');
  }
  // 8.3: trophies and festival badges under the poster, portrait and trophies in the talent drawer. 8.5: gross and revenue count up (cu).
  function projectDrawer(p) {
    const profit = profitOf(p);
    const pct = p.budget ? Math.min(100, Math.round(p.spent / p.budget * 100)) : 0;
    let h = drawerHead(p.title, esc(nameOf(Engine.formats(), p.format)) + ' · ' + esc(nameOf(CONTENT.GENRES, p.genre)) + ' · ' + esc(nameOf(CONTENT.TOPICS, p.topic)));
    if (typeof Media !== 'undefined') h += '<div class="poster">' + posterFor(p) + '</div>' + posterActions(p);
    if(p.franchiseId) h += '<p class="franchise-card">'+esc(p.franchiseName||p.title)+' · Franchise installment '+(p.installment||1)+'</p>';
    if(p.format==='feature' && Engine.sequelEligibility(p.id).ok) h += '<button class="primary" onclick="UI.beginSequel('+p.id+')">Develop a sequel</button>';
    h += awardIcons(p);   // 8.3
    h += '<dl>';
    h += dl('Stage', esc(CONTENT.STAGE_LABELS[p.stage]) + (p.stageWeeksLeft > 0 && p.stage !== 'release' && p.stage !== 'done' ? ' · ' + p.stageWeeksLeft + ' wk left' : ''));
    h += dl('Budget', money(p.budget));
    h += dl('Talent fees', money(p.fees || 0));
    h += dl('Spent', money(p.spent) + ' <div class="bar"><div style="width:' + pct + '%"></div></div>');
    h += dl('Critics', p.critic == null ? '–' : p.critic + '/100');
    h += dl('Audience', p.audience == null ? '–' : p.audience + '/100');
    if (p.format === 'feature') h += dl('Gross', cu('gross-' + p.id, p.gross));
    h += dl('Revenue', cu('revenue-' + p.id, p.revenue));
    h += dl('Profit', profit == null ? '–' : '<span class="' + (profit < 0 ? 'neg' : '') + '">' + money(profit) + '</span>');
    h += dl('Result', esc(p.result || '–'));
    if (p.format === 'feature' || p.format === 'short') {
      const regionNames = (p.regions || [Engine.homeRegion()]).map(id => nameOf(CONTENT.REGIONS, id));
      h += dl('Release regions', esc(regionNames.join(', ')) + ' <span class="muted">· HQ ' + esc(nameOf(CONTENT.REGIONS, Engine.homeRegion())) + '</span>');
      h += dl('Overseas distribution cost', money(p.distributionCost || 0));
      if (p.regionalGross && Object.keys(p.regionalGross).length) h += dl('Regional gross', Object.keys(p.regionalGross).map(id => esc(nameOf(CONTENT.REGIONS, id)) + ': ' + money(p.regionalGross[id])).join('<br>'));
    }
    if ((p.festResults || []).length) h += dl('Festivals', p.festResults.map(f => esc(f.result) + ' · ' + (f.tier ? esc(f.tier) + ' tier · ' : '') + esc(f.festival)).join('<br>'));
    if ((p.awards || []).length) h += dl('Awards', p.awards.map(a => (a.won ? '🏆 Won ' : 'Nominated: ') + esc(a.category || nameOf(CONTENT.AWARDS.categories, a.cat)) + ' · ' + esc(a.ceremony || CONTENT.AWARDS.ceremony) + ' (' + a.year + ')').join('<br>'));
    if (p.market) h += dl('Opening market', mult(p.market.mult) + ' <span class="muted">(genre ' + mult(p.market.genre) + (p.market.taste != null ? ', era taste ' + mult(p.market.taste) : '') + (p.market.topic != null ? ', topic ' + mult(p.market.topic) : '') +
      ', season ' + mult(p.market.season) + ', economy ' + mult(p.market.cycle) + ', ' + p.market.competitors + ' rivals)</span>');
    (p.windows || []).forEach(w => { h += dl(esc(Engine.windowName(w.id)), money(w.paid) + ' of ' + money(w.total) + (w.paid < w.total ? ' <span class="muted">· from ' + dateLabel(w.from) + '</span>' : '')); });
    const sr = Engine.series().find(x => x.projectId === p.id);
    if (sr) h += dl('Series', 'Season ' + sr.season + ' · ' + (sr.status === 'airing' ? 'episode ' + sr.aired + '/' + sr.episodes : sr.status) + (sr.seasonAvgs.length ? ' · averages ' + sr.seasonAvgs.join(', ') : ''));
    h += '</dl>';
    if ((p.format === 'feature' || p.format === 'short') && p.releaseWeek == null) {
      const quote = Engine.regionQuote(p, p.regions);
      h += '<h2>Distribution planning</h2><p class="muted">Choose markets before release. The home market is included. Shorts gain modest screening income; features gain potential box office. Overseas distribution has extra costs.</p>' +
        '<div class="region-grid">' + CONTENT.REGIONS.map(r => '<label><input type="checkbox" ' + ((p.regions || []).includes(r.id) ? 'checked ' : '') + (r.id === Engine.homeRegion() ? 'disabled ' : '') +
          'onchange="UI.toggleRegion(' + p.id + ',\'' + r.id + '\',this.checked)"> ' + esc(r.name) + '</label>').join('') + '</div>' +
        '<p>Estimated extra cost: <strong>' + money(quote.cost) + '</strong> · ' + quote.estimated + '</p>';
    }
    h += qualityDetails(p.qualityBreakdown,p.hypeBreakdown);
    if (p.review) h += '<p class="film-review"><strong>' + esc(p.review.headline) + '</strong> — ' + esc(p.review.text) + '</p>';
    if(p.continuity&&p.continuity.notes.length) h+=dl('Sequel continuity',esc(p.continuity.notes.map(x=>x.originalName+': '+x.status+' ('+(x.delta>=0?'+':'')+x.delta+' hype)').join('; ')));
    if(p.backgroundCrew)h+=dl('Expanded background crew','Level '+p.backgroundCrew);
    h += '<h2>Cast and crew</h2><dl>' + Engine.castSummary(p).map(c =>
      dl(esc(c.label), typeof c.id === 'number' && Engine.getTalent(c.id)
        ? '<a href="#" onclick="UI.openTalent(' + c.id + ');return false">' + esc(c.name) + '</a>' + (c.skill != null ? ' <span class="muted">· skill ' + c.skill + ' · fame ' + c.fame + ' · ' + esc(c.recognition) + '</span>' : '')
        : esc(c.name))).join('') + '</dl>';
    h += '<h2>Decisions taken</h2>';
    h += p.usedEvents.length
      ? '<ul class="plain">' + p.usedEvents.map(id => '<li>' + esc(decisionLabel(p, id)) + '</li>').join('') + '</ul><p class="muted">Situations you faced. Your choices are in the Log.</p>'
      : '<p class="muted">None yet.</p>';
    return h;
  }
  function talentDrawer(t) {
    const st = Engine.talentStatus(t);
    let h = drawerHead(t.name, esc(roleName(t)) + ' · ' + esc(st.label)) + portrait(t) + talentTrophies(t) + '<dl>';   // 8.3
    h += dl('Skill', t.skill + ' <div class="bar"><div style="width:' + t.skill + '%"></div></div>');
    h += dl('Fame', t.fame + ' <div class="bar"><div style="width:' + t.fame + '%"></div></div>');
    h += dl('Recognition', esc(Engine.recognition(t).name));
    h += dl('Home region', esc(nameOf(CONTENT.REGIONS, t.homeRegion || 'northamerica')));
    h += dl('Career', esc(t.career && t.career.trend || 'Established'));
    if(t.career && t.career.recent && t.career.recent.length) {
      const recent=t.career.recent.slice(-3).reverse();
      h += dl('Recent work', recent.map(x=>esc(x.film)+' · skill '+x.skill+' / fame '+x.fame).join('<br>'));
    }
    h += '<p class="muted">Craft boosts film quality; recognition and fame drive audience awareness. Tiers never block casting.</p>';
    h += dl('Reliability', Engine.effReliability(t));
    h += dl('Genre fit', esc(t.affinity.map(g => nameOf(CONTENT.GENRES, g)).join(', ')));
    if (t.specialty) { const sp = CONTENT.CREW_SPECIALTIES.find(x => x.id === t.specialty); if (sp) h += dl('Specialty', esc(sp.desc)); }
    h += dl('Fee', money(Engine.talentFee(t, 'short')) + ' short · ' + money(Engine.talentFee(t, 'feature')) + ' feature');
    const interest = Engine.recruitmentInterest(t, 'feature');
    if (interest.elite && !st.roster) h += dl('Exclusive offer interest', Math.round(interest.chance * 100) + '% · Fame, critics and prestige help');
    if (t.awards && (t.awards.noms || t.awards.wins)) h += dl('Awards', t.awards.wins + ' won · ' + (t.awards.noms + t.awards.wins) + ' nominations');
    if((t.awardHistory||[]).length) h+=dl('Personal honors',t.awardHistory.slice(-8).reverse().map(a=>esc(a.year+' · '+a.ceremony+' · '+a.category+(a.won?' — WIN':' — nominated'))).join('<br>'));
    h += '</dl><h2>Traits</h2><ul class="plain">' + Engine.traitsOf(t).map(tr => '<li><strong>' + esc(tr.name) + '</strong> – ' + esc(tr.desc) + '</li>').join('') + '</ul>';
    const credits = t.credits.map(id => Engine.getProject(id)).filter(Boolean);
    h += '<h2>Credits with you</h2>' + (credits.length
      ? '<ul class="plain">' + credits.map(p => '<li><a href="#" onclick="UI.openProject(' + p.id + ');return false">' + esc(p.title) + '</a>' + (p.result ? ' <span class="muted">· ' + esc(p.result) + '</span>' : '') + '</li>').join('') + '</ul>'
      : '<p class="muted">None yet.</p>');
    if(['director','writer'].includes(t.role)) {
      const career=Engine.talentCareer(t.id);
      h+='<section class="artist-career"><h2>Full career profile</h2><p class="muted">'+esc(career.recognition.name)+' · '+career.totalCredits+' verified film credits across player and rival productions. Historical gaps are not invented.</p>';
      h+='<h3>Filmography</h3>'+(career.films.length?'<ul class="plain">'+career.films.map(f=>'<li><a href="#" onclick="UI.openFilm(\''+esc(f.id)+'\');return false">'+esc(f.title)+'</a> · '+f.year+' · '+esc(f.studio)+' · '+(f.critic==null?'unrated':f.critic+'/100 critics')+(f.awards.length?' · '+f.awards.filter(a=>a.won).length+' personal wins':'')+'</li>').join('')+'</ul>':'<p class="muted">No verified filmography yet.</p>');
      h+='<h3>Career milestones & incidents</h3>'+(career.timeline.length?'<ul class="career-timeline">'+career.timeline.map(e=>'<li><strong>'+esc(e.type)+'</strong> · '+dateLabel(e.week)+' — '+esc(e.text)+'</li>').join('')+'</ul>':'<p class="muted">No recorded career milestones or controversies yet.</p>');
      h+='</section>';
    }
    h += '<h2>Contract</h2>';
    const years = [1, 2, 3].slice(0, Engine.TUNING.contracts.maxYears);
    if (st.roster) {
      h += '<dl>' + dl('Salary', money(t.contract.salary) + '/wk') + dl('Ends', dateLabel(t.contract.endWeek) + ' · ' + Engine.weeksLeft(t) + ' wk left') + '</dl>';
      if (Engine.isExpiring(t)) h += '<div class="alert">Contract ends soon.</div>';
      h += '<div class="actions">' + years.map(y => {
        const q = Engine.contractQuote(t.id, y, true);
        return '<button ' + (q.ok ? '' : 'disabled title="' + esc(q.reason) + '"') + ' onclick="UI.renew(' + t.id + ',' + y + ')">Renew ' + y + ' yr · ' + money(q.salary) + '/wk + ' + money(q.bonus) + '</button>';
      }).join('') + '<button onclick="UI.releaseTalent(' + t.id + ')">Release (severance ' + money(Engine.severanceOf(t)) + ')</button></div>';
    } else {
      const q1 = Engine.contractQuote(t.id, 1, false);
      if (!q1.ok) h += '<p class="muted">' + esc(q1.reason) + '</p>';
      h += '<p class="muted">Exclusive: weekly salary, no fee per project.' + (Engine.founderRole() === 'filmmaker' ? ' Your first signing moves the founder to running the studio (no more directing or writing).' : '') + '</p>';
      h += '<div class="actions">' + years.map(y => {
        const q = Engine.contractQuote(t.id, y, false);
        return '<button ' + (q.ok ? '' : 'disabled') + ' onclick="UI.sign(' + t.id + ',' + y + ')">Sign ' + y + ' yr · ' + money(q.salary) + '/wk + ' + money(q.bonus) + '</button>';
      }).join('') + '</div>';
    }
    return h;
  }
  // 8.5: runs after every render (render() ends with renderDrawer()), so all count-up numbers on the page start here.
  function fxPass() { if (typeof Media !== 'undefined') Media.countUp(document); }
  function renderDrawer() {
    const el = $('drawer'), scrim = $('scrim');
    const s = Engine.state;
    const obj = s && drawer ? (drawer.kind === 'film' ? Engine.filmById(drawer.id) : drawer.kind === 'talent' ? Engine.getTalent(drawer.id) : Engine.getProject(drawer.id)) : null;
    if (!obj) { drawer = null; el.classList.remove('open'); el.setAttribute('aria-hidden', 'true'); scrim.hidden = true; fxPass(); return; }
    el.innerHTML = drawer.kind === 'film' ? filmDrawer(obj) : drawer.kind === 'talent' ? talentDrawer(obj) : projectDrawer(obj);
    el.classList.add('open');
    el.setAttribute('aria-hidden', 'false');
    scrim.hidden = false;
    fxPass();
  }

// ===== SECTION: MODAL =====
  // 6.1: events show their category as the title (CONTENT.EVENT_CATEGORIES); disasters are marked "Crisis".
  // 6.2: era transitions (scope 'era') show "New era", a list of changes (pending.lines) and a Continue button without effect hints.
  // 7.1: the score lock (scope 'score') works the same way ("Final score" + the breakdown lines); the bankrupt card shows the score and rank.
  // 8.5: the era popup is a transition card: era backdrop, years, name (animated in unless reduce motion is on).
  function eraCard(pd) {
    const info = Engine.eraInfo(pd.eraId);
    return '<div class="card era-card"><div class="era-banner" aria-hidden="true">' + eraBannerSvg(info.id) + '</div><div class="era-body">' +
      '<div class="era-kicker">New era · ' + info.start + (info.end ? '–' + info.end : ' onward') + '</div><h2>' + esc(info.name) + '</h2><p>' + esc(pd.text) + '</p>' +
      (pd.lines && pd.lines.length ? '<ul class="plain">' + pd.lines.map(l => '<li>' + esc(l) + '</li>').join('') + '</ul>' : '') +
      pd.choices.map((c, i) => '<button class="choice" onclick="UI.choose(' + i + ')"><strong>' + esc(c.label) + '</strong></button>').join('') + '</div></div>';
  }
  function eraBannerSvg(eraId) { return typeof Media !== 'undefined' ? Media.backdropSVG(eraId) : ''; }
  function renderModal() {
    const s = Engine.state;
    const m = $('modal');
    if (s && s.gameOver) {
      const sc = s.score;
      m.innerHTML = '<div class="card"><h2>Bankrupt</h2><p>' + esc(s.studio.name) + ' closed its doors in ' + dateLabel(s.gameOver.week) + '.</p>' +
        (sc ? '<p>Final score: <strong>' + sc.value + '</strong>' + (sc.rank ? ' · rank #' + sc.rank + ' on this device' : '') + '</p><ul class="plain">' +
          Engine.scoreLines(sc).map(l => '<li>' + esc(l) + '</li>').join('') + '</ul>' : '') +
        '<button class="primary" onclick="UI.quit()">New game</button></div>';
      m.hidden = false;
    } else if (s && s.pending && s.pending.scope === 'era') {
      m.innerHTML = eraCard(s.pending);
      m.hidden = false;
    } else if (s && s.pending) {
      const pd = s.pending;
      const plain = pd.scope === 'score';
      const head = pd.scope === 'score' ? 'Final score' : ((pd.category && CONTENT.EVENT_CATEGORIES && CONTENT.EVENT_CATEGORIES[pd.category]) || 'Decision');
      m.innerHTML = '<div class="card"><h2>' + esc(head) + (pd.disaster ? ' <span class="neg">· Crisis</span>' : '') + (s.queue.length ? ' <span class="muted">(+' + s.queue.length + ' waiting)</span>' : '') + '</h2><p>' + esc(pd.text) + '</p>' +
        (pd.lines && pd.lines.length ? '<ul class="plain">' + pd.lines.map(l => '<li>' + esc(l) + '</li>').join('') + '</ul>' : '') +
        pd.choices.map((c, i) => '<button class="choice" onclick="UI.choose(' + i + ')"><strong>' + esc(c.label) + '</strong>' +
          (plain ? '' : '<br><span class="muted">' + effectHint(c.effects) + '</span>') + '</button>').join('') +
        '</div>';
      m.hidden = false;
    } else {
      m.hidden = true;
      m.innerHTML = '';
    }
  }

// ===== SECTION: YEAR_END_HONORS =====
  // Annual ceremonies run at their normal dates. This is a presentation-only
  // recap of recorded nominees/winners and festival awards, never a second draw.
  let yearEndStage = 0;
  let yearEndReplayYear = null;
  let yearEndRendered = '';
  let yearEndReturnFocus = null;
  function currentYearEndReport() {
    const state = Engine.state;
    if (!state || state.gameOver || state.pending || tutorialStep >= 0) return null;
    const reports = state.annualReviews || [];
    if (yearEndReplayYear != null) return reports.find(r => r.year === yearEndReplayYear) || null;
    const d = Engine.dateOf();
    if (d.week !== Engine.TUNING.weeksPerYear) return null;
    const r = reports.find(x => x.year === d.year);
    return r && !(state.yearEndPresented || []).includes(d.year) ? r : null;
  }
  function yearEndFacts(report) {
    const s = Engine.state;
    const ceremonies = (s.awards.history || []).filter(x => x.year === report.year);
    const nominations = ceremonies.flatMap(c => c.cats.flatMap(cat => (cat.nominees || []).filter(n => n.projectId != null).map(n => ({ceremony:c.name, category:cat.name, nominee:n}))));
    const wins = nominations.filter(n => n.nominee.winner);
    const festivals = s.projects.flatMap(p => (p.festResults || []).filter(f => f.year === report.year && f.kind === 'winner')
      .map(f => ({title:p.title, festival:f.festival, prize:f.result})));
    const film = id => s.projects.find(p => p.id === id);
    const topGross = film(report.topGrossId), topCritic = film(report.topCriticId);
    return {ceremonies, nominations, wins, festivals, topGross, topCritic};
  }
  function yearEndCeremonies(facts) {
    if (!facts.ceremonies.length) return '<p class="muted">No qualifying annual ceremony results were recorded this year. Ceremonies judge films released the previous year, starting in 1971.</p>';
    return facts.ceremonies.map(rec => '<section class="year-end-ceremony"><h3>' + esc(rec.name) + '</h3>' +
      rec.cats.map(cat => {
        const winner = (cat.nominees || []).find(n => n.winner);
        const involved = (cat.nominees || []).filter(n => n.projectId != null);
        return '<div class="year-end-category' + (winner && winner.projectId != null ? ' own-win' : '') + '"><div class="year-end-category-name">' + esc(cat.name) + '</div>' +
          '<div>' + (winner ? '<strong>' + esc(winner.title) + '</strong> <span class="muted">· ' + esc(winner.studio) + '</span>' +
            (winner.personName ? ' <small>· ' + esc(winner.personName) + '</small>' : '') : '<span class="muted">No qualifying winner</span>') + '</div>' +
          (involved.length ? '<small class="year-end-our-noms">Your nominations: ' + involved.map(n => esc(n.title) + (n.winner ? ' ★ WIN' : '')).join(' · ') + '</small>' : '') + '</div>';
      }).join('') + '</section>').join('');
  }
  function renderYearEndHonors() {
    const root = $('year-end-awards');
    if (!root) return;
    const report = currentYearEndReport();
    if (!report) { root.hidden = true; root.innerHTML = ''; yearEndRendered = ''; return; }
    const key = report.year + ':' + yearEndStage;
    if (yearEndRendered === key && !root.hidden) return;
    if (root.hidden) yearEndReturnFocus = document.activeElement;
    yearEndRendered = key;
    const facts = yearEndFacts(report);
    const opener = '<div class="year-end-intro"><div class="year-end-laurel" aria-hidden="true">✦ &nbsp; ★ &nbsp; ✦</div><div class="year-end-year">' + report.year + '</div><h2 id="year-end-title">Year-End Honors</h2>' +
      '<p id="year-end-description">The industry celebrates the year. See the actual award winners, your studio’s nominations, and your most acclaimed films.</p>' +
      '<div class="year-end-stats"><div><strong>' + facts.wins.length + '</strong><span>ceremony wins</span></div><div><strong>' + facts.nominations.length + '</strong><span>nominations</span></div><div><strong>' + facts.festivals.length + '</strong><span>festival prizes</span></div></div></div>';
    const outcome = '<div class="year-end-results"><div class="year-end-summary">' +
      '<div><small>Your highest grossing release</small><strong>' + esc(facts.topGross ? facts.topGross.title : 'No releases this year') + '</strong>' +
      (facts.topGross ? '<span>' + money(facts.topGross.gross || 0) + '</span>' : '') + '</div>' +
      '<div><small>Critics’ favorite release</small><strong>' + esc(facts.topCritic ? facts.topCritic.title : 'No releases this year') + '</strong>' +
      (facts.topCritic ? '<span>' + Math.round(facts.topCritic.critic || 0) + '/100 critics</span>' : '') + '</div></div>' +
      (facts.wins.length ? '<h3>🏆 Your major wins</h3><ul class="year-end-honors-list">' + facts.wins.map(x =>
        '<li><strong>' + esc(x.category) + '</strong> · ' + esc(x.nominee.title) + ' <small>(' + esc(x.ceremony) + ')</small></li>').join('') + '</ul>' :
        '<p class="year-end-encourage">No major ceremony victories this year. A nomination is still an achievement—and next year is a fresh competition.</p>') +
      (facts.festivals.length ? '<h3>Festival victories</h3><ul class="year-end-honors-list">' + facts.festivals.map(f =>
        '<li><strong>' + esc(f.title) + '</strong> · ' + esc(f.festival) + ' · ' + esc(f.prize) + '</li>').join('') + '</ul>' : '') +
      '<h3>The award ceremonies</h3>' + yearEndCeremonies(facts) + '</div>';
    root.innerHTML = '<div class="year-end-shade"><div class="year-end-card" role="dialog" aria-modal="true" aria-labelledby="year-end-title" aria-describedby="year-end-description">' +
      '<div class="year-end-mast"><span>FINAL CUT · THE YEAR IN FILM</span><div class="year-end-mast-actions">' +
      (hasMedia() && Media.musicState().supported ? '<button id="year-sound-btn" type="button" aria-pressed="' + Media.settings.sfx + '" onclick="UI.yearEndSound()">♫ Sound ' + (Media.settings.sfx ? 'On' : 'Off') + '</button>' : '') +
      '<button type="button" aria-label="Dismiss year-end honors" onclick="UI.closeYearEndHonors()">✕</button></div></div>' +
      opener + (yearEndStage === 0 ? '' : outcome) +
      '<div class="year-end-actions"><button type="button" onclick="UI.closeYearEndHonors()">Close</button>' +
      (yearEndStage === 0 ? '<button id="year-end-action" type="button" class="primary" onclick="UI.revealYearEndHonors()">Reveal the winners</button>' :
        '<button id="year-end-action" type="button" class="primary" onclick="UI.closeYearEndHonors(true)">View Awards</button>') + '</div></div></div>';
    root.hidden = false;
    const next = $('year-end-action'); if (next) next.focus();
  }
  function yearEndSound() {
    if (!hasMedia()) return;
    Media.toggleSfx();
    const btn = $('year-sound-btn');
    if (btn) { btn.textContent = '♫ Sound ' + (Media.settings.sfx ? 'On' : 'Off'); btn.setAttribute('aria-pressed', String(Media.settings.sfx)); }
  }
  function revealYearEndHonors() {
    const report = currentYearEndReport();
    if (!report) return;
    yearEndStage = 1;
    yearEndRendered = '';
    renderYearEndHonors();
    if (hasMedia()) {
      Media.uiSound('reveal');
      if (yearEndFacts(report).wins.length) Media.confetti({count:90});
    }
  }
  function closeYearEndHonors(openAwards) {
    const report = currentYearEndReport();
    if (report && Engine.state) {
      Engine.state.yearEndPresented = Engine.state.yearEndPresented || [];
      if (!Engine.state.yearEndPresented.includes(report.year)) Engine.state.yearEndPresented.push(report.year);
      Engine.save();
    }
    const focus = yearEndReturnFocus;
    yearEndStage = 0; yearEndReplayYear = null; yearEndRendered = ''; yearEndReturnFocus = null;
    const el = $('year-end-awards'); if (el) { el.hidden = true; el.innerHTML = ''; }
    if (openAwards) { go('awards'); return; }
    if (focus && focus.isConnected) focus.focus();
    render();
  }
  function replayYearEnd(year) {
    if (!Engine.state || Engine.state.pending || Engine.state.gameOver) return;
    if (!(Engine.state.annualReviews || []).some(r => r.year === year)) return;
    yearEndReplayYear = year; yearEndStage = 0; yearEndRendered = '';
    renderYearEndHonors();
  }

// ===== SECTION: INTERACTIVE TUTORIAL =====
  // An expandable, nonmodal guide: page controls remain clickable and clickable
  // navigation steps advance automatically. There is no saved progress or game logic.
  const TUTORIAL_STEPS = [
    { title: 'Welcome to Final Cut', view: 'dashboard', visit: 'dashboard', target: '#nav [data-view="dashboard"]', location: 'Dashboard', text: 'Your studio begins in 1970. You can click anything while this guide is open. First, click Dashboard in the sidebar (or use Open Dashboard below).' },
    { title: 'Read your dashboard', view: 'dashboard', target: '#main .strip', location: 'Studio → Dashboard · Cash & Weekly burn', text: 'Watch Cash, Weekly burn and profit. Fame is long-term recognition, Current Buzz is recent attention, and Current Prestige reflects recent achievements. Try keeping enough money for payroll.' },
    { title: 'Open New Project', view: 'newproject', visit: 'newproject', target: '#nav [data-view="newproject"]', location: 'Studio → New project', text: 'Click New project in the sidebar to design your first film. Shorts are the most affordable way to learn, but you can try other unlocked formats.' },
    { title: 'Plan your film', view: 'newproject', target: '#main .form', location: 'New project → Title / Format / Genre / Topic / Budget', text: 'Choose a title, format, genre, topic and budget. These affect audience demand, production costs, and potential results. Try a different format or budget to preview the costs.' },
    { title: 'Choose talent and crew', view: 'newproject', target: '#main .form.cast', location: 'New project → Cast and crew', text: 'Skill helps film quality; fame boosts opening hype. A little-known actor can be excellent. Directors, writers, lead actors and optional supporting cast add different costs and benefits.' },
    { title: 'View your projects', view: 'projects', visit: 'projects', target: '#nav [data-view="projects"]', location: 'Studio → Projects', text: 'Click Projects to see films in production and films awaiting release. Projects appear here after you start them. You do not need to spend money or start a movie to finish this guide.' },
    { title: 'Move production forward', view: 'projects', target: '#topbar [data-guide="advance"]', location: 'Top bar → Advance to next decision', text: 'Next week and Advance to next decision move time forward. Production events offer tradeoffs. Before a release, you can set distribution regions; shorts have affordable regional options. Advancing time is optional during this tutorial.' },
    { title: 'Open My Filmography', view: 'filmography', visit: 'filmography', target: '#nav [data-view="filmography"]', location: 'Studio → My Filmography', text: 'Click My Filmography. Every completed film is kept here, along with its poster, credits, finances and critical reception.' },
    { title: 'Learn from your film history', view: 'filmography', target: '#main', location: 'My Filmography → All Films / My Rankings', text: 'Compare your best films by overall score, genre, topic, box office, critics and awards. Click a finished film for its details. This list will be empty until you release one.' },
    { title: 'Check studio finances', view: 'finance', visit: 'finance', target: '#nav [data-view="finance"]', location: 'Business → Finance', text: 'Click Finance to review income, spending, cash and debt. Big films bring bigger opportunities and higher risks; avoid overspending on star salaries and extra crew.' },
    { title: 'Study rival studios', view: 'rivals', visit: 'rivals', target: '#nav [data-view="rivals"]', location: 'Business → Rivals', text: 'Click Rivals to see competing studios. Their favorite genres, successes and franchises shape world competition. You can check Market too for shifts in audience demand.' },
    { title: 'Watch festivals and awards', view: 'awards', visit: 'awards', target: '#nav [data-view="awards"]', location: 'World → Awards', text: 'Click Awards to review nominations and winners. Prestigious recognition is rare; quality and critical praise matter. Smaller studios can still earn major honors with an exceptional movie.' },
    { title: 'Your next move', view: 'newproject', target: '#nav [data-view="newproject"]', location: 'Studio → New project / Founder / World', text: 'You are ready to run your studio. Use Founder to grow your business, World Film Archive to study historic films, and New project to make your first release. Reopen this guide anytime with ? Tutorial.' }
  ];
  let tutorialStep = -1;
  let tutorialMinimized = false;
  let tutorialReturnFocus = null;
  function tutorialClearHighlights() {
    document.querySelectorAll('.tutorial-target').forEach(el => el.classList.remove('tutorial-target'));
  }
  function tutorialHighlight(item, scroll) {
    tutorialClearHighlights();
    if (tutorialMinimized || !Engine.state || !item) return;
    let target = document.querySelector(item.target || '');
    // On compact layouts the sidebar is normally hidden behind the Menu button.
    if (target && !target.getClientRects().length && target.closest('#nav')) target = $('mobile-nav-toggle');
    if (!target || !target.getClientRects().length) return;
    target.classList.add('tutorial-target');
    if (scroll && item.view === view && target.closest('#main')) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
  function renderTutorial(scroll) {
    const el = $('tutorial');
    if (!el) return;
    if (tutorialStep < 0) {
      el.hidden = true; el.innerHTML = '';
      document.body.classList.remove('tutorial-open');
      tutorialClearHighlights();
      return;
    }
    const n = TUTORIAL_STEPS.length, i = Math.max(0, Math.min(n - 1, tutorialStep));
    const item = TUTORIAL_STEPS[i], last = i === n - 1;
    el.hidden = false;
    document.body.classList.add('tutorial-open');
    if (tutorialMinimized) {
      el.innerHTML = '<button type="button" class="tutorial-minibar" onclick="UI.tutorialMinimize()" aria-label="Resume tutorial">' +
        '▶ Resume tutorial · Step ' + (i + 1) + ' / ' + n + '</button>';
      tutorialClearHighlights();
      return;
    }
    const where = item.view && Engine.state && view !== item.view;
    const label = GROUPS.flatMap(g => g[1]).find(x => x[0] === item.view);
    el.innerHTML = '<section class="tutorial-card" role="complementary" aria-labelledby="tutorial-title" aria-describedby="tutorial-description">' +
      '<div class="tutorial-head"><span class="tutorial-kicker">GUIDED TOUR · ' + (i + 1) + ' / ' + n + '</span>' +
      '<div class="tutorial-head-actions"><button type="button" class="tutorial-close" onclick="UI.tutorialMinimize()" aria-label="Minimize tutorial" title="Minimize">−</button>' +
      '<button type="button" class="tutorial-close" aria-label="Close tutorial" onclick="UI.closeTutorial()" title="Close">✕</button></div></div>' +
      '<div class="tutorial-progress" aria-hidden="true"><div style="width:' + Math.round((i + 1) / n * 100) + '%"></div></div>' +
      '<h2 id="tutorial-title">' + esc(item.title) + '</h2>' +
      '<p id="tutorial-description">' + esc(item.text) + '</p>' +
      '<p class="tutorial-location"><strong>Find it:</strong> ' + esc(item.location) + '</p>' +
      (!Engine.state ? '<p class="tutorial-note">Preview only — start a new game to explore these sections.</p>' :
        item.visit && !where ? '<p class="tutorial-note">You are already on this page. Click its sidebar link or select Next.</p>' :
        item.visit ? '<p class="tutorial-note">Click the highlighted link to advance automatically, or use Open section.</p>' : '') +
      '<div class="tutorial-actions">' +
      '<button type="button" class="tutorial-skip" onclick="UI.closeTutorial()">Skip tutorial</button>' +
      (i ? '<button type="button" onclick="UI.tutorialMove(-1)">Back</button>' : '') +
      (where ? '<button type="button" onclick="UI.tutorialOpenSection()">Open ' + esc(label ? label[1] : 'section') + '</button>' : '') +
      (last ? '<button type="button" class="primary" onclick="UI.closeTutorial(true)">Finish · Plan a film</button>' :
        '<button type="button" class="primary" onclick="UI.tutorialMove(1)">Next</button>') +
      '</div></section>';
    tutorialHighlight(item, scroll);
  }
  function openTutorial() {
    tutorialReturnFocus = document.activeElement;
    tutorialStep = 0;
    tutorialMinimized = false;
    closeMobileNav();
    if (drawer) closeDrawer();
    renderTutorial(false);
    const heading = $('tutorial-title');
    if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus(); }
  }
  function tutorialMove(delta) {
    if (tutorialStep < 0) return;
    tutorialStep = Math.max(0, Math.min(TUTORIAL_STEPS.length - 1, tutorialStep + delta));
    tutorialMinimized = false;
    renderTutorial(true);
  }
  function tutorialOpenSection() {
    if (tutorialStep < 0 || !Engine.state) return;
    const item = TUTORIAL_STEPS[tutorialStep];
    if (item.view) go(item.view);
  }
  function tutorialMinimize() {
    if (tutorialStep < 0) return;
    tutorialMinimized = !tutorialMinimized;
    renderTutorial(false);
  }
  function closeTutorial(planFilm) {
    if (tutorialStep < 0) return;
    tutorialStep = -1;
    tutorialMinimized = false;
    renderTutorial(false);
    if (planFilm && Engine.state) { tutorialReturnFocus = null; go('newproject'); return; }
    if (tutorialReturnFocus && tutorialReturnFocus.isConnected) tutorialReturnFocus.focus();
    tutorialReturnFocus = null;
    renderYearEndHonors();
  }
  function tutorialKeydown(e) {
    if (tutorialStep < 0) return false;
    if (e.key === 'Escape') { e.preventDefault(); closeTutorial(); return true; }
    // Crucially, normal keyboard navigation is NOT trapped by the guide.
    return false;
  }

// ===== SECTION: RENDER =====
  // A+B editorial screen navigation: concise context, no new game state.
  const PAGE_CONTEXT = {
    saves:['CAMPAIGN LIBRARY','Manage independent studio careers and local save slots'],
    newproject:['GREENLIGHT DESK','Plan cast, budget, creative direction and distribution'],
    filmography:['YOUR CATALOG','Released pictures, awards and permanent studio history'],
    talent:['CASTING OFFICE','Scout talent by skill, recognition, reliability and fee'],
    roster:['CONTRACT DESK','Manage active contracts and long-term collaborators'],
    staff:['STUDIO OPERATIONS','Department leadership, staffing and morale'],
    founder:['EXECUTIVE OFFICE','Career development, personal choices and studio growth'],
    finance:['FINANCIAL OFFICE','Cash flow, quarterly results and financing'],
    market:['MARKET INTELLIGENCE','Audience tastes, economic climate and competition'],
    rivals:['THE COMPETITION','Other studios, market position and strategic rivals'],
    tv:['TELEVISION DIVISION','Programs, renewals, ratings and ongoing seasons'],
    archive:['WORLD ARCHIVE','A permanent record of films across the industry'],
    rankings:['BOX-OFFICE & CRITICS','Compare film performance throughout the world'],
    awards:['AWARDS OFFICE','Ceremonies, nominations and lifetime honors'],
    score:['LEGACY REPORT','Your studio achievements across the decades'],
    news:['THE INDUSTRY WIRE','Headlines and market events'],
    log:['STUDIO JOURNAL','A chronological record of decisions and events']
  };
  function screenPrelude(screen){
    const item=PAGE_CONTEXT[screen];
    return item ? '<div class="fc-page-prelude"><span class="fc-page-id">' + esc(item[0]) +
      '</span><span class="fc-page-context">' + esc(item[1]) + '</span></div>' : '';
  }
  function render() {
    renderTop();
    renderNav();
    const s = Engine.state;
    $('app').classList.toggle('start', !s);
    $('app').classList.toggle('save-manager', view==='saves');
    let h;
    if (!s && view === 'saves') h = viewSaveLibrary();
    else if (!s) h = viewStart();
    else if (view === 'saves') h = viewSaveLibrary();
    else if (view === 'newproject') h = viewNewProject();
    else if (view === 'projects') h = viewProjects();
    else if (view === 'filmography') h = viewFilmography();
    else if (view === 'archive') h = viewArchive();
    else if (view === 'rankings') h = viewRankings();
    else if (view === 'talent') h = viewTalent();
    else if (view === 'roster') h = viewRoster();
    else if (view === 'founder') h = viewFounder();
    else if (view === 'finance') h = viewFinance();
    else if (view === 'market') h = viewMarket();
    else if (view === 'rivals') h = viewRivals();
    else if (view === 'tv') h = viewTV();
    else if (view === 'staff') h = viewStaff();
    else if (view === 'awards') h = viewAwards();
    else if (view === 'score') h = viewScore();
    else if (view === 'news') h = viewNews();
    else if (view === 'log') h = viewLog();
    else h = viewDashboard();
    if (s && view !== 'dashboard' && view !== 'projects') h = screenPrelude(view) + h;
    if (flash) h = '<div class="alert">' + esc(flash) + '</div>' + h;
    $('main').innerHTML = h;
    if (viewTransitionPending && hasMedia() && Media.motionOK()) {
      $('main').classList.remove('fc-view-enter');
      void $('main').offsetWidth;
      $('main').classList.add('fc-view-enter');
    } else $('main').classList.remove('fc-view-enter');
    viewTransitionPending = false;
    renderModal();
    renderDrawer();
    renderTutorial();
    renderYearEndHonors();
  }

// ===== SECTION: ACTIONS =====
  let saveBusy=false;
  function clearForSaveTransition(){
    drawer=null;drawerMsg='';centerProjectId=null;centerShowOlder=false;
    tutorialStep=-1;tutorialMinimized=false;tutorialReturnFocus=null;
    yearEndReplayYear=null;yearEndRendered='';yearEndStage=0;
    yearEndReturnFocus=null;
    if(posterEdit)closePosterEditor();
    resetHistory();setFlash('');
  }
  async function startGame(){
    if(saveBusy)return;
    const opts={studioName:$('f_studio').value,founderName:$('f_founder').value,homeRegion:$('f_region').value};
    saveBusy=true;
    try{
      if(typeof SaveSlots!=='undefined')await SaveSlots.beginNew(opts);
      else Engine.newGame(opts);
      clearForSaveTransition();go('dashboard');openTutorial();
    }catch(err){setFlash('Could not start campaign: '+err.message);render();}
    finally{saveBusy=false;}
  }
  async function loadGame(){
    if(saveBusy)return;
    if(typeof SaveSlots==='undefined'){
      const r=Engine.load();setFlash(r.ok?'':r.reason);resetHistory();render();return;
    }
    const info=SaveSlots.list();
    if(!info.activeId){go('saves');return;}
    await openSave(info.activeId);
  }
  async function saveNow(){
    if(saveBusy)return;
    if(typeof SaveSlots==='undefined'){
      setFlash(Engine.save()?'Campaign saved.':'Save failed: browser storage is full.');render();return;
    }
    try{
      const result=SaveSlots.manualSave();
      setFlash(result.ok?'Campaign saved to the active slot.':result.reason);
    }catch(err){setFlash('Save failed: '+err.message);}
    render();
  }
  async function openSave(slotId){
    if(saveBusy)return;
    const list=typeof SaveSlots!=='undefined'?SaveSlots.list():null;
    const target=list?.slots.find(s=>s.id===slotId);
    if(!target){setFlash('Save slot not found.');render();return;}
    if(Engine.state&&!target.active&&!confirm('Load "'+target.name+'"? Your current campaign will be safely archived first.'))return;
    saveBusy=true;
    try{
      await SaveSlots.activate(slotId);
      clearForSaveTransition();render();
    }catch(err){setFlash('Could not load save: '+err.message);render();}
    finally{saveBusy=false;}
  }
  function renameSave(slotId){
    if(typeof SaveSlots==='undefined')return;
    const slot=SaveSlots.list().slots.find(s=>s.id===slotId);
    if(!slot)return;
    const value=prompt('Name this save slot:',slot.name);
    if(value==null)return;
    try{SaveSlots.rename(slotId,value);setFlash('Save slot renamed.');}
    catch(err){setFlash('Rename failed: '+err.message);}
    render();
  }
  async function copySave(){
    if(saveBusy||!Engine.state||typeof SaveSlots==='undefined')return;
    const info=SaveSlots.list(),active=info.slots.find(s=>s.active);
    const label=prompt('Name the new independent save:',(active?.name||Engine.state.studio.name)+' (copy)');
    if(label==null)return;
    saveBusy=true;
    try{
      await SaveSlots.duplicate(label);
      setFlash('Independent copy created. Your original studio is still active.');
    }catch(err){setFlash('Could not create copy: '+err.message);}
    finally{saveBusy=false;render();}
  }
  async function deleteSave(slotId){
    if(saveBusy||typeof SaveSlots==='undefined')return;
    const slot=SaveSlots.list().slots.find(s=>s.id===slotId);
    if(!slot||!confirm('Permanently delete "'+slot.name+'"? This removes that campaign and its custom posters from this browser. Export a backup first if needed.'))return;
    saveBusy=true;
    try{
      await SaveSlots.remove(slotId);
      clearForSaveTransition();
      view=Engine.state?'saves':'saves';
      setFlash('Save deleted.');
    }catch(err){setFlash('Could not delete save: '+err.message);}
    finally{saveBusy=false;render();}
  }
  function quit(){
    if(typeof SaveSlots==='undefined'){
      if(Engine.state&&!Engine.state.gameOver&&!confirm('Start a new game? Your current save will be replaced when you start.'))return;
      Engine.clearSave();location.reload();return;
    }
    if(Engine.state&&!confirm('Return to title? The current studio will remain saved in its own slot.'))return;
    if(Engine.state){
      const result=SaveSlots.manualSave();
      if(!result.ok){setFlash(result.reason);render();return;}
    }
    Engine.closeSession();clearForSaveTransition();render();
  }
  function nextWeek() { if (currentYearEndReport()) return; Engine.nextTurn(); render(); }
  function advance() { if (currentYearEndReport()) return; Engine.advance(); render(); }
  function choose(i) { Engine.choose(i); render(); }
  function beginSequel(id) {
    const q=Engine.sequelEligibility(id);
    if(!q.ok){drawerMsg=q.reason;renderDrawer();return;}
    const p=q.parent;
    draft.format='feature';draft.title=(p.franchiseName||p.title)+(p.installment>1?' '+(p.installment+1):' II');
    draft.genre=p.genre;draft.topic=p.topic;draft.tier=p.tier;
    draft.sequelOf=p.id;
    const suggested=Engine.sequelCastSuggestion(p);
    draft.cast={director:suggested.director,writer:suggested.writer,lead:suggested.lead,crew:suggested.crew};
    draft.supporting=(suggested.supporting||[]).slice(0,Engine.ensembleCaps('feature',draft.tier).supporting);
    draft.specialists=[];draft.backgroundCrew=0;
    closeDrawer();go('newproject');
  }
  function cancelSequel(){delete draft.sequelOf;draft.supporting=[];render();}
  function startProject() {
    const r = Engine.startProject(draft);
    if (r.ok) { draft.title = ''; delete draft.sequelOf; draft.cast = { director: 'founder', writer: 'founder', lead: '', crew: '' };draft.supporting=[];draft.specialists=[];draft.backgroundCrew=0; go('dashboard'); } else { setFlash(r.reason); render(); }
  }
  function loan(take) { const r = take ? Engine.takeLoan() : Engine.repayLoan(); setFlash(r.ok ? '' : r.reason); render(); }
  function awardCampaign(id, level) { const r = Engine.awardCampaign(id, level); setFlash(r.ok ? '' : r.reason); render(); }
  function upgrade() { const r = Engine.upgradeTier(); setFlash(r.ok ? '' : r.reason); render(); }
  function launchInitiative(id){const r=Engine.startInitiative(id);setFlash(r.ok?'Initiative funded.':r.reason);render();}
  function reissueClassic(id){const r=Engine.reissueFilm(id);setFlash(r.ok?'Classic film reissued.':r.reason);render();}
  function staff(id, action) { const r = Engine.staffAction(id, action); setFlash(r.ok ? '' : r.reason); render(); }
  function contractResult(r, okMsg) { drawerMsg = r.ok ? okMsg : r.reason; render(); }
  function sign(id, years) { contractResult(Engine.signExclusive(id, years), 'Signed.'); }
  function renew(id, years) { contractResult(Engine.renewContract(id, years), 'Renewed.'); }
  function releaseTalent(id) {
    const t = Engine.getTalent(id);
    if (!t || !confirm('Release ' + t.name + '? Severance: ' + money(Engine.severanceOf(t)) + '.')) return;
    contractResult(Engine.releaseContract(id), 'Released.');
  }
  // 8.1: music. setVolume doesn't re-render, so dragging the slider isn't interrupted.
  function toggleMusic() { if (typeof Media !== 'undefined') { Media.toggleMusic(); render(); } }
  function setVolume(v) { if (typeof Media !== 'undefined') Media.setVolume(Number(v) / 100); }
  // 7.2: wipes only the leaderboard, never the game save.
  function clearLeaderboard() {
    if (!confirm('Clear the leaderboard on this device? This cannot be undone.')) return;
    Engine.clearLeaderboard();
    render();
  }

// ===== SECTION: POSTER_ART_AND_BACKUP =====
  let posterEdit = null;
  async function selectPosterStyle(id,style) {
    const p=Engine.getProject(id);if(!p)return;
    // A generated design must visibly replace an uploaded poster. Reclaim the
    // local image bytes so hidden artwork does not accumulate across projects.
    if(p.posterCustom) {
      try { await PosterStore.remove(id); }
      catch(e) { drawerMsg='Could not remove uploaded art: '+e.message;renderDrawer();return; }
      p.posterCustom=false;
    }
    if(style===-1){delete p.posterStyleId;Engine.save();}
    else Engine.setPosterStyle(id,style);
    renderDrawer();
  }
  async function removePoster(id) {
    const p=Engine.getProject(id);if(!p)return;
    try {await PosterStore.remove(id);p.posterCustom=false;Engine.save();renderDrawer();}
    catch(e) {drawerMsg=e.message;renderDrawer();}
  }
  async function beginPosterUpload(id,input) {
    const f=input.files&&input.files[0];if(!f)return;
    if(!['image/png','image/jpeg','image/webp'].includes(f.type)||f.size>8500000){drawerMsg='Select a JPG, PNG or WebP under 8 MB.';renderDrawer();return;}
    try {
      const img=await createImageBitmap(f);
      if(img.width<150||img.height<200||img.width*img.height>50000000)throw new Error('Poster must be at least 150×200 and under 50 megapixels.');
      posterEdit={id,img,zoom:100,x:50,y:50};
      const el=$('poster-editor');
      el.hidden=false;
      el.innerHTML='<div class="poster-editor-card"><h2>Crop your film poster</h2><p>Preview (portrait 2:3)</p>'+
        '<canvas id="poster-crop" width="600" height="900" role="img" aria-label="Poster crop preview"></canvas>'+
        '<label>Zoom <input id="poster-zoom" type="range" min="100" max="250" value="100" oninput="UI.posterCropPreview()"></label>'+
        '<label>Horizontal position <input id="poster-x" type="range" min="0" max="100" value="50" oninput="UI.posterCropPreview()"></label>'+
        '<label>Vertical position <input id="poster-y" type="range" min="0" max="100" value="50" oninput="UI.posterCropPreview()"></label>'+
        '<div class="actions"><button class="primary" onclick="UI.saveCustomPoster()">Use this poster</button><button onclick="UI.closePosterEditor()">Cancel</button></div></div>';
      posterCropPreview();
    }catch(e){drawerMsg='Poster could not be opened: '+e.message;renderDrawer();}
  }
  function posterCropPreview(){
    if(!posterEdit)return;
    const c=$('poster-crop');if(!c)return;
    const ctx=c.getContext('2d'),im=posterEdit.img;
    const zoom=Number($('poster-zoom').value)/100,px=Number($('poster-x').value)/100,py=Number($('poster-y').value)/100;
    const scale=Math.max(600/im.width,900/im.height)*zoom,w=im.width*scale,h=im.height*scale;
    ctx.clearRect(0,0,600,900);ctx.drawImage(im,(600-w)*px,(900-h)*py,w,h);
  }
  function closePosterEditor(){if(posterEdit&&posterEdit.img.close)posterEdit.img.close();posterEdit=null;$('poster-editor').hidden=true;$('poster-editor').innerHTML='';}
  async function saveCustomPoster(){
    if(!posterEdit)return;
    const id=posterEdit.id,canvas=$('poster-crop');
    try{
      const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Image encoding failed.')),'image/webp',.81));
      const out=blob.type==='image/webp'?blob:await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Image encoding failed.')),'image/jpeg',.76));
      await PosterStore.put(id,out);
      const p=Engine.getProject(id);if(p){p.posterCustom=true;Engine.save();}
      closePosterEditor();renderDrawer();
    }catch(e){alert('Poster could not be saved: '+e.message);}
  }
  async function exportBackup(){
    if(!Engine.state)return;
    try{
      const ids=Engine.state.projects.filter(p=>p.posterCustom).map(p=>p.id);
      const images=await PosterStore.bundle(ids);
      const data=JSON.stringify({format:'finalcut-v13-backup',created:new Date().toISOString(),game:Engine.state,posters:images});
      const url=URL.createObjectURL(new Blob([data],{type:'application/json'}));
      const a=document.createElement('a');a.href=url;a.download='FinalCut-backup-'+Engine.dateOf().year+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
    }catch(e){alert('Backup export failed: '+e.message);}
  }
  async function importBackup(input){
    const f=input.files&&input.files[0];if(!f)return;
    if(f.size>25000000){alert('The backup exceeds 25 MB.');return;}
    try{
      const b=JSON.parse(await f.text());
      if(!['finalcut-v11-backup','finalcut-v12-backup','finalcut-v13-backup'].includes(b.format)||!b.game||!Array.isArray(b.game.projects)||!Number.isInteger(b.game.version)||b.game.version>13)throw new Error('Not a supported Final Cut backup.');
      if(Engine.state&&!confirm('Replace your current game with this backup?'))return;
      const old=localStorage.getItem('backlot_save');
      try {
        localStorage.setItem('backlot_save',JSON.stringify(b.game));
        const loaded=Engine.load();if(!loaded.ok)throw new Error(loaded.reason);
        PosterStore.resetCache();
        await PosterStore.restore(b.posters||{});
        const declared=Engine.state.projects.filter(p=>p.posterCustom).map(p=>p.id);
        const absent=await PosterStore.missing(declared);
        if(absent.length) { const ids=new Set(absent); Engine.state.projects.forEach(p=>{if(ids.has(p.id))p.posterCustom=false;});Engine.save(); }
        resetHistory();closeDrawer();render();
        alert('Backup imported.'+(absent.length?' '+absent.length+' missing poster(s) were reset to generated artwork.':' Custom posters were restored.'));
      } catch(err) { if(old==null)localStorage.removeItem('backlot_save');else localStorage.setItem('backlot_save',old); if(old)Engine.load();throw err; }
    }catch(e){alert('Backup import failed: '+e.message);}
    finally{input.value='';}
  }

// ===== SECTION: INIT =====
  function init() {
    render();
    document.addEventListener('keydown', e => {
      if (currentYearEndReport()) {
        if (e.key === 'Escape') { e.preventDefault(); closeYearEndHonors(); return; }
        if (e.key === 'Tab') {
          const buttons = Array.from($('year-end-awards').querySelectorAll('button:not(:disabled)'));
          if (!buttons.length) return;
          const idx = buttons.indexOf(document.activeElement);
          if (e.shiftKey && idx <= 0) { e.preventDefault(); buttons[buttons.length - 1].focus(); }
          else if (!e.shiftKey && idx === buttons.length - 1) { e.preventDefault(); buttons[0].focus(); }
        }
        return;
      }
      if (tutorialKeydown(e)) return;
      if (e.key === 'Escape') closeDrawer();
    });
    $('scrim').addEventListener('click', closeDrawer);
    document.addEventListener('finalcut-poster-change', () => { if(drawer)renderDrawer(); });
  }
  document.addEventListener('DOMContentLoaded', init);

  return { yearEndSound: yearEndSound, revealYearEndHonors: revealYearEndHonors, closeYearEndHonors: closeYearEndHonors, replayYearEnd: replayYearEnd, openTutorial: openTutorial, closeTutorial: closeTutorial, tutorialMove: tutorialMove, tutorialOpenSection: tutorialOpenSection, tutorialMinimize: tutorialMinimize, go: go, toggleMobileNav: toggleMobileNav, back: back, forward: forward, render: render, setDraft: setDraft, setCast: setCast, randomizeTitle: randomizeTitle, beginSequel: beginSequel, cancelSequel: cancelSequel, startGame: startGame, loadGame: loadGame,
    quit: quit, saveNow: saveNow, openSave: openSave, renameSave: renameSave, copySave: copySave, deleteSave: deleteSave,
    nextWeek: nextWeek, advance: advance, choose: choose, startProject: startProject, loan: loan,
    tblSort: tblSort, tblFilter: tblFilter, tblSearch: tblSearch, tblRow: tblRow, centerFocus: centerFocus, centerShowMore: centerShowMore, openProject: openProject, openFilm: openFilm, setFilmFilter: setFilmFilter, setFilmQuery: setFilmQuery, filmPage: filmPage, toggleRegion: toggleRegion, openTalent: openTalent, closeDrawer: closeDrawer,
    sign: sign, renew: renew, releaseTalent: releaseTalent, upgrade: upgrade, launchInitiative: launchInitiative, reissueClassic: reissueClassic, staff: staff, awardCampaign: awardCampaign, clearLeaderboard: clearLeaderboard,
    toggleMusic: toggleMusic, setVolume: setVolume, toggleSfx: toggleSfx, toggleMotion: toggleMotion, selectPosterStyle: selectPosterStyle, beginPosterUpload: beginPosterUpload, posterCropPreview: posterCropPreview, saveCustomPoster: saveCustomPoster, closePosterEditor: closePosterEditor, removePoster: removePoster, exportBackup: exportBackup, importBackup: importBackup };
})();
