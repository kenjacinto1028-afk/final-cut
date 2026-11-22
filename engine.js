/* FinalCut v14.4 — pure, versioned budget planning helpers.
 * Keeps legacy v13 films untouched; only projects with budgetPlan opt in. */
var FinalCutBudget = (function () {
  'use strict';
  const KEYS = ['prep','shoot','post','marketing','distribution','reserve'];
  const VARIANTS = {
    micro:   {name:'Micro-short', format:'short', minYear:1970, target:420, weeks:[1,1,1,1]},
    short:   {name:'Short film', format:'short', minYear:1970, target:1050, weeks:[2,1,3,3]},
    mid:     {name:'Mid-length film', format:'short', minYear:1970, target:4500, weeks:[3,2,4,4]},
    feature: {name:'Feature film', format:'feature', minYear:1970, target:25000, weeks:[6,4,6,8]},
    pilot:   {name:'TV pilot', format:'pilot', minYear:1970, target:24500, weeks:[3,2,3,2]},
    web:     {name:'Web episode', format:'pilot', minYear:1995, target:4000, weeks:[2,1,2,2]}
  };
  const SCOPE = {intimate:1, standard:2.6, ambitious:5.6};
  const LABELS = {prep:'Development & pre-production',shoot:'Filming',post:'Post-production',
    marketing:'Marketing',distribution:'Distribution',reserve:'Contingency'};
  const BASE = {prep:0.15,shoot:0.47,post:0.20,marketing:0.08,distribution:0.05,reserve:0.05};
  function bounded(n,min,max){return Math.min(max,Math.max(min,n));}
  function variant(id){return VARIANTS[id]||VARIANTS.short;}
  function media(id){return variant(id).format;}
  function stageWeeks(id){const w=variant(id).weeks;return {development:w[0],preproduction:w[1],shoot:w[2],post:w[3]};}
  function budgetClass(format,budget){
    const bands=format==='short'?[2000,6000,16000]:format==='pilot'?[30000,90000,240000]:[40000,120000,1000000];
    return budget<bands[0]?'Micro':budget<bands[1]?'Low':budget<bands[2]?'Mid':'High';
  }
  function recommended(total,vision,preset){
    const available=Math.max(0,Math.round(total)||0);
    const w=Object.assign({},BASE);
    if(vision==='prestige'){w.post+=0.04;w.marketing-=0.03;w.distribution-=0.01;}
    if(vision==='bold'){w.shoot+=0.05;w.prep+=0.01;w.marketing-=0.03;w.post-=0.03;}
    if(preset==='craft'){w.prep+=0.05;w.post+=0.08;w.marketing-=0.07;w.distribution-=0.04;w.reserve-=0.02;}
    if(preset==='audience'){w.marketing+=0.11;w.distribution+=0.07;w.shoot-=0.09;w.post-=0.06;w.prep-=0.03;}
    if(preset==='lean'){w.reserve+=0.08;w.marketing-=0.04;w.distribution-=0.03;w.post-=0.01;}
    const plan={};let remaining=available;
    for(const k of KEYS.slice(0,-1)){plan[k]=Math.round(available*Math.max(0,w[k]));remaining-=plan[k];}
    plan.reserve=Math.max(0,remaining);
    return plan;
  }
  function evaluate(opts){
    opts=opts||{};
    const kind=VARIANTS[opts.variant]?opts.variant:opts.format==='feature'?'feature':opts.format==='pilot'?'pilot':'short';
    const v=variant(kind), scope=SCOPE[opts.scope]?opts.scope:'intimate';
    const cap=Math.max(0,Math.round(Number(opts.cap)||0)),fees=Math.max(0,Math.round(Number(opts.fees)||0));
    const scriptFee=Math.max(0,Math.round(Number(opts.scriptFee)||0));
    const crew=Math.max(0,cap-fees-scriptFee);
    const plan=opts.plan&&typeof opts.plan==='object'?Object.fromEntries(KEYS.map(k=>[k,Math.round(Number(opts.plan[k])||0)])):recommended(crew,opts.vision,opts.preset);
    const allocated=KEYS.reduce((n,k)=>n+plan[k],0),unallocated=cap-fees-scriptFee-allocated;
    const target=v.target*SCOPE[scope];
    const need={prep:target*.15,shoot:target*.59,post:target*.26};
    const ratios=Object.fromEntries(['prep','shoot','post'].map(k=>[k,bounded(plan[k]/Math.max(1,need[k]),0,1.5)]));
    const weight={prep:0.25,shoot:0.50,post:0.25};
    const adequacy=Object.keys(ratios).reduce((a,k)=>a+weight[k]*Math.min(1,ratios[k]),0);
    const risks=[];
    if(unallocated<0)risks.push('Allocated costs exceed the spending limit.');
    if(cap<fees+scriptFee)risks.push('Hiring and screenplay fees exceed the cap.');
    for(const k of ['prep','shoot','post'])if(ratios[k]<0.60)risks.push(LABELS[k]+' is underfunded for '+scope+' scope.');
    const level=adequacy>=.92&&unallocated>=0?'Comfortable':adequacy>=.66&&unallocated>=0?'Lean but achievable':'Underfunded';
    const qualityEffect=Math.round(bounded((adequacy-.83)*18,-14,8));
    const delayWeeks=Math.min(5,Math.max(0,Math.round((.88-adequacy)*5)));
    return {kind,format:v.format,name:v.name,scope,cap,fees,scriptFee,plan,allocated,unallocated,
      contingency:plan.reserve,production:plan.prep+plan.shoot+plan.post,need,ratios,adequacy,
      level,risks,qualityEffect,delayWeeks,budgetClass:budgetClass(v.format,cap),
      plannedWeeks:Object.values(stageWeeks(kind)).reduce((a,b)=>a+b,0)};
  }
  function milestoneCost(plan,stage,spent,planned){
    const total=stage==='development'||stage==='preproduction'?'prep':stage;
    const limit=Math.max(0,Number(plan[total])||0), used=Math.max(0,Number(spent[total])||0);
    const left=Math.max(0,limit-used);
    const weeks=Math.max(1,Number(planned[total])||1);
    return Math.min(left,Math.ceil(limit/weeks));
  }
  return {KEYS,VARIANTS,SCOPE,LABELS,media,variant,stageWeeks,budgetClass,recommended,evaluate,milestoneCost};
})();


// ===== SECTION: HEADER =====
// Final Cut — engine.js
// State, turn loop and all game rules. No DOM access here.
// Load order: content.js → engine.js → media.js → ui.js
var SAVE_VERSION = 13;   // v9: topic demand, tiered festivals, reputation recruitment, event cadence; v8 (7.1): state.score; v7 (6.3): awards, studio.prestige (6.2 era effects add no state); v6 (6.1): state.events (cooldown, seen); v5 (phase 5): rivals, talent rival contracts, roster morale; v4 (phase 4): market, series, staff, studio.tier, project windows/market; v3 (4.1): finance

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
    festivalWaitWeeks: 3, // retained for compatibility with old v13 saves
    shortScreening: { minWeeks:3, maxWeeks:12, decayBase:0.73,
      netRevenuePerViewer1970:0.75, annualGrowth:0.031, encoreWeeks:4,
      encoreRevenueShare:0.20, festivalPressScore:4 },
    studioShare: 0.5,
    boxOfficeBase: 0.5,
    boxOfficeRefBudget: 350000,
    boxOfficeBudgetExp: 0.86, // v14.1: diminishing returns for tentpoles; small films retain access
    bigFilmAudienceCapPerDoubling: 0.055, smallFilmAudienceLegsBonus: 0.035,
    boxOfficeQualityExp: 1.3,
    boxOfficeLuck: [0.64, 1.3], // v14.1: occasional demand misses even with high-quality casts
    legs: { base: 0.6, perQuality: 0.0028, max: 0.85 }, // v13.5 stronger, bounded word of mouth
    softCap: { quality: 70, hype: 65, room: 30 },
    maxReleaseWeeks: 20, // v13.5: longer theatrical tail for successful films
    estimatedTicketPrice1970: 1.50, // assumption for modeled admissions, not a historical series
    estimatedTicketInflation: 0.031, // never changes revenues or theatrical demand
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
          { id: 'shoestring', name: 'Shoestring', budget: 40000, quality: 2 },
          { id: 'low', name: 'Low', budget: 120000, quality: 8 },
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
      hypeDirectorFame: 0.08, hypeWriterFame: 0.045,
      slipChance: 0.03,
      traitEventShare: 0.4,
      crewSpecialtyMin: 40,
      fameGain: { Hit: 6, Profit: 3, Flop: -1, Won: 4, 'Official selection': 2, Screened: 1 },
      growthCap: 85,
      eliteSkill: 65, eliteFame: 55, offerRefusalWeeks: 4,
      ensembleQuality: 0.09, specialistQuality: 0.07, ensembleHype: 0.045,
      backgroundCrewShare: 0.018, backgroundCrewQuality: 1.1
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
      ratingQuality: 0.08, ratingHype: 0.03, seasonFatigue: 0.94,
      bonusThreshold: 8, bonusPerPoint: 0.05,
      renewAvg: 7, renewLuck: 0.10, renewalFloor: 0.07, renewalCeil: 0.93,
      renewFeeRaise: 0.13, renewCostRaise: 0.10, qualityDecay: 2
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
        { revenue: 3000000,  overhead: 1500, revenueShare: 0.22, staff: 4, prodStaff: 1 },
        { revenue: 8000000,  overhead: 4200, revenueShare: 0.32, staff: 8, prodStaff: 2 }
      ],
      trailingQuarters: 4,
      staffPerRoster: 0.5,
      staffPay: 200,
      taxRate: 0.3,
      taxBrackets: [[0, 0.28], [500000, 0.38], [2000000, 0.48]],
      historyQuarters: 12,
      stopOnQuarter: false
    }
  };

// ===== SECTION: TUNING_RIVALS =====
  TUNING.rivals = {
    count: 6, maxCount: 15,
    startTier: [1, 2],
    upstartDelay: [6, 20],
    upstartYearChance: 0.44,
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
    keepClosed: 15, keepFilms: 6, maxPlanned: 4,
    leadWeeks: [20, 32],
    rescheduleRange: 3, moveGain: 1.1,
    seasonPref: 1.15, avgBackground: 0.7,
    backgroundCompetitors: [0, 0],
    maxBudgetCap: 1.5,
    bigBudget: 1000000,
    sameGenreWeight: 0.5, bigFilmWeight: 0.5,
    holdPenalty: 0.03,
    boxMult: 1.25, share: 0.65,
    fameHype: 0.3, talentQuality: 2.2, talentQualityMax: 10, // v14.1: reward funded rival staffing
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
    nominees: 4, maxPerStudio: 2, minScore: 60,
    goldenWinMin: 113, otherWinMin: 107, criticsWinMin: 109, indieWinMin: 94, audienceWinMin: 107,
    goldenMaxWinsPerStudio: 1, otherMaxWinsPerStudio: 1, festivalWinFloorBonus: 8, festivalMaxWinsPerFilm: 2, festivalMaxStudioWinsPerYear: 2,
    noise: 8, winNoise: 5, slotWeight: 0.25,
    rivalBoost: 20, prestigeRivalBoost: 6,
    campaigns: [ { points: 0, share: 0 }, { points: 2, share: 0.03 }, { points: 5, share: 0.08 } ],
    festWindow: 52, festMinCritic: 0, festivalMaxEntries: 4, festivalMaxShortEntries: 3,
    festSelect: 76, festPrize: 90,
    selectBuzz: 2, prizeBuzz: 5, buzzMax: 10, selectFame: 1, prizeFame: 3, prizeTalentFame: 2,
    nomFame: 1, winFame: 3, pictureFame: 6, filmFameMax: 10, winCritics: 2,
    talentNomFame: 1, talentWinFame: 4, talentWinSkill: 1,
    prestigeNom: 0.5, prestigeWin: 2, prestigePicture: 5, prestigeDecay: 0.85, prestigeMax: 100, prestigeHype: 0.05,
    keepHistory: 260
  };

// ===== SECTION: TUNING_NEWS =====
  TUNING.reputation = { buzzWeeklyDecay: 0.967, buzzHype: 0.14, prestigeHalfLifeWeeks: 88,
    prestigeWindowWeeks: 260, prestigeSoftRef: 205, legacyScore: 0.035 };
  TUNING.news = { starFame: [50, 75, 90], headlines: 5, feedMax: 300 };

// ===== SECTION: TUNING_SCORE =====
  TUNING.score = {
    profitRef: 5000, profitWeight: 60,
    fame: 2, critics: 0.5, prestige: 0.5,
    win: 6, nom: 2, pictureWin: 6, festPrize: 3, festSelect: 1, awardsScale: 2,
    hit: 8, hitSeasons: 3,
    // An indie hit earns recognition for excellent returns on a small budget,
    // without pretending it earned a blockbuster gross or major trophy.
    indieHitWeight: 4, indieHitMax: 60,
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
  let fastSimulationTesting=false; // Node-only QA acceleration; never skips browser autosaves
  function setFastSimulationTesting(enabled){
    if(typeof document!=='undefined')return false;
    fastSimulationTesting=!!enabled;return true;
  }


  // v14: compact, additive Film DNA; historical releases are never rewritten.
  const V14_TAGS={dialogue:'Sharp dialogue',atmosphere:'Distinctive atmosphere',spectacle:'Visual spectacle',
    emotion:'Emotional resonance',twist:'Memorable twist',research:'Authentic detail',ensemble:'Strong ensemble',
    humor:'Character humor',craft:'Inventive filmmaking',mystery:'Narrative mystery',
    heart:'Broad human appeal',originality:'Unusual premise'};
  const V14_RISKS={narrow:'Niche appeal',difficult:'Difficult shoot',controversial:'Divisive subject',
    untested:'Unproven approach',expensive:'Cost pressure',marketing:'Hard to market'};
  const V14_VISIONS={
    prestige:{name:'Prestige-first',quality:2,hype:-2,critics:2,viewer:-2,festival:3},
    mainstream:{name:'Accessible entertainment',quality:-1,hype:3,critics:-1,viewer:3,festival:-1},
    bold:{name:'Bold genre vision',quality:1,hype:1,critics:0,viewer:1,festival:1},
    star:{name:'Star vehicle',quality:0,hype:3,critics:-1,viewer:2,festival:0}
  };
  function v14State(){
    if(!state)return null;
    if(!state.v14||typeof state.v14!=='object')state.v14={};
    const v=state.v14;
    if(!Array.isArray(v.pitches))v.pitches=[];
    if(!Array.isArray(v.pitchHistory))v.pitchHistory=[];
    if(!v.partnerships||typeof v.partnerships!=='object')v.partnerships={};
    if(!Array.isArray(v.rivalry))v.rivalry=[];
    if(!Array.isArray(v.classChanges))v.classChanges=[];
    if(!v.classifications||typeof v.classifications!=='object')v.classifications={};
    if(!Array.isArray(v.offers))v.offers=[];
    if(!v.delegation)v.delegation='ask';
    if(!v.ambition)v.ambition=null;
    return v;
  }
  function filmStory(p,kind,text){
    if(!p)return;
    if(!Array.isArray(p.story))p.story=[];
    if(p.story.some(x=>x.week===state.week&&x.kind===kind&&x.text===text))return;
    p.story.push({week:state.week,kind,text:String(text).slice(0,170)});
    if(p.story.length>14)p.story.splice(0,p.story.length-14);
  }
  function dnaFor(o){
    const pitch=o.pitchId!=null?v14PitchById(o.pitchId):null;
    const key=o.format+':'+o.genre+':'+o.topic+':'+(o.title||'');
    let hash=0;for(let i=0;i<key.length;i++)hash=(hash*31+key.charCodeAt(i))>>>0;
    const tags=Object.keys(V14_TAGS),risks=Object.keys(V14_RISKS);
    const strengths=pitch?pitch.strengths.slice(0,2):[tags[hash%tags.length],tags[(hash+5)%tags.length]];
    const risk=pitch?pitch.risk:risks[Math.floor(hash/17)%risks.length];
    const vision=V14_VISIONS[o.vision]?o.vision:(pitch?pitch.vision:'mainstream');
    return {pitchId:pitch?pitch.id:null,hook:pitch?pitch.hook:('An original '+o.genre+' story about '+o.topic+'.'),
      strengths,risk,vision,lane:vision==='prestige'?'arthouse':vision==='bold'?'genre':'mainstream',
      origin:pitch?'marketplace':o.sequelOf!=null?'sequel':'original',
      scriptVision:pitch?pitch.vision:null,choiceFlags:[]};
  }
  function v14PitchById(id){return v14State().pitches.find(p=>p.id===String(id))||null;}
  // Authored combinations, not incoherent free-text procedural descriptions.
  const V14_PITCHES=[
    {title:'The Closing Picture House',genre:'drama',topic:'smalltown',hook:'Two sisters have one summer to save their hometown cinema.',
      strengths:['emotion','dialogue'],risk:'narrow',vision:'prestige'},
    {title:'Three Days of Trouble',genre:'comedy',topic:'roadtrip',hook:'A reluctant driver must escort an estranged family across the country.',
      strengths:['humor','heart'],risk:'untested',vision:'mainstream'},
    {title:'Under the Floorboards',genre:'horror',topic:'haunted',hook:'A house renovation uncovers a voice everyone swears belongs to the missing owner.',
      strengths:['atmosphere','mystery'],risk:'marketing',vision:'bold'},
    {title:'The Witness Route',genre:'thriller',topic:'corruptcop',hook:'A junior clerk discovers one witness can unravel the entire city machine.',
      strengths:['twist','dialogue'],risk:'controversial',vision:'prestige'},
    {title:'Signal from Home',genre:'scifi',topic:'spacecolony',hook:'A remote settlement receives a distress call from its own future.',
      strengths:['spectacle','originality'],risk:'expensive',vision:'bold'},
    {title:'Champion of Nowhere',genre:'drama',topic:'boxing',hook:'An aging trainer backs a fighter everyone else has already forgotten.',
      strengths:['emotion','research'],risk:'narrow',vision:'prestige'},
    {title:'The Night Shift',genre:'comedy',topic:'nightshift',hook:'Hospital night workers cover for one another during a very long shift.',
      strengths:['ensemble','humor'],risk:'difficult',vision:'mainstream'},
    {title:'After the Broadcast',genre:'thriller',topic:'conspiracy',hook:'A local radio host reveals a secret live, with no way to undo it.',
      strengths:['twist','originality'],risk:'controversial',vision:'bold'},
    {title:'A Family of Strangers',genre:'romance',topic:'firstlove',hook:'Two strangers discover an unexpected connection in a handwritten will.',
      strengths:['heart','dialogue'],risk:'narrow',vision:'mainstream'},
    {title:'The Great Divide',genre:'western',topic:'frontier',hook:'A border town must decide which side of a new railway it belongs to.',
      strengths:['atmosphere','research'],risk:'difficult',vision:'prestige'},
    {title:'The Invisible Encore',genre:'documentary',topic:'rockband',hook:'A forgotten touring band reunites to confront its lost recording.',
      strengths:['research','emotion'],risk:'marketing',vision:'prestige'},
    {title:'The Machine Next Door',genre:'scifi',topic:'robots',hook:'An ordinary family discovers the neighbor has built a curious machine.',
      strengths:['spectacle','heart'],risk:'expensive',vision:'mainstream'},
    {title:'The Last Postmark',genre:'drama',topic:'familysecret',hook:'A rural postmaster must decide whether to deliver a letter held for thirty years.',
      strengths:['dialogue','emotion'],risk:'narrow',vision:'prestige'},
    {title:'Second Bell',genre:'drama',topic:'comingofage',hook:'A young teacher protects a troubled class while confronting the school board.',
      strengths:['heart','ensemble'],risk:'controversial',vision:'prestige'},
    {title:'A Place in the Crowd',genre:'documentary',topic:'underdog',hook:'An overlooked amateur team risks everything to preserve its community.',
      strengths:['research','emotion'],risk:'marketing',vision:'prestige'},
    {title:'When the Wires Went Quiet',genre:'thriller',topic:'medical',hook:'A hospital loses contact with the outside world during a dangerous night.',
      strengths:['atmosphere','research'],risk:'difficult',vision:'prestige'},
    {title:'End of a Summer',genre:'romance',topic:'comingofage',hook:'Two childhood friends spend their last summer together before leaving home.',
      strengths:['heart','dialogue'],risk:'narrow',vision:'prestige'},
    {title:'Mercy Beyond the Valley',genre:'western',topic:'frontier',hook:'An isolated frontier doctor must decide whom the town will protect.',
      strengths:['research','emotion'],risk:'difficult',vision:'prestige'},
    {title:'The Apprentice',genre:'drama',topic:'organizedcrime',hook:'An unwilling apprentice inherits a family debt and an impossible moral choice.',
      strengths:['dialogue','twist'],risk:'controversial',vision:'prestige'},
    {title:'The Last Picture',genre:'documentary',topic:'celebrity',hook:'A photographer catalogues the forgotten people behind a famous screen star.',
      strengths:['research','originality'],risk:'narrow',vision:'prestige'},
    {title:'Midnight Exchange',genre:'action',topic:'heist',hook:'A routine courier delivery becomes an impossible overnight escape.',
      strengths:['spectacle','twist'],risk:'expensive',vision:'mainstream'},
    {title:'The Return Trip',genre:'comedy',topic:'roadtrip',hook:'A family chooses the wrong bus and finds a reason to stay together.',
      strengths:['humor','heart'],risk:'untested',vision:'mainstream'},
    {title:'Saturday Heroes',genre:'drama',topic:'underdog',hook:'A fading local team receives one final chance to save its season.',
      strengths:['ensemble','emotion'],risk:'difficult',vision:'mainstream'},
    {title:'A Good Wrong Turn',genre:'romance',topic:'firstlove',hook:'A missed appointment sends two rivals on the same unexpected journey.',
      strengths:['dialogue','heart'],risk:'narrow',vision:'mainstream'},
    {title:'The Very Unusual Guest',genre:'comedy',topic:'supernatural',hook:'An eccentric houseguest exposes a family secret in the most inconvenient way.',
      strengths:['humor','mystery'],risk:'marketing',vision:'mainstream'},
    {title:'The Rockwell Mystery',genre:'thriller',topic:'familysecret',hook:'A family searching for an heir discovers that the estate was never abandoned.',
      strengths:['twist','atmosphere'],risk:'untested',vision:'mainstream'},
    {title:'The Neighborhood Watch',genre:'comedy',topic:'smalltown',hook:'Three suspicious neighbors mistakenly recruit an entire town into their investigation.',
      strengths:['ensemble','humor'],risk:'narrow',vision:'mainstream'},
    {title:'Three Minutes to Midnight',genre:'action',topic:'espionage',hook:'An exhausted courier holds the only evidence of a capital-city conspiracy.',
      strengths:['spectacle','twist'],risk:'expensive',vision:'mainstream'},
    {title:'The Wrong Orbit',genre:'scifi',topic:'spacecolony',hook:'An orbital miner receives a map to a planet that no one believes exists.',
      strengths:['originality','spectacle'],risk:'expensive',vision:'bold'},
    {title:'The Last Transmission',genre:'horror',topic:'supernatural',hook:'An abandoned communications station begins broadcasting tomorrow’s voices.',
      strengths:['atmosphere','mystery'],risk:'marketing',vision:'bold'},
    {title:'No Name on the Door',genre:'thriller',topic:'espionage',hook:'A secret agent learns that the enemy headquarters has been moved into her apartment.',
      strengths:['twist','originality'],risk:'untested',vision:'bold'},
    {title:'Signal Seven',genre:'scifi',topic:'timetravel',hook:'A scientist receives seven messages from possible versions of herself.',
      strengths:['mystery','originality'],risk:'difficult',vision:'bold'},
    {title:'The Green Room',genre:'horror',topic:'rockband',hook:'A touring band hears an unknown instrument playing behind a locked venue door.',
      strengths:['atmosphere','ensemble'],risk:'marketing',vision:'bold'},
    {title:'Children of the House',genre:'horror',topic:'haunted',hook:'A new caretaker uncovers a family that was never listed in the old records.',
      strengths:['atmosphere','emotion'],risk:'controversial',vision:'bold'},
    {title:'The City Beneath',genre:'scifi',topic:'robots',hook:'Maintenance workers discover their city is being quietly rebuilt from below.',
      strengths:['spectacle','originality'],risk:'expensive',vision:'bold'},
    {title:'The Unseen Rival',genre:'thriller',topic:'revenge',hook:'A quiet investigator follows a rival who seems to anticipate every move.',
      strengths:['twist','craft'],risk:'difficult',vision:'bold'}
  ];
  function v14Hash(key){
    let x=2166136261;for(const c of String(key)){x=Math.imul(x^c.charCodeAt(0),16777619)>>>0;}
    return x>>>0;
  }
  function v14Pitches(){
    const v=v14State(),quarter=Math.floor(state.week/13);
    if(v.pitchQuarter===quarter&&v.pitches.length===3)return v.pitches;
    const offers=['safe','prestige','risk'],history=v.pitchHistory;
    const unlocked=state.studio.tier>0&&state.studio.fame>=TUNING.formats.feature.unlockFame;
    v.pitches=offers.map((lane,i)=>{
      const templates=V14_PITCHES.filter(t=>i===1?t.vision==='prestige':i===2?t.vision==='bold':t.vision==='mainstream');
      const fresh=templates.filter(t=>!history.includes(t.title));
      let catalog=fresh.length?fresh:templates;
      let d=catalog[v14Hash(state.campaignId+':'+quarter+':'+i)%catalog.length];
      history.push(d.title);
      if(history.length>18)history.splice(0,history.length-18);
      const identity=v14Identity('you');
      if(i===2 && identity?.primary==='genre' && identity.topGenre){
        const focused=V14_PITCHES.filter(t=>t.genre===identity.topGenre);
        if(focused.length)d=focused[v14Hash(state.campaignId+':focus:'+quarter)%focused.length];
      }
      const format=unlocked?(i===1?'short':'feature'):'short';
      const budget=TUNING.formats[format].tiers[0].budget;
      const fee=(!unlocked&&i===0)?0:round50(budget*(i===2?.12:i===1?.07:.045));
      const rival=activeRivals().filter(r=>r.status==='active'&&r.cash>=Math.max(300,fee*3))
        .sort((a,b)=>v14Hash(a.id+':'+quarter+i)-v14Hash(b.id+':'+quarter+i))[0];
      return {id:'q'+quarter+'-'+i,quarter,lane,format,title:d.title,genre:d.genre,topic:d.topic,
        hook:d.hook,strengths:d.strengths.slice(),risk:d.risk,vision:d.vision,fee,
        contested:i===2&&unlocked&&!!rival,rivalId:i===2&&unlocked&&rival?rival.id:null,
        claimedBy:null, expiresWeek:(quarter+1)*13};
    });
    v.pitchQuarter=quarter;
    return v.pitches;
  }
  function v14ScriptQuote(o){
    if(o.pitchId==null)return {ok:true,fee:0,pitch:null};
    const pitch=v14Pitches().find(p=>p.id===String(o.pitchId));
    if(!pitch)return {ok:false,reason:'This script pitch is no longer available. A new slate arrives next quarter.'};
    if(pitch.claimedBy)return {ok:false,reason:'This script has already been acquired.'};
    if(o.format!==pitch.format||o.genre!==pitch.genre||o.topic!==pitch.topic)
      return {ok:false,reason:'The pitch format, genre and topic must match the original script.'};
    const approach=['standard','partner','buyout'].includes(o.pitchApproach)?o.pitchApproach:'standard';
    const boon=v14State().offers.find(x=>!x.used&&x.expiresWeek>=state.week);
    const discount=boon&&['newvoices','prestige','genre'].includes(boon.id)?.9:1;
    const fee=Math.round(pitch.fee*(approach==='buyout'?1.5:approach==='partner'?.65:1)*discount);
    return {ok:true,fee,pitch,approach,contested:pitch.contested};
  }
  function v14MarketInfo(){return {quarter:Math.floor(state.week/13),pitches:v14Pitches().map(p=>Object.assign({},p)),nextRefreshWeek:(Math.floor(state.week/13)+1)*13};}

  function v14Dna(p){return p&&p.dna||null;}
  function v14Storyboard(p){return p&&Array.isArray(p.story)?p.story.slice(-12):[];}

  function newGame(opts) {
    opts = opts || {};
    state = {
      version: SAVE_VERSION,
      campaignId: Date.now().toString(36) + "-" + Math.floor(Math.random()*1e9).toString(36),
      week: 0,
      cash: TUNING.startCash,
      debt: 0,
      founder: {
        name: (opts.founderName || '').trim() || (pick(CONTENT.FIRST_NAMES) + ' ' + pick(CONTENT.LAST_NAMES)),
        role: 'filmmaker',
        stats: { directing: rint(18, 30), writing: rint(18, 30), business: rint(10, 25), charisma: rint(10, 25) }
      },
      studio: { name: (opts.studioName || '').trim() || 'Untitled Pictures', homeRegion: CONTENT.REGIONS.some(r => r.id === opts.homeRegion) ? opts.homeRegion : 'northamerica', fame: 0, criticsRep: 0, releases: 0, tier: 0, prestige: 0 },
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
      awards: { history: [], pool: [], judged: {} },
      filmArchive: { rivals: [], incompleteBefore: null },
      annualReviews: [],
      yearPlans: [], // Saved advisory priorities and opportunity decisions by studio year.
      yearEndPresented: [], // Year-end honors are presentation only; persist dismissal per calendar year.
      premierePresented: [], // Release reports are presentation only, one per film with saved dismissal.
      endRunPresented: [], // Distinct final screening reports, dismissed once per project.
      reputation: { buzz: 5, currentPrestige: 0, lifetimeLegacy: 0, prestigeEvents: [] },
      world: { yearbook: [], decadeChampions: [], leadershipEvents: [] },
      legacyPlay: { milestones: [], initiative: null, nextInitiativeWeek: 0, reissues: [], lastReissueWeek: -999, industryShift: null, shiftHistory: [] },
      market: null,
      recruitment: { declined: {} },
      staff: null,
      rivals: null,
      v14:{pitches:[],partnerships:{},rivalry:[],offers:[],classChanges:[],delegation:'ask',ambition:null}
    };
    state.market = initMarket();
    captureDemandSnapshot();
    state.staff = initStaff();
    seedTalent();
    initRivals();
    v14State();
    v14Pitches();
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
    const actual = points > 0 ? points * Math.pow(Math.max(0.025, 1-before/105),1.42) : points;
    state.studio.fame = clamp(before + actual, 0, 100);
    return Math.round((state.studio.fame - before) * 10) / 10;
  }
  // Long-term fame stays permanent. Buzz responds to current releases; prestige measures recent
  // artistic standing; Legacy is an uncapped record of verified achievements only.
  function updateCurrentPrestige() {
    if (!state || !state.reputation) return 0;
    const r=state.reputation, t=TUNING.reputation;
    r.prestigeEvents=(r.prestigeEvents||[]).filter(e=>e.week<=state.week && state.week-e.week<=t.prestigeWindowWeeks);
    const raw=r.prestigeEvents.reduce((sum,e)=>sum+e.points*Math.pow(0.5,(state.week-e.week)/t.prestigeHalfLifeWeeks),0);
    r.currentPrestige=Math.round(100*(1-Math.exp(-raw/t.prestigeSoftRef))*10)/10;
    return r.currentPrestige;
  }
  function reputationEvent(points, legacy, kind, filmId, week) {
    if (!state.reputation) state.reputation={buzz:5,currentPrestige:0,lifetimeLegacy:0,prestigeEvents:[]};
    const r=state.reputation;
    if (points>0) r.prestigeEvents.push({week:week==null?state.week:week,points,kind:kind||'recognition',filmId:filmId||null});
    r.lifetimeLegacy=Math.max(0,Math.round((r.lifetimeLegacy+(legacy||0))*10)/10);
    updateCurrentPrestige();
  }
  function currentBuzz(delta) {
    if(!state.reputation) return 0;
    // A well-known studio can stay busy without remaining at maximum public attention forever.
    const adjusted=delta>0?delta*Math.max(0.4,1-state.reputation.buzz*.005):delta;
    state.reputation.buzz=clamp(Math.round((state.reputation.buzz+adjusted)*10)/10,0,100);
    return state.reputation.buzz;
  }
  function reputationTick() {
    if(!state.reputation)return;
    state.reputation.buzz=Math.round(state.reputation.buzz*TUNING.reputation.buzzWeeklyDecay*10)/10;
    updateCurrentPrestige();
  }
  function reputationInfo() {
    const r=state.reputation || {buzz:0,currentPrestige:0,lifetimeLegacy:0,prestigeEvents:[]};
    return {buzz:Math.round(r.buzz),currentPrestige:Math.round(r.currentPrestige),lifetimeLegacy:Math.round(r.lifetimeLegacy),
      fame:Math.round(state.studio.fame),historicPrestige:Math.round(state.studio.prestige||0),
      recent:r.prestigeEvents.slice(-8).map(e=>({week:e.week,kind:e.kind,points:e.points,filmId:e.filmId}))};
  }
  function migrateReputation(obj) {
    const r={buzz:Math.round(Math.min(40,(obj.studio.fame||0)*0.3)),currentPrestige:0,lifetimeLegacy:0,prestigeEvents:[]};
    const baseWeek=obj.week;
    (obj.projects||[]).filter(p=>p.releaseWeek!=null).forEach(p=>{
      const filmId='player:'+p.id,critic=p.critic||0;
      if(critic>=75){const amt=Math.max(1,(critic-70)*0.22);r.lifetimeLegacy+=amt;
        if(baseWeek-p.releaseWeek<=TUNING.reputation.prestigeWindowWeeks)r.prestigeEvents.push({week:p.releaseWeek,points:amt,kind:'film',filmId});}
      (p.awards||[]).filter(a=>a.won).forEach(a=>{const amt=a.cat==='picture'?9:4;
        r.lifetimeLegacy+=amt;
        const week=(a.year-TUNING.startYear)*TUNING.weeksPerYear+8;
        if(baseWeek-week<=TUNING.reputation.prestigeWindowWeeks && week<=baseWeek)r.prestigeEvents.push({week,points:amt,kind:'award',filmId});});
      (p.festResults||[]).filter(a=>a.kind==='winner').forEach(a=>{const amt=(a.tierRank||1)>=4?4:2;
        r.lifetimeLegacy+=amt;
        const week=(a.year-TUNING.startYear)*TUNING.weeksPerYear+23;
        if(baseWeek-week<=TUNING.reputation.prestigeWindowWeeks && week<=baseWeek)r.prestigeEvents.push({week,points:amt,kind:'festival',filmId});});
    });
    r.lifetimeLegacy=Math.round(r.lifetimeLegacy*10)/10;
    return r;
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
  const RECOGNITION = [
    { min: 0, name: 'Local Talent' }, { min: 20, name: 'Regional Name' },
    { min: 40, name: 'National Name' }, { min: 60, name: 'International Name' },
    { min: 80, name: 'Global Star / Industry Icon' }
  ];
  function recognition(t) {
    const fame = clamp(Number(t && t.fame) || 0, 0, 100);
    const level = RECOGNITION.filter(x => fame >= x.min).length - 1;
    const name = level === 4 && t && t.role !== 'actor' ? 'Industry Icon' : level === 4 ? 'Global Star' : RECOGNITION[level].name;
    return { level, name, fame, homeRegion: t && t.homeRegion || 'northamerica' };
  }
  function talentReach(t, region) {
    const tier = recognition(t).level;
    if (!region || region === t.homeRegion) return 1;
    return [0.28, 0.43, 0.62, 0.84, 1][tier];
  }
  function talentContribution(t, slot, genre, region) {
    if (!t) return { quality: 0, hype: 0 };
    const weight = TUNING.talent.weights[slot] || 0;
    const quality = Math.round((t.skill - TUNING.talent.emptySkill) * weight + ((t.affinity || []).includes(genre) ? TUNING.talent.affinityBonus : 0));
    const hypeWeight = { lead: TUNING.talent.hypeLeadFame, director: TUNING.talent.hypeDirectorFame, writer: TUNING.talent.hypeWriterFame, crew: 0 }[slot] || 0;
    return { quality, hype: Math.round(t.fame * hypeWeight * talentReach(t, region)) };
  }
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
      skill: skill, fame: clamp(Math.round(rnd(1, 73) * Math.pow(Math.random(), 0.75)), 0, 100), reliability: rint(35, 90),
      homeRegion: pick(CONTENT.REGIONS).id, career: { recent: [], trend: 'Newcomer', peakSkill: skill, peakFame: 0, projects: 0, lastActiveWeek: null, plateauUntil: 0 },
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
    // Independent price drivers: star recognition commands a marketing premium;
    // craftsmanship commands a separate creative fee. No tier-based multiplier or gate.
    const craftRate = 0.55 + t.skill / 95;
    const visibilityRate = 0.6 + t.fame / 58;
    const base = T.roleBase[t.role] * Math.pow(2.0 * craftRate * visibilityRate, 1.55);
    // Acclaimed studios get a modest negotiation edge; fee remains driven by the artist.
    const repDiscount = state ? Math.min(0.06, (state.studio.fame + state.studio.criticsRep + (state.studio.prestige || 0)) * 0.00018) : 0;
    // Relationship affects future negotiations modestly: trust reduces friction,
    // serious disputes may increase the fee; nobody is guaranteed to sign.
    const bondRate=state?1-clamp((talentBond(t)-50)*.0014,-.05,.05):1;
    return round50(base * (T.formatFeeMult[format] || 1) * traitMods(t).feeMult * (1 - dealDiscount()) * (1 - repDiscount) * bondRate);
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
    const industry=v14Identity('you');
    const smallBenefit=(t.role==='director'||t.role==='writer')&&
      ['prestige','incubator','indie'].includes(industry?.primary)?0.025:0;
    const chance = elite ? clamp(0.78 + rep + smallBenefit + (fit ? 0.12 : 0) + storyFit + script + payFit -
      Math.max(0, t.skill - 55) * 0.009 - Math.max(0, t.fame - 45) * 0.0035, 0.25, 0.97) : 1;
    return { chance: Math.round(chance * 100) / 100, elite: elite, reason: fit ? 'Genre affinity' : 'Studio track record and creative fit' };
  }
  function recruitmentCooldown(t) {
    return state.recruitment && state.recruitment.declined && state.recruitment.declined[t.id] > state.week ? state.recruitment.declined[t.id] - state.week : 0;
  }
  function salaryOf(t) {
    return Math.round(talentFee(t, 'feature') * TUNING.contracts.salaryYearFactor / TUNING.weeksPerYear);
  }
  function talentProject(t) { return activeProjects().find(p => SLOTS.some(s => p.cast[s] === t.id) ||
    (p.supporting || []).includes(t.id) || (p.specialists || []).includes(t.id)) || null; }
  function isRoster(t) { return !!(t.contract && t.contract.type === 'exclusive'); }
  function isRivalTalent(t) { return !!(t.contract && t.contract.type === 'rival'); }
  function talentStatus(t) {
    const p = talentProject(t);
    if (isRoster(t)) return { label: p ? 'Roster · on "' + p.title + '"' : 'Roster', projectId: p ? p.id : null, roster: true };
    if (isRivalTalent(t)) return { label: 'At ' + rivalName(t.contract.rivalId) + (p ? ' · finishing "' + p.title + '"' : ''), projectId: p ? p.id : null, roster: false, rivalId: t.contract.rivalId };
    return p ? { label: 'On "' + p.title + '"', projectId: p.id, roster: false } : { label: 'Available', projectId: null, roster: false };
  }
  function careerEvent(t, type, text, filmId) {
    if (!t || !['director','writer'].includes(t.role)) return;
    const c=ensureCareer(t);
    c.timeline=c.timeline||[];
    if(c.timeline.some(x=>x.week===state.week&&x.type===type&&x.filmId===filmId)) return;
    c.timeline.push({week:state.week,type,text:String(text).slice(0,180),filmId:filmId||null});
    c.timeline=c.timeline.slice(-45); // bound storage on long campaigns
  }
  function talentCareer(id) {
    const t=getTalent(id);
    if(!t || !['director','writer'].includes(t.role))return null;
    const films=filmHistory().filter(f=>f.creditIds && (f.creditIds[t.role]===t.id));
    const timeline=(t.career&&t.career.timeline||[]).slice().sort((a,b)=>b.week-a.week);
    return {id:t.id,role:t.role,recognition:recognition(t),films:films.map(f=>({id:f.id,title:f.title,studio:f.studio,year:f.year,
      critic:f.critic,audience:f.audience,result:f.result,awards:(f.awards||[]).filter(a=>a.personId===t.id),format:f.format,genre:f.genre})),
      timeline,awards:(t.awardHistory||[]).slice().reverse(),totalCredits:films.length};
  }
  function ensureCareer(t) {
    if (!t.career) t.career = { recent: [], trend: 'Established', peakSkill: t.skill, peakFame: t.fame, projects: (t.credits || []).length, lastActiveWeek: null, plateauUntil: 0 };
    if (!Array.isArray(t.career.recent)) t.career.recent = [];
    if (['director','writer'].includes(t.role) && !Array.isArray(t.career.timeline))t.career.timeline=[];
    return t.career;
  }
  function growTalentSkill(t, p) {
    const c = ensureCareer(t), before = t.skill;
    const experience = c.projects || 0, ready = c.plateauUntil <= state.week;
    const potential = clamp(0.68 - Math.max(0, t.skill - 68) * 0.014 - Math.max(0, experience - 8) * 0.011, 0.08, 0.68);
    const goodWork = p && p.quality >= 77 ? 0.12 : 0;
    const breakthrough = p && p.quality >= 82 && Math.random() < 0.07;
    const learned = ready && Math.random() < (potential + goodWork) ? (breakthrough ? rint(2, 4) : rint(1, 2)) * traitMods(t).growth : 0;
    t.skill = clamp(Math.round(t.skill + learned), 1, 95);
    c.projects = experience + 1;
    c.lastActiveWeek = state.week;
    c.peakSkill = Math.max(c.peakSkill || before, t.skill);
    if (t.skill > before) c.trend = breakthrough ? 'Breakthrough' : 'Improving';
    if(breakthrough && t.skill>before)careerEvent(t,'breakthrough','Creative breakthrough on "'+(p&&p.title||'a production')+'".',p&&('player:'+p.id));
    else c.trend = t.skill >= 76 ? 'At their peak' : 'Steady';
    if (experience > 8 && Math.random() < 0.09) { c.plateauUntil = state.week + rint(26, 78); c.trend = 'Plateau'; }
    c.recent.push({ week: state.week, film: p ? p.title : '', skill: t.skill, fame: t.fame });
    c.recent = c.recent.slice(-6);
    return t.skill - before;
  }
  function addTalentFame(p) {
    const gain = TUNING.talent.fameGain[p.result] || 0;
    castTalent(p).forEach(t => {
      const c = ensureCareer(t), before = t.fame;
      const criticalNotice = p.critic >= 82 && Math.random() < 0.45 ? rint(1, 3) : 0;
      const weakReception = p.critic < 38 && t.fame > 45 ? 1 : 0;
      const delta = Math.round(gain * (gain > 0 ? Math.min(1.3, traitMods(t).growth) : 1)) + criticalNotice - weakReception;
      t.fame = clamp(t.fame + delta, 0, 100);
      c.peakFame = Math.max(c.peakFame || before, t.fame);
      if (t.fame - before >= 5) c.trend = 'Rising star';
      else if (t.fame < before) c.trend = 'Cooling off';
      starMilestone(t, before, p);
      if (isRoster(t) && (p.result === 'Hit' || p.result === 'Won')) t.contract.morale = clamp((t.contract.morale == null ? TUNING.rivals.morale.start : t.contract.morale) + TUNING.rivals.morale.hitBonus, 0, 100);
    });
  }
  function starMilestone(t, before, p) {
    const m = TUNING.news.starFame.filter(n => before < n && t.fame >= n).pop();
    if (m) { addLog(t.name + ' is now a household name (fame ' + t.fame + ') after "' + p.title + '".', 'star');
      careerEvent(t,'recognition','Recognition reaches fame '+m+' after "'+p.title+'".','player:'+p.id);
    }
  }
  function talentTick() {
    if (state.week % 13 === 0) {
      const n = rint(TUNING.talent.newPerQuarter[0], TUNING.talent.newPerQuarter[1]);
      for (let i = 0; i < n; i++) makeTalent(randomRole());
      const free = state.talent.filter(t => !t.contract && !t.credits.length && !(t.worldCredits||[]).length && !talentProject(t));
      let extra = state.talent.length - TUNING.talent.maxPool;
      while (extra > 0 && free.length) {
        const t = free.splice(Math.floor(Math.random() * free.length), 1)[0];
        state.talent.splice(state.talent.indexOf(t), 1);
        extra--;
      }
    }
    if (dateOf().week === 1 && state.week > 0) {
      state.talent.forEach(t => {
        const c = ensureCareer(t);
        const idle = c.lastActiveWeek == null ? state.week - (t.joinedWeek || 0) : state.week - c.lastActiveWeek;
        if (idle > 104) {
          const before = t.fame;
          t.fame = clamp(t.fame - rint(0, idle > 260 ? 3 : 2), 0, 100);
          if (before > t.fame) c.trend = 'Out of the spotlight';
          if (idle > 208 && t.skill > 45 && Math.random() < 0.22) { t.skill--; c.trend = 'Seeking a comeback'; }
        } else if (c.lastActiveWeek != null && idle < 52 && c.trend === 'Out of the spotlight') c.trend = 'Back in action';
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
    careerEvent(t,'contract','Signed with '+state.studio.name+'.');
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
    careerEvent(t,'contract','Contract renewed with '+state.studio.name+'.');
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
    careerEvent(t,'contract','Departed '+state.studio.name+'.');
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
  function ensembleCaps(format, tier) {
    if (format !== 'feature') return {supporting:0,specialists:0,backgroundCrew:0};
    const support = [0,0,1,2,3,3][tier] || 0;
    const specialists = [0,0,1,1,2,3][tier] || 0;
    return {supporting:support,specialists,backgroundCrew: Math.min(2,Math.max(0,tier-1))};
  }
  function extraIds(o, key) {
    return (Array.isArray(o && o[key]) ? o[key] : []).filter(v=>v!==''&&v!==null&&v!=='none')
      .map(Number).filter(Number.isInteger);
  }
  function castTalent(p) {
    const ids = SLOTS.map(s=>p.cast[s]).concat(extraIds(p,'supporting'),extraIds(p,'specialists'));
    return [...new Set(ids.filter(v=>typeof v==='number'))].map(getTalent).filter(Boolean);
  }
  function entourageContribution(p) {
    const T=TUNING.talent;
    const support=extraIds(p,'supporting').map(getTalent).filter(Boolean), crew=extraIds(p,'specialists').map(getTalent).filter(Boolean);
    const q1=support.reduce((sum,t,i)=>sum+Math.max(0,t.skill-T.emptySkill)*T.ensembleQuality/(1+i*.7),0);
    const q2=crew.reduce((sum,t,i)=>sum+Math.max(0,t.skill-T.emptySkill)*T.specialistQuality/(1+i*.7),0);
    const hype=support.reduce((sum,t,i)=>sum+t.fame*T.ensembleHype*talentReach(t,homeRegion())/(1+i*.65),0);
    const crewPackage=clamp(Number(p.backgroundCrew)||0,0,2);
    return {quality:Math.round((q1+q2+crewPackage*T.backgroundCrewQuality)*10)/10,hype:Math.round(hype*10)/10};
  }
  function castCheck(cast, format, o) {
    o=o||{};
    const caps=ensembleCaps(format,o.tier||0), supporting=extraIds(o,'supporting'), specialists=extraIds(o,'specialists');
    const backgroundCrew=Number(o.backgroundCrew)||0;
    if(supporting.length>caps.supporting||specialists.length>caps.specialists||!Number.isInteger(backgroundCrew)||backgroundCrew<0||backgroundCrew>caps.backgroundCrew)
      return {reason:'That budget cannot support this ensemble size.',fees:0};
    const all=SLOTS.map(s=>cast[s]).filter(v=>typeof v==='number').concat(supporting,specialists);
    if(new Set(all).size!==all.length) return {reason:'An artist can only fill one role per film.',fees:0};
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
    for(const [key,role] of [['supporting','actor'],['specialists','crew']]) {
      for(const id of extraIds(o,key)) {
        const t=getTalent(id);
        if(!t||t.role!==role) return {reason:'Invalid additional '+role+' selection.',fees:0};
        if(isRivalTalent(t)) return {reason:t.name+' works for a rival studio.',fees:0};
        if(!isRoster(t)&&recruitmentCooldown(t)) return {reason:t.name+' recently declined a project.',fees:0};
        const busy=talentProject(t);
        if(busy) return {reason:t.name+' is busy on "'+busy.title+'".',fees:0};
        if(!isRoster(t)) fees+=talentFee(t,format);
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
      opts.push({ id: t.id, name: t.name, skill: t.skill, fame: t.fame, recognition: recognition(t).name, homeRegion: t.homeRegion, trend: t.career && t.career.trend,
        contribution: talentContribution(t, slot, genre, state.studio.homeRegion), fee: isRoster(t) ? 0 : talentFee(t, format), roster: isRoster(t),
        busy: busy || (!isRoster(t) && recruitmentCooldown(t) ? 'Declined for ' + recruitmentCooldown(t) + ' weeks' : null),
        interest: interest.chance, elite: interest.elite, affinity: t.affinity, specialty: t.specialty });
    });
    return opts;
  }
  function castSummary(p) {
    const base=SLOTS.map(s => {
      const v = p.cast[s];
      let name = 'Local hire', skill = TUNING.talent.emptySkill;
      if (v === 'founder') { name = state.founder.name + ' (founder)'; skill = null; }
      else if (typeof v === 'number') { const t = getTalent(v); name = t ? t.name : (p.castNames[s] || 'Unknown'); skill = t ? t.skill : null; }
      const t = typeof v === 'number' ? getTalent(v) : null;
      return { slot: s, label: CONTENT.SLOT_LABELS[s], id: v, name, skill, fame: t ? t.fame : 0, recognition: t ? recognition(t).name : 'Local hire' };
    });
    for (const [key,label] of [['supporting','Supporting actor'],['specialists','Specialist crew']])
      extraIds(p,key).forEach((id,i)=>{
        const t=getTalent(id);
        base.push({slot:key,label:label+' '+(i+1),id,name:t?t.name:'Former collaborator',skill:t?t.skill:null,
          fame:t?t.fame:null,recognition:t?recognition(t).name:'Not recorded'});
      });
    return base;
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
  function sequelEligibility(id) {
    const parent=getProject(id);
    if(!parent||parent.releaseWeek==null||!['short','feature','pilot'].includes(parent.format))
      return {ok:false,reason:'Only an already released, player-owned story can be continued.'};
    const known=parent.result==='Hit'||parent.result==='Picked up'||parent.result==='Won'||
      (parent.quality||0)>=65||(parent.critic||0)>=68||(parent.audience||0)>=72||
      (parent.festResults||[]).some(x=>/selection|prize|mention|won/i.test(x.result||''));
    if(!known)return {ok:false,reason:'This story needs an actual audience, critical, or festival foothold before a continuation.'};
    if(state.projects.some(p=>p.sequelOf===parent.id&&ACTIVE_STAGES.includes(p.stage)))
      return {ok:false,reason:'A continuation of this story is already in production.'};
    return {ok:true,parent};
  }
  // Historical cast links are stable IDs: names alone do not prove a returning artist.
  // Skill is never penalized by an actor change, only opening awareness.
  function sequelContinuity(parent, cast, supporting) {
    const notes = [], parentCast = parent && parent.cast || {};
    let hype = 0;
    for (const slot of ['lead','director','writer']) {
      const original = parentCast[slot], selected = cast && cast[slot];
      if (original == null || original === '' || (typeof original !== 'number' && original !== 'founder')) continue;
      const originalArtist = typeof original === 'number' ? getTalent(original) : null;
      const previous = parent.talentSnapshot && parent.talentSnapshot[slot];
      const fame = clamp(previous && previous.fame != null ? previous.fame : originalArtist && originalArtist.fame || 0, 0, 100);
      const returned = original === selected;
      const weight = slot === 'lead' ? 1 : slot === 'director' ? .45 : .3;
      const delta = returned ? Math.round((3 + fame * .07) * weight) : -Math.round((3 + fame * .10) * weight);
      hype += delta;
      notes.push({slot, originalId: original, originalName: previous && previous.name || originalArtist && originalArtist.name || (original === 'founder' ? state.founder.name : 'Original artist'),
        selectedId: selected, returned, delta, status: returned ? 'Returning' : selected ? 'Recast' : 'Not attached'});
    }
    const oldSupports=extraIds(parent,'supporting'), newSupports=extraIds({supporting},'supporting');
    oldSupports.slice(0,3).forEach(id=>{
      const previous=getTalent(id), wasBack=newSupports.includes(id);
      const fame=previous&&previous.fame||0;
      const delta=wasBack?1+Math.round(fame*.025):-1-Math.round(fame*.025);
      hype+=delta;
      notes.push({slot:'supporting',originalId:id,originalName:previous&&previous.name||'Original supporting performer',selectedId:wasBack?id:null,returned:wasBack,delta,status:wasBack?'Returning':'Not returning'});
    });
    const fans=filmFollowing(parent);
    const audienceLift=clamp(Math.round(Math.log10(1+fans.loyal)*1.35-2),0,6);
    if(audienceLift)notes.push({slot:'fans',originalName:'Existing loyal audience',returned:true,
      delta:audienceLift,status:'Returning audience'});
    hype+=audienceLift;
    return { hype: clamp(hype, -18, 18), notes, returningFans:fans.loyal, audienceLift };
  }
  function sequelCastSuggestion(parent) {
    const result = { director: null, writer: null, lead: null, crew: null };
    if (!parent) return result;
    for (const slot of ['director','writer','lead','crew']) {
      const id = parent.cast && parent.cast[slot];
      if (id === 'founder' && !isExecutive() && !founderProject()) result[slot] = 'founder';
      else if (typeof id === 'number') {
        const t = getTalent(id);
        if (t && t.role === SLOT_ROLE[slot] && !isRivalTalent(t) && !talentProject(t) && !recruitmentCooldown(t)) result[slot] = id;
      }
    }
    // Available supporting cast can return without occupying the lead slot.
    result.supporting=(parent.supporting||[]).filter(id=>{
      const t=getTalent(id);return t&&!isRivalTalent(t)&&!talentProject(t)&&!recruitmentCooldown(t);
    });
    return result;
  }

  // Followers are simulated interest, not unique measured admissions.
  // Derive them from the canonical film record so old saves require no invented history.
  function filmFollowing(p) {
    if(!state||!p||p.releaseWeek==null)return {active:0,loyal:0,trend:'Not released',status:'No following'};
    const reach=p.format==='feature'?filmAdmissions(p):
      p.format==='short'?shortAudience(p):
      (Number.isFinite(p.estimatedOnlineViews)?p.estimatedOnlineViews:estimatedTvHouseholds(p));
    const q=clamp(Number(p.quality)||0,0,100),a=clamp(Number(p.audience)||0,0,100);
    const qualityFit=clamp((q*.55+a*.45-42)/45,0,1.25);
    const honor=(p.awards||[]).filter(x=>x.won).length+(p.festResults||[]).filter(x=>x.kind==='winner').length;
    const awareness=Math.min(25000000,Math.max(0,reach||0))*.14*qualityFit*(1+Math.min(.15,honor*.025));
    const loyalty=clamp(.11+(q-55)*.005+(a-55)*.0035+Math.min(.1,honor*.018),.06,.52);
    const loyal0=Math.round(awareness*loyalty);
    const age=Math.max(0,state.week-p.releaseWeek);
    const durable=q>=78&&a>=70;
    const permanent=durable?.72:q>=68?.36:.10;
    const loyal=Math.round(loyal0*(permanent+(1-permanent)*Math.exp(-age/(durable?650:250))));
    const casual=Math.max(0,awareness-loyal0);
    const active=Math.round(loyal+casual*Math.exp(-age/(durable?105:64)));
    const status=age>=52&&q>=74&&loyal>=3500&&loyal/Math.max(1,active)>.42?
      'Cult classic':loyal>=8000?'Dedicated following':active>=8000?'Growing following':'Small following';
    return {active,loyal,trend:age<8?'Building':age>104&&durable?'Enduring':'Gradually cooling',status};
  }
  function studioFollowing(){
    if(!state)return {active:0,loyal:0,trend:'New studio'};
    const films=(state.projects||[]).filter(p=>p.releaseWeek!=null);
    const followers=films.map(filmFollowing).sort((a,b)=>b.active-a.active);
    const loyalty=films.map(filmFollowing).sort((a,b)=>b.loyal-a.loyal);
    // Shared moviegoers are not simply added twice across every film.
    const active=Math.round(followers.reduce((n,f,i)=>n+f.active/(1+i*.75),0));
    const loyal=Math.round(loyalty.reduce((n,f,i)=>n+f.loyal/(1+i*.95),0));
    return {active:Math.min(active,30000000),loyal:Math.min(loyal,12000000),
      trend:films.length>0?'Built through studio releases':'New studio'};
  }
  function franchiseFilms(fid) { return filmHistory().filter(f=>f.franchiseId===fid).sort((a,b)=>a.releaseWeek-b.releaseWeek); }
  function previewProject(o) {
    const f = TUNING.formats[o.format];
    if (!f) return { ok: false, reason: 'Pick a format.' };
    // v14.4 opt-in flexible projects; v13/legacy callers retain their exact rules.
    const flexible=o.budgetCap!=null && Number.isFinite(Number(o.budgetCap));
    const cap=flexible?Math.round(Number(o.budgetCap)):null;
    const tierIndex=flexible?f.tiers.reduce((best,t,i)=>t.budget<=cap&&state.studio.tier>=(t.minTier||0)?i:best,0):o.tier;
    const tier = f.tiers[tierIndex];
    if (!tier) return { ok: false, reason: 'Pick a budget tier.' };
    const cast = normalizeCast(o.cast);
    const cc = castCheck(cast, o.format,Object.assign({},o,{tier:tierIndex}));
    const weeks = flexible?Object.values(FinalCutBudget.stageWeeks(o.mediaVariant||o.format)).reduce((a,b)=>a+b,0):plannedWeeks(o.format);
    const script=v14ScriptQuote(o);
    const budget=flexible?cap:tier.budget;
    const backgroundCrew=Number(o.backgroundCrew)||0;
    const crewPackageCost=Math.round(budget*TUNING.talent.backgroundCrewShare*backgroundCrew);
    const fees = cc.fees + crewPackageCost;
    const prodBudget = budget - fees;
    const feasibility=flexible?FinalCutBudget.evaluate({variant:o.mediaVariant,format:o.format,scope:o.scope,
      cap:budget,fees,scriptFee:script.fee,plan:o.allocation,vision:o.vision}):null;
    const weekly = flexible?0:Math.round(Math.max(prodBudget, 0) / weeks);
    let reason = null;
    const tierName = i => (CONTENT.GROWTH_TIERS[i] || { name: 'tier ' + i }).name;
    if (activeProjects().length >= capacity()) reason = 'The studio is at capacity (' + capacity() + ' production' + (capacity() > 1 ? 's' : '') + '). Grow the studio for more.';
    else if (state.studio.tier < (f.minTier || 0)) reason = f.name + ' needs the ' + tierName(f.minTier) + ' tier.';
    else if (state.studio.fame < f.unlockFame) reason = 'Needs studio fame ' + f.unlockFame + '.';
    else if (state.studio.tier < (tier.minTier || 0)) reason = 'The ' + tier.name + ' budget needs the ' + tierName(tier.minTier) + ' tier.';
    else if (o.format === 'pilot' && tvSlotsUsed() >= growthTier().maxSeries) reason = 'No room for another show (' + growthTier().maxSeries + ' at this tier, pilots included).';
    else if (!o.title || !o.title.trim()) reason = 'Enter a title.';
    else if (o.sequelOf != null && !sequelEligibility(o.sequelOf).ok) reason=sequelEligibility(o.sequelOf).reason;
    else if (!byId(CONTENT.GENRES, o.genre)) reason = 'Pick a genre.';
    else if (!byId(CONTENT.TOPICS, o.topic)) reason = 'Pick a topic.';
    else if (!script.ok) reason=script.reason;
    else if (cc.reason) reason = cc.reason;
    else if (flexible&&(!Number.isSafeInteger(cap)||cap<250||cap>50000000)) reason='Enter a spending cap between $250 and $50 million.';
    else if (flexible&&(!o.mediaVariant||FinalCutBudget.media(o.mediaVariant)!==o.format)) reason='Select a valid media variant.';
    else if (flexible&&FinalCutBudget.variant(o.mediaVariant).minYear>dateOf().year) reason='That media format is not available in this era.';
    else if (flexible&&feasibility.unallocated<0) reason='Your planned allocations and fees exceed the spending limit.';
    else if (flexible&&Object.values(feasibility.plan).some(n=>n<0||!Number.isSafeInteger(n))) reason='Allocation amounts must be non-negative whole dollars.';
    else if (!flexible&&fees > tier.budget * TUNING.talent.maxFeeShare) reason = 'Talent fees are over ' + Math.round(TUNING.talent.maxFeeShare * 100) + '% of the budget. Pick cheaper talent or a bigger tier.';
    else if (state.cash < fees + script.fee + (flexible?Math.min(feasibility.plan.prep,Math.ceil(feasibility.plan.prep/Math.max(1,weeks))*2):weekly*2)) reason = 'Not enough cash for script, talent and the first two weeks.';
    return { ok: !reason, reason: reason, budget: budget, fees: fees, prodBudget: prodBudget, weeks: weeks, weekly: weekly,
      flexible,mediaVariant:flexible?o.mediaVariant:null,scope:flexible?(o.scope||'intimate'):null,
      tier:tierIndex,feasibility,allocation:feasibility?feasibility.plan:null,
      prodQuality: flexible?Math.max(0.4,feasibility.adequacy):prodQualityMult(budget, fees),
      cashAfter: state.cash - (flexible?fees+script.fee+(feasibility.allocated-feasibility.plan.reserve):budget+script.fee),
      scriptFee:script.fee||0,scriptPitch:script.pitch||null,
      continuity: o.sequelOf == null ? null : sequelContinuity(getProject(o.sequelOf),cast,o.supporting),
      extraFees:cc.fees, crewPackageCost };
  }
  function startProject(o) {
    if (!state || state.gameOver) return { ok: false, reason: 'No game running.' };
    const pv = previewProject(o);
    if (!pv.ok) return pv;
    if(pv.scriptPitch?.contested&&pv.scriptPitch.rivalId&&o.pitchApproach!=='buyout'){
      const chance=o.pitchApproach==='partner'?.08:.20;
      if(Math.random()<chance){
        const rival=getRival(pv.scriptPitch.rivalId);
        if(rival&&rival.cash>=pv.scriptPitch.fee){
          rival.cash-=pv.scriptPitch.fee;
          pv.scriptPitch.claimedBy='rival:'+rival.id;
          v14RivalIncident('script',rival,null,'Outbid the player for "'+pv.scriptPitch.title+'".');
          addLog(rival.name+' outbid your offer for "'+pv.scriptPitch.title+
            '". The studio paid '+fmtMoney(pv.scriptPitch.fee)+' for the rights.','rival');
          save();return {ok:false,reason:rival.name+' secured the contested screenplay. No player cash was charged.'};
        }
      }
    }
    const f = TUNING.formats[o.format];
    const cast = normalizeCast(o.cast);
    const supporting=extraIds(o,'supporting'), specialists=extraIds(o,'specialists');
    // Chance to secure an elite artist is checked once per offer, before any cost is paid.
    // A declined offer has a short cooldown to avoid unlimited retrying in the same week.
    for (const t of [...SLOTS.map(slot=>cast[slot]),...supporting,...specialists].filter(x=>typeof x==='number').map(getTalent).filter(Boolean)) {
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
    const parent = o.sequelOf != null ? getProject(o.sequelOf) : null;
    const seriesId = parent ? (parent.franchiseId || 'player:'+parent.id) : null;
    const installment = parent ? 1 + state.projects.reduce((n,x) => (x.id === parent.id || x.franchiseId === seriesId) ? Math.max(n,x.installment || 1) : n, 0) : 1;
    const p = {
      id: state.nextId++, title: o.title.trim().slice(0, 60), format: o.format, genre: o.genre, topic: o.topic, tier: pv.tier,
      budget: pv.budget, fees: pv.fees, prodBudget: pv.prodBudget, weekly: pv.weekly, spent: pv.fees, marketingSpend: 0,
      mediaVariant:pv.mediaVariant||o.format,productionScope:pv.scope||null,
      requestedEpisodes:pv.flexible?clamp(Math.round(Number(o.episodeCount)||8),4,16):null,
      budgetPlan:pv.flexible?{cap:pv.budget,allocation:Object.assign({},pv.allocation),
        spent:{prep:0,shoot:0,post:0,marketing:0,distribution:0,reserve:0},
        stageWeeks:FinalCutBudget.stageWeeks(pv.mediaVariant),
        feasibility:pv.feasibility.level,qualityEffect:pv.feasibility.qualityEffect,
        delayWeeks:pv.feasibility.delayWeeks}:null,
      cast: cast, castNames: castNames, supporting, specialists,
      backgroundCrew:Number(o.backgroundCrew)||0, regions: [state.studio.homeRegion || 'northamerica'], regionalGross: {}, regionalRevenue: {}, distributionCost: 0,
      stage: 'development', stageWeeksLeft: pv.flexible?FinalCutBudget.stageWeeks(pv.mediaVariant).development:f.stages.development, startWeek: state.week,
      sequelOf: parent ? parent.id : null, franchiseId: seriesId, installment: installment, franchiseName: parent ? (parent.franchiseName || parent.title) : null,
      continuationType:parent?(o.continuationType|| (parent.format!==o.format?'adaptation':'direct')):null,
      sourceMedia:parent?(parent.mediaVariant||parent.format):null,
      qualityMod: 0, hypeMod: 0, usedEvents: [], lastEventWeek: -99, lastSlipWeek: -99, flags: {},
      quality: null, hype: null, critic: null, releaseWeek: null, weeksInRelease: 0,
      opening: 0, gross: 0, revenue: 0, festival: null, result: null,
      estimatedAdmissions: 0, estimatedScreeningViewers:null, estimatedHouseholdImpressions:null,
      performanceHistory: [], lastWeekRevenue: 0,
      dna:dnaFor(o),story:[],storyChoices:0,releasePosition:V14_RELEASE_PLANS[o.releasePosition]?o.releasePosition:'wide'
    };
    filmStory(p,'greenlight','Committed to '+V14_VISIONS[p.dna.vision].name.toLowerCase()+' filmmaking, emphasizing '+p.dna.strengths.map(id=>V14_TAGS[id]).join(' and ')+'.');
    if (parent) {
      // Put the originating film into the same permanent franchise history.
      if (!parent.franchiseId) { parent.franchiseId = seriesId; parent.franchiseName = parent.title; parent.installment = 1; }
      // Recognition improves opening awareness but increasing installments face diminishing novelty.
      p.hypeMod += Math.max(1, 10-Math.max(0,installment-2)*2);
      p.qualityMod -= Math.max(0,installment-2)*1.5;
      p.franchiseExpectation = Math.max(0,(parent.critic||0)-60) * .08 + Math.max(0,installment-2)*2;
      // A franchise provides awareness, never an inherited quality score or guaranteed result.
      if(p.continuationType==='spinoff')p.hypeMod-=2;
      if(p.continuationType==='adaptation')p.hypeMod-=3;
      p.hypeMod -= Math.max(0,installment-3)*2;
      p.continuity = sequelContinuity(parent,cast,supporting);
      p.hypeMod += p.continuity.hype;
    }
    if(pv.scriptPitch){
      pv.scriptPitch.claimedBy='you';p.spent+=pv.scriptFee;p.scriptFee=pv.scriptFee;
      const boon=v14State().offers.find(x=>!x.used&&x.expiresWeek>=state.week);
      if(boon&&['newvoices','prestige','genre'].includes(boon.id)){boon.used=true;
        filmStory(p,'ambition','An earned studio introduction helped secure this screenplay.');}
      if(pv.scriptPitch.contested && pv.scriptPitch.rivalId){
        const rival=getRival(pv.scriptPitch.rivalId);
        if(rival)filmStory(p,'rival','Acquired a contested screenplay before '+rival.name+'.');
      }
      filmStory(p,'script','Acquired '+pv.scriptPitch.title+' for '+fmtMoney(pv.scriptFee)+'; story: '+pv.scriptPitch.hook);
    }
    state.cash -= pv.fees + (pv.scriptFee||0);
    if(pv.scriptFee)state.finance.q.production+=pv.scriptFee; // report actual screenplay rights expense
    castTalent(p).forEach(t => { if (!isRoster(t)) t.contract = { type: 'project', projectId: p.id }; });
    state.projects.push(p);
    const hires = castTalent(p).map(t => t.name);
    addLog('Greenlit "' + p.title + '" (' + f.name + ', ' + byId(CONTENT.GENRES, p.genre).name + ', ' + fmtMoney(p.budget) + ')' +
      (hires.length ? '. Attached: ' + hires.join(', ') + (p.fees ? ' (fees ' + fmtMoney(p.fees) + ')' : '') : '') + '.', 'project');
    save();
    emit('project', p);
    return { ok: true, project: p };
  }
  function setPosterStyle(id,styleId) {
    const p=getProject(id);if(!p)return {ok:false,reason:'Film not found.'};
    if(!Number.isInteger(styleId)||styleId<0||styleId>7)return {ok:false,reason:'Invalid design.'};
    p.posterStyleId=styleId;save();emit('poster',p);return {ok:true};
  }
  function randomTitle(genre, topic) {
    const t=CONTENT.TITLES, used=new Set();
    const normalize=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
    if(state){
      (state.projects||[]).forEach(p=>used.add(normalize(p.title)));
      ((state.filmArchive&&state.filmArchive.rivals)||[]).forEach(f=>used.add(normalize(f.title)));
      ((state.v14&&state.v14.pitches)||[]).forEach(p=>used.add(normalize(p.title)));
      ((state.rivals&&state.rivals.list)||[]).forEach(s=>(s.films||[]).forEach(f=>used.add(normalize(f.title))));
    }
    const preferred=genre==='horror'?['Dark','Hollow','Hidden','Last','Strange','Midnight','Bitter','Silent']:
      genre==='comedy'?['Familiar','Second','Ordinary','Wild','Borrowed','Golden']:
      genre==='drama'?['Unfinished','Tender','Forgotten','Quiet','Distant','Last']:
      genre==='scifi'?['Electric','Glass','Neon','Silver','Endless','Distant']:null;
    const generate=()=>pick(t.patterns).replace(/\{(adj|noun2|noun|place)\}/g,(_,tag)=>
      tag==='adj'?pick(preferred&&Math.random()<.6?preferred:t.adjectives):
      tag==='place'?pick(t.places):pick(t.nouns));
    let candidate='';
    for(let attempt=0;attempt<80;attempt++){
      candidate=generate();
      if(!used.has(normalize(candidate)))return candidate;
    }
    // Fallback remains original rather than modifying user-entered titles.
    return candidate+' '+(state?state.week+1:Math.ceil(Math.random()*999));
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
      const chance = ((100 - effReliability(t)) / 100 * TUNING.talent.slipChance + traitMods(t).delayChance) / (1 + deptBonus('production') + (p.backgroundCrew||0)*0.22);
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
      if ((p.format === 'feature' || p.format === 'short') && !p.flags.regionsDone) { raiseDistribution(p); return; }
      if (p.format === 'feature' && !p.flags.dateDone) { raiseReleaseDate(p); return; }
      release(p);
      return;
    }
    p.stage = ACTIVE_STAGES[ACTIVE_STAGES.indexOf(p.stage) + 1];
    const planned=p.budgetPlan?p.budgetPlan.stageWeeks[p.stage]:f.stages[p.stage];
    p.stageWeeksLeft = planned + (p.stage === 'post' ? postWeeksAdj(p) + eraMods().postWeeks : 0) +
      (p.stage === 'shoot'&&p.budgetPlan?p.budgetPlan.delayWeeks||0:0);
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
    return clamp(t.skill + mentor + lifecycleBondBonus(t), 0, 100);
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
    const T = TUNING.talent, tier = TUNING.formats[p.format].tiers[p.tier];
    const roles = {};
    SLOTS.forEach(slot => { roles[slot] = Math.round(slotSkill(p, slot) * T.weights[slot] * 10) / 10; });
    // Allocated stage resources, not the fixed old tier, determine new films' craft.
    const production=p.budgetPlan?clamp(7+Math.log10(Math.max(250,v144EffectiveBudget(p))/1000)*3+
      (p.budgetPlan.qualityEffect||0),-7,24):tier.quality * prodQualityMult(p.budget, p.fees || 0);
    const ensemble=entourageContribution(p);
    const story = topicFit(p), creative = talentBonus(p, 'quality') + crewEffect(p, 'quality');
    const staff = deptBonus('development'), era = eraQuality(p.genre),
      // Authored paid scripts have modest readiness (+1; +2 when the creative
      // vision stays aligned). The outcome is still driven by craft and luck.
      scriptReadiness = p.scriptFee>0&&p.dna?.origin==='marketplace' ? (p.dna.scriptVision===p.dna.vision?2:1) : 0,
      decisions = (p.qualityMod||0)+(p.dna?(V14_VISIONS[p.dna.vision]?.quality||0):0)+clamp(v14Chemistry(p)*.6,-2.4,2.4), variance = rnd(-8, 8);
    const raw = T.baseQuality + Object.values(roles).reduce((a,v)=>a+v,0) + production + story + creative + ensemble.quality + staff + era + decisions + scriptReadiness + variance;
    const result = clamp(Math.round(softCap(raw, TUNING.softCap.quality)), 1, 100);
    p.qualityBreakdown = { base:T.baseQuality, roles, ensemble:ensemble.quality, production:Math.round(production*10)/10, story, creative, staff:Math.round(staff*10)/10, era, decisions, scriptReadiness, variance:Math.round(variance*10)/10, raw:Math.round(raw*10)/10, result };
    return result;
  }
  function castFame(p, slot) { const v = p.cast[slot]; const t = typeof v === 'number' ? getTalent(v) : null; return t ? t.fame : 0; }
  function computeHype(p) {
    const T = TUNING.talent, markets = p.regions && p.regions.length ? p.regions : [homeRegion()];
    const credits = {};
    ['lead','director','writer'].forEach(slot => {
      const t = typeof p.cast[slot] === 'number' ? getTalent(p.cast[slot]) : null;
      const weight = {lead:T.hypeLeadFame, director:T.hypeDirectorFame, writer:T.hypeWriterFame}[slot];
      credits[slot] = t ? t.fame * weight * markets.reduce((sum,r)=>sum+talentReach(t,r),0)/markets.length : 0;
    });
    const studio = state.studio.fame * T.hypeStudioFame + founderHype() + (state.reputation?state.reputation.buzz*TUNING.reputation.buzzHype:0);
    const publicity = talentBonus(p, 'hype') + crewEffect(p, 'hype') + deptBonus('marketing') + (state.studio.prestige || 0) * TUNING.awards.prestigeHype;
    const ensemble=entourageContribution(p);
    const earnedFans=studioFollowing();
    const studioFanHype=clamp(Math.floor(Math.log10(1+earnedFans.loyal)-3),0,3);
    const raw = studio + Object.values(credits).reduce((a,b)=>a+b,0) + publicity + ensemble.hype + p.hypeMod + studioFanHype +
      (p.dna?(V14_VISIONS[p.dna.vision]?.hype||0):0) + rnd(-5, 5);
    const result = clamp(Math.round(softCap(raw, TUNING.softCap.hype)), 0, 100);
    p.hypeBreakdown = { studio: Math.round(studio), roles: Object.fromEntries(Object.entries(credits).map(([k,v])=>[k,Math.round(v*10)/10])), publicity:Math.round(publicity), ensemble:ensemble.hype, studioFans:studioFanHype, decisions:p.hypeMod, result };
    return result;
  }

// ===== SECTION: DECISIONS =====
  function raise(p, def, t) {
    const pend = {
      projectId: p.id, id: def.id, talentId: t ? t.id : null, text: fill(def.text, p, t),
      lifecyclePhase: def.lifecyclePhase || null,
      category: def.category || null, disaster: !!def.disaster,
      choices: def.choices.map(c => ({ label: c.label, effects: c.effects || {}, trust:c.trust||0, flag:c.flag||null,
        lifecycleTag:c.tag||null, relationship:c.relationship||0,
        result: c.result ? fill(c.result, p, t) : null }))
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

  // A sparse shared-history record; actors keep existing credits only.
  function v14PairKey(p){
    if(!p||!p.cast)return null;
    const d=p.cast.director,w=p.cast.writer;
    if(d==null||w==null||d===''||w===''||(d==='founder'&&w==='founder'))return null;
    return [String(d),String(w)].join(':');
  }
  function v14Chemistry(p){
    const key=v14PairKey(p),t=key&&v14State().partnerships[key];
    return t?clamp(Number(t.trust)||0,-4,4):0;
  }
  function v14PartnershipOutcome(p){
    const key=v14PairKey(p);if(!key||p.partnershipCommitted)return;
    const partners=v14State().partnerships,old=partners[key]||{count:0,trust:0,week:0};
    const delta=Number(p.v14TrustDelta)||0;
    const next={count:old.count+1,trust:clamp(old.trust+delta+(p.quality>=73?1:0),-4,4),week:state.week};
    partners[key]=next;p.partnershipCommitted=true;
    // Preserve only the most recently active partnership records.
    const keys=Object.keys(partners);if(keys.length>36)keys.sort((a,b)=>partners[a].week-partners[b].week)
      .slice(0,keys.length-36).forEach(id=>delete partners[id]);
    if(next.count>1)filmStory(p,'partnership','Returning writer/director partnership '+(next.trust>=0?'builds':'strains')+
      ' trust ('+next.count+' films together).');
  }
  const V14_STORY_ISSUES={
    narrow:['The intended audience looks smaller than expected. The team wants to reconsider the central scene.',
      ['Protect the distinctive story','Try a measured rewrite','Make a commercial compromise']],
    difficult:['A location problem threatens the shoot and the director disagrees with the producer.',
      ['Rework the scene creatively','Add a week for the original plan','Simplify the set']],
    controversial:['The leading players disagree about whether a risky scene should stay.',
      ['Protect the writer’s intent','Hold a mediated rehearsal','Soften the confrontation']],
    untested:['Early footage suggests the unusual approach may divide viewers.',
      ['Trust the experiment','Arrange a careful reshoot','Favor accessible storytelling']],
    expensive:['An ambitious sequence is consuming more of the budget than planned.',
      ['Solve it with a practical effect','Fund a careful extension','Scale back the sequence']],
    marketing:['The trailer team cannot explain why the film is worth watching.',
      ['Lead with its unusual premise','Work with the writer on a new hook','Promote the star instead']]
  };
  function v14IssueDefinition(p){
    const risk=p.dna&&p.dna.risk||'untested',row=V14_STORY_ISSUES[risk]||V14_STORY_ISSUES.untested;
    const pct=p.format==='short'?.015:.025;
    return {id:'v14_issue_'+risk,stage:'shoot',category:'production',text:row[0]+' ("{title}")',
      choices:[
        {label:row[1][0],effects:{quality:2,hype:-1},trust:1,flag:'authentic',result:'The creative team keeps its promise but accepts narrower initial appeal.'},
        {label:row[1][1],effects:{quality:2,weeks:1,costPct:pct},trust:1,flag:'supported',result:'A careful compromise improves the craft while adding real cost and time.'},
        {label:row[1][2],effects:{quality:-1,hype:3},trust:-1,flag:'accessible',result:'The project moves faster toward mass appeal, but a creative disagreement lingers.'}
      ]};
  }
  function v14Choice(p,pd,c){
    if(!p||!p.dna)return;
    if(pd.id&&pd.id.startsWith('v14_issue_')){
      p.dna.choiceFlags=p.dna.choiceFlags||[];
      if(c.flag&&!p.dna.choiceFlags.includes(c.flag))p.dna.choiceFlags.push(c.flag);
      p.v14TrustDelta=clamp((p.v14TrustDelta||0)+(c.trust||0),-4,4);
      filmStory(p,'production',c.result||c.label);
    }else if(pd.id==='cut'){
      filmStory(p,'post','The creative team settled the final cut: '+c.label+'.');
    }else if(pd.id==='release_date'){
      filmStory(p,'release','Positioned the release date against the current rival slate.');
    }else if(pd.category==='production'){
      filmStory(p,'production',c.result||c.label);
    }
    if(pd.category==='production'||(pd.id&&pd.id.startsWith('v14_issue_')))
      p.storyChoices=Math.min(5,(p.storyChoices||0)+1);
  }
  function v14MaybeIssue(p){
    if(!p.dna||p.flags.v14Issue||p.stage!=='shoot'||(p.storyChoices||0)>0)return false;
    p.flags.v14Issue=true;
    const def=v14IssueDefinition(p),policy=v14State().delegation;
    if(policy==='director'||policy==='commercial'){
      const selection=policy==='director'?0:2,choice=def.choices[selection];
      applyEffects(p,choice.effects);v14Choice(p,def,choice);
      p.usedEvents.push(def.id);
      addLog('Delegated "'+p.title+'" decision to '+policy+' policy: '+choice.result,'production');
      return true;
    }
    // raise preserves the existing one-decision-at-a-time queue and UI.
    raise(p,def);
    return true;
  }
  function v14SetDelegation(policy){
    if(!['ask','director','commercial'].includes(policy))return {ok:false,reason:'Invalid delegation setting.'};
    v14State().delegation=policy;save();emit('policy',{policy});return {ok:true};
  }


  // === v14.11 lifecycle storytelling ===
  // Film-level cadence: one event per early stage, at most two on long shoots,
  // one prerelease, one opening-window and one catalog follow-up. Old saves
  // acquire empty lifecycle records lazily without changing historic outcomes.
  const LIFECYCLE_CAP={short:5,feature:7,pilot:5};
  const LIFECYCLE_STAGE_CAP={development:1,preproduction:1,shoot:2,post:1,preRelease:1,release:1,afterRelease:1};
  function lifecycleData(p){
    if(!p.lifecycle||typeof p.lifecycle!=='object')
      p.lifecycle={counts:{},tags:[],history:[],lastWeek:-99};
    p.lifecycle.counts=p.lifecycle.counts||{};
    p.lifecycle.tags=p.lifecycle.tags||[];
    p.lifecycle.history=p.lifecycle.history||[];
    return p.lifecycle;
  }
  function talentBond(t){return clamp(Number(t.studioBond==null?50:t.studioBond),0,100);}
  function lifecycleBondBonus(t){return clamp(Math.round((talentBond(t)-50)/10),-3,3);}
  function lifecycleResolve(p,pd,c){
    if(!pd.lifecyclePhase)return;
    const data=lifecycleData(p),entry={
      week:state.week,phase:pd.lifecyclePhase,eventId:pd.id,choice:c.label,
      consequence:c.result||c.label,tag:c.lifecycleTag||null,
      relationship:Number(c.relationship)||0
    };
    if(c.lifecycleTag&&!data.tags.includes(c.lifecycleTag))
      data.tags.push(c.lifecycleTag);
    data.history.push(entry);
    if(data.history.length>16)data.history.splice(0,data.history.length-16);
    const rel=clamp(Number(c.relationship)||0,-4,4);
    if(rel){
      castTalent(p).forEach(t=>{
        t.studioBond=clamp(talentBond(t)+rel,0,100);
        if(isRoster(t))t.contract.morale=clamp((t.contract.morale==null?TUNING.rivals.morale.start:t.contract.morale)+rel,0,100);
      });
      p.lifecycleTrust=clamp((p.lifecycleTrust||0)+rel,-12,12);
    }
    // Consequences are recorded in the film's existing story timeline,
    // awards/ratings still use normal scoring; no guaranteed box-office boosts.
    filmStory(p,pd.lifecyclePhase,c.result||c.label);
    addLog('"'+p.title+'" · '+(c.result||c.label),'production');
  }
  function lifecycleQuote(id){
    const p=getProject(Number(id));
    if(!p)return {ok:false,reason:'Film not found.'};
    const data=lifecycleData(p);
    return {ok:true,history:data.history.slice(),tags:data.tags.slice(),
      decisions:data.history.length,limit:LIFECYCLE_CAP[p.format]||5,
      bonds:castTalent(p).map(t=>({id:t.id,name:t.name,bond:talentBond(t)}))};
  }
  function lifecyclePhase(p){
    if(p.stage==='done')return 'afterRelease';
    if(p.stage==='release')return 'release';
    if(p.stage==='post')return p.stageWeeksLeft<=1?'preRelease':'post';
    return p.stage;
  }
  function lifecycleTick(p){
    if(state.gameOver||state.pending||state.queue.length||!p)return false;
    const data=lifecycleData(p),phase=lifecyclePhase(p);
    const count=Object.values(data.counts).reduce((n,x)=>n+(x||0),0);
    if(count>=(LIFECYCLE_CAP[p.format]||5))return false;
    if((data.counts[phase]||0)>=(phase==='shoot'&&p.format==='feature'?2:1))return false;
    if(state.week-data.lastWeek<2||state.week-(p.lastEventWeek||-99)<2)return false;
    if(phase==='afterRelease'){
      if(p.releaseWeek==null||state.week-p.releaseWeek>35||state.week-p.releaseWeek<3)return false;
    }
    if(phase==='release'&&(p.weeksInRelease||0)>5)return false;
    // Long projects have more opportunities, shorter projects remain playable.
    const chances={development:.48,preproduction:.56,shoot:.48,post:.53,
      preRelease:.68,release:.36,afterRelease:.14};
    if(Math.random()>chances[phase])return false;
    const pool=(CONTENT.LIFECYCLE_EVENTS||[]).filter(ev=>
      ev.stage===phase&&!p.usedEvents.includes(ev.id)&&
      (!ev.formats||ev.formats.includes(p.format))&&
      (!ev.theme||ev.theme.includes(p.genre)||ev.theme.includes(p.topic))&&
      (!ev.requires||data.tags.includes(ev.requires))&&
      !((state.events.recentProduction||[]).slice(-5).includes(ev.id)));
    if(!pool.length)return false;
    const chosen=pool[Math.floor(Math.random()*pool.length)];
    const event=Object.assign({},chosen,{category:'production',lifecyclePhase:phase});
    raise(p,event);
    data.counts[phase]=(data.counts[phase]||0)+1;
    data.lastWeek=state.week;
    state.events.recentProduction=(state.events.recentProduction||[]).concat(chosen.id).slice(-12);
    return true;
  }
  function maybeEvent(p) {
    if (state.pending) return;
    if(p.dna){
      if(p.stage==='development')return; // the creative pitch is already the opening commitment
      if(v14MaybeIssue(p))return;
      if((p.storyChoices||0)>=(p.format==='feature'?2:1))return;
    }
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
    const pool=p.budgetPlan?p.budgetPlan.allocation.marketing:p.budget;
    raise(p, {
      id: 'marketing',
      text: p.budgetPlan?
        'Choose how much of your pre-approved marketing allocation to deploy for "'+p.title+'". The hype benefit depends on actual funding; reserve stays unspent.':
        'How much marketing for "'+p.title+'"? Spend is a share of the production budget.',
      choices: TUNING.marketing.map(m => {
        const share=p.budgetPlan?({none:0,small:.25,medium:.55,large:1}[m.id]||0):m.share;
        const h=p.budgetPlan?Math.round(m.hype*clamp((pool/Math.max(1,p.budget))/.25,0,1)):m.hype;
        return {label:m.name+(share?' ('+fmtMoney(pool*share)+', hype +'+h+')':' (no spending)'),
          effects:share?{marketing:share,hype:h}:{},
          result:'Marketing for "'+p.title+'": '+m.name+'.'};
      })
    });
  }
  function homeRegion() { return state && state.studio.homeRegion || 'northamerica'; }
  function regionQuote(p, list) {
    const home = homeRegion();
    const valid = CONTENT.REGIONS.map(r => r.id);
    const chosen = [home].concat((list || []).filter(id => id !== home && valid.includes(id)));
    const regions = Array.from(new Set(chosen));
    const year = dateOf().year;
    const eraCost = year < 1980 ? 1.35 : year < 2000 ? 1.15 : year < 2010 ? 1 : 0.85;
    const overseas = regions.filter(id => id !== home);
    const cost = overseas.reduce((n, id) => {
      const r = byId(CONTENT.REGIONS, id);
      return n + Math.round((p.format === 'short' ? (65 + p.budget * 0.012) : (750 + p.budget * 0.024)) * r.cost * eraCost);
    }, 0);
    const extra = overseas.reduce((n, id) => {
      const r = byId(CONTENT.REGIONS, id);
      return n + 0.16 * r.audience * (r.taste[p.genre] || 1);
    }, 0);
    return { regions: regions, cost: cost, openingMult: Math.round((1 + extra) * 100) / 100,
      estimated: p.format === 'short' ? 'Screening reach +' + Math.round(Math.min(.3, extra*.23)*100) + '% (modest short-film income)' : 'Potential opening ×' + (1 + extra).toFixed(2) + ' before extra cost' };
  }
  function setDistribution(id, regions) {
    const p = getProject(id);
    if (!p || !['feature','short'].includes(p.format) || ['release', 'done'].includes(p.stage))
      return { ok: false, reason: 'Distribution can only be changed before a film opens.' };
    const q = regionQuote(p, regions);
    p.regions = q.regions;
    save();
    return Object.assign({ ok: true }, q);
  }
  function raiseDistribution(p) {
    const home = homeRegion();
    const all = CONTENT.REGIONS.map(r => r.id);
    const wide = [home].concat(all.filter(id => id !== home).slice(0, 2));
    const isShort = p.format === 'short';
    const presets = [
      { name: 'Home only', regions: [home] },
      { name: isShort ? 'Regional short-film screening circuit' : 'Wide — home plus two overseas markets', regions: isShort ? [home, wide[1]] : wide },
      { name: isShort ? 'International short-film circuit' : 'Worldwide — all five regions', regions: all },
      { name: 'Keep chosen regions (' + (p.regions || [home]).length + ')', regions: p.regions || [home] }
    ];
    raise(p, { id: 'regions', text: 'Where should "' + p.title + '" be shown? ' + (isShort ? 'Short films earn modest screening and licensing income, not theatrical grosses. International exposure costs more and does not guarantee festival recognition.' : 'Overseas markets add possible earnings, localization costs, and recognition.') + ' Open the film details to customize your markets.',
      choices: presets.map(x => { const q = regionQuote(p, x.regions);
        return { label: x.name + ' · ' + fmtMoney(q.cost) + ' extra · ' + q.estimated,
          effects: { regions: q.regions }, result: 'Distribution for "' + p.title + '": ' + q.regions.map(id => byId(CONTENT.REGIONS, id).name).join(', ') + '.' }; }) });
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
    if (e.costPct) {
      const c=Math.round(p.budget*e.costPct);
      if(c<0){
        // Savings reduce future production charges; never create free cash
        // or undo already booked costs.
        p.lifecycleSavings=Math.min(Math.round(p.budget*.12),(p.lifecycleSavings||0)-c);
      }else if(c>0){
        if(!p.budgetPlan){
          state.cash-=c;p.spent+=c;
        }else if(!v144Pay(p,'reserve',c)){
          // Insufficient available reserve: requested improvement is not free.
          p.qualityMod=Math.max(-18,(p.qualityMod||0)-2);
        }
      }
    }
    if (e.marketing) { const c = Math.round((p.budgetPlan?p.budgetPlan.allocation.marketing:p.budget) * e.marketing);
      if(!p.budgetPlan){state.cash-=c;p.spent+=c;p.marketingSpend+=c;}
      else if(v144Pay(p,'marketing',c))p.marketingSpend+=c;
    }
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
      lifecycleResolve(p,pd,c);
      v14Choice(p,pd,c);
      if(pd.talentId!=null) {
        const participant=getTalent(pd.talentId);
        if(participant)careerEvent(participant,pd.disaster?'controversy':'production',c.result||c.label,'player:'+p.id);
      }
      p.usedEvents.push(pd.id);
      if (pd.id === 'cut') p.flags.cutDone = true;
      if (pd.id === 'marketing') p.flags.marketingDone = true;
      if (pd.id === 'regions') { p.flags.regionsDone = true; if (c.effects.regions) p.regions = c.effects.regions.slice(); }
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

// ===== SECTION: FILM_RECEPTION =====
  // Film reception is a deterministic saved snapshot after release; no ongoing
  // happiness meter and no extra weekly actions. Original critical score remains canonical.
  function audienceScore(f, demand) {
    const g = byId(CONTENT.GENRES, f.genre) || { audience:1 };
    const interest = typeof demand === 'number' ? demand : 1;
    return clamp(Math.round(f.quality * .65 + (f.hype || 0) * .20 +
      12 * (g.audience || 1) + 10 * (interest - 1) + rnd(-10,10)), 1, 100);
  }
  function receptionText(f) {
    const audience = f.audience == null ? f.critic : f.audience;
    const critic = f.critic == null ? f.quality : f.critic;
    let headline, reason;
    if (audience >= critic + 18) { headline = 'Audience favorite'; reason = 'Moviegoers responded more strongly than reviewers.'; }
    else if (critic >= audience + 18) { headline = 'Critical darling'; reason = 'Reviewers praised the craft more than general audiences did.'; }
    else if (critic >= 78 && audience >= 70) { headline = 'Breakout acclaim'; reason = 'Strong filmmaking connected with critics and moviegoers alike.'; }
    else if (critic < 45 && audience < 50) { headline = 'A difficult release'; reason = 'Both critical response and audience enthusiasm were muted.'; }
    else { headline = 'A mixed reception'; reason = 'Audiences and reviewers found different strengths in the finished film.'; }
    const causes = [];
    const breakdown=f.qualityBreakdown;
    if (breakdown) {
      const roles=breakdown.roles||{};
      if ((roles.director||0)+(roles.writer||0) >= 33) causes.push('the director and screenplay supplied strong craft');
      else if ((roles.director||0)+(roles.writer||0)<17) causes.push('limited creative experience held the production back');
      if (breakdown.story >= 6) causes.push('the topic suited its genre');
      if (breakdown.story < 0) causes.push('the genre and story were a difficult match');
      if (breakdown.production<5) causes.push('the production struggled with limited resources');
      if (breakdown.decisions>=5) causes.push('production decisions elevated the finished film');
      if (breakdown.decisions<=-4) causes.push('difficult production choices left their mark');
    }
    if (f.sequelOf != null && f.installment >= 3) causes.push('franchise fatigue weighed on expectations');
    if (!causes.length && (f.hype||0)>65 && critic<65) causes.push('publicity outpaced the final reviews');
    const details = causes.length ? ' Notably, ' + causes.slice(0,2).join(' and ') + '.' : '';
    return { headline, text:reason+details+' ('+genreName(f.genre)+', '+(byId(CONTENT.TOPICS,f.topic)||{name:f.topic||'original story'}).name+').' };
  }
  function annualReview() {
    const d = dateOf();
    const year = d.year;
    if (state.annualReviews && state.annualReviews.some(x=>x.year===year)) return;
    const films = state.projects.filter(p=>p.releaseWeek!=null && dateOf(p.releaseWeek).year===year);
    const ranked = films.slice().sort((a,b)=>(b.gross||0)-(a.gross||0));
    const critic = films.slice().sort((a,b)=>(b.critic||0)-(a.critic||0));
    const wins = films.reduce((sum,p)=>sum+(p.awards||[]).filter(x=>x.won).length+(p.festResults||[]).filter(x=>/prize|winner|won/i.test(x.result||'')).length,0);
    const report = { year, films:films.length, topGrossId:ranked[0]?ranked[0].id:null,
      topCriticId:critic[0]?critic[0].id:null, awards:wins, cash:state.cash, releases:state.studio.releases };
    (state.annualReviews = state.annualReviews || []).push(report);
    // Stop multi-week Advance at the recap so the player can actually see it.
    // This changes no awards, revenues, or ceremony results.
    state.stopFlag = true;
    addLog('Year '+year+' studio review: '+films.length+' releases, '+wins+' wins, closing cash '+fmtMoney(state.cash)+'.','studio');
    emit('year_review', report);
  }

// ===== SECTION: RELEASE =====

  const V14_RELEASE_PLANS={
    wide:{name:'Wide commercial',opening:1.06,legs:0,critic:0,audience:0,festival:0,desc:'Stronger opening; expensive visibility is already handled by marketing and regions.'},
    targeted:{name:'Targeted audience',opening:.84,legs:.045,critic:0,audience:1,festival:0,desc:'Lower opening reach, improved retention among the intended audience.'},
    prestige:{name:'Awards-first',opening:.78,legs:.025,critic:2,audience:-1,festival:2,desc:'Reviews/festivals are prioritized over early ticket volume.'},
    regional:{name:'Cautious rollout',opening:.89,legs:.035,critic:0,audience:0,festival:0,desc:'Less opening reach, with modest word-of-mouth staying power.'}
  };
  function v14ReleasePlan(p){
    return V14_RELEASE_PLANS[p.releasePosition]||V14_RELEASE_PLANS.wide;
  }
  function v14SetReleasePlan(id,kind){
    const p=getProject(Number(id));
    if(!p||!p.dna||p.releaseWeek!=null||p.stage==='done')return {ok:false,reason:'Release positioning can only change before release.'};
    if(!V14_RELEASE_PLANS[kind])return {ok:false,reason:'Unknown release strategy.'};
    if(p.format==='pilot'&&kind==='wide')return {ok:false,reason:'Pilot premieres use targeted or network-specific positioning.'};
    p.releasePosition=kind;
    filmStory(p,'strategy','Committed to a '+V14_RELEASE_PLANS[kind].name.toLowerCase()+' release.');
    save();emit('release_plan',p);return {ok:true};
  }
  // Expose all actual scheduled player releases. Shorts and pilots lack a
  // fixed release-date decision, so their future entries are explicitly marked
  // as estimates, never misrepresented as booked rival calendar slots.
  function v14ProjectedRelease(p){
    const fixed=plannedRelease(p);
    if(fixed!=null)return {week:fixed,status:'scheduled',estimate:false};
    if(p.releaseWeek!=null)return p.stage==='release'?
      {week:state.week,status:'screening now',estimate:false,started:p.releaseWeek}:null;
    if(p.stage==='done')return null;
    const order=ACTIVE_STAGES.indexOf(p.stage),fmt=TUNING.formats[p.format];
    if(order<0||!fmt)return null;
    let weeks=Math.max(0,p.stageWeeksLeft||0);
    for(let i=order+1;i<ACTIVE_STAGES.length;i++)
      weeks+=Math.max(0,fmt.stages[ACTIVE_STAGES[i]]||0);
    return {week:state.week+Math.max(1,weeks),status:'estimated',estimate:true};
  }
  function v14ReleaseCalendar(){
    if(!state)return [];
    const myProjects=state.projects.map(p=>({p,release:v14ProjectedRelease(p)}))
      .filter(x=>x.release!=null);
    return Array.from({length:12},(_,offset)=>{
      const week=state.week+offset;
      const mine=myProjects.filter(x=>x.release.week===week).map(({p,release})=>({
        id:p.id,title:p.title,format:p.format,genre:p.genre,topic:p.topic,
        studio:state.studio.name,status:release.status,estimate:release.estimate,
        started:release.started==null?null:release.started
      }));
      const rivals=activeRivals().flatMap(r=>(r.films||[]).filter(f=>f.week===week&&f.stage!=='done')
        .map(f=>{
          const nearby=myProjects.filter(x=>Math.abs(x.release.week-week)<=2);
          const genreMatches=nearby.filter(x=>x.p.genre===f.genre).map(x=>x.p.title);
          const topicMatches=nearby.filter(x=>x.p.topic&&f.topic&&x.p.topic===f.topic).map(x=>x.p.title);
          const sameWeek=nearby.filter(x=>x.release.week===week).map(x=>x.p.title);
          return {studio:r.name,title:f.title,format:'feature',genre:f.genre,topic:f.topic||null,
            rivalId:r.id,genreMatches,topicMatches,sameWeek,nearPlayer:nearby.length>0};
        })).slice(0,5);
      return {week,season:seasonOf(week).name,rivals,mine,
        pressure:Math.round((rivalPressure(week,'drama').weight+(state.market.slate[offset]||0))*10)/10,
        seasonDemand:Math.round(seasonMult(week)*100)/100};
    });
  }
  function v14ReleaseResponseQuote(id,kind){
    const p=getProject(Number(id));
    if(!p||!p.dna||p.format!=='feature'||p.stage!=='release'||p.weeksInRelease<1||p.weeksInRelease>6)
      return {ok:false,reason:'Only features during their early theatrical run qualify.'};
    if(p.releaseResponse||p.releasePush)return {ok:false,reason:'The theatrical response has already been chosen.'};
    const price=kind==='expand'?.055:kind==='focus'?.027:0,cost=Math.max(0,Math.round(p.budget*price/50)*50);
    const names={expand:'Expand theatrical marketing',focus:'Target receptive audiences',
      hold:'Keep the original release plan',pull:'End theaters early'};
    if(!names[kind])return {ok:false,reason:'Invalid release response.'};
    if(cost>state.cash)return {ok:false,reason:'Insufficient studio cash.',cost};
    return {ok:true,kind,name:names[kind],cost,
      description:kind==='expand'?'Spend more to increase demand over four weeks, with no guarantee of recouping it.':
        kind==='focus'?'Smaller focused campaign, helping word-of-mouth for four weeks.':
        kind==='hold'?'No new costs. Trust the film’s existing reviews and audience.':
        'Stop further theatrical sales and begin existing post-theatrical rights windows.'};
  }
  function v14ReleaseResponse(id,kind){
    const q=v14ReleaseResponseQuote(id,kind);if(!q.ok)return q;
    const p=getProject(Number(id));
    if(q.cost){state.cash-=q.cost;p.spent+=q.cost;p.marketingSpend=(p.marketingSpend||0)+q.cost;
      recordProjectPulse(p,state.week,0,0,q.cost,p.stage,0);}
    p.releaseResponse={kind,week:state.week,cost:q.cost};
    filmStory(p,'release','After the opening results, the studio chose to '+q.name.toLowerCase()+
      (q.cost?' at a cost of '+fmtMoney(q.cost):'')+'.');
    if(kind==='pull')finishFeature(p);
    addLog('Release decision for "'+p.title+'": '+q.name+(q.cost?' ('+fmtMoney(q.cost)+')':'')+'.','release');
    save();emit('release_response',p);return {ok:true,cost:q.cost};
  }

  // v14.3b — one bounded pre-release film promotion. Existing feature
  // marketing, publicity pushes and opening strategies remain independent,
  // fully accounted decisions rather than an unlimited extra hype faucet.
  const FILM_PROMOTIONS={
    local:{name:'Local press & screenings',share:.018,minimum:55,hype:3,
      description:'Small local campaign. Low cost and restrained awareness gain.'},
    targeted:{name:'Target genre audiences',share:.048,minimum:110,hype:5,
      description:'Reach a more receptive genre audience, with a larger cost.'},
    broad:{name:'Broad preview campaign',share:.092,minimum:190,hype:8,
      description:'A wider audience hears about the film, but spending may not pay back.'}
  };
  function filmPromotionQuote(id,kind){
    const p=getProject(Number(id)),plan=FILM_PROMOTIONS[kind];
    if(!p||!plan)return {ok:false,reason:'Select an existing film and promotion level.'};
    if(!state||state.gameOver||p.releaseWeek!=null||p.stage==='done')
      return {ok:false,reason:'Pre-release film promotion closes when the film premieres.'};
    if(p.promotionCampaign)return {ok:false,reason:'This film has already used its one optional pre-release campaign.'};
    // Flexible campaigns price the resources intentionally planned for use, not
    // contingency that can be retained or reallocated. Legacy campaigns unchanged.
    const campaignBase=p.budgetPlan?(p.fees||0)+(p.scriptFee||0)+
      FinalCutBudget.KEYS.filter(k=>k!=='reserve').reduce((sum,k)=>sum+(p.budgetPlan.allocation[k]||0),0):p.budget;
    const cost=Math.max(plan.minimum,Math.round(campaignBase*plan.share/5)*5);
    if((p.marketingSpend||0)+cost>p.budget*.55)
      return {ok:false,reason:'Existing marketing spending has already reached this film’s planned budget limit.'};
    if(state.cash<cost)return {ok:false,reason:'Insufficient studio cash for this campaign.',cost};
    if(p.budgetPlan&&cost>v144Available(p,'marketing'))
      return {ok:false,reason:'Not enough allocated marketing funds. This costs '+fmtMoney(cost)+'; remaining '+fmtMoney(v144Available(p,'marketing'))+'.',cost};
    return {ok:true,kind,name:plan.name,cost,hypeLift:plan.hype,
      description:plan.description+' Release hype varies with other cast, script, marketing and market factors.'};
  }
  function filmPromote(id,kind){
    const q=filmPromotionQuote(id,kind);if(!q.ok)return q;
    const p=getProject(Number(id));
    if(p.budgetPlan){if(!v144Pay(p,'marketing',q.cost))return {ok:false,reason:'Marketing allocation or cash changed.'};}
    else{state.cash-=q.cost;p.spent+=q.cost;}
    state.finance.q.production+=q.cost;
    p.marketingSpend=(p.marketingSpend||0)+q.cost;
    p.hypeMod=clamp((p.hypeMod||0)+q.hypeLift,-80,80);
    p.promotionCampaign={kind:q.kind,week:state.week,cost:q.cost,hypeLift:q.hypeLift};
    recordProjectPulse(p,state.week,0,0,q.cost,p.stage,0);
    filmStory(p,'promotion',q.name+' cost '+fmtMoney(q.cost)+
      ' and may improve opening awareness without guaranteeing revenue.');
    addLog('Pre-release campaign for "'+p.title+'": '+q.name+
      ', spending '+fmtMoney(q.cost)+'.','release');
    save();emit('film_promotion',p);return {ok:true,cost:q.cost};
  }

  // Fictional sponsor offers are determined by real fame, CURRENT attention
  // and prestige. No initial offers, no retries within the same film and no
  // paid placement that can recur indefinitely. Rejection has no penalty.
  const FILM_SPONSORS=[
    {name:'Harbor Coffee Cooperative',genres:['drama','comedy','romance','documentary'],brand:'Neighborhood café'},
    {name:'Northline Outdoor Supply',genres:['action','adventure','thriller','western'],brand:'Outdoor apparel'},
    {name:'Silver Dial Audio',genres:['music','comedy','sci-fi','sciencefiction'],brand:'Consumer sound equipment'},
    {name:'Meridian Travel Bureau',genres:['adventure','drama','comedy','romance'],brand:'Regional travel operator'},
    {name:'Crescent Clockworks',genres:['drama','mystery','thriller','documentary'],brand:'Heritage timepieces'},
    {name:'Blue Lantern Publishing',genres:['fantasy','sci-fi','drama','mystery'],brand:'Independent publisher'}
  ];
  function filmSponsorQuote(id){
    const p=getProject(Number(id));
    if(!p||!state||state.gameOver)return {ok:false,reason:'Select an active studio film.'};
    if(p.sponsor)return {ok:false,reason:'A sponsor has already partnered with this film.'};
    if(p.sponsorDeclined)return {ok:false,reason:'The sponsorship offer was declined for this project.'};
    if(p.releaseWeek!=null||p.stage==='done')return {ok:false,reason:'Sponsors must be contracted before a film premieres.'};
    const r=state.reputation||{buzz:0,currentPrestige:0},fame=state.studio.fame||0;
    if(fame<18||(r.buzz||0)<9&&(r.currentPrestige||0)<8)
      return {ok:false,reason:'No sponsor approaches yet. Build Lifetime Fame 18+ and current Buzz 9+ or Prestige 8+ through successful films.'};
    const tier=fame>=72&&(r.currentPrestige||0)>=28?3:
      fame>=43&&(r.buzz||0)>=17?2:1;
    const source=FILM_SPONSORS[(p.id+String(p.genre||'').length+tier)%FILM_SPONSORS.length];
    const fit=source.genres.includes(p.genre);
    // Sponsor investment tracks resources already put into the production. A
    // large but unused budget cap must never mint sponsorship cash.
    const sponsorBase=p.budgetPlan?v144EffectiveBudget(p)+
      (p.budgetPlan.spent.marketing||0)+(p.budgetPlan.spent.distribution||0):p.budget;
    const amount=Math.max(50,Math.round(Math.min(sponsorBase*(.024+tier*.011),tier*40000)/25)*25);
    const hypeLift=fit?Math.min(4,tier+1):1;
    const criticRisk=Math.min(5,(fit?0:2)+Math.max(1,tier-1));
    return {ok:true,name:source.name,brand:source.brand,tier,
      tierName:['','Local partner','Regional partner','National partner'][tier],
      fit,upfront:amount,hypeLift,criticRisk,expires:'At premiere',
      description:source.brand+' brand placement. '+(fit?
        'Genre fit is credible, but the commercial tie may still influence reviewers.':
        'Genre mismatch is visible to audiences and increases the risk of critical backlash.')+
        ' Cash and publicity are real; artistic and critical tradeoffs are not guaranteed to cancel out.'};
  }
  function acceptFilmSponsor(id){
    const q=filmSponsorQuote(id);if(!q.ok)return q;
    const p=getProject(Number(id));
    p.sponsor={name:q.name,brand:q.brand,tier:q.tier,fit:q.fit,
      upfront:q.upfront,hypeLift:q.hypeLift,criticRisk:q.criticRisk,week:state.week};
    earn(q.upfront);p.revenue=(p.revenue||0)+q.upfront;
    p.hypeMod=clamp((p.hypeMod||0)+q.hypeLift,-80,80);
    recordProjectPulse(p,state.week,0,q.upfront,0,p.stage,0);
    filmStory(p,'sponsor',q.name+' provided '+fmtMoney(q.upfront)+
      ' for visible brand placement before the premiere.');
    addLog(q.name+' partnered on "'+p.title+'", paying '+fmtMoney(q.upfront)+
      '. Possible critic penalty: up to '+q.criticRisk+' points.','studio');
    save();emit('film_sponsor',p);return {ok:true,upfront:q.upfront};
  }
  function declineFilmSponsor(id){
    const q=filmSponsorQuote(id);if(!q.ok)return q;
    const p=getProject(Number(id));
    p.sponsorDeclined=true;
    filmStory(p,'sponsor','Declined a commercial placement to retain independent creative control.');
    save();emit('film_sponsor_declined',p);return {ok:true};
  }

  // Persist short original opinions. These are fictional in-world publications,
  // never real ratings or invented reviews for old already-released saves.
  const CRITIC_TIERS=[
    [['Mira Cole','The Local Reels'],['Hugo Vale','Neighborhood Film Notes'],['Anya Roe','The Weekly Screen']],
    [['Felix Grant','Regional Film Ledger'],['Nina Porter','The City Review'],['Elias North','Midlands Picture Journal']],
    [['Celeste Wynn','National Screen'],['Theo Maren','Critics Forum'],['Imani Wells','The Picture Gazette']],
    [['Adrienne Solis','World Film Review'],['Noel Quinn','International Cinema Letter'],['Sasha Trent','The Global Screen']]
  ];
  function criticCoverage(p){
    const fame=state.studio.fame||0,r=state.reputation||{buzz:0,currentPrestige:0};
    const standing=fame*.55+(r.buzz||0)*.25+(r.currentPrestige||0)*.30;
    const maxTier=standing>=67?4:standing>=41?3:standing>=22?2:1;
    const count=maxTier===1?(p.critic>=75?2:1):maxTier===2?2:maxTier===3?3:4;
    const seed=(p.id*211+(p.title||'').split('').reduce((s,c)=>s+c.charCodeAt(0),0)+Math.round((p.critic||0)*7))>>>0;
    // Genre and topic are narrative texture, not rating modifiers. Preserve
    // critic tier, score, publicity and save structure while diversifying prose.
    const genreVoice={
      drama:['emotional restraint','character relationships','dramatic tension','human detail','the quieter scenes','moral complexity'],
      comedy:['comic timing','the ensemble chemistry','its lighter moments','the punch lines','the playful direction','its sense of mischief'],
      horror:['dread','the atmosphere','its unsettling imagery','the scares','the soundscape','its lingering unease'],
      thriller:['suspense','the escalating stakes','the twists','its tense set pieces','the pacing','the mounting paranoia'],
      scifi:['world-building','the speculative ideas','its futuristic details','the central concept','its imagined technology','the human side of the premise'],
      western:['frontier atmosphere','its rugged landscapes','the conflicts of loyalty','its old-fashioned grit','the sense of place','the showdown'],
      romance:['romantic chemistry','the central relationship','the longing','its tender moments','the emotional stakes','the quieter exchanges'],
      action:['the choreography','its kinetic set pieces','the momentum','the stunt work','the physical stakes','its breathless pacing'],
      documentary:['the interviews','its research','the observed details','the central argument','its real-world perspective','the editorial choices']
    };
    const themeVoice={
      smalltown:'small-town life',heist:'the elaborate scheme',haunted:'the haunted setting',
      roadtrip:'the journey',familysecret:'the buried family history',spacecolony:'life beyond Earth',
      boxing:'the fighter’s struggle',rockband:'the music scene',corruptcop:'the ethical compromises',
      invasion:'the invasion',firstlove:'first love',revenge:'the pursuit of revenge',
      cult:'the group’s hidden beliefs',frontier:'the frontier',robots:'the machines',
      nightshift:'life after dark',organizedcrime:'the criminal underworld',conspiracy:'the conspiracy',
      underdog:'the underdog story',medical:'the medical crisis',espionage:'the secret mission',
      comingofage:'growing up',supernatural:'the supernatural mystery',timetravel:'time itself'
    };
    const positive=[
      subject=>'A sure hand makes '+subject+' feel fresh.',
      subject=>'There is real confidence in the treatment of '+subject+'.',
      subject=>'The attention to '+subject+' gives the picture its identity.',
      subject=>'What stays with you is '+subject+', handled with surprising care.',
      subject=>'A finely judged approach to '+subject+' lifts the whole film.',
      subject=>'Even the small choices around '+subject+' feel purposeful.',
      subject=>'The film trusts its audience, especially when exploring '+subject+'.'
    ];
    const mixed=[
      subject=>'There are bright ideas around '+subject+', though they seldom connect.',
      subject=>'The approach to '+subject+' intrigues more than it satisfies.',
      subject=>'Uneven pacing undermines otherwise interesting work on '+subject+'.',
      subject=>'The ambition is apparent, but '+subject+' feels underdeveloped.',
      subject=>'A few memorable moments cannot quite carry '+subject+'.',
      subject=>'The film finds a voice around '+subject+', then loses it.',
      subject=>'An uneven but occasionally engaging look at '+subject+'.'
    ];
    const negative=[
      subject=>'The film struggles to make '+subject+' convincing.',
      subject=>'Too many shortcuts leave '+subject+' without much impact.',
      subject=>'The handling of '+subject+' becomes repetitive well before the end.',
      subject=>'A promising premise falters whenever it returns to '+subject+'.',
      subject=>'The production never finds a persuasive angle on '+subject+'.',
      subject=>'The treatment of '+subject+' lacks focus and urgency.',
      subject=>'There is little to distinguish its approach to '+subject+'.'
    ];
    const accents={
      high:['A confident finish.','The ensemble earns its moments.','Its best ideas linger.','A rewarding piece of filmmaking.'],
      mid:['The cast gives it some lift.','The ending feels slightly rushed.','Some scenes stay with you.','Its strengths and weaknesses are equally visible.'],
      low:['The cast is left searching for direction.','The finale adds little.','The execution feels rushed.','The potential rarely reaches the screen.']
    };
    const genreWords=genreVoice[p.genre]||genreVoice.drama;
    const topicWords=themeVoice[p.topic]||((byId(CONTENT.TOPICS,p.topic)||{}).name||'the central story').toLowerCase();
    const out=[];
    for(let i=0;i<count;i++){
      let tier=Math.min(maxTier,1+i);
      // A genuinely outstanding indie can draw a rare elite visitor.
      if(maxTier===1&&p.critic>=92&&(seed%9===0)&&i===count-1)tier=3;
      const n=(seed+i*71)%(CRITIC_TIERS[tier-1].length),source=CRITIC_TIERS[tier-1][n];
      const noise=((seed+i*43)%23)-11;
      const rating=clamp(Math.round(p.critic+noise),5,100);
      const lines=rating>=73?positive:rating<46?negative:mixed;
      const subject=(i%3===0?topicWords:genreWords[(seed+i*5)%genreWords.length]);
      const line=lines[(seed*3+i*5+Math.round(rating/7))%lines.length];
      const accentPool=rating>=73?accents.high:rating<46?accents.low:accents.mid;
      const text=line(subject)+(i%2===1?' '+accentPool[(seed+i*3)%accentPool.length]:'');
      out.push({name:source[0],publication:source[1],tier,score:rating,
        stars:Math.round(rating/10)/2,text,week:state.week});
    }
    return out;
  }
  function criticPublicityDelta(reviews){
    const impression=reviews.reduce((n,r)=>n+(r.score>=72?r.tier:r.score<=45?-r.tier:0),0);
    return clamp(Math.round(impression/2),-6,6);
  }
  function release(p) {
    const g = byId(CONTENT.GENRES, p.genre) || { audience: 1, critics: 0 };
    const st = state.studio;
    applyInitiative(p);
    if(p.dna&&p.format==='feature'&&(p.regions||[]).length>=3&&v14UseOffer('global',p))
      p.hypeMod+=3;
    if(p.dna&&p.format==='short'&&v14UseOffer('festival',p))
      p.v14FestivalConnection=2;
    p.quality = computeQuality(p);
    // Pilots commit release/platform-pitch funding, without buying a pickup.
    if(p.budgetPlan&&p.format==='pilot'){
      const outreach=Math.min(v144Available(p,'distribution'),state.cash);
      if(outreach&&v144Pay(p,'distribution',outreach)){
        p.distributionCost=(p.distributionCost||0)+outreach;
        p.hypeMod=clamp((p.hypeMod||0)+Math.min(4,Math.round(7*Math.sqrt(outreach/Math.max(1,p.budget)))),-80,80);
      }
    }
    // Marketing planned for shorts and pilots executes automatically at launch.
    if(p.budgetPlan&&p.format!=='feature'){
      const due=Math.min(state.cash,v144Available(p,'marketing'));
      if(due&&v144Pay(p,'marketing',due)){
        p.marketingSpend=(p.marketingSpend||0)+due;
        p.hypeMod=clamp((p.hypeMod||0)+Math.min(10,Math.round(Math.sqrt(due/Math.max(1,p.budget))*20)),-80,80);
      }
    }
    p.hype = computeHype(p);
    p.critic = clamp(Math.round(p.quality + g.critics + (p.dna?(V14_VISIONS[p.dna.vision]?.critics||0):0)+
      (p.dna?v14ReleasePlan(p).critic:0) + rnd(-10, 10) -
      (p.sponsor?.criticRisk||0)), 1, 100);
    // Reviews change publicity, not the underlying quality or guaranteed award
    // outcome. Publication tiers affect reach, never the score the critic gives.
    p.pressReviews=criticCoverage(p);
    p.pressHypeDelta=criticPublicityDelta(p.pressReviews);
    p.hype=clamp(p.hype+p.pressHypeDelta,0,100);
    p.audience = audienceScore(p, p.format === 'feature' ? genreDemand(p.genre) : 1);
    if (p.sequelOf != null) {
      p.audience = clamp(Math.round(p.audience - (p.franchiseExpectation||0) + (p.quality>=78 ? 5 : 0)),1,100);
    }
    p.review = receptionText(p);
    if(p.dna){p.audience=clamp(p.audience+(V14_VISIONS[p.dna.vision]?.viewer||0)+v14ReleasePlan(p).audience,1,100);
      filmStory(p,'premiere','Critics rated the '+p.dna.vision+' film '+p.critic+'/100; viewers rated it '+p.audience+'/100.');}
    p.stage = 'release';
    p.releaseWeek = state.week;
    p.weeksInRelease = 0;
    if (!Array.isArray(p.performanceHistory)) p.performanceHistory = [];
    st.criticsRep = st.releases ? Math.round(st.criticsRep * 0.7 + p.critic * 0.3) : p.critic;
    p.studioReleasesAtRelease = st.releases;
    st.releases++;
    currentBuzz((p.format==='feature'?12:p.format==='pilot'?7:5)+(p.critic>=75?3:p.critic<45?-6:0));
    if(p.critic>=75)reputationEvent((p.critic-70)*0.22,(p.critic-70)*0.22,'film','player:'+p.id);
    if (p.cast.director === 'founder') growStat('directing', 2, 4);
    if (p.cast.writer === 'founder') growStat('writing', 1, 3);
    if (isExecutive()) { growStat('business', 1, 2); growStat('charisma', 0, 2); }
    p.talentSnapshot = {};
    [['supporting',p.supporting||[]],['specialists',p.specialists||[]]].forEach(([key,ids])=>{
      p.talentSnapshot[key]=ids.map(id=>getTalent(id)).filter(Boolean).map(t=>({id:t.id,name:t.name,skill:t.skill,fame:t.fame,recognition:recognition(t).name,homeRegion:t.homeRegion}));
    });
    SLOTS.forEach(slot => {
      const t = typeof p.cast[slot] === 'number' ? getTalent(p.cast[slot]) : null;
      if (t) p.talentSnapshot[slot] = { id:t.id, name:t.name, skill:t.skill, fame:t.fame, recognition:recognition(t).name, homeRegion:t.homeRegion };
    });
    v14PartnershipOutcome(p);
    castTalent(p).forEach(t => {
      if (t.contract && t.contract.type === 'project' && t.contract.projectId === p.id) t.contract = null;
      if (!t.credits.includes(p.id)) t.credits.push(p.id);
      growTalentSkill(t, p);
    });
    p.staffSnapshot = Object.keys(state.staff.depts).map(id => ({ department: id, heads: state.staff.depts[id].heads, skill: state.staff.depts[id].skill }));
    if (p.format === 'short') {
      const quoted = regionQuote(p, p.regions);
      if (state.cash < quoted.cost || (p.budgetPlan&&quoted.cost>v144Available(p,'distribution'))) {
        p.regions = [homeRegion()]; addLog('Distribution allowance cannot cover overseas screenings of "' + p.title + '"; using the home circuit.', 'finance');
      }
      const rollout = regionQuote(p, p.regions);
      p.regions = rollout.regions; p.distributionCost = rollout.cost;
      if(p.budgetPlan)v144Pay(p,'distribution',rollout.cost);
      else{p.spent += rollout.cost; state.cash -= rollout.cost;}
      if(p.budgetPlan){
        const local=Math.min(state.cash,v144Available(p,'distribution'));
        if(local&&v144Pay(p,'distribution',local)){
          p.distributionCost+=local;p.hype=clamp(p.hype+Math.min(4,Math.round(8*Math.sqrt(local/Math.max(1,p.budget)))),0,100);
        }
      }
      p.shortCircuitReach = Math.min(.3, Math.max(0, rollout.openingMult - 1) * .23);
      p.festivalPlan = festivalPlan(p);
      const f = festivalDefinition(p.festivalPlan[0]) || CONTENT.AWARDS.circuit[0];
      p.festival = f.name; p.festivalTier = f.level; p.festivalTierId = f.id;
      p.festResults = [];
      // Duration depends on reception and regional reach; the old one-time
      // screening receipt is distributed across a longer real release.
      p.shortRunWeeks=shortScreeningWeeks(p);
      p.shortRunTarget=shortBaseReceipts(p);
      p.shortRunCollected=0;
      p.estimatedScreeningViewers=0;
      addLog('"' + p.title + '" completes production. Critics: ' + p.critic + '/100. Submitted to ' + p.festivalPlan.length + ' scheduled festival(s), first: ' + f.name + '.', 'release');
    } else if (p.format === 'pilot') {
      pilotResult(p);
    } else {
      p.festivalPlan = festivalPlan(p);
      const quote = regionQuote(p, p.regions);
      if (state.cash < quote.cost || (p.budgetPlan&&quote.cost>v144Available(p,'distribution'))) {
        p.regions=[homeRegion()];
        addLog('Distribution allowance cannot cover overseas release of "'+p.title+'"; opening at home.', 'finance');
      }
      const rollout=regionQuote(p,p.regions);
      p.regions=rollout.regions;p.distributionCost=rollout.cost;
      if(p.budgetPlan){
        v144Pay(p,'distribution',rollout.cost);
        const local=Math.min(state.cash,v144Available(p,'distribution'));
        if(local&&v144Pay(p,'distribution',local)){
          p.distributionCost+=local;p.hype=clamp(p.hype+Math.min(5,Math.round(9*Math.sqrt(local/Math.max(1,p.budget)))),0,100);
        }
      }else{p.spent+=rollout.cost;state.cash-=rollout.cost;}
      p.regionalGross = {}; p.regionalRevenue = {};
      const m = marketOutlook(p, 0);
      p.market = { genre: m.genre, taste: m.taste, topic: m.topic, season: m.season, cycle: m.cycle, competitors: m.competitors, pressure: m.pressure, mult: m.mult,
        rivals: m.rivals.map(r => r.studio + ': ' + r.title) };
      const ref = TUNING.boxOfficeRefBudget;
      const economicBudget=v144EffectiveBudget(p);
      const scale = ref * Math.pow(economicBudget / ref, TUNING.boxOfficeBudgetExp);
      // v14.1: a tentpole can command wider attention, but rising budget and
      // a studio's repeated same-genre launches compete for a finite audience.
      // Only previous released films count; old receipts remain untouched.
      const premium=Math.max(0,Math.log2(Math.max(1,economicBudget)/TUNING.boxOfficeRefBudget));
      const budgetAttention=1/(1+Math.min(.25,premium*.046));
      const repeatedGenre=state.projects.filter(x=>x!==p&&x.format==='feature'&&x.genre===p.genre&&
        x.releaseWeek!=null&&x.releaseWeek<state.week&&state.week-x.releaseWeek<=26).length;
      const genreAttention=Math.max(.84,1-Math.min(4,repeatedGenre)*.04);
      // Larger slates compete for attention even across genres. This affects
      // only mid/high-budget features and leaves small independent films alone.
      const recentStudioFeatures=state.projects.filter(x=>x!==p&&x.format==='feature'&&
        x.releaseWeek!=null&&x.releaseWeek<state.week&&state.week-x.releaseWeek<=26).length;
      const slateAttention=economicBudget>=TUNING.boxOfficeRefBudget?
        Math.max(.92,1-Math.min(4,recentStudioFeatures)*.02):1;
      const raw = scale * TUNING.boxOfficeBase * qualityFactor(p.quality) * (0.6 + p.hype / 100) * g.audience * luck() *
        m.mult * rollout.openingMult * budgetAttention * genreAttention * slateAttention * (1 + deptBonus('distribution')) * eraMods().boxOffice;
      // Large productions can reach a wider opening audience, but never receive
      // automatic profitability; their higher budgets and marketing costs remain.
      const budgetMultiple=Math.max(0,Math.log2(Math.max(1,economicBudget)/TUNING.boxOfficeRefBudget));
      const cap=audienceCap()*(1+Math.min(.28,budgetMultiple*TUNING.bigFilmAudienceCapPerDoubling));
      p.opening = Math.round(cap * (1 - Math.exp(-raw / cap)) * (p.dna?v14ReleasePlan(p).opening:1));
      addLog('"' + p.title + '" opens in theaters. Critics: ' + p.critic + '/100. Market outlook ×' + m.mult.toFixed(2) + ' (' + m.competitors + ' rival releases' +
        (m.rivals.length ? ', incl. ' + m.rivals.map(r => r.studio + '\'s "' + r.title + '"').join(', ') : '') + ').', 'release');
    }
    state.stopFlag = true;
    emit('release', p);
  }
  function qualityFactor(q) { return Math.pow(q / 60, TUNING.boxOfficeQualityExp); }
  function luck() { return rnd(TUNING.boxOfficeLuck[0], TUNING.boxOfficeLuck[1]); }
  function legsDecay(q) { const L = TUNING.legs; return clamp(L.base + q * L.perQuality, L.base, L.max); }
  // Reach is inferred from booked simulated gross and explicit assumed ticket
  // prices. A viewer estimate is never represented as actual measured attendance.
  function estimatedTicketPrice(week) {
    const year=TUNING.startYear+Math.floor(Math.max(0,week||0)/TUNING.weeksPerYear);
    return TUNING.estimatedTicketPrice1970*Math.pow(1+TUNING.estimatedTicketInflation,year-TUNING.startYear);
  }
  function admissionsFromGross(gross,week){
    return Math.max(0,Math.round((Number(gross)||0)/estimatedTicketPrice(week)));
  }
  function filmAdmissions(p){
    if(!p||p.format!=='feature')return null;
    if(Number.isFinite(p.estimatedAdmissions))return p.estimatedAdmissions;
    // A pre-v13.8 feature carries no recorded admissions, so reconstruct
    // transparently from its recorded gross and modeled opening-week price.
    return admissionsFromGross(p.gross||0,p.releaseWeek||0);
  }
  function recordProjectPulse(p,week,gross,revenue,spent,stage,admissions,screenings,households){
    if(!Array.isArray(p.performanceHistory))p.performanceHistory=[];
    const row=p.performanceHistory.find(x=>x.week===week);
    if(row){
      row.gross+=gross;row.revenue+=revenue;row.spent+=spent;row.admissions+=admissions;
      row.screenings=(row.screenings||0)+(screenings||0);
      row.households=(row.households||0)+(households||0);row.stage=stage;
    }else{
      p.performanceHistory.push({week,stage,gross,revenue,spent,admissions,
        screenings:screenings||0,households:households||0});
      if(p.performanceHistory.length>32)p.performanceHistory.splice(0,p.performanceHistory.length-32);
    }
    p.lastWeekRevenue=revenue;
  }
  function projectPulse(p){
    const history=(p.performanceHistory||[]).slice(-32),last=history.length?history[history.length-1]:null;
    return {history:history.slice(),thisWeekGross:last&&last.week===state.week?last.gross:0,
      thisWeekRevenue:last&&last.week===state.week?last.revenue:0,
      thisWeekSpent:last&&last.week===state.week?last.spent:0,
      thisWeekAdmissions:last&&last.week===state.week?last.admissions:0,
      estimatedAdmissions:filmAdmissions(p),
      estimatedScreeningViewers:shortAudience(p),
      estimatedHouseholdImpressions:estimatedTvHouseholds(p),
      thisWeekScreenings:last&&last.week===state.week?last.screenings||0:0,
      thisWeekHouseholds:last&&last.week===state.week?last.households||0:0,
      ticketPrice:p.format==='feature'?estimatedTicketPrice(state.week):null,
      trackedSince:history.length?history[0].week:null,legacy:!history.length&&p.releaseWeek!=null};
  }
  function releasePushQuote(id){
    const p=getProject(Number(id));
    if(!p||p.format!=='feature'||p.stage!=='release'||p.weeksInRelease>=6)
      return {ok:false,reason:'Only feature films in their first six theatrical weeks can get a release push.'};
    if(p.releasePush)return {ok:false,reason:'This film has already had its release publicity push.'};
    if(p.weeksInRelease<1)return {ok:false,reason:'Wait for the first box-office report.'};
    const cost=Math.max(350,Math.round(Math.min(p.budget*0.045,Math.max(700,p.opening*.08))/50)*50);
    if(state.cash<cost)return {ok:false,reason:'You need '+fmtMoney(cost)+' available for a release push.',cost};
    return {ok:true,cost,description:'One-time publicity; up to 12% more ticket demand in the next four weeks, fading each week. Not guaranteed to break even.'};
  }
  function pushRelease(id){
    const q=releasePushQuote(id);if(!q.ok)return q;
    const p=getProject(Number(id));
    state.cash-=q.cost;p.spent+=q.cost;p.marketingSpend=(p.marketingSpend||0)+q.cost;
    p.releasePush={week:state.week,cost:q.cost};
    recordProjectPulse(p,state.week,0,0,q.cost,p.stage,0);
    addLog('Post-opening publicity push for "'+p.title+'" cost '+fmtMoney(q.cost)+'. Future ticket demand may improve.','release');
    save();emit('promotion',p);return {ok:true,cost:q.cost};
  }
  // The former three-week short run booked one final lump-sum payment.
  // v13.9 retains approximately the SAME baseline receipts and spreads them
  // across a reception-driven screening circuit instead of minting extra income.
  function shortBaseReceipts(p){
    return Math.max(0,Math.round((p.quality<40?p.budget*.15:p.budget*(.5+p.quality/70))*
      eraMods().festival*(1+(p.shortCircuitReach||0))));
  }
  function shortScreeningWeeks(p){
    const score=3+(Number(p.quality||0)-35)/12+(Number(p.audience||0)-50)/25+
      (Number(p.hype||0)-30)/38+Math.max(0,(p.regions||[]).length-1)*.3;
    return clamp(Math.round(score),TUNING.shortScreening.minWeeks,TUNING.shortScreening.maxWeeks);
  }
  function shortNetPerViewer(week){
    const yrs=Math.floor((Math.max(0,week||0))/TUNING.weeksPerYear);
    return TUNING.shortScreening.netRevenuePerViewer1970*Math.pow(1+TUNING.shortScreening.annualGrowth,yrs);
  }
  function shortAudience(p){
    if(!p||p.format!=='short'||p.releaseWeek==null)return null;
    if(Number.isFinite(p.estimatedScreeningViewers))return p.estimatedScreeningViewers;
    // Legacy completed shorts have only lifetime screening receipts, so
    // reconstruct a labeled modeled estimate without inventing weekly rows.
    return Math.max(0,Math.round((p.shortRunCollected||p.revenue||0)/shortNetPerViewer(p.releaseWeek)));
  }
  function estimatedTvHouseholds(p){return p&&p.format==='pilot'&&Number.isFinite(p.estimatedHouseholdImpressions)
    ?p.estimatedHouseholdImpressions:null;}
  function householdImpressionsForRating(r,week){
    // Modeled household exposure per episode, NOT unique real households.
    const years=Math.floor(Math.max(0,week||0)/TUNING.weeksPerYear);
    return Math.max(0,Math.round(r*35000*Math.pow(1.025,years)));
  }
  function shortRunRemaining(p){
    const weeks=p.shortRunWeeks||shortScreeningWeeks(p);
    return Math.max(0,weeks-(p.weeksInRelease||0));
  }
  function shortWeeklyScreenings(p){
    if(!Number.isFinite(p.shortRunWeeks))p.shortRunWeeks=shortScreeningWeeks(p);
    if(!Number.isFinite(p.shortRunTarget))p.shortRunTarget=shortBaseReceipts(p);
    if(!Number.isFinite(p.shortRunCollected))p.shortRunCollected=0;
    if(!Number.isFinite(p.estimatedScreeningViewers))p.estimatedScreeningViewers=0;
    const n=p.weeksInRelease,term=p.shortRunWeeks,remaining=Math.max(0,p.shortRunTarget-p.shortRunCollected);
    const decay=clamp(TUNING.shortScreening.decayBase+(p.quality-50)*.0018+(p.audience-50)*.0007,.64,.90);
    let weight=0;for(let i=n-1;i<term;i++)weight+=Math.pow(decay,i);
    const pay=n>=term?remaining:Math.min(remaining,Math.max(0,Math.round(remaining*Math.pow(decay,n-1)/Math.max(.001,weight))));
    p.shortRunCollected+=pay;p.revenue+=pay;
    p.estimatedScreeningViewers+=Math.max(0,Math.round(pay/shortNetPerViewer(state.week)));
    p.shortCircuitIncome=Math.max(0,Math.round(p.shortRunCollected*(p.shortCircuitReach||0)/(1+(p.shortCircuitReach||0))));
    if(n===1||n===term||n===Math.ceil(term/2))
      addLog('"'+p.title+'" screening week '+n+'/'+term+': '+fmtMoney(pay)+
        ' receipts · approx. '+p.estimatedScreeningViewers.toLocaleString('en-US')+' cumulative screening admissions.','release');
    if(n>=term)finishShort(p);
    return pay;
  }
  function finishShort(p) {
    // The completed film still stays on the calendar for future juried
    // festival selections and is eligible for optional encore/circuit actions.
    p.stage='done';
    checkLegacyMilestones(p);
    if(p.result!=='Won')p.result='Screened';
    const fame=gainStudioFame(1+Math.min(.65,Math.max(0,(p.regions||[]).length-1)*.15));
    growStat('business',0,1);addTalentFame(p);
    addLog('"'+p.title+'" finishes '+p.shortRunWeeks+' weeks of short-film screenings: '+
      fmtMoney(p.shortRunCollected)+' receipts, fame +'+fame+
      '. Its festival circuit can continue after this release.','release');
    emit('finished',p);
  }
  function releaseIncome(p) {
    p.weeksInRelease++;
    if (p.format === 'short') return shortWeeklyScreenings(p);
    // Niche independent films with strong audience response gain longer legs;
    // poorly received microbudget productions get no subsidy.
    const indieBonus=p.budget<=120000 && p.audience!=null ?
      Math.max(0,Math.min(TUNING.smallFilmAudienceLegsBonus,(p.audience-68)*.0018)) : 0;
    const decay = clamp(legsDecay(p.quality)+indieBonus+(p.dna?v14ReleasePlan(p).legs:0),.5,.91);
    let gross = p.opening * Math.pow(decay, p.weeksInRelease - 1);
    if (p.weeksInRelease > 1) gross /= 1 + TUNING.rivals.holdPenalty * rivalPressure(state.week, p.genre, null, true).weight;
    if(p.releasePush && state.week>p.releasePush.week && state.week-p.releasePush.week<=4)
      gross*=1+(0.12*(1-(state.week-p.releasePush.week-1)*.18));
    if(p.releaseResponse && state.week>p.releaseResponse.week && state.week-p.releaseResponse.week<=4){
      const age=state.week-p.releaseResponse.week-1,scale=(1-age*.2);
      if(p.releaseResponse.kind==='expand')gross*=1+.14*scale;
      if(p.releaseResponse.kind==='focus')gross*=1+.075*scale;
    }
    gross = Math.round(gross);
    // Reconcile local and international receipts to total theatrical gross every week.
    const quote = regionQuote(p, p.regions || [homeRegion()]);
    const home = homeRegion();
    const selected = quote.regions;
    const shares = selected.map(id => id === home ? 1 : 0.16 * (byId(CONTENT.REGIONS, id).audience || 1) * (byId(CONTENT.REGIONS, id).taste[p.genre] || 1));
    const total = shares.reduce((a, b) => a + b, 0);
    let assigned = 0, income = 0;
    selected.forEach((id, i) => {
      const amount = i === selected.length - 1 ? gross - assigned : Math.round(gross * shares[i] / total);
      assigned += amount;
      p.regionalGross[id] = (p.regionalGross[id] || 0) + amount;
      const share = (TUNING.studioShare + growthTier().boxShare) * (id === home ? 1 : 0.80);
      const localIncome = Math.round(amount * share);
      p.regionalRevenue[id] = (p.regionalRevenue[id] || 0) + localIncome;
      income += localIncome;
    });
    if(!Number.isFinite(p.estimatedAdmissions))p.estimatedAdmissions=admissionsFromGross(p.gross||0,p.releaseWeek||state.week);
    p.estimatedAdmissions+=admissionsFromGross(gross,state.week);
    p.gross += gross;
    p.lastWeekGross = gross; // recorded box office for Production Center, old saves may omit it
    p.revenue += income;
    tallyGross('you', gross);
    if (p.weeksInRelease === 1) addLog('"' + p.title + '" opening week: ' + fmtMoney(gross) + ' gross.', 'release');
    if (gross < p.opening * 0.025 || p.weeksInRelease >= TUNING.maxReleaseWeeks) finishFeature(p);
    return income;
  }
  // Shorts can still have a career after the opening circuit. The calendar
  // remains the authority for juried prizes; promotion is limited and cannot
  // manufacture awards, guaranteed attendance, or unbooked income.
  function shortFestivalStatus(p){
    if(!p||p.format!=='short'||p.releaseWeek==null)return null;
    const judged=p.festivals||[],list=p.festivalPlan||[];
    const completed=(p.festResults||[]).filter(x=>x.kind==='selection'||x.kind==='mention'||x.kind==='winner');
    const deadline=p.releaseWeek+TUNING.awards.festWindow;
    const next=list.map(id=>festivalDefinition(id)).filter(f=>f&&!judged.includes(f.id))
      .map(f=>{
        const d=dateOf(),seasonStart=(d.year-TUNING.startYear)*TUNING.weeksPerYear;
        let week=seasonStart+f.week-1;
        if(week<=state.week)week+=TUNING.weeksPerYear;
        return {id:f.id,name:f.name,week,level:f.level};
      }).filter(x=>x.week<=deadline).sort((a,b)=>a.week-b.week)[0]||null;
    return {planned:list.length,judged:judged.length,
      selections:completed.length,wins:completed.filter(x=>x.kind==='winner').length,next};
  }
  function shortPostReleaseQuote(id,kind){
    const p=getProject(Number(id));
    if(!state||state.gameOver||!p||p.format!=='short'||p.releaseWeek==null)
      return {ok:false,reason:'Only your released short films qualify.'};
    const age=state.week-p.releaseWeek;
    if(age<0||age>TUNING.awards.festWindow)
      return {ok:false,reason:'This short film is outside its first festival year.'};
    const status=shortFestivalStatus(p);
    if(kind==='press'){
      if(p.shortFestivalPressKit)return {ok:false,reason:'Festival press kit already prepared.'};
      if(!status.next)return {ok:false,reason:'No scheduled festival judging remains.'};
      const cost=Math.min(700,Math.max(75,Math.round(p.budget*.035/25)*25));
      return state.cash<cost?{ok:false,reason:'Not enough cash for a festival press kit.',cost}:
        {ok:true,cost,description:'Strengthens future jury submissions by +4 merit points. No guaranteed selection or win.'};
    }
    if(kind==='encore'){
      if(p.stage!=='done')return {ok:false,reason:'Encore screenings open after the original circuit ends.'};
      if(p.shortEncore)return {ok:false,reason:'This film has already had its encore screenings.'};
      if((p.quality||0)<60&&status.selections<1)return {ok:false,reason:'An encore requires quality 60+ or a festival selection.'};
      const cost=Math.min(750,Math.max(75,Math.round(p.budget*.06/25)*25));
      const base=Number.isFinite(p.shortRunTarget)?p.shortRunTarget:shortBaseReceipts(p);
      const total=Math.max(0,Math.round(base*TUNING.shortScreening.encoreRevenueShare*
        (p.quality>=75?1.16:1)));
      return state.cash<cost?{ok:false,reason:'Not enough cash for an encore run.',cost,total}:
        {ok:true,cost,total,weeks:TUNING.shortScreening.encoreWeeks,
          description:'One four-week encore, with modest extra screening receipts and estimated reach. Revenue is not guaranteed to cover the cost.'};
    }
    return {ok:false,reason:'Unknown short-film release action.'};
  }
  function shortPostReleaseAction(id,kind){
    const q=shortPostReleaseQuote(id,kind);if(!q.ok)return q;
    const p=getProject(Number(id));
    state.cash-=q.cost;p.spent+=q.cost;
    if(kind==='press'){
      p.shortFestivalPressKit={week:state.week,cost:q.cost};
      addLog('Festival press materials for "'+p.title+'" cost '+fmtMoney(q.cost)+
        '. Upcoming juries will consider the stronger campaign.','festival');
    }else{
      p.shortEncore={from:state.week+1,paid:0,total:q.total,weeks:q.weeks,cost:q.cost};
      addLog('An encore screening circuit for "'+p.title+'" was booked for '+
        q.weeks+' weeks at a cost of '+fmtMoney(q.cost)+'.','release');
    }
    recordProjectPulse(p,state.week,0,0,q.cost,p.stage,0);
    save();emit('short_action',p);return {ok:true,cost:q.cost};
  }
  function shortEncoreTick(){
    let sum=0;
    state.projects.forEach(p=>{
      const e=p.shortEncore;if(!e||state.week<e.from||e.paid>=e.total)return;
      const current=state.week-e.from+1;
      if(current>e.weeks)return;
      const decay=.76;
      let denominator=0;for(let k=current;k<=e.weeks;k++)denominator+=Math.pow(decay,k-1);
      const left=e.total-e.paid;
      const pay=current===e.weeks?left:Math.min(left,Math.max(0,Math.round(left*Math.pow(decay,current-1)/denominator)));
      e.paid+=pay;p.revenue+=pay;sum+=pay;
      p.estimatedScreeningViewers=(shortAudience(p)||0)+Math.round(pay/shortNetPerViewer(state.week));
      if(current===e.weeks)addLog('Encore screenings for "'+p.title+
        '" finished with '+fmtMoney(e.paid)+' additional receipts.','release');
    });
    return sum;
  }
  function finishFeature(p) {
    p.stage = 'done';
    const profit = p.revenue - p.spent;
    const ratio = p.gross / p.budget;
    const fame = 3 + clamp(Math.round(ratio * 4), 0, 12);
    p.result = profit < 0 ? 'Flop' : (profit >= p.budget ? 'Hit' : 'Profit');
    if(p.result==='Hit')currentBuzz(7);
    else if(p.result==='Flop')currentBuzz(-10-(p.critic<45?3:0));
    if (p.sequelOf != null && (p.result === 'Flop' || p.audience < 48)) {
      p.franchiseBacklash = true;
      gainStudioFame(-1.2);
      addLog('Audiences cool on the '+(p.franchiseName||p.title)+' franchise after a disappointing sequel.', 'release');
    }
    initiativeOutcome(p);
    checkLegacyMilestones(p);
    const awardedFame = gainStudioFame(fame + Math.min(2, Math.max(0, (p.regions || []).length - 1) * 0.5));
    growStat('business', 1, 2);
    addTalentFame(p);
    openWindows(p);
    addLog('"' + p.title + '" leaves theaters: ' + fmtMoney(p.gross) + ' gross, profit ' + fmtMoney(profit) + ' (' + p.result + '). Fame +' + awardedFame + '.' +
      (p.windows.length ? ' Next: ' + p.windows.map(w => windowName(w.id)).join(', ') + '.' : ''), 'release');
    state.stopFlag = true;
    emit('finished', p);
  }

// ===== SECTION: FILM_ARCHIVE =====
  // The player's projects remain the canonical record; avoid duplicating them in save data.
  // Completed rival movies are snapshotted before rivals prune their recent-release lists.
  function archiveRivalFilm(r, f) {
    if (!state.filmArchive) state.filmArchive = { rivals: [], incompleteBefore: null };
    if (f.stage === 'planned') return null;
    const id = 'rival:' + r.id + ':' + f.id;
    let record = state.filmArchive.rivals.find(x => x.id === id);
    if (!record) { record = { id: id }; state.filmArchive.rivals.push(record); }
    Object.assign(record, {
      id: id, studio: r.name, rivalId: r.id, format: 'feature', title: f.title,
      genre: f.genre, topic: f.topic || null, startWeek: f.startWeek == null ? null : f.startWeek,
      releaseWeek: f.week, year: dateOf(f.week).year, budget: f.budget,
      quality: f.quality, critic: f.critic == null ? null : f.critic,
      review: f.review || record.review || null,
      hype: f.hype || 0, gross: f.gross || 0, revenue: f.revenue || 0,
      profit: f.stage === 'done' ? f.revenue - f.budget : null,
      audience: f.audience == null ? null : f.audience,
      result: f.result || 'In theaters', stage: f.stage,
      credits: f.credits || {},creditIds:f.creditIds||record.creditIds||{}, studioReleasesAtRelease: f.studioReleasesAtRelease == null ? null : f.studioReleasesAtRelease, region: f.region || r.region || null, regions: f.regions || [],
      regionalGross: f.regionalGross || {}, sequelOf:f.sequelOf||null, franchiseId:f.franchiseId||null, installment:f.installment||1, franchiseName:f.franchiseName||null,
      awards: record.awards || [], festResults: record.festResults || [],
      dna:f.dna||null, legacy: !f.topic || f.critic == null
    });
    return record;
  }
  function playerFilm(p) {
    const names = {};
    SLOTS.forEach(slot => {
      const v = p.cast && p.cast[slot];
      names[slot] = p.castNames && p.castNames[slot] || (v === 'founder' ? state.founder.name : null);
    });
    return {
      id: 'player:' + p.id, projectId: p.id, studio: state.studio.name, format: p.format,
      title: p.title, genre: p.genre, topic: p.topic, startWeek: p.startWeek,
      releaseWeek: p.releaseWeek, year: dateOf(p.releaseWeek).year,
      budget: p.budget, spent: p.spent, quality: p.quality, critic: p.critic, audience: p.audience, review: p.review || null, hype: p.hype,
      pressReviews:(p.pressReviews||[]).slice(),pressHypeDelta:p.pressHypeDelta||0,sponsor:p.sponsor||null,
      gross: p.gross || 0, revenue: p.revenue || 0, reissueRevenue:p.reissueRevenue||0, profit: p.revenue - p.spent,
      following:filmFollowing(p),
      estimatedAdmissions:filmAdmissions(p), estimatedScreeningViewers:shortAudience(p),
      estimatedHouseholdImpressions:estimatedTvHouseholds(p), estimatedOnlineViews:p.estimatedOnlineViews||null,
      mediaVariant:p.mediaVariant||null,
      performanceHistory:(p.performanceHistory||[]).slice(-32),
      result: p.result || 'In release', stage: p.stage, franchiseId:p.franchiseId||null, sequelOf:p.sequelOf==null?null:'player:'+p.sequelOf, installment:p.installment||1, franchiseName:p.franchiseName||null, region: state.studio.homeRegion || 'northamerica',
      regions: p.regions || [], regionalGross: p.regionalGross || {},
      credits: Object.assign(names,{supporting:(p.talentSnapshot&&p.talentSnapshot.supporting||[]).map(t=>t.name),specialists:(p.talentSnapshot&&p.talentSnapshot.specialists||[]).map(t=>t.name)}),
      creditIds:Object.assign({},p.cast,{supporting:p.supporting||[],specialists:p.specialists||[]}), staff: p.staffSnapshot || [], studioReleasesAtRelease: p.studioReleasesAtRelease, awards: p.awards || [], festResults: p.festResults || [],
      decisions: p.usedEvents || [], dna:p.dna||null, story:v14Storyboard(p),
      legacyKind:v14FilmLegacy(p)?.kind||null,
      talentSnapshot: p.talentSnapshot || null, qualityBreakdown: p.qualityBreakdown || null, hypeBreakdown: p.hypeBreakdown || null,
      legacy: p.releaseWeek != null && !p.regions
    };
  }
  function filmHistory() {
    if (!state) return [];
    const mine = state.projects.filter(p => p.releaseWeek != null).map(playerFilm);
    return mine.concat(state.filmArchive ? state.filmArchive.rivals : []).sort((a, b) =>
      (b.releaseWeek || 0) - (a.releaseWeek || 0) || String(a.id).localeCompare(String(b.id)));
  }
  function filmById(id) { return filmHistory().find(f => f.id === String(id)) || null; }
  // The rating uses one stable formula for both studio-only and world rankings.
  function filmScore(f, criterion, region) {
    const awards = (f.awards || []).reduce((n, a) => n + (a.won ? 4 : 1), 0);
    const festivals = (f.festResults || []).reduce((n, a) => n +
      (/prize|grand|won|winner/i.test(a.result || '') ? 3 + Math.min(3, a.tierRank || 1) :
        /mention|runner/i.test(a.result || '') ? 2 : /selection/i.test(a.result || '') ? 0.6 : 0), 0);
    const recognition = Math.min(100, (awards + festivals) * 8);
    const eraYears = Math.max(0, (f.year || TUNING.startYear) - TUNING.startYear);
    const eraScaleValue = Math.pow(1 + TUNING.market.audienceGrowth, eraYears);
    const reach = Math.min(100, 35 * Math.log10(1 + (f.gross || 0) / (Math.max(25000, f.budget || 25000) * 0.4)));
    if (criterion === 'gross') return Math.round((region ? (f.regionalGross?.[region]||0) : (f.gross||0)) / eraScaleValue);
    if (criterion === 'audience') return f.audience == null ? -1 : f.audience;
    if (criterion === 'reach') return f.format==='feature' ? (f.estimatedAdmissions||0) : f.format==='short' ? (f.estimatedScreeningViewers||0) : (f.mediaVariant==='web' ? f.estimatedOnlineViews||0 : f.estimatedHouseholdImpressions||0);
    if (criterion === 'critics') return f.critic == null ? -1 : f.critic;
    if (criterion === 'awards') return Math.round((awards + festivals) * 100) / 100;
    return Math.round((0.4 * (f.critic == null ? f.quality || 0 : f.critic) +
      0.25 * (f.quality || 0) + 0.2 * reach + 0.15 * recognition) * 10) / 10;
  }
  function filmRankings(opts) {
    opts = opts || {};
    const criterion = opts.criterion || 'overall', currentYear=dateOf().year;
    const filter = f => f.stage === 'done' &&
      (opts.format==='web' ? f.format==='pilot'&&f.mediaVariant==='web' :
        opts.format==='pilot' ? f.format==='pilot'&&f.mediaVariant!=='web' :
        f.format===(opts.format||'feature')) &&
      (!opts.genre || f.genre === opts.genre) && (!opts.topic || f.topic === opts.topic) &&
      (!opts.decade || Math.floor(f.year / 10) * 10 === Number(opts.decade)) &&
      (!opts.period || opts.period==='all' ||
        (opts.period==='year'&&f.year===currentYear) ||
        (opts.period==='five'&&f.year>=currentYear-4&&f.year<=currentYear)) &&
      (!opts.region || (f.regions || []).includes(opts.region)) &&
      (!opts.reach || (opts.reach==='home' ? (f.regions||[]).length===1 :
        opts.reach==='international' ? (f.regions||[]).length>=2 :
        (f.regions||[]).length>=4)) &&
      // A region's gross chart only includes films with recorded local receipts.
      (!(criterion==='gross'&&opts.region) || Number.isFinite(f.regionalGross?.[opts.region])) &&
      (!opts.awarded || (f.awards || []).some(a => a.won) || (f.festResults || []).some(a => /prize|grand|won|winner/i.test(a.result)));
    const all = filmHistory().filter(filter).map(f => Object.assign({}, f, { score: filmScore(f, criterion, opts.region) }));
    all.sort((a, b) => b.score - a.score || (b.critic || 0) - (a.critic || 0) || a.releaseWeek - b.releaseWeek || String(a.id).localeCompare(String(b.id)));
    return all.map((f, i) => Object.assign({}, f, { worldRank: i + 1 })).filter(f => !opts.mine || f.projectId != null)
      .map((f, i) => Object.assign({}, f, { studioRank: opts.mine ? i + 1 : null }));
  }

// ===== SECTION: FINANCE =====
  function loanCap() { return TUNING.loanBaseCap + Math.floor(state.studio.fame) * TUNING.loanCapPerFame; }
  function v144EffectiveBudget(p){
    if(!p.budgetPlan)return p.budget;
    const a=p.budgetPlan.allocation,spent=p.budgetPlan.spent;
    // Budget not yet committed to actual production (reserve/unused cap) cannot
    // create fictitious production values or theatrical opening demand.
    return Math.max(250,(p.fees||0)+(p.scriptFee||0)+
      Math.min(a.prep,spent.prep)+Math.min(a.shoot,spent.shoot)+Math.min(a.post,spent.post));
  }
  function v144Bucket(stage){return stage==='development'||stage==='preproduction'?'prep':stage;}
  function v144StageCost(p){
    if(!p.budgetPlan)return p.weekly;
    const b=p.budgetPlan,k=v144Bucket(p.stage),stages=b.stageWeeks||FinalCutBudget.stageWeeks(p.mediaVariant||p.format);
    const planned=k==='prep'?stages.development+stages.preproduction:stages[k]||1;
    const normal=FinalCutBudget.milestoneCost(b.allocation,k,b.spent, {prep:planned,shoot:stages.shoot,post:stages.post});
    if(normal)return normal;
    // Extra weeks can consume only the pre-approved reserve. No silent cap overrun.
    const unused=Math.max(0,b.allocation.reserve-(b.spent.reserve||0));
    return Math.min(unused,Math.max(15,Math.round((b.allocation[k]||0)/Math.max(1,planned)*.4)));
  }
  function v144BudgetTick(p){
    if(!p.budgetPlan)return p.weekly;
    const b=p.budgetPlan,k=v144Bucket(p.stage),spent=b.spent[k]||0;
    const normal=FinalCutBudget.milestoneCost(b.allocation,k,b.spent,{
      prep:b.stageWeeks.development+b.stageWeeks.preproduction,shoot:b.stageWeeks.shoot,post:b.stageWeeks.post});
    if(normal){b.spent[k]=spent+normal;return normal;}
    const extra=v144StageCost(p);
    if(extra){b.spent.reserve=(b.spent.reserve||0)+extra;return extra;}
    // The production limps through without additional funded resources.
    if((p.stageWeeksLeft||0)>0)p.qualityMod=Math.max(-18,(p.qualityMod||0)-.5);
    return 0;
  }
  function v144Available(p,k){return p.budgetPlan?Math.max(0,(p.budgetPlan.allocation[k]||0)-(p.budgetPlan.spent[k]||0)):Infinity;}
  function v144Pay(p,k,cost){
    cost=Math.max(0,Math.round(cost)||0);
    if(p.budgetPlan&&cost>v144Available(p,k))return false;
    if(state.cash<cost)return false;
    state.cash-=cost;p.spent+=cost;
    if(p.budgetPlan)p.budgetPlan.spent[k]=(p.budgetPlan.spent[k]||0)+cost;
    return true;
  }
  function v144BudgetInfo(id){
    const p=typeof id==='object'?id:getProject(Number(id));if(!p||!p.budgetPlan)return null;
    const b=p.budgetPlan,spent=Object.values(b.spent).reduce((a,n)=>a+(n||0),0);
    return {cap:b.cap,classification:FinalCutBudget.budgetClass(p.format,b.cap),scope:p.productionScope,
      allocation:Object.assign({},b.allocation),spent:Object.assign({},b.spent),stageRemaining:FinalCutBudget.KEYS
        .reduce((out,k)=>(out[k]=v144Available(p,k),out),{}),
      projectedRemaining:Math.max(0,b.cap-(p.fees||0)-(p.scriptFee||0)-spent)};
  }
  function v144Reallocate(id,from,to,amount){
    const p=getProject(Number(id));
    if(!p||!p.budgetPlan||!ACTIVE_STAGES.includes(p.stage))
      return {ok:false,reason:'Only active flexible-budget films can move unspent money.'};
    if(!FinalCutBudget.KEYS.includes(from)||!FinalCutBudget.KEYS.includes(to)||from===to)
      return {ok:false,reason:'Choose two different allocation buckets.'};
    const b=p.budgetPlan,live=ACTIVE_STAGES.indexOf(p.stage);
    const requiredStage={prep:0,shoot:2,post:3,marketing:4,distribution:4,reserve:4};
    if((requiredStage[from]<live&&from!=='reserve')||(requiredStage[to]<live&&to!=='reserve'))
      return {ok:false,reason:'Already completed production stages cannot be re-budgeted.'};
    amount=Math.round(Number(amount)||0);
    if(amount<=0||amount>v144Available(p,from))
      return {ok:false,reason:'Only unspent allocated money may be moved.'};
    b.allocation[from]-=amount;b.allocation[to]+=amount;
    const f=FinalCutBudget.evaluate({variant:p.mediaVariant,format:p.format,scope:p.productionScope,
      cap:p.budget,fees:p.fees,scriptFee:p.scriptFee,plan:b.allocation});
    b.qualityEffect=f.qualityEffect;b.feasibility=f.level;
    // Do not retroactively shorten or lengthen an already-running stage.
    if(live<2)b.delayWeeks=f.delayWeeks;
    addLog('Moved '+fmtMoney(amount)+' from '+FinalCutBudget.LABELS[from]+' to '+
      FinalCutBudget.LABELS[to]+' for "'+p.title+'".','finance');
    save();emit('project',p);return {ok:true,level:f.level};
  }
  function v144IncreaseCap(id,amount,where){
    const p=getProject(Number(id));
    if(!p||!p.budgetPlan||!ACTIVE_STAGES.includes(p.stage))
      return {ok:false,reason:'Only active productions may request a new spending limit.'};
    amount=Math.round(Number(amount)||0);
    const bucket=FinalCutBudget.KEYS.includes(where)?where:'reserve';
    if(amount<=0||amount>500000||p.budgetPlan.cap+amount>50000000)
      return {ok:false,reason:'Budget increase must be positive and within studio limits.'};
    if(state.cash<amount)return {ok:false,reason:'Studio cash cannot support this optional extra commitment.'};
    p.budget+=amount;p.budgetPlan.cap+=amount;p.budgetPlan.allocation[bucket]+=amount;
    const f=FinalCutBudget.evaluate({variant:p.mediaVariant,scope:p.productionScope,
      cap:p.budget,fees:p.fees,scriptFee:p.scriptFee,plan:p.budgetPlan.allocation});
    p.budgetPlan.qualityEffect=f.qualityEffect;p.budgetPlan.feasibility=f.level;
    // Raising a cap does not itself move money out of cash. Only costs do.
    addLog('Approved an additional '+fmtMoney(amount)+' budget limit for "'+p.title+
      '", assigned to '+FinalCutBudget.LABELS[bucket]+'.','finance');
    save();emit('project',p);return {ok:true};
  }
  function weeklyBurn() {
    return TUNING.livingCost + Math.round(state.debt * TUNING.weeklyInterest) + weeklySalaries() + weeklyPayroll() + weeklyOverhead() +
      activeProjects().reduce((a, p) => a + v144StageCost(p), 0) + state.series.filter(s => s.status === 'airing').reduce((a, s) => a + s.epCost, 0);
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
  function genrePop(id) {
    const base=state.market.genres[id]||1,sh=state.legacyPlay&&state.legacyPlay.industryShift;
    return base*(sh&&state.week<=sh.endWeek&&sh.genres.includes(id)?sh.mult:1);
  }
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
    const pressure = bg + rv.weight / (1 + Math.max(0, activeRivals().length - 6) * 0.035) + own;
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
  // Record true existing market demand, not simulated forecasts. Compact 20-week history.
  function captureDemandSnapshot(){
    if(!state||!state.market)return;
    const m=state.market;if(!Array.isArray(m.demandHistory))m.demandHistory=[];
    const sample={week:state.week,
      genres:Object.fromEntries(CONTENT.GENRES.map(g=>[g.id,Math.round(genreDemand(g.id)*1000)/1000])),
      topics:Object.fromEntries(CONTENT.TOPICS.map(t=>[t.id,Math.round(topicMarket(t.id).demand*1000)/1000]))};
    const h=m.demandHistory, last=h[h.length-1];
    if(last&&last.week===state.week)h[h.length-1]=sample;
    else h.push(sample);
    if(h.length>20)h.splice(0,h.length-20);
  }
  function demandMovers(kind){
    if(!state||!state.market)return {valid:false,risers:[],fallers:[]};
    const history=state.market.demandHistory||[],latest=history[history.length-1];
    const baseline=history.slice().reverse().find(s=>latest&&s.week<=latest.week-8);
    if(!latest||!baseline)return {valid:false,risers:[],fallers:[],weeks:8};
    const key=kind==='topics'?'topics':'genres',names=key==='topics'?CONTENT.TOPICS:CONTENT.GENRES;
    const rows=names.map(x=>({id:x.id,name:x.name,
      delta:Math.round(((latest[key][x.id]||0)-(baseline[key][x.id]||0))*100),
      demand:latest[key][x.id]}));
    return {valid:true,weeks:latest.week-baseline.week,
      risers:rows.filter(x=>x.delta>0).sort((a,b)=>b.delta-a.delta).slice(0,3),
      fallers:rows.filter(x=>x.delta<0).sort((a,b)=>a.delta-b.delta).slice(0,3)};
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
      region: pick(CONTENT.REGIONS).id, fame: clamp(R.tierFame[tier] + rint(-5, 5) - (seed ? 0 : 10), 0, 100), status: 'active', foundedWeek: state.week, closedWeek: null,
      films: [], signatureGenre: null, industryLeader:false, leadershipYears:0, marketMemory: {}, comebackCount: 0, qResult: 0, results: [], tierWeek: state.week, lossStreak: 0, winStreak: 0, negQuarters: 0, releases: 0, nextFilmId: 1 };
    const identity = byId(CONTENT.RIVAL_STRATEGIES, r.baseStrategy || r.strategy);
    r.signatureGenre = identity && identity.genres.length ? pick(identity.genres) : pick(CONTENT.GENRES).id;
    r.cash = Math.round(rivalBudget(r) * R.startCashBudgets);
    state.rivals.list.push(r);
    if (seed) greenlight(r, rint(4, 30));
    return r;
  }
  function studioWorldStandings(years,metric,endYear) {
    const end=endYear==null?dateOf().year-1:endYear,from=years===0?TUNING.startYear:end-years+1;
    const groups=new Map();
    const record=(key,name,f)=>{
      const year=f.releaseWeek==null?f.year:dateOf(f.releaseWeek).year;
      if(year==null||year<from||year>end||f.format==='pilot')return;
      const g=groups.get(key)||{id:key,name,films:0,gross:0,quality:0,critics:0,awards:0,international:0,hits:0};
      g.films++;
      g.gross+=f.gross||0;
      g.quality+=f.quality||0;
      g.critics+=f.critic==null?(f.quality||0):f.critic;
      g.international+=Math.max(0,(f.regions||[]).length-1);
      if(f.result==='Hit')g.hits++;
      g.awards+=(f.awards||[]).reduce((n,a)=>n+(a.won?(a.cat==='picture'?3:1):0),0);
      g.awards+=(f.festResults||[]).reduce((n,a)=>n+(a.kind==='winner'?(a.tierRank>=4?1.5:0.5):0),0);
      groups.set(key,g);
    };
    state.projects.forEach(f=>record('you',state.studio.name,f));
    (state.filmArchive&&state.filmArchive.rivals||[]).forEach(f=>record(f.rivalId,f.studio,f));
    const rows=Array.from(groups.values()).map(g=>{
      g.quality=Math.round(g.quality/Math.max(1,g.films)*10)/10;
      g.critics=Math.round(g.critics/Math.max(1,g.films)*10)/10;
      const normalization=Math.pow(1+TUNING.market.audienceGrowth,Math.max(0,end-1970));
      g.score=Math.round((g.quality*.32+g.critics*.38+Math.min(80,g.gross/Math.max(1,g.films)/Math.max(50000,normalization*45000)*5)*.22+
        Math.min(20,g.awards*1.1)*.08)*(0.75+Math.min(.4,g.films*.045))*10)/10;
      g.international=Math.round(g.international*10)/10;
      return g;
    });
    const property=['gross','critics','awards','international','films'].includes(metric)?metric:'score';
    rows.sort((a,b)=>b[property]-a[property]||b.score-a.score||String(a.name).localeCompare(String(b.name)));
    return rows.map((r,i)=>Object.assign({rank:i+1},r));
  }
  function recordWorldYear(year) {
    if (year < TUNING.startYear) return;
    const world=state.world||(state.world={yearbook:[],decadeChampions:[],leadershipEvents:[]});
    if(world.yearbook.some(x=>x.year===year))return;
    const best=(kind)=>studioWorldStandings(1,kind,year)[0]||null;
    const record={year,boxOffice:best('gross')?best('gross').name:null,
      critics:best('critics')?best('critics').name:null,
      awards:best('awards')?best('awards').name:null};
    world.yearbook.push(record);
    if(year%10===9){
      const decade=year-9;
      const champion={decade,boxOffice:(studioWorldStandings(10,'gross',year)[0]||{}).name||null,
        critics:(studioWorldStandings(10,'critics',year)[0]||{}).name||null,
        awards:(studioWorldStandings(10,'awards',year)[0]||{}).name||null,
        international:(studioWorldStandings(10,'international',year)[0]||{}).name||null};
      world.decadeChampions.push(champion);
      addLog('Decade '+decade+'–'+year+' industry honors: audience '+champion.boxOffice+', critics '+champion.critics+', awards '+champion.awards+'.','rival');
    }
  }
  function updateRivalLeaders() {
    const list=activeRivals();if(!list.length)return;
    const since=state.week-156;
    const power=r=>{
      const recent=(state.filmArchive&&state.filmArchive.rivals||[]).filter(f=>f.rivalId===r.id&&f.releaseWeek>=since);
      const n=recent.length;
      const quality=n?recent.reduce((a,f)=>a+(f.quality||0),0)/n:45;
      const hits=recent.filter(f=>f.result==='Hit').length;
      const awardWins=recent.reduce((a,f)=>a+(f.awards||[]).filter(x=>x.won).length,0);
      return quality*.7+hits*3+Math.min(12,awardWins*2)+r.tier*5+r.fame*.08;
    };
    const count=Math.min(list.length, list.length>=12?4:3);
    const leaders=new Set(list.slice().sort((a,b)=>power(b)-power(a)).slice(0,count).map(r=>r.id));
    list.forEach(r=>{
      const was=!!r.industryLeader,now=leaders.has(r.id);
      r.industryLeader=now;
      r.leaderSince=now?(was?r.leaderSince||state.week:state.week):null;
      if(now&&!was){r.leadershipYears=(r.leadershipYears||0)+1;
        (state.world.leadershipEvents=state.world.leadershipEvents||[]).push({year:dateOf().year,rivalId:r.id,name:r.name,event:'rise'});
        addLog(r.name+" emerges as one of the industry's leading studios. Its "+genreName(r.signatureGenre)+' releases are drawing attention.','rival');}
      if(!now&&was){state.world.leadershipEvents.push({year:dateOf().year,rivalId:r.id,name:r.name,event:'fall'});
        addLog(r.name+' falls out of the industry leader group as challengers gain ground.','rival');}
    });
    state.world.leadershipEvents=state.world.leadershipEvents.slice(-100);
  }
  function rivalGenre(r) {
    // A recognizable specialty stays relevant while the studio adapts to the current market.
    if (r.focus && r.focus.length && Math.random() < TUNING.rivals.focusChance) return pick(r.focus);
    if (r.signatureGenre && Math.random() < (r.industryLeader ? 0.70 : r.strategy === 'prestige' ? 0.55 : 0.34)) return r.signatureGenre;
    if (r.strategy === 'trend') return pick(hottestGenres(3));
    const s = byId(CONTENT.RIVAL_STRATEGIES, r.strategy);
    const genres = s && s.genres.length ? s.genres.slice() : CONTENT.GENRES.map(g=>g.id);
    genres.sort((a,b)=>(genreDemand(b)+(r.marketMemory[b]||0)*0.06)-(genreDemand(a)+(r.marketMemory[a]||0)*0.06));
    return Math.random()<0.45 ? pick(genres.slice(0,Math.min(3,genres.length))) : pick(genres);
  }
  const V14_IDENTITY_NAMES={
    developing:'Developing identity',indie:'Independent Storytelling House',prestige:'Prestige Film Studio',
    commercial:'Commercial Entertainment Studio',genre:'Genre / Cult Studio',
    star:'Star-Driven Studio',incubator:'Talent Incubator',
    tv:'Television & Rights Studio',versatile:'Versatile / Generalist Studio'
  };
  function v14StudioFilms(who){
    const list=who==='you'?state.projects.filter(p=>p.stage==='done'&&p.releaseWeek!=null):
      (state.filmArchive?.rivals||[]).filter(f=>String(f.rivalId)===String(who)&&f.stage==='done');
    list.sort((a,b)=>(b.releaseWeek||0)-(a.releaseWeek||0));
    const recent=list.filter(x=>state.week-(x.releaseWeek||0)<=5*TUNING.weeksPerYear);
    return (recent.length>=4?recent:list).slice(0,12);
  }
  function v14IdentityEvidence(who){
    const all=v14StudioFilms(who),count=all.length;
    const totals={indie:0,prestige:0,commercial:0,genre:0,star:0,incubator:0,tv:0,versatile:1};
    let weight=0,profitable=0,popular=0,acclaimed=0,recognitions=0,lowBudget=0;
    const genreCounts={},topicCounts={},talentCounts={};let scene=0,stars=0,breakouts=0,repeatWriters=0;
    const normYear=(f)=>Math.max(0,Math.floor((f.releaseWeek||0)/52));
    all.forEach((f,i)=>{
      const w=Math.pow(.91,i),fmt=f.format||'feature',year=normYear(f);
      const roi=(f.revenue||0)-(f.spent!=null?f.spent:f.budget||0);
      const positive=roi>0,critic=Number(f.critic||0),audience=Number(f.audience||0);
      const budget=(f.budget||0),affordable=budget<=(fmt==='short'?10000:150000)*Math.pow(1.05,year);
      const awards=(f.awards||[]).filter(a=>a.won).length+
        (f.festResults||[]).filter(a=>a.kind==='winner'||/won|prize/i.test(a.result||'')).length;
      const festivals=(f.festResults||[]).filter(x=>x.kind==='selection'||x.kind==='mention'||x.kind==='winner').length;
      const dna=f.dna||{},vision=dna.vision||'';
      weight+=w;profitable+=w*(positive?1:0);popular+=w*(audience>=70?1:0);
      acclaimed+=w*(critic>=73?1:0);recognitions+=w*(awards>0?1:.1*festivals);
      lowBudget+=w*(affordable?1:0);scene+=w*(vision==='bold'||vision==='prestige'?1:0);
      if(f.genre)genreCounts[f.genre]=(genreCounts[f.genre]||0)+w;
      if(f.topic)topicCounts[f.topic]=(topicCounts[f.topic]||0)+w;
      const cast=f.creditIds||f.cast||{};
      const lead=cast.lead??f.talentSnapshot?.lead?.id;
      if(lead!=null){
        const t=getTalent(Number(lead)),fame=f.talentSnapshot?.lead?.fame??t?.fame??0;
        if(fame>=60)stars+=w;
        const key='lead:'+lead;talentCounts[key]=(talentCounts[key]||0)+1;
      }
      for(const role of ['director','writer']){
        const person=cast[role]??f.talentSnapshot?.[role]?.id;
        if(person!=null){
          const key=role+':'+person;talentCounts[key]=(talentCounts[key]||0)+1;
          const t=getTalent(Number(person)),fame=f.talentSnapshot?.[role]?.fame??t?.fame??100;
          if(fame<32&&critic>=65)breakouts+=w*.5;
        }
      }
      totals.indie+=w*((fmt==='short'||affordable)?1:0)*(critic>=56?1:.65);
      totals.prestige+=w*((critic>=73?1:0)+(awards>0?.8:0)+(vision==='prestige'?.35:0));
      totals.commercial+=w*((fmt==='feature'&&positive?.85:0)+(audience>=70?.65:0)+(f.gross>budget*1.5?.35:0));
      totals.star+=w*(fameSafe(f)>=60?.75:0);
      totals.tv+=w*(fmt==='pilot'?1.45:0);
    });
    const genres=Object.entries(genreCounts).sort((a,b)=>b[1]-a[1]);
    const topGenre=genres[0]?.[0]||null,share=(genres[0]?.[1]||0)/Math.max(1,weight);
    // Repeated genre alone is not a cult reputation. Earlier, any single
    // genre (including drama and comedy) multiplied by 2.9 and overwhelmed
    // actual prestige/commercial performance, misclassifying whole careers.
    // Only durable specialist lanes earn this score; profitable mainstream
    // comedy and acclaimed drama remain free to establish their real identity.
    const specialistGenre=['horror','thriller','scifi','western','action'].includes(topGenre);
    totals.genre+=specialistGenre&&share>=.55?
      (share-.35)*weight*1.9+(popular>=weight*.3?.15*weight:0):0;
    totals.incubator+=breakouts*1.6;
    const repeat=Object.values(talentCounts).filter(n=>n>=2).length;
    totals.star+=stars*.65+(repeat>=2?weight*.22:0);
    if(share<.48)totals.versatile=weight*.58;
    const entries=Object.entries(totals).filter(([id])=>id!=='developing'&&id!=='versatile').sort((a,b)=>b[1]-a[1]);
    const winner=entries[0]||['versatile',0],runner=entries[1]?.[1]||0;
    let candidate=count<3?'developing':count<4?'versatile':
      winner[1]>=weight*.67&&winner[1]>=runner+weight*.06?winner[0]:'versatile';
    const descriptors=[];
    if(topGenre&&share>=.50&&count>=3){
      const names={horror:'Horror & Mystery',drama:'Character Drama',comedy:'Comedy Stories',
        scifi:'Science Fiction',action:'Action Cinema',thriller:'Thrillers',documentary:'Documentary Work',
        romance:'Romantic Stories',western:'Frontier Stories'};
      descriptors.push(names[topGenre]||'Genre Specialist');
    }
    if(repeat>=2)descriptors.push('Returning Collaborators');
    if(acclaimed>=weight*.6&&count>=4)descriptors.push('Critical Favorite');
    if(recognitions>=1.5&&count>=4)descriptors.push('Festival Regular');
    if(profitable>=weight*.65&&count>=4)descriptors.push('Consistent Earners');
    if(scene>=weight*.55&&count>=4)descriptors.push('Creator-Led');
    if(breakouts>=1.7&&count>=4)descriptors.push('Emerging Talent');
    if(popular>=weight*.65&&count>=4)descriptors.push('Audience Favorite');
    if(descriptors.length===0&&count>0)descriptors.push(all[0].format==='short'?'Short Filmmaking':'Developing Portfolio');
    const wins=all.reduce((n,f)=>n+(f.awards||[]).filter(a=>a.won).length+
      (f.festResults||[]).filter(a=>a.kind==='winner').length,0);
    const standing=count>=18&&wins>=5?'Iconic':count>=12&&wins>=2?'Established':
      count>=6&&acclaimed>=weight*.40?'Recognized':count>=3?'Emerging':'Newcomer';
    const last=all.slice(0,Math.min(3,count)),past=all.slice(3,6);
    const reception=x=>x.reduce((n,f)=>n+Number(f.critic||f.quality||50),0)/Math.max(1,x.length);
    const trajectory=count<6?'Stable':reception(last)>reception(past)+6?'Rising':
      reception(last)<reception(past)-7?'Cooling':'Stable';
    return {candidate,label:V14_IDENTITY_NAMES[candidate],descriptors:descriptors.slice(0,2),
      standing,trajectory,count,topGenre,lead:Math.round(winner[1]*10)/10,
      evidence:all.slice(0,4).map(f=>({id:who==='you'?f.id:f.id,title:f.title,
        genre:f.genre,critics:f.critic||null,profit:(f.revenue||0)-(f.spent!=null?f.spent:f.budget||0),
        awards:(f.awards||[]).filter(x=>x.won).length}))};
  }
  function fameSafe(f){const x=f.talentSnapshot?.lead?.fame??getTalent(Number(f.creditIds?.lead))?.fame;
    return Number.isFinite(x)?x:0;}
  function v14Identity(who){
    if(!state)return null;
    const id=who==null||who==='you'?'you':String(who);
    const computed=v14IdentityEvidence(id);
    const stable=v14State().classifications?.[id];
    return Object.assign({},computed,{primary:stable?.primary||computed.candidate,
      label:V14_IDENTITY_NAMES[stable?.primary||computed.candidate],
      standing:stable?.standing||computed.standing});
  }
  function v14ClassificationTick(){
    const v=v14State(),index=v.classifications||(v.classifications={});
    for(const id of ['you',...activeRivals().map(r=>String(r.id))]){
      const data=v14IdentityEvidence(id),old=index[id]||
        {primary:'developing',candidate:'developing',streak:0,standing:'Newcomer'};
      if(data.candidate===old.candidate)old.streak++;
      else {old.candidate=data.candidate;old.streak=1;}
      const previous=old.primary,valid=data.count>=4||data.candidate==='developing';
      if(valid&&old.streak>=2&&data.candidate!==old.primary){
        old.primary=data.candidate;
        if(id==='you'){
          v.classChanges.push({week:state.week,from:previous,to:old.primary});
          if(v.classChanges.length>12)v.classChanges.shift();
          addLog('The industry now recognizes '+state.studio.name+' as a '+
            V14_IDENTITY_NAMES[old.primary]+', based on its recent releases.','studio');
        }
      }
      const ladder=['Newcomer','Emerging','Recognized','Established','Iconic'];
      if(ladder.indexOf(data.standing)>ladder.indexOf(old.standing))old.standing=data.standing;
      index[id]=old;
    }
  }

  function v14RivalIncident(kind,r,projectId,detail){
    const v=v14State();
    v.rivalry.push({week:state.week,kind,rivalId:r.id,rival:r.name,projectId:projectId||null,
      detail:String(detail).slice(0,135)});
    if(v.rivalry.length>24)v.rivalry.splice(0,v.rivalry.length-24);
  }
  function v14RivalScriptTick(){
    const v=v14State(),quarter=Math.floor(state.week/13);
    const scripts=v14Pitches();
    if(v.auctionQuarter===quarter || state.week%13<6)return;
    v.auctionQuarter=quarter;
    const script=scripts.find(p=>p.contested&&!p.claimedBy);
    if(!script)return;
    const r=getRival(script.rivalId);
    if(!r||r.status!=='active'||r.cash<script.fee+Math.max(20000,rivalBudget(r))||
      r.films.filter(f=>f.stage==='planned').length>=TUNING.rivals.maxPlanned)return;
    const movie=greenlight(r,rint(12,22),script);
    if(movie){
      script.claimedBy='rival:'+r.id;
      v14RivalIncident('script',r,null,r.name+' secured screenplay "'+script.title+'" over the open market.');
      addLog(r.name+' acquires "'+script.title+'" for '+fmtMoney(script.fee)+
        ' and prepares an upcoming film.','rival');
    }
  }
  function greenlight(r, lead, pitch) {
    const R = TUNING.rivals, S = stratDef(r.strategy);
    let budget = rivalBudget(r) * rnd(0.7, 1.3);
    if (r.cash < budget) budget *= 0.5;
    budget = Math.round(Math.min(budget, audienceCap() * R.maxBudgetCap) / 1000) * 1000;
    const tq = Math.min(R.talentQualityMax, rivalTalent(r).length * R.talentQuality);
    // Rival talent is measured by actual craft, not name recognition; leading studios
    // are stronger when making films within the genre they know best.
    const craft = role => { const arr=rivalTalent(r).filter(t=>t.role===role); return arr.length?Math.max(...arr.map(t=>t.skill||50)):50; };
    const skillCraft=(craft('director')-50)*.17+(craft('writer')-50)*.13+(craft('actor')-50)*.10+(craft('crew')-50)*.045;
    // v14.1: only studios that have actually grown, delivered pictures and
    // invested in productions acquire sustained craft infrastructure.
    const earnedCraft=Math.min(6,Math.max(0,r.tier-1)*1.0+
      Math.min(2,Math.floor((r.releases||0)/25))+(r.industryLeader?1:0));
    const hits=(state.filmArchive&&state.filmArchive.rivals||[]).filter(x=>x.rivalId===r.id && x.result==='Hit' && x.stage==='done' && !x.sequelOf && x.releaseWeek!=null && state.week-x.releaseWeek<52*8 && !r.films.some(y=>y.sequelOf===x.id));
    const sequelSource=!pitch&&hits.length && Math.random()<.07 ? pick(hits) : null;
    const genre = pitch?pitch.genre:sequelSource ? sequelSource.genre : rivalGenre(r);
      const topics = CONTENT.TOPICS.filter(t => t.good.includes(genre));
      const subject = pitch?{id:pitch.topic}:sequelSource && sequelSource.topic ? {id:sequelSource.topic} : (topics.length ? pick(topics) : pick(CONTENT.TOPICS));
      const owned = rivalTalent(r);
      const credits = {}, creditIds={};
      [['director', 'director'], ['writer', 'writer'], ['lead', 'actor'], ['crew', 'crew']].forEach(pair => {
        const people = owned.filter(t => t.role === pair[1]);
        const chosen=people.length?pick(people):null;
        credits[pair[0]]=chosen?chosen.name:pick(CONTENT.FIRST_NAMES)+' '+pick(CONTENT.LAST_NAMES);
        if(chosen)creditIds[pair[0]]=chosen.id;
      });
    // Rival releases carry a supporting role so lead and supporting awards have real competition.
    const support=owned.filter(t=>t.role==='actor'&&t.id!==creditIds.lead);
    const supporting=support.length?pick(support):null;
    credits.supporting=supporting?[supporting.name]:[pick(CONTENT.FIRST_NAMES)+' '+pick(CONTENT.LAST_NAMES)];
    creditIds.supporting=supporting?[supporting.id]:[];
    const f = { id: r.nextFilmId++, title: pitch?pitch.title:sequelSource ? (sequelSource.title + ' II').slice(0,60) : randomTitle(), genre: genre, topic: subject.id,
      dna:pitch?{hook:pitch.hook,strengths:pitch.strengths.slice(),risk:pitch.risk,vision:pitch.vision,lane:pitch.vision==='bold'?'genre':'arthouse',origin:'marketplace'}:null,
      sequelOf:sequelSource ? sequelSource.id : null, franchiseId:sequelSource ? (sequelSource.franchiseId||sequelSource.id) : null, franchiseName:sequelSource?sequelSource.title:null, installment:sequelSource?2:1,
      startWeek: state.week, credits: credits,creditIds:creditIds, region: r.region, regions: [r.region].concat(r.tier >= 2 ? CONTENT.REGIONS.filter(z => z.id !== r.region).slice(0, Math.min(2,r.tier - 1)).map(z => z.id) : []), regionalGross: {}, budget: budget,
      quality: clamp(Math.round(rnd(S.quality[0], S.quality[1]) + tq + skillCraft + earnedCraft + (r.industryLeader && genre === r.signatureGenre ? 3 : 0) + (r.tier - 1) * R.tierQuality + eraQuality(genre)), 1, 100),
      hype: clamp(Math.round(rnd(S.hype[0], S.hype[1]) + r.fame * R.fameHype + (r.tier - 1) * R.tierHype + (sequelSource ? 7 : 0)), 0, 100),
      week: 0, stage: 'planned', checked: false, moved: false, opening: 0, gross: 0, revenue: 0, weeksIn: 0, result: null };
    lead = lead || rint(R.leadWeeks[0], R.leadWeeks[1]);
    f.week = bestWeek(r, f, state.week + lead - 2, state.week + lead + 3);
    r.cash -= budget+(pitch?pitch.fee:0);
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
    const pressure = bg + rivalPressure(w, f.genre, f).weight / (1 + Math.max(0, activeRivals().length - 6) * 0.035) + playerPressure(w, f.genre);
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
    const pressure = (state.market.slate[0] || 0) + rivalPressure(state.week, f.genre, f).weight / (1 + Math.max(0, activeRivals().length - 6) * 0.035) + playerPressure(state.week, f.genre);
    const mult = genreDemand(f.genre) * seasonMult(state.week) * cycleMult() / (1 + M.competitionPenalty * pressure);
    const ref = TUNING.boxOfficeRefBudget;
    const raw = ref * Math.pow(f.budget / ref, TUNING.boxOfficeBudgetExp) * TUNING.boxOfficeBase * R.boxMult * qualityFactor(f.quality) *
      (0.6 + f.hype / 100) * g.audience * luck() * mult * eraMods().boxOffice;
    const cap = audienceCap();
    f.opening = Math.round(cap * (1 - Math.exp(-raw / cap)));
    f.stage = 'release';
    f.critic = clamp(Math.round(f.quality + rnd(-12, 12)), 1, 100);
    f.audience = audienceScore(f, genreDemand(f.genre));
    f.review = receptionText(f);
    f.weeksIn = 0;
    archiveRivalFilm(r, f);
    for(const role of ['director','writer']){
      const id=f.creditIds&&f.creditIds[role],t=id==null?null:getTalent(id);
      if(!t)continue;
      t.worldCredits=t.worldCredits||[];
      const filmId='rival:'+r.id+':'+f.id;
      if(!t.worldCredits.includes(filmId))t.worldCredits.push(filmId);
      if(f.quality>=84)careerEvent(t,'breakthrough','Notable '+role+' credit on "'+f.title+'" for '+r.name+'.',filmId);
    }
    f.studioReleasesAtRelease = r.releases;
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
    f.lastWeekGross = gross;
    const sectors = f.regions || [r.region || 'northamerica'];
    const weights = sectors.map(id => id === r.region ? 1 : 0.24 * ((byId(CONTENT.REGIONS,id)||{audience:1}).audience));
    const tw = weights.reduce((a,b)=>a+b,0);
    let allocated = 0;
    sectors.forEach((id,i)=>{const n=i===sectors.length-1?gross-allocated:Math.round(gross*weights[i]/tw);allocated+=n;f.regionalGross[id]=(f.regionalGross[id]||0)+n;});
    f.revenue += rev;
    r.cash += rev;
    tallyGross(r.id, gross);
    if (gross < f.opening * 0.025 || f.weeksIn >= TUNING.maxReleaseWeeks) rivalFinish(r, f);
  }
  function rivalFinish(r, f) {
    const R = TUNING.rivals;
    f.stage = 'done';
    const profit = f.revenue - f.budget;
    f.result = profit < 0 ? 'Flop' : (profit >= f.budget ? 'Hit' : 'Profit');
    r.qResult += profit;
    r.marketMemory = r.marketMemory || {};
    r.marketMemory[f.genre] = clamp((r.marketMemory[f.genre] || 0) * .75 + (f.result === 'Hit' ? 2 : f.result === 'Profit' ? 0.5 : -1), -4, 4);
    if (f.result === 'Hit' && f.critic >= 70 && Math.random()<.28) r.signatureGenre=f.genre;
    r.fame = clamp(r.fame + (f.result === 'Hit' ? 4 : f.result === 'Profit' ? 1 : -2), 0, 100);
    archiveRivalFilm(r, f);
    if (f.result === 'Hit' && f.gross >= R.newsGross * eraScale()) addLog(rtx('hit', { rival: r.name, title: f.title, gross: fmtMoney(f.gross) }), 'rival');
    const prevStreak = r.hitStreak || 0;
    r.hitStreak = f.result === 'Hit' ? prevStreak + 1 : 0;
    if (r.hitStreak === 3) addLog(r.name + ' is on a three-film hit streak. Rival exhibitors are taking notice.', 'rival');
    if (prevStreak >= 3 && f.result === 'Flop') addLog(r.name + ' ends a winning streak with the disappointing release of "' + f.title + '".', 'rival');
    if (r.lossStreak >= 2 && f.result === 'Hit' && r.comebackCount < 5) { r.comebackCount++; addLog(r.name + ' rebounds from a rough stretch with "' + f.title + '".', 'rival'); }
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
        if(p.dna){filmStory(p,'rival',r.name+' moved "'+f.title+'" away from our release week.');
          v14RivalIncident('release',r,p.id,'Shifted '+f.title+' to avoid '+p.title+'.');}
      } else if (f.genre === p.genre) {
        addLog(rtx('holds', { rival: r.name, title: f.title, genre: genreName(f.genre), mine: p.title }), 'rival');
        if(p.dna){filmStory(p,'rival',r.name+' kept "'+f.title+'" against our opening.');
          v14RivalIncident('release',r,p.id,'Held an opening opposite '+p.title+'.');}
      }
    }));
  }
  function rivalTick() {
    const R = TUNING.rivals;
    v14RivalScriptTick();
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
      } else if (r.strategy !== 'trend') {
        const best = Object.keys(r.marketMemory || {}).sort((a,b)=>r.marketMemory[b]-r.marketMemory[a])[0];
        r.focus = best && r.marketMemory[best] >= 1.2 ? [best,r.signatureGenre].filter(Boolean) : null;
      }
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
    if (r.fame >= 75) state.stopFlag = true; // minor rival closures are routine news, not blocking popups.
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
    recordWorldYear(dateOf().year-1);
    updateRivalLeaders();
    bo.last = { year: bo.year, you: bo.you, rivals: bo.rivals };
    bo.year = dateOf().year;
    bo.you = 0;
    bo.rivals = {};
    if (activeRivals().length < R.maxCount && state.rivals.upstartWeek == null && Math.random() < R.upstartYearChance + Math.min(.18, (dateOf().year - 1970) * 0.003))
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
      focusNames: (r.focus || []).map(genreName), identity: r.baseStrategy==='prestige'?'Prestige House':r.baseStrategy==='blockbuster'?'Blockbuster Studio':r.baseStrategy==='cheap'?'Indie Genre Specialist':'Trend Challenger',
      leader:!!r.industryLeader, leadershipYears:r.leadershipYears||0 });
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
    // Unspent contingency is neither a produced episode nor earned licensing value.
    // Preserve legacy TV contracts, but price new flexible pilots on funded work.
    const financedBudget=p.budgetPlan?v144EffectiveBudget(p):p.budget;
    const topicLift = (topicMarket(p.topic).demand - 1) * 0.22;
    const bonus=p.dna&&v14UseOffer('tv',p)?0.035:0;
    // Web commissions have their own era-appropriate audience access, while
    // retaining the established bounded pilot-pickup outcome rules.
    const isWeb=p.mediaVariant==='web';
    const chance = clamp((score - T.pickupMin) / T.pickupRange + em.pickup + topicLift + bonus, T.pickupFloor, T.pickupCeil);
    p.stage = 'done';
    if (Math.random() < chance) {
      if(isWeb)p.estimatedOnlineViews=0;else p.estimatedHouseholdImpressions=0;
      const epCost = p.budgetPlan?Math.round(v144EffectiveBudget(p)*(p.mediaVariant==='web'?.78:.92)):
        Math.round(p.budget * T.episodeCostShare);
      const fee = Math.round(epCost * (T.feeBase + score / T.feeScore) * em.tvFee);
      const pilotFee = Math.round(financedBudget * T.pilotFeeShare);
      p.result = 'Picked up';
      p.revenue += pilotFee;
      earn(pilotFee);
      const s = { id: state.nextSeriesId++, projectId: p.id, title: p.title, genre: p.genre, topic: p.topic, season: 1,
        episodes:p.requestedEpisodes||rint(T.episodes[0],T.episodes[1]), aired: 0,
        epCost: epCost, fee: fee, quality: p.quality, hype: p.hype, ratings: [], seasonAvgs: [],
        status:'airing',hiatusLeft:0,revenue:pilotFee,cost:0,
        flexibleSeries:!!p.budgetPlan,mediaVariant:p.mediaVariant||'pilot',
        scope:p.productionScope||'standard',firstEpCost:epCost,episodeBudget:epCost,
        castIds:castTalent(p).map(t=>t.id),talentStrategy:'retain',
        nextEpisodeCount:p.requestedEpisodes||null,seasonHistory:[],sponsor:null,sponsorOffer:null,
        sponsorRevenue:0,sponsorOffersMade:0,lastSeasonCost:0,starDemand:1,
        renewalChance:null,ratingsTrend:0,showMomentum:0 };
      state.series.push(s);
      state.studio.fame = clamp(state.studio.fame + 2, 0, 100);
      addLog((isWeb?'The online platform commissioned ':'The network picked up ')+'"'+p.title+'": '+
        s.episodes+' episodes at '+fmtMoney(fee)+' each (cost '+fmtMoney(epCost)+'). Initial fee '+fmtMoney(pilotFee)+'.','tv');
    } else {
      const devFee = Math.round(financedBudget * T.passFeeShare);
      p.result = 'Passed';
      p.revenue += devFee;
      if(isWeb)p.estimatedOnlineViews=null;else p.estimatedHouseholdImpressions=null;
      earn(devFee);
      addLog((isWeb?'Online platforms':'Networks')+' passed on "'+p.title+'" (development fee '+fmtMoney(devFee)+').','tv');
    }
    emit('tv', p);
  }
  function seriesFeasibility(id){
    const s=typeof id==='object'?id:getSeries(id);
    if(!s)return null;
    const episodes=Math.max(0,(s.episodes||0)-(s.aired||0));
    const cost=Math.max(0,(s.epCost||0)*episodes);
    const earned=(s.fee||0)*episodes;
    const guaranteed=s.sponsor&&s.sponsor.season===s.season?
      (s.sponsor.perEpisode||0)*episodes:0;
    // Unsigned offers are never counted as guaranteed income.
    const margin=earned+guaranteed-cost;
    const cash=state.cash;
    const firstWeek=(s.epCost||0)+TUNING.livingCost+weeklySalaries()+weeklyPayroll()+weeklyOverhead();
    const risk=margin<0?'Underfunded':cash<firstWeek?'Lean but achievable':'Comfortable';
    return {season:s.season,episodes,productionNeed:cost,contractedRevenue:earned,
      guaranteedSponsorship:guaranteed,uncommittedOffers:s.sponsorOffer?s.sponsorOffer.perEpisode:0,
      projectedDirectMargin:margin,firstWeekCashNeed:firstWeek,
      status:risk,scope:s.scope||'standard',starDemand:s.starDemand||1,
      note:margin<0?'Contract income does not cover remaining episode costs; sponsor proposals are not guaranteed.':
        cash<firstWeek?'Studio cash is thin for the next episode plus weekly obligations.':
          'Current booked episode income can support scheduled production before major disruptions.'};
  }
  function seriesPlan(id,kind,episodes){
    const s=getSeries(id);
    if(!s||!s.flexibleSeries||s.status==='ended')return {ok:false,reason:'Only active flexible-budget series can change their next-season plan.'};
    if(!['retain','lean','recast'].includes(kind))return {ok:false,reason:'Unknown cast strategy.'};
    s.talentStrategy=kind;
    if(episodes!=null)s.nextEpisodeCount=clamp(Math.round(Number(episodes)||s.episodes),4,16);
    save();emit('tv',s);
    return {ok:true,kind,episodes:s.nextEpisodeCount};
  }
  function seriesScope(id,scope){
    const s=getSeries(id);
    if(!s||!s.flexibleSeries||s.status==='ended'||!FinalCutBudget.SCOPE[scope])
      return {ok:false,reason:'No active series or invalid production scope.'};
    s.scope=scope;save();emit('tv',s);return {ok:true};
  }
  function signSeriesSponsor(id){
    const s=getSeries(id);
    if(!s||s.status!=='airing'||!s.sponsorOffer||s.sponsorOffer.season!==s.season||
      s.aired>s.sponsorOffer.expiresEpisode)return {ok:false,reason:'There is no eligible sponsor offer.'};
    s.sponsor=Object.assign({},s.sponsorOffer);
    s.sponsorOffer=null;
    addLog(s.sponsor.name+' signs for '+fmtMoney(s.sponsor.perEpisode)+'/remaining episode with "'+s.title+'".','tv');
    save();emit('tv',s);return {ok:true};
  }
  function declineSeriesSponsor(id){
    const s=getSeries(id);
    if(!s||!s.sponsorOffer)return {ok:false,reason:'No active offer.'};
    s.sponsorOffer=null;save();emit('tv',s);return {ok:true};
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
      const base = (s.quality * T.ratingQuality + s.hype * T.ratingHype) * genreDemand(s.genre) * topicMarket(s.topic).demand * Math.pow(T.seasonFatigue, s.season - 1) * (1 + (s.showMomentum || 0));
      const prev = s.ratings.length ? s.ratings[s.ratings.length - 1] : base;
      const r = clamp(Math.round((prev * 0.6 + base * 0.4) * rnd(0.9, 1.1) * 10) / 10, 0.5, 30);
      s.ratings.push(r);
      s.aired++;
      // Flexible shows have bounded audience bonuses; legacy contracts are unchanged.
      const earnedBonusRate=Math.max(0,(r-T.bonusThreshold)*T.bonusPerPoint);
      const bonus=Math.round(s.epCost*(s.flexibleSeries?Math.min(.22,earnedBonusRate):earnedBonusRate));
      // Signed sponsorship pays per actual aired episode, never upfront or twice.
      const sponsorPay=s.sponsor&&s.sponsor.season===s.season?s.sponsor.perEpisode:0;
      revenue += s.fee + bonus+sponsorPay;
      cost += s.epCost;
      s.revenue += s.fee + bonus+sponsorPay;
      s.sponsorRevenue=(s.sponsorRevenue||0)+sponsorPay;
      s.cost += s.epCost;
      if(s.flexibleSeries&&s.aired>=3&&!s.sponsorOffer&&!s.sponsor&&s.sponsorOffersMade!==s.season){
        const recent=s.ratings.slice(-3).reduce((a,n)=>a+n,0)/Math.min(3,s.ratings.length);
        if(recent>=7.5){
          const tier=recent>=15?'National':recent>=10?'Regional':'Local';
          const offer=Math.round(s.epCost*Math.min(.36,.04+(recent-7)*.024));
          if(offer>0){
            s.sponsorOffer={name:tier+' Screen Partners',tier,perEpisode:offer,season:s.season,expiresEpisode:Math.min(s.episodes-1,s.aired+3)};
            s.sponsorOffersMade=s.season;
            addLog('A '+tier.toLowerCase()+' sponsor has offered '+fmtMoney(offer)+
              '/episode for "'+s.title+'". Accept or decline in TV before the offer expires.','tv');
          }
        }
      }
      if(s.sponsorOffer&&s.aired>s.sponsorOffer.expiresEpisode)s.sponsorOffer=null;
      const p = getProject(s.projectId);
      if (p) {
        if(s.flexibleSeries){
          p.seriesRevenue=(p.seriesRevenue||0)+s.fee+bonus+sponsorPay;
          p.seriesSpend=(p.seriesSpend||0)+s.epCost;
        }else{p.revenue += s.fee + bonus+sponsorPay; p.spent += s.epCost;}
        if(s.mediaVariant==='web')p.estimatedOnlineViews=(p.estimatedOnlineViews||0)+
          Math.round(Math.max(0,r)*1250*Math.pow(1.033,Math.max(0,dateOf().year-1995)));
        else p.estimatedHouseholdImpressions=(p.estimatedHouseholdImpressions||0)+householdImpressionsForRating(r,state.week);
      }
      if (s.aired >= s.episodes) endSeason(s);
    });
    return { revenue: revenue, cost: cost };
  }
  function endSeason(s) {
    const T = TUNING.tv;
    const avg = Math.round(s.ratings.reduce((a, r) => a + r, 0) / s.ratings.length * 10) / 10;
    const previous = s.seasonAvgs.length ? s.seasonAvgs[s.seasonAvgs.length - 1] : avg;
    const trend = avg - previous;
    s.seasonAvgs.push(avg);
    s.seasonHistory=s.seasonHistory||[];
    s.seasonHistory.push({season:s.season,avg,episodes:s.episodes,episodeCost:s.epCost,
      episodeFee:s.fee,sponsorRevenue:s.sponsorRevenue||0,scope:s.scope||null,
      strategy:s.talentStrategy||'retain'});
    if(s.flexibleSeries){
      const fameGain=clamp(Math.round((avg-6)*.62),0,9);
      (s.castIds||[]).forEach((id,i)=>{
        const t=getTalent(id);if(!t)return;
        const original=t.fame;
        const rise=Math.max(0,Math.round(fameGain*(i===0?1:.7)));
        t.fame=clamp(t.fame+rise,0,100);
        const career=ensureCareer(t);career.peakFame=Math.max(career.peakFame||original,t.fame);
        if(rise>=5)career.trend='Rising star';
      });
    }
    s.lastRatings = s.ratings;
    s.ratings = [];
    const margin = s.fee / Math.max(1, s.epCost) - 1;
    const chance = clamp(0.52 + (avg - T.renewAvg) * 0.085 + trend * 0.06 + margin * 0.04 + T.renewLuck - 0.1 - (s.season - 1) * 0.025, T.renewalFloor, T.renewalCeil);
    s.renewalChance = Math.round(chance * 100) / 100;
    s.ratingsTrend = Math.round(trend * 10) / 10;
    const renew = s.season < T.maxSeasons && Math.random() < chance;
    if (!renew) {
      s.status = 'ended';
      const fame = s.season >= 3 ? 2 : 0;
      state.studio.fame = clamp(state.studio.fame + fame, 0, 100);
      addLog('"' + s.title + '" ends after ' + s.season + ' season' + (s.season > 1 ? 's' : '') + ' (season average ' + avg + ', trend ' + (trend>=0?'+':'') + s.ratingsTrend + ').', 'tv');
    } else {
      s.season++;
      s.aired = 0;
      s.episodes=s.flexibleSeries?(s.nextEpisodeCount||s.episodes):rint(T.episodes[0],T.episodes[1]);
      const previousFee=s.fee;
      s.fee=Math.round(previousFee*(1+T.renewFeeRaise));
      if(s.flexibleSeries){
        // Proven audience demand earns a limited fee raise but cannot remove
        // the financial decision between keeping stars, going lean or recasting.
        const ratingsPremium=Math.min(.16,Math.max(0,avg-T.renewAvg)*.018);
        s.fee=Math.round(previousFee*(1+T.renewFeeRaise+ratingsPremium));
        // Fame + proven demand create sharply rising quotes; only unsigned
        // renewals renegotiate. Premium is bounded by the first season's cost.
        const stars=(s.castIds||[]).map(id=>getTalent(id)).filter(Boolean);
        const avgFame=stars.length?stars.reduce((a,t)=>a+t.fame,0)/stars.length:20;
        const fanPressure=Math.max(0,avg-7)*.16+Math.max(0,avgFame-35)*.016;
        s.starDemand=1+Math.min(2.7,fanPressure);
        const strategy=s.talentStrategy||'retain';
        const rehire=strategy==='recast'?.62:strategy==='lean'?.86:1;
        const baseline=s.firstEpCost*(.60+.40*s.starDemand)*Math.pow(1.045,s.season-1);
        const scopeMult=s.scope==='ambitious'?1.35:s.scope==='intimate'?.91:1;
        s.epCost=Math.round(Math.min(s.firstEpCost*5,baseline*rehire*scopeMult));
        s.episodeBudget=s.epCost;
        if(strategy==='recast'){
          const p=getProject(s.projectId);
          if(p&&typeof p.cast?.lead==='number')s.castIds=s.castIds.filter(id=>id!==p.cast.lead);
          s.quality=Math.max(1,s.quality-2);s.hype=Math.max(0,s.hype-9);
        }else if(strategy==='lean')s.quality=Math.max(1,s.quality-3);
        s.sponsor=null;s.sponsorOffer=null;s.sponsorRevenue=0;
      }else s.epCost = Math.round(s.epCost * (1 + T.renewCostRaise));
      const creativeRefresh = avg > T.renewAvg + 2 && Math.random() < 0.22 ? rint(1, 3) : 0;
      s.quality = clamp(s.quality - T.qualityDecay + creativeRefresh, 1, 100);
      s.hype = clamp(Math.round(s.hype * .35 + avg * 3.5), 0, 100);
      s.showMomentum = clamp((s.showMomentum || 0) * .5 + (trend > 1.5 ? 0.06 : trend < -1.5 ? -0.06 : 0), -0.12, 0.12);
      s.status = 'hiatus';
      s.hiatusLeft = T.hiatusWeeks;
      state.studio.fame = clamp(state.studio.fame + 1, 0, 100);
      addLog('"' + s.title + '" is renewed for season ' + s.season + ' (season average ' + avg + ', ratings trend ' + (trend >= 0 ? '+' : '') + s.ratingsTrend + ', new fee ' + fmtMoney(s.fee) + '/episode).', 'tv');
    }
    // Routine renewals belong in the TV page and Studio Wire. Endings and a final-season announcement still pause play.
    if (!renew || s.season === T.maxSeasons) state.stopFlag = true;
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
      if (state.week % 13 === 0 && d.strikeWeeks <= 0 && d.morale >= 65 && d.skill < S.maxSkill && Math.random() < 0.55) d.skill = Math.min(S.maxSkill, Math.round((d.skill + 0.35) * 100) / 100);
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
    return (p.quality || 0) * 0.52 + (p.critic == null ? p.quality || 0 : p.critic) * 0.48 +
      Math.min(3, (state.studio.prestige || 0) * 0.04) +
      (p.format==='short'&&p.shortFestivalPressKit?TUNING.shortScreening.festivalPressScore:0)+
      (p.v14FestivalConnection||0);
  }
  function festivalFocus(f, p) {
    if (!f.focus) return 0;
    if (f.focus === 'short') return p.format === 'short' ? 5 : -100;
    if (f.focus === 'indie') return p.budget <= 350000 ? 5 : -100;
    if (f.focus === 'debut') return (p.studioReleasesAtRelease || 0) < 10 ? 5 : -100;
    if (f.focus === 'documentary') return p.genre === 'documentary' ? 6 : -100;
    if (f.focus === 'horror') return ['horror','thriller'].includes(p.genre) ? 6 : -100;
    if (f.focus === 'scifi') return p.genre === 'scifi' ? 6 : -100;
    if (f.focus === 'romance') return p.genre === 'romance' ? 6 : -100;
    if (f.focus === 'thriller') return p.genre === 'thriller' ? 6 : -100;
    if (f.focus === 'audience') return (p.hype || 0) * 0.05;
    if (f.focus === 'international') return Math.min(3, ((p.regions || []).length - 1) * 1.1);
    return 0;
  }
  function currentFestivals(year) { return CONTENT.AWARDS.circuit.filter(f => (f.startYear || 1970) <= (year || dateOf().year)); }
  function festivalPlan(p) {
    const world = currentFestivals();
    const max = p.format === 'short' ? Math.min(TUNING.awards.festivalMaxShortEntries, dateOf().year < 1990 ? 1 : dateOf().year < 2010 ? 2 : 3) :
      Math.min(TUNING.awards.festivalMaxEntries, dateOf().year < 2000 ? 3 : 4);
    const merit = festivalMerit(p);
    const eligible = world.filter(f => (f.formats || ['short','feature']).includes(p.format) && festivalFocus(f,p) > -50 && merit + 5 >= f.entryScore);
    // Entries are not selections or prizes; screeners evaluate those later.
    const ranked = eligible.map(f => ({ f: f, score: Math.random() * 15 - Math.abs(merit - (f.entryScore + 8)) * 0.5 +
      f.tier * 1.1 + Math.max(0,festivalFocus(f,p))*1.8 }));
    ranked.sort((a,b) => b.score-a.score);
    return (ranked.length ? ranked : [{ f: world[0] }]).slice(0, max).map(x => x.f.id);
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
  function giveTalentAward(t, won, award) {
    const A = TUNING.awards;
    t.awards = t.awards || { noms: 0, wins: 0 };
    t.awardHistory = t.awardHistory || [];
    if(award&&!t.awardHistory.some(x=>x.year===award.year&&x.cat===award.cat&&x.ceremonyId===award.ceremonyId&&x.filmId===award.filmId))
      t.awardHistory.push({year:award.year,cat:award.cat,category:award.category,ceremony:award.ceremony,ceremonyId:award.ceremonyId,filmId:award.filmId,film:award.film,role:award.role,won});
    t.awardHistory=t.awardHistory.slice(-60);
    careerEvent(t,won?'award':'nomination',(won?'Won ':'Nominated for ')+award.category+' at '+award.ceremony+'.',award.filmId);
    if (won) { t.awards.wins++; t.fame = clamp(t.fame + A.talentWinFame, 0, 100); t.skill = clamp(t.skill + A.talentWinSkill, 0, 100); }
    else { t.awards.noms++; t.fame = clamp(t.fame + A.talentNomFame, 0, 100); }
  }
  function festivalTick() {
    const A = TUNING.awards, wk = dateOf().week, year = dateOf().year;
    currentFestivals().filter(f => f.week === wk).forEach(f => {
      const entries = [];
      state.projects.forEach(p => {
        if (!['short','feature'].includes(p.format) || p.releaseWeek == null || p.critic == null || p.releaseWeek > state.week || state.week-p.releaseWeek > A.festWindow) return;
        p.festivals = p.festivals || [];
        p.festivalPlan = p.festivalPlan || festivalPlan(p);
        if (!p.festivalPlan.includes(f.id) || p.festivals.includes(f.id)) return;
        p.festivals.push(f.id);
        entries.push({ player:p, score:festivalMerit(p)+(p.buzz || 0)*.25+festivalFocus(f,p)+rnd(-11,11) });
      });
      // Rival films compete as real juried entrants, rather than merely simulated odds.
      const rivals = (state.filmArchive ? state.filmArchive.rivals : []).filter(x => x.stage==='done' && x.critic!=null &&
        x.releaseWeek <= state.week && state.week-x.releaseWeek <= A.festWindow && (f.formats || ['short','feature']).includes(x.format) &&
        festivalFocus(f,x)>-50 && (x.quality*.52+x.critic*.48)+5 >= f.entryScore &&
        !(x.festResults || []).some(z => z.id === f.id && z.year === year));
      // One submission per rival, modest circuit participation to protect indie opportunities.
      const seen = new Set();
      rivals.sort((a,b) => b.quality-a.quality).forEach(x => {
        if (seen.has(x.rivalId) || Math.random() > 0.35 || entries.length > 26) return;
        seen.add(x.rivalId);
        entries.push({ rival:x, score:x.quality*.52 + x.critic*.48 + festivalFocus(f,x) + rnd(-11,11) });
      });
      if (!entries.length) return;
      entries.sort((a,b) => b.score-a.score);
      // International and World juries require exceptional work and credible competition;
      // local circuits remain approachable for small independent filmmakers.
      const major = f.tier >= 4;
      const victoryFloor = f.winner + (f.tier >= 5 ? 6 : major ? 4 : 0) + A.festivalWinFloorBonus;
      // Two festival wins per film is a rare sweep. Others remain eligible for
      // Official Selection, mentions, and future independent opportunities.
      const canWin = e => {
        const film=e.player||e.rival;
        const priorWins=(film.festResults||[]).filter(x=>x.kind==='winner');
        // Festival seasons offer many screenings but only a handful of trophies
        // to a single studio; apply the same scarcity to rivals and the player.
        const studioId=e.player?'you':'rival:'+film.rivalId;
        const studioWins=state.projects.filter(p=>studioId==='you' && (p.festResults||[]).some(x=>x.year===year && x.kind==='winner')).reduce((n,p)=>n+(p.festResults||[]).filter(x=>x.year===year&&x.kind==='winner').length,0) +
          (state.filmArchive&&state.filmArchive.rivals||[]).reduce((n,f)=>n+((studioId==='rival:'+f.rivalId)?(f.festResults||[]).filter(x=>x.year===year&&x.kind==='winner').length:0),0);
        return priorWins.length<A.festivalMaxWinsPerFilm && studioWins<A.festivalMaxStudioWinsPerYear;
      };
      const winner = (!major || entries.length >= 2) ? entries.find(e=>e.score >= victoryFloor && canWin(e)) || null : null;
      const shortPrize = entries.find(x => (x.player || x.rival).format === 'short' &&
        canWin(x) && x.score >= (major ? Math.max(f.selection + 9, victoryFloor - 3) : f.selection + 5));
      entries.forEach((e,i) => {
        const film = e.player || e.rival, score=e.score;
        let result = 'Not selected', kind = 'rejected';
        if (e === winner) { result = f.prize; kind = 'winner'; }
        else if (winner && e === shortPrize && winner !== shortPrize && e.score >= f.selection + 6) {
          result = 'Best Short Film'; kind = 'winner';
        } else if (i === (winner ? 1 : 0) && score >= f.selection + 6) {
          result = 'Jury Special Mention (Runner-Up)'; kind = 'mention';
        } else if (score >= f.selection) { result = 'Official selection'; kind = 'selection'; }
        const rec = { id:f.id, year:year, festival:f.name, tier:f.level, tierRank:f.tier, result:result, kind:kind };
        if (e.player) {
          const p = e.player;
          p.festResults = p.festResults || [];
          p.festResults.push(rec);
          const map = { title:p.title, festival:f.name, prize:result };
          if (kind==='winner') {
            p.buzz=Math.min(A.buzzMax,(p.buzz||0)+A.prizeBuzz);
            gainStudioFame(A.prizeFame+Math.floor(f.tier/3));
            currentBuzz(3+Math.min(4,f.tier));
            reputationEvent(f.tier>=4?5:2,f.tier>=4?5:2,'festival','player:'+p.id);
            state.studio.prestige=clamp((state.studio.prestige||0)+Math.ceil(f.tier/3),0,100);
            castTalent(p).forEach(t=>{t.fame=clamp(t.fame+A.prizeTalentFame,0,100)});
            if (p.format==='short') p.result='Won';
            addLog(atx('festPrize',map)+' ('+f.level+' tier)', 'award');
            state.stopFlag=true;
          } else if (kind==='mention') {
            p.buzz=Math.min(A.buzzMax,(p.buzz||0)+2);
            gainStudioFame(1);state.studio.prestige=clamp((state.studio.prestige||0)+0.5,0,100);
            addLog('"'+p.title+'" earns a Jury Special Mention at '+f.name+'.','award');
          } else if (kind==='selection') {
            p.buzz=Math.min(A.buzzMax,(p.buzz||0)+A.selectBuzz);
            gainStudioFame(A.selectFame);
            addLog(atx('festSelected',map)+' ('+f.level+' tier)','award');
          }
        } else {
          e.rival.festResults = e.rival.festResults || [];
          e.rival.festResults.push(rec);
          if (kind==='winner') addLog(e.rival.studio+' wins '+result+' for "'+e.rival.title+'" at '+f.name+'.','award','rivals');
        }
      });
    });
  }
  function ceremonyScore(f, ceremony) {
    const quality=f.quality||0, critic=f.critic==null?quality:f.critic, hype=f.hype||0;
    const eraNorm = Math.max(1, Math.pow(1+TUNING.market.audienceGrowth,Math.max(0,(f.year||1970)-1970)));
    const reach = clamp(16*Math.log10(1+(f.gross||0)/Math.max(20000,(f.budget||30000)*eraNorm*.2)),0,35);
    if (ceremony.style==='critics') return quality*.40+critic*.60;
    if (ceremony.style==='indie') return quality*.46+critic*.42+(f.budget<=350000?7:0)+(f.format==='short'?3:0);
    if (ceremony.style==='audience') return quality*.30+critic*.18+hype*.26+reach*.8;
    return quality*.55+critic*.35+hype*.10;
  }
  function ceremonyEligibleFilm(f, c) {
    if (!c.formats.includes(f.format) || !['done','release'].includes(f.stage)) return false;
    if (c.id==='independent' && f.format==='feature' && f.budget>350000) return false;
    return true;
  }
  function awardCandidate(e,cat) {
    if(!cat.slot)return {name:null,id:null,skill:50,role:null};
    const role=cat.slot==='lead'||cat.slot==='supporting'?'actor':cat.slot;
    if(e.p){
      const p=e.p;
      const list=cat.slot==='supporting'?extraIds(p,'supporting'):[p.cast[cat.slot]];
      const selected=list.map(id=>({id,t:typeof id==='number'?getTalent(id):null})).sort((a,b)=>(b.t?b.t.skill:0)-(a.t?a.t.skill:0))[0];
      if(!selected)return null;
      if(selected.id==='founder')return {name:state.founder.name,id:'founder',skill:state.founder.stats[cat.slot==='director'?'directing':'writing'],role};
      if(!selected.t)return null;
      return {name:selected.t.name,id:selected.t.id,skill:selected.t.skill,role};
    }
    const credits=e.f.credits||{}, ids=e.f.creditIds||{};
    const name=credits[cat.slot], person=Array.isArray(name)?name[0]:name;
    const ident=Array.isArray(ids[cat.slot])?ids[cat.slot][0]:ids[cat.slot];
    if(!person)return null;
    const t=typeof ident==='number'?getTalent(ident):null;
    return {name:person,id:ident==null?null:ident,skill:t?t.skill:(e.f.quality||50),role};
  }
  function runCeremony(c) {
    const A=TUNING.awards, year=dateOf().year, covered=year-1;
    if (year < c.startYear || covered < TUNING.startYear) return;
    state.awards.judged=state.awards.judged||{};
    const key=year+':'+c.id;
    if (state.awards.judged[key]) return;
    state.awards.judged[key]=true; // persisted, so revisiting a save never rerolls history
    const lo=(covered-TUNING.startYear)*TUNING.weeksPerYear, hi=lo+TUNING.weeksPerYear;
    const mine=state.projects.filter(p=>p.releaseWeek!=null && p.releaseWeek>=lo && p.releaseWeek<hi && c.formats.includes(p.format) &&
      (c.id!=='independent' || p.format==='short' || p.budget<=350000));
    const ai=(state.filmArchive?state.filmArchive.rivals:[]).filter(f=>f.releaseWeek!=null && f.releaseWeek>=lo && f.releaseWeek<hi && ceremonyEligibleFilm(f,c));
    if (c.id==='golden') {
      mine.forEach(p=>{p.awardsJudged=true; p.awards=p.awards||[];});
      state.studio.prestige=Math.round((state.studio.prestige||0)*A.prestigeDecay*10)/10;
    }
    const entries=ai.map(f=>({ f:f, p:null, title:f.title, studio:f.studio, rivalId:f.rivalId, projectId:null, filmId:f.id,
      base:ceremonyScore(f,c)+(f.format==='feature'?Math.min(5,2+(f.quality||0)*.015):0) }))
      .concat(mine.map(p=>{const film=playerFilm(p);return { f:film, p:p, title:p.title, studio:state.studio.name,
        rivalId:null, projectId:p.id, filmId:'player:'+p.id,
        base:ceremonyScore(film,c)+(c.id==='golden'?campaignPoints(p):0)+(p.buzz||0)*.3 };}));
    const rec={ id:c.id, year:year, covered:covered, name:c.name, cats:[] };
    const nomineesByProject={}, fameGain={}, studioWinCounts={};
    for (const cat of c.categories) {
      const choices=entries.filter(e=> (!cat.format || cat.format===e.f.format) && (!cat.debut || (e.f.studioReleasesAtRelease!=null && e.f.studioReleasesAtRelease<10)))
        .map(e=>({e,person:awardCandidate(e,cat)})).filter(x=>x.person!=null)
        .map(x=>({e:x.e,person:x.person,score:x.e.base+(cat.slot?(x.person.skill-50)*A.slotWeight:0)+rnd(-A.noise,A.noise)}))
        // Every studio faces the same merit floor; AI competitors get no hidden exemption.
        .filter(x=>x.score >= A.minScore + (c.id === 'golden' ? 2 : 0))
        .sort((a,b)=>b.score-a.score);
      const counts={}, nominated=[];
      for(const x of choices){if(nominated.length>=A.nominees)break;if((counts[x.e.studio]||0)>=A.maxPerStudio)continue;
        counts[x.e.studio]=(counts[x.e.studio]||0)+1;nominated.push(x);}
      if(nominated.length<2)continue;
      const ordered=nominated.map(x=>({x:x,score:x.score+rnd(-A.winNoise,A.winNoise)})).sort((a,b)=>b.score-a.score);
      // A category can have worthy nominees without an eligible winner.
      const minimum = c.id === 'golden' ? A.goldenWinMin : c.style === 'critics' ? A.criticsWinMin : c.style === 'indie' ? A.indieWinMin : c.style === 'audience' ? A.audienceWinMin : A.otherWinMin;
      const limit=c.id==='golden'?A.goldenMaxWinsPerStudio:A.otherMaxWinsPerStudio;
      // Nomination is still earned on merit; a studio cannot sweep every
      // trophy at a single ceremony simply by releasing a large slate.
      const winningSlot=ordered.find(o=>o.score >= minimum && (studioWinCounts[o.x.e.studio]||0)<limit);
      const victor=winningSlot?winningSlot.x:null;
      if(victor)studioWinCounts[victor.e.studio]=(studioWinCounts[victor.e.studio]||0)+1;
      rec.cats.push({id:cat.id,name:cat.name,unawarded:!victor,nominees:ordered.map(o=>({title:o.x.e.title,studio:o.x.e.studio,
        rivalId:o.x.e.rivalId,projectId:o.x.e.projectId,filmId:o.x.e.filmId,
        personId:o.x.person.id,personName:o.x.person.name,role:o.x.person.role,winner:o.x===victor}))});
      for(const o of ordered){const e=o.x.e,won=o.x===victor;
        const award={year:year,cat:cat.id,category:cat.name,ceremony:c.name,ceremonyId:c.id,won,
          filmId:e.filmId,personId:o.x.person.id,personName:o.x.person.name,role:o.x.person.role};
        if(e.p){const p=e.p;p.awards=p.awards||[];p.awards.push(award);
          // Film-only prizes belong to the film. Personal honors go only to the credited actor, director or writer.
          if(cat.slot && typeof award.personId==='number'){
            const t=getTalent(award.personId);
            if(t && ['actor','director','writer'].includes(t.role))giveTalentAward(t,won,Object.assign({film:p.title},award));
          } else if(cat.slot && award.personId==='founder') {
            state.founder.awardHistory=state.founder.awardHistory||[];
            state.founder.awardHistory.push(Object.assign({film:p.title},award));
          }
          state.studio.prestige=Math.min(A.prestigeMax,state.studio.prestige+(won?(cat.id==='picture'?A.prestigePicture:A.prestigeWin):A.prestigeNom));
          if(won){currentBuzz(cat.id==='picture'?7:3);reputationEvent(cat.id==='picture'?9:4,cat.id==='picture'?9:4,'award','player:'+p.id);if(cat.id==='picture')checkLegacyMilestones(p);}
          nomineesByProject[p.id]=(nomineesByProject[p.id]||[]).concat(cat.name);
          const points=(nomineesByProject[p.id].length===1?A.nomFame:0)+(won?(cat.id==='picture'?A.pictureFame:A.winFame):0);
          fameGain[p.id]=Math.min(A.filmFameMax,(fameGain[p.id]||0)+points);
          if(won){state.studio.criticsRep=clamp(state.studio.criticsRep+A.winCritics,0,100);
            addLog('"'+p.title+'" wins '+cat.name+' at '+c.name+' '+year+'!','award');}
        }else{
          e.f.awards=e.f.awards||[];e.f.awards.push(award);
          if(cat.slot && typeof award.personId==='number'){
            const t=getTalent(award.personId);
            if(t && ['actor','director','writer'].includes(t.role))giveTalentAward(t,won,Object.assign({film:e.title},award));
          }
          if(won){const r=getRival(e.rivalId);if(r)r.fame=clamp(r.fame+2,0,100);
            if(cat.id==='picture'||cat.id==='indiefeature'||cat.id==='audiencefilm') addLog(e.studio+' wins '+cat.name+' for "'+e.title+'" at '+c.name+' '+year+'.','award','rivals');}
        }
      }
    }
    Object.keys(nomineesByProject).forEach(id=>{
      const p=getProject(id);if(!p)return;
      gainStudioFame(fameGain[id]||0);
      addLog('"'+p.title+'" earns '+nomineesByProject[id].length+' nomination(s) at '+c.name+' '+year+': '+nomineesByProject[id].join(', ')+'.','award');
    });
    if(rec.cats.length){state.awards.history.push(rec);if(state.awards.history.length>A.keepHistory)state.awards.history.shift();}
    if(Object.keys(nomineesByProject).length)state.stopFlag=true;
    emit('awards',rec);
  }
  function awardsTick() {
    const d=dateOf();festivalTick();
    CONTENT.AWARDS.ceremonies.filter(c=>c.startYear<=d.year&&c.week===d.week).forEach(runCeremony);
  }
  function awardsInfo() {
    const d=dateOf(),A=TUNING.awards,def=CONTENT.AWARDS;
    const ceremonies=def.ceremonies.filter(c=>c.startYear<=d.year);
    const upcoming=ceremonies.map(c=>({name:c.name,year:d.week>=c.week?d.year+1:d.year,week:c.week})).sort((a,b)=>a.year-b.year||a.week-b.week)[0] || {name:def.ceremony,year:d.year+1,week:A.ceremonyWeek};
    const eligible=state.projects.filter(awardEligible).map(p=>({
      id:p.id,title:p.title,year:awardYearOf(p),score:Math.round(awardScore(p)),buzz:p.buzz||0,
      campaign:p.campaign||{level:0,spent:0},
      quotes:def.campaigns.map((c,i)=>Object.assign({id:c.id,name:c.name},campaignQuote(p.id,i)))
    }));
    const trophy=[];
    state.projects.forEach(p=>(p.awards||[]).forEach(a=>{if(a.won)trophy.push({projectId:p.id,title:p.title,year:a.year,
      cat:a.category||(def.categories.find(c=>c.id===a.cat)||{name:a.cat}).name,ceremony:a.ceremony||def.ceremony});}));
    return {name:def.ceremony,next:{year:upcoming.year,week:(upcoming.year-TUNING.startYear)*TUNING.weeksPerYear+upcoming.week-1,
        covers:upcoming.year-1,name:upcoming.name},eligible:eligible,history:state.awards.history.slice().reverse(),trophies:trophy,
      prestige:Math.round(state.studio.prestige||0),circuit:currentFestivals().map(f=>({id:f.id,name:f.name,week:f.week,prize:f.prize,level:f.level,focus:f.focus,startYear:f.startYear})),
      ceremonies:ceremonies.map(c=>({id:c.id,name:c.name,week:c.week,startYear:c.startYear,categories:c.categories.map(x=>x.name)})),
      campaigns:def.campaigns,categories:def.categories};
  }

// ===== SECTION: LATE_GAME_LEGACY =====
  const INITIATIVES=[
    {id:'prestige',name:'Prestige Passion Slate',description:'Back your next two feature films for a modest creative quality boost.',share:1.00},
    {id:'global',name:'Global Premiere Campaign',description:'Raise visibility for your next two wide-release features.',share:1.20},
    {id:'talent',name:'New Talent Banner',description:'Give emerging leads a stronger creative platform for two films.',share:0.80},
    {id:'franchise',name:'Franchise Expansion',description:'Invest in the audience reach of two sequels, with heightened flop risk.',share:1.35}
  ];
  function initiativeQuote(id) {
    const def=INITIATIVES.find(x=>x.id===id);
    if(!state||!def)return {ok:false,reason:'Unknown initiative.'};
    const l=state.legacyPlay||{},active=l.initiative;
    const cost=Math.round(([0,0,35000,170000,700000][state.studio.tier]||0)*Math.pow(1.045,Math.max(0,dateOf().year-1970))*def.share/1000)*1000;
    const reason=state.gameOver?'The studio is closed.':state.studio.tier<2||dateOf().year<1990?'Major initiatives open for mid-size studios after 1990.':
      active&&active.remaining>0&&active.expiresWeek>state.week?'Finish or expire the current initiative first.':
      state.week<(l.nextInitiativeWeek||0)?'Another initiative opens after a three-year cooldown.':state.cash<cost*1.5?'Not enough cash cushion for the investment.':null;
    return {id,name:def.name,description:def.description,cost,ok:!reason,reason,remaining:active&&active.remaining||0};
  }
  function startInitiative(id) {
    const q=initiativeQuote(id);if(!q.ok)return q;
    state.cash-=q.cost;
    state.finance.q.production+=q.cost;
    const l=state.legacyPlay;
    l.initiative={id,startedWeek:state.week,expiresWeek:state.week+208,remaining:2,financed:q.cost,films:[]};
    l.nextInitiativeWeek=state.week+156;
    addLog('Studio initiative: '+q.name+'. Upfront investment '+fmtMoney(q.cost)+'. Next qualifying films gain a targeted advantage.','studio');
    save();emit('initiative',l.initiative);return {ok:true,initiative:l.initiative};
  }
  function applyInitiative(p) {
    const i=state.legacyPlay&&state.legacyPlay.initiative;
    if(!i||i.remaining<=0||i.expiresWeek<state.week||p.format!=='feature'||p.initiativeApplied)return;
    const t=p.cast&&getTalent(p.cast.lead),young=t&&t.fame<=35;
    const applies=i.id==='prestige'||i.id==='global'&&(p.regions||[]).length>=3||i.id==='talent'&&young||i.id==='franchise'&&p.sequelOf!=null;
    if(!applies)return;
    p.initiativeApplied=i.id;
    if(i.id==='prestige')p.qualityMod+=4;
    if(i.id==='global')p.hypeMod+=7;
    if(i.id==='talent')p.qualityMod+=5;
    if(i.id==='franchise')p.hypeMod+=7;
    i.remaining--;
    i.films.push(p.id);
    addLog('"'+p.title+'" benefits from the '+INITIATIVES.find(x=>x.id===i.id).name+' initiative.','studio');
  }
  function initiativeOutcome(p) {
    if(!p.initiativeApplied)return;
    const hit=p.result==='Hit',bad=p.result==='Flop'||p.critic<45;
    if(hit)currentBuzz(4);
    if(bad){currentBuzz(-5);if(p.initiativeApplied==='franchise')currentBuzz(-3);}
    const i=state.legacyPlay.initiative;
    if(i&&i.remaining===0&&i.films[i.films.length-1]===p.id) {
      addLog('The '+INITIATIVES.find(x=>x.id===i.id).name+' initiative has completed its planned film slate.','studio');
    }
  }
  function milestone(name,description) {
    const l=state.legacyPlay;if(!l||l.milestones.some(m=>m.id===name))return false;
    l.milestones.push({id:name,description,week:state.week});
    reputationEvent(1,5,'milestone',null);
    currentBuzz(3);
    addLog('Studio legacy milestone: '+description+'.','milestone');
    return true;
  }
  function checkLegacyMilestones(p) {
    if(!state.legacyPlay)return;
    const films=state.projects.filter(x=>x.releaseWeek!=null && x.format==='feature');
    if(p&&p.format==='feature'&&p.stage==='done'&&p.budget<=120000&&p.result==='Hit')milestone('underdog_hit','An independent feature becomes a profitable hit');
    if(p&&p.stage==='done'&&p.format==='feature'&&(p.regions||[]).length>=4&&p.result==='Hit')milestone('global_breakthrough','A film succeeds across four release markets');
    if(p&&p.stage==='done'&&p.critic>=85){const actor=p.talentSnapshot&&p.talentSnapshot.lead;
      if(actor&&actor.fame<35)milestone('breakthrough_artist','A lesser-known lead delivers an acclaimed performance');}
    if(films.filter(f=>f.critic>=85).length>=10)milestone('creative_legacy','Ten outstanding feature films define your studio');
    const groups=new Map();
    films.filter(f=>f.stage==='done'&&f.franchiseId&&f.result!=='Flop').forEach(f=>groups.set(f.franchiseId,(groups.get(f.franchiseId)||0)+1));
    if(Array.from(groups.values()).some(n=>n>=3))milestone('enduring_franchise','A franchise achieves three successful installments');
    if(p&&(p.awards||[]).some(a=>a.won&&a.cat==='picture')&&p.budget<=350000)milestone('indie_best_picture','A modest-budget film wins Best Picture');
  }
  function reissueQuote(id) {
    const p=getProject(Number(id));
    if(!state||!p||p.format!=='feature'||p.stage!=='done')return {ok:false,reason:'Choose an archived feature film.'};
    const l=state.legacyPlay||{},prev=(l.reissues||[]).filter(x=>x.projectId===p.id),age=state.week-(p.releaseWeek||0);
    const cost=Math.max(2500,Math.round(Math.min(p.budget*.025,120000*Math.pow(1.04,Math.max(0,dateOf().year-1970)))/500)*500);
    const potential=Math.round(Math.max(0,Math.min((p.gross||0)*.065,p.budget*.15,audienceCap()*.13))*(.75+(p.quality||50)/200));
    let reason=age<260?'Film must be at least five years old.':p.critic<65?'Only well-regarded films are eligible for reissue.':
      state.week-(l.lastReissueWeek||-999)<156?'The studio may revive one classic every three years.':
      prev.length>=2||prev.some(x=>state.week-x.week<780)?'This classic has been revived too recently or too often.':
      state.cash<cost*2?'Keep a cash cushion for the reissue.':state.gameOver?'The studio is closed.':null;
    return {ok:!reason,reason,projectId:p.id,title:p.title,cost,expected:potential,ageYears:Math.floor(age/52),past:prev.length};
  }
  function reissueFilm(id) {
    const q=reissueQuote(id);if(!q.ok)return q;
    const p=getProject(Number(id)),l=state.legacyPlay;
    // One event, not a second theatrical run; historical first-run gross and rankings stay intact.
    const received=Math.round(q.expected*rnd(.65,1.25));
    state.cash-=q.cost;
    state.finance.q.production+=q.cost;
    earn(received);
    p.reissueRevenue=(p.reissueRevenue||0)+received;
    l.lastReissueWeek=state.week;
    l.reissues.push({projectId:p.id,week:state.week,cost:q.cost,revenue:received});
    currentBuzz(received>q.cost?4:1);
    reputationEvent(.3,1,'classic_reissue','player:'+p.id);
    addLog('Classic reissue: "'+p.title+'" returns to screens for '+fmtMoney(received)+' nostalgia revenue on '+fmtMoney(q.cost)+' spend.','release');
    save();emit('reissue',p);return {ok:true,cost:q.cost,revenue:received};
  }

  function v14FilmLegacy(p){
    if(!p||p.releaseWeek==null)return null;
    const profit=(p.revenue||0)-(p.spent||0),critic=p.critic||0,audience=p.audience||0;
    const ratio=(p.gross||0)/Math.max(1,p.budget||1);
    let kind='Completed film';
    if(p.format==='short')kind=(p.festResults||[]).some(x=>x.kind==='winner')?'Festival favorite':'Festival circuit film';
    else if(p.format==='pilot')kind=p.result==='Picked up'?'Television launch':'Unpicked pilot';
    else if(ratio>=2.5&&profit>0)kind='Franchise foundation';
    else if(critic>=75&&ratio<1.5&&audience>=65)kind='Cult critical favorite';
    else if(critic>=77)kind='Critical standout';
    else if(audience>=72&&profit>=0)kind='Audience favorite';
    else if(profit<0)kind='Commercial disappointment';
    return {kind,profit,critics:critic,audience,decisions:v14Storyboard(p),
      awards:(p.awards||[]).filter(a=>a.won).length,
      festivalWins:(p.festResults||[]).filter(a=>a.kind==='winner').length,
      afterlife:p.afterlifeChoices||[]};
  }
  function v14AfterlifeQuote(id,kind){
    const p=getProject(Number(id));
    if(!p||!p.dna||p.format!=='feature'||p.stage!=='done'||p.releaseWeek==null)
      return {ok:false,reason:'An eligible completed feature is required.'};
    const age=state.week-p.releaseWeek,prev=p.afterlifeChoices||[];
    if(age<4||age>52*9)return {ok:false,reason:'The catalog opportunity is not currently active.'};
    if(prev.length>=2||prev.some(x=>state.week-x.week<52))
      return {ok:false,reason:'This film has already had a recent catalog opportunity.'};
    if(kind==='license'){
      if(prev.some(x=>x.kind==='license'))return {ok:false,reason:'Rights already licensed.'};
      const future=(p.windows||[]).reduce((a,w)=>a+Math.max(0,w.total-w.paid),0);
      if(future<Math.max(300,p.budget*.015))return {ok:false,reason:'Too little remaining unsold rights value.'};
      const upfront=Math.round(future*.27),futureLoss=Math.round(future*.34);
      return {ok:true,kind,name:'Early catalog license',cost:0,upfront,futureLoss,
        description:'Receive '+fmtMoney(upfront)+' now, forfeiting approximately '+fmtMoney(futureLoss)+
          ' in projected future rights payouts. Existing windows keep their original dates.'};
    }
    if(kind==='retrospective'){
      if((p.critic||0)<68)return {ok:false,reason:'Requires proven critical recognition (critics 68+).'};
      const cost=Math.max(400,Math.round(p.budget*.018/100)*100);
      if(state.cash<cost)return {ok:false,reason:'Not enough cash for the retrospective.',cost};
      return {ok:true,kind,name:'Curated retrospective',cost,
        forecast:Math.min(p.budget*.055,(p.gross||0)*.045),
        description:'Fund a small archival screening and critical retrospective. Limited attendance and recognition are uncertain.'};
    }
    if(kind==='cult'){
      if((p.audience||0)<68||!['bold','prestige'].includes(p.dna.vision))
        return {ok:false,reason:'This film has not established the audience or cult credentials.'};
      const cost=Math.max(300,Math.round(p.budget*.012/100)*100);
      if(state.cash<cost)return {ok:false,reason:'Not enough cash for the fan screenings.',cost};
      return {ok:true,kind,name:'Fan-led screening tour',cost,
        forecast:Math.round(Math.min(p.budget*.09,(p.gross||0)*.065)),
        description:'Book a three-week fan tour. Costs are certain, attendance and added receipts are not.'};
    }
    return {ok:false,reason:'Unknown catalog opportunity.'};
  }
  function v14AfterlifeAction(id,kind){
    const q=v14AfterlifeQuote(id,kind);if(!q.ok)return q;
    const p=getProject(Number(id));
    p.afterlifeChoices=p.afterlifeChoices||[];
    if(q.cost){state.cash-=q.cost;state.finance.q.production+=q.cost;p.spent+=q.cost;
      recordProjectPulse(p,state.week,0,0,q.cost,p.stage,0);}
    let outcome='';
    if(kind==='license'){
      // Trade off the exact booked rights liability; no new recurring stream.
      (p.windows||[]).forEach(w=>{
        const future=Math.max(0,w.total-w.paid);
        w.total=w.paid+Math.round(future*.66);
      });
      earn(q.upfront);p.revenue+=q.upfront;outcome='Received upfront rights payment '+fmtMoney(q.upfront)+
        ' in exchange for future royalties.';
      recordProjectPulse(p,state.week,0,q.upfront,0,p.stage,0);
    }else {
      p.v14AfterlifeRun={kind,from:state.week+1,weeks:kind==='cult'?3:2,
        estimated:q.forecast||0,received:0};
      outcome='Booked '+q.name.toLowerCase()+'; upcoming returns are uncertain.';
    }
    p.afterlifeChoices.push({week:state.week,kind,cost:q.cost,upfront:q.upfront||0});
    filmStory(p,'afterlife',outcome);
    addLog('Catalog decision for "'+p.title+'": '+outcome,'release');
    save();emit('film_afterlife',p);return {ok:true};
  }
  function v14AfterlifeTick(){
    let sum=0;
    state.projects.forEach(p=>{
      const run=p.v14AfterlifeRun;if(!run||state.week<run.from||run.completed)return;
      const elapsed=state.week-run.from+1;
      const total=Math.max(0,Math.round(run.estimated*(
        .58+(p.audience||50)/175)*(.86+rnd(-.15,.19))));
      const pay=elapsed>=run.weeks?Math.max(0,total-run.received):
        Math.max(0,Math.round(total/run.weeks));
      run.received+=pay;sum+=pay;p.revenue+=pay;
      if(elapsed>=run.weeks){
        run.completed=true;
        filmStory(p,'legacy',run.kind==='cult'?'A small fan community returned for '+fmtMoney(run.received)+' in screenings.':
          'The retrospective ended with '+fmtMoney(run.received)+' in new interest and receipts.');
        addLog('Afterlife report for "'+p.title+'": '+fmtMoney(run.received)+
          ' receipts against direct campaign expenses.','release');
      }
    });
    return sum;
  }
  const V14_AMBITIONS=[
    {id:'newvoices',name:'Launch a new voice',desc:'Release a film with a developing writer and earn critics 67+.',years:2,
      reward:'Early access to a trusted writer’s next script'},
    {id:'prestige',name:'Acclaimed and solvent',desc:'Make a feature with critics 75+ and positive direct film P/L.',years:2,
      reward:'An industry introduction to prestige scripts'},
    {id:'genre',name:'Build a genre following',desc:'Release two profitable films in the same genre.',years:3,
      reward:'A specialist writer brings a new idea'},
    {id:'global',name:'Reach new regions',desc:'Release a feature in three or more regions.',years:2,
      reward:'Foreign distributors invite future pitches'},
    {id:'festival',name:'Festival reputation',desc:'Earn two official festival selections or prizes.',years:3,
      reward:'A modest festival relationship opens'},
    {id:'tv',name:'Build a television foothold',desc:'Get a pilot picked up by a network.',years:2,
      reward:'A meeting with a network commissioning team'}
  ];
  function v14Ambitions(){
    const v=v14State(),year=dateOf().year;
    const slots=[V14_AMBITIONS[(year*5)%V14_AMBITIONS.length],
      V14_AMBITIONS[(year*5+2)%V14_AMBITIONS.length],
      V14_AMBITIONS[(year*5+4)%V14_AMBITIONS.length]];
    return {active:v.ambition||null,options:slots.map(x=>({...x})),
      recent:(v.offers||[]).slice(-5)};
  }
  function v14PickAmbition(id){
    const options=v14Ambitions(),def=options.options.find(x=>x.id===id);
    if(!def)return {ok:false,reason:'Choose one of the currently available ambitions.'};
    if(options.active&&options.active.expiresWeek>state.week&&!options.active.completed)
      return {ok:false,reason:'Your studio already has an active ambition.'};
    v14State().ambition={id:def.id,name:def.name,startWeek:state.week,
      expiresWeek:state.week+def.years*52,completed:false,reward:def.reward};
    save();emit('ambition',v14State().ambition);return {ok:true};
  }
  function v14UseOffer(kind,p){
    const offer=v14State().offers.find(x=>x.id===kind&&!x.used&&x.expiresWeek>=state.week);
    if(!offer)return false;
    offer.used=true;offer.usedWeek=state.week;
    if(p)filmStory(p,'ambition','The studio’s earlier ambition created a modest new industry opportunity.');
    return true;
  }

  function v14AmbitionTick(){
    const a=v14State().ambition;if(!a||a.completed||a.expiresWeek<state.week)return;
    const films=state.projects.filter(p=>p.releaseWeek!=null&&p.releaseWeek>=a.startWeek);
    const complete=(id)=>{
      if(id==='newvoices')return films.some(f=>f.critic>=67&&f.cast.writer!=='founder'&&
        (f.talentSnapshot?.writer?.fame||100)<35);
      if(id==='prestige')return films.some(f=>f.format==='feature'&&f.critic>=75&&f.revenue>f.spent);
      if(id==='global')return films.some(f=>f.format==='feature'&&(f.regions||[]).length>=3);
      if(id==='tv')return films.some(f=>f.format==='pilot'&&f.result==='Picked up');
      if(id==='festival')return films.reduce((n,f)=>n+(f.festResults||[]).filter(x=>x.kind==='selection'||x.kind==='winner').length,0)>=2;
      if(id==='genre')return films.some(f=>films.filter(g=>g!==f&&g.genre===f.genre&&g.stage==='done'&&g.revenue>g.spent&&f.revenue>f.spent&&f.stage==='done').length>=1);
      return false;
    };
    if(!complete(a.id))return;
    a.completed=true;a.completedWeek=state.week;
    const v=v14State();v.offers.push({id:a.id,week:state.week,expiresWeek:state.week+104,reward:a.reward,used:false});
    if(v.offers.length>8)v.offers.shift();
    addLog('Studio ambition achieved: '+a.name+'. '+a.reward+'.','studio');
    state.stopFlag=true;emit('ambition_complete',a);
  }

  const DECADE_SHIFTS=[
    {year:1980,name:'Home-video and genre boom',genres:['horror','comedy'],mult:1.15},
    {year:1990,name:'International multiplex expansion',genres:['action','scifi'],mult:1.16},
    {year:2000,name:'Digital-production breakthrough',genres:['scifi','documentary'],mult:1.18},
    {year:2010,name:'Streaming-era audience realignment',genres:['documentary','thriller'],mult:1.16},
    {year:2020,name:'Global genre discovery',genres:['horror','drama'],mult:1.16}
  ];
  function shiftTick() {
    const l=state.legacyPlay,d=dateOf();if(!l)return;
    if(d.week!==1||d.year<1980||d.year%10!==0||l.shiftHistory.some(x=>x.year===d.year))return;
    const def=DECADE_SHIFTS.find(x=>x.year===d.year)||{name:'New audience tastes',genres:['drama','comedy'],mult:1.1};
    l.industryShift={name:def.name,genres:def.genres,mult:def.mult,startWeek:state.week,endWeek:state.week+104};
    l.shiftHistory.push({year:d.year,name:def.name,genres:def.genres});
    addLog('Industry shift: '+def.name+'. '+def.genres.map(genreName).join(' and ')+' gain temporary audience momentum.','market');
  }
  function legacyInfo() {
    const l=state.legacyPlay||{milestones:[],reissues:[],initiative:null,shiftHistory:[]};
    return {milestones:l.milestones||[],reissues:(l.reissues||[]).slice(-10),initiative:l.initiative,
      initiatives:INITIATIVES.map(x=>initiativeQuote(x.id)),
      reissueCandidates:state.projects.filter(p=>p.format==='feature'&&p.stage==='done'&&p.releaseWeek!=null)
        .map(p=>reissueQuote(p.id)).filter(x=>x.ok).sort((a,b)=>b.expected-a.expected).slice(0,10),
      industryShift:l.industryShift&&state.week<=l.industryShift.endWeek?l.industryShift:null,shiftHistory:l.shiftHistory||[]};
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
    const c = { wins: 0, noms: 0, picture: 0, festPrizes: 0, festSelections: 0, hits: 0, indieHits: 0, shows: 0 };
    state.projects.forEach(p => {
      if (p.format === 'pilot') return;
      if (p.format === 'feature' && p.result === 'Hit') {
        c.hits++;
        if (p.budget <= 120000 && (p.critic || 0) >= 60) c.indieHits++;
      }
      (p.awards || []).forEach(a => { if (a.won) { c.wins++; if (a.cat === 'picture') c.picture++; } else c.noms++; });
      (p.festResults || []).forEach(f => { if (f.kind === 'selection' || f.result === 'Official selection') c.festSelections++; else if (f.kind === 'winner' || /grand|prize|winner|won/i.test(f.result || '')) c.festPrizes++; else if (f.kind === 'mention') c.festSelections++; });
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
      reputation: st.criticsRep * S.critics + (state.reputation ? state.reputation.currentPrestige : (st.prestige || 0)) * S.prestige +
        (state.reputation ? state.reputation.lifetimeLegacy : 0) * TUNING.reputation.legacyScore,
      hits: S.hit * Math.pow(c.hits + c.shows, S.curve) + Math.min(S.indieHitMax,S.indieHitWeight * Math.sqrt(c.indieHits))
    };
    Object.keys(parts).forEach(k => { parts[k] = Math.round(parts[k] * 10) / 10; });
    const value = Math.max(0, Math.round(Object.keys(parts).reduce((a, k) => a + parts[k], 0)));
    return { value: value, parts: parts, counts: c, profit: profit };
  }
  function legacyRecap() {
    const topFilms=state.projects.filter(p=>p.releaseWeek!=null&&['short','feature'].includes(p.format))
      .map(p=>{const wins=(p.awards||[]).filter(a=>a.won).length;
        return {id:'player:'+p.id,title:p.title,year:dateOf(p.releaseWeek).year,wins,
          impact:Math.round((p.quality||0)*.35+(p.critic==null?p.quality:p.critic||0)*.4+Math.min(20,wins*5)+Math.min(15,(p.gross||0)/Math.max(1,p.budget||1)*2))};})
      .sort((a,b)=>b.impact-a.impact||a.year-b.year).slice(0,3);
    const people=new Map();
    state.projects.filter(p=>p.releaseWeek!=null).forEach(p=>{
      for (const role of ['director','writer']) {
        const id=p.cast&&p.cast[role];if(id==null)continue;
        const t=id==='founder'?null:getTalent(id),name=id==='founder'?state.founder.name:t&&t.name;
        if(!name)continue;
        const key=role+':'+id, prior=people.get(key)||{name,role,films:0,wins:0};
        prior.films++;prior.wins+=(p.awards||[]).filter(a=>a.won&&a.role===role).length;
        people.set(key,prior);
      }
    });
    const partners=Array.from(people.values()).sort((a,b)=>b.films-a.films||b.wins-a.wins).slice(0,3);
    const topRival=studioWorldStandings(5,'score').find(x=>x.id!=='you');
    const titles=(state.world&&state.world.decadeChampions||[]).filter(c=>
      ['boxOffice','critics','awards','international'].some(k=>c[k]===state.studio.name));
    return {films:topFilms,partners,topRival:topRival?topRival.name:null,decadeTitles:titles.length};
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
    sc.legacyRecap=legacyRecap();
    sc.rank = recordScore(sc);
    const map = { score: sc.value, year: reason === 'lock' ? TUNING.scoreLockYear : sc.year, studio: state.studio.name, rank: sc.rank };
    const text = stxt(reason === 'lock' ? 'locked' : 'bankrupt', map) + (sc.rank ? ' ' + stxt('rank', map) : '');
    addLog(text, 'milestone');
    if (reason === 'lock') raiseStudio('score_lock', text, [{ label: 'Continue', effects: {}, result: null }], { scope: 'score', category: 'score', lines: scoreLines(sc).concat(sc.legacyRecap.films[0]?['Defining film: '+sc.legacyRecap.films[0].title]:[]) });
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
    const priorProjects=new Map(state.projects.map(p=>[p.id,{gross:p.gross||0,revenue:p.revenue||0,
      spent:p.spent||0,stage:p.stage,admissions:p.format==='feature'?filmAdmissions(p):0,
      screenings:p.format==='short'?shortAudience(p)||0:0,
      households:p.format==='pilot'?estimatedTvHouseholds(p)||0:0}]));
    marketTick();
    const interest = Math.round(state.debt * TUNING.weeklyInterest);
    const salaries = weeklySalaries();
    const payroll = weeklyPayroll();
    const actives = activeProjects();
    const freelance = founderFreelancing() ? freelanceIncome() : 0;
    let revenue = 0, production = 0;
    actives.forEach(p => {
      const planned=v144BudgetTick(p);
      const saved=Math.min(planned,Math.max(0,p.lifecycleSavings||0));
      if(saved&&p.budgetPlan){
        const key=v144Bucket(p.stage);
        p.budgetPlan.spent[key]=Math.max(0,(p.budgetPlan.spent[key]||0)-saved);
      }
      p.lifecycleSavings=Math.max(0,(p.lifecycleSavings||0)-saved);
      const charge=planned-saved;
      p.spent+=charge;production+=charge;
    });
    state.projects.forEach(p => { if (p.stage === 'release') revenue += releaseIncome(p); });
    revenue += windowsTick();
    revenue += shortEncoreTick();
    revenue += v14AfterlifeTick();
    const tv = tvTick();
    revenue += tv.revenue;
    production += tv.cost;
    const overhead = weeklyOverhead(revenue);
    const income = freelance + revenue;
    const costs = TUNING.livingCost + interest + salaries + payroll + overhead + production;
    state.cash += income - costs;
    state.lastWeek = { income: income, revenue: revenue, costs: costs, interest: interest, salaries: salaries, overhead: overhead, payroll: payroll,
      production, freelance, living: TUNING.livingCost, margin: income-costs };
    bookWeek({ revenue: revenue, freelance: freelance, production: production, salaries: salaries, payroll: payroll,
      overhead: overhead, interest: interest, living: TUNING.livingCost });
    // Offer a bounded lifecycle decision before advancing each production stage.
    // This shares the existing pending decision queue and delegation policy.
    actives.forEach(p=>{if(ACTIVE_STAGES.includes(p.stage))lifecycleTick(p);});
    actives.forEach(p => { if (ACTIVE_STAGES.includes(p.stage)) advanceProject(p); });
    // Screenings and catalog follow-ups happen after their real weekly results.
    state.projects.some(p=>(p.stage==='release'||p.stage==='done')&&lifecycleTick(p));
    rivalTick();
    contractTick();
    moraleTick();
    poachTick();
    talentTick();
    staffTick();
    eventTick();
    awardsTick();
    checkCalendar();
    reputationTick();
    shiftTick();
    if (dateOf().week === 1) rivalYear();
    if (state.week % TUNING.economy.quarterWeeks === 0) { marketQuarter(); rivalQuarter(); closeQuarter(); }
    if(state.week%13===0)v14ClassificationTick();
    v14AmbitionTick();
    captureDemandSnapshot();
    if (dateOf().week === TUNING.weeksPerYear) annualReview();
    checkBankruptcy();
    // Track actual booked project income, expenses, and release reach; keep
    // only the last 32 eventful weeks to protect long-running save size.
    state.projects.forEach(p=>{
      const old=priorProjects.get(p.id);if(!old)return;
      const gross=(p.gross||0)-old.gross,revenue=(p.revenue||0)-old.revenue,spent=(p.spent||0)-old.spent;
      const admissions=p.format==='feature'?Math.max(0,(filmAdmissions(p)||0)-(old.admissions||0)):0;
      const screenings=p.format==='short'?Math.max(0,(shortAudience(p)||0)-(old.screenings||0)):0;
      const households=p.format==='pilot'?Math.max(0,(estimatedTvHouseholds(p)||0)-(old.households||0)):0;
      if(gross||revenue||spent||screenings||households||old.stage!==p.stage||ACTIVE_STAGES.includes(p.stage)||p.stage==='release')
        recordProjectPulse(p,state.week,gross,revenue,spent,p.stage,admissions,screenings,households);
    });
    scheduleTurnSave();
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
  // Compact repetitive archive keys in long-running saves. The serialized game
  // remains lossless; older plain-JSON saves and human-readable exports still load.
  const SAVE_PACK_PREFIX = 'FCP1';
  const SAVE_PACK_KEYS = /"([^"\\]+)":/g;

  // v14: second-stage lossless compression for lifetime-sized campaigns.
  // FCP2 wraps an exact older FCP1/plain payload. Old saves remain readable.
  // Fixed 17-bit LZW codes and plain ASCII base64, no dependencies or RNG.
  const SAVE_PACK_PREFIX_V2='FCP2';
  const SAVE_PACK_B64='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  function packSaveLzw17(input){
    const dictionary=new Map(),bytes=[];let next=65536,word='',bitbuf=0,bitcount=0;
    const emit=code=>{
      bitbuf|=code<<bitcount;bitcount+=17;
      while(bitcount>=8){bytes.push(bitbuf&255);bitbuf>>>=8;bitcount-=8;}
    };
    for(let i=0;i<input.length;i++){
      const ch=input.charAt(i);
      if(!word){word=ch;continue;}
      const both=word+ch;
      if(dictionary.has(both)){word=both;continue;}
      emit(word.length===1?word.charCodeAt(0):dictionary.get(word));
      if(next===131071){emit(131071);dictionary.clear();next=65536;}
      else dictionary.set(both,next++);
      word=ch;
    }
    if(word)emit(word.length===1?word.charCodeAt(0):dictionary.get(word));
    if(bitcount>0)bytes.push(bitbuf&255);
    const chunks=[];let out='';
    for(let i=0;i<bytes.length;i+=3){
      const a=bytes[i],b=i+1<bytes.length?bytes[i+1]:0,c=i+2<bytes.length?bytes[i+2]:0;
      out+=SAVE_PACK_B64[a>>>2]+SAVE_PACK_B64[((a&3)<<4)|(b>>>4)]+
        (i+1<bytes.length?SAVE_PACK_B64[((b&15)<<2)|(c>>>6)]:'=')+
        (i+2<bytes.length?SAVE_PACK_B64[c&63]:'=');
      if(out.length>32768){chunks.push(out);out='';}
    }
    chunks.push(out);return chunks.join('');
  }
  function unpackSaveLzw17(base){
    if(base.length%4!==0||base.length>40000000)throw Error('Invalid compressed save length');
    const binary=new Uint8Array(Math.floor(base.length*3/4));let count=0;
    for(let i=0;i<base.length;i+=4){
      const a=SAVE_PACK_B64.indexOf(base[i]),b=SAVE_PACK_B64.indexOf(base[i+1]);
      const c=base[i+2]==='='?0:SAVE_PACK_B64.indexOf(base[i+2]),d=base[i+3]==='='?0:SAVE_PACK_B64.indexOf(base[i+3]);
      if(a<0||b<0||c<0||d<0||(base[i+2]==='='&&base[i+3]!=='=')||(i+4<base.length&&(base[i+2]==='='||base[i+3]==='=')))
        throw Error('Invalid compressed save data');
      const triplet=(a<<18)|(b<<12)|(c<<6)|d;
      binary[count++]=(triplet>>>16)&255;
      if(base[i+2]!=='=')binary[count++]=(triplet>>>8)&255;
      if(base[i+3]!=='=')binary[count++]=triplet&255;
    }
    let dict=[],next=65536,prev='',parts=[],acc=0,bits=0,total=0;
    for(let i=0;i<count;i++){
      acc|=binary[i]<<bits;bits+=8;
      if(bits<17)continue;
      const code=acc&131071;acc>>>=17;bits-=17;
      if(code===131071){dict=[];next=65536;prev='';continue;}
      let entry;
      if(code<65536)entry=String.fromCharCode(code);
      else if(dict[code]!==undefined)entry=dict[code];
      else if(code===next&&prev)entry=prev+prev.charAt(0);
      else throw Error('Invalid compressed save code');
      parts.push(entry);total+=entry.length;
      if(total>100000000)throw Error('Compressed save exceeds supported size');
      if(prev&&next<131071)dict[next++]=prev+entry.charAt(0);
      prev=entry;
    }
    return parts.join('');
  }

  function encodeSave(obj) {
    const raw = JSON.stringify(obj);
    if (raw.length < 400000) return raw;
    const counts = Object.create(null);
    raw.replace(SAVE_PACK_KEYS, (match, key) => { counts[key] = (counts[key] || 0) + 1; return match; });
    const keys = Object.keys(counts).filter(k => counts[k] > 3 && k.length > 2)
      .sort((a, b) => (counts[b] * (b.length - 1)) - (counts[a] * (a.length - 1)))
      .slice(0, 256);
    const lookup = Object.create(null);
    keys.forEach((key, i) => { lookup[key] = String.fromCharCode(0xE000 + i); });
    const packed = raw.replace(SAVE_PACK_KEYS, (match, key) =>
      Object.prototype.hasOwnProperty.call(lookup, key) ? '"' + lookup[key] + '":' : match);
    const encoded = SAVE_PACK_PREFIX + JSON.stringify(keys) + '\n' + packed;
    const candidate=encoded.length<raw.length?encoded:raw;
    // Only long careers pay the extra compression cost. Start before quota risk.
    if(candidate.length>3750000){
      const v2=SAVE_PACK_PREFIX_V2+packSaveLzw17(candidate);
      if(v2.length<candidate.length)return v2;
    }
    return candidate;
  }
  function decodeSave(raw) {
    if(raw&&raw.startsWith(SAVE_PACK_PREFIX_V2))raw=unpackSaveLzw17(raw.slice(SAVE_PACK_PREFIX_V2.length));
    if (!raw || !raw.startsWith(SAVE_PACK_PREFIX)) return JSON.parse(raw);
    const sep = raw.indexOf('\n', SAVE_PACK_PREFIX.length);
    if (sep === -1) throw new Error('Invalid compact save header');
    const keys = JSON.parse(raw.slice(SAVE_PACK_PREFIX.length, sep));
    if (!Array.isArray(keys) || keys.length > 256) throw new Error('Invalid compact save dictionary');
    const reverse = Object.create(null);
    keys.forEach((key, i) => { reverse[String.fromCharCode(0xE000 + i)] = key; });
    const json = raw.slice(sep + 1).replace(SAVE_PACK_KEYS, (match, key) =>
      Object.prototype.hasOwnProperty.call(reverse, key) ? '"' + reverse[key] + '":' : match);
    return JSON.parse(json);
  }
  // v14.1: weekly autosaves for history-heavy browser campaigns encode off
  // the UI thread. Explicit saves, imports and slot switches remain synchronous.
  // Every write is tagged, so an older worker result can never overwrite a new
  // campaign or a more recent manual/weekly save.
  let largeSaveWorker=null,largeSaveScheduled=null,largeSaveGeneration=0,largeSaveWorkerUnavailable=false,largeSaveWorkerBusy=false,largeSaveNeedsLatest=false;
  function invalidatePendingLargeSave(){
    largeSaveGeneration++;
    if(largeSaveScheduled!==null&&typeof clearTimeout==='function')clearTimeout(largeSaveScheduled);
    largeSaveScheduled=null;
    largeSaveNeedsLatest=false;
  }
  function scheduleTurnSave(){
    if(fastSimulationTesting)return true;
    if(typeof document==='undefined'||typeof Worker==='undefined'||typeof setTimeout!=='function'||
      largeSaveWorkerUnavailable||!state||((state.filmArchive?.rivals?.length||0)<1600 && (state.projects?.length||0)<340))
      return save();
    if(!largeSaveWorker){
      try{
        largeSaveWorker=new Worker('save-worker.js');
        largeSaveWorker.onmessage=event=>{
          const x=event.data;
          largeSaveWorkerBusy=false;
          const current=x&&x.generation===largeSaveGeneration&&state&&x.campaignId===state.campaignId;
          if(current&&x.type==='encoded'){
            try{storage()?.setItem(SAVE_KEY,x.payload);}catch(e){console.warn('Large FinalCut autosave could not fit browser storage',e);}
          }else if(current&&x.type==='failed')console.warn('FinalCut background save failed',x.reason);
          // At most one in-flight snapshot. A new turn during compression
          // replaces the queued work instead of accumulating multi-megabyte clones.
          if(largeSaveNeedsLatest&&state){largeSaveNeedsLatest=false;scheduleTurnSave();}
        };
        largeSaveWorker.onerror=event=>{
          console.warn('FinalCut save worker unavailable; reverting to normal synchronous saving');
          largeSaveWorkerUnavailable=true;largeSaveWorkerBusy=false;largeSaveNeedsLatest=false;
          largeSaveWorker.terminate();largeSaveWorker=null;
          if(state)save();
        };
      }catch(e){largeSaveWorkerUnavailable=true;return save();}
    }
    invalidatePendingLargeSave();
    const token=largeSaveGeneration,campaignId=state.campaignId;
    largeSaveScheduled=setTimeout(()=>{
      largeSaveScheduled=null;
      if(!state||largeSaveGeneration!==token||state.campaignId!==campaignId)return;
      if(largeSaveWorkerBusy){largeSaveNeedsLatest=true;return;}
      try{
        largeSaveWorkerBusy=true;
        largeSaveWorker.postMessage({type:'encode',generation:token,campaignId,snapshot:state});
      }catch(e){largeSaveWorkerBusy=false;largeSaveWorkerUnavailable=true;save();}
    },350);
    return true;
  }
  if(typeof document!=='undefined'&&document.addEventListener){
    // A dirty, queued snapshot must be flushed before a tab is hidden.
    document.addEventListener('visibilitychange',()=>{
      if(document.visibilityState==='hidden'&&(largeSaveScheduled!==null||largeSaveWorkerBusy)&&state)save();
    });
    if(typeof window!=='undefined'&&window.addEventListener)
      window.addEventListener('pagehide',()=>{if((largeSaveScheduled!==null||largeSaveWorkerBusy)&&state)save();});
  }
  // v14.2: explicit saves and save-library snapshots reuse the canonical
  // worker codec. The small-save and no-Worker paths retain the exact sync API.
  // The worker owns only serialization; localStorage writes stay on this thread.
  function largeArchive(obj){
    return obj && (((obj.filmArchive?.rivals?.length||0)>=1600)||
      ((obj.projects?.length||0)>=340));
  }
  function encodeSavePayloadAsync(obj){
    if(typeof Worker==='undefined'||typeof document==='undefined'||!largeArchive(obj))
      return Promise.resolve().then(()=>encodeSave(obj));
    return new Promise((resolve,reject)=>{
      let worker=null,deadline=null,settled=false;
      const settle=(ok,value)=>{
        if(settled)return;
        settled=true;
        if(deadline!==null)clearTimeout(deadline);
        if(worker)worker.terminate();
        (ok?resolve:reject)(value);
      };
      try{
        worker=new Worker('save-worker.js');
        worker.onmessage=event=>{
          const x=event.data;
          if(!x)return;
          if(x.type==='encoded')settle(true,x.payload);
          else if(x.type==='failed')settle(false,Error(x.reason||'Background save failed'));
        };
        worker.onerror=()=>settle(false,Error('Save worker failed'));
        deadline=setTimeout(()=>settle(false,Error('Save worker timed out')),45000);
        worker.postMessage({type:'encode',generation:0,campaignId:obj.campaignId,snapshot:obj});
      }catch(error){settle(false,error);}
    }).catch(()=>{
      // A blocked Worker must not disable saving, including older browsers.
      return encodeSave(obj);
    });
  }
  async function saveAsync(){
    if(!state)return false;
    const ls=storage();
    if(!ls)return false;
    if(typeof Worker==='undefined'||typeof document==='undefined'||!largeArchive(state))
      return save();
    const snapshot=state;
    invalidatePendingLargeSave();
    // An already-running weekly archive is obsolete when a manual save
    // begins. Stop it so a constrained phone never encodes two huge copies
    // concurrently, then let the explicit save be the sole writer.
    if(largeSaveWorkerBusy&&largeSaveWorker){
      largeSaveWorker.terminate();largeSaveWorker=null;
      largeSaveWorkerBusy=false;largeSaveNeedsLatest=false;
    }
    const generation=largeSaveGeneration;
    try{
      const packed=await encodeSavePayloadAsync(snapshot);
      // A later game action or slot change invalidates this snapshot. Never
      // let an old manual Worker overwrite a new campaign/autosave.
      if(state!==snapshot||generation!==largeSaveGeneration)return false;
      invalidatePendingLargeSave();
      ls.setItem(SAVE_KEY,packed);
      return true;
    }catch(_){return false;}
  }

  function save() {
    invalidatePendingLargeSave();
    if(fastSimulationTesting)return true; // test-only: persist a real full save at the end of a long simulated career
    const ls = storage();
    if (!ls || !state) return false;
    try { ls.setItem(SAVE_KEY, encodeSave(state)); return true; } catch (e) { return false; }
  }
  function hasSave() { try { const ls = storage(); return !!(ls && ls.getItem(SAVE_KEY)); } catch (e) { return false; } }
  function load() {
    const ls = storage();
    if (!ls) return { ok: false, reason: 'Saving is not available in this browser.' };
    let obj;
    try { obj = decodeSave(ls.getItem(SAVE_KEY)); } catch (e) { return { ok: false, reason: 'Save file is damaged.' }; }
    if (!obj) return { ok: false, reason: 'No save found.' };
    if (obj.version === 8) {
      if (!obj.market) return { ok: false, reason: 'Save is missing market data.' };
      obj.market.topics = obj.market.topics || {};
      CONTENT.TOPICS.forEach(t => { if (obj.market.topics[t.id] == null) obj.market.topics[t.id] = 1; });
      obj.events = obj.events || { cooldownUntil: 0, nextWeek: 30, seen: {} };
      obj.recruitment = obj.recruitment || { declined: {} };
      obj.events.recentProduction = obj.events.recentProduction || [];
      obj.version = 9;
    }
    if (obj.version === 9) {
      obj.filmArchive = obj.filmArchive || { rivals: [], incompleteBefore: obj.week };
      obj.awards = obj.awards || { history: [], pool: [] };
      obj.awards.judged = obj.awards.judged || {};
      (obj.awards.history || []).forEach(rec => { obj.awards.judged[rec.year + ':' + (rec.id || 'golden')] = true; });
      obj.studio.homeRegion = obj.studio.homeRegion || 'northamerica';
      // Only recent AI productions were retained in v9; missing history is never invented.
      (obj.rivals && obj.rivals.list || []).forEach(r => (r.films || []).filter(f => f.stage !== 'planned').forEach(f => {
        const id = 'rival:' + r.id + ':' + f.id;
        if (obj.filmArchive.rivals.some(x => x.id === id)) return;
        obj.filmArchive.rivals.push({ id: id, rivalId: r.id, studio: r.name, title: f.title,
          format: 'feature', genre: f.genre, topic: f.topic || null, releaseWeek: f.week,
          year: TUNING.startYear + Math.floor(f.week / TUNING.weeksPerYear), budget: f.budget,
          quality: f.quality, critic: f.critic == null ? null : f.critic, gross: f.gross || 0,
          revenue: f.revenue || 0, profit: f.stage === 'done' ? f.revenue - f.budget : null,
          result: f.result, stage: f.stage, credits: f.credits || {},
          awards: [], festResults: [], regions: [], regionalGross: {}, legacy: true });
      }));
      obj.version = 10;
    }
    if (obj.version === 10) {
      // v11 adds custom poster references, audience reaction, sequel lineage and
      // annual reviews without recomputing any historic film results.
      obj.campaignId = obj.campaignId || ('migrated-' + Date.now().toString(36) + '-' + Math.floor(Math.random()*1e8).toString(36));
      obj.annualReviews = obj.annualReviews || [];
      (obj.projects || []).forEach(p => { if (p.posterCustom == null) p.posterCustom = false; });
      obj.version = 11;
    }
    if (obj.version === 11) {
      // Upgrade talent without changing original skill, fame, credits or contracts.
      (obj.talent || []).forEach(t => {
        t.homeRegion = t.homeRegion || obj.studio.homeRegion || 'northamerica';
        t.career = t.career || { recent: [], trend: 'Established', peakSkill: t.skill, peakFame: t.fame, projects: (t.credits || []).length, lastActiveWeek: null, plateauUntil: 0 };
      });
      obj.version = 12;
    }
    if (obj.version === 12) {
      obj.reputation = migrateReputation(obj);
      obj.world = obj.world || {yearbook:[],decadeChampions:[],leadershipEvents:[]};
      obj.legacyPlay = obj.legacyPlay || {milestones:[],initiative:null,nextInitiativeWeek:0,reissues:[],lastReissueWeek:-999,industryShift:null,shiftHistory:[]};
      obj.version = 13;
    }
    if (obj.version !== SAVE_VERSION) return { ok: false, reason: 'Save is from version ' + obj.version + '; this build uses version ' + SAVE_VERSION + '. Start a new game.' };
    state = obj;
    captureDemandSnapshot(); // Old saves establish a truthful baseline now, never backfill invented trends.
    state.annualReviews = state.annualReviews || [];
    // Existing saves already have historic annual reviews; don't replay those old
    // popups on migration. New games persist dismissed years as they are viewed.
    state.yearEndPresented = Array.isArray(state.yearEndPresented) ? state.yearEndPresented : state.annualReviews.map(r => r.year);
    state.yearPlans = Array.isArray(state.yearPlans) ? state.yearPlans : [];
    // Legacy studios already saw their historical releases. Do not replay all premieres after upgrade.
    state.premierePresented = Array.isArray(state.premierePresented) ? state.premierePresented :
      state.projects.filter(p => p.releaseWeek != null).map(p => p.id);
    // Existing players should not receive a backlog of old wrap-up popups.
    state.endRunPresented = Array.isArray(state.endRunPresented) ? state.endRunPresented :
      state.projects.filter(p => p.stage === 'done').map(p => p.id);
    state.reputation = state.reputation || migrateReputation(state);
    state.world = state.world || {yearbook:[],decadeChampions:[],leadershipEvents:[]};
    state.legacyPlay = state.legacyPlay || {milestones:[],initiative:null,nextInitiativeWeek:0,reissues:[],lastReissueWeek:-999,industryShift:null,shiftHistory:[]};
    updateCurrentPrestige();
    state.campaignId = state.campaignId || ('migrated-' + Date.now().toString(36));
    state.filmArchive = state.filmArchive || { rivals: [], incompleteBefore: state.week };
    state.awards.judged = state.awards.judged || {};
    state.studio.homeRegion = state.studio.homeRegion || 'northamerica';
    state.recruitment = state.recruitment || { declined: {} };
    state.events.recentProduction = state.events.recentProduction || [];
    v14State();
    save();
    emit('load');
    return { ok: true };
  }
  function clearSave() { invalidatePendingLargeSave(); try { const ls = storage(); if (ls) ls.removeItem(SAVE_KEY); } catch (e) { /* ignore */ } }
  // Save-library helpers: the original active autosave key and save version stay
  // unchanged. IndexedDB holds inactive campaigns; the UI owns slot metadata.
  function inspectSave(raw) {
    try {
      const data=decodeSave(raw);
      if(!data || !Number.isInteger(data.version) || data.version<8 || data.version>SAVE_VERSION ||
          !data.studio || !Number.isFinite(data.week)) return null;
      return {version:data.version,campaignId:data.campaignId||null,studio:String(data.studio.name||'Untitled Pictures'),
        week:data.week,year:TUNING.startYear+Math.floor(data.week/TUNING.weeksPerYear),
        releases:Number(data.studio.releases)||0};
    } catch(e){return null;}
  }
  function closeSession(){invalidatePendingLargeSave();state=null;emit('close');}

// ===== SECTION: PUBLIC_API =====
  return {
    get state() { return state; },
    TUNING: TUNING, SLOTS: SLOTS,
    on: on,
    newGame: newGame, nextTurn: nextTurn, advance: advance, choose: choose,
    startProject: startProject, previewProject: previewProject, randomTitle: randomTitle, setPosterStyle: setPosterStyle, ensembleCaps: ensembleCaps,
    v144BudgetInfo:v144BudgetInfo,v144Pay:v144Pay,
    v144Reallocate:v144Reallocate,v144IncreaseCap:v144IncreaseCap,
    sequelContinuity: sequelContinuity, sequelCastSuggestion: sequelCastSuggestion,
    formats: formats, activeProject: activeProject, activeProjects: activeProjects, capacity: capacity, getProject: getProject,
    takeLoan: takeLoan, repayLoan: repayLoan, loanCap: loanCap, freelanceIncome: freelanceIncome,
    weeklyBurn: weeklyBurn, weeklyProfit: weeklyProfit, weeklySalaries: weeklySalaries,
    studioSize: studioSize, staffCount: staffCount, weeklyPayroll: weeklyPayroll, officePayroll: officePayroll, weeklyOverhead: weeklyOverhead, quarterToDate: quarterToDate,
    marketInfo: marketInfo, demandMovers:demandMovers, marketOutlook: marketOutlook,
    series: () => state.series, activeSeries: activeSeries, getSeries: getSeries, tvSlotsUsed: tvSlotsUsed, windowName: windowName,
    seriesPlan:seriesPlan,seriesScope:seriesScope,signSeriesSponsor:signSeriesSponsor,declineSeriesSponsor:declineSeriesSponsor,
    seriesFeasibility:seriesFeasibility,
    growthTier: growthTier, upgradeQuote: upgradeQuote, upgradeTier: upgradeTier,
    staffInfo: staffInfo, staffAction: staffAction,
    regions: () => CONTENT.REGIONS, homeRegion: homeRegion, regionQuote: regionQuote, setDistribution: setDistribution,
    filmFollowing:filmFollowing, studioFollowing:studioFollowing,
    filmHistory: filmHistory, filmById: filmById, filmScore: filmScore, filmRankings: filmRankings, sequelEligibility: sequelEligibility, franchiseFilms: franchiseFilms, receptionText: receptionText,
    projectPulse: projectPulse, filmAdmissions: filmAdmissions, admissionsFromGross: admissionsFromGross,
    shortAudience: shortAudience, shortRunRemaining: shortRunRemaining, shortScreeningWeeks:shortScreeningWeeks,
    shortFestivalStatus:shortFestivalStatus,
    shortPostReleaseQuote:shortPostReleaseQuote,shortPostReleaseAction:shortPostReleaseAction,
    estimatedTvHouseholds:estimatedTvHouseholds, householdImpressionsForRating:householdImpressionsForRating,
    estimatedTicketPrice: estimatedTicketPrice, releasePushQuote: releasePushQuote, pushRelease: pushRelease,
    filmPromotionOptions:()=>FILM_PROMOTIONS,filmPromotionQuote:filmPromotionQuote,filmPromote:filmPromote,
    lifecycleQuote:lifecycleQuote, lifecycleTick:lifecycleTick,
    filmSponsorQuote:filmSponsorQuote,acceptFilmSponsor:acceptFilmSponsor,declineFilmSponsor:declineFilmSponsor,
    worldStandings: studioWorldStandings, worldYearbook:()=>state.world,
    rivals: rivalList, activeRivals: activeRivals, getRival: getRival, rivalInfo: rivalInfo, rivalName: rivalName, audienceShare: audienceShare, talentMorale: talentMorale,
    founderRole: founderRole, founderFreelancing: founderFreelancing, founderProject: founderProject, dealDiscount: dealDiscount, founderHype: founderHype,
    talent: talentList, getTalent: getTalent, talentFee: talentFee, salaryOf: salaryOf, traitsOf: traitsOf, effReliability: effReliability,
    talentStatus: talentStatus, recognition: recognition, talentReach: talentReach, talentContribution: talentContribution, slotOptions: slotOptions, recruitmentInterest: recruitmentInterest, castSummary: castSummary,talentCareer:talentCareer,
    roster: roster, rosterCap: rosterCap, weeksLeft: weeksLeft, isExpiring: isExpiring, expiringContracts: expiringContracts,
    contractQuote: contractQuote, signExclusive: signExclusive, renewContract: renewContract, releaseContract: releaseContract, severanceOf: severanceOf,
    news: news, newsFilters: newsFilters,
    awardsInfo: awardsInfo, awardCampaign: awardCampaign, campaignQuote: campaignQuote,
    reputationInfo: reputationInfo, legacyInfo: legacyInfo, initiativeQuote: initiativeQuote, startInitiative: startInitiative, reissueQuote: reissueQuote, reissueFilm: reissueFilm,
    scoreInfo: scoreInfo, scoreLines: scoreLines, legacyRecap: legacyRecap, leaderboard: leaderboard, clearLeaderboard: clearLeaderboard,
    dateOf: dateOf, eraOf: eraOf, eraInfo: eraInfo, eraLines: eraLines,
    save: save, saveAsync: saveAsync, load: load, hasSave: hasSave, clearSave: clearSave,
    inspectSave: inspectSave, encodeSavePayload: encodeSave, encodeSavePayloadAsync: encodeSavePayloadAsync, closeSession: closeSession,
    setFastSimulationTesting:setFastSimulationTesting,
    v14State:v14State, v14Dna:v14Dna, v14Storyboard:v14Storyboard,
    v14Visions:()=>V14_VISIONS, v14Strengths:()=>V14_TAGS, v14Risks:()=>V14_RISKS,
    v14Chemistry:v14Chemistry, v14PairKey:v14PairKey, v14SetDelegation:v14SetDelegation,
    v14ReleasePlans:()=>V14_RELEASE_PLANS, v14SetReleasePlan:v14SetReleasePlan, v14ReleaseCalendar:v14ReleaseCalendar,
    v14ReleaseResponseQuote:v14ReleaseResponseQuote, v14ReleaseResponse:v14ReleaseResponse,
    v14MarketInfo:v14MarketInfo, v14ScriptQuote:v14ScriptQuote,
    v14Rivalry:()=>v14State().rivalry.slice(-15), v14Identity:v14Identity,
    v14FilmLegacy:v14FilmLegacy, v14AfterlifeQuote:v14AfterlifeQuote,v14AfterlifeAction:v14AfterlifeAction,
    v14Ambitions:v14Ambitions,v14PickAmbition:v14PickAmbition
  };
})();
