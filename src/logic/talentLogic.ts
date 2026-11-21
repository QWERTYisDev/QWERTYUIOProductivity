import type { Character, Talent } from './types.ts';
import { STATS } from './types.ts';
import { TALENTS, TALENT_BY_ID } from './talents.ts';
import { shuffle, type Rnd } from './rand.ts';

export const meetsReq = (c: Character, t: Talent) => STATS.every((s) => c.base[s] >= (t.req?.[s] ?? 0)); // BASE stats only
export const owned = (c: Character, id: string) => c.talents.filter((x) => x === id).length;
export const eligible = (c: Character): Talent[] => TALENTS.filter((t) => meetsReq(c, t) && owned(c, t.id) < t.max);

/** Opens a hand: up to 3 random eligible talents, saved on the character so refreshing can't re-roll. */
export function openHand(c: Character, rnd: Rnd = Math.random): Character {
  if (c.hands < 1 || c.offer) return c;
  return { ...c, offer: shuffle(eligible(c), rnd).slice(0, 3).map((t) => t.id) };
}

export const REROLL_GEMS = 10;
/** Pays 10 Gems for a fresh offer on the open hand. Returns null if not possible. */
export function rerollOffer(c: Character, gems: number, rnd: Rnd = Math.random): Character | null {
  if (c.hands < 1 || !c.offer || c.offer.length === 0 || gems < REROLL_GEMS) return null;
  return { ...c, offer: shuffle(eligible(c), rnd).slice(0, 3).map((t) => t.id) };
}

/** Picks a talent from the open offer (or id=null to resolve an empty hand). Consumes the hand. */
export function chooseTalent(c: Character, id: string | null): Character | null {
  if (c.hands < 1 || !c.offer) return null;
  if (id === null) return c.offer.length === 0 ? { ...c, hands: c.hands - 1, offer: null, log: [...c.log, 'A Talent Hand found nothing worthy.'] } : null;
  const t = TALENT_BY_ID[id];
  if (!t || !c.offer.includes(id) || !meetsReq(c, t) || owned(c, id) >= t.max) return null;
  return { ...c, hands: c.hands - 1, offer: null, talents: [...c.talents, id], log: [...c.log, `Gained talent: ${t.name}.`] };
}
