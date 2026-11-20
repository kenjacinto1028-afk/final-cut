// ===== SECTION: HEADER =====
// Final Cut — media.js
// Music (8.1), posters (8.2), art (8.3), sound effects (8.4) and visual effects (8.5).
// Reads Engine state and events; never changes game state. Settings are saved under their own key, not in the game save.
// Load order: content.js → engine.js → media.js → ui.js
var Media = (function () {
  'use strict';

// ===== SECTION: SETTINGS =====
  // Saved in localStorage 'finalcut_media' (separate from the game save, so no SAVE_VERSION impact).
  // 8.4: sfx = sound effects toggle. 8.5: reduceMotion (first run follows the system "reduce motion" setting).
  const SETTINGS_KEY = 'finalcut_media';
  const settings = { music: false, sfx: false, volume: 0.5, reduceMotion: false };
  function storage() { try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch (e) { return null; } }
  function loadSettings() {
    const ls = storage();
    let found = false;
    if (ls) {
      try {
        const o = JSON.parse(ls.getItem(SETTINGS_KEY));
        if (o && typeof o === 'object') { found = true; Object.keys(settings).forEach(k => { if (typeof o[k] === typeof settings[k]) settings[k] = o[k]; }); }
      } catch (e) { /* ignore a damaged entry */ }
    }
    if (!found) {
      try { if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) settings.reduceMotion = true; } catch (e) { /* no matchMedia */ }
    }
  }
  function saveSettings() { const ls = storage(); if (ls) { try { ls.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (e) { /* storage blocked */ } } }

// ===== SECTION: UTIL =====
  // Seeded RNG so posters and melodies are stable for the same input.
  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let a = seed >>> 0; return function () { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function xml(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function midiHz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function currentEra() {
    try { return Engine.state ? Engine.eraOf(Engine.dateOf().year).id : 'newhollywood'; } catch (e) { return 'newhollywood'; }
  }

// ===== SECTION: MUSIC_STYLES =====
  // One style per era id (CONTENT.ERAS). bpm, swing (0–0.3), root (MIDI note), waveforms per voice, filter cutoff (Hz),
  // gains, and drum kit tone. Moods (calm / tense / triumphant) pick the chords, scale, drum pattern and melody density.
  const STYLES = {
    newhollywood: { bpm: 92, swing: 0.18, root: 50, lead: 'triangle', bass: 'triangle', pad: 'sine', cutoff: 1800, lg: 0.10, bg: 0.16, pg: 0.05, kit: 'soft', label: '70s soul keys' },
    blockbuster:  { bpm: 112, swing: 0, root: 52, lead: 'sawtooth', bass: 'sawtooth', pad: 'sawtooth', cutoff: 2600, lg: 0.06, bg: 0.12, pg: 0.035, kit: 'gated', label: '80s synth' },
    indie:        { bpm: 86, swing: 0.12, root: 47, lead: 'triangle', bass: 'sine', pad: 'triangle', cutoff: 1400, lg: 0.10, bg: 0.18, pg: 0.04, kit: 'lofi', label: '90s lo-fi' },
    digital:      { bpm: 124, swing: 0, root: 53, lead: 'square', bass: 'square', pad: 'sawtooth', cutoff: 2200, lg: 0.05, bg: 0.10, pg: 0.03, kit: 'tight', label: '2000s electronic' },
    streaming:    { bpm: 78, swing: 0.05, root: 45, lead: 'sine', bass: 'sine', pad: 'triangle', cutoff: 1200, lg: 0.11, bg: 0.20, pg: 0.06, kit: 'soft', label: '2010s ambient' },
    future:       { bpm: 100, swing: 0, root: 49, lead: 'sine', bass: 'triangle', pad: 'sine', cutoff: 3000, lg: 0.09, bg: 0.15, pg: 0.05, kit: 'tight', label: 'Next-wave bells', fm: true }
  };
  // Chords: [semitones from root, 'M' | 'm' | 'd'] per bar. Scales: semitone steps for melodies.
  const MOODS = {
    calm: { chords: [[0, 'M'], [9, 'm'], [5, 'M'], [7, 'M']], scale: [0, 2, 4, 7, 9], density: 0.28, octave: 1, drums: { kick: [0, 10], snare: [], hat: [4, 12], gain: 0.6 } },
    tense: { chords: [[0, 'm'], [1, 'M'], [0, 'm'], [6, 'd']], scale: [0, 1, 3, 5, 6, 8], density: 0.42, octave: 0, drums: { kick: [0, 3, 8, 11], snare: [], hat: [0, 2, 4, 6, 8, 10, 12, 14], gain: 0.7 } },
    triumphant: { chords: [[0, 'M'], [5, 'M'], [7, 'M'], [0, 'M']], scale: [0, 2, 4, 5, 7, 9, 11], density: 0.55, octave: 1, drums: { kick: [0, 4, 8, 12], snare: [4, 12], hat: [2, 6, 10, 14], gain: 1 } }
  };
  const CHORD = { M: [0, 4, 7], m: [0, 3, 7], d: [0, 3, 6] };

// ===== SECTION: MUSIC =====
  // Web Audio, look-ahead scheduler (setInterval 25 ms, schedules 120 ms ahead), 16 steps per bar.
  // The AudioContext starts on a user gesture (browser autoplay rules): turning music on, or the first click after loading with music on.
  const audio = { ctx: null, master: null, music: null, noise: null, timer: null, next: 0, step: 0, bar: 0, era: 'newhollywood', mood: 'calm', pendingMood: null, rand: rng(7) };
  function supported() { return typeof window !== 'undefined' && !!(window.AudioContext || window.webkitAudioContext); }
  function ensureCtx() {
    if (audio.ctx) return audio.ctx;
    if (!supported()) return null;
    const AC = window.AudioContext || window.webkitAudioContext;
    const ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.ratio.value = 4;
    audio.master = ctx.createGain();
    audio.master.gain.value = 0;
    audio.music = ctx.createGain();
    audio.music.gain.value = 1;
    audio.music.connect(audio.master);
    audio.master.connect(comp);
    comp.connect(ctx.destination);
    const len = ctx.sampleRate;   // 1 s of white noise for drums
    audio.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = audio.noise.getChannelData(0), r = rng(99);
    for (let i = 0; i < len; i++) d[i] = r() * 2 - 1;
    audio.ctx = ctx;
    return ctx;
  }
  function applyVolume(fast) {
    if (!audio.ctx) return;
    const v = settings.music ? Math.pow(settings.volume, 1.5) * 0.7 : 0;   // perceptual-ish curve
    audio.master.gain.setTargetAtTime(v, audio.ctx.currentTime, fast ? 0.05 : 0.4);
  }
  function tone(freq, t, dur, type, gain, cutoff, attack, fm) {
    const ctx = audio.ctx, o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    o.type = type; o.frequency.value = freq;
    if (fm) {   // simple FM bell for the future style
      const mo = ctx.createOscillator(), mg = ctx.createGain();
      mo.frequency.value = freq * 2.01; mg.gain.setValueAtTime(freq * 1.2, t); mg.gain.exponentialRampToValueAtTime(1, t + dur);
      mo.connect(mg); mg.connect(o.frequency); mo.start(t); mo.stop(t + dur + 0.05);
    }
    f.type = 'lowpass'; f.frequency.value = cutoff; f.Q.value = 0.7;
    const a = attack || 0.01;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + a);
    g.gain.setTargetAtTime(0.0001, t + Math.max(a, dur * 0.6), dur * 0.35);
    o.connect(f); f.connect(g); g.connect(audio.music);
    o.start(t); o.stop(t + dur + 0.3);
  }
  function noiseHit(t, dur, gain, type, freq) {
    const ctx = audio.ctx, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = audio.noise;
    f.type = type; f.frequency.value = freq;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(audio.music);
    s.start(t, audio.rand() * 0.5); s.stop(t + dur + 0.02);
  }
  function kick(t, gain) {
    const ctx = audio.ctx, o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    o.connect(g); g.connect(audio.music); o.start(t); o.stop(t + 0.3);
  }
  function drums(st, md, i, t) {
    const D = md.drums, k = st.kit, gm = D.gain;
    if (D.kick.includes(i)) kick(t, 0.5 * gm);
    if (D.snare.includes(i)) noiseHit(t, k === 'gated' ? 0.22 : 0.14, (k === 'lofi' ? 0.12 : 0.18) * gm, 'bandpass', k === 'gated' ? 1400 : 1900);
    if (D.hat.includes(i)) noiseHit(t, k === 'soft' ? 0.04 : 0.03, (k === 'soft' ? 0.035 : 0.05) * gm, 'highpass', k === 'lofi' ? 5000 : 8000);
  }
  // One 16th-note step. New bar: pick up a pending mood or era change, play bass and pad; then drums and melody.
  function playStep(t) {
    const i = audio.step % 16;
    if (i === 0) {
      if (audio.pendingMood) { audio.mood = audio.pendingMood; audio.pendingMood = null; }
      const era = currentEra();
      if (era !== audio.era && STYLES[era]) audio.era = era;
    }
    const st = STYLES[audio.era] || STYLES.newhollywood, md = MOODS[audio.mood] || MOODS.calm;
    const spb = 60 / st.bpm / 4, barLen = spb * 16;
    const ch = md.chords[audio.bar % md.chords.length];
    const root = st.root + ch[0] + (audio.mood === 'tense' ? -2 : 0);
    if (i === 0) {
      tone(midiHz(root - 12), t, barLen * 0.45, st.bass, st.bg, st.cutoff * 0.5, 0.01);
      CHORD[ch[1]].forEach(n => tone(midiHz(root + 12 + n), t, barLen * 0.95, st.pad, st.pg, st.cutoff * 0.7, 0.3));
    } else if (i === 8 && audio.mood !== 'calm') {
      tone(midiHz(root - 12 + (audio.mood === 'tense' ? 1 : 7)), t, barLen * 0.4, st.bass, st.bg * 0.8, st.cutoff * 0.5, 0.01);
    }
    drums(st, md, i, t);
    // Melody: chord tones on strong steps, scale tones elsewhere; density by mood.
    const strong = i % 4 === 0;
    if (audio.rand() < md.density * (strong ? 1.4 : 0.7)) {
      const pool = strong ? CHORD[ch[1]] : md.scale;
      const n = pool[Math.floor(audio.rand() * pool.length)] + 12 * (md.octave + (audio.rand() < 0.25 ? 1 : 0));
      tone(midiHz(root + 12 + n), t, spb * (strong ? 2.2 : 1.2), st.lead, st.lg, st.cutoff, 0.01, st.fm);
    }
    audio.step++;
    if (audio.step % 16 === 0) audio.bar++;
  }
  function schedule() {
    const ctx = audio.ctx;
    if (!ctx) return;
    while (audio.next < ctx.currentTime + 0.12) {
      const st = STYLES[audio.era] || STYLES.newhollywood;
      const spb = 60 / st.bpm / 4;
      const swing = (audio.step % 2 === 1) ? spb * st.swing : 0;
      playStep(audio.next + swing);
      audio.next += spb;
    }
  }
  function startMusic() {
    const ctx = ensureCtx();
    if (!ctx) return false;
    if (ctx.state === 'suspended') ctx.resume();
    audio.era = currentEra();
    audio.mood = moodNow();
    if (!audio.timer) {
      audio.next = ctx.currentTime + 0.08;
      audio.step = 0;
      audio.timer = setInterval(schedule, 25);
    }
    applyVolume();
    return true;
  }
  function stopMusic() {
    applyVolume();
    if (audio.timer) { clearInterval(audio.timer); audio.timer = null; }
    if (audio.ctx) { const ctx = audio.ctx; setTimeout(() => { if (!settings.music && ctx.state === 'running') ctx.suspend(); }, 800); }
  }
  function setMusic(on) {
    settings.music = !!on;
    saveSettings();
    if (settings.music) startMusic(); else stopMusic();
    return settings.music;
  }
  function toggleMusic() { return setMusic(!settings.music); }
  function setVolume(v) {
    settings.volume = Math.max(0, Math.min(1, Number(v)));
    saveSettings();
    applyVolume(true);
    if (sfx.ctx && sfx.out) sfx.out.gain.setTargetAtTime(0.55 * settings.volume, sfx.ctx.currentTime, 0.03);
  }
  function musicState() {
    return { on: settings.music, volume: settings.volume, mood: audio.pendingMood || audio.mood, era: audio.era, style: (STYLES[audio.era] || {}).label, supported: supported() };
  }

// ===== SECTION: MOOD =====
  // Mood follows the game: tense when cash is short or a crisis is waiting, triumphant for a while after a hit, a win or a tier upgrade.
  // Changes take effect on the next bar.
  let triumphBars = 0;
  function moodNow() {
    const s = (typeof Engine !== 'undefined') ? Engine.state : null;
    if (!s) return 'calm';
    if (s.gameOver) return 'tense';
    if (s.warning && s.warning.stage > 0) return 'tense';
    if (s.pending && s.pending.disaster) return 'tense';
    if (triumphBars > audio.bar) return 'triumphant';
    let burn = 0;
    try { burn = Engine.weeklyBurn(); } catch (e) { burn = 0; }
    if (s.cash < burn * 4) return 'tense';
    return 'calm';
  }
  function triumph(bars) { triumphBars = audio.bar + (bars || 8); updateMood(); }
  function updateMood() {
    const m = moodNow();
    if (m !== audio.mood) audio.pendingMood = m; else audio.pendingMood = null;
  }

// ===== SECTION: POSTERS =====
  // 8.2 – original abstract posters as SVG strings (200 × 300 view box), stable per film (seeded from id + title).
  // Era sets the background treatment and type; genre sets the palette and motif. No real artwork, logos or likenesses.
  const POSTER_ERAS = {
    newhollywood: { font: 'Georgia, \'Times New Roman\', serif', weight: 700, upper: true, spacing: 2, frame: true, grain: true, bg: 'paper' },
    blockbuster: { font: 'Archivo, Impact, \'Arial Black\', sans-serif', weight: 800, upper: true, spacing: 1, chrome: true, bg: 'neon', grid: true },
    indie: { font: 'Inter, Helvetica, Arial, sans-serif', weight: 600, upper: false, spacing: 0, bg: 'plain', block: true },
    digital: { font: 'Archivo, \'Arial Black\', sans-serif', weight: 800, upper: true, spacing: 0.5, bg: 'tealorange', vignette: true },
    streaming: { font: 'Inter, Helvetica, Arial, sans-serif', weight: 500, upper: true, spacing: 4, bg: 'flat' },
    future: { font: 'Archivo, \'Arial Black\', sans-serif', weight: 800, upper: true, spacing: 3, bg: 'mesh', glow: true }
  };
  // [background, accent, light, dark]
  const GENRE_PAL = {
    drama: ['#2f3e55', '#c9a66b', '#e8e2d4', '#151b26'], comedy: ['#ffcf2e', '#e2402b', '#fff7dc', '#3a2a00'],
    horror: ['#120707', '#b3121b', '#e9d8c8', '#000000'], thriller: ['#0d1f22', '#3fb6a8', '#dbe9e6', '#020708'],
    scifi: ['#0b1340', '#46d4ff', '#e3f6ff', '#03061a'], western: ['#c4612a', '#f2b33d', '#fbe7c6', '#3b1708'],
    romance: ['#6b2346', '#ff8fb1', '#ffe6ee', '#2a0a19'], action: ['#1a1a1a', '#ff6a13', '#fff1e6', '#000000'],
    documentary: ['#d9d5cc', '#1e1e1e', '#f6f4ef', '#111111']
  };
  const TAGLINES = {
    drama: ['Some roads only go one way.', 'Every family keeps a secret.', 'What we leave behind.'],
    comedy: ['It seemed like a good idea.', 'Nobody planned for this.', 'Bigger. Louder. Worse.'],
    horror: ['Do not open the door.', 'It knows your name.', 'The night is longer here.'],
    thriller: ['Trust no one.', 'One witness. One chance.', 'The truth has a price.'],
    scifi: ['The signal is getting closer.', 'Tomorrow arrives early.', 'We are not the first.'],
    western: ['The frontier keeps its own law.', 'One town. One reckoning.', 'Dust settles. Debts don\'t.'],
    romance: ['Two hearts, one summer.', 'Some things are worth the wait.', 'Love never reads the map.'],
    action: ['No brakes. No backup.', 'Hold on.', 'This time it\'s personal.'],
    documentary: ['A true story.', 'What really happened.', 'Seen from the inside.']
  };
  function motif(genre, pal, r) {
    const A = pal[1], L = pal[2], D = pal[3];
    let s = '';
    if (genre === 'scifi') {
      for (let i = 0; i < 40; i++) s += '<circle cx="' + (r() * 200).toFixed(1) + '" cy="' + (r() * 190).toFixed(1) + '" r="' + (r() * 0.9 + 0.3).toFixed(2) + '" fill="' + L + '" opacity="' + (0.4 + r() * 0.6).toFixed(2) + '"/>';
      const cx = 60 + r() * 80, cy = 85 + r() * 30, R = 34 + r() * 14;
      s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="' + A + '" opacity=".9"/>' +
        '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + (R * 1.8) + '" ry="' + (R * 0.38) + '" fill="none" stroke="' + L + '" stroke-width="2.5" transform="rotate(-18 ' + cx + ' ' + cy + ')"/>';
    } else if (genre === 'western') {
      const cy = 95 + r() * 20;
      s += '<circle cx="' + (70 + r() * 60) + '" cy="' + cy + '" r="' + (36 + r() * 10) + '" fill="' + A + '"/>' +
        '<path d="M0 ' + (cy + 40) + ' L30 ' + (cy + 18) + ' L55 ' + (cy + 18) + ' L70 ' + (cy + 40) + ' L120 ' + (cy + 40) + ' L135 ' + (cy + 8) + ' L175 ' + (cy + 8) + ' L190 ' + (cy + 40) + ' L200 ' + (cy + 40) + ' L200 300 L0 300 Z" fill="' + D + '" opacity=".85"/>';
    } else if (genre === 'horror') {
      s += '<circle cx="' + (120 + r() * 40) + '" cy="' + (60 + r() * 20) + '" r="28" fill="' + L + '" opacity=".85"/>';
      for (let i = 0; i < 6; i++) {
        const x = r() * 200, w = 1 + r() * 2.5;
        s += '<path d="M' + x.toFixed(1) + ' 300 Q' + (x + (r() - 0.5) * 60).toFixed(1) + ' ' + (150 + r() * 40).toFixed(1) + ' ' + (x + (r() - 0.5) * 90).toFixed(1) + ' ' + (60 + r() * 60).toFixed(1) + '" stroke="' + D + '" stroke-width="' + w.toFixed(1) + '" fill="none"/>';
      }
      for (let i = 0; i < 5; i++) { const x = 15 + r() * 170; s += '<path d="M' + (x - 5) + ' 0 L' + (x + 5) + ' 0 L' + (x + 1.5) + ' ' + (20 + r() * 40).toFixed(1) + ' Z" fill="' + A + '"/>'; }
    } else if (genre === 'thriller') {
      s += '<path d="M100 0 L' + (40 + r() * 20) + ' 300 L' + (140 + r() * 20) + ' 300 Z" fill="' + L + '" opacity=".12"/>';
      for (let i = 0; i < 9; i++) {
        const x = 100 + (r() - 0.5) * 140, y = 110 + (r() - 0.5) * 120;
        s += '<path d="M100 115 L' + x.toFixed(1) + ' ' + y.toFixed(1) + '" stroke="' + A + '" stroke-width="' + (0.6 + r() * 1.4).toFixed(1) + '"/>';
      }
      s += '<rect x="88" y="103" width="24" height="24" fill="' + D + '" transform="rotate(' + Math.round(r() * 40) + ' 100 115)"/>';
    } else if (genre === 'romance') {
      const y = 100 + r() * 20;
      s += '<circle cx="' + (80 + r() * 6) + '" cy="' + y + '" r="40" fill="' + A + '" opacity=".75"/><circle cx="' + (118 + r() * 6) + '" cy="' + (y + 6) + '" r="40" fill="' + L + '" opacity=".55"/>';
      for (let i = 0; i < 12; i++) s += '<circle cx="' + (r() * 200).toFixed(1) + '" cy="' + (r() * 200).toFixed(1) + '" r="' + (1 + r() * 3).toFixed(1) + '" fill="' + L + '" opacity=".5"/>';
    } else if (genre === 'action') {
      const cx = 100 + (r() - 0.5) * 40, cy = 105 + (r() - 0.5) * 30;
      let pts = '';
      for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2, rr = i % 2 ? 30 + r() * 15 : 70 + r() * 25; pts += (cx + Math.cos(a) * rr).toFixed(1) + ',' + (cy + Math.sin(a) * rr).toFixed(1) + ' '; }
      s += '<polygon points="' + pts + '" fill="' + A + '"/>' + '<circle cx="' + cx + '" cy="' + cy + '" r="22" fill="' + L + '" opacity=".9"/>';
      for (let i = 0; i < 4; i++) { const y = 20 + r() * 180; s += '<path d="M-10 ' + (y + 40).toFixed(1) + ' L210 ' + y.toFixed(1) + '" stroke="' + L + '" stroke-width="' + (1 + r() * 3).toFixed(1) + '" opacity=".6"/>'; }
    } else if (genre === 'comedy') {
      for (let i = 0; i < 26; i++) {
        const c = [pal[1], pal[2], pal[3]][Math.floor(r() * 3)];
        s += '<circle cx="' + (r() * 200).toFixed(1) + '" cy="' + (r() * 200).toFixed(1) + '" r="' + (3 + r() * 14).toFixed(1) + '" fill="' + c + '" opacity="' + (0.5 + r() * 0.5).toFixed(2) + '"/>';
      }
    } else if (genre === 'documentary') {
      const step = 10 + Math.floor(r() * 4);
      for (let y = 20; y < 200; y += step) for (let x = 10; x < 200; x += step) {
        const d = Math.hypot(x - 100, y - 110), rad = Math.max(0.4, 4.5 - d / 22);
        s += '<circle cx="' + x + '" cy="' + y + '" r="' + rad.toFixed(2) + '" fill="' + A + '"/>';
      }
    } else {   // drama: horizon and a lone figure
      const hy = 130 + r() * 30, fx = 50 + r() * 100;
      s += '<rect x="0" y="' + hy + '" width="200" height="' + (300 - hy) + '" fill="' + D + '" opacity=".75"/>' +
        '<circle cx="' + (40 + r() * 120) + '" cy="' + (hy - 50) + '" r="18" fill="' + A + '" opacity=".8"/>' +
        '<rect x="' + (fx - 3) + '" y="' + (hy - 30) + '" width="6" height="30" fill="' + D + '"/><circle cx="' + fx + '" cy="' + (hy - 35) + '" r="4.5" fill="' + D + '"/>';
    }
    return s;
  }
  function background(E, pal, r, id) {
    if (E.bg === 'paper') return '<rect width="200" height="300" fill="#ecdfc4"/><rect x="10" y="10" width="180" height="200" fill="' + pal[0] + '"/>';
    if (E.bg === 'neon') return '<defs><linearGradient id="nb' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0820"/><stop offset=".55" stop-color="' + pal[0] + '"/><stop offset="1" stop-color="#ff2f86"/></linearGradient></defs><rect width="200" height="300" fill="url(#nb' + id + ')"/>';
    if (E.bg === 'plain') return '<rect width="200" height="300" fill="#f3f0e8"/>';
    if (E.bg === 'tealorange') return '<defs><linearGradient id="to' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0f4c5c"/><stop offset=".6" stop-color="' + pal[0] + '"/><stop offset="1" stop-color="#e36414"/></linearGradient></defs><rect width="200" height="300" fill="url(#to' + id + ')"/>';
    if (E.bg === 'mesh') return '<defs><radialGradient id="m1' + id + '" cx="' + (0.2 + r() * 0.3).toFixed(2) + '" cy=".25" r=".8"><stop offset="0" stop-color="' + pal[1] + '" stop-opacity=".9"/><stop offset="1" stop-color="' + pal[3] + '" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="m2' + id + '" cx=".8" cy=".7" r=".7"><stop offset="0" stop-color="#7b5cff" stop-opacity=".8"/><stop offset="1" stop-color="' + pal[3] + '" stop-opacity="0"/></radialGradient></defs>' +
      '<rect width="200" height="300" fill="' + pal[3] + '"/><rect width="200" height="300" fill="url(#m1' + id + ')"/><rect width="200" height="300" fill="url(#m2' + id + ')"/>';
    return '<rect width="200" height="300" fill="' + pal[0] + '"/>';   // flat
  }
  // Relative luminance of a #rrggbb color (0 dark – 1 light), to pick readable text.
  function lum(hex) {
    const n = parseInt(String(hex).slice(1), 16), c = [n >> 16 & 255, n >> 8 & 255, n & 255].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function wrapTitle(t, max) {
    const words = String(t).split(/\s+/), lines = [];
    let cur = '';
    words.forEach(w => { if ((cur + ' ' + w).trim().length > max && cur) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); });
    if (cur) lines.push(cur);
    return lines.slice(0, 3);
  }
  // p = project; returns an SVG string. opts.studio overrides the studio name (tests).
  function posterSVG(p, opts) {
    opts = opts || {};
    const s = (typeof Engine !== 'undefined') ? Engine.state : null;
    const week = p.releaseWeek != null ? p.releaseWeek : (p.startWeek || 0);
    let year = 1970, eraId = 'newhollywood';
    try { year = Engine.dateOf(week).year; eraId = Engine.eraOf(year).id; } catch (e) { /* no engine (tests) */ }
    const E = POSTER_ERAS[eraId] || POSTER_ERAS.newhollywood;
    const pal = GENRE_PAL[p.genre] || GENRE_PAL.drama;
    const familySeed = hash((p.id || 0) + '|' + p.title + '|' + p.genre + '|' + (p.topic || ''));
    const family = Number.isFinite(Number(opts.styleId)) ? Number(opts.styleId) % 8 : Number.isFinite(Number(p.posterStyleId)) ? Number(p.posterStyleId) % 8 : familySeed % 8;
    const r = rng(hash((p.id || 0) + '|' + p.title + '|' + p.genre + '|' + family));
    const uid = 'p' + (p.id || 0) + '_' + (hash(p.title) % 9973) + '_' + family;
    const studio = opts.studio || (s ? s.studio.name : 'Final Cut');
    const title = E.upper ? String(p.title).toUpperCase() : String(p.title);
    const lines = wrapTitle(title, E.upper ? 13 : 16);
    let size = lines.length > 2 ? (E.frame ? 14.5 : 17) : lines.some(l => l.length > 10) ? 19 : 23;
    // Fit the widest line inside 184 units (rough glyph width 0.64 × size + letter spacing).
    lines.forEach(l => { const fit = (184 / l.length - E.spacing) / 0.64; if (fit < size) size = Math.max(10, fit); });
    const light = E.bg === 'plain' || E.bg === 'paper' || (E.bg === 'flat' && lum(pal[0]) > 0.35);
    const ink = light ? '#141414' : pal[2];
    const tagline = (TAGLINES[p.genre] || TAGLINES.drama)[Math.floor(r() * 3)];
    const names = p.castNames || {};
    const credit = [names.lead, names.director ? 'Directed by ' + names.director : null].filter(Boolean).join(' · ');
    let svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300" role="img" aria-label="' + xml('Poster for ' + p.title) + '">';
    svg += background(E, pal, r, uid);
    let art = motif(p.genre, pal, r);
    if (family === 0) {
      if (E.frame) art = '<svg x="10" y="10" width="180" height="200" viewBox="0 0 200 222" preserveAspectRatio="xMidYMid slice">' + art + '</svg>';
      if (E.block) svg += '<rect x="' + (14 + r() * 20).toFixed(0) + '" y="34" width="' + (120 + r() * 40).toFixed(0) + '" height="150" fill="' + pal[0] + '"/>';
      svg += E.block ? '<g opacity=".95"><svg x="20" y="34" width="160" height="150" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">' + motif(p.genre, pal, rng(hash(p.title))) + '</svg></g>' : art;
    } else {
      // Eight original, era-aware artwork compositions. Art stays above the title area.
      // An independent family seed also gives AI films visually varied posters.
      const inner = '<svg x="0" y="0" width="200" height="210" viewBox="0 0 200 220" preserveAspectRatio="xMidYMid slice">' + art + '</svg>';
      const accent = pal[1], pale = pal[2], deep = pal[3];
      if (family === 1) svg += '<rect y="25" width="200" height="175" fill="' + deep + '"/><svg x="0" y="25" width="104" height="170" viewBox="0 0 200 220" preserveAspectRatio="xMidYMid slice">' + art + '</svg><rect x="104" y="25" width="96" height="170" fill="' + accent + '" opacity=".45"/><path d="M104 25V197" stroke="' + pale + '" stroke-width="3"/>';
      else if (family === 2) svg += '<path d="M10 208L100 25L190 208Z" fill="' + accent + '" opacity=".5"/><circle cx="100" cy="98" r="51" fill="' + pale + '" opacity=".18"/><svg x="42" y="26" width="116" height="170" viewBox="0 0 200 220" preserveAspectRatio="xMidYMid meet">' + art + '</svg>';
      else if (family === 3) svg += '<rect x="0" y="35" width="200" height="162" fill="' + deep + '"/><svg x="0" y="35" width="200" height="120" viewBox="0 0 200 220" preserveAspectRatio="xMidYMid slice">' + art + '</svg><path d="M0 170L52 117L100 148L146 100L200 155V200H0Z" fill="' + accent + '" opacity=".76"/>';
      else if (family === 4) svg += '<rect x="18" y="47" width="164" height="132" fill="' + deep + '"/><svg x="45" y="63" width="110" height="100" viewBox="0 0 200 220">' + art + '</svg><path d="M8 28V202M192 28V202" stroke="' + accent + '" stroke-width="5"/>';
      else if (family === 5) svg += '<rect x="0" y="40" width="200" height="145" fill="' + pale + '"/><svg x="6" y="45" width="120" height="140" viewBox="0 0 200 220">' + art + '</svg><svg x="102" y="61" width="95" height="116" viewBox="0 0 200 220">' + motif(p.genre,pal,rng(familySeed+23)) + '</svg><path d="M0 180L200 36" stroke="' + accent + '" stroke-width="9" opacity=".58"/>';
      else if (family === 6) svg += '<circle cx="52" cy="113" r="57" fill="' + accent + '"/><circle cx="142" cy="93" r="61" fill="' + deep + '"/><svg x="3" y="40" width="115" height="155" viewBox="0 0 200 220">' + art + '</svg><svg x="90" y="37" width="103" height="151" viewBox="0 0 200 220">' + motif(p.genre,pal,rng(familySeed+37)) + '</svg>';
      else svg += '<rect x="20" y="28" width="160" height="164" rx="80" fill="' + accent + '" opacity=".75"/><svg x="29" y="38" width="142" height="145" viewBox="0 0 200 220">' + art + '</svg><circle cx="100" cy="110" r="74" fill="none" stroke="' + pale + '" stroke-width="2"/>';
      svg += '<rect x="0" y="198" width="200" height="102" fill="' + pal[0] + '" opacity=".96"/>';
    }
    if (E.grid) { for (let i = 0; i < 8; i++) { const y = 200 + i * i * 1.6; svg += '<line x1="0" y1="' + y.toFixed(1) + '" x2="200" y2="' + y.toFixed(1) + '" stroke="#ff58b5" stroke-width=".7" opacity=".7"/>'; } for (let i = -6; i <= 6; i++) svg += '<line x1="100" y1="196" x2="' + (100 + i * 40) + '" y2="300" stroke="#ff58b5" stroke-width=".6" opacity=".6"/>'; }
    if (E.vignette) svg += '<defs><radialGradient id="v' + uid + '" cx=".5" cy=".45" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".75"/></radialGradient></defs><rect width="200" height="300" fill="url(#v' + uid + ')"/>';
    if (E.grain) for (let i = 0; i < 60; i++) svg += '<rect x="' + (r() * 200).toFixed(1) + '" y="' + (r() * 300).toFixed(1) + '" width=".8" height=".8" fill="#3b2f1f" opacity=".25"/>';
    // Type: studio line at the top, title block, tagline, billing at the bottom.
    svg += '<text x="100" y="' + (E.frame ? 26 : 20) + '" text-anchor="middle" font-family="' + E.font.replace(/"/g, '') + '" font-size="6.5" letter-spacing="2" fill="' + (E.frame ? (lum(pal[0]) > 0.35 ? '#141414' : '#f3ead6') : ink) + '" opacity=".85">' + xml((studio + ' presents').toUpperCase()) + '</text>';
    const ty = E.frame ? 210 + size + 2 : 232 - (lines.length - 1) * size * 0.55;   // the 1970s frame ends at y 210
    let fill = ink;
    if (E.chrome) { svg += '<defs><linearGradient id="c' + uid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#9fd8ff"/><stop offset=".52" stop-color="#3a2a6a"/><stop offset="1" stop-color="#ffb3e0"/></linearGradient></defs>'; fill = 'url(#c' + uid + ')'; }
    if (E.glow) svg += '<defs><filter id="g' + uid + '"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>';
    svg += '<g font-family="' + E.font.replace(/"/g, '') + '" font-weight="' + E.weight + '" text-anchor="middle" letter-spacing="' + E.spacing + '"' + (E.glow ? ' filter="url(#g' + uid + ')"' : '') + '>' +
      lines.map((l, i) => '<text x="100" y="' + (ty + i * size * 1.05).toFixed(1) + '" font-size="' + size + '" fill="' + fill + '"' + (E.chrome ? ' stroke="#12081f" stroke-width="2.6" stroke-linejoin="round" paint-order="stroke"' : '') + '>' + xml(l) + '</text>').join('') + '</g>';
    svg += '<text x="100" y="' + (ty + lines.length * size * 1.05 + 4).toFixed(1) + '" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="7.5" fill="' + ink + '" opacity=".85">' + xml(tagline) + '</text>';
    if (credit) svg += '<text x="100" y="286" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="5.6" fill="' + ink + '" opacity=".75">' + xml(credit) + '</text>';
    svg += '<text x="100" y="294" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="5" letter-spacing="1.5" fill="' + ink + '" opacity=".6">' + year + '</text>';
    return svg + '</svg>';
  }

// ===== SECTION: ART =====
  // 8.3 – abstract art as SVG strings: talent portraits (shapes and colors, no faces), era backdrops, trophies, festival badges.
  // Seeded like the posters: the same person or era always looks the same. Original shapes only, no real artwork or likenesses.
  function svgOpen(vb, w, h, label, extra) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb + '"' + (w ? ' width="' + w + '"' : '') + (h ? ' height="' + h + '"' : '') + (extra || '') + ' role="img" aria-label="' + xml(label) + '">';
  }
  // Portrait: palette from the person's first genre fit, shape family from the role, busier and framed more heavily with fame.
  // Stable 12+ fictional illustrated portrait archetypes: no real people/likenesses.
  // A person's name/id determines all features; fame changes the frame, not their face.
  function portraitSVG(t, size) {
    size=size||96;
    const r=rng(hash('face-v11|' + t.id + '|' + t.name));
    const pal=GENRE_PAL[(t.affinity||[])[0]]||GENRE_PAL.drama;
    const skin=['#f8d7b2','#d8a06f','#ab734c','#714c39','#e7bd93','#9b6242'][Math.floor(r()*6)];
    const hair=['#1b1820','#4b3028','#8a4f30','#c59b61','#40302f','#6f412f'][Math.floor(r()*6)];
    const top=['#203f5b','#6f3448','#456f58','#897245','#433e70','#2d5d68'][Math.floor(r()*6)];
    const shape=Math.floor(r()*6),eyes=1.4+r()*.4, brow=35+r()*3;
    const faceWidth=21+r()*3,faceHeight=29+r()*3;
    let out=svgOpen('0 0 100 100',size,size,'Illustrated portrait of '+t.name);
    out+='<rect width="100" height="100" fill="'+pal[0]+'"/><path d="M0 78L100 30V100H0Z" fill="'+pal[1]+'" opacity=".18"/>';
    out+='<path d="M5 105Q10 76 36 73L64 73Q90 76 96 105Z" fill="'+top+'"/>';
    out+='<path d="M45 67V83Q50 89 55 83V67" fill="'+skin+'"/>';
    if(shape%2===0)out+='<ellipse cx="50" cy="46" rx="'+(faceWidth+3)+'" ry="'+(faceHeight+5)+'" fill="'+hair+'"/>';
    out+='<ellipse cx="50" cy="48" rx="'+faceWidth+'" ry="'+faceHeight+'" fill="'+skin+'" stroke="#251c1b" stroke-opacity=".26" stroke-width=".8"/>';
    // Varied authentic cartoon hair silhouettes.
    if(shape===0)out+='<path d="M27 44Q22 12 53 13Q75 11 74 43Q59 26 48 32Q36 34 27 44Z" fill="'+hair+'"/>';
    else if(shape===1)out+='<path d="M25 41Q20 18 46 17Q71 7 77 38Q58 34 43 27Q35 39 25 41Z" fill="'+hair+'"/>';
    else if(shape===2)out+='<path d="M28 39Q23 22 38 21Q43 11 55 20Q70 12 73 34L70 44Q62 30 51 31Q38 28 28 39Z" fill="'+hair+'"/><path d="M26 37Q20 48 27 60M74 36Q80 50 72 63" stroke="'+hair+'" stroke-width="6" fill="none"/>';
    else if(shape===3)out+='<path d="M27 39Q24 19 50 18Q75 19 73 36Q57 26 38 32Z" fill="'+hair+'"/><path d="M25 38Q20 57 29 67M75 39Q79 58 70 70" fill="none" stroke="'+hair+'" stroke-width="9"/>';
    else if(shape===4)out+='<path d="M26 38Q25 18 48 17Q64 15 73 30L73 36Q53 23 26 38Z" fill="'+hair+'"/>';
    else out+='<path d="M25 45Q20 19 45 17Q71 11 76 40L70 43Q50 27 39 35Z" fill="'+hair+'"/><path d="M74 36Q86 52 72 77" stroke="'+hair+'" stroke-width="8" fill="none"/>';
    out+='<path d="M34 '+brow+'Q41 '+(brow-3)+' 46 '+brow+'M54 '+brow+'Q61 '+(brow-3)+' 66 '+brow+'" stroke="'+hair+'" stroke-width="1.6" stroke-linecap="round" fill="none"/>';
    out+='<ellipse cx="40" cy="44" rx="'+eyes+'" ry="2.3" fill="#24212a"/><ellipse cx="60" cy="44" rx="'+eyes+'" ry="2.3" fill="#24212a"/>';
    out+='<path d="M49 47L47 55Q50 57 53 55" stroke="#7d574a" stroke-width="1.2" fill="none"/>';
    out+='<path d="M42 63Q50 '+(shape%2===0?68:65)+' 58 63" stroke="#703f3e" stroke-width="1.6" fill="none" stroke-linecap="round"/>';
    if(r()>.67)out+='<path d="M31 42H47V51H31ZM53 42H69V51H53ZM47 45H53" stroke="#302d3a" stroke-width="1.8" fill="none"/>';
    out+='<path d="M35 81L47 91L50 83L53 91L65 81" fill="none" stroke="'+pal[2]+'" stroke-width="1.5" opacity=".75"/>';
    out+='<rect x="1.5" y="1.5" width="97" height="97" rx="4" fill="none" stroke="'+(t.fame>=50?pal[1]:pal[2])+'" stroke-width="'+(t.fame>=50?3:1.6)+'"/>';
    return out+'</svg>';
  }
  // Lightweight original film still for a selected movie: generated once from its stable identity.
  function filmStillSVG(f){
    const r=rng(hash('film-still|'+f.id+'|'+f.title)),pal=GENRE_PAL[f.genre]||GENRE_PAL.drama;
    let s=svgOpen('0 0 480 220',0,0,'Illustrated still for '+f.title,' preserveAspectRatio="xMidYMid slice"');
    s+='<defs><linearGradient id="still'+hash(f.title)+'" x1="0" y1="0" x2="0" y2="1"><stop stop-color="'+pal[3]+'"/><stop offset="1" stop-color="'+pal[0]+'"/></linearGradient></defs>';
    s+='<rect width="480" height="220" fill="url(#still'+hash(f.title)+')"/>';
    s+='<circle cx="'+(160+r()*160).toFixed(1)+'" cy="60" r="40" fill="'+pal[1]+'" opacity=".7"/>';
    s+='<path d="M0 176L80 115L148 168L262 95L355 164L430 107L480 160V220H0Z" fill="'+pal[2]+'" opacity=".46"/>';
    s+='<path d="M0 200L115 149L225 185L375 136L480 185V220H0Z" fill="'+pal[3]+'" opacity=".8"/>';
    s+='<svg x="155" y="25" width="170" height="148" viewBox="0 0 200 220">'+motif(f.genre,pal,r)+'</svg>';
    s+='<rect width="480" height="220" fill="none" stroke="'+pal[1]+'" stroke-width="7" opacity=".68"/>';
    return s+'</svg>';
  }
  // Era backdrop: a wide banner (600 × 100, crops to fit) in the look of each era (same ids as CONTENT.ERAS).
  function backdropSVG(eraId) {
    const r = rng(hash('backdrop|' + eraId));
    const id = 'bd_' + eraId;
    let s = svgOpen('0 0 600 100', 0, 0, 'Backdrop art for the era', ' preserveAspectRatio="xMidYMid slice"');
    if (eraId === 'blockbuster') {
      s += '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0820"/><stop offset=".7" stop-color="#4b1a6e"/><stop offset="1" stop-color="#ff2f86"/></linearGradient></defs>' +
        '<rect width="600" height="100" fill="url(#' + id + ')"/><circle cx="300" cy="60" r="34" fill="#ffd400"/>';
      for (let i = 0; i < 5; i++) s += '<rect x="260" y="' + (50 + i * 8) + '" width="80" height="' + (1 + i) + '" fill="#4b1a6e"/>';
      for (let i = 0; i < 6; i++) s += '<line x1="0" y1="' + (72 + i * i * 1.1).toFixed(1) + '" x2="600" y2="' + (72 + i * i * 1.1).toFixed(1) + '" stroke="#ff58b5" stroke-width=".8" opacity=".7"/>';
      for (let i = -10; i <= 10; i++) s += '<line x1="300" y1="70" x2="' + (300 + i * 60) + '" y2="100" stroke="#ff58b5" stroke-width=".6" opacity=".6"/>';
    } else if (eraId === 'indie') {
      s += '<rect width="600" height="100" fill="#efece3"/>';
      const cols = ['#c9573a', '#2f4858', '#e2b04a', '#6b8e7f'];
      for (let i = 0; i < 5; i++) { const h = 30 + r() * 50, w = 60 + r() * 110; s += '<rect x="' + (i * 120 + r() * 30).toFixed(0) + '" y="' + (100 - h).toFixed(0) + '" width="' + w.toFixed(0) + '" height="' + h.toFixed(0) + '" fill="' + cols[i % 4] + '" opacity=".9"/>'; }
      s += '<rect x="0" y="96" width="600" height="4" fill="#141414"/>';
    } else if (eraId === 'digital') {
      s += '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0f4c5c"/><stop offset=".6" stop-color="#1c2b33"/><stop offset="1" stop-color="#e36414"/></linearGradient></defs><rect width="600" height="100" fill="url(#' + id + ')"/>';
      for (let i = 0; i < 16; i++) { const q = 6 + r() * 12; s += '<rect x="' + (r() * 590).toFixed(0) + '" y="' + (r() * 90).toFixed(0) + '" width="' + q.toFixed(0) + '" height="' + q.toFixed(0) + '" fill="#fff" opacity="' + (0.12 + r() * 0.22).toFixed(2) + '"/>'; }
      for (let y = 0; y < 100; y += 4) s += '<line x1="0" y1="' + y + '" x2="600" y2="' + y + '" stroke="#000" stroke-width="1" opacity=".14"/>';
    } else if (eraId === 'streaming') {
      s += '<rect width="600" height="100" fill="#101826"/>';
      const tints = ['#1f2c44', '#27385a', '#33476f'];
      for (let i = 0; i < 10; i++) {
        const x = 12 + i * 60, y = 22 + (i % 2) * 10;
        s += '<rect x="' + x + '" y="' + y + '" width="52" height="58" rx="6" fill="' + tints[i % 3] + '"/>';
        if (r() < 0.5) s += '<rect x="' + (x + 6) + '" y="' + (y + 48) + '" width="' + (14 + r() * 24).toFixed(0) + '" height="3" rx="1.5" fill="#46d4ff" opacity=".7"/>';
      }
    } else if (eraId === 'future') {
      s += '<defs><radialGradient id="' + id + 'a"><stop offset="0" stop-color="#7b5cff" stop-opacity=".9"/><stop offset="1" stop-color="#7b5cff" stop-opacity="0"/></radialGradient>' +
        '<radialGradient id="' + id + 'b"><stop offset="0" stop-color="#46d4ff" stop-opacity=".8"/><stop offset="1" stop-color="#46d4ff" stop-opacity="0"/></radialGradient></defs><rect width="600" height="100" fill="#05050f"/>' +
        '<circle cx="' + (120 + r() * 100).toFixed(0) + '" cy="40" r="90" fill="url(#' + id + 'a)"/><circle cx="' + (380 + r() * 120).toFixed(0) + '" cy="60" r="80" fill="url(#' + id + 'b)"/>';
      for (let i = 0; i < 3; i++) s += '<ellipse cx="300" cy="50" rx="' + (140 + i * 70) + '" ry="' + (18 + i * 10) + '" fill="none" stroke="#9f8cff" stroke-width=".8" opacity="' + (0.5 - i * 0.12).toFixed(2) + '" transform="rotate(' + (-8 + i * 6) + ' 300 50)"/>';
      for (let i = 0; i < 30; i++) s += '<circle cx="' + (r() * 600).toFixed(0) + '" cy="' + (r() * 100).toFixed(0) + '" r="' + (0.4 + r() * 0.9).toFixed(1) + '" fill="#fff" opacity="' + (0.4 + r() * 0.6).toFixed(2) + '"/>';
    } else {   // newhollywood (and anything unknown): warm 70s film strip
      s += '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b1d12"/><stop offset="1" stop-color="#6b4a2a"/></linearGradient></defs>' +
        '<rect width="600" height="100" fill="url(#' + id + ')"/><circle cx="' + (380 + r() * 100).toFixed(0) + '" cy="52" r="30" fill="#e0a53a" opacity=".85"/>' +
        '<path d="M0 100 L0 74 L90 58 L190 76 L300 62 L420 80 L520 64 L600 76 L600 100 Z" fill="#1a110a" opacity=".8"/>';
      for (let i = 0; i < 90; i++) s += '<rect x="' + (r() * 600).toFixed(0) + '" y="' + (r() * 100).toFixed(0) + '" width="1" height="1" fill="#f3e3c3" opacity=".3"/>';
      for (let x = 6; x < 600; x += 18) s += '<rect x="' + x + '" y="4" width="9" height="6" fill="#0d0a07"/><rect x="' + x + '" y="90" width="9" height="6" fill="#0d0a07"/>';
    }
    return s + '</svg>';
  }
  // Trophy: a film-reel statuette. won = gold, otherwise silver (nominated); picture adds a star on top.
  function trophySVG(o) {
    o = o || {};
    const gold = !!o.won, pic = !!o.picture;
    const A = gold ? '#d4a72c' : '#aab0b8', B = gold ? '#f6dc7a' : '#e4e7eb', C = gold ? '#8a6a12' : '#6d737b';
    let s = svgOpen('0 0 60 90', 0, 0, (gold ? 'Trophy' : 'Nomination') + (pic ? ' for Best Picture' : ''));
    if (pic) {
      let pts = '';
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 3.6 : 8; pts += (30 + Math.cos(a) * rr).toFixed(1) + ',' + (11 + Math.sin(a) * rr).toFixed(1) + ' '; }
      s += '<polygon points="' + pts.trim() + '" fill="' + B + '" stroke="' + C + '" stroke-width="1"/>';
    }
    s += '<circle cx="30" cy="38" r="17" fill="' + A + '" stroke="' + C + '" stroke-width="1.5"/>';
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 5; s += '<circle cx="' + (30 + Math.cos(a) * 9.5).toFixed(1) + '" cy="' + (38 + Math.sin(a) * 9.5).toFixed(1) + '" r="3.4" fill="' + B + '"/>'; }
    s += '<circle cx="30" cy="38" r="3" fill="' + C + '"/><rect x="27" y="54" width="6" height="18" fill="' + A + '" stroke="' + C + '" stroke-width="1"/>' +
      '<polygon points="16,84 20,72 40,72 44,84" fill="' + B + '" stroke="' + C + '" stroke-width="1.5"/>';
    return s + '</svg>';
  }
  // Festival badge: laurel wreath. kind 'prize' (gold) or 'selection' (silver); label = festival name (shortened).
  function badgeSVG(kind, label) {
    const prize = kind === 'prize', A = prize ? '#d4a72c' : '#c3c8cf';
    let s = svgOpen('0 0 100 100', 0, 0, (prize ? 'Festival prize' : 'Official selection') + (label ? ': ' + label : '')) + '<rect width="100" height="100" fill="#111"/>';
    let left = '';
    for (let i = 0; i < 7; i++) {
      const deg = 120 + i * 20, a = deg * Math.PI / 180, x = (50 + Math.cos(a) * 34).toFixed(1), y = (50 + Math.sin(a) * 34).toFixed(1);
      left += '<ellipse cx="' + x + '" cy="' + y + '" rx="4.2" ry="9" fill="' + A + '" transform="rotate(' + deg + ' ' + x + ' ' + y + ')"/>';
    }
    s += left + '<g transform="translate(100 0) scale(-1 1)">' + left + '</g>' +
      '<text x="50" y="52" text-anchor="middle" font-family="Archivo, Impact, sans-serif" font-weight="800" font-size="12" fill="' + A + '">' + (prize ? 'PRIZE' : 'SELECT') + '</text>';
    if (label) s += '<text x="50" y="64" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="6" fill="#fff" opacity=".8">' + xml(String(label).slice(0, 16)) + '</text>';
    return s + '</svg>';
  }

// ===== SECTION: SFX =====
  // 8.4 – sound effects, generated live (no audio files). Own AudioContext and its own toggle (settings.sfx), so they work with music off.
  // Engine events are queued for one tick and played together, so Advance (many weeks in a row) gives one sound, not a burst.
  const sfx = { ctx: null, out: null, noise: null };
  function sfxCtx() {
    if (sfx.ctx) return sfx.ctx;
    if (!supported()) return null;
    const AC = window.AudioContext || window.webkitAudioContext;
    const ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 5;
    sfx.out = ctx.createGain();
    // Share the visible volume slider with music and effects (SFX remain opt-in).
    sfx.out.gain.value = 0.55 * settings.volume;
    sfx.out.connect(comp); comp.connect(ctx.destination);
    sfx.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = sfx.noise.getChannelData(0), r = rng(31);
    for (let i = 0; i < d.length; i++) d[i] = r() * 2 - 1;
    sfx.ctx = ctx;
    return ctx;
  }
  function sTone(t, freq, dur, type, gain, endFreq) {
    const ctx = sfx.ctx, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(sfx.out); o.start(t); o.stop(t + dur + 0.05);
  }
  function sNoise(t, dur, gain, type, freq, q) {
    const ctx = sfx.ctx, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = sfx.noise; f.type = type; f.frequency.value = freq; if (q) f.Q.value = q;
    g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(sfx.out); s.start(t, Math.random() * 0.45); s.stop(t + dur + 0.02);
  }
  const SFX = {
    tick: t => sNoise(t, 0.03, 0.25, 'bandpass', 3200, 4),
    register: t => { sNoise(t, 0.08, 0.15, 'highpass', 5000); sTone(t + 0.06, 1760, 0.5, 'triangle', 0.16); sTone(t + 0.06, 2637, 0.5, 'sine', 0.08); sTone(t + 0.16, 2093, 0.6, 'triangle', 0.14); },
    flop: t => { sTone(t, 240, 0.45, 'sawtooth', 0.09, 110); sTone(t + 0.28, 180, 0.5, 'sawtooth', 0.08, 80); },
    clap: t => { sNoise(t, 0.05, 0.5, 'bandpass', 1900, 1.2); sNoise(t + 0.11, 0.09, 0.6, 'bandpass', 1300, 0.9); sTone(t + 0.11, 160, 0.12, 'sine', 0.2, 70); },
    applause: t => { for (let i = 0; i < 110; i++) { const k = Math.pow(Math.random(), 1.2), at = t + k * 1.9; sNoise(at, 0.03 + Math.random() * 0.04, 0.12 * (0.25 + Math.sin(k * Math.PI)), 'bandpass', 1200 + Math.random() * 3000, 0.8); } },
    alert: t => { sTone(t, 880, 0.22, 'sine', 0.16); sTone(t + 0.14, 1318, 0.34, 'sine', 0.15); },
    alarm: t => { for (let i = 0; i < 3; i++) sTone(t + i * 0.18, 392, 0.12, 'square', 0.07, 330); },
    // Original, brief interface cues synthesized locally, not streamed audio assets.
    navigate: t => { sTone(t, 520, 0.075, 'triangle', 0.09, 660); },
    reveal: t => { sTone(t, 392, 0.24, 'sine', 0.11); sTone(t + 0.12, 523, 0.32, 'triangle', 0.12); sTone(t + 0.26, 784, 0.52, 'sine', 0.14); },
    flourish: t => { [523,659,784,1046].forEach((n,i) => sTone(t+i*0.08,n,0.45,'triangle',0.09)); }
  };
  let sfxQueue = [], sfxTimer = null;
  function queueSfx(name) {
    if (!settings.sfx || !name) return;
    if (!sfxQueue.includes(name)) sfxQueue.push(name);
    if (!sfxTimer) sfxTimer = setTimeout(flushSfx, 0);
  }
  function flushSfx() {
    sfxTimer = null;
    let q = sfxQueue;
    sfxQueue = [];
    if (!settings.sfx || (typeof document !== 'undefined' && document.hidden)) return;
    if (q.length > 1) q = q.filter(n => n !== 'tick');
    if (q.includes('applause')) q = q.filter(n => n !== 'register');
    const ctx = sfxCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) { /* needs a user gesture first */ } }
    q.slice(0, 3).forEach((n, i) => { if (SFX[n]) SFX[n](ctx.currentTime + 0.02 + i * 0.4); });
  }
  function setSfx(on) {
    settings.sfx = !!on;
    saveSettings();
    if (settings.sfx) {   // a short chime confirms the toggle (this click is the user gesture browsers require)
      const ctx = sfxCtx();
      if (ctx) { if (ctx.state === 'suspended') ctx.resume(); SFX.alert(ctx.currentTime + 0.02); }
    }
    return settings.sfx;
  }
  function toggleSfx() { return setSfx(!settings.sfx); }
  let lastUiSound = 0;
  function uiSound(kind) {
    if (!settings.sfx || !SFX[kind] || (typeof document !== 'undefined' && document.hidden)) return;
    const now = Date.now();
    if (kind === 'navigate' && now - lastUiSound < 160) return;
    lastUiSound = now;
    queueSfx(kind);
  }
  // Engine event → sound name (or null).
  function sfxFor(type, data) {
    if (type === 'turn') return 'tick';
    if (type === 'stage') return data && data.stage === 'shoot' ? 'clap' : null;
    if (type === 'finished') return data && data.result === 'Flop' ? 'flop' : 'register';
    if (type === 'festival') return data && data.result === 'Won' ? 'applause' : (data && data.result === 'Official selection' ? 'register' : null);
    if (type === 'awards') return wonAtCeremony(data) ? 'applause' : null;
    if (type === 'decision_pending') return data && data.disaster ? 'alarm' : 'alert';
    if (type === 'warning' || type === 'gameover') return 'alarm';
    return null;
  }

// ===== SECTION: FX =====
  // 8.5 – visual effects, all skipped when settings.reduceMotion is on (CSS also switches animations off through body.reduce-motion).
  // Box office count-up (elements with data-key + data-count), award confetti (canvas), disaster shake (#app and #modal).
  const fx = { canvas: null, parts: [], raf: 0, counts: {} };
  function motionOK() { return !settings.reduceMotion; }
  function applyMotionClass() { if (typeof document !== 'undefined' && document.body) document.body.classList.toggle('reduce-motion', !!settings.reduceMotion); }
  function setReduceMotion(on) {
    settings.reduceMotion = !!on;
    saveSettings();
    applyMotionClass();
    if (!motionOK()) stopConfetti();
    return settings.reduceMotion;
  }
  function toggleReduceMotion() { return setReduceMotion(!settings.reduceMotion); }
  function confetti(opts) {
    if (!motionOK() || typeof document === 'undefined' || !document.body) return;
    let c = fx.canvas;
    if (!c) { c = fx.canvas = document.createElement('canvas'); c.id = 'fx-confetti'; c.setAttribute('aria-hidden', 'true'); document.body.appendChild(c); }
    c.width = window.innerWidth; c.height = window.innerHeight; c.hidden = false;
    const colors = ['#ffd400', '#1749d6', '#ffffff', '#c40000', '#2ecc71'], n = (opts && opts.count) || 140;
    for (let i = 0; i < n; i++) {
      fx.parts.push({ x: c.width * (0.3 + Math.random() * 0.4), y: c.height * 0.3, vx: (Math.random() - 0.5) * 10, vy: -(3 + Math.random() * 9), g: 0.2 + Math.random() * 0.1,
        w: 5 + Math.random() * 6, h: 3 + Math.random() * 4, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, color: colors[i % colors.length], life: 130 + Math.random() * 70 });
    }
    if (!fx.raf) fx.raf = requestAnimationFrame(stepConfetti);
  }
  function stepConfetti() {
    const c = fx.canvas, g = c.getContext('2d');
    g.clearRect(0, 0, c.width, c.height);
    fx.parts = fx.parts.filter(p => p.life > 0 && p.y < c.height + 20);
    fx.parts.forEach(p => {
      p.vy += p.g; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life--;
      g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.globalAlpha = Math.min(1, p.life / 40); g.fillStyle = p.color; g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); g.restore();
    });
    fx.raf = fx.parts.length ? requestAnimationFrame(stepConfetti) : 0;
    if (!fx.raf) c.hidden = true;
  }
  function stopConfetti() {
    fx.parts = [];
    if (fx.raf) { cancelAnimationFrame(fx.raf); fx.raf = 0; }
    if (fx.canvas) { fx.canvas.getContext('2d').clearRect(0, 0, fx.canvas.width, fx.canvas.height); fx.canvas.hidden = true; }
  }
  function shake() {
    if (!motionOK() || typeof document === 'undefined') return;
    ['app', 'modal'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
      setTimeout(() => el.classList.remove('shake'), 650);
    });
  }
  function fmtCash(n) { return (n < 0 ? '-' : '') + '$' + Math.abs(Math.round(n)).toLocaleString('en-US'); }   // same format as ui.js money()
  function resetCounts() { fx.counts = {}; }
  // Count up numbers that changed since they were last shown (first sight counts up from 0). Each element is handled once.
  function countUp(root) {
    if (typeof document === 'undefined') return;
    (root || document).querySelectorAll('[data-count]').forEach(el => {
      if (el.dataset.cu) return;
      el.dataset.cu = '1';
      const key = el.dataset.key, to = Number(el.dataset.count), from = fx.counts[key] == null ? 0 : fx.counts[key];
      fx.counts[key] = to;
      if (!motionOK() || from === to) return;
      const t0 = performance.now(), dur = 700;
      el.textContent = fmtCash(from);
      const step = now => {
        if (!el.isConnected) return;
        const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        el.textContent = fmtCash(from + (to - from) * e);
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

// ===== SECTION: EVENT_HOOKS =====
  // Engine events: newgame, load, turn, advance, project, stage, decision_pending, decision, release, festival, finished, finance,
  // warning, era, gameover, contract, founder_role, quarter, market, tv, tier, staff, rival, poach, awards, score.
  // 8.1: mood changes. 8.4: sound effects (sfxFor). 8.5: confetti on a festival win or ceremony win, shake on a crisis.
  // UI-only, nonblocking cinematic cue; no effect on simulation outcomes.
  let visualCueLast = 0;
  function visualCue(kind,title,subtitle) {
    if (!motionOK() || typeof document === 'undefined' || !document.body || document.hidden) return;
    const now = Date.now(); if (now - visualCueLast < 450) return; visualCueLast = now;
    document.querySelectorAll('.fc-cinematic-cue').forEach(x=>x.remove());
    const box=document.createElement('div');
    box.className='fc-cinematic-cue cue-'+kind;box.setAttribute('role','status');
    const h=document.createElement('strong');h.textContent=title;
    const p=document.createElement('span');p.textContent=subtitle||'';
    box.append(h,p);document.body.appendChild(box);
    setTimeout(()=>box.remove(),1100);
  }
  function wonAtCeremony(rec) { return !!(rec && rec.cats && rec.cats.some(c => c.nominees.some(n => n.winner && n.projectId != null))); }
  function onEngineEvent(type, data) {
    if (type === 'finished' && data && data.result === 'Hit') triumph(8);
    else if (type === 'festival' && data && data.result === 'Won') triumph(6);
    else if (type === 'awards' && wonAtCeremony(data)) triumph(12);
    else if (type === 'tier' || type === 'score') triumph(10);
    else if (type === 'newgame' || type === 'load') { triumphBars = 0; resetCounts(); }
    if (type === 'stage' && data && data.stage === 'shoot') visualCue('shoot','CAMERAS ROLLING',data.title || 'Filming begins');
    if (type === 'release' && data && data.format !== 'pilot') visualCue('premiere','NOW SHOWING',data.title+' · '+(data.critic||0)+'/100 critics');
    if (type === 'finished' && data && data.result === 'Hit') visualCue('premiere','BOX OFFICE HIT',data.title || 'A winning release');
    if (type === 'festival' && data && /won|prize/i.test(data.result||'')) visualCue('laurel','FESTIVAL HONORS',data.festival||'Jury recognition');
    if (type === 'awards' && wonAtCeremony(data)) visualCue('award','AWARDS NIGHT','A film from your studio has won');
    if (type === 'era' && data) visualCue('era','NEW ERA',data.name||'The industry is changing');
    if (audio.timer) updateMood();
    queueSfx(sfxFor(type, data));
    if (type === 'awards' && wonAtCeremony(data)) confetti();
    else if (type === 'festival' && data && data.result === 'Won') confetti({ count: 90 });
    else if (type === 'decision_pending' && data && data.disaster) shake();
  }

// ===== SECTION: INIT =====
  function init() {
    loadSettings();
    if (typeof Engine !== 'undefined') Engine.on(onEngineEvent);
    if (typeof document === 'undefined') return;
    applyMotionClass();
    // Browsers only allow audio after a user gesture: start on the first click or key press if music or effects are on.
    const kick = () => {
      if (settings.music && !audio.timer) startMusic();
      if (settings.sfx) { const c = sfxCtx(); if (c && c.state === 'suspended') c.resume(); }
    };
    document.addEventListener('pointerdown', kick);
    document.addEventListener('keydown', kick);
    document.addEventListener('visibilitychange', () => {
      if (!audio.ctx) return;
      if (document.hidden) audio.ctx.suspend(); else if (settings.music) audio.ctx.resume();
    });
  }
  init();

  return { settings: settings, setMusic: setMusic, toggleMusic: toggleMusic, setVolume: setVolume, musicState: musicState, posterSVG: posterSVG,
    portraitSVG: portraitSVG, filmStillSVG: filmStillSVG, backdropSVG: backdropSVG, trophySVG: trophySVG, badgeSVG: badgeSVG,
    setSfx: setSfx, toggleSfx: toggleSfx, uiSound: uiSound, setReduceMotion: setReduceMotion, toggleReduceMotion: toggleReduceMotion,
    countUp: countUp, confetti: confetti, shake: shake, motionOK: motionOK };
})();
