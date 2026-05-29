/* ═══════════════════════════════════════════════════════════════
   VIRTUAL PET SIMULATOR — game.js
   All game logic, state, tick engine, and render functions.
   ═══════════════════════════════════════════════════════════════ */

/* ── 1. Utils ─────────────────────────────────────────────────── */
const CL  = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(v)));
const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
let _id = 0;
const uid = () => ++_id;

/* ── 2. Pet Types ─────────────────────────────────────────────── */
const PT = {
  Dog: {
    abbr:'DOG', evo:'WOLF',
    bg:'#0d2118', fg:'#3fb950', ebg:'#1a2810', efg:'#7ee050',
    decay:{ hunger:2, energy:2, hp:0 },
    atk:12, def:8, spd:10,
    mood:{ healthy:'😄', sad:'😢', sick:'🤒', starving:'😩', exhausted:'😴', dead:'💀' },
    special: n => ({ msg:`${n} fetches and leaps with joy!`, stat:'happiness', v:14 }),
  },
  Cat: {
    abbr:'CAT', evo:'LYNX',
    bg:'#1a1040', fg:'#a371f7', ebg:'#200e3a', efg:'#d090ff',
    decay:{ hunger:2, energy:1, hp:0 },
    atk:8, def:12, spd:14,
    mood:{ healthy:'😸', sad:'😿', sick:'🤒', starving:'😩', exhausted:'😴', dead:'💀' },
    special: n => ({ msg:`${n} purrs and kneads softly`, stat:'energy', v:12 }),
  },
  Fish: {
    abbr:'FISH', evo:'LEVIA',
    bg:'#0d1a2d', fg:'#58a6ff', ebg:'#081830', efg:'#00d8ff',
    decay:{ hunger:1, energy:1, hp:0 },
    atk:7, def:10, spd:8,
    mood:{ healthy:'🐠', sad:'😔', sick:'🤢', starving:'😩', exhausted:'😴', dead:'💀' },
    special: n => ({ msg:`${n} blows perfect bubble rings`, stat:'happiness', v:9 }),
  },
  Dragon: {
    abbr:'DRG', evo:'ELDER',
    bg:'#2a1808', fg:'#f0965a', ebg:'#3a1000', efg:'#ff6020',
    decay:{ hunger:3, energy:2, hp:0 },
    atk:22, def:14, spd:9,
    mood:{ healthy:'🐲', sad:'😞', sick:'🤒', starving:'😩', exhausted:'😴', dead:'💀' },
    special: n => ({ msg:`${n} breathes a cheerful flame!`, stat:'happiness', v:20 }),
  },
  Bunny: {
    abbr:'BUN', evo:'HARE',
    bg:'#2a0820', fg:'#f050a0', ebg:'#2a0830', efg:'#ff80c0',
    decay:{ hunger:2, energy:1, hp:0 },
    atk:9, def:7, spd:18,
    mood:{ healthy:'🐰', sad:'😢', sick:'🤒', starving:'😩', exhausted:'😴', dead:'💀' },
    special: n => ({ msg:`${n} does joyful binkies!`, stat:'happiness', v:16 }),
  },
};

/* ── 3. Traits ────────────────────────────────────────────────── */
const TRAITS = {
  Playful:    { playHappBonus:8,  playCostMod:3,  hungerMod:0,  restBonus:0,  feedMod:0,  atkMod:2, defMod:0,  col:'#e3b341' },
  Lazy:       { playHappBonus:0,  playCostMod:-3, hungerMod:-1, restBonus:12, feedMod:0,  atkMod:0, defMod:4,  col:'#58a6ff' },
  Gluttonous: { playHappBonus:0,  playCostMod:0,  hungerMod:1,  restBonus:0,  feedMod:-8, atkMod:5, defMod:-2, col:'#f0965a' },
};

/* ── 4. Items ─────────────────────────────────────────────────── */
const ITEMS = {
  medicine: { name:'Medicine',     icon:'fa-pills',  cost:25, desc:'+20 HP  |  +50 HP when Sick' },
  premFood: { name:'Prime Feast',  icon:'fa-burger', cost:15, desc:'−55 Hunger  +10 Happiness'   },
  drink:    { name:'Energy Drink', icon:'fa-bolt',   cost:18, desc:'+45 Energy instantly'         },
  toy:      { name:'Fun Toy',      icon:'fa-gift',   cost:12, desc:'+32 Happiness  −12 Energy'   },
};

/* ── 5. Weather ───────────────────────────────────────────────── */
const WEATHERS = [
  { key:'sunny', name:'Sunny Day',    icon:'fa-sun',             col:'#e3b341',
    eff: p => ({ energy: CL(p.energy+5), happiness: CL(p.happiness+(p.type==='Dog'?7:3)) }) },
  { key:'rainy', name:'Rainy',        icon:'fa-cloud-rain',      col:'#58a6ff',
    eff: p => ({ happiness: CL(p.happiness+(p.type==='Dog'?4:-5)), health: CL(p.health+(p.type==='Fish'?2:0)) }) },
  { key:'storm', name:'Thunderstorm', icon:'fa-cloud-bolt',      col:'#f85149',
    eff: p => ({ happiness: CL(p.happiness-8), energy: CL(p.energy-3) }) },
  { key:'heat',  name:'Heatwave',     icon:'fa-temperature-full',col:'#f0965a',
    eff: p => ({ energy: CL(p.energy+(p.type==='Dragon'?4:-5)), happiness: CL(p.happiness+(p.type==='Dragon'?8:-4)) }) },
  { key:'snow',  name:'Snowfall',     icon:'fa-snowflake',       col:'#a371f7',
    eff: p => ({ happiness: CL(p.happiness+(p.type==='Bunny'?8:-3)), health: CL(p.health+(p.type==='Fish'?-4:0)) }) },
  { key:'wind',  name:'Windy',        icon:'fa-wind',            col:'#3fb950',
    eff: p => ({ happiness: CL(p.happiness+(p.type==='Dog'||p.type==='Dragon'?5:-2)) }) },
];

/* ── 6. Achievements ──────────────────────────────────────────── */
const ACHS = {
  firstAdopt:   { name:'First Friend',    desc:'Adopt your first pet',           icon:'fa-heart' },
  fullHouse:    { name:'Full House',      desc:'Own 3 pets at once',              icon:'fa-house' },
  guardian:     { name:'Guardian Angel',  desc:'Heal a Sick pet with Medicine',   icon:'fa-shield-halved' },
  richOwner:    { name:'Coin Hoarder',    desc:'Accumulate 200+ coins',           icon:'fa-coins' },
  survivor50:   { name:'Survivor',        desc:'Keep a pet alive 50+ ticks',      icon:'fa-shield' },
  petWhisperer: { name:'Pet Whisperer',   desc:'A pet reaches 95 happiness',      icon:'fa-star' },
  dragonTamer:  { name:'Dragon Tamer',    desc:'Own a Dragon',                    icon:'fa-fire' },
  levelThree:   { name:'Growing Up',      desc:'Level any pet to Lv 3',           icon:'fa-arrow-trend-up' },
  firstEvo:     { name:'Evolved!',        desc:'Evolve a pet to final form',      icon:'fa-dna' },
  battleWin:    { name:'Gladiator',       desc:'Win your first battle',           icon:'fa-trophy' },
  battleStreak: { name:'Undefeated',      desc:'Win 3 battles in a row',          icon:'fa-medal' },
};

/* ── 7. Random events (10% chance, gentle magnitudes) ────────── */
const EVENTS = [
  { msg: n=>`${n} chased a butterfly`,            stat:'happiness', v:7,   good:true  },
  { msg: n=>`${n} found a hidden snack`,           stat:'hunger',   v:-10, good:true  },
  { msg: n=>`${n} got spooked`,                    stat:'happiness', v:-6,  good:false },
  { msg: n=>`${n} took a cozy nap`,               stat:'energy',   v:8,   good:true  },
  { msg: n=>`${n} got a tummy ache`,              stat:'health',   v:-5,  good:false },
  { msg: n=>`${n} made a new friend`,             stat:'happiness', v:9,   good:true  },
  { msg: n=>`${n} slipped on wet grass`,          stat:'health',   v:-4,  good:false },
  { msg: n=>`${n} found a sunny patch`,           stat:'energy',   v:7,   good:true  },
  { msg: n=>`${n} got into a scuffle`,            stat:'health',   v:-7,  good:false },
  { msg: n=>`${n} discovered a new hiding spot`,  stat:'happiness', v:8,   good:true  },
];

/* ── 8. Constants ─────────────────────────────────────────────── */
const SPEEDS   = { slow:7000, normal:4000, fast:1800 };
const USERS    = [{ id:1, name:'Alice' }, { id:2, name:'Bob' }, { id:3, name:'Charlie' }, { id:4, name:'Diana' }];
const TK       = Object.keys(TRAITS);
const EVO_LV   = 5;
const SAVE_KEY = 'vps_slot_';
const NUM_SLOTS = 3;

/* ── 9. State ─────────────────────────────────────────────────── */
function mkPet(name, type, ownerId = null) {
  return {
    id: uid(), name, type,
    trait: TK[Math.floor(Math.random() * TK.length)],
    health:100, happiness:55, hunger:25, energy:75,
    age:0, xp:0, level:1, evolved:false, ownerId,
    history: { health:[100], happiness:[55], energy:[75], hunger:[25] },
    wins:0, losses:0, winStreak:0,
  };
}

let pool = [
  mkPet('Buddy','Dog'),  mkPet('Rex','Dog'),    mkPet('Spot','Dog'),  mkPet('Max','Dog'),   mkPet('Ranger','Dog'),
  mkPet('Luna','Cat'),   mkPet('Mochi','Cat'),  mkPet('Shadow','Cat'),mkPet('Miso','Cat'),
  mkPet('Nemo','Fish'),  mkPet('Bubbles','Fish'),mkPet('Splash','Fish'),
  mkPet('Ember','Dragon'),mkPet('Cinder','Dragon'),
  mkPet('Cotton','Bunny'),mkPet('Daisy','Bunny'),mkPet('Pebble','Bunny'),
];
let pets = [];
const inv = {};

USERS.forEach(u => {
  inv[u.id] = { medicine:2, premFood:1, drink:1, toy:2, coins:60 };
  for (let j = 0; j < 2 && pool.length; j++) {
    const p = pool.shift();
    pets.push({ ...p, ownerId: u.id });
  }
});

const S = {
  su: 1,
  sp: pets.find(p => p.ownerId === 1)?.id || null,
  logs: [],
  tick: 0,
  paused: false,
  rp: 'log',
  speed: 'normal',
  weather: null,
  nextWeather: 8,
  ach: new Set(),
  renaming: null,
  battle: { active:false, a:null, b:null, log:[], result:null },
  prevStats: {},
  slotMode: null, // 'save' | 'load'
};

/* ── 10. Log ──────────────────────────────────────────────────── */
function lg(msg, type = 'neutral') {
  S.logs = [{ id:uid(), msg, type }, ...S.logs].slice(0, 150);
}
lg('Welcome to Virtual Pet Simulator!', 'sys');

/* ── 11. State helpers ────────────────────────────────────────── */
function gst(p) {
  if (p.health <= 0)     return 'dead';
  if (p.health < 25)     return 'sick';
  if (p.hunger > 80)     return 'starving';
  if (p.energy < 10)     return 'exhausted';
  if (p.happiness < 15)  return 'sad';
  return 'healthy';
}

const ST_UI = {
  dead:      { l:'Dead',      c:'pill-r' },
  sick:      { l:'Sick',      c:'pill-r' },
  starving:  { l:'Starving',  c:'pill-a' },
  exhausted: { l:'Exhausted', c:'pill-a' },
  sad:       { l:'Sad',       c:'pill-b' },
  healthy:   { l:'Healthy',   c:'pill-g' },
};

function myPets()  { return pets.filter(p => p.ownerId === S.su); }
function getSel()  {
  let p = pets.find(p => p.id === S.sp && p.ownerId === S.su);
  if (!p) { p = myPets()[0] || null; S.sp = p?.id || null; }
  return p;
}
function upd(id, fn) { pets = pets.map(p => p.id === id ? { ...p, ...fn(p) } : p); }
function xpNeed(lv) { return 100 + lv * 50; }

/* ── 12. Toast ────────────────────────────────────────────────── */
function toast(msg, type = 'neutral', dur = 2800) {
  const rack = document.getElementById('toast-rack');
  if (!rack) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  rack.appendChild(el);
  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 220);
  }, dur);
}

/* ── 13. XP + Level-up + Evolution ───────────────────────────── */
function grantXP(pid, amt) {
  upd(pid, p => {
    if (!p.ownerId) return p;
    const nx = p.xp + amt, need = xpNeed(p.level);
    if (nx >= need) {
      const nl = p.level + 1;
      inv[p.ownerId].coins = Math.min(9999, (inv[p.ownerId].coins || 0) + 25);
      if (nl >= EVO_LV && !p.evolved) {
        const t = PT[p.type];
        const msg = `✦ ${p.name} evolved into ${t.evo}! +20HP +15Hap +15Nrg.`;
        lg(msg, 'sys'); toast(msg, 'sys', 4500);
        inv[p.ownerId].coins = Math.min(9999, inv[p.ownerId].coins + 50);
        earnAch('firstEvo');
        return { xp:nx-need, level:nl, evolved:true,
          health:CL(p.health+20), happiness:CL(p.happiness+15), energy:CL(p.energy+15) };
      }
      const msg = `${p.name} reached Level ${nl}! +10HP +8Hap +5Nrg.`;
      lg(msg, 'sys'); toast(msg, 'sys', 3500);
      return { xp:nx-need, level:nl,
        health:CL(p.health+10), happiness:CL(p.happiness+8), energy:CL(p.energy+5) };
    }
    return { xp: nx };
  });
}

/* ── 14. Achievements ─────────────────────────────────────────── */
function earnAch(k) {
  if (S.ach.has(k)) return;
  S.ach.add(k);
  const msg = `🏆 Achievement: "${ACHS[k].name}"!`;
  lg(msg, 'sys'); toast(msg, 'sys', 4000);
}
function checkAch() {
  const ow = pets.filter(p => p.ownerId);
  if (ow.length > 0) earnAch('firstAdopt');
  if (USERS.some(u => pets.filter(p => p.ownerId === u.id).length >= 3)) earnAch('fullHouse');
  if (Object.values(inv).some(i => i.coins >= 200)) earnAch('richOwner');
  if (ow.some(p => p.happiness >= 95)) earnAch('petWhisperer');
  if (ow.some(p => p.type === 'Dragon')) earnAch('dragonTamer');
  if (ow.some(p => p.age >= 50)) earnAch('survivor50');
  if (ow.some(p => p.level >= 3)) earnAch('levelThree');
  if (ow.some(p => p.evolved)) earnAch('firstEvo');
  if (ow.some(p => p.wins >= 1)) earnAch('battleWin');
  if (ow.some(p => p.winStreak >= 3)) earnAch('battleStreak');
}

/* ── 15. Battle engine ────────────────────────────────────────── */
function startBattle(aid, bid) {
  const pa = pets.find(p => p.id === aid), pb = pets.find(p => p.id === bid);
  if (!pa || !pb) return;
  S.battle = { active:true, a:aid, b:bid, log:[], result:null };
  S.rp = 'battle';
  updateMobileNav();

  const ta = PT[pa.type], tb = PT[pb.type];
  const tra = TRAITS[pa.trait], trb = TRAITS[pb.trait];
  let hpA = pa.health, hpB = pb.health;
  const atkA = ta.atk + (tra.atkMod||0) + pa.level*2 + (pa.evolved?8:0);
  const defA = ta.def + (tra.defMod||0) + pa.level;
  const spdA = ta.spd + (pa.evolved?4:0);
  const atkB = tb.atk + (trb.atkMod||0) + pb.level*2 + (pb.evolved?8:0);
  const defB = tb.def + (trb.defMod||0) + pb.level;
  const spdB = tb.spd + (pb.evolved?4:0);

  const blog = [];
  blog.push({ msg:`⚔ ${pa.name} vs ${pb.name}`, cls:'w' });

  let turn = spdA >= spdB ? 'a' : 'b', rounds = 0;
  while (hpA > 0 && hpB > 0 && rounds < 30) {
    rounds++;
    if (turn === 'a') {
      const crit = Math.random() < .15;
      const dmg = Math.max(1, Math.floor((atkA*(crit?1.8:1)) - defB/2) + rnd(-3,3));
      hpB = Math.max(0, hpB - dmg);
      blog.push({ msg:`${pa.name} hits ${dmg}${crit?' ⚡CRIT':''} → ${pb.name} HP:${hpB}`, cls:'a' });
    } else {
      const crit = Math.random() < .15;
      const dmg = Math.max(1, Math.floor((atkB*(crit?1.8:1)) - defA/2) + rnd(-3,3));
      hpA = Math.max(0, hpA - dmg);
      blog.push({ msg:`${pb.name} hits ${dmg}${crit?' ⚡CRIT':''} → ${pa.name} HP:${hpA}`, cls:'b' });
    }
    if      (spdA > spdB && Math.random() < .3) turn = 'a';
    else if (spdB > spdA && Math.random() < .3) turn = 'b';
    else turn = turn === 'a' ? 'b' : 'a';
  }

  const winnerA = hpA > hpB;
  const winner = winnerA ? pa : pb, loser = winnerA ? pb : pa;
  const rc = 20 + winner.level*5 + (winner.evolved?10:0);
  blog.push({ msg:`🏆 ${winner.name} wins! +${rc} coins +30XP`, cls:'w' });
  S.battle.log = blog;
  S.battle.result = { winnerId:winner.id, loserId:loser.id, rc };

  upd(winner.id, q => ({ wins:q.wins+1, winStreak:q.winStreak+1, happiness:CL(q.happiness+5) }));
  upd(loser.id,  q => ({ losses:q.losses+1, winStreak:0, happiness:CL(q.happiness-5) }));
  const wp = pets.find(p => p.id === winner.id);
  if (wp?.ownerId) inv[wp.ownerId].coins = Math.min(9999, inv[wp.ownerId].coins + rc);
  grantXP(winner.id, 30); grantXP(loser.id, 10);
  lg(`${winner.name} won! (+${rc} coins)`, 'good');
  toast(`🏆 ${winner.name} wins the battle!`, 'good');
  checkAch(); render();
}

/* ── 16. Snapshot (for delta arrows) ─────────────────────────── */
function snapPrev(p) {
  if (p?.id) S.prevStats[p.id] = { health:p.health, happiness:p.happiness, energy:p.energy, hunger:p.hunger };
}

/* ── 17. Interactions ─────────────────────────────────────────── */
function doFeed() {
  const p = getSel(); if (!p) return;
  snapPrev(p);
  const st = gst(p), tr = TRAITS[p.trait];
  if (p.hunger < 8) {
    const msg = `${p.name} is already full — overfeeding caused discomfort. (−8 happiness)`;
    lg(msg, 'warn'); toast(msg, 'warn');
    upd(p.id, q => ({ happiness: CL(q.happiness - 8) }));
  } else {
    let red = 40 + (tr.feedMod || 0);
    if (st === 'sick') red = Math.max(18, Math.floor(red * .6));
    const hb = st === 'starving' ? 14 : 6;
    const msg = `${p.name} ate! (−${red} hunger, +${hb} happiness)`;
    lg(msg, 'good'); toast(msg, 'good');
    upd(p.id, q => ({ hunger: CL(q.hunger - red), happiness: CL(q.happiness + hb) }));
    grantXP(p.id, 10);
  }
  checkAch(); render();
}

function doPlay() {
  const p = getSel(); if (!p) return;
  snapPrev(p);
  const st = gst(p), tr = TRAITS[p.trait];
  if (st === 'sick') {
    toast(`${p.name} is too sick to play — heal first!`, 'bad');
    lg(`${p.name} is too sick to play.`, 'bad'); render(); return;
  }
  let hg = 20 + (tr.playHappBonus || 0), ec = 14 + (tr.playCostMod || 0);
  if (st === 'exhausted') {
    const msg = `${p.name} played while exhausted! (+10 hap, −${ec+8} nrg, −10 HP)`;
    lg(msg, 'warn'); toast(msg, 'warn');
    upd(p.id, q => ({ happiness:CL(q.happiness+10), energy:CL(q.energy-ec-8), health:CL(q.health-10) }));
    grantXP(p.id, 8);
  } else if (p.energy < 25) {
    hg = Math.floor(hg * .6);
    const msg = `${p.name} played while tired — reduced fun (+${hg} hap, −${ec} nrg)`;
    lg(msg, 'warn'); toast(msg, 'warn');
    upd(p.id, q => ({ happiness:CL(q.happiness+hg), energy:CL(q.energy-ec) }));
    grantXP(p.id, 8);
  } else {
    const msg = `${p.name} played! (+${hg} happiness, −${ec} energy)`;
    lg(msg, 'good'); toast(msg, 'good');
    upd(p.id, q => ({ happiness:CL(q.happiness+hg), energy:CL(q.energy-ec) }));
    grantXP(p.id, 12);
  }
  checkAch(); render();
}

function doRest() {
  const p = getSel(); if (!p) return;
  snapPrev(p);
  const tr = TRAITS[p.trait];
  const base = 30 + (tr.restBonus || 0);
  const eg = p.energy > 75 ? Math.floor(base * .45) : base;
  const hg = p.health < 50 ? 10 : 4;
  const msg = `${p.name} rested! (+${eg} energy, +${hg} HP)`;
  lg(msg, 'good'); toast(msg, 'good');
  upd(p.id, q => ({ energy:CL(q.energy+eg), health:CL(q.health+hg) }));
  grantXP(p.id, 8); checkAch(); render();
}

function doSpecial() {
  const p = getSel(); if (!p) return;
  snapPrev(p);
  const st = gst(p), r = PT[p.type].special(p.name);
  const v = st === 'sick' ? Math.floor(r.v * .5) : r.v;
  const msg = r.msg + (st === 'sick' ? ` (weakened — +${v})` : ` (+${v} ${r.stat})`);
  lg(msg, 'good'); toast(msg, 'good');
  upd(p.id, q => ({ [r.stat]: CL(q[r.stat] + v) }));
  grantXP(p.id, 10); checkAch(); render();
}

function doItem(k) {
  const p = getSel(); if (!p) return;
  snapPrev(p);
  const st = gst(p);
  // Always use the SELECTED PET'S owner inventory (p.ownerId), not the active tab (S.su)
  const ownerId = p.ownerId || S.su;
  const ui = inv[ownerId];
  if (!ui || !ui[k] || ui[k] <= 0) { toast(`No ${ITEMS[k].name} left — buy more in the Shop.`, 'warn'); render(); return; }
  if (k === 'medicine') {
    const wasSick = st === 'sick', g = wasSick ? 50 : 20;
    const msg = `Used Medicine on ${p.name}. (+${g} HP${wasSick ? ' — Sick bonus!' : ''})`;
    lg(msg, 'good'); toast(msg, 'good');
    upd(p.id, q => ({ health: CL(q.health + g) }));
    if (wasSick) earnAch('guardian');
  } else if (k === 'premFood') {
    const msg = `${p.name} had a Prime Feast! (−55 hunger, +10 happiness)`;
    lg(msg, 'good'); toast(msg, 'good');
    upd(p.id, q => ({ hunger:CL(q.hunger-55), happiness:CL(q.happiness+10) }));
  } else if (k === 'drink') {
    const msg = `${p.name} had an Energy Drink! (+45 energy)`;
    lg(msg, 'good'); toast(msg, 'good');
    upd(p.id, q => ({ energy: CL(q.energy + 45) }));
  } else if (k === 'toy') {
    if (st === 'sick') { toast(`${p.name} is too sick to enjoy a toy!`, 'warn'); render(); return; }
    const msg = `${p.name} loved the toy! (+32 happiness, −12 energy)`;
    lg(msg, 'good'); toast(msg, 'good');
    upd(p.id, q => ({ happiness:CL(q.happiness+32), energy:CL(q.energy-12) }));
  }
  inv[ownerId][k]--; grantXP(p.id, 5); checkAch(); render();
}

function doBuy(k) {
  const ui = inv[S.su], c = ITEMS[k].cost;
  if (ui.coins < c) { toast('Not enough coins!', 'bad'); render(); return; }
  ui.coins -= c; ui[k] = (ui[k] || 0) + 1;
  toast(`Bought ${ITEMS[k].name} for ${c} coins.`, 'good');
  lg(`Bought ${ITEMS[k].name}.`, 'good'); render();
}

function doRelease() {
  const p = getSel(); if (!p) return;
  // Reset pool entry: clear history + ownerId so it looks fresh in the pool
  const poolEntry = {
    ...p,
    ownerId:   null,
    health:    Math.max(p.health, 60),
    hunger:    40,
    energy:    65,
    happiness: 45,
    age:       0,
    xp:        0,
    wins:      p.wins || 0,
    losses:    p.losses || 0,
    winStreak: 0,
    // Ensure trait and type survive — guard against undefined
    trait:     TRAITS[p.trait]  ? p.trait  : TK[0],
    type:      PT[p.type]       ? p.type   : 'Dog',
    history:   { health:[Math.max(p.health,60)], happiness:[45], energy:[65], hunger:[40] },
  };
  pool = [...pool, poolEntry];
  pets = pets.filter(q => q.id !== p.id);
  S.sp = myPets()[0]?.id || null;
  S.renaming = null;
  // FIX: auto-switch to pool panel so user can immediately adopt
  S.rp = 'pool';
  toast(`${p.name} returned to the adoption pool. Adopt a new pet below!`, 'neutral', 3500);
  lg(`${p.name} released to adoption pool.`, 'neutral');
  render();
  // On mobile, scroll the right panel into view
  setTimeout(() => {
    const rp = document.getElementById('right-panel');
    if (rp && window.innerWidth <= 740) rp.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 120);
}

function doAdopt(pid) {
  console.log('[doAdopt] called with pid:', pid, '| pool size:', pool.length, '| myPets:', myPets().length);
  const count = myPets().length;
  if (count >= 3) {
    toast('You already have 3 pets — release one first, then adopt.', 'warn');
    render(); return;
  }
  // FIX: explicit number coercion so === works after any serialization path
  const numPid = Number(pid);
  const p = pool.find(q => Number(q.id) === numPid);
  if (!p) {
    toast('That pet is no longer available.', 'warn');
    render(); return;
  }
  pool = pool.filter(q => Number(q.id) !== numPid);
  const np = { ...p, ownerId: S.su };
  pets = [...pets, np];
  S.sp = np.id;
  const nm = USERS.find(u => u.id === S.su)?.name;
  toast(`${p.name} adopted by ${nm}!`, 'good');
  lg(`${p.name} adopted by ${nm}!`, 'good');
  checkAch(); render();
}

/* ── 18. Save / Load — 3 named slots ─────────────────────────── */
function getSaveSlot(slot) {
  try {
    const raw = localStorage.getItem(SAVE_KEY + slot);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function doSave(slot) {
  try {
    const data = {
      pets, pool,
      inv: JSON.parse(JSON.stringify(inv)),
      tick: S.tick,
      ach: [...S.ach],
      _id,
      savedAt: Date.now(),
    };
    localStorage.setItem(SAVE_KEY + slot, JSON.stringify(data));
    toast(`Game saved to Slot ${slot}!`, 'good');
    lg(`Saved to Slot ${slot}.`, 'sys');
  } catch (e) {
    toast('Save failed — localStorage unavailable.', 'bad');
  }
  closeSlotModal(); render();
}

function doLoad(slot) {
  try {
    const d = getSaveSlot(slot);
    if (!d) { toast(`Slot ${slot} is empty.`, 'warn'); closeSlotModal(); return; }
    pets = d.pets; pool = d.pool;
    Object.entries(d.inv).forEach(([k, v]) => inv[k] = v);
    S.tick = d.tick || 0; S.ach = new Set(d.ach || []);
    if (d._id) _id = d._id;
    S.sp = pets.find(p => p.ownerId === S.su)?.id || null;
    toast(`Slot ${slot} loaded!`, 'good');
    lg(`Loaded from Slot ${slot}.`, 'sys');
  } catch (e) {
    toast('Load failed — save may be corrupted.', 'bad');
  }
  closeSlotModal(); render();
}

function openSlotModal(mode) {
  S.slotMode = mode;
  const modal = document.getElementById('slot-modal');
  const title = document.getElementById('slot-modal-title');
  const list  = document.getElementById('slot-list');
  if (!modal) return;
  title.textContent = mode === 'save' ? 'Save to Slot' : 'Load from Slot';
  list.innerHTML = '';
  for (let i = 1; i <= NUM_SLOTS; i++) {
    const saved = getSaveSlot(i);
    const div = document.createElement('div');
    div.className = 'slot-item';
    const dt = saved ? new Date(saved.savedAt) : null;
    const meta = saved
      ? `Tick ${saved.tick} · ${dt.toLocaleDateString()} ${dt.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`
      : 'Empty';
    div.innerHTML = `
      <div class="slot-num">${i}</div>
      <div class="slot-info">
        <div class="slot-name">Slot ${i}</div>
        <div class="slot-meta">${meta}</div>
      </div>
      <i class="fa-solid ${mode==='save'?'fa-floppy-disk':'fa-rotate-left'}" style="color:var(--tx2);font-size:13px;"></i>
    `;
    div.onclick = () => mode === 'save' ? doSave(i) : doLoad(i);
    list.appendChild(div);
  }
  modal.hidden = false;
}

function closeSlotModal() {
  const modal = document.getElementById('slot-modal');
  if (modal) modal.hidden = true;
  S.slotMode = null;
}

/* ── 19. Tick engine ──────────────────────────────────────────── */
function tickFn() {
  if (S.paused) return;
  S.tick++;

  // Snapshot previous stats for delta display
  pets.forEach(p => {
    if (p.ownerId) S.prevStats[p.id] = { health:p.health, happiness:p.happiness, energy:p.energy, hunger:p.hunger };
  });

  // Weather: fires every 8-14 ticks, gentle type-specific effects
  if (--S.nextWeather <= 0) {
    const w = WEATHERS[Math.floor(Math.random() * WEATHERS.length)];
    S.weather = { ...w, exp: S.tick + 4 };
    S.nextWeather = 8 + rnd(0, 6);
    const isHarsh = w.key === 'storm' || w.key === 'heat';
    lg(`Weather: ${w.name}`, isHarsh ? 'warn' : 'good');
    toast(`${w.name} — ${isHarsh ? 'watch your pets' : 'nice weather today'}`, isHarsh ? 'warn' : 'good', 3000);
    pets = pets.map(p => p.ownerId ? { ...p, ...w.eff(p) } : p);
  }
  if (S.weather && S.weather.exp <= S.tick) S.weather = null;

  // Per-pet decay — stable, separated from event system
  const dead = [];
  pets = pets.map(p => {
    if (!p.ownerId) return p;
    const d  = PT[p.type].decay;
    const tr = TRAITS[p.trait] || {};

    let dHunger = d.hunger + (tr.hungerMod || 0);
    let dEnergy = d.energy;
    let dHP     = d.hp;       // 0 base — HP drains ONLY from crises
    let dHapp   = 0;

    // Cascading crisis penalties (halved vs old version)
    if (p.hunger > 80)  { dHP += 2; dHapp += 1; }  // Starving → slow HP drain
    else if (p.hunger > 65) { dHP += 1; }             // Hungry → mild HP tick
    if (p.energy < 10)  { dHapp += 3; dHP += 1; }   // Exhausted → sadness + HP
    else if (p.energy < 22) { dHapp += 1; }            // Tired → slight sadness
    if (p.health < 25)  { dEnergy += 1; dHunger += 1; } // Sick → slightly faster drain
    if (p.evolved)      dHunger = Math.max(0, dHunger - 1); // Evolved: slightly more resilient

    const np = {
      ...p,
      hunger:    CL(p.hunger    + dHunger),
      energy:    CL(p.energy    - dEnergy),
      health:    CL(p.health    - dHP),
      happiness: CL(p.happiness - dHapp),
      age:       p.age + 1,
    };

    // Update sparkline ring buffer (last 20 ticks)
    np.history = {
      health:    [...(p.history?.health    || []), np.health   ].slice(-20),
      happiness: [...(p.history?.happiness || []), np.happiness].slice(-20),
      energy:    [...(p.history?.energy    || []), np.energy   ].slice(-20),
      hunger:    [...(p.history?.hunger    || []), np.hunger   ].slice(-20),
    };

    // Random event — 10% chance, separated from decay (no double-hits in same tick)
    if (Math.random() < .10) {
      const ev = EVENTS[Math.floor(Math.random() * EVENTS.length)];
      np[ev.stat] = CL(np[ev.stat] + ev.v);
      lg(ev.msg(p.name), ev.good ? 'good' : 'bad');
    }

    // Passive coin income — only genuinely thriving pets
    if (np.happiness > 65 && np.health > 60 && np.energy > 30)
      inv[p.ownerId].coins = Math.min(9999, (inv[p.ownerId].coins || 0) + 1);

    // Death → return to pool (retains level, resets xp + age)
    if (np.health <= 0) {
      lg(`${p.name} has passed away...`, 'bad');
      toast(`💔 ${p.name} has passed away...`, 'bad', 5000);
      dead.push({ ...p, health:65, hunger:40, energy:65, happiness:45, age:0, xp:0, ownerId:null,
        history: { health:[65], happiness:[45], energy:[65], hunger:[40] } });
      return null;
    }
    return np;
  }).filter(Boolean);

  if (dead.length) pool = [...pool, ...dead];
  checkAch(); render();
}

let _tmr = setInterval(tickFn, SPEEDS[S.speed]);

/* ── 20. Controls (exposed to HTML onclick) ───────────────────── */
window.togglePause = () => {
  S.paused = !S.paused;
  const b = document.getElementById('pause-btn');
  if (b) b.innerHTML = S.paused
    ? '<i class="fa-solid fa-play" aria-hidden="true"></i><span>Resume</span>'
    : '<i class="fa-solid fa-pause" aria-hidden="true"></i><span>Pause</span>';
};

window.setSpeed = s => {
  S.speed = s;
  clearInterval(_tmr);
  _tmr = setInterval(tickFn, SPEEDS[s]);
  ['slow','normal','fast'].forEach(k => {
    const b = document.getElementById('sp-'+k);
    if (b) b.classList.toggle('active', k === s);
  });
};

window.selUser  = id => { S.su = id; S.sp = pets.find(p => p.ownerId === id)?.id || null; S.renaming = null; render(); };
window.selPet   = id => { S.sp = id; S.renaming = null; render(); };
window.setRP    = v  => { S.rp = v; updateMobileNav(); render(); };
window.doFeed   = doFeed;
window.doPlay   = doPlay;
window.doRest   = doRest;
window.doSpecial = doSpecial;
window.doItem   = k => doItem(k);
window.doBuy    = k => doBuy(k);
window.doRelease = doRelease;
window.doAdopt  = pid => doAdopt(pid);
window.openSlotModal = openSlotModal;
window.closeSlotModal = closeSlotModal;
window.startBattle = (a, b) => startBattle(a, b);
window.startRename = id => { S.renaming = id; render(); setTimeout(() => document.getElementById('ri')?.focus(), 30); };
window.cancelRename = () => { S.renaming = null; render(); };
window.confirmRename = () => {
  const el = document.getElementById('ri'), v = el ? el.value.trim() : '';
  if (v && v.length <= 16) upd(S.renaming, () => ({ name: v }));
  S.renaming = null; render();
};

// Close modal on backdrop click
document.addEventListener('click', e => {
  const modal = document.getElementById('slot-modal');
  if (modal && !modal.hidden && e.target === modal) closeSlotModal();
});

/* ── 21. Render helpers ───────────────────────────────────────── */
function ava(p, sz) {
  const t = PT[p.type], ev = p.evolved;
  const border = ev ? `1.5px solid ${t.efg}` : '1px solid rgba(255,255,255,.08)';
  return `<div class="ava ${ev?'evolved':''}" style="width:${sz}px;height:${sz}px;font-size:${Math.round(sz*.22)}px;background:${ev?t.ebg:t.bg};color:${ev?t.efg:t.fg};border:${border};${ev?`box-shadow:0 0 10px ${t.efg}50;`:''}">
    ${ev ? t.evo : t.abbr}</div>`;
}

function pill(l, c) { return `<span class="pill ${c}">${l}</span>`; }

function statBar(icon, label, val, baseColor, inverted = false, prevVal = null) {
  const pct    = CL(val);
  const danger = inverted ? pct > 78 : pct < 22;
  const warn   = inverted ? (pct > 60 && pct <= 78) : (pct >= 22 && pct < 38);
  const col    = danger ? 'var(--red)' : warn ? 'var(--amber)' : baseColor;
  const valCol = danger ? 'var(--red)' : warn ? 'var(--amber)' : 'var(--tx)';
  const shim   = (!inverted && pct > 75) ? 'shimmer' : '';

  let delta = '';
  if (prevVal !== null && prevVal !== undefined) {
    const d = val - prevVal;
    // For hunger, display is inverted: lower is better
    const display = inverted ? -d : d;
    if (display > 0)      delta = `<span class="sb-delta" style="color:var(--green);">▲${Math.abs(d)}</span>`;
    else if (display < 0) delta = `<span class="sb-delta" style="color:var(--red);">▼${Math.abs(d)}</span>`;
  }

  return `<div class="sb">
    <div class="sb-head">
      <span class="sb-lbl"><i class="fa-solid ${icon}" aria-hidden="true"></i> ${label}</span>
      <span class="sb-val" style="color:${valCol};">${val}<small style="font-weight:400;color:var(--tx3);">/100</small>${delta}</span>
    </div>
    <div class="strack">
      <div class="sfill ${shim}" style="width:${pct}%;background:${col};"></div>
    </div>
  </div>`;
}

function xpBar(p) {
  const need = xpNeed(p.level), pct = Math.round((p.xp / need) * 100);
  const evoNote = !p.evolved && p.level < EVO_LV ? ` · ${EVO_LV - p.level} lvl to evolve` : '';
  return `<div class="xp-wrap">
    <div class="sb-head">
      <span class="sb-lbl"><i class="fa-solid fa-arrow-trend-up" aria-hidden="true"></i> XP · Level ${p.level}${p.evolved?'  ✦':''}${evoNote}</span>
      <span class="sb-val" style="color:var(--purple);">${p.xp}<small style="font-weight:400;color:var(--tx3);">/${need}</small></span>
    </div>
    <div class="xp-track"><div class="xp-fill" style="width:${pct}%;"></div></div>
  </div>`;
}

function tipBox(st, p) {
  const tips = {
    sick:      ['Medicine gives +50 HP when Sick vs +20 normally. Play is blocked until healed.', 'bad'],
    starving:  ['Losing HP every tick — feed immediately! Starving drains happiness too.', 'warn'],
    exhausted: ['Playing while Exhausted deals −10 HP damage. Rest or use an Energy Drink first.', 'warn'],
    sad:       ['Low happiness. Play, use a Toy, or let them rest.', ''],
  };
  if (tips[st]) return tips[st];
  if (p && p.energy < 25) return ['Energy low — play gives only 60% happiness gain. Consider resting first.', ''];
  const coinNote = p?.ownerId ? ' Earning +1 coin/tick.' : '';
  const evoNote  = p && !p.evolved && p.level >= EVO_LV - 1 ? ' Almost ready to evolve!' : '';
  return [`Thriving!${coinNote}${evoNote}`, 'good'];
}

function moodFace(p) { return PT[p.type].mood[gst(p)] || '😊'; }

function sparkSVG(data, col) {
  if (!data || data.length < 2) return `<svg width="120" height="24"></svg>`;
  const mn = Math.min(...data), mx = Math.max(...data), rng = mx - mn || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 118 + 1;
    const y = 22 - ((v - mn) / rng) * 20;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const last = pts.split(' ').at(-1).split(',');
  return `<svg width="120" height="24" xmlns="http://www.w3.org/2000/svg">
    <polyline points="${pts}" fill="none" stroke="${col}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" opacity=".9"/>
    <circle cx="${last[0]}" cy="${last[1]}" r="3" fill="${col}" opacity=".9"/>
  </svg>`;
}

function updateMobileNav() {
  const panels = ['log','pool','shop','overview','awards','battle'];
  panels.forEach(k => {
    const b = document.getElementById('mnav-'+k);
    if (b) b.classList.toggle('mnav-active', S.rp === k);
  });
  // Always show the right-col on mobile once any tab has been clicked
  const rc = document.querySelector('.right-col');
  if (rc) rc.classList.add('mob-visible');
}

/* ── 22. Main render ──────────────────────────────────────────── */
function render() {
  const mp = myPets(), sp = getSel(), ui = inv[S.su];
  const uname = USERS.find(u => u.id === S.su)?.name;
  const spSt  = sp ? gst(sp) : 'healthy';
  const prev  = sp ? S.prevStats[sp.id] : null;

  /* tick badge + weather */
  const tb = document.getElementById('tick-badge');
  if (tb) tb.textContent = `tick ${S.tick}`;
  const wb = document.getElementById('wx-badge');
  if (wb) wb.innerHTML = S.weather
    ? `<span class="pill" style="background:#1a1228;color:${S.weather.col};border-color:${S.weather.col}33;font-size:10px;"><i class="fa-solid ${S.weather.icon}" aria-hidden="true"></i> ${S.weather.name}</span>`
    : '';

  /* alerts */
  const crits = pets.filter(p => p.ownerId && ['sick','starving','exhausted'].includes(gst(p)));
  document.getElementById('alerts').innerHTML = crits.slice(0, 3).map(p => {
    const st = gst(p);
    const msgs = { sick:`${p.name} is sick — use Medicine!`, starving:`${p.name} is starving — feed now!`, exhausted:`${p.name} is exhausted — let them rest!` };
    return `<div class="alert ${st==='sick'?'crit':'warn'}">
      <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> ${msgs[st]}
      <button onclick="selUser(${p.ownerId});selPet(${p.id})">Go →</button>
    </div>`;
  }).join('');

  /* user tabs */
  document.getElementById('utabs').innerHTML = USERS.map(u => {
    const cnt = pets.filter(p => p.ownerId === u.id).length;
    return `<button class="btn ${u.id===S.su?'active':''}" onclick="selUser(${u.id})" role="tab" aria-selected="${u.id===S.su}">
      ${u.name} <span style="opacity:.4;font-size:10px;font-weight:400;">${cnt}/3 · ${inv[u.id].coins}c</span>
    </button>`;
  }).join('');

  /* pet strip */
  document.getElementById('pet-strip').innerHTML = mp.length === 0
    ? `<div style="font-size:12px;color:var(--tx2);padding:10px 0;">No pets yet — adopt from the Pool.</div>`
    : mp.map(p => {
      const st = gst(p), s = ST_UI[st], ev = p.evolved, t = PT[p.type];
      const xpPct = Math.round((p.xp / xpNeed(p.level)) * 100);
      return `<div class="pchip ${S.sp===p.id?'sel':''}" onclick="selPet(${p.id})" role="listitem" aria-label="${p.name}, ${s.l}">
        <div style="position:relative;flex-shrink:0;">
          ${ava(p, 34)}
          <span style="position:absolute;bottom:-3px;right:-3px;font-size:14px;line-height:1;">${moodFace(p)}</span>
        </div>
        <div style="min-width:0;">
          <div style="font-size:12px;font-weight:700;${ev?`color:${t.efg};text-shadow:0 0 8px ${t.efg}50;`:''}">${p.name}</div>
          <div style="font-size:10px;color:var(--tx2);">Lv${p.level}${ev?' ✦':''} · ${p.type}</div>
          <div style="margin-top:4px;">${pill(s.l, s.c)}</div>
          <div style="margin-top:5px;height:3px;background:var(--bg5);border-radius:2px;overflow:hidden;">
            <div style="height:100%;width:${p.health}%;border-radius:2px;background:${p.health>50?'var(--green)':p.health>25?'var(--amber)':'var(--red)'};box-shadow:0 0 6px currentColor;transition:width .4s;"></div>
          </div>
        </div>
      </div>`;
    }).join('');

  /* detail panel */
  let detailHtml = '';
  if (sp) {
    const t  = PT[sp.type], ev = sp.evolved;
    const [tipMsg, tipCls] = tipBox(spSt, sp);

    const nameHtml = S.renaming === sp.id
      ? `<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
          <input id="ri" class="ri" value="${sp.name}" maxlength="16" onkeydown="if(event.key==='Enter')confirmRename()" aria-label="Rename pet"/>
          <button class="btn btn-green" onclick="confirmRename()" style="padding:5px 10px;">Save</button>
          <button class="btn" onclick="cancelRename()" style="padding:5px 10px;">✕</button>
        </div>`
      : `<div class="pet-name-row">
          <span class="pet-name" style="${ev?`color:${t.efg};text-shadow:0 0 12px ${t.efg}50`:''}">${sp.name}</span>
          <button class="btn" onclick="startRename(${sp.id})" style="font-size:10px;padding:2px 8px;color:var(--tx2);" aria-label="Rename ${sp.name}">rename</button>
        </div>`;

    const opponents = pets.filter(p => p.ownerId && p.id !== sp.id);
    const battleHtml = opponents.length === 0
      ? `<div style="font-size:11px;color:var(--tx2);">Adopt more pets to enable battles.</div>`
      : opponents.map(o => `<button class="btn btn-amber" onclick="startBattle(${sp.id},${o.id})" style="font-size:11px;">⚔ vs ${o.name}</button>`).join('');

    const atkVal = PT[sp.type].atk + (TRAITS[sp.trait].atkMod||0) + sp.level*2 + (sp.evolved?8:0);
    const defVal = PT[sp.type].def + (TRAITS[sp.trait].defMod||0) + sp.level;
    const spdVal = PT[sp.type].spd + (sp.evolved?4:0);

    detailHtml = `
      <div class="pet-display">
        <div class="pet-face-wrap">
          <span class="pet-face" role="img" aria-label="${sp.name} mood: ${spSt}">${moodFace(sp)}</span>
          <div class="pet-halo"></div>
        </div>
        ${nameHtml}
        <div class="pet-meta">${ev?t.evo:t.abbr} · ${sp.trait} · Age ${sp.age} · W${sp.wins}/L${sp.losses}</div>
        <div class="pet-badges">
          ${pill(ST_UI[spSt].l, ST_UI[spSt].c)}
          ${pill('Lv'+sp.level, 'pill-p')}
          ${ev ? pill('✦ Evolved','pill-a') : `<span class="pill pill-dim">${EVO_LV-sp.level>0?EVO_LV-sp.level+' lvl to evo':'Max'}</span>`}
          <span class="pill pill-dim" style="color:${TRAITS[sp.trait].col};">${sp.trait}</span>
        </div>
      </div>

      ${statBar('fa-heart','Health',   sp.health,   'var(--green)',  false, prev?.health)}
      ${statBar('fa-face-smile','Happiness',sp.happiness,'var(--purple)',false, prev?.happiness)}
      ${statBar('fa-apple-whole','Hunger',  sp.hunger,   'var(--amber)',  true,  prev?.hunger)}
      ${statBar('fa-bolt','Energy',    sp.energy,   'var(--blue)',   false, prev?.energy)}
      ${xpBar(sp)}

      <div class="tip-box ${tipCls}">${tipMsg}</div>

      <div class="actions-grid">
        <button class="act-btn" onclick="doFeed()" aria-label="Feed ${sp.name}">
          <span class="act-icon">🍎</span><span class="act-lbl">Feed</span>
        </button>
        <button class="act-btn ${spSt!=='sick'&&sp.energy<25?'warn-btn':''}" onclick="doPlay()"
          ${spSt==='sick'?'disabled aria-disabled="true"':''} aria-label="Play with ${sp.name}">
          <span class="act-icon">🎮</span><span class="act-lbl">Play</span>
        </button>
        <button class="act-btn" onclick="doRest()" aria-label="Let ${sp.name} rest">
          <span class="act-icon">🌙</span><span class="act-lbl">Rest</span>
        </button>
        <button class="act-btn" onclick="doSpecial()" aria-label="${sp.name}'s special ability">
          <span class="act-icon">⭐</span><span class="act-lbl">Special</span>
        </button>
        <button class="act-btn danger-btn" onclick="doRelease()" aria-label="Release ${sp.name}">
          <span class="act-icon" style="font-size:15px;"><i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i></span>
          <span class="act-lbl">Release</span>
        </button>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:9px;">
        <div class="ptitle" style="margin:0;">Use Item</div>
        <span style="font-size:12px;font-weight:700;color:var(--amber);">${ui.coins} <span style="font-weight:400;font-size:10px;color:var(--tx2);">coins</span></span>
      </div>
      <div class="item-grid">
        ${Object.entries(ITEMS).map(([k,it]) => `<button class="item-btn" onclick="doItem('${k}')" ${!ui[k]?'disabled aria-disabled="true"':''} aria-label="${it.name}, ${ui[k]||0} left">
          <i class="fa-solid ${it.icon} item-icon" aria-hidden="true" style="color:var(--tx2);"></i>
          <div><div class="item-name">${it.name}</div><div class="item-stock">${ui[k]||0} left</div></div>
        </button>`).join('')}
      </div>

      <div class="ptitle">Battle · ATK ${atkVal} DEF ${defVal} SPD ${spdVal}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px;">${battleHtml}</div>

      <div class="ptitle">Stat History <span style="font-weight:400;font-size:10px;">(last 20 ticks)</span></div>
      <div class="spark-row"><span class="spark-lbl">❤️ Health</span>${sparkSVG(sp.history?.health,'var(--green)')}</div>
      <div class="spark-row"><span class="spark-lbl">😊 Happy</span>${sparkSVG(sp.history?.happiness,'var(--purple)')}</div>
      <div class="spark-row"><span class="spark-lbl">⚡ Energy</span>${sparkSVG(sp.history?.energy,'var(--blue)')}</div>
    `;
  } else {
    detailHtml = `<div class="empty-state"><div class="empty-icon">🐾</div><div>Select a pet above to start playing</div></div>`;
  }
  document.getElementById('detail').innerHTML = detailHtml;
  if (S.renaming) { const el = document.getElementById('ri'); if (el) el.focus(); }

  /* right-panel tabs */
  const rpDefs = {
    log:      'Log',
    pool:     `Pool (${pool.length})`,
    shop:     'Shop',
    overview: 'All Pets',
    awards:   `Awards ${S.ach.size}/${Object.keys(ACHS).length}`,
    battle:   'Battle',
  };
  document.getElementById('rp-tabs').innerHTML = Object.entries(rpDefs).map(([v,l]) =>
    `<button class="btn btn-sm ${S.rp===v?'active':''}" onclick="setRP('${v}')" role="tab" aria-selected="${S.rp===v}">${l}</button>`
  ).join('');

  /* right-panel content */
  let rHtml = '';

  if (S.rp === 'log') {
    rHtml = `<div class="ptitle">Event Log</div><div class="log-list">`
      + (S.logs.slice(0,35).map(l => `<div class="le ${l.type}">${l.msg}</div>`).join('') || '<div class="le">No events yet.</div>')
      + `</div>`;

  } else if (S.rp === 'pool') {
    rHtml = `<div class="ptitle">Adoption Pool</div>`
      + (pool.length === 0
        ? `<div style="font-size:12px;color:var(--tx2);">All pets have been adopted!</div>`
        : pool.map(poolPet => {
            // Guard against missing/corrupted trait or type from save/load
            const safeTrait = TRAITS[poolPet.trait] ? poolPet.trait : TK[0];
            const safeType  = PT[poolPet.type]      ? poolPet.type  : 'Dog';
            const traitCol  = TRAITS[safeTrait].col;
            const canAdopt  = myPets().length < 3;
            return `<div class="prow">
              ${ava({...poolPet, type:safeType, evolved:poolPet.evolved||false}, 28)}
              <div style="flex:1;">
                <div style="font-size:12px;font-weight:600;">${poolPet.name}${poolPet.evolved?' ✦':''} <span style="opacity:.4;font-size:10px;">Lv${poolPet.level||1}</span></div>
                <div style="font-size:10px;color:var(--tx2);">${safeType} · <span style="color:${traitCol};">${safeTrait}</span></div>
              </div>
              <button class="btn btn-green" onclick="doAdopt(${poolPet.id})"
                ${canAdopt ? '' : 'disabled aria-disabled="true"'}
                style="font-size:11px;padding:4px 9px;" aria-label="Adopt ${poolPet.name}">
                ${canAdopt ? 'Adopt' : 'Full (3/3)'}
              </button>
            </div>`;
          }).join(''));

  } else if (S.rp === 'shop') {
    rHtml = `<div class="ptitle">Shop</div>
      <div style="padding:9px 12px;background:var(--bg4);border:1px solid var(--bdr);border-radius:var(--r);margin-bottom:11px;font-size:12px;color:var(--tx2);">
        Balance: <b style="color:var(--amber);">${ui.coins} coins</b> · Thriving pets earn +1/tick automatically.
      </div>`
      + Object.entries(ITEMS).map(([k,it]) => `<div class="shop-item">
        <i class="fa-solid ${it.icon} shop-icon" aria-hidden="true" style="color:var(--tx2);"></i>
        <div style="flex:1;">
          <div style="font-size:13px;font-weight:600;">${it.name}</div>
          <div style="font-size:11px;color:var(--tx2);margin-top:1px;">${it.desc}</div>
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <button class="btn btn-green" onclick="doBuy('${k}')" ${ui.coins<it.cost?'disabled':''}
            style="font-size:11px;padding:4px 9px;min-width:36px;" aria-label="Buy ${it.name} for ${it.cost} coins">${it.cost}c</button>
          <div style="font-size:10px;color:var(--tx2);margin-top:2px;">×${ui[k]||0}</div>
        </div>
      </div>`).join('');

  } else if (S.rp === 'overview') {
    rHtml = `<div class="ptitle">All Owners</div>`
      + USERS.map(u => {
        const ups = pets.filter(p => p.ownerId === u.id);
        return `<div style="margin-bottom:14px;">
          <div style="font-size:12px;font-weight:700;display:flex;justify-content:space-between;margin-bottom:7px;">
            ${u.name}
            <span style="font-weight:500;color:var(--amber);font-size:12px;">${inv[u.id].coins}c</span>
          </div>
          ${ups.length === 0
            ? `<div style="font-size:11px;color:var(--tx2);">No pets.</div>`
            : ups.map(p => {
              const st = gst(p), s = ST_UI[st];
              return `<div class="prow">
                ${ava(p, 26)}
                <span style="font-size:16px;">${moodFace(p)}</span>
                <div style="flex:1;">
                  <div style="font-size:11px;font-weight:700;">${p.name}${p.evolved?' ✦':''}</div>
                  <div style="font-size:10px;color:var(--tx2);">${p.type} Lv${p.level}</div>
                </div>
                ${pill(s.l, s.c)}
                <span style="font-size:12px;font-weight:700;color:${p.health<25?'var(--red)':'var(--tx)'};">${p.health}hp</span>
              </div>`;
            }).join('')}
        </div>`;
      }).join('');

  } else if (S.rp === 'awards') {
    rHtml = `<div class="ptitle">Achievements — ${S.ach.size}/${Object.keys(ACHS).length} unlocked</div>`
      + Object.entries(ACHS).map(([k,a]) => {
        const earned = S.ach.has(k);
        return `<div class="ach ${earned?'earned':'locked'}" aria-label="${a.name}: ${earned?'unlocked':'locked'}">
          <i class="fa-solid ${a.icon}" aria-hidden="true" style="font-size:16px;color:${earned?'var(--green)':'var(--tx2)'};width:20px;text-align:center;"></i>
          <div style="flex:1;">
            <div style="font-size:12px;font-weight:700;color:${earned?'var(--green)':'var(--tx)'};">${a.name}</div>
            <div style="font-size:11px;color:var(--tx2);">${a.desc}</div>
          </div>
          ${earned ? `<i class="fa-solid fa-circle-check" aria-hidden="true" style="color:var(--green);font-size:14px;flex-shrink:0;"></i>` : ''}
        </div>`;
      }).join('');

  } else if (S.rp === 'battle') {
    const bt = S.battle;
    if (!bt.a || !bt.b) {
      rHtml = `<div class="ptitle">Pet Battles</div>
        <div style="font-size:12px;color:var(--tx2);line-height:1.8;">
          Select a pet on the left then click <b style="color:var(--amber);">⚔ vs</b> to battle.<br/><br/>
          <b style="color:var(--tx);">Stats formula:</b><br/>
          ATK = base + trait + Lv×2 + evolved bonus<br/>
          DEF = base + trait + level<br/>
          SPD = base + evolved bonus · faster pet goes first<br/>
          15% crit chance (1.8× damage multiplier)<br/><br/>
          Battles are non-destructive. Winner earns <b style="color:var(--amber);">coins + 30 XP</b>.
        </div>`;
    } else {
      const pa = pets.find(p=>p.id===bt.a) || pool.find(p=>p.id===bt.a);
      const pb = pets.find(p=>p.id===bt.b) || pool.find(p=>p.id===bt.b);
      const wid = bt.result?.winnerId;
      rHtml = `<div class="ptitle">Battle Result</div>
        <div class="arena">
          <div class="arena-card ${wid===bt.a?'winner':wid?'loser':''}">
            ${pa ? ava(pa,40) : '?'}
            <div style="font-size:14px;font-weight:700;margin-top:7px;">${pa?.name||'?'}</div>
            <div style="font-size:10px;color:var(--tx2);margin-top:2px;">Lv${pa?.level||1} · W${pa?.wins||0}</div>
          </div>
          <div style="font-family:'Space Mono',monospace;font-size:11px;font-weight:700;color:var(--tx2);text-align:center;">VS</div>
          <div class="arena-card ${wid===bt.b?'winner':wid?'loser':''}">
            ${pb ? ava(pb,40) : '?'}
            <div style="font-size:14px;font-weight:700;margin-top:7px;">${pb?.name||'?'}</div>
            <div style="font-size:10px;color:var(--tx2);margin-top:2px;">Lv${pb?.level||1} · W${pb?.wins||0}</div>
          </div>
        </div>
        ${wid ? `<div style="text-align:center;font-size:14px;font-weight:700;color:var(--green);padding:6px;text-shadow:0 0 12px var(--green);">🏆 ${(pets.find(p=>p.id===wid)||{name:'?'}).name} wins!</div>` : ''}
        <div class="ptitle" style="margin-top:10px;">Round Log</div>
        <div class="bt-log">${bt.log.map(l=>`<div class="bt-le ${l.cls||''}">${l.msg}</div>`).join('')}</div>`;
    }
  }

  try {
    document.getElementById('right-panel').innerHTML = rHtml;
  } catch(renderErr) {
    console.error('Right panel render error:', renderErr);
    document.getElementById('right-panel').innerHTML =
      '<div style="color:var(--red);padding:12px;font-size:12px;">⚠ Panel render error — check console.</div>';
  }
  updateMobileNav();
}

/* ── 23. Unit tests (run in browser console: runTests()) ──────── */
window.runTests = function() {
  const results = [];
  const pass = (name) => results.push(`✅ ${name}`);
  const fail = (name, got, exp) => results.push(`❌ ${name} — got ${got}, expected ${exp}`);

  // CL (clamp)
  CL(150)   === 100  ? pass('CL clamps high')  : fail('CL clamps high',  CL(150), 100);
  CL(-10)   === 0    ? pass('CL clamps low')   : fail('CL clamps low',   CL(-10), 0);
  CL(50)    === 50   ? pass('CL passes mid')   : fail('CL passes mid',   CL(50), 50);
  CL(50,10,80)===50  ? pass('CL custom range') : fail('CL custom range', CL(50,10,80), 50);
  CL(5,10,80)===10   ? pass('CL custom lo')    : fail('CL custom lo',    CL(5,10,80), 10);

  // xpNeed
  xpNeed(1) === 150  ? pass('xpNeed Lv1=150') : fail('xpNeed Lv1', xpNeed(1), 150);
  xpNeed(2) === 200  ? pass('xpNeed Lv2=200') : fail('xpNeed Lv2', xpNeed(2), 200);
  xpNeed(5) === 350  ? pass('xpNeed Lv5=350') : fail('xpNeed Lv5', xpNeed(5), 350);

  // gst state machine
  gst({health:0,hunger:0,energy:50,happiness:50})   ==='dead'      ? pass('gst dead')      : fail('gst dead', gst({health:0,hunger:0,energy:50,happiness:50}), 'dead');
  gst({health:20,hunger:0,energy:50,happiness:50})  ==='sick'      ? pass('gst sick')      : fail('gst sick', gst({health:20,hunger:0,energy:50,happiness:50}), 'sick');
  gst({health:50,hunger:90,energy:50,happiness:50}) ==='starving'  ? pass('gst starving')  : fail('gst starving', gst({health:50,hunger:90,energy:50,happiness:50}), 'starving');
  gst({health:50,hunger:50,energy:5,happiness:50})  ==='exhausted' ? pass('gst exhausted') : fail('gst exhausted', gst({health:50,hunger:50,energy:5,happiness:50}), 'exhausted');
  gst({health:50,hunger:50,energy:50,happiness:10}) ==='sad'       ? pass('gst sad')       : fail('gst sad', gst({health:50,hunger:50,energy:50,happiness:10}), 'sad');
  gst({health:80,hunger:30,energy:60,happiness:60}) ==='healthy'   ? pass('gst healthy')   : fail('gst healthy', gst({health:80,hunger:30,energy:60,happiness:60}), 'healthy');

  // mkPet structure
  const tp = mkPet('Test','Dog');
  tp.name==='Test'   ? pass('mkPet name')      : fail('mkPet name', tp.name, 'Test');
  tp.type==='Dog'    ? pass('mkPet type')      : fail('mkPet type', tp.type, 'Dog');
  tp.health===100    ? pass('mkPet health=100') : fail('mkPet health', tp.health, 100);
  tp.level===1       ? pass('mkPet level=1')   : fail('mkPet level', tp.level, 1);
  tp.evolved===false ? pass('mkPet evolved=false') : fail('mkPet evolved', tp.evolved, false);
  TK.includes(tp.trait) ? pass('mkPet trait valid') : fail('mkPet trait', tp.trait, 'one of '+TK.join('|'));

  // Battle stats formula
  const testP = mkPet('A','Dog'); testP.level=2; testP.evolved=false; testP.trait='Playful';
  const atkExpected = PT.Dog.atk + TRAITS.Playful.atkMod + testP.level*2;
  const atkGot = PT[testP.type].atk + (TRAITS[testP.trait].atkMod||0) + testP.level*2 + (testP.evolved?8:0);
  atkGot === atkExpected ? pass('Battle ATK formula') : fail('Battle ATK formula', atkGot, atkExpected);

  console.log('%c=== Virtual Pet Simulator Tests ===', 'font-size:14px;font-weight:bold;');
  results.forEach(r => console.log(r));
  const passed = results.filter(r=>r.startsWith('✅')).length;
  console.log(`%c${passed}/${results.length} passed`, passed===results.length?'color:green;font-weight:bold':'color:red;font-weight:bold');
  return passed === results.length;
};

/* ── 24. Init ─────────────────────────────────────────────────── */
render();
console.log('%c🐾 Virtual Pet Simulator loaded. Type runTests() to run unit tests.', 'color:#a371f7;font-weight:bold;');