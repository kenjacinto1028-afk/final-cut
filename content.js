// ===== SECTION: HEADER =====
// Final Cut — content.js
// Data only: genres, topics, decisions, names, eras, festivals, labels, talent traits.
// No game rules here. Engine reads this; UI may read labels.
// Load order: content.js → engine.js → media.js → ui.js
var CONTENT = {};

// ===== SECTION: STAGE_LABELS =====
CONTENT.STAGE_LABELS = {
  development: 'Development',
  preproduction: 'Pre-production',
  shoot: 'Shoot',
  post: 'Post-production',
  release: 'In release',
  done: 'Finished'
};

// ===== SECTION: ERAS =====
// Display/flavor only in phase 1. Era effects arrive in phase 6.
CONTENT.ERAS = [
  { id: 'newhollywood', name: 'New Hollywood', start: 1970, blurb: 'Auteurs rule and small films can break out.' },
  { id: 'blockbuster', name: 'Blockbuster', start: 1980, blurb: 'Big summer spectacles and home video arrive.' },
  { id: 'indie', name: 'Indie Boom', start: 1990, blurb: 'Festivals make stars out of small films.' },
  { id: 'digital', name: 'Digital', start: 2000, blurb: 'Digital cameras and effects change production.' },
  { id: 'streaming', name: 'Streaming', start: 2010, blurb: 'Streaming services reshape revenue.' },
  { id: 'future', name: 'Next Wave', start: 2030, blurb: 'New formats and audiences emerge.' }
];

// ===== SECTION: GENRES =====
// audience: box office multiplier. critics: points added to critic score.
CONTENT.GENRES = [
  { id: 'drama', name: 'Drama', audience: 0.9, critics: 4 },
  { id: 'comedy', name: 'Comedy', audience: 1.1, critics: -2 },
  { id: 'horror', name: 'Horror', audience: 1.05, critics: -4 },
  { id: 'thriller', name: 'Thriller', audience: 1.0, critics: 0 },
  { id: 'scifi', name: 'Sci-fi', audience: 1.0, critics: 0 },
  { id: 'western', name: 'Western', audience: 0.9, critics: 1 },
  { id: 'romance', name: 'Romance', audience: 0.95, critics: -1 },
  { id: 'action', name: 'Action', audience: 1.15, critics: -4 },
  { id: 'documentary', name: 'Documentary', audience: 0.6, critics: 5 }
];

// ===== SECTION: TOPICS =====
// good: genres that fit well. bad: genres that clash.
CONTENT.TOPICS = [
  { id: 'smalltown', name: 'Small town', good: ['drama', 'comedy', 'horror'], bad: ['scifi'] , era: { newhollywood: 1.06, indie: 1.07 } },
  { id: 'heist', name: 'Heist', good: ['thriller', 'action', 'comedy'], bad: ['documentary', 'romance'] , era: { blockbuster: 1.10, streaming: 1.05 } },
  { id: 'haunted', name: 'Haunted house', good: ['horror', 'comedy'], bad: ['western', 'documentary'] , era: { blockbuster: 1.05, streaming: 1.05 } },
  { id: 'roadtrip', name: 'Road trip', good: ['comedy', 'drama', 'romance'], bad: ['horror'] , era: { newhollywood: 1.05, blockbuster: 1.04 } },
  { id: 'familysecret', name: 'Family secret', good: ['drama', 'thriller'], bad: ['action'] , era: { newhollywood: 1.04, streaming: 1.05 } },
  { id: 'spacecolony', name: 'Space colony', good: ['scifi', 'thriller'], bad: ['western', 'romance'] , era: { newhollywood: 0.92, digital: 1.08, streaming: 1.10 } },
  { id: 'boxing', name: 'Boxing', good: ['drama', 'action', 'documentary'], bad: ['horror'] , era: { newhollywood: 1.06, indie: 1.05 } },
  { id: 'rockband', name: 'Rock band', good: ['comedy', 'drama', 'documentary'], bad: ['western'] , era: { newhollywood: 1.12, blockbuster: 1.08 } },
  { id: 'corruptcop', name: 'Corrupt cop', good: ['thriller', 'action', 'drama'], bad: ['romance', 'comedy'] , era: { newhollywood: 1.08, indie: 1.06 } },
  { id: 'invasion', name: 'Alien invasion', good: ['scifi', 'action', 'horror'], bad: ['documentary', 'romance'] , era: { newhollywood: 0.94, blockbuster: 1.12, digital: 1.08 } },
  { id: 'firstlove', name: 'First love', good: ['romance', 'drama', 'comedy'], bad: ['horror', 'action'] , era: { newhollywood: 1.03, streaming: 1.05 } },
  { id: 'revenge', name: 'Revenge', good: ['western', 'thriller', 'action'], bad: ['comedy', 'documentary'] , era: { blockbuster: 1.09, digital: 1.05 } },
  { id: 'cult', name: 'Cult', good: ['horror', 'thriller', 'documentary'], bad: ['romance'] , era: { indie: 1.09, digital: 1.04 } },
  { id: 'frontier', name: 'Frontier', good: ['western', 'drama'], bad: ['scifi', 'comedy'] , era: { newhollywood: 1.12, streaming: 0.90 } },
  { id: 'robots', name: 'Robots', good: ['scifi', 'comedy'], bad: ['western', 'documentary'] , era: { newhollywood: 0.92, digital: 1.09, streaming: 1.12 } },
  { id: 'nightshift', name: 'Night shift', good: ['comedy', 'horror', 'documentary'], bad: [], era: { indie: 1.07, streaming: 1.05 } },
  { id: 'organizedcrime', name: 'Organized crime', good: ['thriller', 'drama', 'action'], bad: ['romance', 'comedy'], era: { newhollywood: 1.10, indie: 1.05 } },
  { id: 'conspiracy', name: 'Political conspiracy', good: ['thriller', 'drama', 'documentary'], bad: ['romance', 'comedy'], era: { newhollywood: 1.10, digital: 1.07 } },
  { id: 'underdog', name: 'Sports underdog', good: ['drama', 'comedy', 'documentary'], bad: ['horror', 'scifi'], era: { blockbuster: 1.04, streaming: 1.08 } },
  { id: 'medical', name: 'Medical crisis', good: ['drama', 'thriller', 'documentary'], bad: ['western', 'comedy'], era: { indie: 1.04, streaming: 1.07 } },
  { id: 'espionage', name: 'Espionage', good: ['action', 'thriller', 'drama'], bad: ['romance', 'western'], era: { blockbuster: 1.08, digital: 1.07 } },
  { id: 'comingofage', name: 'Coming of age', good: ['drama', 'comedy', 'romance'], bad: ['action', 'horror'], era: { indie: 1.12, streaming: 1.07 } },
  { id: 'supernatural', name: 'Supernatural mystery', good: ['horror', 'thriller', 'scifi'], bad: ['documentary', 'western'], era: { indie: 1.08, streaming: 1.10 } },
  { id: 'timetravel', name: 'Time travel', good: ['scifi', 'comedy', 'thriller'], bad: ['documentary', 'western'], era: { newhollywood: 0.90, digital: 1.10, streaming: 1.12 } },
  { id: 'celebrity', name: 'Celebrity scandal', good: ['drama', 'comedy', 'documentary'], bad: ['western', 'scifi'], era: { digital: 1.12, streaming: 1.10 } }
];

// ===== SECTION: FILM_DNA_V14 =====
// v14a: authored, controlled story vocabulary. No prompt-generated premises.
// v14b uses these exact IDs for acquired pitches and explicit creative choices.
CONTENT.FILM_DNA = {
  strengths: {
    dialogue:'Sharp dialogue',visuals:'Visual storytelling',atmosphere:'Unsettling atmosphere',
    twist:'Strong twist',heart:'Emotional resonance',research:'Authentic research',
    action:'Physical spectacle',chemistry:'Character chemistry',world:'Immersive world',
    humor:'Memorable humor',mystery:'Layered mystery',performance:'Breakout performances'
  },
  risks: {
    narrow:'Narrow audience appeal',ambition:'Demanding production',
    ending:'Divisive ending',cost:'Costly practical scenes',
    obscure:'Difficult to market',casting:'Unproven creative team',
    sensitive:'Sensitive subject matter',scope:'Story scope may exceed budget'
  },
  intents:{
    prestige:'Prestige-first',mainstream:'Mainstream entertainment',
    genre:'Bold genre filmmaking',star:'Star vehicle',festival:'Festival-first'
  },
  lanes:{
    mainstream:'Broad audience',genre:'Genre fans',niche:'Arthouse & niche audiences'
  },
  genreStrengths:{
    drama:['dialogue','heart'],comedy:['humor','chemistry'],horror:['atmosphere','twist'],
    thriller:['mystery','twist'],scifi:['world','visuals'],western:['atmosphere','action'],
    romance:['heart','chemistry'],action:['action','visuals'],documentary:['research','heart']
  },
  genreRisks:{
    drama:'narrow',comedy:'obscure',horror:'narrow',thriller:'ending',
    scifi:'scope',western:'obscure',romance:'ending',action:'cost',documentary:'sensitive'
  },
  topicHooks:{
    smalltown:'A close-knit community confronts a change that threatens the lives its people know.',
    heist:'An unlikely team attempts a daring theft as private loyalties begin to fray.',
    haunted:'Inside an isolated house, an ordinary arrival becomes an unsettling investigation.',
    roadtrip:'A journey across unfamiliar places forces companions to reconsider their destination.',
    familysecret:'An old family secret brings a difficult choice to the surface.',
    spacecolony:'Life on a distant outpost grows uncertain when the community faces a new threat.',
    boxing:'A fighter must choose what is worth sacrificing beyond the ring.',
    rockband:'A band risks everything to stay together as success changes their relationships.',
    corruptcop:'A compromised officer faces consequences when a hidden arrangement is exposed.',
    invasion:'An unexpected arrival threatens the familiar order of a community.',
    firstlove:'Two people discover what first love asks them to change.',
    revenge:'A person seeking retribution faces the cost of settling an old injustice.',
    cult:'A secretive group draws outsiders into a conflict of belief and belonging.',
    frontier:'A remote settlement tests the ideals of those trying to build a future.',
    robots:'A new machine challenges assumptions about its creators and their world.',
    nightshift:'A small overnight crew encounters a problem no one else can see.',
    organizedcrime:'A criminal organization is tested by divided loyalties and competing ambitions.',
    conspiracy:'An investigation exposes a concealed struggle for public power.',
    underdog:'An overlooked competitor gets a chance to prove everyone wrong.',
    medical:'A medical emergency forces a difficult choice between duty and personal conviction.',
    espionage:'A covert mission blurs the line between service and betrayal.',
    comingofage:'A young person faces a choice that will shape the life ahead.',
    supernatural:'Strange events suggest that a familiar place hides an extraordinary truth.',
    timetravel:'An attempt to alter the past places the present in jeopardy.',
    celebrity:'Public attention turns a private incident into a career-defining scandal.'
  }
};

// ===== SECTION: TITLES =====
CONTENT.TITLES = {
  patterns: ['The {adj} {noun}', '{noun} of the {noun2}', '{adj} {noun}', 'Last {noun} in {place}', 'Return to {place}', 'The {noun} Affair', '{place} After Dark'],
  adjectives: ['Silent', 'Broken', 'Golden', 'Midnight', 'Crimson', 'Lonely', 'Electric', 'Wild', 'Hollow', 'Neon', 'Distant', 'Restless', 'Burning', 'Quiet'],
  nouns: ['Highway', 'Harbor', 'Drifter', 'Signal', 'Orchard', 'Echo', 'Stranger', 'Frontier', 'Mirror', 'Season', 'Witness', 'Tide', 'Engine', 'Carnival'],
  places: ['Paradise', 'Redwater', 'Coldbrook', 'the Valley', 'Mercy Falls', 'Dry Creek', 'Port Ellis']
};

// ===== SECTION: NAMES =====
// Fictional names for the founder and generated talent. Any resemblance to real people is unintended.
CONTENT.FIRST_NAMES = ['Alex', 'Jordan', 'Sam', 'Morgan', 'Casey', 'Riley', 'Dana', 'Frankie', 'Robin', 'Jesse', 'Lee', 'Toni',
  'Avery', 'Blair', 'Carmen', 'Dmitri', 'Elena', 'Felix', 'Greta', 'Hector', 'Ingrid', 'Jonah', 'Kiko', 'Lionel',
  'Mae', 'Nico', 'Odette', 'Pablo', 'Rosa', 'Silas', 'Tamsin', 'Ulla', 'Vince', 'Wren', 'Yusuf', 'Zara',
  'Abel', 'Bettina', 'Cyrus', 'Delphine', 'Emmett', 'Flora', 'Gideon', 'Hazel', 'Ivo', 'June', 'Kasimir', 'Lottie'];
CONTENT.LAST_NAMES = ['Calder', 'Marsh', 'Okafor', 'Reyes', 'Lindqvist', 'Novak', 'Hart', 'Bellamy', 'Ishida', 'Moreau', 'Quinn', 'Varga',
  'Abernethy', 'Brandt', 'Castellan', 'Dunmore', 'Esposito', 'Faraday', 'Galloway', 'Holloway', 'Iverson', 'Jaskolski', 'Kettering', 'Lowell',
  'Mbeki', 'Nakashima', 'Orsini', 'Pennington', 'Ravel', 'Saltonstall', 'Thorne', 'Underhill', 'Valdane', 'Whitlock', 'Yarrow', 'Zielinski',
  'Ashgrove', 'Birchwood', 'Corrigan', 'Delacroix', 'Ellery', 'Fontaine', 'Greaves', 'Halvorsen', 'Kowal', 'Lister', 'Montague', 'Pryce'];

// ===== SECTION: TALENT_ROLES =====
// Talent roles and the project slot each one fills. Labels only; weights live in engine.js TUNING.
CONTENT.TALENT_ROLES = [
  { id: 'director', name: 'Director', slot: 'director' },
  { id: 'writer', name: 'Writer', slot: 'writer' },
  { id: 'actor', name: 'Actor', slot: 'lead' },
  { id: 'crew', name: 'Crew', slot: 'crew' }
];
CONTENT.SLOT_LABELS = { director: 'Director', writer: 'Writer', lead: 'Lead actor', crew: 'Key crew' };

// ===== SECTION: CREW_SPECIALTIES =====
// effects apply when the crew member's skill is at least TUNING.talent.crewSpecialtyMin.
// effect keys read by engine.js: quality (points), hype (points), postWeeks (change to post-production length).
CONTENT.CREW_SPECIALTIES = [
  { id: 'cinematographer', name: 'Cinematographer', desc: 'Strong images lift the film.', effects: { quality: 2 } },
  { id: 'composer', name: 'Composer', desc: 'A memorable score helps the trailer.', effects: { hype: 3 } },
  { id: 'editor', name: 'Editor', desc: 'A fast editor shortens post-production.', effects: { postWeeks: -1 } }
];

// ===== SECTION: TRAITS =====
// Personality traits. Each talent gets 1–2. Text is shown in the UI.
// mods keys read by engine.js (all optional):
//   quality, hype, reliability, feeMult, teamSkill, growth, delayChance
// events: ids in TALENT_EVENTS that can fire while this talent is attached (three per trait since 6.1).
CONTENT.TRAITS = [
  { id: 'perfectionist', name: 'Perfectionist', desc: 'Pushes every scene until it is right. Better films, slower shoots.',
    mods: { quality: 3, delayChance: 0.05 }, events: ['tr_perfectionist', 'tr_perfectionist_dev', 'tr_perfectionist_polish'] },
  { id: 'diva', name: 'Diva', desc: 'Demanding and expensive, but the press loves them.',
    mods: { hype: 4, feeMult: 1.3 }, events: ['tr_diva', 'tr_diva_dev', 'tr_diva_press'] },
  { id: 'loyal', name: 'Loyal', desc: 'Values long relationships and asks for less.',
    mods: { feeMult: 0.85, reliability: 10 }, events: ['tr_loyal', 'tr_loyal_dev', 'tr_loyal_cheap'] },
  { id: 'hothead', name: 'Hothead', desc: 'Intense on set. Sparks fly, sometimes in a good way.',
    mods: { quality: 1, delayChance: 0.03 }, events: ['tr_hothead', 'tr_hothead_dev', 'tr_hothead_crew'] },
  { id: 'mentor', name: 'Mentor', desc: 'Lifts everyone around them.',
    mods: { teamSkill: 3 }, events: ['tr_mentor', 'tr_mentor_dev', 'tr_mentor_script'] },
  { id: 'partyanimal', name: 'Party animal', desc: 'Great for buzz, bad for early call times.',
    mods: { hype: 3, reliability: -20 }, events: ['tr_partyanimal', 'tr_partyanimal_dev', 'tr_partyanimal_wrap'] },
  { id: 'recluse', name: 'Recluse', desc: 'Avoids publicity and focuses on the work.',
    mods: { hype: -3, quality: 2 }, events: ['tr_recluse', 'tr_recluse_dev', 'tr_recluse_set'] },
  { id: 'ambitious', name: 'Ambitious', desc: 'Grows fast and knows their worth.',
    mods: { growth: 1.6, feeMult: 1.1 }, events: ['tr_ambitious', 'tr_ambitious_shoot', 'tr_ambitious_demand'] },
  { id: 'reliable', name: 'Reliable', desc: 'Always on time, always prepared.',
    mods: { reliability: 25 }, events: ['tr_reliable', 'tr_reliable_dev', 'tr_reliable_cover'] }
];

// ===== SECTION: TALENT_EVENTS =====
// Decisions that only fire while a talent with the trait is attached to the project (category 'talent').
// stage: 'development' | 'shoot'. {name} = the talent's name, {title} = the project title.
// effects keys: same as DECISIONS (quality, hype, costPct, weeks, fame), at most two per choice.
CONTENT.TALENT_EVENTS = [
  // Perfectionist
  { id: 'tr_perfectionist', category: 'talent', trait: 'perfectionist', stage: 'shoot', text: '{name} wants 40 takes of the key scene in "{title}".',
    choices: [
      { label: 'Let them', effects: { quality: 4, weeks: 1 }, result: '{name} got the take. It shows.' },
      { label: 'Call it after ten', effects: { quality: 1 }, result: 'You moved on after ten takes.' }
    ] },
  { id: 'tr_perfectionist_dev', category: 'talent', trait: 'perfectionist', stage: 'development', text: '{name} rewrites the opening of "{title}" for the fifth time.',
    choices: [
      { label: 'Let them finish', effects: { quality: 3, weeks: 1 }, result: '{name} finally locked an opening for "{title}". It is sharper.' },
      { label: 'Lock the draft', effects: { quality: 1 }, result: 'You locked the draft of "{title}" and moved on.' }
    ] },
  { id: 'tr_perfectionist_polish', category: 'talent', trait: 'perfectionist', stage: 'shoot', text: '{name} wants a costly reshoot of a scene nobody else thinks is broken.',
    choices: [
      { label: 'Approve it', effects: { quality: 3, costPct: 0.04 }, result: 'The reshoot was expensive, but {name} was right.' },
      { label: 'Overrule them', effects: { quality: -1 }, result: 'You overruled {name}. The scene stays as shot.' },
      { label: 'Compromise on a pickup shot', effects: { quality: 2, weeks: 1 }, result: 'A single pickup shot satisfied {name}.' }
    ] },
  // Diva
  { id: 'tr_diva', category: 'talent', trait: 'diva', stage: 'shoot', text: '{name} demands a bigger trailer and a personal chef on "{title}".',
    choices: [
      { label: 'Give in', effects: { costPct: 0.04, hype: 2 }, result: '{name} is happy and talking up "{title}".' },
      { label: 'Say no', effects: { quality: -2 }, result: '{name} sulked through the week.' }
    ] },
  { id: 'tr_diva_dev', category: 'talent', trait: 'diva', stage: 'development', text: '{name} demands script changes to give their character more screen time in "{title}".',
    choices: [
      { label: 'Make the changes', effects: { hype: 3, quality: -2 }, result: '{name} got the bigger part and is telling everyone about it.' },
      { label: 'Stand firm', effects: { quality: 1, hype: -2 }, result: 'You held the script. {name} is cool toward the project.' },
      { label: 'Offer a producer credit', effects: { costPct: 0.02, hype: 2 }, result: '{name} took the producer credit and the script stayed intact.' }
    ] },
  { id: 'tr_diva_press', category: 'talent', trait: 'diva', stage: 'shoot', text: '{name} gives an interview complaining about the weather and the catering on "{title}".',
    choices: [
      { label: 'Do damage control', effects: { costPct: 0.02, hype: 1 }, result: 'A publicist smoothed over {name}\'s comments.' },
      { label: 'Let it blow over', effects: { hype: -3 }, result: 'The complaints made the papers and hurt the buzz.' },
      { label: 'Own it with humor', effects: { hype: 3, fame: -1 }, result: 'You joked about it publicly. People laughed, and some rolled their eyes.' }
    ] },
  // Loyal
  { id: 'tr_loyal', category: 'talent', trait: 'loyal', stage: 'shoot', text: '{name} offers to work weekends to get "{title}" back on schedule.',
    choices: [
      { label: 'Accept gratefully', effects: { weeks: -1 }, result: '{name} pulled the shoot ahead a week.' },
      { label: 'Tell them to rest', effects: { quality: 1 }, result: 'A rested {name} gave a sharper performance.' }
    ] },
  { id: 'tr_loyal_dev', category: 'talent', trait: 'loyal', stage: 'development', text: '{name} offers to take a pay cut to keep "{title}" alive.',
    choices: [
      { label: 'Accept', effects: { costPct: -0.04, quality: -1 }, result: '{name} took less to keep "{title}" on track. Things are tighter.' },
      { label: 'Refuse, they deserve full pay', effects: { quality: 2 }, result: '{name} was moved. The whole team is working harder for "{title}".' }
    ] },
  { id: 'tr_loyal_cheap', category: 'talent', trait: 'loyal', stage: 'shoot', text: '{name} calls in a favor to get a free location for "{title}".',
    choices: [
      { label: 'Use it', effects: { costPct: -0.05 }, result: 'The free location saved real money.' },
      { label: 'Pay for the proper set', effects: { quality: 2, costPct: 0.02 }, result: 'You paid for a better set and kept the favor in reserve.' }
    ] },
  // Hothead
  { id: 'tr_hothead', category: 'talent', trait: 'hothead', stage: 'shoot', text: '{name} blew up at the crew on the set of "{title}".',
    choices: [
      { label: 'Back them', effects: { quality: 2, hype: -2 }, result: 'The intensity paid off on screen, but word got around.' },
      { label: 'Calm things down', effects: { weeks: 1 }, result: 'A day off cooled tempers.' },
      { label: 'Use it for publicity', effects: { hype: 4, quality: -2 }, result: 'The blow-up made the gossip pages.' }
    ] },
  { id: 'tr_hothead_dev', category: 'talent', trait: 'hothead', stage: 'development', text: '{name} storms out of a story meeting for "{title}".',
    choices: [
      { label: 'Chase after them', effects: { weeks: 1, quality: 2 }, result: 'You talked {name} round, and the argument improved the story.' },
      { label: 'Let them cool off', effects: { quality: -1 }, result: '{name} came back, but the mood stayed sour.' },
      { label: 'Go with the other notes', effects: { hype: -2, quality: 1 }, result: 'You went ahead without {name}\'s notes.' }
    ] },
  { id: 'tr_hothead_crew', category: 'talent', trait: 'hothead', stage: 'shoot', text: '{name} and the cinematographer are shouting at each other.',
    choices: [
      { label: 'Separate them', effects: { weeks: 1 }, result: 'You separated them. It cost a day.' },
      { label: 'Let it burn', effects: { quality: 2, hype: -2 }, result: 'The tension worked on camera, and in the trades.' },
      { label: 'Mediate', effects: { costPct: 0.02, quality: 1 }, result: 'A long lunch and a mediator got the set working again.' }
    ] },
  // Mentor
  { id: 'tr_mentor', category: 'talent', trait: 'mentor', stage: 'shoot', text: '{name} offers to run workshops for the younger cast of "{title}".',
    choices: [
      { label: 'Fund the workshops', effects: { quality: 3, costPct: 0.02 }, result: 'The whole cast of "{title}" improved.' },
      { label: 'No time', effects: {}, result: 'You kept the schedule tight.' }
    ] },
  { id: 'tr_mentor_dev', category: 'talent', trait: 'mentor', stage: 'development', text: '{name} suggests a table read to improve "{title}".',
    choices: [
      { label: 'Hold the reading', effects: { quality: 3, weeks: 1 }, result: 'The table read exposed problems, and the fixes helped.' },
      { label: 'Skip it', effects: {}, result: 'You skipped the table read.' }
    ] },
  { id: 'tr_mentor_script', category: 'talent', trait: 'mentor', stage: 'shoot', text: '{name} spots a flaw in the schedule and offers a fix.',
    choices: [
      { label: 'Take the advice', effects: { weeks: -1, quality: 1 }, result: '{name}\'s plan saved a week.' },
      { label: 'Ignore it', effects: {}, result: 'You stuck to your own schedule.' }
    ] },
  // Party animal
  { id: 'tr_partyanimal', category: 'talent', trait: 'partyanimal', stage: 'shoot', text: '{name} showed up hungover again on "{title}".',
    choices: [
      { label: 'Shoot around them', effects: { weeks: 1 }, result: 'You lost a week shooting around {name}.' },
      { label: 'Push through', effects: { quality: -3 }, result: 'The scene is a little flat.' },
      { label: 'Leak it as a wild-set story', effects: { hype: 4, quality: -1 }, result: 'Tales from the "{title}" set are everywhere.' }
    ] },
  { id: 'tr_partyanimal_dev', category: 'talent', trait: 'partyanimal', stage: 'development', text: '{name} turns a script meeting for "{title}" into a late-night party.',
    choices: [
      { label: 'Go along', effects: { hype: 3, quality: -1 }, result: 'The party got people excited about "{title}", though little got written.' },
      { label: 'Call it off', effects: { quality: 1, hype: -1 }, result: 'You ended the party and got back to work.' },
      { label: 'Charge it to the studio', effects: { costPct: 0.02, hype: 2 }, result: 'The studio picked up the bill.' }
    ] },
  { id: 'tr_partyanimal_wrap', category: 'talent', trait: 'partyanimal', stage: 'shoot', text: '{name} throws a wrap-week party the crew will not forget.',
    choices: [
      { label: 'Join in', effects: { hype: 4, weeks: 1 }, result: 'The party was legendary. The next morning was slow.' },
      { label: 'Cap the budget', effects: { costPct: 0.02, hype: 2 }, result: 'A capped party still got people talking.' },
      { label: 'Cancel it', effects: { hype: -2, quality: 1 }, result: 'You cancelled the party. The crew stayed focused and grumpy.' }
    ] },
  // Recluse
  { id: 'tr_recluse', category: 'talent', trait: 'recluse', stage: 'shoot', text: '{name} refuses to do any press for "{title}".',
    choices: [
      { label: 'Respect it', effects: { quality: 1 }, result: '{name} stayed focused on the work.' },
      { label: 'Insist', effects: { hype: 3, quality: -2 }, result: 'One reluctant interview ran. {name} is unhappy.' }
    ] },
  { id: 'tr_recluse_dev', category: 'talent', trait: 'recluse', stage: 'development', text: '{name} wants to work alone in a cabin for a month on "{title}".',
    choices: [
      { label: 'Allow it', effects: { quality: 3, weeks: 2 }, result: '{name} came back with something special for "{title}".' },
      { label: 'Insist on team meetings', effects: { quality: -1, hype: 1 }, result: 'You kept {name} in the room. The work suffered a little.' }
    ] },
  { id: 'tr_recluse_set', category: 'talent', trait: 'recluse', stage: 'shoot', text: '{name} asks for a closed set on "{title}".',
    choices: [
      { label: 'Close the set', effects: { quality: 2, hype: -2 }, result: 'A closed set helped the work and starved the press.' },
      { label: 'Keep it open', effects: { hype: 2, quality: -1 }, result: 'The set stayed open. {name} was uneasy.' }
    ] },
  // Ambitious
  { id: 'tr_ambitious', category: 'talent', trait: 'ambitious', stage: 'development', text: '{name} wants a bigger part in shaping "{title}".',
    choices: [
      { label: 'Give them more say', effects: { quality: 3, costPct: 0.03 }, result: '{name} brought fresh ideas to "{title}".' },
      { label: 'Keep roles clear', effects: {}, result: 'You kept the chain of command clear.' }
    ] },
  { id: 'tr_ambitious_shoot', category: 'talent', trait: 'ambitious', stage: 'shoot', text: '{name} asks to direct a second-unit scene on "{title}".',
    choices: [
      { label: 'Give them a shot', effects: { quality: 2, weeks: 1 }, result: '{name} shot a good scene and learned fast.' },
      { label: 'Say not yet', effects: { quality: -1 }, result: '{name} took the refusal personally.' }
    ] },
  { id: 'tr_ambitious_demand', category: 'talent', trait: 'ambitious', stage: 'shoot', text: '{name} wants a bigger credit on "{title}".',
    choices: [
      { label: 'Grant it', effects: { hype: 3, costPct: 0.02 }, result: '{name} got the credit and is promoting the film.' },
      { label: 'Refuse', effects: { quality: -2 }, result: '{name} is sulking.' },
      { label: 'Promise a better role next time', effects: { hype: 1 }, result: '{name} accepted the promise, for now.' }
    ] },
  // Reliable
  { id: 'tr_reliable', category: 'talent', trait: 'reliable', stage: 'shoot', text: '{name} has the next scenes of "{title}" fully prepped.',
    choices: [
      { label: 'Move fast', effects: { weeks: -1 }, result: 'Thanks to {name}, the shoot gained a week.' },
      { label: 'Use the time for polish', effects: { quality: 2 }, result: 'The extra prep made "{title}" better.' }
    ] },
  { id: 'tr_reliable_dev', category: 'talent', trait: 'reliable', stage: 'development', text: '{name} turns in a clean, early draft of their work on "{title}".',
    choices: [
      { label: 'Start sooner', effects: { weeks: -1 }, result: 'Development finished a week early.' },
      { label: 'Use the time to refine', effects: { quality: 2 }, result: 'You used the extra week to polish "{title}".' }
    ] },
  { id: 'tr_reliable_cover', category: 'talent', trait: 'reliable', stage: 'shoot', text: '{name} covers for a missing crew member without being asked.',
    choices: [
      { label: 'Reward them', effects: { costPct: 0.02, quality: 2 }, result: 'You paid {name} a bonus. Morale on set rose.' },
      { label: 'Accept the favor', effects: { weeks: -1 }, result: 'The favor kept the shoot on pace.' }
    ] }
];

// ===== SECTION: EVENTS =====
// Phase 6.1 events library. Categories: industry, economic, studio, talent (talent & staff), production.
// Each event: id, category, text, 2–3 choices, at most two effect keys per choice, optional disaster: true.
//
// Studio-level events (industry, economic, studio, talent) show one popup at a time, about 2 a year.
// Conditions (all optional): from / to (years), minFame, minTier, minReleases, cycle ('boom'|'recession'),
//   needs: ['roster' | 'staff' | 'debt' | 'production'], once: true (never repeats).
// Placeholders: {studio}, {founder}, {name} (a random roster talent, when needs has 'roster'), {genre} (a random genre).
// Studio effect keys (read by engine.js EVENTS):
//   cash         – weeks of running costs (+ gain, − cost); the engine turns it into dollars when the popup shows
//   fame, critics – studio fame / critics reputation points
//   hype, quality, weeks – applied to every production in progress (weeks = delay)
//   market       – popularity change for the {genre} named in the popup
//   talentMorale, talentFame – the roster talent named in the popup
//   rosterMorale, staffMorale – everyone on the roster / every staffed department
// Production events (category 'production') attach to one project and use the DECISIONS effect keys
//   (quality, hype, costPct, weeks, fame) plus stage: 'development' | 'shoot' and optional formats.
// disaster: true events trigger a cooldown (TUNING.events.disasterCooldown) with no studio events and no other disasters.
CONTENT.EVENT_CATEGORIES = {
  industry: 'Industry news',
  economic: 'Economy',
  studio: 'Studio',
  talent: 'Talent & staff',
  production: 'Production'
};
CONTENT.EVENTS = [
  // ----- Industry -----
  { id: 'ind_guild_strike', category: 'industry', disaster: true, from: 1975, minFame: 5, needs: ['production'],
    text: 'The writers\' guild calls an industry-wide strike. Scripts stop moving and every studio is scrambling.',
    choices: [
      { label: 'Sign the guild\'s terms', effects: { cash: -3, quality: 1 }, result: 'You signed the guild\'s terms. Your writers stayed on the job.' },
      { label: 'Wait it out', effects: { weeks: 1, hype: -2 }, result: 'Production stalled for a week while the strike dragged on.' },
      { label: 'Hire non-union writers', effects: { quality: -2, fame: -2 }, result: 'Replacement writers kept things moving, and the industry noticed.' }
    ] },
  { id: 'ind_critics_poll', category: 'industry', minReleases: 1,
    text: 'A critics\' circle is polling for the year\'s most promising studio.',
    choices: [
      { label: 'Send screeners and a note', effects: { cash: -1, critics: 3 }, result: 'The critics\' circle noticed your note and your films.' },
      { label: 'Stay out of it', effects: {}, result: 'You stayed out of the poll.' }
    ] },
  { id: 'ind_trade_profile', category: 'industry', minFame: 10,
    text: 'A trade paper wants to profile {studio} for its next issue.',
    choices: [
      { label: 'Give a long interview', effects: { fame: 2, hype: 2 }, result: 'The profile ran with a flattering photo.' },
      { label: 'Offer an exclusive tour of the lot', effects: { cash: -1, fame: 3 }, result: 'The tour made a splash in the trades.' },
      { label: 'Decline', effects: {}, result: 'You declined the profile.' }
    ] },
  { id: 'ind_genre_craze', category: 'industry',
    text: 'Word on the street: {genre} is about to be the next big thing.',
    choices: [
      { label: 'Build buzz for your {genre} slate', effects: { market: 0.08, cash: -1 }, result: 'Your buzz helped push {genre} up the charts.' },
      { label: 'Ignore the rumor', effects: {}, result: 'You ignored the rumor.' }
    ] },
  { id: 'ind_ratings_board', category: 'industry', minFame: 5, needs: ['production'],
    text: 'The ratings board threatens a harsh rating for one of your films in production.',
    choices: [
      { label: 'Cut the scene', effects: { quality: -2 }, result: 'You trimmed the offending scene to satisfy the board.' },
      { label: 'Fight the decision', effects: { cash: -2, hype: 3 }, result: 'The fight got headlines. Lawyers cost money.' },
      { label: 'Accept the rating', effects: { hype: -3 }, result: 'You accepted the rating. Some of the audience will stay home.' }
    ] },
  { id: 'ind_theater_tieup', category: 'industry', minTier: 1,
    text: 'A theater chain offers a cross-promotion deal for your next release.',
    choices: [
      { label: 'Take the cash', effects: { cash: 3, hype: -2 }, result: 'The chain paid up, and the posters now carry its logo.' },
      { label: 'Negotiate for more', effects: { cash: 1, fame: 1 }, result: 'You haggled a modest fee and some good press.' },
      { label: 'Decline', effects: {}, result: 'You turned the chain down.' }
    ] },
  { id: 'ind_camera_demo', category: 'industry', to: 1999, needs: ['production'],
    text: 'An engineer demos a lightweight camera rig and wants a studio to try it on a real shoot.',
    choices: [
      { label: 'Back the experiment', effects: { cash: -2, quality: 2 }, result: 'The new rig gave your shoot a fresh look.' },
      { label: 'Pass', effects: {}, result: 'You passed on the new camera.' }
    ] },
  { id: 'ind_retrospective', category: 'industry', minFame: 15,
    text: 'A festival invites you to speak on a panel about independent film.',
    choices: [
      { label: 'Attend', effects: { fame: 2, cash: -1 }, result: 'Your panel went well. People remembered the name.' },
      { label: 'Send an assistant', effects: { critics: 1 }, result: 'Your assistant did a decent job.' }
    ] },
  { id: 'ind_piracy', category: 'industry', disaster: true, from: 1980, minReleases: 2,
    text: 'Pirated copies of your films are circulating.',
    choices: [
      { label: 'Hire investigators', effects: { cash: -3, fame: 1 }, result: 'The investigators shut down a few sellers.' },
      { label: 'Ignore it', effects: { fame: -2 }, result: 'Pirated copies spread. Your name did too, for the wrong reasons.' },
      { label: 'Lobby for tougher laws', effects: { cash: -2, critics: 1 }, result: 'You joined a lobbying push. Little changed yet.' }
    ] },
  { id: 'ind_crew_union', category: 'industry', needs: ['production'],
    text: 'A crew union is organizing on local sets.',
    choices: [
      { label: 'Welcome them', effects: { cash: -2, quality: 1 }, result: 'Your crews signed up. Morale is better and wages higher.' },
      { label: 'Stay non-union', effects: { quality: -1, hype: -1 }, result: 'You stayed non-union. Some crew members moved on.' }
    ] },
  // ----- Economic -----
  { id: 'eco_investor', category: 'economic', minTier: 1, minReleases: 2,
    text: 'A private investor offers cash in return for a say in your next greenlight.',
    choices: [
      { label: 'Take the money', effects: { cash: 6, critics: -2 }, result: 'The investor\'s cash arrived, and so did his opinions.' },
      { label: 'Refuse politely', effects: {}, result: 'You turned the investor down.' }
    ] },
  { id: 'eco_tax_audit', category: 'economic', disaster: true, from: 1971, minReleases: 1,
    text: 'The tax office announces an audit of your books.',
    choices: [
      { label: 'Pay the adjustment', effects: { cash: -5 }, result: 'You paid the adjustment and closed the file.' },
      { label: 'Fight it with a lawyer', effects: { cash: -3, fame: -1 }, result: 'The lawyer got the bill down, but the dispute leaked.' }
    ] },
  { id: 'eco_rent_hike', category: 'economic',
    text: 'The landlord is raising the studio\'s rent.',
    choices: [
      { label: 'Pay the increase', effects: { cash: -3 }, result: 'You paid the higher rent.' },
      { label: 'Move to cheaper space', effects: { cash: -1, fame: -1 }, result: 'You moved to a cheaper address. It looks a little sad.' },
      { label: 'Negotiate a longer lease', effects: { cash: -2 }, result: 'A longer lease got you a smaller increase.' }
    ] },
  { id: 'eco_grant', category: 'economic', minReleases: 1,
    text: 'An arts council offers a production grant for a serious drama.',
    choices: [
      { label: 'Apply', effects: { cash: 3, critics: 1 }, result: 'The grant came through. The paperwork was a chore.' },
      { label: 'Skip the paperwork', effects: {}, result: 'You skipped the application.' }
    ] },
  { id: 'eco_boom_advance', category: 'economic', cycle: 'boom', minTier: 1,
    text: 'Boom times: a distributor offers an advance on your next film.',
    choices: [
      { label: 'Take the advance', effects: { cash: 4, critics: -1 }, result: 'The advance arrived with a few strings attached.' },
      { label: 'Hold out for a bigger deal', effects: { fame: 1 }, result: 'You held out. The market noticed your confidence.' }
    ] },
  { id: 'eco_supplier_bust', category: 'economic', needs: ['production'],
    text: 'Your film-stock supplier goes bust, owing you a deposit.',
    choices: [
      { label: 'Write off the loss', effects: { cash: -2 }, result: 'You wrote off the deposit and found a new supplier.' },
      { label: 'Chase the debt', effects: { cash: -1, fame: -1 }, result: 'You chased the debt. It cost money and some goodwill.' }
    ] },
  { id: 'eco_equipment_sale', category: 'economic', minTier: 1, needs: ['production'],
    text: 'A bankrupt studio is selling off equipment cheap.',
    choices: [
      { label: 'Buy a lot', effects: { cash: -3, quality: 2 }, result: 'The new equipment improved your productions.' },
      { label: 'Pass', effects: {}, result: 'You passed on the equipment.' }
    ] },
  { id: 'eco_loan_terms', category: 'economic', needs: ['debt'],
    text: 'Your bank wants to renegotiate the terms of your loan.',
    choices: [
      { label: 'Pay the fee', effects: { cash: -2 }, result: 'You paid the fee and the terms stayed the same.' },
      { label: 'Argue the point', effects: { cash: -1, fame: -1 }, result: 'The bank gave in, grudgingly. Word got around.' }
    ] },
  { id: 'eco_recession_cuts', category: 'economic', cycle: 'recession', needs: ['production'],
    text: 'Audiences are cutting back. Your accountant suggests trimming costs.',
    choices: [
      { label: 'Trim the budgets', effects: { cash: 2, quality: -1 }, result: 'You trimmed costs across the slate.' },
      { label: 'Keep spending', effects: { hype: 2, cash: -2 }, result: 'You kept spending. Hope is a strategy.' }
    ] },
  // ----- Studio -----
  { id: 'stu_fire', category: 'studio', disaster: true, needs: ['production'],
    text: 'A fire breaks out in the studio\'s storage room.',
    choices: [
      { label: 'Claim insurance and rebuild', effects: { cash: -3, weeks: 1 }, result: 'Insurance covered some of it. The rebuild cost a week.' },
      { label: 'Salvage what you can', effects: { cash: -1, quality: -2 }, result: 'You salvaged what you could. Some props and sets are gone.' }
    ] },
  { id: 'stu_lawsuit', category: 'studio', disaster: true, minFame: 10, minReleases: 2,
    text: 'A writer claims one of your films copied their script.',
    choices: [
      { label: 'Settle quietly', effects: { cash: -4 }, result: 'You settled quietly.' },
      { label: 'Fight it in court', effects: { cash: -2, fame: -2 }, result: 'You won, mostly, but the case made the papers.' },
      { label: 'Offer a credit', effects: { cash: -1, critics: -2 }, result: 'You offered a credit. The critics found it suspicious.' }
    ] },
  { id: 'stu_scandal', category: 'studio', disaster: true, minFame: 20,
    text: 'A tabloid claims {founder} was seen at a wild party.',
    choices: [
      { label: 'Issue a stiff denial', effects: { fame: -1 }, result: 'Your denial ran on page six, below the story.' },
      { label: 'Hire a crisis publicist', effects: { cash: -2 }, result: 'The publicist buried the story.' },
      { label: 'Lean into the notoriety', effects: { fame: 2, critics: -3 }, result: 'You owned the story. The public loved it, and the critics sniffed.' }
    ] },
  { id: 'stu_profile', category: 'studio', minFame: 10,
    text: 'A magazine wants a profile of {founder}.',
    choices: [
      { label: 'Do the interview', effects: { fame: 2 }, result: 'The interview ran with a nice portrait.' },
      { label: 'Pitch your slate', effects: { fame: 1, hype: 2 }, result: 'The article mentioned your slate by name.' },
      { label: 'Decline', effects: {}, result: 'You declined the profile.' }
    ] },
  { id: 'stu_charity', category: 'studio', minFame: 15,
    text: 'A children\'s charity asks you to host a benefit premiere.',
    choices: [
      { label: 'Host it', effects: { cash: -2, fame: 3 }, result: 'The premiere raised money and your profile.' },
      { label: 'Send a donation instead', effects: { cash: -1, critics: 1 }, result: 'Your donation was noted.' }
    ] },
  { id: 'stu_old_producer', category: 'studio', needs: ['production'],
    text: 'A retired producer offers advice over lunch.',
    choices: [
      { label: 'Listen closely', effects: { quality: 2 }, result: 'His advice sharpened your productions.' },
      { label: 'Ask for an introduction to his bank', effects: { cash: 2 }, result: 'The banker was generous with a small credit line.' }
    ] },
  { id: 'stu_burnout', category: 'studio', minReleases: 1, needs: ['production'],
    text: '{founder} is exhausted after months without a day off.',
    choices: [
      { label: 'Take a week off', effects: { weeks: 1, quality: 2 }, result: 'A week off cleared everyone\'s head.' },
      { label: 'Push through', effects: { quality: -2 }, result: 'You pushed through. Mistakes crept in.' }
    ] },
  { id: 'stu_pitch_meeting', category: 'studio', minTier: 1,
    text: 'A major studio executive offers you a pitch meeting.',
    choices: [
      { label: 'Pitch a crowd-pleaser', effects: { cash: 3, critics: -2 }, result: 'The exec bought a crowd-pleaser pitch. The critics rolled their eyes.' },
      { label: 'Pitch an art film', effects: { critics: 3, cash: -1 }, result: 'The art film pitch charmed the critics, not the accountants.' },
      { label: 'Skip it', effects: {}, result: 'You skipped the meeting.' }
    ] },
  // ----- Talent & staff -----
  { id: 'tal_agent_demand', category: 'talent', needs: ['roster'],
    text: '{name}\'s agent wants a bigger profile for their client.',
    choices: [
      { label: 'Give them top billing', effects: { talentMorale: 10, cash: -1 }, result: '{name} is delighted with the new billing.' },
      { label: 'Say no', effects: { talentMorale: -8 }, result: '{name} is unhappy with your answer.' }
    ] },
  { id: 'tal_gossip', category: 'talent', needs: ['roster'],
    text: '{name} is the subject of tabloid gossip.',
    choices: [
      { label: 'Defend them publicly', effects: { talentFame: 2, fame: -1 }, result: 'You stood by {name}. The gossip faded.' },
      { label: 'Say nothing', effects: { talentMorale: -5 }, result: '{name} felt abandoned.' },
      { label: 'Spin it for the film', effects: { talentFame: 3, critics: -1 }, result: 'The spin made {name} a bigger name.' }
    ] },
  { id: 'tal_gala', category: 'talent', minFame: 15, needs: ['roster'],
    text: '{name} is invited to a gala and wants the studio to sponsor a table.',
    choices: [
      { label: 'Sponsor it', effects: { cash: -2, talentFame: 3 }, result: '{name} had a great night and made headlines.' },
      { label: 'Decline', effects: { talentMorale: -4 }, result: '{name} went alone and felt slighted.' }
    ] },
  { id: 'tal_roster_party', category: 'talent', needs: ['roster'],
    text: 'Your roster is restless. Someone suggests a night out.',
    choices: [
      { label: 'Throw a party', effects: { cash: -2, rosterMorale: 8 }, result: 'The party lifted spirits across the roster.' },
      { label: 'Skip it', effects: { rosterMorale: -3 }, result: 'You skipped it. The mood stayed flat.' }
    ] },
  { id: 'tal_rookie', category: 'talent', needs: ['production'],
    text: 'A rookie everyone is talking about asks for an audition.',
    choices: [
      { label: 'Hold the audition', effects: { cash: -1, quality: 1 }, result: 'The rookie impressed, and a scene improved.' },
      { label: 'Pass', effects: {}, result: 'You passed on the rookie.' }
    ] },
  { id: 'staf_overtime', category: 'talent', needs: ['staff', 'production'],
    text: 'Your department heads want overtime pay for the crunch.',
    choices: [
      { label: 'Pay overtime', effects: { cash: -2, staffMorale: 8 }, result: 'You paid overtime. The staff are happier.' },
      { label: 'Say no', effects: { staffMorale: -8 }, result: 'You said no. The staff are grumbling.' },
      { label: 'Offer time off in lieu', effects: { weeks: 1, staffMorale: 4 }, result: 'Time off in lieu slowed things a little.' }
    ] },
  { id: 'staf_recruiter', category: 'talent', needs: ['staff'],
    text: 'A recruiter from a rival is courting one of your staff.',
    choices: [
      { label: 'Counter with a raise', effects: { cash: -2, staffMorale: 5 }, result: 'You matched the offer. Your staff noticed.' },
      { label: 'Wish them luck', effects: { staffMorale: -6 }, result: 'You let them go. The staff felt uneasy.' }
    ] },
  { id: 'staf_holiday_party', category: 'talent', needs: ['staff'],
    text: 'It\'s time for the staff party.',
    choices: [
      { label: 'Throw a proper one', effects: { cash: -2, staffMorale: 10 }, result: 'The party was a hit.' },
      { label: 'Send cards', effects: { staffMorale: 1 }, result: 'You sent cards. It was the thought that counted.' },
      { label: 'Skip it', effects: { staffMorale: -4 }, result: 'You skipped the party. Nobody forgot.' }
    ] },
  // ----- Production (attach to one project; effects use the DECISIONS keys) -----
  { id: 'pr_dev_pitch', category: 'production', stage: 'development',
    text: 'A distributor hears about "{title}" and asks for an early pitch.',
    choices: [
      { label: 'Pitch now', effects: { hype: 4, quality: -1 }, result: 'An early pitch got people talking about "{title}".' },
      { label: 'Wait until it is polished', effects: { quality: 2, weeks: 1 }, result: 'You waited and polished "{title}".' }
    ] },
  { id: 'pr_dev_comps', category: 'production', stage: 'development',
    text: 'A similar film just flopped. Should "{title}" change course?',
    choices: [
      { label: 'Change the angle', effects: { quality: 2, weeks: 1 }, result: 'You reworked the angle of "{title}".' },
      { label: 'Stay the course', effects: { hype: 2 }, result: 'You stayed the course on "{title}".' }
    ] },
  { id: 'pr_dev_sponsor', category: 'production', stage: 'development',
    text: 'A sponsor wants product placement in "{title}".',
    choices: [
      { label: 'Accept', effects: { costPct: -0.06, quality: -2 }, result: 'The sponsor paid in. A cereal brand now has a cameo.' },
      { label: 'Decline', effects: { quality: 1 }, result: 'You kept "{title}" free of logos.' }
    ] },
  { id: 'pr_shoot_stunt', category: 'production', stage: 'shoot',
    text: 'The stunt coordinator proposes a daring set piece for "{title}".',
    choices: [
      { label: 'Go for it', effects: { quality: 4, costPct: 0.06 }, result: 'The stunt was a showstopper.' },
      { label: 'Use a safer version', effects: { quality: 1 }, result: 'The safer stunt still looks good.' },
      { label: 'Cut it', effects: { costPct: -0.02, quality: -2 }, result: 'You cut the stunt to save money.' }
    ] },
  { id: 'pr_shoot_catering', category: 'production', stage: 'shoot',
    text: 'The caterer quits mid-week and the crew of "{title}" is grumbling.',
    choices: [
      { label: 'Pay for a better caterer', effects: { costPct: 0.02, quality: 1 }, result: 'A good caterer lifted the crew\'s spirits.' },
      { label: 'Eat sandwiches', effects: { quality: -1 }, result: 'The crew ate sandwiches and moaned.' }
    ] },
  { id: 'pr_shoot_permit', category: 'production', stage: 'shoot',
    text: 'The location permit for "{title}" is revoked.',
    choices: [
      { label: 'Pay the fee', effects: { costPct: 0.04 }, result: 'You paid the fee and kept shooting.' },
      { label: 'Shoot guerrilla-style', effects: { quality: -1, hype: 3 }, result: 'The guerrilla shoot has an edgy look and a story to tell.' },
      { label: 'Move to a backlot', effects: { weeks: 1, quality: -1 }, result: 'The shoot moved to a backlot and lost a week.' }
    ] },
  { id: 'pr_shoot_extras', category: 'production', stage: 'shoot',
    text: 'A crowd of local extras shows up in costume, uninvited.',
    choices: [
      { label: 'Put them in the scene', effects: { quality: 2, hype: 2 }, result: 'The crowd gave the scene energy and the film a local following.' },
      { label: 'Send them home', effects: {}, result: 'You sent the crowd home politely.' }
    ] },
  { id: 'pr_shoot_score', category: 'production', stage: 'shoot',
    text: 'A rising composer offers a theme for "{title}" for a small fee.',
    choices: [
      { label: 'Hire them', effects: { costPct: 0.03, hype: 3 }, result: 'The theme became the trailer\'s hook.' },
      { label: 'Use library music', effects: { quality: -1 }, result: 'Library music will do. It sounds like it.' }
    ] },
  { id: 'pr_shoot_wrap', category: 'production', stage: 'shoot',
    text: 'The crew of "{title}" wants an early wrap party to keep spirits up.',
    choices: [
      { label: 'Throw it', effects: { costPct: 0.02, quality: 2 }, result: 'The party lifted the crew. The next scenes improved.' },
      { label: 'Not yet', effects: {}, result: 'You told the crew to wait for the real wrap.' }
    ] },
  { id: 'pr_set_collapse', category: 'production', stage: 'shoot', disaster: true,
    text: 'A set wall collapses during a take on "{title}". Nobody is badly hurt, but the shoot is shaken.',
    choices: [
      { label: 'Halt and inspect everything', effects: { weeks: 2, quality: 1 }, result: 'You halted the shoot and inspected every set. Safer, slower.' },
      { label: 'Rebuild fast and push on', effects: { costPct: 0.08, weeks: 1 }, result: 'A rush rebuild got the shoot moving again.' },
      { label: 'Carry on', effects: { quality: -3, hype: -3 }, result: 'You carried on. The crew is anxious and the press heard about it.' }
    ] },
  { id: 'pr_lead_injury', category: 'production', stage: 'shoot', disaster: true,
    text: 'Your lead sprains an ankle on "{title}".',
    choices: [
      { label: 'Rewrite around it', effects: { quality: -2, weeks: 1 }, result: 'The scenes were rewritten around the injury.' },
      { label: 'Wait for recovery', effects: { weeks: 3 }, result: 'The shoot waited three weeks for the lead to recover.' },
      { label: 'Use a stunt double', effects: { costPct: 0.04, quality: -1 }, result: 'A double covered the physical scenes.' }
    ] }
];

// ===== SECTION: REGIONS =====
// Fictional broad markets. Numbers are design balance multipliers, not real box-office data.
CONTENT.REGIONS = [
  { id: 'northamerica', name: 'North America', audience: 1.05, taste: { action: 1.08, comedy: 1.07 }, cost: 1.0 },
  { id: 'europe', name: 'Europe', audience: 0.84, taste: { drama: 1.13, documentary: 1.15 }, cost: 1.02 },
  { id: 'asiapacific', name: 'Asia-Pacific', audience: 1.0, taste: { scifi: 1.12, action: 1.10 }, cost: 1.12 },
  { id: 'latinamerica', name: 'Latin America', audience: 0.73, taste: { romance: 1.15, comedy: 1.10 }, cost: 0.90 },
  { id: 'mea', name: 'Middle East & Africa', audience: 0.61, taste: { drama: 1.09, action: 1.09 }, cost: 0.84 }
];

// ===== SECTION: AWARDS =====
// 6.3. Fictional festival circuit (features) and one annual ceremony. Odds, costs and rewards live in engine.js TUNING.awards.
// circuit: week = week of the year the festival runs. Films released in the last year are submitted automatically.
// categories: slot = which cast slot is judged besides the film (null = the film itself).
CONTENT.AWARDS = {
  ceremony: 'The Golden Reel Awards',
  // One fictional festival per tier each year; never gated by studio size.
  // entryScore is an advisory merit threshold for automatic applications, not an absolute prize requirement.
  circuit: [
    { id: 'local', name: 'Lakeshore Film Festival', tier: 1, level: 'Local', week: 8, prize: 'Local Jury Prize', entryScore: 0, selection: 43, winner: 67 },
    { id: 'regional', name: 'Red Mesa Film Festival', tier: 2, level: 'Regional', week: 16, prize: 'Regional Jury Prize', entryScore: 43, selection: 51, winner: 74 },
    { id: 'national', name: 'Northfield National Film Festival', tier: 3, level: 'National', week: 24, prize: 'National Grand Prize', entryScore: 57, selection: 61, winner: 81 },
    { id: 'continental', name: 'Harbor Lights Continental', tier: 4, level: 'Continental', week: 32, prize: 'Continental Jury Prize', entryScore: 70, selection: 71, winner: 88 },
    { id: 'international', name: 'Northfield International', tier: 5, level: 'International', week: 40, prize: 'International Grand Prize', entryScore: 82, selection: 81, winner: 96 },
    { id: 'world', name: 'Golden Atlas World Festival', tier: 6, level: 'World', week: 48, prize: 'World Grand Prize', entryScore: 91, selection: 91, winner: 104 }
  ],
  categories: [
    { id: 'picture', name: 'Best Picture', slot: null },
    { id: 'direction', name: 'Best Direction', slot: 'director' },
    { id: 'screenplay', name: 'Best Screenplay', slot: 'writer' },
    { id: 'performance', name: 'Best Lead Performance', slot: 'lead' },
    { id: 'supporting', name: 'Best Supporting Performance', slot: 'supporting' }
  ],
  campaigns: [
    { id: 'none', name: 'No campaign' },
    { id: 'small', name: 'Trade ads and screenings' },
    { id: 'big', name: 'Full awards campaign' }
  ]
};
// Two specialist festivals debut per decade beginning in 1980. Fictional settings.
CONTENT.AWARDS.circuit.forEach(f => { f.startYear = 1970; f.formats = ['short', 'feature']; f.focus = null; });
CONTENT.AWARDS.circuit.push(
  { id:'citylights', name:'Citylights Independent Film Festival', tier:2, level:'Regional', week:20, prize:'Independent Jury Prize', entryScore:40, selection:52, winner:78, startYear:1980, formats:['short','feature'], focus:'indie' },
  { id:'nightfall', name:'Nightfall Genre Film Festival', tier:3, level:'National', week:44, prize:'Midnight Jury Prize', entryScore:52, selection:63, winner:83, startYear:1980, formats:['short','feature'], focus:'horror' },
  { id:'reelstories', name:'Reel Stories Documentary Festival', tier:4, level:'Continental', week:36, prize:'Documentary Grand Prize', entryScore:63, selection:74, winner:90, startYear:1990, formats:['short','feature'], focus:'documentary' },
  { id:'newvoices', name:'New Voices First-Film Festival', tier:2, level:'Regional', week:13, prize:'New Filmmaker Prize', entryScore:40, selection:54, winner:76, startYear:1990, formats:['short','feature'], focus:'debut' },
  { id:'coastalaudience', name:'Coastal Audience Film Festival', tier:3, level:'National', week:27, prize:'Audience Choice Trophy', entryScore:53, selection:65, winner:83, startYear:2000, formats:['short','feature'], focus:'audience' },
  { id:'beyondtomorrow', name:'Beyond Tomorrow Science Fiction Fest', tier:4, level:'Continental', week:46, prize:'Visionary Sci-Fi Prize', entryScore:64, selection:75, winner:92, startYear:2000, formats:['short','feature'], focus:'scifi' },
  { id:'shortframe', name:'Short Frame International', tier:5, level:'International', week:4, prize:'Best International Short', entryScore:72, selection:83, winner:97, startYear:2010, formats:['short'], focus:'short' },
  { id:'goldenhour', name:'Golden Hour Romance Showcase', tier:2, level:'Regional', week:34, prize:'Golden Heart Prize', entryScore:40, selection:53, winner:77, startYear:2010, formats:['short','feature'], focus:'romance' },
  { id:'globalstory', name:'Global Stories Film Festival', tier:5, level:'International', week:23, prize:'Global Stories Jury Prize', entryScore:75, selection:83, winner:98, startYear:2020, formats:['short','feature'], focus:'international' },
  { id:'midnightlantern', name:'Midnight Lantern Thriller Festival', tier:3, level:'National', week:50, prize:'Suspense Jury Award', entryScore:54, selection:64, winner:83, startYear:2020, formats:['short','feature'], focus:'thriller' }
);

// Film-industry ceremonies founded gradually. No new ceremony requires separate player management.
CONTENT.AWARDS.ceremonies = [
  { id:'golden', name:'The Golden Reel Awards', startYear:1970, week:10, style:'balanced', formats:['feature'],
    categories:CONTENT.AWARDS.categories },
  { id:'critics', name:'Critics Circle Honors', startYear:1980, week:18, style:'critics', formats:['feature'],
    categories:[{id:'criticsfilm',name:'Film of the Year'}, {id:'criticsdirection',name:'Critics’ Best Direction',slot:'director'},
      {id:'criticsscreenplay',name:'Critics’ Best Screenplay',slot:'writer'}] },
  { id:'independent', name:'Independent Screen Awards', startYear:1990, week:26, style:'indie', formats:['feature','short'],
    categories:[{id:'indiefeature',name:'Best Independent Feature',format:'feature'}, {id:'indieshort',name:'Best Short Film',format:'short'},
      {id:'newtalent',name:'Emerging Filmmaker',debut:true}] },
  { id:'audience', name:'Audience Spotlight Awards', startYear:2000, week:38, style:'audience', formats:['feature'],
    categories:[{id:'audiencefilm',name:'Audience Favorite'}, {id:'commercial',name:'Biggest Crowd-Pleaser'},
      {id:'genrechoice',name:'Genre Favorite'}] }
];

// Placeholders: {title}, {festival}, {prize}, {ceremony}, {year}, {cat}, {studio}, {count}, {cats}, {name}.
CONTENT.AWARD_TEXT = {
  festSelected: '"{title}" is an official selection at the {festival}.',
  festPrize: '"{title}" wins the {prize} at the {festival}!',
  nominated: '"{title}" earns {count} nomination{s} at {ceremony} {year}: {cats}.',
  won: '"{title}" wins {cat} at {ceremony} {year}!',
  rivalWon: '{studio}\'s "{title}" wins {cat} at {ceremony} {year}.',
  noNoms: '{ceremony} {year}: no nominations for your studio.',
  talentWon: '{name} wins {cat}.'
};

// ===== SECTION: NEWS =====
// 6.4. The News feed shows real log entries only. typeMap: log type → filter; catMap: event category → filter (an entry's cat wins over its type).
// hidden: log types that are diary steps, not news; hiddenCats: event categories left out too. Entries with no filter (studio, warnings, milestones) show under All as "Studio".
CONTENT.NEWS = {
  filters: [
    { id: 'release', name: 'Release' },
    { id: 'market', name: 'Market' },
    { id: 'stars', name: 'Stars' },
    { id: 'rivals', name: 'Rivals' },
    { id: 'economy', name: 'Economy' },
    { id: 'awards', name: 'Awards' },
    { id: 'staff', name: 'Staff' }
  ],
  typeMap: { release: 'release', festival: 'release', tv: 'release', market: 'market', star: 'stars', contract: 'stars', rival: 'rivals',
    finance: 'economy', economy: 'economy', era: 'economy', award: 'awards', staff: 'staff' },
  catMap: { industry: 'market', economic: 'economy', talent: 'stars' },
  hidden: ['project', 'decision'],
  hiddenCats: ['production']   // production-event results have no context on their own
};

// ===== SECTION: FESTIVALS =====
// Fictional short-film festivals.
CONTENT.FESTIVALS = ['Lakeshore Shorts Festival', 'Red Mesa Film Festival', 'Harbor City Short Film Fest', 'Northfield Independent Showcase', 'Silver Pine Festival'];

// ===== SECTION: DECISIONS =====
// Random production decisions. stage: 'development' | 'shoot'. formats: optional limit.
// effects keys (engine-defined): quality, hype, costPct (share of budget), weeks (delay), fame.
// {title} is replaced with the project title. More production events live in EVENTS (category 'production').
CONTENT.DECISIONS = [
  { id: 'dev_rewrite', stage: 'development', text: 'The third act of "{title}" isn\'t working.',
    choices: [
      { label: 'Full rewrite', effects: { quality: 5, weeks: 2 }, result: 'You rewrote the third act of "{title}".' },
      { label: 'Polish what\'s there', effects: { quality: 2, costPct: 0.02 }, result: 'A quick polish tightened "{title}".' },
      { label: 'Shoot it as written', effects: {}, result: '"{title}" goes ahead as written.' }
    ] },
  { id: 'dev_bold', stage: 'development', text: 'A friend suggests a bolder, stranger take on "{title}".',
    choices: [
      { label: 'Go bold', effects: { quality: 4, hype: -3 }, result: '"{title}" takes a riskier, artier direction.' },
      { label: 'Keep it commercial', effects: { hype: 4, quality: -1 }, result: '"{title}" stays crowd-friendly.' }
    ] },
  { id: 'dev_producer', stage: 'development', text: 'A local backer offers to cover part of "{title}" if you add a car chase.',
    choices: [
      { label: 'Take the money', effects: { costPct: -0.15, quality: -3 }, result: 'The backer paid in. "{title}" now has a car chase.' },
      { label: 'Decline', effects: {}, result: 'You turned down the backer.' }
    ] },
  { id: 'dev_title', stage: 'development', text: 'Test readers find the title "{title}" forgettable.',
    choices: [
      { label: 'Rework the pitch', effects: { hype: 3, weeks: 1 }, result: 'A sharper pitch gives "{title}" some buzz.' },
      { label: 'Keep it', effects: {}, result: 'You kept the pitch for "{title}" as is.' }
    ] },
  { id: 'dev_research', stage: 'development', text: 'A week of research could deepen "{title}".',
    choices: [
      { label: 'Do the research', effects: { quality: 3, weeks: 1 }, result: 'The research gave "{title}" more texture.' },
      { label: 'Skip it', effects: {}, result: 'You skipped the research and pressed on.' }
    ] },
  { id: 'dev_friend', stage: 'development', text: 'An old friend offers to star in "{title}" cheaply if you build the part around them.',
    choices: [
      { label: 'Cast your friend', effects: { costPct: -0.05, quality: -2 }, result: 'Your friend is in, and the budget is lighter.' },
      { label: 'Hold auditions', effects: { quality: 1, weeks: 1 }, result: 'Auditions found a stronger fit.' }
    ] },
  { id: 'shoot_weather', stage: 'shoot', text: 'Heavy rain has flooded the set of "{title}".',
    choices: [
      { label: 'Wait it out', effects: { weeks: 1 }, result: 'The "{title}" shoot paused for the rain.' },
      { label: 'Shoot in the rain', effects: { quality: -3, hype: 2 }, result: 'The crew shot "{title}" in the downpour.' },
      { label: 'Move the scene indoors', effects: { quality: -1, costPct: 0.03 }, result: 'The scene moved indoors.' }
    ] },
  { id: 'shoot_reshoot', stage: 'shoot', text: 'You\'re unhappy with yesterday\'s key scene of "{title}".',
    choices: [
      { label: 'Reshoot it', effects: { quality: 4, weeks: 1, costPct: 0.05 }, result: 'The reshoot paid off.' },
      { label: 'Fix it in the edit', effects: { quality: -2 }, result: 'You\'ll fix it in the edit.' }
    ] },
  { id: 'shoot_overbudget', stage: 'shoot', text: '"{title}" is running over budget.',
    choices: [
      { label: 'Cut a scene', effects: { quality: -3 }, result: 'A scene was cut to stay on budget.' },
      { label: 'Spend 10% more', effects: { costPct: 0.10 }, result: 'You paid to keep every scene.' }
    ] },
  { id: 'shoot_accident', stage: 'shoot', text: 'Happy accident: a supporting actor improvises a brilliant moment.',
    choices: [
      { label: 'Expand the role', effects: { quality: 4, weeks: 1 }, result: 'The role grew. "{title}" is better for it.' },
      { label: 'Keep it small', effects: { quality: 2 }, result: 'The moment stays in, small but sharp.' }
    ] },
  { id: 'shoot_equipment', stage: 'shoot', text: 'The camera breaks down mid-shoot.',
    choices: [
      { label: 'Rent a replacement', effects: { costPct: 0.04 }, result: 'A rental camera kept the shoot moving.' },
      { label: 'Lose a week repairing', effects: { weeks: 1 }, result: 'The shoot lost a week to repairs.' }
    ] },
  { id: 'shoot_lead_demand', stage: 'shoot', text: 'Your lead demands a rewrite of their big scene in "{title}".',
    choices: [
      { label: 'Agree', effects: { quality: -1, hype: 3 }, result: 'The lead got their way and talks the film up.' },
      { label: 'Refuse', effects: { quality: 1, hype: -2 }, result: 'You held firm. The lead sulks.' },
      { label: 'Work it out together', effects: { quality: 2, weeks: 1 }, result: 'A compromise improved the scene.' }
    ] },
  { id: 'shoot_press', stage: 'shoot', text: 'A local newspaper wants to visit the set of "{title}".',
    choices: [
      { label: 'Invite them', effects: { hype: 5, quality: -1 }, result: 'The visit made the local paper.' },
      { label: 'Keep the set closed', effects: {}, result: 'The set stayed closed.' }
    ] },
  { id: 'shoot_leak', stage: 'shoot', formats: ['feature'], text: 'Script pages from "{title}" leaked to the trades.',
    choices: [
      { label: 'Lean into the buzz', effects: { hype: 4 }, result: 'The leak turned into free publicity.' },
      { label: 'Rewrite the twist', effects: { quality: 1, weeks: 1 }, result: 'You rewrote the twist.' }
    ] },
  { id: 'shoot_location', stage: 'shoot', text: 'A farm owner offers a free location for "{title}", but it\'s a long drive.',
    choices: [
      { label: 'Use the farm', effects: { costPct: -0.03, quality: -1 }, result: 'The farm saved money but cost some polish.' },
      { label: 'Rent a studio', effects: { quality: 1, costPct: 0.03 }, result: 'A rented studio kept things controlled.' }
    ] },
  { id: 'shoot_crew', stage: 'shoot', text: 'Your sound recordist quits mid-shoot on "{title}".',
    choices: [
      { label: 'Hire a replacement', effects: { costPct: 0.04 }, result: 'A pricey replacement saved the sound.' },
      { label: 'Record it yourself', effects: { quality: -2 }, result: 'You recorded it yourself. It shows.' }
    ] },
  { id: 'shoot_cameo', stage: 'shoot', text: 'A local TV personality wants a cameo in "{title}".',
    choices: [
      { label: 'Allow it', effects: { hype: 4, quality: -1, fame: 1 }, result: 'The cameo got some attention.' },
      { label: 'Decline', effects: {}, result: 'You politely declined the cameo.' }
    ] },
  { id: 'shoot_night', stage: 'shoot', text: 'A night shoot would look great, but the crew is exhausted.',
    choices: [
      { label: 'Push on', effects: { quality: 3, costPct: 0.02 }, result: 'The night shoot looks stunning.' },
      { label: 'Stick to the schedule', effects: {}, result: 'The crew got their rest.' }
    ] },
  { id: 'dev_ending', stage: 'development', text: 'The ending of "{title}" tests well with critics but confuses the preview audience.',
    choices: [
      { label: 'Keep the unusual ending', effects: { quality: 3, hype: -2 }, result: 'You defended the unusual ending of "{title}".' },
      { label: 'Clarify the final scene', effects: { quality: 1, weeks: 1 }, result: 'The new ending is clearer without losing its heart.' }
    ] },
  { id: 'dev_location', stage: 'development', text: 'A striking real-world location could give "{title}" a unique visual identity.',
    choices: [
      { label: 'Scout and secure the location', effects: { quality: 3, costPct: 0.04 }, result: 'Location scouting gave "{title}" a strong visual signature.' },
      { label: 'Build a simpler set', effects: { costPct: -0.03, quality: -1 }, result: 'A practical set kept costs predictable.' }
    ] },
  { id: 'dev_theme', stage: 'development', text: 'The writers disagree about how openly "{title}" should explore its central theme.',
    choices: [
      { label: 'Push the theme to the foreground', effects: { quality: 3, hype: -1 }, result: 'The material has a sharper point of view.' },
      { label: 'Let the audience read between the lines', effects: { hype: 2 }, result: 'The film aims for a broader interpretation.' }
    ] },
  { id: 'dev_testread', stage: 'development', text: 'An early table read of "{title}" reveals an unexpected comic scene.',
    choices: [
      { label: 'Expand the scene', effects: { hype: 3, weeks: 1 }, result: 'The extra scene gives audiences a memorable moment.' },
      { label: 'Protect the tone', effects: { quality: 2 }, result: 'You kept the story on the track you intended.' }
    ] },
  { id: 'dev_mentor', stage: 'development', text: 'A veteran director offers informal notes on the script for "{title}".',
    choices: [
      { label: 'Invite a full script review', effects: { costPct: 0.03, quality: 3 }, result: 'Experienced eyes improved the script.' },
      { label: 'Take one quick note', effects: { quality: 1 }, result: 'A small suggestion helped without slowing the project.' }
    ] },
  { id: 'shoot_lateunit', stage: 'shoot', text: 'The night shoot for "{title}" is running behind as the crew tires.',
    choices: [
      { label: 'Schedule another night', effects: { weeks: 1, quality: 2 }, result: 'A rested crew captured the shot properly.' },
      { label: 'Finish before sunrise', effects: { quality: -2, hype: 2 }, result: 'The footage is rough but intense.' }
    ] },
  { id: 'shoot_stunt', stage: 'shoot', text: 'The crew finds a safer but less spectacular way to film a difficult sequence.',
    choices: [
      { label: 'Use the safer approach', effects: { quality: 1 }, result: 'The sequence is elegant and finished on time.' },
      { label: 'Bring in specialists', effects: { costPct: 0.07, hype: 3 }, result: 'The specialist crew delivered a showpiece.' }
    ] },
  { id: 'shoot_dailies', stage: 'shoot', text: 'The dailies from "{title}" reveal a supporting performance that steals every scene.',
    choices: [
      { label: 'Give the actor more room', effects: { quality: 3, weeks: 1 }, result: 'The supporting role grew into a highlight.' },
      { label: 'Keep the lead in focus', effects: { quality: 1, hype: 1 }, result: 'You protected the film\'s central performance.' }
    ] },
  { id: 'shoot_sound', stage: 'shoot', text: 'Street noise is interfering with dialogue on the "{title}" set.',
    choices: [
      { label: 'Record again in controlled conditions', effects: { costPct: 0.04, quality: 2 }, result: 'Clean audio saved the performances.' },
      { label: 'Use the authentic street sound', effects: { quality: -1, hype: 1 }, result: 'The scene kept its rough energy.' }
    ] },
  { id: 'dev_star_or_script', stage: 'development', text: 'Publicists want a bigger-name cameo in "{title}", but the writer believes that money belongs on the page.',
    choices: [
      { label: 'Pay for the cameo', effects: { costPct: 0.08, hype: 5, quality: -1 }, result: 'The name attracted press, but stole focus from the story.' },
      { label: 'Strengthen the screenplay', effects: { costPct: 0.03, quality: 4, hype: -1 }, result: 'The team put its resources into a stronger script.' },
      { label: 'Stay within the original plan', effects: {}, result: 'You kept the project on its planned course.' }
    ] },
  { id: 'dev_new_voice', stage: 'development', text: 'A lesser-known creative voice offers an unconventional interpretation of "{title}".',
    choices: [
      { label: 'Trust the unconventional approach', effects: { quality: 4, hype: -2, weeks: 1 }, result: 'The fresh approach made "{title}" more distinctive.' },
      { label: 'Keep familiar broad appeal', effects: { hype: 3, quality: -1 }, result: 'The film stayed familiar and easier to market.' },
      { label: 'Combine both approaches', effects: { quality: 1, hype: 1, costPct: 0.03 }, result: 'The creative team found a compromise.' }
    ] },
  { id: 'shoot_celebrity_press', stage: 'shoot', text: 'A cast member of "{title}" draws a crowd of reporters to the set.',
    choices: [
      { label: 'Stage a publicity day', effects: { hype: 5, quality: -2 }, result: 'The press loved the access, but filming lost focus.' },
      { label: 'Protect the performances', effects: { quality: 2, hype: -1 }, result: 'The crew preserved momentum and protected the scenes.' },
      { label: 'Schedule a small press window', effects: { costPct: 0.02, quality: 1, hype: 2 }, result: 'Publicity was contained to a brief, organized visit.' }
    ] },
  { id: 'shoot_performance_take', stage: 'shoot', text: 'An emotionally demanding scene in "{title}" is believable but could become exceptional with another day.',
    choices: [
      { label: 'Give the scene another day', effects: { quality: 4, weeks: 1, costPct: 0.03 }, result: 'The additional rehearsal delivered a standout performance.' },
      { label: 'Preserve the raw first take', effects: { quality: 1, hype: 1 }, result: 'The original performance kept its spontaneous intensity.' },
      { label: 'Move forward to protect the budget', effects: { costPct: -0.02, quality: -2 }, result: 'The studio stayed on budget but left potential on the table.' }
    ] },
  { id: 'shoot_light', stage: 'shoot', text: 'A sudden change in light makes the planned shot for "{title}" impossible.',
    choices: [
      { label: 'Rework the scene', effects: { quality: 2, weeks: 1 }, result: 'The reworked scene is stronger than planned.' },
      { label: 'Shoot a simpler version', effects: { quality: -1 }, result: 'The team got the scene in the can.' }
    ] }
];

// ===== SECTION: FIXED_DECISIONS =====
// Decisions every project gets at a set point.
CONTENT.FIXED_DECISIONS = {
  cut: { id: 'cut', text: 'Final cut of "{title}": your version runs long, and a test audience preferred a tighter cut.',
    choices: [
      { label: 'Director\'s cut', effects: { quality: 3, hype: -3 }, result: 'You locked the director\'s cut of "{title}".' },
      { label: 'Test-audience cut', effects: { hype: 4, quality: -1 }, result: 'You locked the tighter cut of "{title}".' },
      { label: 'Split the difference', effects: { quality: 2, hype: 2, weeks: 1 }, result: 'A balanced cut of "{title}" took an extra week.' }
    ] }
};

// ===== SECTION: STUDIO_SIZES =====
// Names for engine.js TUNING.economy.sizes, same order (index = size level). Display only.
CONTENT.STUDIO_SIZES = ['Garage', 'Rented office', 'Small studio', 'Sound stage', 'Studio lot', 'Major lot'];

// ===== SECTION: MARKET =====
// Seasons by week of the year (1–52). Box office multipliers live in engine.js TUNING.market.
CONTENT.SEASONS = [
  { id: 'winter', name: 'Winter lull', from: 1, to: 8 },
  { id: 'spring', name: 'Spring', from: 9, to: 21 },
  { id: 'summer', name: 'Summer season', from: 22, to: 35 },
  { id: 'fall', name: 'Fall', from: 36, to: 46 },
  { id: 'holiday', name: 'Holiday season', from: 47, to: 52 }
];
CONTENT.CYCLES = {
  boom: { name: 'Boom', blurb: 'Money is flowing and audiences are spending.' },
  normal: { name: 'Steady', blurb: 'The economy has settled down.' },
  recession: { name: 'Recession', blurb: 'Audiences are cutting back on tickets.' }
};
// {genre} = genre name.
CONTENT.MARKET_TEXT = {
  hot: '{genre} is suddenly the hottest ticket in town.',
  cold: 'Audiences are tired of {genre}.'
};

// ===== SECTION: REVENUE_WINDOWS =====
// After a feature leaves theaters it earns from each window open in that year. Shares and timing live in engine.js TUNING.windows.
CONTENT.REVENUE_WINDOWS = [
  { id: 'tvrights', name: 'TV broadcast rights', start: 1970, end: null },
  { id: 'video', name: 'Home video', start: 1980, end: 2015 },
  { id: 'streaming', name: 'Streaming', start: 2010, end: null }
];

// ===== SECTION: GROWTH_TIERS =====
// Names and blurbs for engine.js TUNING.growth, same order. Numbers (cost, capacity, roster…) come from the engine.
CONTENT.GROWTH_TIERS = [
  { name: 'Solo', desc: 'You, a camera and short films.' },
  { name: 'Indie', desc: 'Feature films, TV pilots and your first staff departments.' },
  { name: 'Mid studio', desc: 'Big-budget features and a larger slate.' },
  { name: 'Major', desc: 'Blockbusters and your own distribution arm.' },
  { name: 'Franchise empire', desc: 'Tentpoles and a theater chain.' }
];

// ===== SECTION: STAFF_DEPTS =====
CONTENT.STAFF_DEPTS = [
  { id: 'development', name: 'Development', desc: 'Script readers and story editors. Raises film quality.' },
  { id: 'production', name: 'Production', desc: 'Line producers and coordinators. Fewer shoot delays.' },
  { id: 'marketing', name: 'Marketing', desc: 'Publicists and ad buyers. Raises hype.' },
  { id: 'distribution', name: 'Distribution', desc: 'Booking agents. Raises box office.' }
];
// Strike decision. {dept} = department name. effects keys read by engine.js: pay (pay level change), morale, strike (weeks), fire (share of staff), fame.
CONTENT.STRIKE_EVENT = {
  text: 'The {dept} department walks out over pay and conditions.',
  choices: [
    { label: 'Meet their demands', effects: { pay: 0.15, morale: 25 }, result: 'You raised pay in {dept}. They are back at work.' },
    { label: 'Wait them out', effects: { strike: 4, morale: 10 }, result: '{dept} is on strike for 4 weeks.' },
    { label: 'Fire the organizers', effects: { fire: 0.3, morale: -10, fame: -2 }, result: 'You fired the organizers in {dept}. The press noticed.' }
  ]
};

// ===== SECTION: RIVALS =====
// Phase 5. Fictional rival studio names and strategy text. Numbers (budgets, odds) live in engine.js TUNING.rivals.
CONTENT.RIVAL_NAMES = ['Paragon Pictures', 'Silverline Studios', 'Northstar Films', 'Crescent Pictures', 'Ironwood Studios', 'Bluebird Pictures',
  'Meridian Films', 'Lantern House', 'Redwater Pictures', 'Golden Gate Studios', 'Harborlight Films', 'Summit Pictures',
  'Cobalt Studios', 'Pinecrest Pictures', 'Orchard Films', 'Driftwood Pictures', 'Beacon Street Films', 'Copperhead Studios',
  'Starling Pictures', 'Monarch Films', 'Highwater Studios', 'Foxglove Pictures', 'Granite Peak Films', 'Velvet Reel Studios',
  'Saffron Cinema', 'Blackwell Studios', 'Windmill Films', 'Midnight Harbor Pictures', 'Valley Road Motion', 'Broadleaf Productions',
  'Halcyon Pictures', 'Paper Lantern Films', 'Sunset Square Studios', 'Canyon Ridge Films', 'Willow & Stone', 'Polaris Filmworks',
  'Starlane Studios', 'Atlas Independent', 'Rosewater Cinema', 'Cinderblock Films', 'The Seventh Frame', 'Glasshouse Pictures',
  'Thistle Road Films', 'Frontier Gate', 'Rainfall Motion', 'Blue Hour Cinema', 'Redwood Screen', 'Silver Orbit',
  'Highland Republic Films', 'Daybreak Pictures', 'Westhaven Motion', 'Orchid Gate Studios'];
// genres: genres the strategy prefers (trend chasers pick from the hottest genres instead).
CONTENT.RIVAL_STRATEGIES = [
  { id: 'blockbuster', name: 'Blockbuster', desc: 'Big budgets and spectacle, aimed at summer and the holidays.', genres: ['action', 'scifi', 'comedy'] },
  { id: 'prestige', name: 'Prestige', desc: 'Mid budgets, serious films, fall and holiday dates.', genres: ['drama', 'documentary', 'western', 'thriller'] },
  { id: 'cheap', name: 'Cheap genre', desc: 'Many low-budget films in crowd-pleasing genres.', genres: ['horror', 'comedy', 'thriller'] },
  { id: 'trend', name: 'Trend chaser', desc: 'Makes whatever genre is hot right now.', genres: [] }
];
// Placeholders: {rival} studio, {name} talent, {title} film, {mine} your film, {genre}, {budget}, {gross}, {salary}, {years}, {tier}, {old}, {new}, {why}.
CONTENT.RIVAL_TEXT = {
  switchTrend: '{rival} drops its {old} strategy after another losing quarter and starts chasing trends.',
  revert: '{rival} is back in the black and returns to its {new} strategy.',
  grow: '{rival} expands into a {tier} studio.',
  shrink: '{rival} sells assets and shrinks to a {tier} studio.',
  bankrupt: '{rival} has gone bankrupt. Its slate is cancelled and its contracted talent are free agents.',
  upstart: 'A new studio opens its doors: {rival} ({new}).',
  opens: '{rival} opens "{title}" ({genre}, {budget}) this week.',
  hit: '{rival}\'s "{title}" is a hit: {gross} gross.',
  moved: '{rival} moved "{title}" away from your release of "{mine}".',
  holds: '{rival} is holding "{title}" ({genre}) on the same weekend as "{mine}". Expect a fight for the same audience.',
  poach: '{rival} is offering {name} {salary}/week for {years} years to leave your studio. {why}',
  whyExpiring: 'Their contract with you is about to run out.',
  whyUnhappy: 'They are unhappy with their deal.',
  stays: '{name} turns down {rival} and stays on a new deal ({salary}/week).',
  leaves: '{name} signs with {rival}.',
  leavesAfter: '{name} signs with {rival}, after finishing "{title}" for you.',
  refused: '{name} took the {rival} offer anyway.',
  cantPay: 'You couldn\'t cover the bonus. {name} signs with {rival}.',
  gone: '{name} is no longer on your roster. The offer lapses.',
  withdrawn: '{rival} withdrew its offer to {name}.'
};

// ===== SECTION: SCORE =====
// Labels and text for the run score. Ids in `parts` match the keys of Engine.scoreInfo().parts.
// text: {year} {score} {studio} {rank} are filled in by the engine.
CONTENT.SCORE = {
  parts: [
    { id: 'profit', name: 'Profit', desc: 'Cash minus debt, minus your starting money. Counted on a log scale: every ×10 adds the same number of points.' },
    { id: 'awards', name: 'Awards', desc: 'Ceremony wins and nominations (Best Picture counts extra) and festival prizes and selections for your features. More awards help less and less.' },
    { id: 'fame', name: 'Fame', desc: 'Studio fame, 0–100.' },
    { id: 'reputation', name: 'Reputation', desc: 'Critics reputation, rolling five-year current prestige, and a modest permanent legacy contribution.' },
    { id: 'hits', name: 'Hits', desc: 'Features that finish as a Hit and TV shows that last several seasons. More hits help less and less.' }
  ],
  text: {
    locked: 'The end of {year} has passed. Final score: {score}. The score is locked; play continues.',
    bankrupt: '{studio} ends its run in {year} with a score of {score}.',
    rank: 'Rank {rank} on this device.'
  }
};
