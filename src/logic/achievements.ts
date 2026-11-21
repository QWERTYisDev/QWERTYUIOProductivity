import type { Game } from './types.ts';
import { streakOf } from './tasks.ts';
import { levelOf } from './leveling.ts';
import { totals } from './stats.ts';

export interface Ach { id: string; name: string; title: string; desc: string; test: (g: Game, now: Date) => boolean }
const lv = (g: Game) => (g.character ? levelOf(g.character.totalXp) : 0);
const maxStreak = (g: Game, now: Date) => Math.max(0, ...g.tasks.map((t) => streakOf(g, t, now)));
const done = (g: Game) => Object.keys(g.completions).length;

// Cosmetic only: achievements and titles never change stats, rewards or progression.
export const ACHIEVEMENTS: Ach[] = [
  { id: 'first_quest', name: 'First Step', title: 'Awakened', desc: 'Complete your first quest.', test: (g) => done(g) >= 1 },
  { id: 'quests_25', name: 'Dedicated', title: 'Diligent Hunter', desc: 'Complete 25 quests.', test: (g) => done(g) >= 25 },
  { id: 'quests_100', name: 'Relentless', title: 'Relentless', desc: 'Complete 100 quests.', test: (g) => done(g) >= 100 },
  { id: 'streak_7', name: '7-Day Streak', title: 'Steadfast', desc: 'Keep a daily quest going for 7 days.', test: (g, n) => maxStreak(g, n) >= 7 },
  { id: 'streak_30', name: '30-Day Streak', title: 'Unbroken', desc: 'Keep a daily quest going for 30 days.', test: (g, n) => maxStreak(g, n) >= 30 },
  { id: 'level_5', name: 'Level 5', title: 'Rookie', desc: 'Reach Level 5.', test: (g) => lv(g) >= 5 },
  { id: 'level_10', name: 'Level 10', title: 'Veteran', desc: 'Reach Level 10.', test: (g) => lv(g) >= 10 },
  { id: 'level_15', name: 'Max Level', title: 'Peak Hunter', desc: 'Reach Level 15.', test: (g) => lv(g) >= 15 },
  { id: 'first_talent', name: 'Talented', title: 'Gifted', desc: 'Gain your first talent.', test: (g) => (g.character?.talents.length ?? 0) >= 1 },
  { id: 'talents_5', name: 'Arsenal', title: 'Armed to the Teeth', desc: 'Hold 5 talents on one character.', test: (g) => (g.character?.talents.length ?? 0) >= 5 },
  { id: 'first_battle', name: 'Challenger', title: 'Challenger', desc: 'Fight your first battle.', test: (g) => g.battles.length >= 1 },
  { id: 'first_boss', name: 'First Boss Defeated', title: 'Boss Slayer', desc: 'Defeat a boss in battle.', test: (g) => g.battles.some((b) => b.winner === 'player') },
  { id: 'gen_5', name: 'Lineage', title: 'Heir of the System', desc: 'Reach Generation 5.', test: (g) => g.gen >= 5 },
  { id: 'shopper', name: 'Treat Yourself', title: 'Indulgent', desc: 'Make 5 shop purchases.', test: (g) => g.purchases.length >= 5 },
  { id: 'gold_1000', name: 'Hoarder', title: 'Gold Hoarder', desc: 'Earn 1,000 Gold in total.', test: (g) => totals(g).goldIn >= 1000 },
];
export const ACH_BY_ID = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));

/** Records newly met achievements. Returns the same object when nothing new unlocked. */
export function unlock(g: Game, now: Date = new Date()): { g: Game; names: string[] } {
  const fresh = ACHIEVEMENTS.filter((a) => !g.achievements[a.id] && a.test(g, now));
  if (!fresh.length) return { g, names: [] };
  const achievements = { ...g.achievements };
  fresh.forEach((a) => (achievements[a.id] = now.getTime()));
  return { g: { ...g, achievements }, names: fresh.map((a) => a.name) };
}
export const equipTitle = (g: Game, id: string): Game => (id === '' || g.achievements[id] ? { ...g, title: id } : g);
