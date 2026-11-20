// Headless bot sims for Final Cut v10.  usage: node sim.js <strategy> <runs> [seedBase]  (env OVR='{"economy.staffPay":1}' optional)
const fs = require('fs'), vm = require('vm');
const SRC = fs.readFileSync(__dirname + '/content.js', 'utf8') + '\n' + fs.readFileSync(__dirname + '/engine.js', 'utf8') + '\nthis.Engine=Engine;this.CONTENT=CONTENT;';
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const STRAT = {
  prestige:   { genres: ['drama', 'documentary', 'romance', 'western', 'thriller'], maxTier: 3, minTier: 2, mkt: 2, reserve: 0.8, feeShare: 0.12, camp: 2, hireStaff: true },
  blockbuster:{ genres: ['action', 'scifi', 'comedy', 'horror'],                   maxTier: 5, minTier: 3, mkt: 3, reserve: 1.6, feeShare: 0.08, camp: 0, hireStaff: true },
  cheap:      { genres: ['horror', 'comedy', 'thriller'],                          maxTier: 1, minTier: 0, mkt: 1, reserve: 0.8, feeShare: 0.04, camp: 0, hireStaff: false },   // 7.5: feeShare was 0 (local hires only)
  // 7.5: careful = a cautious human (mid budgets at most, mixed genres, keeps a cash cushion, small campaigns).
  careful:    { genres: ['drama', 'comedy', 'thriller', 'romance', 'horror', 'action'], maxTier: 2, minTier: 1, mkt: 1, reserve: 1.5, feeShare: 0.06, camp: 1, hireStaff: true }
};

function run(stratId, seed, ovr) {
  const S = STRAT[stratId];
  const M = Object.create(Math); M.random = mulberry32(seed);
  const ctx = { console: { log() {} }, Math: M, Date, JSON };
  vm.createContext(ctx); vm.runInContext(SRC, ctx);
  const E = ctx.Engine, C = ctx.CONTENT, T = E.TUNING;
  Object.keys(ovr || {}).forEach(k => { const p = k.split('.'); let o = T; for (let i = 0; i < p.length - 1; i++) o = o[p[i]]; o[p[p.length - 1]] = ovr[k]; });
  E.newGame({ studioName: 'Sim ' + stratId, founderName: 'Bot', homeRegion: process.env.SIM_REGION || 'northamerica' });
  const st = E.state;

  function val(e, p) {
    e = e || {};
    const cost = ((e.costPct || 0) * (p ? p.budget : 0)) - (e.cash || 0);
    let v = (e.quality || 0) * 2 + (e.hype || 0) * 0.6 + (e.fame || 0) * 3 + (e.critics || 0) * 2 + (e.market || 0) * 20 + (e.morale || 0) * 0.3 + (e.talentMorale || 0) * 0.2 + (e.rosterMorale || 0) * 0.2 + (e.staffMorale || 0) * 0.3
      - (e.weeks || 0) * 1.5 - (e.postWeeks || 0) * 0.5 - (e.pay || 0) * 20 - (e.strike || 0) * 3 - (e.fire ? 5 : 0);
    if (cost > 0) v -= cost > st.cash * 0.4 ? 1e6 : cost / 2000;
    else v -= cost / 2000;
    if (e.counter) v -= 1e5;       // bots never counter poach offers
    return v;
  }
  function decide() {
    const pd = st.pending; if (!pd) return;
    const p = pd.projectId != null ? E.getProject(pd.projectId) : null;
    let best = 0, bv = -Infinity;
    if (pd.id === 'marketing' && p) {
      let lvl = S.mkt; const tun = T.marketing;
      while (lvl > 0 && p.budget * tun[lvl].share > st.cash * 0.5) lvl--;
      best = lvl;
    } else if (pd.id === 'release_date') {
      pd.choices.forEach((c, i) => { const m = /outlook ×([\d.]+)/.exec(c.label); const v = (m ? +m[1] : 0) - ((c.effects && c.effects.weeks) || 0) * 0.01; if (v > bv) { bv = v; best = i; } });
    } else {
      pd.choices.forEach((c, i) => { const v = val(c.effects, p); if (v > bv) { bv = v; best = i; } });
    }
    E.choose(best);
  }

  function manage() {
    const burn = E.weeklyBurn();
    for (let i = 0; i < 6 && st.cash < burn * 8; i++) if (!E.takeLoan().ok) break;
    if (st.debt > 0 && st.cash > st.debt + 120000 + burn * 20) E.repayLoan();
    const q = E.upgradeQuote();
    if (q.ok && st.cash >= q.cost * 1.4) E.upgradeTier();
    const g = E.growthTier();
    if (S.hireStaff && g.deptMax > 0 && st.cash > 150000) {
      E.staffInfo().forEach(d => {
        if (d.morale < 40) E.staffAction(d.id, 'raise');
        const want = Math.min(g.deptMax, (d.id === 'marketing' || d.id === 'production') ? 3 : 1);
        if (d.heads < want && st.cash > d.costs.hire * 30) E.staffAction(d.id, 'hire');
      });
    }
    if (S.camp > 0) {
      E.awardsInfo().eligible.forEach(a => {
        for (let l = S.camp; l > a.campaign.level; l--) { const qq = E.campaignQuote(a.id, l); if (qq.ok && qq.pay < st.cash * 0.12) { E.awardCampaign(a.id, l); break; } }
      });
    }
    // greenlight
    let guard = 0;
    while (E.activeProjects().length < E.capacity() && guard++ < 4) {
      if (!greenlight()) break;
    }
  }
  function pickCast(fmtId, budget) {
    const cast = {};
    E.SLOTS.forEach(slot => {
      const opts = E.slotOptions(slot, fmtId).filter(o => !o.busy && (!o.elite || o.interest >= 0.5));
      let best = null;
      opts.forEach(o => {
        if (o.id !== 'founder' && (o.fee > budget * S.feeShare || S.feeShare === 0)) return;
        const sc = (o.skill || 0) + (o.fame || 0) * 0.3 + (o.roster ? 5 : 0);
        if (!best || sc > best.sc) best = { o: o, sc: sc };
      });
      if (best) cast[slot] = best.o.id;
    });
    return cast;
  }
  function greenlight() {
    const fm = E.formats();
    const feat = fm.find(f => f.id === 'feature'), shrt = fm.find(f => f.id === 'short');
    const genre = S.genres.slice().sort((a, b) => (st.market.genres[b] || 1) - (st.market.genres[a] || 1))[0];
    const candidates = C.TOPICS.filter(t => (t.good || []).includes(genre));
    const topic = (candidates.length ? candidates : C.TOPICS).slice().sort((a, b) =>
      (st.market.topics[b.id] || 1) - (st.market.topics[a.id] || 1))[0].id;
    const burn = E.weeklyBurn();
    const tryFmt = (f, lo, hi) => {
      for (let t = Math.min(hi, f.tiers.length - 1); t >= lo; t--) {
        const ti = f.tiers[t]; if (ti.locked) continue;
        for (const useCast of [true, false]) {
          if (st.cash < ti.budget * S.reserve + burn * 4) continue;
          // An elite artist may refuse: bots should offer another available artist, not drop the entire cast.
          const attempts = useCast ? 5 : 1;
          for (let attempt = 0; attempt < attempts; attempt++) {
            const o = { format: f.id, tier: t, genre: genre, topic: topic, title: E.randomTitle(), cast: useCast ? pickCast(f.id, ti.budget) : {} };
            const r = E.startProject(o);
            if (r.ok) return true;
            if (!useCast || !/declined/i.test(r.reason || '')) break;
          }
        }
      }
      return false;
    };
    if (feat && feat.unlocked) { if (tryFmt(feat, S.minTier, S.maxTier)) return true; if (tryFmt(feat, 0, S.minTier - 1)) return true; }
    if (shrt) return tryFmt(shrt, 0, 2);
    return false;
  }

  let steps = 0;
  const until = +process.env.UNTIL || 0;   // optional: stop at the start of this year (early-game checks)
  while (!st.gameOver && !st.score && steps++ < 4000 && !(until && E.dateOf().year >= until)) {
    while (st.pending) decide();
    manage();
    while (st.pending) decide();
    E.nextTurn();
  }
  const sc = st.score || E.scoreInfo();
  // Opt-in storage verification uses the browser-like 5 MiB per-origin quota.
  let storedChars = null, savedOkay = null, reloadedOkay = null;
  if (process.env.SAVE_VERIFY) {
    const ls = { data: '', setItem(_k, v) { if (v.length > 5 * 1024 * 1024) throw new Error('QuotaExceeded'); this.data = v; }, getItem() { return this.data; }, removeItem() { this.data=''; } };
    ctx.localStorage = ls;
    savedOkay = E.save();
    storedChars = ls.data.length;
    reloadedOkay = savedOkay && E.load().ok && E.state.filmArchive.rivals.length === st.filmArchive.rivals.length;
  }
  const feats = st.projects.filter(p => p.format === 'feature');
  const rep = E.reputationInfo(), legacy = E.legacyInfo();
  const rivalFeatures=(st.filmArchive.rivals||[]).filter(f=>f.format==='feature'&&f.stage==='done');
  const avg=(arr,key)=>arr.length?Math.round(arr.reduce((a,v)=>a+(v[key]||0),0)/arr.length*10)/10:0;
  const ceremonyWinners = {}; const ceremonyUnawarded = {};
  (st.awards.history||[]).forEach(a=>{(a.cats||[]).forEach(c=>{if(c.unawarded)ceremonyUnawarded[a.id]=(ceremonyUnawarded[a.id]||0)+1;(c.nominees||[]).forEach(n=>{if(n.winner&&n.projectId!=null)ceremonyWinners[a.id]=(ceremonyWinners[a.id]||0)+1;});});});
  const festivalTierWins={};st.projects.forEach(p=>(p.festResults||[]).forEach(f=>{if(f.kind==='winner')festivalTierWins[f.tierRank]=(festivalTierWins[f.tierRank]||0)+1;}));
  const weightedPrestigeRaw=(st.reputation.prestigeEvents||[]).reduce((a,e)=>a+e.points*Math.pow(.5,(st.week-e.week)/T.reputation.prestigeHalfLifeWeeks),0);
  return { region: process.env.SIM_REGION || 'northamerica', strat: stratId, seed: seed, reason: sc.reason, year: sc.year, value: sc.value, parts: sc.parts, counts: sc.counts, profit: sc.profit,
    saveBytes: Buffer.byteLength(JSON.stringify(st)), packedSaveChars: storedChars, savedOkay, reloadedOkay, archiveBytes: Buffer.byteLength(JSON.stringify(st.filmArchive)), projectsBytes: Buffer.byteLength(JSON.stringify(st.projects)), rivalsBytes: Buffer.byteLength(JSON.stringify(st.rivals)), awardsBytes: Buffer.byteLength(JSON.stringify(st.awards)), archiveCount: (st.filmArchive && st.filmArchive.rivals || []).length, activeRivals: E.activeRivals().length,
    cash: Math.round(st.cash - st.debt), currentBuzz: rep.buzz, currentPrestige: rep.currentPrestige, lifetimeLegacy: rep.lifetimeLegacy, leaderCount: E.activeRivals().filter(r=>r.industryLeader).length, decadeCount: E.worldYearbook().decadeChampions.length, initiativeCount: legacy.milestones.length, reissueCount: legacy.reissues.length, prestigeRaw:Math.round(weightedPrestigeRaw), prestigeEventCount:st.reputation.prestigeEvents.length, rivalQualityAvg:avg(rivalFeatures,'quality'), playerQualityAvg:avg(feats,'quality'), rivalAwardWins:rivalFeatures.reduce((a,f)=>a+(f.awards||[]).filter(w=>w.won).length,0), ceremonyWinners, ceremonyUnawarded, festivalTierWins, fame: Math.round(st.studio.fame), crit: Math.round(st.studio.criticsRep), prestige: Math.round(st.studio.prestige || 0), tier: st.studio.tier,
    features: feats.length, shorts: st.projects.length - feats.length, flops: feats.filter(p => p.result === 'Flop').length,
    detail: process.env.DETAIL ? feats.map(p => ({ y: E.dateOf(p.releaseWeek == null ? st.week : p.releaseWeek).year, b: p.budget, q: p.quality, h: p.hype, g: p.gross, rev: p.revenue, sp: p.spent, mk: p.marketingSpend, f: p.fees, r: p.result, m: p.market ? p.market.mult : null, o: p.opening, th: p.revenue - (p.windows||[]).reduce((a,w)=>a+w.paid,0) })) : undefined };
}
module.exports = { run, STRAT };
if (require.main === module) {
  const [strat, runs, base] = [process.argv[2], +process.argv[3] || 10, +process.argv[4] || 1];
  const ovr = process.env.OVR ? JSON.parse(process.env.OVR) : {};
  for (let i = 0; i < runs; i++) console.log(JSON.stringify(run(strat, base + i, ovr)));
}
