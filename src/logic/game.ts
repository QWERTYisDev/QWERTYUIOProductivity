import type { Game, Out, Stat } from './types.ts';
import { INITIAL_BOSS, newCharacter, spendPoint } from './character.ts';
import { STARTER_ITEMS } from './shop.ts';
import { REROLL_GEMS, chooseTalent, openHand, rerollOffer } from './talentLogic.ts';

export const SAVE_VERSION = 1;

export const freshGame = (): Game => ({
  v: 1, gen: 1, character: null, boss: INITIAL_BOSS, archive: [], gold: 0, gems: 0,
  tasks: [], completions: {}, shop: STARTER_ITEMS, purchases: [], battle: null, battles: [], prefs: { anim: true },
});

/** Creates the next character (only when none is active). The boss is never touched. */
export function createHero(g: Game, name: string): Out {
  if (g.character) return { g };
  const n = name.trim();
  if (!n || n.length > 24) return { g, ev: [{ t: 'toast', kind: 'bad', text: 'Name must be 1-24 characters.' }] };
  const c = newCharacter(n, g.gen);
  return { g: { ...g, character: c }, ev: [{ t: 'reveal', char: c }] };
}

export function spendStat(g: Game, s: Stat): Game {
  if (!g.character) return g;
  const c = spendPoint(g.character, s);
  return c ? { ...g, character: c } : g;
}
export function openTalentHand(g: Game): Game {
  return g.character ? { ...g, character: openHand(g.character) } : g;
}
export function pickTalent(g: Game, id: string | null): Game {
  if (!g.character) return g;
  const c = chooseTalent(g.character, id);
  return c ? { ...g, character: c } : g;
}

export function rerollHand(g: Game): Out {
  if (!g.character) return { g };
  const c = rerollOffer(g.character, g.gems);
  if (!c) return { g, ev: [{ t: 'toast', kind: 'bad', text: `Re-roll needs ${REROLL_GEMS} Gems and an open hand.` }] };
  return { g: { ...g, character: c, gems: g.gems - REROLL_GEMS } };
}
