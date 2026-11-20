// Final Cut v9: isolated rules, compatibility, recruitment, festival and economy smoke tests.
// Run: node tests/regression.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const root = path.resolve(__dirname, '..');
const storage = new Map();
const localStorage = {
  setItem(k, v) { storage.set(k, String(v)); },
  getItem(k) { return storage.has(k) ? storage.get(k) : null; },
  removeItem(k) { storage.delete(k); }
};
const ctx = { localStorage, console, Math, JSON, Date };
vm.createContext(ctx);
for (const file of ['content.js', 'engine.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), ctx, { filename: file });
}
const { Engine: E, CONTENT: C } = ctx;
const results = [];
function check(label, fn) { fn(); results.push(label); console.log('PASS ' + label); }
check('25 unique topics and expected additions', () => {
  assert.strictEqual(C.TOPICS.length, 25);
  assert.strictEqual(new Set(C.TOPICS.map(t => t.id)).size, 25);
  for (const id of ['organizedcrime', 'conspiracy', 'underdog', 'medical', 'espionage', 'comingofage', 'supernatural', 'timetravel', 'celebrity'])
    assert(C.TOPICS.some(t => t.id === id), 'Missing topic ' + id);
  assert(C.TOPICS.every(t => Array.isArray(t.good) && Array.isArray(t.bad)));
});
check('Six festival tiers with open qualification', () => {
  assert.deepStrictEqual(Array.from(C.AWARDS.circuit.slice(0,6), f => f.level), ['Local','Regional','National','Continental','International','World']);
  assert.strictEqual(C.AWARDS.circuit.length, 16);
  assert(C.AWARDS.circuit.every(f => Number.isFinite(f.entryScore) && !('studioTier' in f)));
});
check('Game begins and market lists all topics', () => {
  E.newGame({ studioName: 'Regression Pictures', founderName: 'Tester' });
  assert.strictEqual(E.state.version, 13);
  assert.strictEqual(E.state.market.topics && Object.keys(E.state.market.topics).length, 25);
  assert.strictEqual(E.marketInfo().topics.length, 25);
});
check('Topic demand changes market outlook but is bounded', () => {
  const s = E.state, t = C.TOPICS[0].id, base = { genre: 'drama', topic: t };
  s.market.topics[t] = 0.7;
  const low = E.marketOutlook(base);
  s.market.topics[t] = 1.3;
  const high = E.marketOutlook(base);
  assert(low.topic >= .85 && high.topic <= 1.15, 'Topic demand leaves desired bounds');
  assert(high.mult > low.mult, 'Topic has no market effect');
});
check('Reputation increases elite artist offer interest', () => {
  const s = E.state, t = s.talent[0];
  t.skill = 83; t.fame = 80;
  s.studio.fame = 0; s.studio.criticsRep = 0; s.studio.prestige = 0;
  const a = E.recruitmentInterest(t, 'feature', t.affinity[0], C.TOPICS[0].id, 50000);
  s.studio.fame = 90; s.studio.criticsRep = 85; s.studio.prestige = 70;
  const b = E.recruitmentInterest(t, 'feature', t.affinity[0], C.TOPICS[0].id, 50000);
  assert(a.elite && b.elite);
  assert(b.chance > a.chance, `Elite hire did not improve: ${a.chance}→${b.chance}`);
});
check('Reputation increases departmental recruitment quality', () => {
  const s = E.state;
  s.studio.fame = 0; s.studio.criticsRep = 0; s.studio.prestige = 0;
  const low = E.staffInfo()[0].recruitSkill;
  s.studio.fame = 85; s.studio.criticsRep = 85; s.studio.prestige = 75;
  const high = E.staffInfo()[0].recruitSkill;
  assert(high > low, 'Reputation has no influence on employee skill');
});
check('v8 saves migrate to v9 preserving studio progress', () => {
  const s = E.state;
  s.cash = 123456; s.studio.fame = 52; s.studio.prestige = 12;
  E.save();
  const saved = JSON.parse(storage.get('backlot_save'));
  saved.version = 8;
  delete saved.market.topics;
  delete saved.recruitment;
  delete saved.events.recentProduction;
  localStorage.setItem('backlot_save', JSON.stringify(saved));
  const loaded = E.load();
  assert(loaded.ok, loaded.reason);
  assert.strictEqual(E.state.version, 13);
  assert.strictEqual(E.state.cash, 123456);
  assert.strictEqual(E.state.studio.fame, 52);
  assert.strictEqual(E.state.studio.prestige, 12);
  assert.strictEqual(Object.keys(E.state.market.topics).length, 25);
  assert(E.state.recruitment.declined);
  assert(Array.isArray(E.state.events.recentProduction));
});
check('Short-film completion reaches festival and does not crash', () => {
  E.newGame({studioName:'Festival Test Studio',founderName:'Tester'});
  const t = C.TOPICS.find(t => t.good.includes('drama')) || C.TOPICS[0];
  const q = E.startProject({format:'short',tier:0,title:'Festival Smoke',genre:'drama',topic:t.id,cast:{director:'founder',writer:'founder'}});
  assert(q.ok, q.reason);
  let weeks = 0;
  while (weeks++ < 45 && E.state.projects[0].stage !== 'done' && !E.state.gameOver) {
    while (E.state.pending) E.choose(0);
    E.nextTurn();
  }
  assert.strictEqual(E.state.projects[0].stage, 'done');
  const p = E.state.projects[0];
  assert(C.AWARDS.circuit.some(f => f.id === p.festivalTierId));
  while (weeks++ < 125 && !(p.festResults && p.festResults.length) && !E.state.gameOver) {
    while (E.state.pending) E.choose(0);
    E.nextTurn();
  }
  assert(p.festResults && p.festResults.length && p.festResults[0].tier);
  assert(p.festResults[0].year >= E.dateOf(p.releaseWeek).year);
});
check('TV pilot production and pickup flow stays playable', () => {
  E.newGame({studioName:'Pilot Test Studio',founderName:'Tester'});
  const s = E.state;
  s.studio.tier = 1; s.studio.fame = 30; s.studio.releases = 3; s.cash = 260000;
  const fmt = E.formats().find(f => f.id === 'pilot');
  assert(fmt && fmt.unlocked, 'Pilot is not available to Indie studio');
  const topic = C.TOPICS.find(t => t.good.includes('drama')) || C.TOPICS[0];
  const q = E.startProject({format:'pilot',tier:0,title:'Pilot Smoke',genre:'drama',topic:topic.id,cast:{director:'founder',writer:'founder'}});
  assert(q.ok, q.reason);
  let weeks = 0;
  while (weeks++ < 60 && E.state.projects[0].stage !== 'done' && !E.state.gameOver) {
    while (s.pending) E.choose(0);
    E.nextTurn();
  }
  assert.strictEqual(s.projects[0].stage, 'done');
  assert(Array.isArray(s.series), 'TV series state must exist');
});
check('Exclusive contracts remain available after the recruitment update', () => {
  E.newGame({studioName:'Contract Test Studio',founderName:'Tester'});
  const s = E.state;
  s.studio.tier = 1; s.studio.fame = 25; s.cash = 180000;
  const t = s.talent.find(t => t.skill < E.TUNING.talent.eliteSkill && t.fame < E.TUNING.talent.eliteFame);
  assert(t);
  const q = E.contractQuote(t.id, 1, false);
  assert(q.ok, q.reason);
  const r = E.signExclusive(t.id, 1);
  assert(r.ok, r.reason);
  assert.strictEqual(E.getTalent(t.id).contract.type, 'exclusive');
});
console.log('All ' + results.length + ' regression checks passed.');
