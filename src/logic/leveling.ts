import type { Character } from './types.ts';

export const XP_PER_LEVEL = 1000;
export const MAX_LEVEL = 15;
export const MAX_XP = (MAX_LEVEL - 1) * XP_PER_LEVEL; // 14,000
export const LEVEL_GOLD = 100;
export const LEVEL_SP = 3;

export const levelOf = (totalXp: number) => Math.min(MAX_LEVEL, 1 + Math.floor(totalXp / XP_PER_LEVEL));
/** XP progress inside the current level (0 at the cap). */
export const xpInLevel = (totalXp: number) => (levelOf(totalXp) >= MAX_LEVEL ? 0 : totalXp % XP_PER_LEVEL);

/** Adds XP (capped at 14,000 total). Each level gained grants 100 Gold, 3 Skill Points, 1 Talent Hand. */
export function addXp(c: Character, xp: number): { c: Character; levels: number; gold: number; wasted: number } {
  const before = levelOf(c.totalXp);
  const total = Math.min(MAX_XP, c.totalXp + Math.max(0, Math.floor(xp)));
  const levels = levelOf(total) - before;
  return {
    c: { ...c, totalXp: total, sp: c.sp + levels * LEVEL_SP, hands: c.hands + levels },
    levels,
    gold: levels * LEVEL_GOLD,
    wasted: c.totalXp + Math.max(0, Math.floor(xp)) - total,
  };
}
