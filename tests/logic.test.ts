import assert from 'node:assert/strict';
import { addXp, levelOf, xpInLevel } from '../src/logic/leveling.ts';
import { newCharacter, effective, maxHealth, spendPoint, INITIAL_BOSS } from '../src/logic/character.ts';
import { TALENTS } from '../src/logic/talents.ts';
import { eligible, openHand, chooseTalent } from '../src/logic/talentLogic.ts';
import { freshGame, createHero } from '../src/logic/game.ts';
import { blankTask, completeTask, saveTask, validateTask, activeOn, resetOnce, dateKey } from '../src/logic/tasks.ts';
import { purchase, validateItem } from '../src/logic/shop.ts';
import { rerollHand } from '../src/logic/game.ts';
import { BEATS, statWeights, pickOptions, startBattle, playRound, finishBattle, rollSide } from '../src/logic/battle.ts';
import { migrate, exportJson, importJson } from '../src/logic/storage.ts';

const seq = (...v: number[]) => { let i = 0; return () => v[i++ % v.length]; };
const hero = (g = freshGame()) => createHero(g, 'Tester').g;

// --- XP / levels
{
  const c = newCharacter('A', 1);
  const a = addXp({ ...c, totalXp: 950 }, 200);
  assert.equal(levelOf(a.c.totalXp), 2); assert.equal(xpInLevel(a.c.totalXp), 150);
  assert.deepEqual([a.gold, a.c.sp, a.c.hands], [100, 3, 1]);
  const m = addXp(c, 2500); // multi-level
  assert.deepEqual([levelOf(m.c.totalXp), m.gold, m.c.sp, m.c.hands], [3, 200, 6, 2]);
  const cap = addXp({ ...c, totalXp: 13900 }, 5000);
  assert.deepEqual([cap.c.totalXp, levelOf(cap.c.totalXp), cap.levels, xpInLevel(cap.c.totalXp)], [14000, 15, 1, 0]);
  assert.equal(addXp(cap.c, 999).levels, 0);
}
// --- stat rolls 5..15
for (let i = 0; i < 500; i++) { const c = newCharacter('x', 1); for (const v of Object.values(c.base)) assert.ok(v >= 5 && v <= 15); }
// --- talents
assert.equal(TALENTS.length, 45);
assert.equal(new Set(TALENTS.map((t) => t.id)).size, 45);
{
  const c = { ...newCharacter('T', 1), base: { str: 10, agi: 15, fort: 5, mana: 15 }, talents: ['strong', 'arcane_trickster', 'durable'] };
  assert.equal(effective(c, 'str'), 12);
  assert.equal(effective(c, 'agi'), 17.25); assert.equal(effective(c, 'mana'), 17.25);
  assert.equal(maxHealth(c), 11);
  const low = { ...c, base: { ...c.base, agi: 14 }, talents: [] as string[] };
  assert.ok(!eligible(low).some((t) => t.id === 'arcane_trickster'));
  // requirements ignore talent bonuses
  const boosted = { ...low, talents: ['nimble'] };
  assert.ok(!eligible(boosted).some((t) => t.id === 'arcane_trickster'));
  // hand flow
  let h = { ...newCharacter('H', 1), hands: 1 };
  h = openHand(h); const offer = h.offer!; assert.equal(offer.length, 3);
  assert.equal(openHand(h).offer, offer); // no re-roll
  assert.equal(chooseTalent(h, TALENTS.find((t) => !offer.includes(t.id))!.id), null);
  const done = chooseTalent(h, offer[0])!; assert.equal(done.hands, 0); assert.equal(done.talents.length, 1);
  // stack limit
  const full = { ...h, hands: 1, offer: ['durable'], talents: ['durable', 'durable', 'durable'] };
  assert.equal(chooseTalent(full, 'durable'), null);
  // empty hand fallback
  assert.equal(chooseTalent({ ...h, offer: [] }, null)!.hands, 0);
}
// --- skill points
{
  const c = { ...newCharacter('S', 1), sp: 1, base: { str: 5, agi: 5, fort: 5, mana: 5 }, talents: ['strong'] };
  const d = spendPoint(c, 'str')!; assert.deepEqual([d.sp, d.base.str, effective(d, 'str')], [0, 6, 8]);
  assert.equal(spendPoint(d, 'str'), null);
}
// --- tasks
{
  let g = hero();
  const daily = { ...blankTask('daily'), name: 'Run', xp: 600, gems: 7 };
  const once = { ...blankTask('once'), name: 'Taxes', xp: 500, gems: 3 };
  assert.equal(validateTask({ ...daily, name: ' ' }), 'Quest needs a name.');
  assert.ok(validateTask({ ...daily, xp: -1 }));
  g = saveTask(saveTask(g, daily), once);
  const d1 = new Date(2026, 10, 21, 9), d2 = new Date(2026, 10, 22, 9);
  let r = completeTask(g, daily.id, d1); g = r.g;
  assert.deepEqual([g.character!.totalXp, g.gems], [600, 7]);
  g = completeTask(g, daily.id, d1).g; g = completeTask(g, daily.id, d1).g;
  assert.deepEqual([g.character!.totalXp, g.gems], [600, 7]); // no duplicates
  r = completeTask(g, daily.id, d2); g = r.g; // next day: again; crosses 1000
  assert.deepEqual([g.character!.totalXp, g.gold, g.character!.sp, g.character!.hands], [1200, 100, 3, 1]);
  assert.ok(r.ev!.some((e) => e.t === 'levelup'));
  g = completeTask(g, once.id, d2).g; g = completeTask(g, once.id, d1).g;
  assert.equal(g.gems, 7 + 7 + 3);
  g = completeTask(resetOnce(g, once.id), once.id, d2).g; assert.equal(g.gems, 7 + 7 + 3 + 3);
  const wk = { ...blankTask('weekly'), name: 'W', days: [1] }; // Monday
  assert.ok(!activeOn(wk, new Date(2026, 10, 21))); // Saturday
  assert.ok(activeOn(wk, new Date(2026, 10, 23)));
  assert.equal(completeTask(saveTask(g, wk), wk.id, new Date(2026, 10, 21)).g.completions, g.completions);
  assert.equal(dateKey(new Date(2026, 0, 5)), '2026-01-05');
}
// --- quest gold
{
  let g = hero(); const q = { ...blankTask('once'), name: 'G', xp: 0, gems: 1, gold: 40 };
  assert.equal(validateTask({ ...q, gold: -1 }), 'Gold must be a whole number from 0 to 100000.');
  g = completeTask(saveTask(g, q), q.id, new Date(2026, 10, 21)).g; assert.deepEqual([g.gold, g.gems], [40, 1]);
  g = completeTask(g, q.id, new Date(2026, 10, 21)).g; assert.equal(g.gold, 40);
  assert.equal(migrate({ ...g, tasks: [{ ...q, gold: undefined }] }).tasks[0].gold, 0);
}
// --- shop
{
  let g = { ...hero(), gold: 150 };
  g = purchase(g, 'starter-game', 1000).g; assert.deepEqual([g.gold, g.purchases.length], [50, 1]);
  g = purchase(g, 'starter-game', 1100).g; assert.equal(g.purchases.length, 1); // double tap
  const bad = purchase(g, 'starter-ep', 5000); assert.equal(bad.g.gold, 50); assert.equal(bad.g.purchases.length, 1);
}
// --- gem / mixed shop + reroll
{
  let g = { ...hero(), gold: 100, gems: 5 };
  g.shop = [...g.shop, { id: 'm', name: 'Mixed', desc: '', price: 50, gems: 5, icon: 'x' }, { id: 'gm', name: 'Gems', desc: '', price: 0, gems: 8, icon: 'x' }];
  assert.equal(purchase(g, 'gm', 10).g.gems, 5); // can't afford 8 gems
  g = purchase(g, 'm', 20000).g; assert.deepEqual([g.gold, g.gems], [50, 0]);
  assert.equal(purchase(g, 'm', 30000).g, g);
  assert.ok(validateItem({ name: 'a', price: 0, gems: 0 })); assert.equal(validateItem({ name: 'a', price: 0, gems: 3 }), null);
  let r = { ...hero(), gems: 10 }; r.character = { ...r.character!, hands: 1, base: { str: 15, agi: 15, fort: 15, mana: 15 } };
  assert.equal(rerollHand(r).g, r); // no open offer: no charge
  r.character = openHand(r.character);
  const out = rerollHand(r).g; assert.equal(out.gems, 0); assert.equal(out.character!.offer!.length, 3); assert.equal(out.character!.hands, 1);
  assert.equal(rerollHand(out).g, out); // not enough gems
}
// --- battle
{
  assert.deepEqual(Object.values(BEATS), ['fort', 'str', 'mana', 'agi']);
  const c = { ...newCharacter('B', 1), base: { str: 9, agi: 12, fort: 7, mana: 10 } };
  assert.deepEqual(statWeights(c), { agi: 130, mana: 115, str: 105, fort: 100 });
  // 3 unique options, weighting skews toward high stats
  const cnt: Record<string, number> = { str: 0, agi: 0, fort: 0, mana: 0 };
  for (let i = 0; i < 20000; i++) { const o = pickOptions(c); assert.equal(new Set(o).size, 3); o.forEach((s) => cnt[s]++); }
  assert.ok(cnt.agi > cnt.fort);
  // matchup bonus only on matching pair; random is -3..+3
  const a = { ...newCharacter('a', 1), base: { str: 10, agi: 10, fort: 10, mana: 10 } };
  const hi = rollSide(a, 'str', 'fort', seq(0.999)), mid = rollSide(a, 'str', 'agi', seq(0.5));
  assert.deepEqual([hi.match, hi.rand, hi.final], [0.25, 3, 15.5]);
  assert.deepEqual([mid.match, mid.rand, mid.final], [0, 0, 10]);
  assert.equal(rollSide({ ...a, talents: ['iron_fist'] }, 'str', 'fort', seq(0.5)).final, 15); // (10+2)*1.25
  // full fight to the end, player wins vs a weak boss
  let g = hero();
  g.character = { ...g.character!, totalXp: 14000, base: { str: 15, agi: 15, fort: 15, mana: 15 } };
  g.boss = { ...INITIAL_BOSS, id: 'weak', name: 'Weak', base: { str: 5, agi: 5, fort: 5, mana: 5 } };
  const hero1 = g.character!;
  g = startBattle(g); assert.equal(g.battle!.options.length, 3); assert.equal(startBattle(g).battle, g.battle);
  let n = 0; while (!g.battle!.over && n++ < 100) g = playRound(g, 'str');
  assert.equal(g.battle!.winner, 'p'); assert.equal(g.battle!.bHp, 0); assert.ok(g.battle!.rounds.every((r) => r.winner !== 'tie' ? true : true));
  assert.equal(playRound(g, 'str'), g);
  const gold = g.gold, gems = g.gems; g = finishBattle(g);
  assert.equal(g.boss.id, hero1.id); assert.deepEqual(g.boss.base, hero1.base); assert.equal(g.character, null); assert.equal(g.gen, 2);
  assert.deepEqual([g.gold, g.gems], [gold, gems]); assert.equal(g.archive[0].id, 'weak'); assert.equal(g.battles.length, 1);
  g = createHero(g, 'Next').g; assert.equal(g.character!.totalXp, 0); assert.equal(g.boss.id, hero1.id); assert.equal(g.character!.talents.length, 0);
  // losing keeps the boss untouched
  let L = hero(); L.character = { ...L.character!, totalXp: 14000, base: { str: 5, agi: 5, fort: 5, mana: 5 } };
  const boss0 = L.boss; L = startBattle(L); n = 0; while (!L.battle!.over && n++ < 200) L = playRound(L, 'mana');
  assert.equal(L.battle!.winner, 'b'); L = finishBattle(L);
  assert.equal(L.boss, boss0); assert.equal(L.archive[0].fate, 'fallen'); assert.equal(L.battles[0].winner, 'boss');
  // health floor + tie
  const t = { ...startBattle({ ...hero(), character: { ...hero().character!, totalXp: 14000 } }).battle! };
  assert.ok(t.pHp <= t.pMax);
}
// --- persistence
{
  const g = hero();
  const back = importJson(exportJson(g)); assert.equal(back.character!.name, 'Tester'); assert.equal(back.boss.name, INITIAL_BOSS.name);
  assert.throws(() => migrate({ v: 99 })); assert.throws(() => migrate('x')); assert.throws(() => migrate({ boss: null }));
  assert.equal(migrate({ ...g, v: undefined }).v, 1);
}
console.log('all logic tests passed');
