import type { Character, Rarity, Talent } from './types.ts';
import { STATS, STAT_LABEL } from './types.ts';
import { TALENTS, TALENT_BY_ID } from './talents.ts';
import { pickWeighted, type Rnd } from './rand.ts';

export const meetsReq = (c: Character, t: Talent) => STATS.every((s) => c.base[s] >= (t.req?.[s] ?? 0)) && (t.needs ?? []).every((id) => c.talents.includes(id)); // BASE stats + owned prerequisite talents
export const owned = (c: Character, id: string) => c.talents.filter((x) => x === id).length;
export const eligible = (c: Character): Talent[] => TALENTS.filter((t) => meetsReq(c, t) && owned(c, t.id) < t.max);

/** Slightly favors common talents; rare ones stay well within reach. */
export const RARITY_WEIGHT: Record<Rarity, number> = { common: 100, uncommon: 70, rare: 45, epic: 28, legendary: 18 };
/** Up to 3 unique eligible talents, drawn by rarity weight. */
export const FAVOR_GEMS = 25;
/** A favored talent counts double in the draw. */
export function pickOffer(c: Character, rnd: Rnd = Math.random, favored: Record<string, true> = {}): string[] {
  const pool = eligible(c);
  const out: string[] = [];
  while (out.length < 3 && pool.length) out.push(pool.splice(pickWeighted(pool.map((t) => RARITY_WEIGHT[t.rarity] * (favored[t.id] ? 2 : 1)), rnd), 1)[0].id);
  return out;
}

/** Opens a hand: up to 3 random eligible talents, saved on the character so refreshing can't re-roll. */
export function openHand(c: Character, rnd: Rnd = Math.random, favored: Record<string, true> = {}): Character {
  if (c.hands < 1 || c.offer) return c;
  return { ...c, offer: pickOffer(c, rnd, favored) };
}

export const REROLL_GEMS = 10;
/** Pays 10 Gems for a fresh offer on the open hand. Returns null if not possible. */
export function rerollOffer(c: Character, gems: number, rnd: Rnd = Math.random, favored: Record<string, true> = {}): Character | null {
  if (c.hands < 1 || !c.offer || c.offer.length === 0 || gems < REROLL_GEMS) return null;
  return { ...c, offer: pickOffer(c, rnd, favored) };
}

/** Picks a talent from the open offer (or id=null to resolve an empty hand). Consumes the hand. */
export function chooseTalent(c: Character, id: string | null): Character | null {
  if (c.hands < 1 || !c.offer) return null;
  if (id === null) return c.offer.length === 0 ? { ...c, hands: c.hands - 1, offer: null, log: [...c.log, 'A Talent Hand found nothing worthy.'] } : null;
  const t = TALENT_BY_ID[id];
  if (!t || !c.offer.includes(id) || !meetsReq(c, t) || owned(c, id) >= t.max) return null;
  return { ...c, hands: c.hands - 1, offer: null, talents: [...c.talents, id], log: [...c.log, `Gained talent: ${t.name}.`] };
}

/** Requirement lines for a talent (base stats, prerequisite talents) with whether `c` meets each. Names of prerequisites come from `name`, so undiscovered ones can stay hidden. */
export function reqLines(c: Character | null, t: Talent, name: (id: string) => string): { text: string; ok: boolean }[] {
  const out: { text: string; ok: boolean }[] = [];
  for (const s of STATS) if (t.req?.[s]) out.push({ text: `Base ${STAT_LABEL[s]} ${t.req[s]}+`, ok: !!c && c.base[s] >= t.req[s]! });
  for (const id of t.needs ?? []) out.push({ text: `Talent: ${name(id)}`, ok: !!c && c.talents.includes(id) });
  return out;
}

const sign = (n: number) => (n > 0 ? '+' : '');
/** Human-readable effects for the detail window. */
export function effectLines(t: Talent): string[] {
  const out: string[] = [];
  for (const s of STATS) if (t.flat?.[s]) out.push(`${sign(t.flat[s]!)}${t.flat[s]} ${STAT_LABEL[s]}`);
  for (const s of STATS) if (t.pct?.[s]) out.push(`${sign(t.pct[s]!)}${t.pct[s]}% ${STAT_LABEL[s]}`);
  if (t.health) out.push(`${sign(t.health)}${t.health} Health`);
  for (const k of t.cond ?? []) {
    const bonus = [k.flat ? `${sign(k.flat)}${k.flat}` : '', k.pct ? `${sign(k.pct)}${k.pct}%` : ''].filter(Boolean).join(' and ');
    out.push(`Battle: ${bonus} when using ${STAT_LABEL[k.use]}${k.vs ? ` against ${STAT_LABEL[k.vs]}` : ''}`);
  }
  return out;
}
