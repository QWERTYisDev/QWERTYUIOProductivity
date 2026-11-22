import type { Game } from './types.ts';
import { streakOf } from './tasks.ts';
import { levelOf } from './leveling.ts';
import { totals } from './stats.ts';
import { TALENTS, TALENT_BY_ID } from './talents.ts';

export interface Ach { id: string; name: string; title: string; desc: string; test: (g: Game, now: Date) => boolean }
const lv = (g: Game) => (g.character ? levelOf(g.character.totalXp) : 0);
const maxStreak = (g: Game, now: Date) => Math.max(0, ...g.tasks.map((t) => streakOf(g, t, now)));
const done = (g: Game) => Object.keys(g.completions).length;
const owns = (g: Game, f: (id: string) => boolean) => (g.character?.talents ?? []).some(f);
const wins = (g: Game) => g.battles.filter((b) => b.winner === 'player');
const topBase = (g: Game) => (g.character ? Math.max(...Object.values(g.character.base)) : 0);
const seen = (g: Game) => Object.keys(g.seenTalents).length;

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
  // ---- 35 more ----
  { id: 'quests_10', name: 'Warming Up', title: 'Initiate', desc: 'Complete 10 quests.', test: (g) => done(g) >= 10 },
  { id: 'quests_50', name: 'Half Century', title: 'Grinder', desc: 'Complete 50 quests.', test: (g) => done(g) >= 50 },
  { id: 'quests_250', name: 'Quest Master', title: 'Taskmaster', desc: 'Complete 250 quests.', test: (g) => done(g) >= 250 },
  { id: 'quests_500', name: 'Unstoppable', title: 'Juggernaut of Habit', desc: 'Complete 500 quests.', test: (g) => done(g) >= 500 },
  { id: 'quests_1000', name: 'Legend of Labor', title: 'Living Legend', desc: 'Complete 1,000 quests.', test: (g) => done(g) >= 1000 },
  { id: 'streak_3', name: 'Getting Going', title: 'Spark', desc: 'Keep a daily quest going for 3 days.', test: (g, n) => maxStreak(g, n) >= 3 },
  { id: 'streak_14', name: 'Fortnight', title: 'Disciplined', desc: 'Keep a daily quest going for 14 days.', test: (g, n) => maxStreak(g, n) >= 14 },
  { id: 'streak_60', name: 'Iron Habit', title: 'Ironclad', desc: 'Keep a daily quest going for 60 days.', test: (g, n) => maxStreak(g, n) >= 60 },
  { id: 'streak_100', name: 'Century Streak', title: 'Centurion', desc: 'Keep a daily quest going for 100 days.', test: (g, n) => maxStreak(g, n) >= 100 },
  { id: 'level_2', name: 'Awakening', title: 'Novice', desc: 'Reach Level 2.', test: (g) => lv(g) >= 2 },
  { id: 'level_8', name: 'Level 8', title: 'Adept', desc: 'Reach Level 8.', test: (g) => lv(g) >= 8 },
  { id: 'level_12', name: 'Level 12', title: 'Elite', desc: 'Reach Level 12.', test: (g) => lv(g) >= 12 },
  { id: 'talents_3', name: 'Triple Threat', title: 'Triple Threat', desc: 'Hold 3 talents on one character.', test: (g) => (g.character?.talents.length ?? 0) >= 3 },
  { id: 'talents_8', name: 'Walking Arsenal', title: 'Overloaded', desc: 'Hold 8 talents on one character.', test: (g) => (g.character?.talents.length ?? 0) >= 8 },
  { id: 'rare_talent', name: 'Rare Find', title: 'Lucky', desc: 'Own a rare talent.', test: (g) => owns(g, (id) => TALENT_BY_ID[id]?.rarity === 'rare') },
  { id: 'epic_talent', name: 'Epic Pull', title: "Fortune's Favorite", desc: 'Own an epic talent.', test: (g) => owns(g, (id) => TALENT_BY_ID[id]?.rarity === 'epic') },
  { id: 'legendary_talent', name: 'Legendary Pull', title: 'Chosen One', desc: 'Own a legendary talent.', test: (g) => owns(g, (id) => TALENT_BY_ID[id]?.rarity === 'legendary') },
  { id: 'tree_talent', name: 'Branching Out', title: 'Pathfinder', desc: 'Gain a talent that needed another talent first.', test: (g) => owns(g, (id) => !!TALENT_BY_ID[id]?.needs?.length) },
  { id: 'discover_10', name: 'Curious', title: 'Curious Mind', desc: 'Discover 10 talents.', test: (g) => seen(g) >= 10 },
  { id: 'discover_30', name: 'Talent Scholar', title: 'Archivist', desc: 'Discover 30 talents.', test: (g) => seen(g) >= 30 },
  { id: 'discover_all', name: 'Completionist', title: 'Omniscient', desc: 'Discover every talent.', test: (g) => seen(g) >= TALENTS.length },
  { id: 'battles_5', name: 'Veteran Fighter', title: 'Gladiator', desc: 'Fight 5 battles.', test: (g) => g.battles.length >= 5 },
  { id: 'wins_3', name: 'Giant Killer', title: 'Giant Killer', desc: 'Win 3 battles.', test: (g) => wins(g).length >= 3 },
  { id: 'defender', name: 'Hold the Throne', title: 'Unyielding', desc: 'Have your boss beat a challenger.', test: (g) => g.battles.some((b) => b.winner === 'boss') },
  { id: 'flawless', name: 'Flawless Victory', title: 'Untouchable', desc: 'Win a battle without losing any health.', test: (g) => wins(g).some((b) => b.pHp === b.pMax) },
  { id: 'close_call', name: 'Close Call', title: 'By a Thread', desc: 'Win a battle with 1 health left.', test: (g) => wins(g).some((b) => b.pHp === 1) },
  { id: 'gen_3', name: 'Third Generation', title: 'Successor', desc: 'Reach Generation 3.', test: (g) => g.gen >= 3 },
  { id: 'gen_10', name: 'Dynasty', title: 'Dynasty Head', desc: 'Reach Generation 10.', test: (g) => g.gen >= 10 },
  { id: 'shopper_25', name: 'Big Spender', title: 'Tycoon', desc: 'Make 25 shop purchases.', test: (g) => g.purchases.length >= 25 },
  { id: 'gold_5000', name: 'Gold Magnate', title: 'Magnate', desc: 'Earn 5,000 Gold in total.', test: (g) => totals(g).goldIn >= 5000 },
  { id: 'gems_100', name: 'Gem Collector', title: 'Jeweler', desc: 'Earn 100 Gems in total.', test: (g) => totals(g).gemsIn >= 100 },
  { id: 'gems_500', name: 'Gem Hoarder', title: "Dragon's Hoard", desc: 'Earn 500 Gems in total.', test: (g) => totals(g).gemsIn >= 500 },
  { id: 'reroll', name: 'Fickle Fate', title: 'Gambler', desc: 'Re-roll a Talent Hand.', test: (g) => g.rerolls >= 1 },
  { id: 'stat_20', name: 'Training Arc', title: 'Trainee', desc: 'Raise a base stat to 20.', test: (g) => topBase(g) >= 20 },
  { id: 'stat_30', name: 'Beyond Limits', title: 'Limit Breaker', desc: 'Raise a base stat to 30.', test: (g) => topBase(g) >= 30 },
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
