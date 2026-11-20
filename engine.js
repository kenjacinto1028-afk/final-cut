// ===== SECTION: HEADER =====
// Final Cut — engine.js
// State, turn loop and all game rules. No DOM access here.
// Load order: content.js → engine.js → media.js → ui.js
var SAVE_VERSION = 9;   // v9: topic demand, tiered festivals, reputation recruitment, event cadence; v8 (7.1): state.score; v7 (6.3): awards, studio.prestige (6.2 era effects add no state); v6 (6.1): state.events (cooldown, seen); v5 (phase 5): rivals, talent rival contracts, roster morale; v4 (phase 4): market, series, staff, studio.tier, project windows/market; v3 (4.1): finance

var Engine = (function () {
  'use strict';

// ===== SECTION: TUNING =====
  // Placeholder balance values, not historical data. Tune after playtesting.
  const TUNING = {
    startYear: 1970,
    scoreLockYear: 2030,
    weeksPerYear: 52,
    startCash: 10000,
    livingCost: 80,
    freelancePay: 180,
    freelancePerBusiness: 3,
    loanStep: 5000,
    loanBaseCap: 10000,
    loanCapPerFame: 2000,
    weeklyInterest: 0.0025,
    warningWeeks: 4,
    eventChanceDev: 0.72,
    eventChanceShoot: 0.5,
    eventCooldownWeeks: 3,
    advanceMaxWeeks: 26,
    festivalWaitWeeks: 3,
    studioShare: 0.5,
    boxOfficeBase: 0.5,
    boxOfficeRefBudget: 350000,
    boxOfficeBudgetExp: 0.85,
    boxOfficeQualityExp: 1.3,
    boxOfficeLuck: [0.7, 1.3],
    legs: { base: 0.6, perQuality: 0.0025, max: 0.81 },
    softCap: { quality: 70, hype: 65, room: 30 },
    maxReleaseWeeks: 16,
    formats: {
      short: {
        name: 'Short film', unlockFame: 0, minTier: 0,
        stages: { development: 2, preproduction: 1, shoot: 3, post: 3 },
        tiers: [
          { id: 'micro', name: 'Micro', budget: 1500, quality: 4 },
          { id: 'low', name: 'Low', budget: 4000, quality: 9 },
          { id: 'mid', name: 'Mid', budget: 9000, quality: 14 }
        ]
      },
      feature: {
        name: 'Feature film', unlockFame: 15, minTier: 1,
        stages: { development: 6, preproduction: 4, shoot: 6, post: 8 },
        tiers: [
          { id: 'shoestring', name: 'Shoestring', budget: 40000, quality: 0 },
          { id: 'low', name: 'Low', budget: 120000, quality: 6 },
          { id: 'mid', name: 'Mid', budget: 350000, quality: 12 },
          { id: 'big', name: 'Big', budget: 1000000, quality: 16, minTier: 2 },
          { id: 'blockbuster', name: 'Blockbuster', budget: 3000000, quality: 20, minTier: 3 },
          { id: 'tentpole', name: 'Tentpole', budget: 8000000, quality: 24, minTier: 4 }
        ]
      },
      pilot: {
        name: 'TV pilot', unlockFame: 15, minTier: 1,
        stages: { development: 3, preproduction: 2, shoot: 3, post: 2 },
        tiers: [
          { id: 'cable', name: 'Cable', budget: 30000, quality: 2 },
          { id: 'network', name: 'Network', budget: 80000, quality: 8 },
          { id: 'prestige', name: 'Prestige', budget: 200000, quality: 14, minTier: 2 }
        ]
      }
    },
    marketing: [
      { id: 'none', name: 'None', share: 0, hype: 0 },
      { id: 'small', name: 'Small', share: 0.10, hype: 15 },
      { id: 'medium', name: 'Medium', share: 0.25, hype: 30 },
      { id: 'large', name: 'Large', share: 0.50, hype: 45 }
    ],
    talent: {
      startPool: { actor: 12, director: 8, writer: 8, crew: 9 },
      maxPool: 70,
      newPerQuarter: [3, 5],
      roleBase: { director: 1200, writer: 800, actor: 1800, crew: 500 },
      formatFeeMult: { short: 0.2, feature: 1, pilot: 0.4 },
      baseQuality: 14,
      weights: { director: 0.35, writer: 0.25, lead: 0.15, crew: 0.10 },
      emptySkill: 20,
      affinityBonus: 3,
      maxFeeShare: 0.6,
      freeFeeShare: 0.3,
      minProdQuality: 0.4,
      hypeStudioFame: 0.4,
      hypeLeadFame: 0.25,
      hypeDirectorFame: 0.08,
      slipChance: 0.03,
      traitEventShare: 0.4,
      crewSpecialtyMin: 40,
      fameGain: { Hit: 6, Profit: 3, Flop: -1, Won: 4, 'Official selection': 2, Screened: 1 },
      growthCap: 85,
      eliteSkill: 65, eliteFame: 55, offerRefusalWeeks: 4
    },
    contracts: {
      exclusiveFame: 20,
      salaryYearFactor: 1.5,
      signingWeeks: 4,
      warnWeeks: 8,
      severanceWeeks: 13,
      maxYears: 3
    },
    founder: {
      filmmakerHypePerCharisma: 0.1,
      executiveHypePerCharisma: 0.2,
      discountPerBusiness: 0.004,
      maxDiscount: 0.3
    },
    growth: [
      { fame: 0,  releases: 0,  cost: 0,        capacity: 1, roster: 2,  maxSeries: 0, deptMax: 0,  upkeep: 0,     boxShare: 0 },
      { fame: 15, releases: 3,  cost: 15000,    capacity: 1, roster: 4,  maxSeries: 1, deptMax: 3,  upkeep: 100,   boxShare: 0 },
      { fame: 40, releases: 8,  cost: 250000,   capacity: 2, roster: 7,  maxSeries: 2, deptMax: 8,  upkeep: 800,   boxShare: 0 },
      { fame: 65, releases: 15, cost: 2000000,  capacity: 3, roster: 10, maxSeries: 3, deptMax: 15, upkeep: 4000,  boxShare: 0.05 },
      { fame: 85, releases: 25, cost: 10000000, capacity: 4, roster: 12, maxSeries: 4, deptMax: 25, upkeep: 12000, boxShare: 0.10 }
    ],
    market: {
      genreMin: 0.6, genreMax: 1.5,
      genreDrift: 0.08,
      genreRevert: 0.15,
      topicMin: 0.82, topicMax: 1.18, topicDrift: 0.05, topicRevert: 0.24,
      topicTrendChance: 0.3, topicTrendSize: 0.11, topicEffectMin: 0.85, topicEffectMax: 1.15,
      trendChance: 0.5, trendSize: 0.3,
      seasonMult: { winter: 0.85, spring: 1.0, summer: 1.2, fall: 0.95, holiday: 1.15 },
      cycles: { boom: { mult: 1.15, quarters: [2, 5] }, normal: { mult: 1.0, quarters: [3, 8] }, recession: { mult: 0.8, quarters: [2, 5] } },
      slateWeeks: 12,
      competitors: [0, 2],
      seasonCompetitors: { summer: 2, holiday: 1 },
      competitionPenalty: 0.12,
      ownOverlapWeeks: 3,
      releaseDelays: [0, 2, 4],
      audienceCap: 1500000,
      audienceGrowth: 0.05
    },
    tv: {
      pickupMin: 20, pickupRange: 60, pickupFloor: 0.05, pickupCeil: 0.75,
      pilotFeeShare: 0.5,
      passFeeShare: 0.2,
      episodeCostShare: 0.25,
      feeBase: 0.8, feeScore: 150,
      episodes: [10, 13], maxSeasons: 7, hiatusWeeks: 13,
      ratingQuality: 0.08, ratingHype: 0.03, seasonFatigue: 0.9,
      bonusThreshold: 8, bonusPerPoint: 0.05,
      renewAvg: 7, renewLuck: 0.1,
      renewFeeRaise: 0.15, renewCostRaise: 0.10, qualityDecay: 3
    },
    windows: {
      tvrights: { delay: 52, share: 0.04, weeks: 1 },
      video: { delay: 26, share: 0.15, weeks: 26 },
      streaming: { delay: 13, share: 0.12, weeks: 52 }
    },
    staff: {
      startSkill: 35, newHireSkill: 30, trainGain: 6, maxSkill: 90, highRepHireSkillMax: 64,
      hireWeeks: 2, severanceWeeks: 4, trainWeeks: 3,
      payStep: 0.1, payMin: 0.7, payMax: 1.6,
      moraleRate: 0.08, raiseMorale: 8, layoffMorale: 12,
      strikeMorale: 30, strikeChance: 0.04,
      effect: { development: 1.0, production: 0.15, marketing: 1.2, distribution: 0.03 }
    },
    economy: {
      quarterWeeks: 13,
      sizes: [
        { revenue: 0,        overhead: 0,    revenueShare: 0,    staff: 0, prodStaff: 0 },
        { revenue: 50000,    overhead: 50,   revenueShare: 0,    staff: 0, prodStaff: 0 },
        { revenue: 250000,   overhead: 200,  revenueShare: 0.05, staff: 1, prodStaff: 0 },
        { revenue: 1000000,  overhead: 500,  revenueShare: 0.15, staff: 2, prodStaff: 1 },
        { revenue: 3000000,  overhead: 1200, revenueShare: 0.30, staff: 4, prodStaff: 1 },
        { revenue: 8000000,  overhead: 3000, revenueShare: 0.45, staff: 8, prodStaff: 2 }
      ],
      trailingQuarters: 4,
      staffPerRoster: 0.5,
      staffPay: 200,
      taxRate: 0.3,
      taxBrackets: [[0, 0.3], [500000, 0.45], [2000000, 0.6]],
      historyQuarters: 12,
      stopOnQuarter: false
    }
  };

// ===== SECTION: TUNING_RIVALS =====
  TUNING.rivals = {
    count: 4, maxCount: 6,
    startTier: [1, 2],
    upstartDelay: [6, 20],
    upstartYearChance: 0.2,
    tierBudget: [0, 150000, 450000, 1200000, 3000000],
    overheadShare: 0.2,
    tierFilms: [0, 3, 4, 6, 8],
    tierFame: [0, 20, 35, 55, 75],
    startCashBudgets: 3,
    growCashBudgets: 4,
    growCost: 1,
    shrinkSell: 1,
    bankruptQuarters: 2,
    tierCooldownWeeks: 52,
    keepClosed: 6, keepFilms: 6, maxPlanned: 4,
    leadWeeks: [20, 32],
    rescheduleRange: 3, moveGain: 1.1,
    seasonPref: 1.15, avgBackground: 0.7,
    backgroundCompetitors: [0, 0],
    maxBudgetCap: 1.5,
    bigBudget: 1000000,
    sameGenreWeight: 0.5, bigFilmWeight: 0.5,
    holdPenalty: 0.03,
    boxMult: 1.25, share: 0.65,
    fameHype: 0.3, talentQuality: 2, talentQualityMax: 8,
    tierQuality: 4, tierHype: 5,
    focusChance: 0.7,
    lossSwitchQuarters: 3,
    trendRevertQuarters: 6,
    yieldRatio: 0.8,
    newsGross: 2000000,
    strategies: {
      blockbuster: { budgetMult: 2.0, filmsMult: 0.6, quality: [40, 70], hype: [45, 75], seasons: ['summer', 'holiday'] },
      prestige: { budgetMult: 0.7, filmsMult: 0.8, quality: [55, 85], hype: [20, 45], seasons: ['fall', 'holiday'] },
      cheap: { budgetMult: 0.3, filmsMult: 1.6, quality: [35, 60], hype: [30, 50], seasons: [] },
      trend: { budgetMult: 1.0, filmsMult: 1.0, quality: [40, 70], hype: [35, 60], seasons: ['summer'] }
    },
    poach: {
      expiringChance: 0.10, moraleChance: 0.04, moraleBelow: 35,
      offerMin: 1.2, offerMax: 1.5, years: [1, 3],
      counterBase: 0.6, counterMoraleWeight: 0.006, loyalBonus: 0.2, ambitiousPenalty: 0.15,
      bigCounterMult: 1.2, bigCounterChance: 0.95, counterYears: 2, cooldownWeeks: 26
    },
    morale: { start: 70, rate: 0.05, idleWeeks: 13, idleMax: 30, underpayWeight: 80, loyalBonus: 10, hitBonus: 10, signBoost: 15, counterBoost: 25 }
  };

// ===== SECTION: TUNING_EVENTS =====
  TUNING.events = {
    startWeek: 30,
    studioChance: 0.06,
    gapWeeks: [6, 14],
    repeatWeeks: 156,
    disasterCooldown: 20,
    disasterWeight: 0.6,
    minBurn: 400
  };

// ===== SECTION: TUNING_ERAS =====
  TUNING.eras = {
    newhollywood: { taste: { drama: 1.15, thriller: 1.1, western: 1.05, documentary: 1.05, action: 0.9, scifi: 0.9 },
      genreQuality: {}, postWeeks: 0, festival: 1.0, tvFee: 1.0, pickup: 0, windows: { tvrights: 1.2 }, boxOffice: 1 },
    blockbuster: { taste: { action: 1.2, scifi: 1.2, comedy: 1.1, horror: 1.1, drama: 0.9, documentary: 0.85, western: 0.75 },
      genreQuality: { scifi: 3, action: 2 }, postWeeks: 0, festival: 1.0, tvFee: 1.05, pickup: 0.03, windows: { tvrights: 1.1 }, boxOffice: 1 },
    indie: { taste: { documentary: 1.2, drama: 1.1, thriller: 1.1, romance: 1.1, comedy: 1.05, western: 0.8 },
      genreQuality: { scifi: 3, action: 2 }, postWeeks: 0, festival: 1.5, tvFee: 1.1, pickup: 0.05, windows: { video: 1.2 }, boxOffice: 0.9 },
    digital: { taste: { action: 1.15, scifi: 1.15, horror: 1.1, documentary: 1.1, drama: 0.95, western: 0.8 },
      genreQuality: { scifi: 5, action: 3, horror: 1 }, postWeeks: -1, festival: 1.3, tvFee: 1.15, pickup: 0.08, windows: { video: 1.3, tvrights: 0.9 }, boxOffice: 0.8 },
    streaming: { taste: { scifi: 1.2, action: 1.15, horror: 1.15, comedy: 0.95, drama: 0.85, romance: 0.85, western: 0.8 },
      genreQuality: { scifi: 5, action: 3, horror: 2 }, postWeeks: -1, festival: 1.2, tvFee: 1.25, pickup: 0.1, windows: { video: 0.5, tvrights: 0.7 }, boxOffice: 0.75 },
    future: { taste: { scifi: 1.15, documentary: 1.1, horror: 1.1, drama: 0.95, western: 0.8 },
      genreQuality: { scifi: 6, action: 3, horror: 2 }, postWeeks: -1, festival: 1.2, tvFee: 1.3, pickup: 0.1, windows: { tvrights: 0.6, streaming: 1.3 }, boxOffice: 0.72 }
  };

// ===== SECTION: TUNING_AWARDS =====
  TUNING.awards = {
    ceremonyWeek: 10,
    nominees: 4, maxPerStudio: 2, minScore: 48,
    noise: 8, winNoise: 5, slotWeight: 0.25,
    rivalBoost: 20, prestigeRivalBoost: 6,
    campaigns: [ { points: 0, share: 0 }, { points: 3, share: 0.03 }, { points: 7, share: 0.08 } ],
    festWindow: 52, festMinCritic: 0, festivalMaxEntries: 3, festivalMaxShortEntries: 1,
    festSelect: 76, festPrize: 90,
    selectBuzz: 2, prizeBuzz: 5, buzzMax: 10, selectFame: 1, prizeFame: 3, prizeTalentFame: 2,
    nomFame: 1, winFame: 3, pictureFame: 6, filmFameMax: 10, winCritics: 2,
    talentNomFame: 1, talentWinFame: 4, talentWinSkill: 1,
    prestigeNom: 1, prestigeWin: 4, prestigePicture: 8, prestigeDecay: 0.85, prestigeMax: 100, prestigeHype: 0.05,
    keepHistory: 12
  };

// ===== SECTION: TUNING_NEWS =====
  TUNING.news = { starFame: [50, 75, 90], headlines: 5, feedMax: 300 };

// ===== SECTION: TUNING_SCORE =====
  TUNING.score = {
    profitRef: 5000, profitWeight: 60,
    fame: 2, critics: 0.5, prestige: 0.5,
    win: 6, nom: 2, pictureWin: 6, festPrize: 3, festSelect: 1, awardsScale: 2,
    hit: 8, hitSeasons: 3,
    curve: 0.5,
    leaderboardSize: 20
  };

// ===== SECTION: UTIL =====
  const ACTIVE_STAGES = ['development', 'preproduction', 'shoot', 'post'];
  const SLOTS = ['director', 'writer', 'lead', 'crew'];
  const SLOT_ROLE = { director: 'director', writer: 'writer', lead: 'actor', crew: 'crew' };
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function rint(a, b) { return Math.floor(rnd(a, b + 1)); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function byId(list, id) { return list.find(x => x.id === id); }
  function fill(text, p, t) { return String(text).replace(/\{title\}/g, p ? p.title : '').replace(/\{name\}/g, t ? t.name : ''); }
  function fmtMoney(n) { const s = '$' + Math.abs(Math.round(n)).toLocaleString('en-US'); return n < 0 ? '-' + s : s; }
  function round50(n) { return Math.max(50, Math.round(n / 50) * 50); }

// ===== SECTION: STATE =====
  let state = null;

  function newGame(opts) {
    opts = opts || {};
    state = {
      version: SAVE_VERSION,
      week: 0,
      cash: TUNING.startCash,
      debt: 0,
      founder: {
        name: (opts.founderName || '').trim() || (pick(CONTENT.FIRST_NAMES) + ' ' + pick(CONTENT.LAST_NAMES)),
        role: 'filmmaker',
        stats: { directing: rint(18, 30), writing: rint(18, 30), business: rint(10, 25), charisma: rint(10, 25) }
      },
      studio: { name: (opts.studioName || '').trim() || 'Untitled Pictures', fame: 0, criticsRep: 0, releases: 0, tier: 0, prestige: 0 },
      projects: [],
      series: [],
      nextSeriesId: 1,
      talent: [],
      pending: null,
      queue: [],
      warning: { stage: 0, deadline: 0 },
      log: [],
      nextId: 1,
      nextTalentId: 1,
      gameOver: null,
      score: null,
      stopFlag: false,
      lastWeek: { income: 0, revenue: 0, costs: 0, interest: 0, salaries: 0, overhead: 0, payroll: 0 },
      finance: { q: emptyQuarter(), qStartCash: TUNING.startCash, lossCarry: 0, history: [] },
      events: { cooldownUntil: 0, nextWeek: TUNING.events.startWeek, seen: {}, recentProduction: [] },
      awards: { history: [], pool: [] },
      market: null,
      recruitment: { declined: {} },
      staff: null,
      rivals: null
    };
    state.market = initMarket();
    state.staff = initStaff();
    seedTalent();
    initRivals();
    addLog(state.founder.name + ' founds ' + state.studio.name + ' with ' + fmtMoney(state.cash) + '. Rivals: ' + activeRivals().map(r => r.name).join(', ') + '.', 'studio');
    save();
    emit('newgame');
    return state;
  }

// ===== SECTION: EVENT_BUS =====
  const listeners = [];
  function on(fn) { listeners.push(fn); }
  function emit(type, data) {
    listeners.forEach(fn => { try { fn(type, data, state); } catch (e) { console.error(e); } });
  }
  function gainStudioFame(points) {
    // Fame gains slow as a studio becomes widely known; established studios still progress.
    const before = state.studio.fame;
    const actual = points > 0 ? points * (1 - before / 112) : points;
    state.studio.fame = clamp(before + actual, 0, 100);
    return Math.round((state.studio.fame - before) * 10) / 10;
  }
  function addLog(text, type, cat) {
    const e = { week: state.week, text: text, type: type || 'info' };
    if (cat) e.cat = cat;
    state.log.push(e);
    if (state.log.length > 300) state.log.shift();
  }

// ===== SECTION: CALENDAR =====
  function dateOf(week) {
    if (week == null) week = state.week;
    return { year: TUNING.startYear + Math.floor(week / TUNING.weeksPerYear), week: (week % TUNING.weeksPerYear) + 1 };
  }
  function eraOf(year) {
    let era = CONTENT.ERAS[0];
    CONTENT.ERAS.forEach(e => { if (year >= e.start) era = e; });
    return era;
  }
  function checkCalendar() {
    const d = dateOf();
    if (d.week !== 1) return;
    const era = CONTENT.ERAS.find(e => e.start === d.year);
    if (era && d.year !== TUNING.startYear) {
      const text = 'A new era begins: ' + era.name + '. ' + era.blurb;
      addLog(text, 'era');
      raiseStudio('era_' + era.id, text, [{ label: 'Continue', effects: {}, result: null }],
        { scope: 'era', category: 'era', eraId: era.id, lines: eraLines(era.id) });
      emit('era', era);
    }
    if (d.year === TUNING.scoreLockYear + 1) {
      lockScore('lock');
      state.stopFlag = true;
    }
  }

// ===== SECTION: ERAS =====
  const ERA_DEFAULT = { taste: {}, genreQuality: {}, postWeeks: 0, festival: 1, tvFee: 1, pickup: 0, windows: {}, boxOffice: 1 };
  function eraById(id) { return CONTENT.ERAS.find(e => e.id === id) || eraOf(dateOf().year); }
  function eraModsOf(id) { return Object.assign({}, ERA_DEFAULT, TUNING.eras[id] || {}); }
  function eraMods() { return eraModsOf(eraOf(dateOf().year).id); }
  function eraTaste(genre) { return eraMods().taste[genre] || 1; }
  function genreDemand(id) { return genrePop(id) * eraTaste(id); }
  function eraQuality(genre) { return eraMods().genreQuality[genre] || 0; }
  function eraEnd(era) {
    const nx = CONTENT.ERAS.filter(e => e.start > era.start).sort((a, b) => a.start - b.start)[0];
    return nx ? nx.start - 1 : null;
  }
  function eraInfo(id) {
    const era = id ? eraById(id) : eraOf(dateOf().year);
    const m = eraModsOf(era.id), end = eraEnd(era);
    return { id: era.id, name: era.name, blurb: era.blurb, start: era.start, end: end,
      taste: CONTENT.GENRES.map(g => ({ id: g.id, name: g.name, mult: m.taste[g.id] || 1 })),
      tech: Object.keys(m.genreQuality).map(g => ({ id: g, name: genreName(g), quality: m.genreQuality[g] })),
      postWeeks: m.postWeeks, festival: m.festival, tvFee: m.tvFee, pickup: m.pickup, boxOffice: m.boxOffice,
      windows: CONTENT.REVENUE_WINDOWS.filter(w => TUNING.windows[w.id] && (end == null || w.start <= end) && (!w.end || w.end > era.start))
        .map(w => ({ id: w.id, name: w.name, start: w.start, end: w.end, mult: m.windows[w.id] || 1 })) };
  }
  function pctTxt(m) { const d = Math.round((m - 1) * 100); return (d > 0 ? '+' : '') + d + '%'; }
  function eraLines(id) {
    const x = eraInfo(id);
    const list = a => a.map(t => t.name + ' ' + pctTxt(t.mult)).join(', ');
    const up = x.taste.filter(t => t.mult > 1).sort((a, b) => b.mult - a.mult);
    const down = x.taste.filter(t => t.mult < 1).sort((a, b) => a.mult - b.mult);
    const fmts = [];
    if (x.boxOffice !== 1) fmts.push('theater attendance ' + pctTxt(x.boxOffice));
    if (x.festival !== 1) fmts.push('short-film festival earnings ' + pctTxt(x.festival));
    if (x.tvFee !== 1) fmts.push('new TV series fees ' + pctTxt(x.tvFee));
    if (x.pickup) fmts.push('pilot pickup chance +' + Math.round(x.pickup * 100) + ' points');
    const tech = x.tech.map(t => t.name + ' +' + t.quality).join(', ');
    const pw = Math.abs(x.postWeeks);
    const win = x.windows.map(w => w.name + (w.mult !== 1 ? ' ' + pctTxt(w.mult) : '') +
      (w.start > x.start ? ' (from ' + w.start + ')' : '') + (w.end && (x.end == null || w.end <= x.end) ? ' (until ' + (w.end - 1) + ')' : ''));
    return [
      'Audience taste: ' + (up.length ? 'more demand for ' + list(up) : 'no genre in favor') + (down.length ? '; less for ' + list(down) : '') + '.',
      'Tech: ' + (tech ? 'quality bonus for ' + tech : 'no quality edge') + (pw ? '; post-production ' + pw + ' week' + (pw > 1 ? 's' : '') + (x.postWeeks < 0 ? ' shorter' : ' longer') : '') + '.',
      'Formats: ' + (fmts.length ? fmts.join('; ') : 'no change') + '.',
      'Revenue windows after theaters: ' + (win.length ? win.join(', ') : 'none') + '.'
    ];
  }

// ===== SECTION: FOUNDER =====
  function growStat(key, min, max) {
    const s = state.founder.stats;
    const gain = rint(min, max) * (1 - s[key] / 120);
    s[key] = clamp(Math.round((s[key] + gain) * 10) / 10, 0, 100);
  }
  function freelanceIncome() {
    return TUNING.freelancePay + Math.round(state.founder.stats.business * TUNING.freelancePerBusiness);
  }
  function founderRole() { return state.founder.role; }
  function isExecutive() { return state.founder.role === 'executive'; }
  function founderProject() {
    return activeProjects().find(p => p.cast.director === 'founder' || p.cast.writer === 'founder') || null;
  }
  function founderFreelancing() {
    if (isExecutive()) return activeProjects().length === 0;
    return !founderProject();
  }
  function dealDiscount() {
    if (!isExecutive()) return 0;
    const f = TUNING.founder;
    return Math.min(f.maxDiscount, state.founder.stats.business * f.discountPerBusiness);
  }
  function founderHype() {
    const f = TUNING.founder;
    return state.founder.stats.charisma * (isExecutive() ? f.executiveHypePerCharisma : f.filmmakerHypePerCharisma);
  }
  function becomeExecutive() {
    if (isExecutive()) return;
    state.founder.role = 'executive';
    addLog(state.founder.name + ' steps back from directing to run ' + state.studio.name + '. Business now cuts deal costs; Charisma lifts studio-wide hype.', 'studio');
    state.stopFlag = true;
    emit('founder_role', state.founder);
  }

// ===== SECTION: TALENT =====
  function talentList() { return state.talent; }
  function getTalent(id) { return byId(state.talent, Number(id)); }
  function uniqueName() {
    const used = new Set(state.talent.map(t => t.name).concat([state.founder.name]));
    for (let i = 0; i < 40; i++) {
      const n = pick(CONTENT.FIRST_NAMES) + ' ' + pick(CONTENT.LAST_NAMES);
      if (!used.has(n)) return n;
    }
    return pick(CONTENT.FIRST_NAMES) + ' ' + String.fromCharCode(65 + rint(0, 25)) + '. ' + pick(CONTENT.LAST_NAMES);
  }
  function makeTalent(role) {
    const skill = Math.round(10 + 60 * Math.pow(Math.random(), 1.6));
    const genres = CONTENT.GENRES.map(g => g.id);
    const affinity = [pick(genres)];
    if (Math.random() < 0.5) { const g2 = pick(genres); if (g2 !== affinity[0]) affinity.push(g2); }
    const traits = [pick(CONTENT.TRAITS).id];
    if (Math.random() < 0.3) {
      const t2 = pick(CONTENT.TRAITS).id;
      const clash = (a, b) => (a === 'reliable' && b === 'partyanimal') || (a === 'partyanimal' && b === 'reliable') ||
        (a === 'diva' && b === 'recluse') || (a === 'recluse' && b === 'diva');
      if (t2 !== traits[0] && !clash(traits[0], t2)) traits.push(t2);
    }
    const t = {
      id: state.nextTalentId++, name: uniqueName(), role: role,
      specialty: role === 'crew' ? pick(CONTENT.CREW_SPECIALTIES).id : null,
      skill: skill, fame: clamp(Math.round(skill * rnd(0, 0.7) - 8), 0, 100), reliability: rint(35, 90),
      affinity: affinity, traits: traits, credits: [], contract: null, joinedWeek: state.week
    };
    state.talent.push(t);
    return t;
  }
  function seedTalent() {
    const sp = TUNING.talent.startPool;
    Object.keys(sp).forEach(role => { for (let i = 0; i < sp[role]; i++) makeTalent(role); });
  }
  function randomRole() {
    const sp = TUNING.talent.startPool;
    const total = Object.keys(sp).reduce((a, k) => a + sp[k], 0);
    let r = Math.random() * total;
    for (const k of Object.keys(sp)) { r -= sp[k]; if (r < 0) return k; }
    return 'actor';
  }
  function traitMods(t) {
    const m = { quality: 0, hype: 0, reliability: 0, feeMult: 1, teamSkill: 0, growth: 1, delayChance: 0 };
    (t.traits || []).forEach(id => {
      const tr = byId(CONTENT.TRAITS, id);
      if (!tr) return;
      Object.keys(tr.mods || {}).forEach(k => {
        if (k === 'feeMult' || k === 'growth') m[k] *= tr.mods[k]; else m[k] += tr.mods[k];
      });
    });
    return m;
  }
  function traitsOf(t) { return (t.traits || []).map(id => byId(CONTENT.TRAITS, id)).filter(Boolean); }
  function effReliability(t) { return clamp(t.reliability + traitMods(t).reliability, 0, 100); }
  function talentFee(t, format) {
    const T = TUNING.talent;
    const base = T.roleBase[t.role] * Math.pow(0.4 + t.skill / 80 + t.fame / 30, 2);
    // Acclaimed studios get a modest negotiation edge; fee remains driven by the artist.
    const repDiscount = state ? Math.min(0.06, (state.studio.fame + state.studio.criticsRep + (state.studio.prestige || 0)) * 0.00018) : 0;
    return round50(base * (T.formatFeeMult[format] || 1) * traitMods(t).feeMult * (1 - dealDiscount()) * (1 - repDiscount));
  }
  function eliteTalent(t) { return t.skill >= TUNING.talent.eliteSkill || t.fame >= TUNING.talent.eliteFame; }
  function recruitmentInterest(t, format, genre, topic, budget) {
    if (!t || !state) return { chance: 0, elite: false, reason: 'Unavailable' };
    if (isRoster(t)) return { chance: 1, elite: false, reason: 'On your roster' };
    const elite = eliteTalent(t);
    const studio = state.studio;
    const fit = genre && t.affinity.includes(genre);
    const topicDef = byId(CONTENT.TOPICS, topic);
    const storyFit = topicDef && genre ? (topicDef.good.includes(genre) ? 0.07 : topicDef.bad.includes(genre) ? -0.06 : 0) : 0;
    const script = state.founder.stats.writing >= 65 ? 0.05 : 0;
    const payFit = budget && budget >= talentFee(t, format) * 8 ? 0.04 : 0;
    const rep = studio.fame * 0.001 + studio.criticsRep * 0.0011 + (studio.prestige || 0) * 0.0015;
    const chance = elite ? clamp(0.78 + rep + (fit ? 0.12 : 0) + storyFit + script + payFit -
      Math.max(0, t.skill - 55) * 0.009 - Math.max(0, t.fame - 45) * 0.0035, 0.25, 0.97) : 1;
    return { chance: Math.round(chance * 100) / 100, elite: elite, reason: fit ? 'Genre affinity' : 'Studio track record and creative fit' };
  }
  function recruitmentCooldown(t) {
    return state.recruitment && state.recruitment.declined && state.recruitment.declined[t.id] > state.week ? state.recruitment.declined[t.id] - state.week : 0;
  }
  function salaryOf(t) {
    return Math.round(talentFee(t, 'feature') * TUNING.contracts.salaryYearFactor / TUNING.weeksPerYear);
  }
  function talentProject(t) { return activeProjects().find(p => SLOTS.some(s => p.cast[s] === t.id)) || null; }
  function isRoster(t) { return !!(t.contract && t.contract.type === 'exclusive'); }
  function isRivalTalent(t) { return !!(t.contract && t.contract.type === 'rival'); }
  function talentStatus(t) {
    const p = talentProject(t);
    if (isRoster(t)) return { label: p ? 'Roster · on "' + p.title + '"' : 'Roster', projectId: p ? p.id : null, roster: true };
    if (isRivalTalent(t)) return { label: 'At ' + rivalName(t.contract.rivalId) + (p ? ' · finishing "' + p.title + '"' : ''), projectId: p ? p.id : null, roster: false, rivalId: t.contract.rivalId };
    return p ? { label: 'On "' + p.title + '"', projectId: p.id, roster: false } : { label: 'Available', projectId: null, roster: false };
  }
  function growTalentSkill(t) {
    const g = traitMods(t).growth;
    t.skill = clamp(Math.round(t.skill + rint(1, 3) * g * Math.max(0, 1 - t.skill / TUNING.talent.growthCap)), 0, 100);
  }
  function addTalentFame(p) {
    const gain = TUNING.talent.fameGain[p.result] || 0;
    castTalent(p).forEach(t => {
      const before = t.fame;
      t.fame = clamp(Math.round(t.fame + gain * (gain > 0 ? traitMods(t).growth : 1)), 0, 100);
      starMilestone(t, before, p);
      if (isRoster(t) && (p.result === 'Hit' || p.result === 'Won')) t.contract.morale = clamp((t.contract.morale == null ? TUNING.rivals.morale.start : t.contract.morale) + TUNING.rivals.morale.hitBonus, 0, 100);
    });
  }
  function starMilestone(t, before, p) {
    const m = TUNING.news.starFame.filter(n => before < n && t.fame >= n).pop();
    if (m) addLog(t.name + ' is now a household name (fame ' + t.fame + ') after "' + p.title + '".', 'star');
  }
  function talentTick() {
    if (state.week % 13 === 0) {
      const n = rint(TUNING.talent.newPerQuarter[0], TUNING.talent.newPerQuarter[1]);
      for (let i = 0; i < n; i++) makeTalent(randomRole());
      const free = state.talent.filter(t => !t.contract && !t.credits.length && !talentProject(t));
      let extra = state.talent.length - TUNING.talent.maxPool;
      while (extra > 0 && free.length) {
        const t = free.splice(Math.floor(Math.random() * free.length), 1)[0];
        state.talent.splice(state.talent.indexOf(t), 1);
        extra--;
      }
    }
    if (dateOf().week === 1 && state.week > 0) {
      state.talent.forEach(t => {
        if (isRoster(t)) return;
        t.skill = clamp(t.skill + rint(-1, 2), 0, 100);
        t.fame = clamp(t.fame - 1, 0, 100);
      });
    }
  }

// ===== SECTION: CONTRACTS =====
  function roster() { return state.talent.filter(isRoster); }
  function rosterCap() { return growthTier().roster; }
  function weeklySalaries() { return roster().reduce((a, t) => a + t.contract.salary, 0); }
  function weeksLeft(t) { return isRoster(t) ? t.contract.endWeek - state.week : null; }
  function isExpiring(t) { return isRoster(t) && weeksLeft(t) <= TUNING.contracts.warnWeeks; }
  function expiringContracts() { return roster().filter(isExpiring); }
  function contractQuote(id, years, renew) {
    const t = getTalent(id);
    const c = TUNING.contracts;
    if (!state || state.gameOver) return { ok: false, reason: 'No game running.' };
    if (!t) return { ok: false, reason: 'Unknown talent.' };
    years = clamp(Math.round(Number(years) || 1), 1, c.maxYears);
    const salary = salaryOf(t);
    const bonus = salary * c.signingWeeks;
    let reason = null;
    if (renew) { if (!isRoster(t)) reason = t.name + ' is not on your roster.'; }
    else if (isRoster(t)) reason = t.name + ' is already on your roster.';
    else if (isRivalTalent(t)) reason = t.name + ' is under contract at ' + rivalName(t.contract.rivalId) + ' until ' + dateOf(t.contract.endWeek).year + '.';
    else if (state.studio.fame < c.exclusiveFame) reason = 'Exclusive contracts need studio fame ' + c.exclusiveFame + '.';
    else if (roster().length >= rosterCap()) reason = 'Roster is full (' + rosterCap() + '). Grow the studio to raise the cap.';
    if (!reason && !renew && recruitmentCooldown(t)) reason = t.name + ' declined recently. Try again in ' + recruitmentCooldown(t) + ' weeks.';
    if (!reason && state.cash < bonus) reason = 'Not enough cash for the ' + fmtMoney(bonus) + ' bonus.';
    const interest = recruitmentInterest(t, 'feature', null, null, bonus * 12);
    return { ok: !reason, reason: reason, years: years, salary: salary, bonus: bonus, yearly: salary * TUNING.weeksPerYear,
      interest: interest.chance, elite: interest.elite };
  }
  function signExclusive(id, years) {
    const q = contractQuote(id, years, false);
    if (!q.ok) return q;
    const t = getTalent(id);
    if (q.elite && Math.random() >= q.interest) {
      state.recruitment = state.recruitment || { declined: {} };
      state.recruitment.declined[t.id] = state.week + TUNING.talent.offerRefusalWeeks;
      save();
      return { ok: false, reason: t.name + ' declined an exclusive deal. Stronger reputation or different terms may help later.' };
    }
    state.cash -= q.bonus;
    t.contract = { type: 'exclusive', startWeek: state.week, endWeek: state.week + q.years * TUNING.weeksPerYear, salary: q.salary, warned: false,
      morale: TUNING.rivals.morale.start, idle: 0, offerWeek: null };
    addLog('Signed ' + t.name + ' to a ' + q.years + '-year exclusive contract (' + fmtMoney(q.salary) + '/week, bonus ' + fmtMoney(q.bonus) + ').', 'contract');
    becomeExecutive();
    save();
    emit('contract', t);
    return { ok: true };
  }
  function renewContract(id, years) {
    const q = contractQuote(id, years, true);
    if (!q.ok) return q;
    const t = getTalent(id);
    state.cash -= q.bonus;
    t.contract.endWeek = Math.max(t.contract.endWeek, state.week) + q.years * TUNING.weeksPerYear;
    t.contract.salary = q.salary;
    t.contract.warned = false;
    t.contract.morale = clamp((t.contract.morale == null ? TUNING.rivals.morale.start : t.contract.morale) + TUNING.rivals.morale.signBoost, 0, 100);
    addLog('Renewed ' + t.name + ' for ' + q.years + ' more year' + (q.years > 1 ? 's' : '') + ' (' + fmtMoney(q.salary) + '/week).', 'contract');
    save();
    emit('contract', t);
    return { ok: true };
  }
  function severanceOf(t) { return isRoster(t) ? t.contract.salary * clamp(weeksLeft(t), 0, TUNING.contracts.severanceWeeks) : 0; }
  function releaseContract(id) {
    const t = getTalent(id);
    if (!state || state.gameOver) return { ok: false, reason: 'No game running.' };
    if (!t || !isRoster(t)) return { ok: false, reason: 'Not on your roster.' };
    const sev = severanceOf(t);
    state.cash -= sev;
    endExclusive(t);
    addLog('Released ' + t.name + ' from their contract. Severance ' + fmtMoney(sev) + '.', 'contract');
    save();
    emit('contract', t);
    return { ok: true };
  }
  function endExclusive(t) {
    const p = talentProject(t);
    t.contract = p ? { type: 'project', projectId: p.id } : null;
  }
  function contractTick() {
    roster().forEach(t => {
      const left = weeksLeft(t);
      if (left <= 0) {
        endExclusive(t);
        addLog(t.name + '\'s contract has expired. They are a free agent again.', 'warning');
        state.stopFlag = true;
        emit('contract', t);
      } else if (left <= TUNING.contracts.warnWeeks && !t.contract.warned) {
        t.contract.warned = true;
        addLog(t.name + '\'s contract ends in ' + left + ' weeks. Renew it on the Roster page.', 'warning');
        state.stopFlag = true;
        emit('contract', t);
      }
    });
  }

// ===== SECTION: CAST =====
  function normalizeCast(c) {
    c = c || {};
    const out = {};
    SLOTS.forEach(s => {
      const v = c[s];
      if (v === 'founder' && (s === 'director' || s === 'writer')) out[s] = 'founder';
      else if (v === '' || v == null || v === 'none') out[s] = null;
      else out[s] = Number(v);
    });
    return out;
  }
  function castTalent(p) { return SLOTS.map(s => p.cast[s]).filter(v => typeof v === 'number').map(getTalent).filter(Boolean); }
  function castCheck(cast, format) {
    let fees = 0;
    for (const s of SLOTS) {
      const v = cast[s];
      if (v === 'founder') {
        if (isExecutive()) return { reason: 'The founder runs the studio now and can\'t direct or write.', fees: 0 };
        const fp = founderProject();
        if (fp) return { reason: 'The founder is busy on "' + fp.title + '".', fees: 0 };
      } else if (typeof v === 'number') {
        const t = getTalent(v);
        if (!t || t.role !== SLOT_ROLE[s]) return { reason: 'Pick a valid ' + CONTENT.SLOT_LABELS[s].toLowerCase() + '.', fees: 0 };
        if (isRivalTalent(t)) return { reason: t.name + ' is under contract at ' + rivalName(t.contract.rivalId) + '.', fees: 0 };
        if (!isRoster(t) && recruitmentCooldown(t)) return { reason: t.name + ' declined recently. Try again in ' + recruitmentCooldown(t) + ' weeks, or choose another artist.', fees: 0 };
        const busy = talentProject(t);
        if (busy) return { reason: t.name + ' is busy on "' + busy.title + '".', fees: 0 };
        if (!isRoster(t)) fees += talentFee(t, format);
      }
    }
    return { reason: null, fees: fees };
  }
  function slotOptions(slot, format, genre, topic, budget) {
    const role = SLOT_ROLE[slot];
    const opts = [];
    if (slot === 'director' || slot === 'writer') {
      const fp = isExecutive() ? null : founderProject();
      opts.push({ id: 'founder', name: state.founder.name + ' (founder)', skill: Math.round(state.founder.stats[slot === 'director' ? 'directing' : 'writing']),
        fee: 0, roster: false, busy: isExecutive() ? 'Runs the studio' : (fp ? fp.title : null) });
    }
    state.talent.filter(t => t.role === role).sort((a, b) => b.skill - a.skill).forEach(t => {
      const bp = talentProject(t);
      const busy = isRivalTalent(t) ? rivalName(t.contract.rivalId) : (bp ? bp.title : null);
      const interest = recruitmentInterest(t, format, genre, topic, budget);
      opts.push({ id: t.id, name: t.name, skill: t.skill, fame: t.fame, fee: isRoster(t) ? 0 : talentFee(t, format), roster: isRoster(t),
        busy: busy || (!isRoster(t) && recruitmentCooldown(t) ? 'Declined for ' + recruitmentCooldown(t) + ' weeks' : null),
        interest: interest.chance, elite: interest.elite, affinity: t.affinity, specialty: t.specialty });
    });
    return opts;
  }
  function castSummary(p) {
    return SLOTS.map(s => {
      const v = p.cast[s];
      let name = 'Local hire', skill = TUNING.talent.emptySkill;
      if (v === 'founder') { name = state.founder.name + ' (founder)'; skill = null; }
      else if (typeof v === 'number') { const t = getTalent(v); name = t ? t.name : (p.castNames[s] || 'Unknown'); skill = t ? t.skill : null; }
      return { slot: s, label: CONTENT.SLOT_LABELS[s], id: v, name: name, skill: skill };
    });
  }

// ===== SECTION: PROJECTS =====
  function formats() {
    const tier = state.studio.tier;
    return Object.keys(TUNING.formats).map(id => {
      const f = TUNING.formats[id];
      return { id: id, name: f.name, unlockFame: f.unlockFame, minTier: f.minTier || 0,
        unlocked: state.studio.fame >= f.unlockFame && tier >= (f.minTier || 0),
        tiers: f.tiers.map(t => Object.assign({}, t, { minTier: t.minTier || 0, locked: tier < (t.minTier || 0) })), stages: f.stages };
    });
  }
  function activeProjects() { return state.projects.filter(p => ACTIVE_STAGES.includes(p.stage)); }
  function activeProject() { return activeProjects()[0] || null; }
  function capacity() { return growthTier().capacity; }
  function getProject(id) { return byId(state.projects, Number(id)); }
  function plannedWeeks(fmtId) {
    const s = TUNING.formats[fmtId].stages;
    return s.development + s.preproduction + s.shoot + s.post;
  }
  function prodQualityMult(budget, fees) {
    const T = TUNING.talent;
    const share = budget ? (budget - fees) / budget : 1;
    return clamp(share / (1 - T.freeFeeShare), T.minProdQuality, 1);
  }
  function previewProject(o) {
    const f = TUNING.formats[o.format];
    if (!f) return { ok: false, reason: 'Pick a format.' };
    const tier = f.tiers[o.tier];
    if (!tier) return { ok: false, reason: 'Pick a budget tier.' };
    const cast = normalizeCast(o.cast);
    const cc = castCheck(cast, o.format);
    const weeks = plannedWeeks(o.format);
    const fees = cc.fees;
    const prodBudget = tier.budget - fees;
    const weekly = Math.round(Math.max(prodBudget, 0) / weeks);
    let reason = null;
    const tierName = i => (CONTENT.GROWTH_TIERS[i] || { name: 'tier ' + i }).name;
    if (activeProjects().length >= capacity()) reason = 'The studio is at capacity (' + capacity() + ' production' + (capacity() > 1 ? 's' : '') + '). Grow the studio for more.';
    else if (state.studio.tier < (f.minTier || 0)) reason = f.name + ' needs the ' + tierName(f.minTier) + ' tier.';
    else if (state.studio.fame < f.unlockFame) reason = 'Needs studio fame ' + f.unlockFame + '.';
    else if (state.studio.tier < (tier.minTier || 0)) reason = 'The ' + tier.name + ' budget needs the ' + tierName(tier.minTier) + ' tier.';
    else if (o.format === 'pilot' && tvSlotsUsed() >= growthTier().maxSeries) reason = 'No room for another show (' + growthTier().maxSeries + ' at this tier, pilots included).';
    else if (!o.title || !o.title.trim()) reason = 'Enter a title.';
    else if (!byId(CONTENT.GENRES, o.genre)) reason = 'Pick a genre.';
    else if (!byId(CONTENT.TOPICS, o.topic)) reason = 'Pick a topic.';
    else if (cc.reason) reason = cc.reason;
    else if (fees > tier.budget * TUNING.talent.maxFeeShare) reason = 'Talent fees are over ' + Math.round(TUNING.talent.maxFeeShare * 100) + '% of the budget. Pick cheaper talent or a bigger tier.';
    else if (state.cash < fees + weekly * 2) reason = 'Not enough cash for the fees plus the first two weeks.';
    return { ok: !reason, reason: reason, budget: tier.budget, fees: fees, prodBudget: prodBudget, weeks: weeks, weekly: weekly,
      prodQuality: prodQualityMult(tier.budget, fees), cashAfter: state.cash - tier.budget };
  }
  function startProject(o) {
    if (!state || state.gameOver) return { ok: false, reason: 'No game running.' };
    const pv = previewProject(o);
    if (!pv.ok) return pv;
    const f = TUNING.formats[o.format];
    const cast = normalizeCast(o.cast);
    // Chance to secure an elite artist is checked once per offer, before any cost is paid.
    // A declined offer has a short cooldown to avoid unlimited retrying in the same week.
    for (const t of SLOTS.map(slot => cast[slot]).filter(x => typeof x === 'number').map(getTalent).filter(Boolean)) {
      if (isRoster(t) || !eliteTalent(t)) continue;
      const offer = recruitmentInterest(t, o.format, o.genre, o.topic, pv.budget);
      if (Math.random() >= offer.chance) {
        state.recruitment = state.recruitment || { declined: {} };
        state.recruitment.declined[t.id] = state.week + TUNING.talent.offerRefusalWeeks;
        addLog(t.name + ' declined the ' + o.format + ' offer. A stronger track record, genre fit or material can help next time.', 'contract');
        save();
        return { ok: false, reason: t.name + ' declined your offer (estimated interest ' + Math.round(offer.chance * 100) + '%). Try a different artist or wait ' + TUNING.talent.offerRefusalWeeks + ' weeks.' };
      }
    }
    const castNames = {};
    SLOTS.forEach(s => { if (typeof cast[s] === 'number') castNames[s] = getTalent(cast[s]).name; });
    const p = {
      id: state.nextId++, title: o.title.trim().slice(0, 60), format: o.format, genre: o.genre, topic: o.topic, tier: o.tier,
      budget: pv.budget, fees: pv.fees, prodBudget: pv.prodBudget, weekly: pv.weekly, spent: pv.fees, marketingSpend: 0,
      cast: cast, castNames: castNames,
      stage: 'development', stageWeeksLeft: f.stages.development, startWeek: state.week,
      qualityMod: 0, hypeMod: 0, usedEvents: [], lastEventWeek: -99, lastSlipWeek: -99, flags: {},
      quality: null, hype: null, critic: null, releaseWeek: null, weeksInRelease: 0,
      opening: 0, gross: 0, revenue: 0, festival: null, result: null
    };
    state.cash -= pv.fees;
    castTalent(p).forEach(t => { if (!isRoster(t)) t.contract = { type: 'project', projectId: p.id }; });
    state.projects.push(p);
    const hires = castTalent(p).map(t => t.name);
    addLog('Greenlit "' + p.title + '" (' + f.name + ', ' + byId(CONTENT.GENRES, p.genre).name + ', ' + fmtMoney(p.budget) + ')' +
      (hires.length ? '. Attached: ' + hires.join(', ') + (p.fees ? ' (fees ' + fmtMoney(p.fees) + ')' : '') : '') + '.', 'project');
    save();
    emit('project', p);
    return { ok: true, project: p };
  }
  function randomTitle() {
    const t = CONTENT.TITLES;
    return pick(t.patterns).replace('{adj}', pick(t.adjectives)).replace('{noun2}', pick(t.nouns))
      .replace('{noun}', pick(t.nouns)).replace('{place}', pick(t.places));
  }
  function advanceProject(p) {
    p.stageWeeksLeft--;
    if (p.stage === 'shoot') reliabilitySlip(p);
    if (p.stageWeeksLeft <= 0) { nextStage(p); return; }
    maybeEvent(p);
  }
  function reliabilitySlip(p) {
    if (p.lastSlipWeek === state.week) return;
    for (const t of castTalent(p)) {
      const chance = ((100 - effReliability(t)) / 100 * TUNING.talent.slipChance + traitMods(t).delayChance) / (1 + deptBonus('production'));
      if (Math.random() < chance) {
        p.stageWeeksLeft++;
        p.lastSlipWeek = state.week;
        addLog(t.name + ' held up the shoot of "' + p.title + '". One week lost.', 'project');
        return;
      }
    }
  }
  function postWeeksAdj(p) {
    const c = typeof p.cast.crew === 'number' ? getTalent(p.cast.crew) : null;
    if (!c || c.skill < TUNING.talent.crewSpecialtyMin) return 0;
    const sp = byId(CONTENT.CREW_SPECIALTIES, c.specialty);
    return sp && sp.effects.postWeeks ? sp.effects.postWeeks : 0;
  }
  function nextStage(p) {
    const f = TUNING.formats[p.format];
    if (p.stage === 'post') {
      if (!p.flags.cutDone) { raise(p, CONTENT.FIXED_DECISIONS.cut); return; }
      if (p.format === 'feature' && !p.flags.marketingDone) { raiseMarketing(p); return; }
      if (p.format === 'feature' && !p.flags.dateDone) { raiseReleaseDate(p); return; }
      release(p);
      return;
    }
    p.stage = ACTIVE_STAGES[ACTIVE_STAGES.indexOf(p.stage) + 1];
    p.stageWeeksLeft = f.stages[p.stage] + (p.stage === 'post' ? postWeeksAdj(p) + eraMods().postWeeks : 0);
    if (p.stageWeeksLeft < 1) p.stageWeeksLeft = 1;
    addLog('"' + p.title + '" moved to ' + CONTENT.STAGE_LABELS[p.stage] + '.', 'project');
    // Routine stage transitions are visible in the dashboard and log, not blocking interruptions.
    emit('stage', p);
    if (p.stage === 'post') raise(p, CONTENT.FIXED_DECISIONS.cut);
  }

// ===== SECTION: QUALITY_HYPE =====
  function topicFit(p) {
    const t = byId(CONTENT.TOPICS, p.topic);
    if (!t) return 0;
    if ((t.good || []).includes(p.genre)) return 8;
    if ((t.bad || []).includes(p.genre)) return -6;
    return 0;
  }
  function slotSkill(p, slot) {
    const v = p.cast[slot];
    if (v === 'founder') return state.founder.stats[slot === 'director' ? 'directing' : 'writing'];
    const t = typeof v === 'number' ? getTalent(v) : null;
    if (!t) return TUNING.talent.emptySkill;
    const mentor = castTalent(p).filter(o => o.id !== t.id).reduce((a, o) => a + traitMods(o).teamSkill, 0);
    return clamp(t.skill + mentor, 0, 100);
  }
  function crewEffect(p, key) {
    const c = typeof p.cast.crew === 'number' ? getTalent(p.cast.crew) : null;
    if (!c || c.skill < TUNING.talent.crewSpecialtyMin) return 0;
    const sp = byId(CONTENT.CREW_SPECIALTIES, c.specialty);
    return sp && sp.effects[key] ? sp.effects[key] : 0;
  }
  function talentBonus(p, key) {
    return castTalent(p).reduce((a, t) => a + traitMods(t)[key] + (key === 'quality' && t.affinity.includes(p.genre) ? TUNING.talent.affinityBonus : 0), 0);
  }
  function softCap(v, knee) {
    if (knee >= 100 || v <= knee) return v;
    const room = TUNING.softCap.room;
    return knee + room * (1 - Math.exp(-(v - knee) / room));
  }
  function computeQuality(p) {
    const T = TUNING.talent;
    const tier = TUNING.formats[p.format].tiers[p.tier];
    let q = T.baseQuality;
    SLOTS.forEach(s => { q += slotSkill(p, s) * T.weights[s]; });
    q += tier.quality * prodQualityMult(p.budget, p.fees || 0) + topicFit(p) + talentBonus(p, 'quality') + crewEffect(p, 'quality') + deptBonus('development') +
      eraQuality(p.genre) + p.qualityMod + rnd(-8, 8);
    return clamp(Math.round(softCap(q, TUNING.softCap.quality)), 1, 100);
  }
  function castFame(p, slot) { const v = p.cast[slot]; const t = typeof v === 'number' ? getTalent(v) : null; return t ? t.fame : 0; }
  function computeHype(p) {
    const T = TUNING.talent;
    const h = state.studio.fame * T.hypeStudioFame + founderHype() + castFame(p, 'lead') * T.hypeLeadFame + castFame(p, 'director') * T.hypeDirectorFame +
      talentBonus(p, 'hype') + crewEffect(p, 'hype') + deptBonus('marketing') + (state.studio.prestige || 0) * TUNING.awards.prestigeHype + p.hypeMod + rnd(-5, 5);
    return clamp(Math.round(softCap(h, TUNING.softCap.hype)), 0, 100);
  }

// ===== SECTION: DECISIONS =====
  function raise(p, def, t) {
    const pend = {
      projectId: p.id, id: def.id, talentId: t ? t.id : null, text: fill(def.text, p, t),
      category: def.category || null, disaster: !!def.disaster,
      choices: def.choices.map(c => ({ label: c.label, effects: c.effects || {}, result: c.result ? fill(c.result, p, t) : null }))
    };
    p.lastEventWeek = state.week;
    state.stopFlag = true;
    const same = d => d && d.projectId === pend.projectId && d.id === pend.id;
    if (same(state.pending) || state.queue.some(same)) return;
    if (pend.disaster) noteDisaster();
    if (state.pending) { state.queue.push(pend); return; }
    state.pending = pend;
    emit('decision_pending', state.pending);
  }
  function maybeEvent(p) {
    if (state.pending) return;
    if (state.week - p.lastEventWeek <= TUNING.eventCooldownWeeks) return;
    if (p.stage === 'development' && p.flags.devEvent) return;
    const chance = p.stage === 'shoot' ? TUNING.eventChanceShoot : (p.stage === 'development' ? TUNING.eventChanceDev : 0);
    if (Math.random() >= chance) return;
    const traitPool = [];
    castTalent(p).forEach(t => traitsOf(t).forEach(tr => (tr.events || []).forEach(eid => {
      const ev = byId(CONTENT.TALENT_EVENTS, eid);
      if (ev && ev.stage === p.stage && !p.usedEvents.includes(ev.id)) traitPool.push({ ev: ev, t: t });
    })));
    const cooling = eventsCooling();
    const prod = CONTENT.EVENTS.filter(e => e.category === 'production');
    const pool = CONTENT.DECISIONS.concat(prod).filter(d => d.stage === p.stage && (!d.formats || d.formats.includes(p.format)) &&
      !p.usedEvents.includes(d.id) && !(d.disaster && cooling));
    if (p.stage === 'development') p.flags.devEvent = true;
    // Global memory prevents separate projects repeating the same production popup back-to-back.
    const recent = state.events.recentProduction || [];
    const fresh = pool.filter(d => !recent.includes(d.id));
    const freshTraits = traitPool.filter(x => !recent.includes(x.ev.id));
    const poolNow = fresh.length ? fresh : pool;
    const traitsNow = freshTraits.length ? freshTraits : traitPool;
    let selection = null;
    if (traitsNow.length && (Math.random() < TUNING.talent.traitEventShare || !poolNow.length)) {
      const x = pick(traitsNow);
      selection = x.ev.id;
      raise(p, x.ev, x.t);
    } else if (poolNow.length) {
      const d = pick(poolNow);
      selection = d.id;
      raise(p, d);
    }
    if (selection) {
      state.events.recentProduction = (recent.concat(selection)).slice(-10);
    }
  }
  function raiseMarketing(p) {
    raise(p, {
      id: 'marketing',
      text: 'How much marketing for "' + p.title + '"? Spend is a share of the production budget.',
      choices: TUNING.marketing.map(m => ({
        label: m.name + (m.share ? ' (' + fmtMoney(p.budget * m.share) + ')' : ''),
        effects: m.share ? { marketing: m.share, hype: m.hype } : {},
        result: 'Marketing for "' + p.title + '": ' + m.name + '.'
      }))
    });
  }
  function raiseReleaseDate(p) {
    raise(p, {
      id: 'release_date',
      text: '"' + p.title + '" is ready. When should it open? Outlook = genre demand (popularity × era taste) × season × economy ÷ competition (same-genre and big rival films weigh more).',
      choices: TUNING.market.releaseDelays.map(d => {
        const m = marketOutlook(p, d);
        const se = seasonOf(state.week + d);
        const named = m.rivals.length ? ' (' + m.rivals.map(r => r.studio + ': "' + r.title + '"').join('; ') + ')' : '';
        return { label: (d ? 'Wait ' + d + ' weeks' : 'Release now') + ' · ' + m.competitors + ' rival release' + (m.competitors === 1 ? '' : 's') + named + ', ' + se.name + ' · outlook ×' + m.mult.toFixed(2),
          effects: d ? { weeks: d } : {}, result: '"' + p.title + '" ' + (d ? 'will open in ' + d + ' weeks.' : 'opens now.') };
      })
    });
  }
  function raiseStudio(id, text, choices, extra) {
    const pend = Object.assign({ projectId: null, id: id, talentId: null, text: text, choices: choices }, extra || {});
    state.stopFlag = true;
    const same = d => d && d.id === pend.id && d.projectId == null;
    if (same(state.pending) || state.queue.some(same)) return;
    if (state.pending) { state.queue.push(pend); return; }
    state.pending = pend;
    emit('decision_pending', state.pending);
  }
  function applyEffects(p, e) {
    if (e.quality) p.qualityMod += e.quality;
    if (e.hype) p.hypeMod += e.hype;
    if (e.weeks) p.stageWeeksLeft += e.weeks;
    if (e.costPct) { const c = Math.round(p.budget * e.costPct); state.cash -= c; p.spent += c; }
    if (e.marketing) { const c = Math.round(p.budget * e.marketing); state.cash -= c; p.spent += c; p.marketingSpend += c; }
    if (e.fame) state.studio.fame = clamp(state.studio.fame + e.fame, 0, 100);
  }
  function choose(i) {
    const pd = state && state.pending;
    if (!pd) return false;
    const c = pd.choices[i];
    if (!c) return false;
    const p = pd.projectId != null ? getProject(pd.projectId) : null;
    state.pending = null;
    if (pd.scope === 'staff') {
      applyStaffEffects(pd.dept, c.effects);
      addLog(c.result || c.label, 'staff');
    } else if (pd.scope === 'poach') {
      resolvePoach(pd, c.effects);
    } else if (pd.scope === 'event') {
      applyEventEffects(pd, c.effects);
      addLog(c.result || c.label, 'event', pd.category);
    } else if (p) {
      applyEffects(p, c.effects);
      p.usedEvents.push(pd.id);
      if (pd.id === 'cut') p.flags.cutDone = true;
      if (pd.id === 'marketing') p.flags.marketingDone = true;
      if (pd.id === 'release_date') { p.flags.dateDone = true; rivalsReact(p); }
      addLog(c.result || ('"' + p.title + '": ' + c.label + '.'), pd.category ? 'event' : 'decision', pd.category);
      if (ACTIVE_STAGES.includes(p.stage) && p.stageWeeksLeft <= 0) nextStage(p);
    }
    if (!state.pending && state.queue.length) {
      state.pending = state.queue.shift();
      emit('decision_pending', state.pending);
    }
    save();
    emit('decision', c);
    return true;
  }

// ===== SECTION: EVENTS =====
  function eventsCooling() { return state.week < state.events.cooldownUntil; }
  function noteDisaster() { state.events.cooldownUntil = state.week + TUNING.events.disasterCooldown; }
  function staffHeads() { return Object.keys(state.staff.depts).reduce((a, id) => a + state.staff.depts[id].heads, 0); }
  function eventNeed(n) {
    if (n === 'roster') return roster().length > 0;
    if (n === 'staff') return staffHeads() > 0;
    if (n === 'debt') return state.debt > 0;
    if (n === 'production') return activeProjects().length > 0;
    return true;
  }
  function eventEligible(ev) {
    if (ev.category === 'production') return false;
    const st = state, E = TUNING.events;
    const last = st.events.seen[ev.id];
    if (last != null && (ev.once || st.week - last < E.repeatWeeks)) return false;
    if (ev.disaster && eventsCooling()) return false;
    const y = dateOf().year;
    if (ev.from && y < ev.from) return false;
    if (ev.to && y > ev.to) return false;
    if (ev.minFame && st.studio.fame < ev.minFame) return false;
    if (ev.minTier && st.studio.tier < ev.minTier) return false;
    if (ev.minReleases && st.studio.releases < ev.minReleases) return false;
    if (ev.cycle && st.market.cycle.id !== ev.cycle) return false;
    return (ev.needs || []).every(eventNeed);
  }
  function evFill(text, ctx) {
    return String(text).replace(/\{(studio|founder|name|genre)\}/g, (m, k) => ctx[k]);
  }
  function eventTick() {
    const E = TUNING.events, ev = state.events;
    if (state.week < ev.nextWeek || eventsCooling() || state.pending || state.queue.length) return;
    if (Math.random() >= E.studioChance) return;
    const pool = CONTENT.EVENTS.filter(eventEligible);
    if (!pool.length) return;
    raiseEvent(weightedPick(pool, x => x.disaster ? E.disasterWeight : 1));
  }
  function raiseEvent(ev) {
    const E = TUNING.events;
    const t = (ev.needs || []).includes('roster') ? pick(roster()) : null;
    const genre = pick(CONTENT.GENRES).id;
    const ctx = { studio: state.studio.name, founder: state.founder.name, name: t ? t.name : 'Your star', genre: genreName(genre) };
    const unit = Math.max(weeklyBurn(), E.minBurn);
    const choices = ev.choices.map(c => {
      const eff = Object.assign({}, c.effects || {});
      if (eff.cash) eff.cash = Math.round(eff.cash * unit / 50) * 50;
      return { label: evFill(c.label, ctx), effects: eff, result: c.result ? evFill(c.result, ctx) : null };
    });
    state.events.seen[ev.id] = state.week;
    state.events.nextWeek = state.week + rint(E.gapWeeks[0], E.gapWeeks[1]);
    if (ev.disaster) noteDisaster();
    raiseStudio('ev_' + ev.id, evFill(ev.text, ctx), choices,
      { scope: 'event', eventId: ev.id, category: ev.category, genre: genre, talentId: t ? t.id : null, disaster: !!ev.disaster });
  }
  function applyEventEffects(pd, e) {
    const st = state, M = TUNING.rivals.morale;
    if (e.cash) st.cash += e.cash;
    if (e.fame) st.studio.fame = clamp(st.studio.fame + e.fame, 0, 100);
    if (e.critics) st.studio.criticsRep = clamp(st.studio.criticsRep + e.critics, 0, 100);
    activeProjects().forEach(p => {
      if (e.hype) p.hypeMod += e.hype;
      if (e.quality) p.qualityMod += e.quality;
      if (e.weeks) p.stageWeeksLeft += e.weeks;
    });
    if (e.market && pd.genre && st.market.genres[pd.genre] != null) {
      const g = st.market.genres;
      g[pd.genre] = Math.round(clamp(g[pd.genre] + e.market, TUNING.market.genreMin, TUNING.market.genreMax) * 100) / 100;
    }
    const t = pd.talentId != null ? getTalent(pd.talentId) : null;
    const moraleOf = x => (x.contract.morale == null ? M.start : x.contract.morale);
    if (t && e.talentFame) t.fame = clamp(t.fame + e.talentFame, 0, 100);
    if (t && e.talentMorale && isRoster(t)) t.contract.morale = clamp(moraleOf(t) + e.talentMorale, 0, 100);
    if (e.rosterMorale) roster().forEach(x => { x.contract.morale = clamp(moraleOf(x) + e.rosterMorale, 0, 100); });
    if (e.staffMorale) Object.keys(st.staff.depts).forEach(id => { const d = st.staff.depts[id]; if (d.heads) d.morale = clamp(d.morale + e.staffMorale, 0, 100); });
  }

// ===== SECTION: RELEASE =====
  function release(p) {
    const g = byId(CONTENT.GENRES, p.genre) || { audience: 1, critics: 0 };
    const st = state.studio;
    p.quality = computeQuality(p);
    p.hype = computeHype(p);
    p.critic = clamp(Math.round(p.quality + g.critics + rnd(-10, 10)), 1, 100);
    p.stage = 'release';
    p.releaseWeek = state.week;
    p.weeksInRelease = 0;
    st.criticsRep = st.releases ? Math.round(st.criticsRep * 0.7 + p.critic * 0.3) : p.critic;
    st.releases++;
    if (p.cast.director === 'founder') growStat('directing', 2, 4);
    if (p.cast.writer === 'founder') growStat('writing', 1, 3);
    if (isExecutive()) { growStat('business', 1, 2); growStat('charisma', 0, 2); }
    castTalent(p).forEach(t => {
      if (t.contract && t.contract.type === 'project' && t.contract.projectId === p.id) t.contract = null;
      if (!t.credits.includes(p.id)) t.credits.push(p.id);
      growTalentSkill(t);
    });
    if (p.format === 'short') {
      const f = festivalDefinition(festivalPlan(p)[0]) || CONTENT.AWARDS.circuit[0];
      p.festival = f.name;
      p.festivalTier = f.level;
      p.festivalTierId = f.id;
      addLog('"' + p.title + '" is finished. Critics: ' + p.critic + '/100. Automatically entered in the ' + f.level + '-tier ' + f.name + '.', 'release');
    } else if (p.format === 'pilot') {
      pilotResult(p);
    } else {
      p.festivalPlan = festivalPlan(p);
      const m = marketOutlook(p, 0);
      p.market = { genre: m.genre, taste: m.taste, topic: m.topic, season: m.season, cycle: m.cycle, competitors: m.competitors, pressure: m.pressure, mult: m.mult,
        rivals: m.rivals.map(r => r.studio + ': ' + r.title) };
      const ref = TUNING.boxOfficeRefBudget;
      const scale = ref * Math.pow(p.budget / ref, TUNING.boxOfficeBudgetExp);
      const raw = scale * TUNING.boxOfficeBase * qualityFactor(p.quality) * (0.6 + p.hype / 100) * g.audience * luck() *
        m.mult * (1 + deptBonus('distribution')) * eraMods().boxOffice;
      const cap = audienceCap();
      p.opening = Math.round(cap * (1 - Math.exp(-raw / cap)));
      addLog('"' + p.title + '" opens in theaters. Critics: ' + p.critic + '/100. Market outlook ×' + m.mult.toFixed(2) + ' (' + m.competitors + ' rival releases' +
        (m.rivals.length ? ', incl. ' + m.rivals.map(r => r.studio + '\'s "' + r.title + '"').join(', ') : '') + ').', 'release');
    }
    state.stopFlag = true;
    emit('release', p);
  }
  function qualityFactor(q) { return Math.pow(q / 60, TUNING.boxOfficeQualityExp); }
  function luck() { return rnd(TUNING.boxOfficeLuck[0], TUNING.boxOfficeLuck[1]); }
  function legsDecay(q) { const L = TUNING.legs; return clamp(L.base + q * L.perQuality, L.base, L.max); }
  function releaseIncome(p) {
    p.weeksInRelease++;
    if (p.format === 'short') {
      return p.weeksInRelease < TUNING.festivalWaitWeeks ? 0 : festivalResult(p);
    }
    const decay = legsDecay(p.quality);
    let gross = p.opening * Math.pow(decay, p.weeksInRelease - 1);
    if (p.weeksInRelease > 1) gross /= 1 + TUNING.rivals.holdPenalty * rivalPressure(state.week, p.genre, null, true).weight;
    gross = Math.round(gross);
    const income = Math.round(gross * (TUNING.studioShare + growthTier().boxShare));
    p.gross += gross;
    p.revenue += income;
    tallyGross('you', gross);
    if (p.weeksInRelease === 1) addLog('"' + p.title + '" opening week: ' + fmtMoney(gross) + ' gross.', 'release');
    if (gross < p.opening * 0.05 || p.weeksInRelease >= TUNING.maxReleaseWeeks) finishFeature(p);
    return income;
  }
  function festivalResult(p) {
    const f = festivalDefinition(p.festivalTierId) || CONTENT.AWARDS.circuit[0];
    const roll = festivalMerit(p) + rnd(-11, 11);
    const selected = roll >= f.selection;
    const won = roll >= f.winner;
    let revenue = p.quality < 40 ? Math.round(p.budget * 0.15) : Math.round(p.budget * (0.5 + p.quality / 70));
    let fame = 1;
    p.result = 'Screened';
    if (won) {
      p.result = 'Won';
      revenue += (f.tier + 1) * rint(4, 10) * 100;
      fame += Math.min(7, f.tier + 2);
      growStat('charisma', 1, 3);
    } else if (selected) {
      p.result = 'Official selection';
      fame += Math.min(4, Math.ceil(f.tier / 2));
    }
    revenue = Math.round(revenue * eraMods().festival);
    p.revenue += revenue;
    p.stage = 'done';
    p.festResults = [{ festival: f.name, tier: f.level, result: won ? f.prize : p.result }];
    fame = gainStudioFame(fame);
    if (won) state.studio.prestige = clamp((state.studio.prestige || 0) + Math.ceil(f.tier / 2), 0, 100);
    growStat('business', 0, 1);
    addTalentFame(p);
    addLog('"' + p.title + '" at the ' + f.level + '-tier ' + f.name + ': ' + p.result + '. Earned ' + fmtMoney(revenue) + ', fame +' + fame + '.', 'festival');
    if (won) state.stopFlag = true;
    emit('festival', p);
    return revenue;
  }
  function finishFeature(p) {
    p.stage = 'done';
    const profit = p.revenue - p.spent;
    const ratio = p.gross / p.budget;
    const fame = 3 + clamp(Math.round(ratio * 4), 0, 12);
    p.result = profit < 0 ? 'Flop' : (profit >= p.budget ? 'Hit' : 'Profit');
    const awardedFame = gainStudioFame(fame);
    growStat('business', 1, 2);
    addTalentFame(p);
    openWindows(p);
    addLog('"' + p.title + '" leaves theaters: ' + fmtMoney(p.gross) + ' gross, profit ' + fmtMoney(profit) + ' (' + p.result + '). Fame +' + awardedFame + '.' +
      (p.windows.length ? ' Next: ' + p.windows.map(w => windowName(w.id)).join(', ') + '.' : ''), 'release');
    state.stopFlag = true;
    emit('finished', p);
  }

// ===== SECTION: FINANCE =====
  function loanCap() { return TUNING.loanBaseCap + Math.floor(state.studio.fame) * TUNING.loanCapPerFame; }
  function weeklyBurn() {
    return TUNING.livingCost + Math.round(state.debt * TUNING.weeklyInterest) + weeklySalaries() + weeklyPayroll() + weeklyOverhead() +
      activeProjects().reduce((a, p) => a + p.weekly, 0) + state.series.filter(s => s.status === 'airing').reduce((a, s) => a + s.epCost, 0);
  }
  function weeklyProfit() { return state.lastWeek.income - state.lastWeek.costs; }
  function takeLoan() {
    if (!state || state.gameOver) return { ok: false, reason: 'No game running.' };
    const cap = loanCap();
    if (state.debt + TUNING.loanStep > cap) return { ok: false, reason: 'Loan limit reached (' + fmtMoney(cap) + '). More fame raises it.' };
    state.debt += TUNING.loanStep;
    state.cash += TUNING.loanStep;
    state.finance.q.borrowed += TUNING.loanStep;
    addLog('Borrowed ' + fmtMoney(TUNING.loanStep) + '. Debt is now ' + fmtMoney(state.debt) + '.', 'finance');
    save();
    emit('finance');
    return { ok: true };
  }
  function repayLoan() {
    if (!state || state.gameOver) return { ok: false, reason: 'No game running.' };
    const amt = Math.min(TUNING.loanStep, state.debt);
    if (amt <= 0) return { ok: false, reason: 'No debt to repay.' };
    if (state.cash < amt) return { ok: false, reason: 'Not enough cash.' };
    state.debt -= amt;
    state.cash -= amt;
    state.finance.q.borrowed -= amt;
    addLog('Repaid ' + fmtMoney(amt) + '. Debt is now ' + fmtMoney(state.debt) + '.', 'finance');
    save();
    emit('finance');
    return { ok: true };
  }

// ===== SECTION: ECONOMY =====
  function emptyQuarter() {
    return { revenue: 0, freelance: 0, production: 0, salaries: 0, payroll: 0, overhead: 0, interest: 0, living: 0, borrowed: 0 };
  }
  function sizeLevel() {
    const sizes = TUNING.economy.sizes;
    let lvl = 0;
    const rev = trailingRevenue();
    sizes.forEach((s, i) => { if (rev >= s.revenue) lvl = i; });
    return lvl;
  }
  function trailingRevenue() {
    return state.finance.history.slice(-TUNING.economy.trailingQuarters).reduce((a, r) => a + r.revenue, 0);
  }
  function studioSize() {
    const lvl = sizeLevel();
    const s = TUNING.economy.sizes[lvl];
    const next = TUNING.economy.sizes[lvl + 1] || null;
    return { level: lvl, fixedOverhead: s.overhead + growthTier().upkeep, revenueShare: s.revenueShare, trailingRevenue: trailingRevenue(),
      overhead: weeklyOverhead(), staff: staffCount(), payroll: weeklyPayroll(), nextRevenue: next ? next.revenue : null };
  }
  function staffCount() {
    const s = TUNING.economy.sizes[sizeLevel()];
    return s.staff + s.prodStaff * activeProjects().length + Math.floor(roster().length * TUNING.economy.staffPerRoster);
  }
  function officePayroll() { return staffCount() * TUNING.economy.staffPay; }
  function weeklyPayroll() { return officePayroll() + deptPayroll(); }
  function weeklyOverhead(revenue) {
    const s = TUNING.economy.sizes[sizeLevel()];
    if (revenue == null) revenue = state.lastWeek.revenue || 0;
    return s.overhead + growthTier().upkeep + Math.round(s.revenueShare * revenue);
  }
  function earn(amt) { state.cash += amt; state.finance.q.revenue += amt; }
  function bookWeek(w) {
    const q = state.finance.q;
    Object.keys(w).forEach(k => { q[k] += w[k]; });
  }
  function quarterProfit(q, cash, startCash) {
    const tracked = q.revenue + q.freelance - (q.production + q.salaries + q.payroll + q.overhead + q.interest + q.living);
    const deals = Math.round(cash - startCash - q.borrowed - tracked);
    return { tracked: tracked, deals: deals, profit: tracked + deals };
  }
  function quarterToDate() {
    const f = state.finance;
    const r = quarterProfit(f.q, state.cash, f.qStartCash);
    return Object.assign({}, f.q, { deals: r.deals, profit: r.profit, weeks: state.week % TUNING.economy.quarterWeeks });
  }
  function taxOn(taxable) {
    const br = TUNING.economy.taxBrackets;
    let tax = 0;
    br.forEach((b, i) => {
      const hi = i + 1 < br.length ? br[i + 1][0] : Infinity;
      if (taxable > b[0]) tax += (Math.min(taxable, hi) - b[0]) * b[1];
    });
    return tax;
  }
  function closeQuarter() {
    const E = TUNING.economy;
    const f = state.finance;
    const r = quarterProfit(f.q, state.cash, f.qStartCash);
    let taxable = 0;
    if (r.profit < 0) f.lossCarry += -r.profit;
    else { taxable = Math.max(0, r.profit - f.lossCarry); f.lossCarry = Math.max(0, f.lossCarry - r.profit); }
    const tax = Math.round(taxOn(taxable));
    state.cash -= tax;
    const d = dateOf(state.week - 1);
    const row = Object.assign({ year: d.year, quarter: Math.ceil(d.week / E.quarterWeeks) }, f.q,
      { deals: r.deals, profit: r.profit, tax: tax, net: r.profit - tax, lossCarry: f.lossCarry, cash: state.cash });
    f.history.push(row);
    if (f.history.length > E.historyQuarters) f.history.shift();
    f.q = emptyQuarter();
    f.qStartCash = state.cash;
    addLog('Q' + row.quarter + ' ' + row.year + ': revenue ' + fmtMoney(row.revenue + row.freelance) + ', profit before tax ' + fmtMoney(row.profit) +
      ', tax ' + fmtMoney(tax) + ', net ' + fmtMoney(row.net) + '.', 'finance');
    if (E.stopOnQuarter) state.stopFlag = true;
    emit('quarter', row);
  }

// ===== SECTION: MARKET =====
  function initMarket() {
    const M = TUNING.market;
    const genres = {};
    CONTENT.GENRES.forEach(g => { genres[g.id] = Math.round(rnd(0.85, 1.15) * 100) / 100; });
    const topics = {};
    CONTENT.TOPICS.forEach(t => { topics[t.id] = Math.round(rnd(0.94, 1.06) * 100) / 100; });
    const m = { genres: genres, topics: topics, cycle: { id: 'normal', quartersLeft: rint(M.cycles.normal.quarters[0], M.cycles.normal.quarters[1]) }, slate: [] };
    for (let i = 0; i < M.slateWeeks; i++) m.slate.push(slateCount(i));
    return m;
  }
  function seasonOf(week) {
    const wk = dateOf(week).week;
    return CONTENT.SEASONS.find(s => wk >= s.from && wk <= s.to) || CONTENT.SEASONS[0];
  }
  function seasonMult(week) { return TUNING.market.seasonMult[seasonOf(week).id] || 1; }
  function audienceCap() {
    const M = TUNING.market;
    return M.audienceCap * Math.pow(1 + M.audienceGrowth, dateOf().year - TUNING.startYear);
  }
  function cycleMult() { return TUNING.market.cycles[state.market.cycle.id].mult; }
  function genrePop(id) { return state.market.genres[id] || 1; }
  function topicMarket(id) {
    const def = byId(CONTENT.TOPICS, id);
    if (!def) return { id: id, name: id, pop: 1, taste: 1, demand: 1 };
    const pop = state.market.topics && state.market.topics[id] || 1;
    const taste = (def.era && def.era[eraOf(dateOf().year).id]) || 1;
    const demand = Math.round(clamp(pop * taste, TUNING.market.topicEffectMin, TUNING.market.topicEffectMax) * 100) / 100;
    return { id: id, name: def.name, pop: pop, taste: taste, demand: demand };
  }
  function slateCount(offset) {
    const M = TUNING.market, B = TUNING.rivals.backgroundCompetitors;
    const extra = M.seasonCompetitors[seasonOf((state ? state.week : 0) + offset).id] || 0;
    return rint(B[0], B[1]) + (extra ? rint(0, extra) : 0);
  }
  function ownOverlap(p, offset) {
    return state.projects.filter(o => o !== p && o.format === 'feature' && o.stage === 'release' && o.weeksInRelease + offset < TUNING.market.ownOverlapWeeks).length;
  }
  function marketOutlook(p, offset) {
    offset = offset || 0;
    const M = TUNING.market;
    const bg = state.market.slate[offset] || 0;
    const rv = rivalPressure(state.week + offset, p.genre);
    const own = ownOverlap(p, offset);
    const pressure = bg + rv.weight + own;
    const gp = genrePop(p.genre), tz = eraTaste(p.genre), se = seasonMult(state.week + offset), cy = cycleMult();
    const topic = topicMarket(p.topic).demand;
    return { genre: gp, taste: tz, topic: topic, season: se, cycle: cy, competitors: bg + rv.count + own, pressure: Math.round(pressure * 100) / 100, rivals: rv.titles,
      mult: Math.round(gp * tz * topic * se * cy / (1 + M.competitionPenalty * pressure) * 100) / 100 };
  }
  function marketTick() {
    const sl = state.market.slate;
    sl.shift();
    sl.push(slateCount(TUNING.market.slateWeeks - 1));
  }
  function marketQuarter() {
    const M = TUNING.market, mk = state.market;
    Object.keys(mk.genres).forEach(id => {
      const v = mk.genres[id];
      mk.genres[id] = Math.round(clamp(v + rnd(-M.genreDrift, M.genreDrift) + (1 - v) * M.genreRevert, M.genreMin, M.genreMax) * 100) / 100;
    });
    if (!mk.topics) mk.topics = {};
    CONTENT.TOPICS.forEach(t => {
      const v = mk.topics[t.id] == null ? 1 : mk.topics[t.id];
      mk.topics[t.id] = Math.round(clamp(v + rnd(-M.topicDrift, M.topicDrift) + (1 - v) * M.topicRevert, M.topicMin, M.topicMax) * 100) / 100;
    });
    if (Math.random() < M.topicTrendChance) {
      const t = pick(CONTENT.TOPICS), hot = Math.random() < 0.5;
      mk.topics[t.id] = Math.round(clamp(mk.topics[t.id] + (hot ? M.topicTrendSize : -M.topicTrendSize), M.topicMin, M.topicMax) * 100) / 100;
      addLog('Audience interest in ' + t.name.toLowerCase() + ' is ' + (hot ? 'rising' : 'cooling') + '.', 'market');
    }
    if (Math.random() < M.trendChance) {
      const g = pick(CONTENT.GENRES);
      const hot = Math.random() < 0.5;
      mk.genres[g.id] = Math.round(clamp(mk.genres[g.id] + (hot ? M.trendSize : -M.trendSize), M.genreMin, M.genreMax) * 100) / 100;
      addLog(CONTENT.MARKET_TEXT[hot ? 'hot' : 'cold'].replace('{genre}', g.name), 'market');
    }
    if (--mk.cycle.quartersLeft <= 0) {
      const next = mk.cycle.id === 'normal' ? (Math.random() < 0.5 ? 'boom' : 'recession') : 'normal';
      const q = M.cycles[next].quarters;
      mk.cycle = { id: next, quartersLeft: rint(q[0], q[1]) };
      const c = CONTENT.CYCLES[next];
      addLog('Economy: ' + c.name + '. ' + c.blurb, 'economy');
    }
    emit('market', mk);
  }
  function marketInfo() {
    const mk = state.market;
    return {
      genres: CONTENT.GENRES.map(g => ({ id: g.id, name: g.name, pop: mk.genres[g.id], taste: eraTaste(g.id), demand: Math.round(genreDemand(g.id) * 100) / 100 })),
      topics: CONTENT.TOPICS.map(t => topicMarket(t.id)),
      era: { id: eraOf(dateOf().year).id, name: eraOf(dateOf().year).name },
      cycle: { id: mk.cycle.id, name: CONTENT.CYCLES[mk.cycle.id].name, blurb: CONTENT.CYCLES[mk.cycle.id].blurb, mult: cycleMult(), quartersLeft: mk.cycle.quartersLeft },
      season: { name: seasonOf(state.week).name, mult: seasonMult(state.week) },
      audienceCap: Math.round(audienceCap()),
      slate: mk.slate.map((n, i) => {
        const rv = rivalPressure(state.week + i, null, null, true);
        return { week: state.week + i, competitors: n + rv.count, background: n, rivals: rv.titles, season: seasonOf(state.week + i).name, seasonMult: seasonMult(state.week + i) };
      })
    };
  }

// ===== SECTION: RIVALS =====
  function eraScale() { return Math.pow(1 + TUNING.market.audienceGrowth, dateOf().year - TUNING.startYear); }
  function rtx(key, map) { return String(CONTENT.RIVAL_TEXT[key] || key).replace(/\{(\w+)\}/g, (m, k) => (map[k] != null ? map[k] : m)); }
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  function weightedPick(list, w) {
    const tot = list.reduce((a, x) => a + w(x), 0);
    let r = Math.random() * tot;
    for (const x of list) { r -= w(x); if (r < 0) return x; }
    return list[list.length - 1];
  }
  function rivalList() { return state.rivals.list; }
  function activeRivals() { return state.rivals ? state.rivals.list.filter(r => r.status === 'active') : []; }
  function getRival(id) { return byId(state.rivals.list, Number(id)); }
  function rivalName(id) { const r = state.rivals && getRival(id); return r ? r.name : 'a rival studio'; }
  function stratDef(id) { return TUNING.rivals.strategies[id]; }
  function stratName(id) { const s = byId(CONTENT.RIVAL_STRATEGIES, id); return s ? s.name : id; }
  function tierName(i) { return (CONTENT.GROWTH_TIERS[i] || { name: 'tier ' + i }).name; }
  function genreName(id) { const g = byId(CONTENT.GENRES, id); return g ? g.name : id; }
  function rivalBudget(r, tier) {
    return Math.round(TUNING.rivals.tierBudget[tier == null ? r.tier : tier] * stratDef(r.strategy).budgetMult * eraScale() / 1000) * 1000;
  }
  function filmsPerYear(r) { return TUNING.rivals.tierFilms[r.tier] * stratDef(r.strategy).filmsMult; }
  function rivalOverhead(r) { return Math.round(rivalBudget(r) * filmsPerYear(r) * TUNING.rivals.overheadShare / TUNING.weeksPerYear); }
  function rivalTalent(r) { return state.talent.filter(t => isRivalTalent(t) && t.contract.rivalId === r.id); }
  function hottestGenres(n) { return Object.keys(state.market.genres).sort((a, b) => genreDemand(b) - genreDemand(a)).slice(0, n); }

  function initRivals() {
    const R = TUNING.rivals;
    state.rivals = { list: [], nextId: 1, upstartWeek: null, boxOffice: { year: dateOf().year, you: 0, rivals: {}, last: null } };
    const strats = shuffle(Object.keys(R.strategies));
    for (let i = 0; i < R.count; i++) makeRival(strats[i % strats.length], rint(R.startTier[0], R.startTier[1]), true);
  }
  function makeRival(strategy, tier, seed) {
    const R = TUNING.rivals;
    const used = new Set(state.rivals.list.map(r => r.name).concat([state.studio.name]));
    const free = CONTENT.RIVAL_NAMES.filter(n => !used.has(n));
    const id = state.rivals.nextId++;
    const r = { id: id, name: free.length ? pick(free) : 'Studio ' + id, strategy: strategy, baseStrategy: strategy, focus: null, tier: tier, cash: 0,
      fame: clamp(R.tierFame[tier] + rint(-5, 5) - (seed ? 0 : 10), 0, 100), status: 'active', foundedWeek: state.week, closedWeek: null,
      films: [], qResult: 0, results: [], tierWeek: state.week, lossStreak: 0, winStreak: 0, negQuarters: 0, releases: 0, nextFilmId: 1 };
    r.cash = Math.round(rivalBudget(r) * R.startCashBudgets);
    state.rivals.list.push(r);
    if (seed) greenlight(r, rint(4, 30));
    return r;
  }
  function rivalGenre(r) {
    if (r.focus && r.focus.length && Math.random() < TUNING.rivals.focusChance) return pick(r.focus);
    if (r.strategy === 'trend') return pick(hottestGenres(3));
    const s = byId(CONTENT.RIVAL_STRATEGIES, r.strategy);
    return s && s.genres.length ? pick(s.genres) : pick(CONTENT.GENRES).id;
  }
  function greenlight(r, lead) {
    const R = TUNING.rivals, S = stratDef(r.strategy);
    let budget = rivalBudget(r) * rnd(0.7, 1.3);
    if (r.cash < budget) budget *= 0.5;
    budget = Math.round(Math.min(budget, audienceCap() * R.maxBudgetCap) / 1000) * 1000;
    const tq = Math.min(R.talentQualityMax, rivalTalent(r).length * R.talentQuality);
    const genre = rivalGenre(r);
    const f = { id: r.nextFilmId++, title: randomTitle(), genre: genre, budget: budget,
      quality: clamp(Math.round(rnd(S.quality[0], S.quality[1]) + tq + (r.tier - 1) * R.tierQuality + eraQuality(genre)), 1, 100),
      hype: clamp(Math.round(rnd(S.hype[0], S.hype[1]) + r.fame * R.fameHype + (r.tier - 1) * R.tierHype), 0, 100),
      week: 0, stage: 'planned', checked: false, moved: false, opening: 0, gross: 0, revenue: 0, weeksIn: 0, result: null };
    lead = lead || rint(R.leadWeeks[0], R.leadWeeks[1]);
    f.week = bestWeek(r, f, state.week + lead - 2, state.week + lead + 3);
    r.cash -= budget;
    r.films.push(f);
    return f;
  }
  function filmWeight(genre, fGenre, budget) {
    const R = TUNING.rivals;
    return 1 + (genre && fGenre === genre ? R.sameGenreWeight : 0) + (budget >= R.bigBudget * eraScale() ? R.bigFilmWeight : 0);
  }
  function rivalPressure(week, genre, except, openingOnly) {
    const ov = TUNING.market.ownOverlapWeeks;
    let weight = 0, count = 0;
    const titles = [];
    activeRivals().forEach(r => r.films.forEach(f => {
      if (f === except || f.stage === 'done') return;
      let k = 0;
      if (f.week === week) k = 1;
      else if (!openingOnly && f.stage === 'release' && week > f.week && week - f.week < ov) k = 0.5;
      if (!k) return;
      weight += k * filmWeight(genre, f.genre, f.budget);
      count++;
      if (f.week === week) titles.push({ title: f.title, studio: r.name, rivalId: r.id, genre: f.genre, budget: f.budget });
    }));
    return { weight: weight, count: count, titles: titles };
  }
  function plannedRelease(p) { return p.format === 'feature' && p.stage === 'post' && p.flags.dateDone ? state.week + Math.max(0, p.stageWeeksLeft) : null; }
  function playerPressure(week, genre, openingOnly) {
    const ov = TUNING.market.ownOverlapWeeks;
    let w = 0;
    state.projects.forEach(p => {
      if (p.format !== 'feature') return;
      let k = 0;
      if (p.stage === 'release') { if (p.releaseWeek === week) k = 1; else if (!openingOnly && week > p.releaseWeek && week - p.releaseWeek < ov) k = 0.5; }
      else if (plannedRelease(p) === week) k = 1;
      if (k) w += k * filmWeight(genre, p.genre, p.budget);
    });
    return w;
  }
  function weekScore(r, f, w) {
    const R = TUNING.rivals, M = TUNING.market, S = stratDef(r.strategy);
    const off = w - state.week;
    const bg = off < M.slateWeeks ? (state.market.slate[off] || 0) : R.avgBackground;
    const pressure = bg + rivalPressure(w, f.genre, f).weight + playerPressure(w, f.genre);
    return seasonMult(w) * ((S.seasons || []).includes(seasonOf(w).id) ? R.seasonPref : 1) / (1 + M.competitionPenalty * pressure);
  }
  function bestWeek(r, f, from, to) {
    from = Math.max(from, state.week + 2);
    to = Math.max(to, from);
    let best = from, bs = -1;
    for (let w = from; w <= to; w++) { const s = weekScore(r, f, w) * rnd(0.97, 1.03); if (s > bs) { bs = s; best = w; } }
    return best;
  }
  function rivalOpen(r, f) {
    const R = TUNING.rivals, M = TUNING.market;
    const g = byId(CONTENT.GENRES, f.genre) || { audience: 1 };
    const pressure = (state.market.slate[0] || 0) + rivalPressure(state.week, f.genre, f).weight + playerPressure(state.week, f.genre);
    const mult = genreDemand(f.genre) * seasonMult(state.week) * cycleMult() / (1 + M.competitionPenalty * pressure);
    const ref = TUNING.boxOfficeRefBudget;
    const raw = ref * Math.pow(f.budget / ref, TUNING.boxOfficeBudgetExp) * TUNING.boxOfficeBase * R.boxMult * qualityFactor(f.quality) *
      (0.6 + f.hype / 100) * g.audience * luck() * mult * eraMods().boxOffice;
    const cap = audienceCap();
    f.opening = Math.round(cap * (1 - Math.exp(-raw / cap)));
    f.stage = 'release';
    f.weeksIn = 0;
    r.releases++;
    if (playerPressure(state.week, f.genre, true) > 0 || f.budget >= R.bigBudget * eraScale())
      addLog(rtx('opens', { rival: r.name, title: f.title, genre: genreName(f.genre), budget: fmtMoney(f.budget) }), 'rival');
  }
  function rivalRun(r, f) {
    const R = TUNING.rivals;
    f.weeksIn++;
    const decay = legsDecay(f.quality);
    let gross = f.opening * Math.pow(decay, f.weeksIn - 1);
    if (f.weeksIn > 1) gross /= 1 + R.holdPenalty * (rivalPressure(state.week, f.genre, f, true).weight + playerPressure(state.week, f.genre, true));
    gross = Math.round(gross);
    const rev = Math.round(gross * R.share);
    f.gross += gross;
    f.revenue += rev;
    r.cash += rev;
    tallyGross(r.id, gross);
    if (gross < f.opening * 0.05 || f.weeksIn >= TUNING.maxReleaseWeeks) rivalFinish(r, f);
  }
  function rivalFinish(r, f) {
    const R = TUNING.rivals;
    f.stage = 'done';
    const profit = f.revenue - f.budget;
    f.result = profit < 0 ? 'Flop' : (profit >= f.budget ? 'Hit' : 'Profit');
    r.qResult += profit;
    r.fame = clamp(r.fame + (f.result === 'Hit' ? 4 : f.result === 'Profit' ? 1 : -2), 0, 100);
    if (f.result === 'Hit' && f.gross >= R.newsGross * eraScale()) addLog(rtx('hit', { rival: r.name, title: f.title, gross: fmtMoney(f.gross) }), 'rival');
    const done = r.films.filter(x => x.stage === 'done');
    if (done.length > R.keepFilms) r.films.splice(r.films.indexOf(done[0]), 1);
  }
  function rivalsReact(p) {
    const R = TUNING.rivals;
    const myWeek = plannedRelease(p);
    if (myWeek == null) return;
    const mine = p.budget * (1 + state.studio.fame / 100);
    activeRivals().forEach(r => r.films.forEach(f => {
      if (f.stage !== 'planned' || f.moved || Math.abs(f.week - myWeek) > 1 || f.week <= state.week + 1) return;
      const theirs = f.budget * (1 + r.fame / 100);
      if (theirs < mine * R.yieldRatio && (f.genre === p.genre || Math.random() < 0.5)) {
        f.week = bestWeek(r, f, myWeek + 2, myWeek + 2 + R.rescheduleRange);
        f.moved = true;
        addLog(rtx('moved', { rival: r.name, title: f.title, mine: p.title }), 'rival');
      } else if (f.genre === p.genre) {
        addLog(rtx('holds', { rival: r.name, title: f.title, genre: genreName(f.genre), mine: p.title }), 'rival');
      }
    }));
  }
  function rivalTick() {
    const R = TUNING.rivals;
    activeRivals().forEach(r => {
      const oh = rivalOverhead(r);
      r.cash -= oh;
      r.qResult -= oh;
      r.films.slice().forEach(f => {
        if (f.stage === 'planned') {
          if (f.week <= state.week) rivalOpen(r, f);
          else if (!f.checked && f.week - state.week < TUNING.market.slateWeeks) {
            f.checked = true;
            const nw = bestWeek(r, f, f.week - R.rescheduleRange, f.week + R.rescheduleRange);
            if (nw !== f.week && weekScore(r, f, nw) > weekScore(r, f, f.week) * R.moveGain) { f.week = nw; f.moved = true; }
          }
        }
        if (f.stage === 'release') rivalRun(r, f);
      });
      const planned = r.films.filter(f => f.stage === 'planned').length;
      if (planned < R.maxPlanned && r.cash > 0 && Math.random() < filmsPerYear(r) / TUNING.weeksPerYear) greenlight(r);
    });
    state.talent.forEach(t => { if (isRivalTalent(t) && t.contract.endWeek <= state.week) t.contract = null; });
    if (state.rivals.upstartWeek != null && state.week >= state.rivals.upstartWeek) { state.rivals.upstartWeek = null; upstart(); }
  }
  function rivalQuarter() {
    const R = TUNING.rivals;
    activeRivals().forEach(r => {
      const res = Math.round(r.qResult);
      r.qResult = 0;
      r.results.push(res);
      if (r.results.length > 4) r.results.shift();
      const trailing = r.results.reduce((a, b) => a + b, 0);
      const losing = r.results.length >= 4 && trailing < 0;
      if (losing) { r.lossStreak++; r.winStreak = 0; } else { r.winStreak++; r.lossStreak = 0; }
      if (losing) {
        r.focus = hottestGenres(2);
        if (r.lossStreak >= R.lossSwitchQuarters && r.strategy !== 'trend') {
          const old = r.strategy;
          r.strategy = 'trend';
          addLog(rtx('switchTrend', { rival: r.name, old: stratName(old) }), 'rival');
          emit('rival', r);
        }
      } else if (r.strategy !== 'trend') r.focus = null;
      if (r.strategy === 'trend' && r.baseStrategy !== 'trend' && r.winStreak >= R.trendRevertQuarters) {
        r.strategy = r.baseStrategy;
        r.focus = null;
        addLog(rtx('revert', { rival: r.name, new: stratName(r.strategy) }), 'rival');
        emit('rival', r);
      }
      const steady = state.week - (r.tierWeek || r.foundedWeek) >= R.tierCooldownWeeks;
      if (r.cash < 0 && losing) {
        r.negQuarters++;
        if (r.tier > 1 && steady) {
          r.cash += Math.round(rivalBudget(r) * R.shrinkSell);
          r.tier--;
          r.tierWeek = state.week;
          r.fame = clamp(r.fame - 3, 0, 100);
          addLog(rtx('shrink', { rival: r.name, tier: tierName(r.tier) }), 'rival');
          emit('rival', r);
        }
        if (r.cash < 0 && r.negQuarters >= R.bankruptQuarters && (r.tier <= 1 || r.negQuarters >= R.bankruptQuarters * 2)) rivalBankrupt(r);
      } else {
        r.negQuarters = 0;
        if (r.tier < 4 && steady && r.results.length >= 4 && trailing > 0) {
          const nb = rivalBudget(r, r.tier + 1);
          if (r.cash >= nb * R.growCashBudgets) {
            r.cash -= Math.round(nb * R.growCost);
            r.tier++;
            r.tierWeek = state.week;
            r.fame = clamp(r.fame + 3, 0, 100);
            addLog(rtx('grow', { rival: r.name, tier: tierName(r.tier) }), 'rival');
            emit('rival', r);
          }
        }
      }
    });
  }
  function rivalBankrupt(r) {
    const R = TUNING.rivals;
    r.status = 'bankrupt';
    r.closedWeek = state.week;
    r.films = r.films.filter(f => f.stage === 'done');
    state.talent.forEach(t => { if (isRivalTalent(t) && t.contract.rivalId === r.id) t.contract = null; });
    addLog(rtx('bankrupt', { rival: r.name }), 'rival');
    state.stopFlag = true;
    emit('rival', r);
    if (state.rivals.upstartWeek == null) state.rivals.upstartWeek = state.week + rint(R.upstartDelay[0], R.upstartDelay[1]);
    const closed = state.rivals.list.filter(x => x.status === 'bankrupt');
    while (closed.length > R.keepClosed) { const x = closed.shift(); state.rivals.list.splice(state.rivals.list.indexOf(x), 1); }
  }
  function upstart() {
    const R = TUNING.rivals;
    if (activeRivals().length >= R.maxCount) return;
    const r = makeRival(pick(Object.keys(R.strategies)), 1, false);
    addLog(rtx('upstart', { rival: r.name, new: stratName(r.strategy) }), 'rival');
    emit('rival', r);
    if (activeRivals().length < R.count) state.rivals.upstartWeek = state.week + rint(R.upstartDelay[0], R.upstartDelay[1]);
  }
  function rivalYear() {
    const R = TUNING.rivals, bo = state.rivals.boxOffice;
    bo.last = { year: bo.year, you: bo.you, rivals: bo.rivals };
    bo.year = dateOf().year;
    bo.you = 0;
    bo.rivals = {};
    if (activeRivals().length < R.maxCount && state.rivals.upstartWeek == null && Math.random() < R.upstartYearChance)
      state.rivals.upstartWeek = state.week + rint(R.upstartDelay[0], R.upstartDelay[1]);
  }
  function tallyGross(key, gross) {
    const bo = state.rivals.boxOffice;
    if (key === 'you') bo.you += gross; else bo.rivals[key] = (bo.rivals[key] || 0) + gross;
  }
  function audienceShare(last) {
    const bo = last ? state.rivals.boxOffice.last : state.rivals.boxOffice;
    if (!bo) return [];
    const rows = [{ id: 'you', name: state.studio.name, gross: bo.you }];
    Object.keys(bo.rivals).forEach(id => rows.push({ id: Number(id), name: rivalName(id), gross: bo.rivals[id] }));
    const tot = rows.reduce((a, x) => a + x.gross, 0);
    rows.forEach(x => { x.share = tot ? Math.round(x.gross / tot * 1000) / 10 : 0; });
    return rows.sort((a, b) => b.gross - a.gross);
  }
  function rivalInfo(id) {
    const r = getRival(id);
    if (!r) return null;
    return Object.assign({}, r, { strategyName: stratName(r.strategy), baseStrategyName: stratName(r.baseStrategy), tierName: tierName(r.tier),
      overhead: rivalOverhead(r), typicalBudget: rivalBudget(r), talent: rivalTalent(r).map(t => ({ id: t.id, name: t.name, role: t.role })),
      focusNames: (r.focus || []).map(genreName) });
  }

  function talentMorale(t) { return isRoster(t) ? Math.round(t.contract.morale == null ? TUNING.rivals.morale.start : t.contract.morale) : null; }
  function moraleTick() {
    const M = TUNING.rivals.morale;
    roster().forEach(t => {
      const c = t.contract;
      if (c.morale == null) c.morale = M.start;
      c.idle = talentProject(t) ? 0 : (c.idle || 0) + 1;
      const underpay = Math.max(0, salaryOf(t) / Math.max(1, c.salary) - 1);
      const idle = clamp(c.idle - M.idleWeeks, 0, M.idleMax);
      const reputationLoyalty = Math.min(10, (state.studio.prestige || 0) * 0.07 + state.studio.fame * 0.03);
      const target = clamp(M.start - underpay * M.underpayWeight - idle + reputationLoyalty + ((t.traits || []).includes('loyal') ? M.loyalBonus : 0), 0, 100);
      c.morale = clamp(Math.round((c.morale + (target - c.morale) * M.rate) * 10) / 10, 0, 100);
    });
  }
  function stayChance(t, mult) {
    const P = TUNING.rivals.poach, tr = t.traits || [];
    if (mult > 1) return P.bigCounterChance;
    return clamp(P.counterBase + (talentMorale(t) - 50) * P.counterMoraleWeight + (tr.includes('loyal') ? P.loyalBonus : 0) - (tr.includes('ambitious') ? P.ambitiousPenalty : 0), 0.1, 0.95);
  }
  function counterTerms(offer, mult) { const salary = Math.round(offer * mult); return { salary: salary, bonus: salary * TUNING.contracts.signingWeeks }; }
  function poachTick() {
    const P = TUNING.rivals.poach;
    if (!activeRivals().length) return;
    roster().forEach(t => {
      const c = t.contract;
      if (c.offerWeek != null && state.week - c.offerWeek < P.cooldownWeeks) return;
      const expiring = isExpiring(t), unhappy = talentMorale(t) < P.moraleBelow;
      if (!expiring && !unhappy) return;
      const chance = ((expiring ? P.expiringChance : 0) + (unhappy ? P.moraleChance : 0)) * (0.5 + t.fame / 100);
      if (Math.random() >= chance * (1 - Math.min(0.22, (state.studio.prestige || 0) * 0.0022))) return;
      const offer = Math.round(salaryOf(t) * rnd(P.offerMin, P.offerMax));
      const bidders = activeRivals().filter(r => r.cash > offer * TUNING.weeksPerYear);
      if (!bidders.length) return;
      c.offerWeek = state.week;
      raisePoach(t, weightedPick(bidders, x => 1 + x.tier + x.fame / 20), offer, expiring);
    });
  }
  function raisePoach(t, r, offer, expiring) {
    const P = TUNING.rivals.poach;
    const years = rint(P.years[0], P.years[1]);
    const m = counterTerms(offer, 1), b = counterTerms(offer, P.bigCounterMult);
    const text = rtx('poach', { rival: r.name, name: t.name, salary: fmtMoney(offer), years: years, why: rtx(expiring ? 'whyExpiring' : 'whyUnhappy', {}) }) +
      ' (Now ' + fmtMoney(t.contract.salary) + '/week, morale ' + talentMorale(t) + '.)';
    raiseStudio('poach_' + t.id, text, [
      { label: 'Match it · ' + fmtMoney(m.salary) + '/wk for ' + P.counterYears + ' yrs + ' + fmtMoney(m.bonus) + ' bonus · ' + Math.round(stayChance(t, 1) * 100) + '% they stay', effects: { counter: 1 } },
      { label: 'Beat it · ' + fmtMoney(b.salary) + '/wk for ' + P.counterYears + ' yrs + ' + fmtMoney(b.bonus) + ' bonus · ' + Math.round(P.bigCounterChance * 100) + '% they stay', effects: { counter: P.bigCounterMult } },
      { label: 'Let ' + t.name + ' go', effects: { leave: true } }
    ], { scope: 'poach', talentId: t.id, rivalId: r.id, offer: offer, years: years });
    emit('poach', { talentId: t.id, rivalId: r.id });
  }
  function resolvePoach(pd, e) {
    const P = TUNING.rivals.poach, t = getTalent(pd.talentId), r = getRival(pd.rivalId);
    if (!t || !isRoster(t)) { if (t) addLog(rtx('gone', { name: t.name }), 'rival'); return; }
    if (!r || r.status !== 'active') { addLog(rtx('withdrawn', { rival: r ? r.name : 'The rival', name: t.name }), 'rival'); return; }
    if (e.counter) {
      const k = counterTerms(pd.offer, e.counter);
      if (state.cash < k.bonus) { addLog(rtx('cantPay', { name: t.name, rival: r.name }), 'rival'); joinRival(t, r, pd.years); return; }
      if (Math.random() < stayChance(t, e.counter)) {
        const c = t.contract;
        state.cash -= k.bonus;
        c.salary = k.salary;
        c.endWeek = Math.max(c.endWeek, state.week + P.counterYears * TUNING.weeksPerYear);
        c.warned = false;
        c.morale = clamp(c.morale + TUNING.rivals.morale.counterBoost, 0, 100);
        addLog(rtx('stays', { name: t.name, rival: r.name, salary: fmtMoney(k.salary) }), 'contract');
        emit('contract', t);
      } else {
        addLog(rtx('refused', { name: t.name, rival: r.name }), 'rival');
        joinRival(t, r, pd.years);
      }
    } else joinRival(t, r, pd.years);
  }
  function joinRival(t, r, years) {
    const p = talentProject(t);
    t.contract = { type: 'rival', rivalId: r.id, endWeek: state.week + years * TUNING.weeksPerYear };
    r.fame = clamp(r.fame + 1, 0, 100);
    addLog(rtx(p ? 'leavesAfter' : 'leaves', { name: t.name, rival: r.name, title: p ? p.title : '' }), 'rival');
    emit('contract', t);
  }

// ===== SECTION: TV =====
  function activeSeries() { return state.series.filter(s => s.status !== 'ended'); }
  function tvSlotsUsed() { return activeSeries().length + activeProjects().filter(p => p.format === 'pilot').length; }
  function getSeries(id) { return byId(state.series, Number(id)); }
  function pilotScore(p) { return p.quality * 0.7 + p.hype * 0.2 + (genreDemand(p.genre) - 1) * 30; }
  function pilotResult(p) {
    const T = TUNING.tv, em = eraMods();
    const score = pilotScore(p);
    const topicLift = (topicMarket(p.topic).demand - 1) * 0.22;
    const chance = clamp((score - T.pickupMin) / T.pickupRange + em.pickup + topicLift, T.pickupFloor, T.pickupCeil);
    p.stage = 'done';
    if (Math.random() < chance) {
      const epCost = Math.round(p.budget * T.episodeCostShare);
      const fee = Math.round(epCost * (T.feeBase + score / T.feeScore) * em.tvFee);
      const pilotFee = Math.round(p.budget * T.pilotFeeShare);
      p.result = 'Picked up';
      p.revenue += pilotFee;
      earn(pilotFee);
      const s = { id: state.nextSeriesId++, projectId: p.id, title: p.title, genre: p.genre, topic: p.topic, season: 1, episodes: rint(T.episodes[0], T.episodes[1]), aired: 0,
        epCost: epCost, fee: fee, quality: p.quality, hype: p.hype, ratings: [], seasonAvgs: [], status: 'airing', hiatusLeft: 0, revenue: pilotFee, cost: 0 };
      state.series.push(s);
      state.studio.fame = clamp(state.studio.fame + 2, 0, 100);
      addLog('The network picked up "' + p.title + '": ' + s.episodes + ' episodes at ' + fmtMoney(fee) + ' each (cost ' + fmtMoney(epCost) + '). Pilot fee ' + fmtMoney(pilotFee) + '.', 'tv');
    } else {
      const devFee = Math.round(p.budget * T.passFeeShare);
      p.result = 'Passed';
      p.revenue += devFee;
      earn(devFee);
      addLog('The networks passed on "' + p.title + '" (development fee ' + fmtMoney(devFee) + ').', 'tv');
    }
    emit('tv', p);
  }
  function tvTick() {
    const T = TUNING.tv;
    let revenue = 0, cost = 0;
    state.series.forEach(s => {
      if (s.status === 'hiatus') {
        if (--s.hiatusLeft <= 0) { s.status = 'airing'; addLog('Season ' + s.season + ' of "' + s.title + '" premieres.', 'tv'); }
        return;
      }
      if (s.status !== 'airing') return;
      const base = (s.quality * T.ratingQuality + s.hype * T.ratingHype) * genreDemand(s.genre) * topicMarket(s.topic).demand * Math.pow(T.seasonFatigue, s.season - 1);
      const prev = s.ratings.length ? s.ratings[s.ratings.length - 1] : base;
      const r = clamp(Math.round((prev * 0.6 + base * 0.4) * rnd(0.9, 1.1) * 10) / 10, 0.5, 30);
      s.ratings.push(r);
      s.aired++;
      const bonus = r > T.bonusThreshold ? Math.round((r - T.bonusThreshold) * s.epCost * T.bonusPerPoint) : 0;
      revenue += s.fee + bonus;
      cost += s.epCost;
      s.revenue += s.fee + bonus;
      s.cost += s.epCost;
      const p = getProject(s.projectId);
      if (p) { p.revenue += s.fee + bonus; p.spent += s.epCost; }
      if (s.aired >= s.episodes) endSeason(s);
    });
    return { revenue: revenue, cost: cost };
  }
  function endSeason(s) {
    const T = TUNING.tv;
    const avg = Math.round(s.ratings.reduce((a, r) => a + r, 0) / s.ratings.length * 10) / 10;
    s.seasonAvgs.push(avg);
    s.lastRatings = s.ratings;
    s.ratings = [];
    const renew = s.season < T.maxSeasons && (avg >= T.renewAvg || Math.random() < T.renewLuck);
    if (!renew) {
      s.status = 'ended';
      const fame = s.season >= 3 ? 2 : 0;
      state.studio.fame = clamp(state.studio.fame + fame, 0, 100);
      addLog('"' + s.title + '" ends after ' + s.season + ' season' + (s.season > 1 ? 's' : '') + ' (season average ' + avg + ').', 'tv');
    } else {
      s.season++;
      s.aired = 0;
      s.episodes = rint(T.episodes[0], T.episodes[1]);
      s.fee = Math.round(s.fee * (1 + T.renewFeeRaise));
      s.epCost = Math.round(s.epCost * (1 + T.renewCostRaise));
      s.quality = clamp(s.quality - T.qualityDecay, 1, 100);
      s.hype = clamp(Math.round(avg * 6), 0, 100);
      s.status = 'hiatus';
      s.hiatusLeft = T.hiatusWeeks;
      state.studio.fame = clamp(state.studio.fame + 1, 0, 100);
      addLog('"' + s.title + '" is renewed for season ' + s.season + ' (season average ' + avg + ', new fee ' + fmtMoney(s.fee) + '/episode).', 'tv');
    }
    state.stopFlag = true;
    emit('tv', s);
  }

// ===== SECTION: WINDOWS =====
  function windowName(id) { const w = CONTENT.REVENUE_WINDOWS.find(x => x.id === id); return w ? w.name : id; }
  function openWindows(p) {
    const y = dateOf().year, em = eraMods();
    p.windows = CONTENT.REVENUE_WINDOWS.filter(w => y >= w.start && (!w.end || y < w.end) && TUNING.windows[w.id]).map(w => {
      const t = TUNING.windows[w.id];
      return { id: w.id, from: state.week + t.delay, weeks: t.weeks, total: Math.round(p.gross * t.share * (0.5 + p.quality / 100) * (em.windows[w.id] || 1)), paid: 0 };
    });
  }
  function windowsTick() {
    let rev = 0;
    state.projects.forEach(p => (p.windows || []).forEach(w => {
      if (state.week < w.from || w.paid >= w.total) return;
      const left = w.total - w.paid;
      const amt = state.week - w.from >= w.weeks - 1 ? left : Math.min(left, Math.round(w.total / w.weeks));
      w.paid += amt;
      p.revenue += amt;
      rev += amt;
    }));
    return rev;
  }

// ===== SECTION: GROWTH =====
  function growthTier(i) { return TUNING.growth[i == null ? state.studio.tier : i]; }
  function upgradeQuote() {
    if (!state) return { ok: false, reason: 'No game running.' };
    const nxt = state.studio.tier + 1;
    const g = TUNING.growth[nxt];
    if (!g) return { ok: false, reason: 'You are at the top tier.', top: true };
    const name = (CONTENT.GROWTH_TIERS[nxt] || {}).name || 'tier ' + nxt;
    let reason = null;
    if (state.gameOver) reason = 'The studio is bankrupt.';
    else if (state.studio.fame < g.fame) reason = name + ' needs studio fame ' + g.fame + '.';
    else if (state.studio.releases < g.releases) reason = name + ' needs ' + g.releases + ' releases.';
    else if (state.cash < g.cost) reason = name + ' costs ' + fmtMoney(g.cost) + '.';
    return { ok: !reason, reason: reason, tier: nxt, name: name, cost: g.cost, fame: g.fame, releases: g.releases, next: g };
  }
  function upgradeTier() {
    const q = upgradeQuote();
    if (!q.ok) return q;
    state.cash -= q.cost;
    state.studio.tier = q.tier;
    addLog(state.studio.name + ' grows into a ' + q.name + ' (' + fmtMoney(q.cost) + '). ' + (CONTENT.GROWTH_TIERS[q.tier] || {}).desc, 'studio');
    save();
    emit('tier', q);
    return { ok: true };
  }

// ===== SECTION: STAFF =====
  function initStaff() {
    const d = {};
    CONTENT.STAFF_DEPTS.forEach(x => { d[x.id] = { heads: 0, skill: TUNING.staff.startSkill, payLevel: 1, morale: 60, strikeWeeks: 0, grievance: 0 }; });
    return { depts: d };
  }
  function dept(id) { return state.staff.depts[id]; }
  function deptName(id) { const d = CONTENT.STAFF_DEPTS.find(x => x.id === id); return d ? d.name : id; }
  function deptPower(id) {
    const d = dept(id);
    if (!d || !d.heads || d.strikeWeeks > 0) return 0;
    return d.heads * d.skill / 50 * (0.5 + d.morale / 100);
  }
  function deptBonus(id) { return (TUNING.staff.effect[id] || 0) * Math.sqrt(deptPower(id)); }
  function deptPay(d) { return Math.round(TUNING.economy.staffPay * d.payLevel); }
  function deptPayroll() { return Object.keys(state.staff.depts).reduce((a, id) => a + dept(id).heads * deptPay(dept(id)), 0); }
  function staffInfo() {
    return CONTENT.STAFF_DEPTS.map(x => {
      const d = dept(x.id);
      return { id: x.id, name: x.name, desc: x.desc, heads: d.heads, max: growthTier().deptMax, skill: Math.round(d.skill), morale: Math.round(d.morale),
        payLevel: d.payLevel, pay: deptPay(d), payroll: d.heads * deptPay(d), strikeWeeks: d.strikeWeeks, bonus: Math.round(deptBonus(x.id) * 100) / 100,
        costs: staffCosts(x.id), recruitSkill: nextHireSkill(x.id) };
    });
  }
  function nextHireSkill(id) {
    const r = state.studio;
    const d = dept(id);
    const boost = r.fame * 0.11 + r.criticsRep * 0.1 + (r.prestige || 0) * 0.1 + (d.payLevel - 1) * 10;
    return clamp(Math.round(TUNING.staff.newHireSkill + boost), TUNING.staff.newHireSkill, TUNING.staff.highRepHireSkillMax);
  }
  function staffCosts(id) {
    const S = TUNING.staff, d = dept(id), pay = deptPay(d);
    return { hire: pay * S.hireWeeks, fire: pay * S.severanceWeeks, train: d.heads * pay * S.trainWeeks };
  }
  function staffAction(id, action) {
    const S = TUNING.staff, d = dept(id);
    if (!state || state.gameOver) return { ok: false, reason: 'No game running.' };
    if (!d) return { ok: false, reason: 'Unknown department.' };
    const c = staffCosts(id), name = deptName(id);
    if (action === 'hire') {
      if (d.heads >= growthTier().deptMax) return { ok: false, reason: growthTier().deptMax ? name + ' is at the cap for this tier (' + growthTier().deptMax + ').' : 'Departments open at the Indie tier.' };
      if (state.cash < c.hire) return { ok: false, reason: 'Hiring costs ' + fmtMoney(c.hire) + '.' };
      state.cash -= c.hire;
      const recruitedSkill = nextHireSkill(id);
      d.skill = (d.skill * d.heads + recruitedSkill) / (d.heads + 1);
      d.heads++;
      addLog('Hired a new ' + name + ' staffer (skill ' + recruitedSkill + ', ' + d.heads + ' now).', 'staff');
    } else if (action === 'fire') {
      if (!d.heads) return { ok: false, reason: 'No one to let go.' };
      if (state.cash < c.fire) return { ok: false, reason: 'Severance is ' + fmtMoney(c.fire) + '.' };
      state.cash -= c.fire;
      d.heads--;
      d.morale = clamp(d.morale - S.layoffMorale, 0, 100);
      d.grievance += S.layoffMorale;
      addLog('Laid off one ' + name + ' staffer. Severance ' + fmtMoney(c.fire) + '.', 'staff');
    } else if (action === 'raise') {
      if (d.payLevel >= S.payMax - 1e-9) return { ok: false, reason: 'Pay is already at the maximum.' };
      d.payLevel = Math.round((d.payLevel + S.payStep) * 100) / 100;
      d.morale = clamp(d.morale + S.raiseMorale, 0, 100);
      addLog('Raised pay in ' + name + ' to ' + Math.round(d.payLevel * 100) + '% of market.', 'staff');
    } else if (action === 'cut') {
      if (d.payLevel <= S.payMin + 1e-9) return { ok: false, reason: 'Pay is already at the minimum.' };
      d.payLevel = Math.round((d.payLevel - S.payStep) * 100) / 100;
      d.morale = clamp(d.morale - S.raiseMorale, 0, 100);
      d.grievance += S.raiseMorale / 2;
      addLog('Cut pay in ' + name + ' to ' + Math.round(d.payLevel * 100) + '% of market.', 'staff');
    } else if (action === 'train') {
      if (!d.heads) return { ok: false, reason: 'No staff to train.' };
      if (d.skill >= S.maxSkill) return { ok: false, reason: name + ' is fully trained.' };
      if (state.cash < c.train) return { ok: false, reason: 'Training costs ' + fmtMoney(c.train) + '.' };
      state.cash -= c.train;
      d.skill = Math.min(S.maxSkill, d.skill + S.trainGain);
      d.morale = clamp(d.morale + 3, 0, 100);
      addLog('Trained the ' + name + ' department (skill ' + Math.round(d.skill) + ').', 'staff');
    } else return { ok: false, reason: 'Unknown action.' };
    save();
    emit('staff', id);
    return { ok: true };
  }
  function staffTick() {
    const S = TUNING.staff;
    Object.keys(state.staff.depts).forEach(id => {
      const d = dept(id);
      if (!d.heads) return;
      const target = clamp(55 + (d.payLevel - 1) * 90 - d.grievance, 0, 100);
      d.morale = clamp(Math.round((d.morale + (target - d.morale) * S.moraleRate) * 10) / 10, 0, 100);
      d.grievance = Math.max(0, d.grievance - 0.5);
      if (d.strikeWeeks > 0) {
        if (--d.strikeWeeks === 0) addLog(deptName(id) + ' is back at work.', 'staff');
      } else if (d.morale < S.strikeMorale && Math.random() < S.strikeChance) {
        const ev = CONTENT.STRIKE_EVENT, n = deptName(id);
        raiseStudio('strike_' + id, ev.text.replace(/\{dept\}/g, n),
          ev.choices.map(c => ({ label: c.label, effects: c.effects, result: c.result.replace(/\{dept\}/g, n) })), { scope: 'staff', dept: id });
      }
    });
  }
  function applyStaffEffects(id, e) {
    const S = TUNING.staff, d = dept(id);
    if (!d) return;
    if (e.pay) d.payLevel = Math.round(clamp(d.payLevel + e.pay, S.payMin, S.payMax) * 100) / 100;
    if (e.fire) d.heads = Math.max(0, d.heads - Math.ceil(d.heads * e.fire));
    if (e.strike) {
      d.strikeWeeks = e.strike;
      if (id === 'production') activeProjects().forEach(p => { p.stageWeeksLeft++; });
    }
    if (e.morale) d.morale = clamp(d.morale + e.morale, 0, 100);
    if (e.pay || e.fire) d.grievance = 0;
    if (e.fame) state.studio.fame = clamp(state.studio.fame + e.fame, 0, 100);
  }

// ===== SECTION: AWARDS =====
  // All formats use the same six-tier festival circuit. Merit drives tier selection;
  // reputation gives only a small edge, and studio size never bars entry.
  function festivalMerit(p) {
    return p.quality * 0.52 + p.critic * 0.48 + Math.min(3, (state.studio.prestige || 0) * 0.04);
  }
  function festivalPlan(p) {
    const max = p.format === 'short' ? TUNING.awards.festivalMaxShortEntries : TUNING.awards.festivalMaxEntries;
    const merit = festivalMerit(p);
    const eligible = CONTENT.AWARDS.circuit.filter(f => merit + 9 >= f.entryScore);
    // A merit-based shortlist. Excellent films can reach World from a Solo studio.
    const ranked = eligible.map(f => ({ f: f, score: Math.random() * 18 - Math.abs(merit - (f.entryScore + 8)) * 0.45 + f.tier * 1.5 }));
    ranked.sort((a, b) => b.score - a.score);
    return ranked.slice(0, max).map(x => x.f.id);
  }
  function festivalDefinition(id) { return CONTENT.AWARDS.circuit.find(f => f.id === id); }
  function atx(key, map) { return String(CONTENT.AWARD_TEXT[key]).replace(/\{(\w+)\}/g, (m, k) => (map[k] != null ? map[k] : m)); }
  function ceremonyWeekOf(year) { return (year - TUNING.startYear) * TUNING.weeksPerYear + TUNING.awards.ceremonyWeek - 1; }
  function awardYearOf(p) { return dateOf(p.releaseWeek).year + 1; }
  function awardEligible(p) {
    return p.format === 'feature' && p.releaseWeek != null && !p.awardsJudged && state.week < ceremonyWeekOf(awardYearOf(p));
  }
  function campaignPoints(p) { return p.campaign ? TUNING.awards.campaigns[p.campaign.level].points : 0; }
  function awardScore(p) {
    return p.quality * 0.55 + (p.critic == null ? p.quality : p.critic) * 0.35 + (p.hype || 0) * 0.1 + (p.buzz || 0) + campaignPoints(p);
  }
  function campaignQuote(id, level) {
    const p = getProject(id), C = TUNING.awards.campaigns[level];
    if (!state || state.gameOver) return { ok: false, reason: 'No game running.' };
    if (!p || !C) return { ok: false, reason: 'Unknown film or campaign.' };
    const cur = p.campaign || { level: 0, spent: 0 };
    const cost = level > 0 ? Math.max(500, Math.round(p.budget * C.share)) : 0;
    const pay = Math.max(0, cost - cur.spent);
    let reason = null;
    if (!awardEligible(p)) reason = 'Only features waiting for this year\'s ceremony can campaign.';
    else if (level <= cur.level) reason = level === cur.level ? 'Already running.' : 'A bigger campaign is already running.';
    else if (state.cash < pay) reason = 'Costs ' + fmtMoney(pay) + '.';
    return { ok: !reason, reason: reason, level: level, cost: cost, pay: pay, points: C.points };
  }
  function awardCampaign(id, level) {
    const q = campaignQuote(id, level);
    if (!q.ok) return q;
    const p = getProject(id);
    state.cash -= q.pay;
    p.campaign = { level: level, spent: q.cost };
    addLog('Awards campaign for "' + p.title + '": ' + CONTENT.AWARDS.campaigns[level].name + ' (' + fmtMoney(q.pay) + ').', 'award');
    save();
    emit('awards', p);
    return { ok: true };
  }
  function giveTalentAward(t, won) {
    const A = TUNING.awards;
    t.awards = t.awards || { noms: 0, wins: 0 };
    if (won) { t.awards.wins++; t.fame = clamp(t.fame + A.talentWinFame, 0, 100); t.skill = clamp(t.skill + A.talentWinSkill, 0, 100); }
    else { t.awards.noms++; t.fame = clamp(t.fame + A.talentNomFame, 0, 100); }
  }
  function festivalTick() {
    const A = TUNING.awards, wk = dateOf().week;
    CONTENT.AWARDS.circuit.filter(f => f.week === wk).forEach(f => state.projects.forEach(p => {
      if (p.format !== 'feature' || p.releaseWeek == null || p.critic == null || p.releaseWeek > state.week) return;
      if (state.week - p.releaseWeek > A.festWindow) return;
      p.festivals = p.festivals || [];
      // v8 saves have no plan: assign it lazily for post-migration films.
      p.festivalPlan = p.festivalPlan || festivalPlan(p);
      if (!p.festivalPlan.includes(f.id) || p.festivals.includes(f.id)) return;
      p.festivals.push(f.id);
      p.festResults = p.festResults || [];
      const score = festivalMerit(p) + (p.buzz || 0) * 0.25 + rnd(-11, 11);
      const map = { title: p.title, festival: f.name, prize: f.prize };
      if (score >= f.winner) {
        p.buzz = Math.min(A.buzzMax, (p.buzz || 0) + A.prizeBuzz);
        gainStudioFame(A.prizeFame + Math.floor(f.tier / 3));
        state.studio.prestige = clamp((state.studio.prestige || 0) + Math.ceil(f.tier / 2), 0, 100);
        castTalent(p).forEach(t => { t.fame = clamp(t.fame + A.prizeTalentFame, 0, 100); });
        p.festResults.push({ festival: f.name, tier: f.level, result: f.prize });
        addLog(atx('festPrize', map) + ' (' + f.level + ' tier)', 'award');
      } else if (score >= f.selection) {
        p.buzz = Math.min(A.buzzMax, (p.buzz || 0) + A.selectBuzz);
        gainStudioFame(A.selectFame);
        p.festResults.push({ festival: f.name, tier: f.level, result: 'Official selection' });
        addLog(atx('festSelected', map) + ' (' + f.level + ' tier)', 'award');
      } else {
        addLog('"' + p.title + '" was not selected at the ' + f.level + '-tier ' + f.name + '.', 'award');
      }
    }));
  }
  function snapshotPool() {
    const y = dateOf().year - 1, lo = (y - TUNING.startYear) * TUNING.weeksPerYear, hi = lo + TUNING.weeksPerYear;
    state.awards.pool = [];
    rivalList().forEach(r => r.films.forEach(f => {
      if (f.stage === 'planned' || f.week < lo || f.week >= hi) return;
      state.awards.pool.push({ title: f.title, studio: r.name, rivalId: r.id, genre: f.genre, quality: f.quality, critic: clamp(f.quality + rint(-10, 10), 1, 100), tier: r.tier, strategy: r.strategy });
    }));
  }
  function runCeremony() {
    const A = TUNING.awards, def = CONTENT.AWARDS, year = dateOf().year, covered = year - 1;
    if (covered < TUNING.startYear) return;
    const lo = (covered - TUNING.startYear) * TUNING.weeksPerYear, hi = lo + TUNING.weeksPerYear;
    const mine = state.projects.filter(p => p.format === 'feature' && p.releaseWeek != null && !p.awardsJudged && p.releaseWeek >= lo && p.releaseWeek < hi);
    mine.forEach(p => { p.awardsJudged = true; p.awards = p.awards || []; });
    state.studio.prestige = Math.round((state.studio.prestige || 0) * A.prestigeDecay * 10) / 10;
    const entries = state.awards.pool.map(x => ({ title: x.title, studio: x.studio, rivalId: x.rivalId, projectId: null, p: null, tier: x.tier, base: x.quality * 0.9 + 4 + (x.tier - 1) + A.rivalBoost + (x.strategy === 'prestige' ? A.prestigeRivalBoost : 0) }))
      .concat(mine.map(p => ({ title: p.title, studio: state.studio.name, rivalId: null, projectId: p.id, p: p, tier: 0, base: awardScore(p) })));
    state.awards.pool = [];
    if (entries.length < 3) return;
    const rec = { year: year, covered: covered, name: def.ceremony, cats: [] };
    const nomCount = {}, fameGain = {};
    const map0 = { ceremony: def.ceremony, year: year };
    def.categories.forEach(cat => {
      const scored = entries.map(e => {
        let s = e.base;
        if (cat.slot) s += e.p ? (slotSkill(e.p, cat.slot) - 50) * A.slotWeight : (e.tier - 2) * 2;
        return { e: e, s: s + rnd(-A.noise, A.noise) };
      }).filter(x => !x.e.p || x.s >= A.minScore).sort((a, b) => b.s - a.s);
      const per = {}, noms = [];
      scored.forEach(x => { if (noms.length < A.nominees && (per[x.e.studio] || 0) < A.maxPerStudio) { per[x.e.studio] = (per[x.e.studio] || 0) + 1; noms.push(x); } });
      if (noms.length < 2) return;
      const order = noms.map(x => ({ x: x, s: x.s + rnd(-A.winNoise, A.winNoise) })).sort((a, b) => b.s - a.s);
      const winner = order[0].x;
      rec.cats.push({ id: cat.id, name: cat.name, nominees: order.map(o => ({ title: o.x.e.title, studio: o.x.e.studio, rivalId: o.x.e.rivalId, projectId: o.x.e.projectId, winner: o.x === winner })) });
      order.forEach(o => {
        const e = o.x.e, won = o.x === winner;
        if (e.p) {
          const p = e.p;
          p.awards.push({ year: year, cat: cat.id, won: won });
          const talent = cat.slot ? [typeof p.cast[cat.slot] === 'number' ? getTalent(p.cast[cat.slot]) : null].filter(Boolean) : castTalent(p);
          talent.forEach(t => giveTalentAward(t, won));
          state.studio.prestige = Math.min(A.prestigeMax, state.studio.prestige + (won ? (cat.id === 'picture' ? A.prestigePicture : A.prestigeWin) : A.prestigeNom));
          nomCount[p.id] = (nomCount[p.id] || []).concat([cat.name]);
          let g = nomCount[p.id].length === 1 ? A.nomFame : 0;
          if (won) g += cat.id === 'picture' ? A.pictureFame : A.winFame;
          fameGain[p.id] = Math.min(A.filmFameMax, (fameGain[p.id] || 0) + g);
          if (won) {
            state.studio.criticsRep = clamp(state.studio.criticsRep + A.winCritics, 0, 100);
            addLog(atx('won', Object.assign({ title: p.title, cat: cat.name }, map0)), 'award');
          }
        } else if (won) {
          const r = rivalList().find(x => x.id === e.rivalId);
          if (r) r.fame = clamp(r.fame + (cat.id === 'picture' ? 2 : 1), 0, 100);
          if (cat.id === 'picture') addLog(atx('rivalWon', Object.assign({ studio: e.studio, title: e.title, cat: cat.name }, map0)), 'award', 'rivals');
        }
      });
    });
    const ids = Object.keys(nomCount);
    ids.forEach(id => {
      const p = getProject(id), n = nomCount[id].length;
      gainStudioFame(fameGain[id] || 0);
      addLog(atx('nominated', Object.assign({ title: p.title, count: n, s: n === 1 ? '' : 's', cats: nomCount[id].join(', ') }, map0)), 'award');
    });
    if (mine.length && !ids.length) addLog(atx('noNoms', map0), 'award');
    if (ids.length) state.stopFlag = true;
    state.awards.history.push(rec);
    if (state.awards.history.length > A.keepHistory) state.awards.history.shift();
    emit('awards', rec);
  }
  function awardsTick() {
    const d = dateOf();
    if (d.week === 1 && state.week > 0) snapshotPool();
    festivalTick();
    if (d.week === TUNING.awards.ceremonyWeek) runCeremony();
  }
  function awardsInfo() {
    const d = dateOf(), A = TUNING.awards, def = CONTENT.AWARDS;
    const nextYear = d.week >= A.ceremonyWeek ? d.year + 1 : d.year;
    const eligible = state.projects.filter(awardEligible).map(p => ({
      id: p.id, title: p.title, year: awardYearOf(p), score: Math.round(awardScore(p)), buzz: p.buzz || 0, campaign: p.campaign || { level: 0, spent: 0 },
      quotes: def.campaigns.map((c, i) => Object.assign({ id: c.id, name: c.name }, campaignQuote(p.id, i)))
    }));
    const trophies = [];
    state.projects.forEach(p => (p.awards || []).forEach(a => { if (a.won) trophies.push({ projectId: p.id, title: p.title, year: a.year, cat: (def.categories.find(c => c.id === a.cat) || { name: a.cat }).name }); }));
    return { name: def.ceremony, next: { year: nextYear, week: ceremonyWeekOf(nextYear), covers: nextYear - 1 }, eligible: eligible, history: state.awards.history.slice().reverse(),
      trophies: trophies, prestige: Math.round(state.studio.prestige || 0), circuit: def.circuit.map(f => ({ id: f.id, name: f.name, week: f.week, prize: f.prize, level: f.level })),
      campaigns: def.campaigns, categories: def.categories };
  }

// ===== SECTION: NEWS =====
  function newsCat(l) {
    const N = CONTENT.NEWS;
    if (l.cat) {
      if (N.catMap[l.cat]) return N.catMap[l.cat];
      if (N.filters.some(f => f.id === l.cat)) return l.cat;
    }
    return N.typeMap[l.type] || null;
  }
  function newsFilters() { return CONTENT.NEWS.filters; }
  function news(filterId, limit) {
    const N = CONTENT.NEWS, out = [];
    for (let i = state.log.length - 1; i >= 0 && out.length < (limit || TUNING.news.feedMax); i--) {
      const l = state.log[i];
      if (N.hidden.includes(l.type) || (l.cat && N.hiddenCats.includes(l.cat))) continue;
      const c = newsCat(l);
      if (filterId && c !== filterId) continue;
      const f = c ? N.filters.find(x => x.id === c) : null;
      out.push({ week: l.week, text: l.text, type: l.type, cat: c, label: f ? f.name : 'Studio' });
    }
    return out;
  }

// ===== SECTION: SCORE =====
  function stxt(key, map) { return String(CONTENT.SCORE.text[key]).replace(/\{(\w+)\}/g, (m, k) => (map[k] != null ? map[k] : m)); }
  function scoreCounts() {
    const c = { wins: 0, noms: 0, picture: 0, festPrizes: 0, festSelections: 0, hits: 0, shows: 0 };
    state.projects.forEach(p => {
      if (p.format !== 'feature') return;
      if (p.result === 'Hit') c.hits++;
      (p.awards || []).forEach(a => { if (a.won) { c.wins++; if (a.cat === 'picture') c.picture++; } else c.noms++; });
      (p.festResults || []).forEach(f => { if (f.result === 'Official selection') c.festSelections++; else c.festPrizes++; });
    });
    state.series.forEach(s => { if (s.seasonAvgs.length >= TUNING.score.hitSeasons) c.shows++; });
    return c;
  }
  function scoreCalc() {
    const S = TUNING.score, st = state.studio, c = scoreCounts();
    const profit = Math.round(state.cash - state.debt - TUNING.startCash);
    const parts = {
      profit: S.profitWeight * Math.sign(profit) * Math.log10(1 + Math.abs(profit) / S.profitRef),
      awards: S.awardsScale * Math.pow(c.wins * S.win + c.noms * S.nom + c.picture * S.pictureWin + c.festPrizes * S.festPrize + c.festSelections * S.festSelect, S.curve),
      fame: st.fame * S.fame,
      reputation: st.criticsRep * S.critics + (st.prestige || 0) * S.prestige,
      hits: S.hit * Math.pow(c.hits + c.shows, S.curve)
    };
    Object.keys(parts).forEach(k => { parts[k] = Math.round(parts[k] * 10) / 10; });
    const value = Math.max(0, Math.round(Object.keys(parts).reduce((a, k) => a + parts[k], 0)));
    return { value: value, parts: parts, counts: c, profit: profit };
  }
  function scoreInfo() {
    if (state.score) return Object.assign({ locked: true }, state.score);
    return Object.assign({ locked: false, week: state.week, year: dateOf().year, reason: null, rank: null }, scoreCalc());
  }
  function scoreLines(sc) { return CONTENT.SCORE.parts.map(p => p.name + ': ' + Math.round(sc.parts[p.id]) + ' points'); }
  function lockScore(reason) {
    if (state.score) return state.score;
    const sc = Object.assign({ week: state.week, year: dateOf().year, reason: reason, rank: null }, scoreCalc());
    state.score = sc;
    sc.rank = recordScore(sc);
    const map = { score: sc.value, year: reason === 'lock' ? TUNING.scoreLockYear : sc.year, studio: state.studio.name, rank: sc.rank };
    const text = stxt(reason === 'lock' ? 'locked' : 'bankrupt', map) + (sc.rank ? ' ' + stxt('rank', map) : '');
    addLog(text, 'milestone');
    if (reason === 'lock') raiseStudio('score_lock', text, [{ label: 'Continue', effects: {}, result: null }], { scope: 'score', category: 'score', lines: scoreLines(sc) });
    emit('score', sc);
    return sc;
  }

// ===== SECTION: LEADERBOARD =====
  const LB_KEY = 'finalcut_leaderboard';
  let lbMemory = [];
  function lbRead() {
    const ls = storage();
    if (!ls) return lbMemory.slice();
    let list = null;
    try { list = JSON.parse(ls.getItem(LB_KEY)); } catch (e) { list = null; }
    return Array.isArray(list) ? list.filter(e => e && typeof e.score === 'number') : [];
  }
  function lbWrite(list) {
    lbMemory = list.slice();
    const ls = storage();
    if (ls) { try { ls.setItem(LB_KEY, JSON.stringify(list)); } catch (e) { /* keep in-memory copy */ } }
  }
  function lbSort(list) { return list.slice().sort((a, b) => b.score - a.score || String(a.date).localeCompare(String(b.date))); }
  function todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function recordScore(sc) {
    const entry = { name: state.founder.name, studio: state.studio.name, score: sc.value, date: todayStr(), year: sc.year, reason: sc.reason };
    const kept = lbSort(lbRead().concat([entry])).slice(0, TUNING.score.leaderboardSize);
    lbWrite(kept);
    const i = kept.indexOf(entry);
    return i < 0 ? null : i + 1;
  }
  function leaderboard() { return lbSort(lbRead()); }
  function clearLeaderboard() { lbWrite([]); }

// ===== SECTION: BANKRUPTCY =====
  function checkBankruptcy() {
    const w = state.warning;
    if (state.cash >= 0) {
      if (w.stage > 0) {
        w.stage = 0;
        addLog('Back in the black. The warnings are cleared.', 'finance');
        state.stopFlag = true;
      }
      return;
    }
    if (w.stage === 0) {
      w.stage = 1;
      w.deadline = state.week + TUNING.warningWeeks;
      addLog('Missed payroll! Cash is negative. Get above $0 within ' + TUNING.warningWeeks + ' weeks.', 'warning');
      state.stopFlag = true;
      emit('warning', w);
    } else if (state.week >= w.deadline) {
      if (w.stage === 1) {
        w.stage = 2;
        w.deadline = state.week + TUNING.warningWeeks;
        addLog('Creditor deadline: get above $0 within ' + TUNING.warningWeeks + ' weeks or the studio goes bankrupt.', 'warning');
        state.stopFlag = true;
        emit('warning', w);
      } else {
        gameOver('bankrupt');
      }
    }
  }
  function gameOver(reason) {
    state.gameOver = { reason: reason, week: state.week };
    addLog(state.studio.name + ' has gone bankrupt.', 'warning');
    lockScore('bankrupt');
    emit('gameover', state.gameOver);
  }

// ===== SECTION: TURN_LOOP =====
  function nextTurn() {
    if (!state || state.gameOver || state.pending) return false;
    state.week++;
    marketTick();
    const interest = Math.round(state.debt * TUNING.weeklyInterest);
    const salaries = weeklySalaries();
    const payroll = weeklyPayroll();
    const actives = activeProjects();
    const freelance = founderFreelancing() ? freelanceIncome() : 0;
    let revenue = 0, production = 0;
    actives.forEach(p => { p.spent += p.weekly; production += p.weekly; });
    state.projects.forEach(p => { if (p.stage === 'release') revenue += releaseIncome(p); });
    revenue += windowsTick();
    const tv = tvTick();
    revenue += tv.revenue;
    production += tv.cost;
    const overhead = weeklyOverhead(revenue);
    const income = freelance + revenue;
    const costs = TUNING.livingCost + interest + salaries + payroll + overhead + production;
    state.cash += income - costs;
    state.lastWeek = { income: income, revenue: revenue, costs: costs, interest: interest, salaries: salaries, overhead: overhead, payroll: payroll };
    bookWeek({ revenue: revenue, freelance: freelance, production: production, salaries: salaries, payroll: payroll,
      overhead: overhead, interest: interest, living: TUNING.livingCost });
    actives.forEach(p => { if (ACTIVE_STAGES.includes(p.stage)) advanceProject(p); });
    rivalTick();
    contractTick();
    moraleTick();
    poachTick();
    talentTick();
    staffTick();
    eventTick();
    awardsTick();
    checkCalendar();
    if (dateOf().week === 1) rivalYear();
    if (state.week % TUNING.economy.quarterWeeks === 0) { marketQuarter(); rivalQuarter(); closeQuarter(); }
    checkBankruptcy();
    save();
    emit('turn');
    return true;
  }
  function advance() {
    if (!state) return 0;
    state.stopFlag = false;
    let n = 0;
    while (n < TUNING.advanceMaxWeeks) {
      if (!nextTurn()) break;
      n++;
      if (state.pending || state.gameOver || state.stopFlag) break;
    }
    state.stopFlag = false;
    emit('advance', { weeks: n });
    return n;
  }

// ===== SECTION: SAVE_LOAD =====
  const SAVE_KEY = 'backlot_save';
  function storage() { try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch (e) { return null; } }
  function save() {
    const ls = storage();
    if (!ls || !state) return false;
    try { ls.setItem(SAVE_KEY, JSON.stringify(state)); return true; } catch (e) { return false; }
  }
  function hasSave() { try { const ls = storage(); return !!(ls && ls.getItem(SAVE_KEY)); } catch (e) { return false; } }
  function load() {
    const ls = storage();
    if (!ls) return { ok: false, reason: 'Saving is not available in this browser.' };
    let obj;
    try { obj = JSON.parse(ls.getItem(SAVE_KEY)); } catch (e) { return { ok: false, reason: 'Save file is damaged.' }; }
    if (!obj) return { ok: false, reason: 'No save found.' };
    if (obj.version === 8) {
      if (!obj.market) return { ok: false, reason: 'Save is missing market data.' };
      obj.market.topics = obj.market.topics || {};
      CONTENT.TOPICS.forEach(t => { if (obj.market.topics[t.id] == null) obj.market.topics[t.id] = 1; });
      obj.events = obj.events || { cooldownUntil: 0, nextWeek: 30, seen: {} };
      obj.recruitment = obj.recruitment || { declined: {} };
      obj.events.recentProduction = obj.events.recentProduction || [];
      obj.version = SAVE_VERSION;
    }
    if (obj.version !== SAVE_VERSION) return { ok: false, reason: 'Save is from version ' + obj.version + '; this build uses version ' + SAVE_VERSION + '. Start a new game.' };
    state = obj;
    state.recruitment = state.recruitment || { declined: {} };
    state.events.recentProduction = state.events.recentProduction || [];
    save();
    emit('load');
    return { ok: true };
  }
  function clearSave() { try { const ls = storage(); if (ls) ls.removeItem(SAVE_KEY); } catch (e) { /* ignore */ } }

// ===== SECTION: PUBLIC_API =====
  return {
    get state() { return state; },
    TUNING: TUNING, SLOTS: SLOTS,
    on: on,
    newGame: newGame, nextTurn: nextTurn, advance: advance, choose: choose,
    startProject: startProject, previewProject: previewProject, randomTitle: randomTitle,
    formats: formats, activeProject: activeProject, activeProjects: activeProjects, capacity: capacity, getProject: getProject,
    takeLoan: takeLoan, repayLoan: repayLoan, loanCap: loanCap, freelanceIncome: freelanceIncome,
    weeklyBurn: weeklyBurn, weeklyProfit: weeklyProfit, weeklySalaries: weeklySalaries,
    studioSize: studioSize, staffCount: staffCount, weeklyPayroll: weeklyPayroll, officePayroll: officePayroll, weeklyOverhead: weeklyOverhead, quarterToDate: quarterToDate,
    marketInfo: marketInfo, marketOutlook: marketOutlook,
    series: () => state.series, activeSeries: activeSeries, getSeries: getSeries, tvSlotsUsed: tvSlotsUsed, windowName: windowName,
    growthTier: growthTier, upgradeQuote: upgradeQuote, upgradeTier: upgradeTier,
    staffInfo: staffInfo, staffAction: staffAction,
    rivals: rivalList, activeRivals: activeRivals, getRival: getRival, rivalInfo: rivalInfo, rivalName: rivalName, audienceShare: audienceShare, talentMorale: talentMorale,
    founderRole: founderRole, founderFreelancing: founderFreelancing, founderProject: founderProject, dealDiscount: dealDiscount, founderHype: founderHype,
    talent: talentList, getTalent: getTalent, talentFee: talentFee, salaryOf: salaryOf, traitsOf: traitsOf, effReliability: effReliability,
    talentStatus: talentStatus, slotOptions: slotOptions, recruitmentInterest: recruitmentInterest, castSummary: castSummary,
    roster: roster, rosterCap: rosterCap, weeksLeft: weeksLeft, isExpiring: isExpiring, expiringContracts: expiringContracts,
    contractQuote: contractQuote, signExclusive: signExclusive, renewContract: renewContract, releaseContract: releaseContract, severanceOf: severanceOf,
    news: news, newsFilters: newsFilters,
    awardsInfo: awardsInfo, awardCampaign: awardCampaign, campaignQuote: campaignQuote,
    scoreInfo: scoreInfo, scoreLines: scoreLines, leaderboard: leaderboard, clearLeaderboard: clearLeaderboard,
    dateOf: dateOf, eraOf: eraOf, eraInfo: eraInfo, eraLines: eraLines,
    save: save, load: load, hasSave: hasSave, clearSave: clearSave
  };
})();
