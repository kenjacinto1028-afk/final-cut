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
    ['Studio', [['dashboard', 'Dashboard'], ['newproject', 'New project'], ['projects', 'Projects'], ['filmography', 'My Filmography'], ['tv', 'TV'], ['founder', 'Founder'], ['log', 'Log']]],
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
  function go(v) {
    closeMobileNav();
    if (v !== view) { hist = hist.slice(0, hpos + 1); hist.push(v); hpos = hist.length - 1; view = v; }
    setFlash('');
    render();
  }
  function back() { if (hpos > 0) { hpos--; view = hist[hpos]; setFlash(''); render(); } }
  function forward() { if (hpos < hist.length - 1) { hpos++; view = hist[hpos]; setFlash(''); render(); } }
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
      GROUPS.map(g => '<div class="nav-group"><div class="nav-label">' + g[0] + '</div>' +
        g[1].map(v => v[2]
          ? '<button class="navbtn" disabled>' + esc(v[1]) + '<span class="soon">Soon</span></button>'
          : '<button class="navbtn' + (view === v[0] ? ' active' : '') + '" onclick="UI.go(\'' + v[0] + '\')">' + esc(v[1]) +
            (v[0] === 'roster' && expiring ? '<span class="badge">' + expiring + '</span>' : '') + '</button>'
        ).join('') + '</div>').join('') +
      '<div class="nav-foot">' + soundControls() + '<button class="navbtn" onclick="UI.exportBackup()">Export save + posters</button>' +
      '<label class="navbtn backup-upload">Import backup<input type="file" accept="application/json,.json" onchange="UI.importBackup(this)"></label>' +
      '<button class="navbtn danger-nav" onclick="UI.quit()">New game</button></div>';
  }
  // 8.1 music toggle and volume, 8.4 sound effects toggle, 8.5 reduce-motion toggle (Media keeps the settings; display only here).
  function soundControls() {
    if (typeof Media === 'undefined') return '';
    const m = Media.musicState(), S = Media.settings;
    let h = '<div class="sound">';
    if (m.supported) {
      h += '<button class="navbtn" onclick="UI.toggleMusic()" aria-pressed="' + m.on + '">Music: ' + (m.on ? 'On' : 'Off') +
        (m.on && m.style ? '<span class="soon">' + esc(m.style) + '</span>' : '') + '</button>' +
        '<label class="vol"><span>Volume</span><input type="range" min="0" max="100" value="' + Math.round(m.volume * 100) + '" oninput="UI.setVolume(this.value)" aria-label="Music volume"></label>' +
        '<button class="navbtn" onclick="UI.toggleSfx()" aria-pressed="' + S.sfx + '">Sound effects: ' + (S.sfx ? 'On' : 'Off') + '</button>';
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
      '<button class="primary" ' + (blocked ? 'disabled' : '') + ' onclick="UI.advance()">Advance to next decision</button>';
  }

// ===== SECTION: VIEW_START =====
  function viewStart() {
    return '<h1>Final Cut</h1><p>1970. You have a camera, some savings and an idea.</p>' +
      '<div class="form">' +
      '<label>Studio name <input id="f_studio" placeholder="Untitled Pictures"></label>' +
      '<label>Founder name <input id="f_founder" placeholder="Random if empty"></label>' +
      '<label>Home region <select id="f_region">' + CONTENT.REGIONS.map(r => '<option value="' + esc(r.id) + '">' + esc(r.name) + '</option>').join('') + '</select></label>' +
      '<button class="primary" onclick="UI.startGame()">Start new game</button>' +
      (Engine.hasSave() ? ' <button onclick="UI.loadGame()">Continue saved game</button>' : '') +
      ' <label class="poster-upload">Import save + posters <input type="file" accept="application/json,.json" onchange="UI.importBackup(this)"></label>' +
      '</div><div class="start-sound">' + soundControls() + '</div>';
  }

// ===== SECTION: VIEW_DASHBOARD =====
  // 8.3: era backdrop banner on top. 8.5: gross of films in theaters counts up (cu).
  function viewDashboard() {
    const s = Engine.state;
    const d = Engine.dateOf();
    const era = Engine.eraOf(d.year);
    let h = '<div class="dashboard-layout"><section class="dashboard-primary">' + eraBanner(era.id) + '<h1>' + dateLabel() + '</h1><p class="era-name">' + esc(era.name) + ' era</p>';
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
    h += '<div class="strip">' + stat('Cash', money(s.cash)) + stat('Weekly burn', money(Engine.weeklyBurn())) +
      stat('Weekly profit', '<span class="' + (profit < 0 ? 'neg' : '') + '">' + money(profit) + '</span>') + stat('Debt', money(s.debt)) + '</div>';
    const act = Engine.activeProjects().length, cap = Engine.capacity();
    h += '<h2>In production <span class="muted">' + act + ' of ' + cap + '</span></h2>';
    const live = s.projects.filter(p => p.stage !== 'done').reverse();
    if (live.length) {
      h += '<div class="list">' + live.map(p => {
        const info = p.stage === 'release'
          ? (p.format === 'feature' ? 'In theaters · week ' + p.weeksInRelease + ' · gross ' + cu('gross-' + p.id, p.gross) : 'Awaiting ' + esc(p.festival))
          : CONTENT.STAGE_LABELS[p.stage] + ' · ' + Math.max(p.stageWeeksLeft, 0) + ' wk left · ' + money(p.spent) + ' of ' + money(p.budget);
        return '<div class="row" onclick="UI.openProject(' + p.id + ')"><strong>' + esc(p.title) + '</strong><span class="muted">' + info + '</span></div>';
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
    h += '</section><aside class="studio-wire"><h2>The Studio Wire</h2><p><a href="#" onclick="UI.go(\'news\');return false">All news</a></p>' + newsList(Engine.news(null, Engine.TUNING.news.headlines)) + '</aside></div>';
    return h;
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
  const draft = { title: '', format: 'short', genre: 'drama', topic: 'smalltown', tier: 0, cast: { director: 'founder', writer: 'founder', lead: '', crew: '' } };
  function setDraft(key, val) {
    if (key === 'tier') val = Number(val);
    draft[key] = val;
    if (key === 'format') { draft.tier = 0; if(val!=='feature') delete draft.sequelOf; }
    if (key !== 'title') render();
  }
  function setCast(slot, val) { draft.cast[slot] = val; render(); }
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
      const label = x.name + fit + ' · skill ' + x.skill + (x.fame != null ? ' · fame ' + x.fame : '') + ' · ' + cost + interest + (x.busy ? ' — busy: ' + x.busy : '');
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
    h += '</div><h2>Cast and crew</h2><p class="muted">★ = genre fit. Fees come out of the budget; roster talent costs no fee. Elite artists may decline offers; studio fame, critics, prestige, creative fit and budget improve interest. A declined offer costs nothing.</p><div class="form cast">' +
      Engine.SLOTS.map(castPicker).join('') + '</div>';
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
  function viewProjects() {
    const s = Engine.state;
    if (!s.projects.length) return '<h1>Projects</h1><p>No projects yet.</p>';
    const fmtName = p => nameOf(Engine.formats(), p.format);
    return '<h1>Projects</h1>' + tblHtml('projects', {
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
    });
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
    if (q) rows = rows.filter(f => [f.title,f.studio,nameOf(CONTENT.GENRES,f.genre),nameOf(CONTENT.TOPICS,f.topic)].join(' ').toLowerCase().includes(q));
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
      search: t => [t.name, roleName(t), traitNames(t), t.affinity.map(g => nameOf(CONTENT.GENRES, g)).join(' ')].join(' '),
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
    h += '<details><summary><strong>Last week</strong></summary><p>Income ' + money(lw.income) + ', costs ' + money(lw.costs) + ' (talent salaries ' + money(lw.salaries || 0) +
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
        { key: 'name', label: 'Studio', value: r => r.name, render: r => esc(r.name) + (r.status === 'bankrupt' ? ' <span class="neg">closed</span>' : '') },
        { key: 'strategy', label: 'Strategy', value: r => r.strategyName, render: stratLabel },
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
    return h;
  }

// ===== SECTION: VIEW_AWARDS =====
  // 6.3. Display only: Engine.awardsInfo(). Campaigns go through Engine.awardCampaign. 8.3: trophy icons in the trophy case.
  function viewAwards() {
    const a = Engine.awardsInfo();
    let h = '<h1>Awards</h1><div class="strip">' + stat('Next ceremony', esc(a.next.name) + ' · ' + dateLabel(a.next.week) + '<div class="muted">covers ' + a.next.covers + ' releases</div>') +
      stat('Studio prestige', a.prestige) + stat('Trophies', a.trophies.length) + '</div>';
    h += '<p class="muted">' + esc(a.name) + ' judges features released the year before: ' + a.categories.map(c => esc(c.name)).join(', ') +
      '. Nominations and wins raise studio fame, prestige (a little extra hype, fading each year) and the fame of the talent involved. Campaigns add to a film\'s score before the ceremony.</p>';
    h += '<h2>Annual awards ceremonies</h2><p class="muted">Major ceremonies arrive over the decades. A film can earn nominations in several ceremonies based on its format and eligibility.</p><ul class="plain">' +
      a.ceremonies.map(c => '<li><strong>' + esc(c.name) + '</strong> <span class="muted">· week ' + c.week + ' · since ' + c.startYear + ' · ' + esc(c.categories.join(', ')) + '</span></li>').join('') + '</ul>';
    h += '<h2>Festival circuit</h2><p class="muted">Local → World, plus up to two new specialist festivals per decade. Submissions are automatic; selections and trophies are judged on each festival’s scheduled week. Runner-ups receive Jury Special Mentions. Excellent small studios remain eligible. Shorts and features can attend multiple events.</p><ul class="plain">' +
      a.circuit.map(f => '<li><strong>' + esc(f.level) + '</strong> — ' + esc(f.name) + ' <span class="muted">· week ' + f.week + ' · ' + esc(f.prize) + (f.focus ? ' · focus: ' + esc(f.focus) : '') + '</span></li>').join('') + '</ul>';
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
    h += '<h2>Past ceremonies</h2>' + (a.history.length ? a.history.map((rec, i) =>
      '<details' + (i === 0 ? ' open' : '') + '><summary><strong>' + rec.year + '</strong> <span class="muted">· ' + rec.covered + ' films</span></summary>' +
      rec.cats.map(c => '<p><strong>' + esc(c.name) + '</strong></p><ul class="plain">' + c.nominees.map(n =>
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
      dl(a[1], esc((f.credits || {})[a[0]] || 'Not recorded'))).join('') + '</dl>';
    if ((f.staff || []).length) h += '<p class="muted">Studio departments at release: ' + f.staff.map(x => esc(x.department) + ' (' + x.heads + ' staff, skill ' + x.skill + ')').join('; ') + '</p>';
    h += '<h3>Performance</h3><dl>' + dl('Quality', f.quality == null ? '—' : f.quality+'/100') + dl('Critics', f.critic == null ? 'Not recorded' : f.critic+'/100') + dl('Audience', f.audience == null ? 'Not recorded' : f.audience+'/100') +
      dl('Worldwide gross', money(f.gross || 0)) + dl('Studio revenue', money(f.revenue || 0)) +
      dl('Profit', f.profit == null ? 'Pending' : money(f.profit)) + '</dl>';
    if ((f.regions || []).length) h += '<h4>Distribution</h4><p>' + f.regions.map(id => esc(nameOf(CONTENT.REGIONS,id)) + (f.regionalGross && f.regionalGross[id] != null ? ' · ' + money(f.regionalGross[id]) : '')).join('<br>') + '</p>';
    h += '<h3>Recognition</h3><dl>' + dl('Annual awards', (f.awards || []).map(a => (a.won ? '🏆 ' : 'Nominated: ') + esc(a.ceremony || 'Golden Reel') + ' · ' + esc(a.category || a.cat) + ' (' + a.year + ')').join('<br>') || 'None') +
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
    if (p.review) h += '<p class="film-review"><strong>' + esc(p.review.headline) + '</strong> — ' + esc(p.review.text) + '</p>';
    h += '<h2>Cast and crew</h2><dl>' + Engine.castSummary(p).map(c =>
      dl(esc(c.label), typeof c.id === 'number' && Engine.getTalent(c.id)
        ? '<a href="#" onclick="UI.openTalent(' + c.id + ');return false">' + esc(c.name) + '</a>' + (c.skill != null ? ' <span class="muted">· ' + c.skill + '</span>' : '')
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
    h += dl('Reliability', Engine.effReliability(t));
    h += dl('Genre fit', esc(t.affinity.map(g => nameOf(CONTENT.GENRES, g)).join(', ')));
    if (t.specialty) { const sp = CONTENT.CREW_SPECIALTIES.find(x => x.id === t.specialty); if (sp) h += dl('Specialty', esc(sp.desc)); }
    h += dl('Fee', money(Engine.talentFee(t, 'short')) + ' short · ' + money(Engine.talentFee(t, 'feature')) + ' feature');
    const interest = Engine.recruitmentInterest(t, 'feature');
    if (interest.elite && !st.roster) h += dl('Exclusive offer interest', Math.round(interest.chance * 100) + '% · Fame, critics and prestige help');
    if (t.awards && (t.awards.noms || t.awards.wins)) h += dl('Awards', t.awards.wins + ' won · ' + (t.awards.noms + t.awards.wins) + ' nominations');
    h += '</dl><h2>Traits</h2><ul class="plain">' + Engine.traitsOf(t).map(tr => '<li><strong>' + esc(tr.name) + '</strong> – ' + esc(tr.desc) + '</li>').join('') + '</ul>';
    const credits = t.credits.map(id => Engine.getProject(id)).filter(Boolean);
    h += '<h2>Credits with you</h2>' + (credits.length
      ? '<ul class="plain">' + credits.map(p => '<li><a href="#" onclick="UI.openProject(' + p.id + ');return false">' + esc(p.title) + '</a>' + (p.result ? ' <span class="muted">· ' + esc(p.result) + '</span>' : '') + '</li>').join('') + '</ul>'
      : '<p class="muted">None yet.</p>');
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

// ===== SECTION: RENDER =====
  function render() {
    renderTop();
    renderNav();
    const s = Engine.state;
    $('app').classList.toggle('start', !s);
    let h;
    if (!s) h = viewStart();
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
    if (flash) h = '<div class="alert">' + esc(flash) + '</div>' + h;
    $('main').innerHTML = h;
    renderModal();
    renderDrawer();
  }

// ===== SECTION: ACTIONS =====
  function startGame() { Engine.newGame({ studioName: $('f_studio').value, founderName: $('f_founder').value, homeRegion: $('f_region').value }); go('dashboard'); }
  function loadGame() { const r = Engine.load(); setFlash(r.ok ? '' : r.reason); resetHistory(); render(); }
  function quit() {
    if (Engine.state && !Engine.state.gameOver && !confirm('Start a new game? Your current save will be replaced when you start.')) return;
    Engine.clearSave();
    location.reload();
  }
  function nextWeek() { Engine.nextTurn(); render(); }
  function advance() { Engine.advance(); render(); }
  function choose(i) { Engine.choose(i); render(); }
  function beginSequel(id) {
    const q=Engine.sequelEligibility(id);
    if(!q.ok){drawerMsg=q.reason;renderDrawer();return;}
    const p=q.parent;
    draft.format='feature';draft.title=(p.franchiseName||p.title)+(p.installment>1?' '+(p.installment+1):' II');
    draft.genre=p.genre;draft.topic=p.topic;draft.tier=p.tier;
    draft.sequelOf=p.id;
    draft.cast={director:'',writer:'',lead:'',crew:''};
    closeDrawer();go('newproject');
  }
  function cancelSequel(){delete draft.sequelOf;render();}
  function startProject() {
    const r = Engine.startProject(draft);
    if (r.ok) { draft.title = ''; delete draft.sequelOf; draft.cast = { director: 'founder', writer: 'founder', lead: '', crew: '' }; go('dashboard'); } else { setFlash(r.reason); render(); }
  }
  function loan(take) { const r = take ? Engine.takeLoan() : Engine.repayLoan(); setFlash(r.ok ? '' : r.reason); render(); }
  function awardCampaign(id, level) { const r = Engine.awardCampaign(id, level); setFlash(r.ok ? '' : r.reason); render(); }
  function upgrade() { const r = Engine.upgradeTier(); setFlash(r.ok ? '' : r.reason); render(); }
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
      const data=JSON.stringify({format:'finalcut-v11-backup',created:new Date().toISOString(),game:Engine.state,posters:images});
      const url=URL.createObjectURL(new Blob([data],{type:'application/json'}));
      const a=document.createElement('a');a.href=url;a.download='FinalCut-backup-'+Engine.dateOf().year+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
    }catch(e){alert('Backup export failed: '+e.message);}
  }
  async function importBackup(input){
    const f=input.files&&input.files[0];if(!f)return;
    if(f.size>25000000){alert('The backup exceeds 25 MB.');return;}
    try{
      const b=JSON.parse(await f.text());
      if(b.format!=='finalcut-v11-backup'||!b.game||!Array.isArray(b.game.projects)||!Number.isInteger(b.game.version))throw new Error('Not a supported Final Cut backup.');
      if(Engine.state&&!confirm('Replace your current game with this backup?'))return;
      localStorage.setItem('backlot_save',JSON.stringify(b.game));
      const loaded=Engine.load();if(!loaded.ok)throw new Error(loaded.reason);
      PosterStore.resetCache();
      await PosterStore.restore(b.posters||{});
      resetHistory();closeDrawer();render();
      alert('Backup imported. Custom posters were restored to this browser.');
    }catch(e){alert('Backup import failed: '+e.message);}
    finally{input.value='';}
  }

// ===== SECTION: INIT =====
  function init() {
    render();
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });
    $('scrim').addEventListener('click', closeDrawer);
    document.addEventListener('finalcut-poster-change', () => { if(drawer)renderDrawer(); });
  }
  document.addEventListener('DOMContentLoaded', init);

  return { go: go, toggleMobileNav: toggleMobileNav, back: back, forward: forward, render: render, setDraft: setDraft, setCast: setCast, randomizeTitle: randomizeTitle, beginSequel: beginSequel, cancelSequel: cancelSequel, startGame: startGame, loadGame: loadGame,
    quit: quit, nextWeek: nextWeek, advance: advance, choose: choose, startProject: startProject, loan: loan,
    tblSort: tblSort, tblFilter: tblFilter, tblSearch: tblSearch, tblRow: tblRow, openProject: openProject, openFilm: openFilm, setFilmFilter: setFilmFilter, setFilmQuery: setFilmQuery, filmPage: filmPage, toggleRegion: toggleRegion, openTalent: openTalent, closeDrawer: closeDrawer,
    sign: sign, renew: renew, releaseTalent: releaseTalent, upgrade: upgrade, staff: staff, awardCampaign: awardCampaign, clearLeaderboard: clearLeaderboard,
    toggleMusic: toggleMusic, setVolume: setVolume, toggleSfx: toggleSfx, toggleMotion: toggleMotion, selectPosterStyle: selectPosterStyle, beginPosterUpload: beginPosterUpload, posterCropPreview: posterCropPreview, saveCustomPoster: saveCustomPoster, closePosterEditor: closePosterEditor, removePoster: removePoster, exportBackup: exportBackup, importBackup: importBackup };
})();
