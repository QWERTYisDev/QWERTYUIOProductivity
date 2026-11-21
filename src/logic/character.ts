import type { Character, Stat, StatMap } from './types.ts';
import { STATS } from './types.ts';
import { TALENT_BY_ID } from './talents.ts';
import { randInt, uid, type Rnd } from './rand.ts';

export const BASE_HEALTH = 10;
const r2 = (n: number) => Math.round(n * 100) / 100;

const PRE = ['Dark', 'Iron', 'Silent', 'Crimson', 'Azure', 'Ash', 'Night', 'Storm', 'Grim', 'Frost', 'Void', 'Ember'];
const SUF = ['Hunter', 'Blade', 'Warden', 'Walker', 'Wraith', 'Knight', 'Shade', 'Seeker', 'Reaper', 'Ranger', 'Sage', 'Fang'];
export const randomName = (rnd: Rnd = Math.random) => PRE[Math.floor(rnd() * PRE.length)] + ' ' + SUF[Math.floor(rnd() * SUF.length)];

/** New Level 1 character: each stat rolled independently from 5 to 15 inclusive. */
export function newCharacter(name: string, gen: number, rnd: Rnd = Math.random): Character {
  const base = {} as StatMap;
  for (const s of STATS) base[s] = randInt(5, 15, rnd);
  return { id: uid(rnd), name: name.trim(), gen, totalXp: 0, base, sp: 0, hands: 0, offer: null, talents: [], log: ['Awakened.'], createdAt: Date.now() };
}

export function talentTotals(c: Character) {
  const flat: StatMap = { str: 0, agi: 0, fort: 0, mana: 0 };
  const pct: StatMap = { str: 0, agi: 0, fort: 0, mana: 0 };
  let health = 0;
  for (const id of c.talents) {
    const t = TALENT_BY_ID[id];
    if (!t) continue;
    for (const s of STATS) { flat[s] += t.flat?.[s] ?? 0; pct[s] += t.pct?.[s] ?? 0; }
    health += t.health ?? 0;
  }
  return { flat, pct, health };
}

/** (base + flat talent) * (1 + percent talent). */
export function effective(c: Character, s: Stat): number {
  const t = talentTotals(c);
  return r2((c.base[s] + t.flat[s]) * (1 + t.pct[s] / 100));
}
/** Talent bonus shown next to the base stat. */
export const bonus = (c: Character, s: Stat) => r2(effective(c, s) - c.base[s]);
export const maxHealth = (c: Character) => BASE_HEALTH + talentTotals(c).health;

/** Spends 1 Skill Point on a base stat. Returns null if none available. */
export function spendPoint(c: Character, s: Stat): Character | null {
  if (c.sp < 1) return null;
  return { ...c, sp: c.sp - 1, base: { ...c.base, [s]: c.base[s] + 1 } };
}

export const INITIAL_BOSS: Character = {
  id: 'boss-origin', name: 'The First Sovereign', gen: 0, totalXp: 14000,
  base: { str: 20, agi: 20, fort: 20, mana: 20 }, sp: 0, hands: 0, offer: null, talents: [],
  log: ['The original guardian of the System.'], createdAt: 0, fate: 'boss',
};
