import type { Game, Out, Stat } from './types.ts';
import { INITIAL_BOSS, newCharacter, spendPoint } from './character.ts';
import { STARTER_ITEMS } from './shop.ts';
import { FAVOR_GEMS, REROLL_GEMS, chooseTalent, openHand, rerollOffer } from './talentLogic.ts';

export const SAVE_VERSION = 1;

export const freshGame = (): Game => ({
  v: 1, gen: 1, character: null, boss: INITIAL_BOSS, archive: [], gold: 0, gems: 0,
  tasks: [], completions: {}, shop: STARTER_ITEMS, purchases: [], battle: null, battles: [], prefs: { anim: true, sound: true },
  subDone: {}, favored: {}, favorsBought: 0, seenTalents: {}, achievements: {}, title: '', rerolls: 0, lastBackup: 0, startedAt: Date.now(), backupSnooze: 0,
});

/** Creates the next character (only when none is active). The boss is never touched. */
export function createHero(g: Game, name: string): Out {
  if (g.character) return { g };
  const n = name.trim();
  if (!n || n.length > 24) return { g, ev: [{ t: 'toast', kind: 'bad', text: 'Name must be 1-24 characters.' }] };
  const c = newCharacter(n, g.gen);
  return { g: { ...g, character: c }, ev: [{ t: 'reveal', char: c }] };
}

export function spendStat(g: Game, s: Stat): Out {
  if (!g.character) return { g };
  const c = spendPoint(g.character, s);
  return c ? { g: { ...g, character: c }, ev: [{ t: 'sfx', k: 'stat' }] } : { g };
}
/** Records talents as "seen" for the catalogue (kept across generations). */
export function see(g: Game, ids: string[]): Game {
  if (ids.every((id) => g.seenTalents[id])) return g;
  const seenTalents = { ...g.seenTalents };
  ids.forEach((id) => (seenTalents[id] = true));
  return { ...g, seenTalents };
}
export function openTalentHand(g: Game): Game {
  if (!g.character) return g;
  const c = openHand(g.character, Math.random, g.favored);
  return see({ ...g, character: c }, c.offer ?? []);
}
export function pickTalent(g: Game, id: string | null): Game {
  if (!g.character) return g;
  const c = chooseTalent(g.character, id);
  if (!c) return g;
  const favored = { ...g.favored };
  if (id) delete favored[id]; // a favor is used up when that talent is picked
  return see({ ...g, character: c, favored }, id ? [id] : []);
}

/** Pays 25 Gems so a discovered talent counts four times as often in future hands, until you pick it. */
export function favorTalent(g: Game, id: string): Out {
  const bad = (text: string): Out => ({ g, ev: [{ t: 'toast', kind: 'bad', text }] });
  if (!g.seenTalents[id]) return { g };
  if (g.favored[id]) return bad('Already favored.');
  if (g.character?.talents.includes(id)) return bad('You already own this talent.');
  if (g.gems < FAVOR_GEMS) return bad(`Favoring costs ${FAVOR_GEMS} Gems.`);
  return { g: { ...g, gems: g.gems - FAVOR_GEMS, favored: { ...g.favored, [id]: true }, favorsBought: g.favorsBought + 1 }, ev: [{ t: 'sfx', k: 'buy' }, { t: 'toast', kind: 'good', text: 'Talent favored: it now appears four times as often in hands.' }] };
}

export function rerollHand(g: Game): Out {
  if (!g.character) return { g };
  const c = rerollOffer(g.character, g.gems, Math.random, g.favored);
  if (!c) return { g, ev: [{ t: 'toast', kind: 'bad', text: `Re-roll needs ${REROLL_GEMS} Gems and an open hand.` }] };
  return { g: see({ ...g, character: c, gems: g.gems - REROLL_GEMS, rerolls: g.rerolls + 1 }, c.offer ?? []) };
}
