export type Stat = 'str' | 'agi' | 'fort' | 'mana';
export const STATS: Stat[] = ['str', 'agi', 'fort', 'mana'];
export const STAT_LABEL: Record<Stat, string> = { str: 'Strength', agi: 'Agility', fort: 'Fortitude', mana: 'Mana' };
export const STAT_SHORT: Record<Stat, string> = { str: 'STR', agi: 'AGI', fort: 'FOR', mana: 'MAN' };
export type StatMap = Record<Stat, number>;
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

/** Battle-only effect: applies when the owner picks stat `use` (optionally against opponent stat `vs`). pct is in percent. */
export interface Cond { use: Stat; vs?: Stat; flat?: number; pct?: number }

export interface Talent {
  id: string;
  name: string;
  rarity: Rarity;
  desc: string;
  req?: Partial<StatMap>; // checked against BASE stats only
  flat?: Partial<StatMap>;
  pct?: Partial<StatMap>; // percent
  health?: number;
  cond?: Cond[];
  max: number; // stacking rule: max copies a character can own
}

export interface Character {
  id: string;
  name: string;
  gen: number;
  totalXp: number; // 0..14000, level is derived
  base: StatMap;
  sp: number;
  hands: number;
  offer: string[] | null; // talent ids shown for the hand currently open
  talents: string[]; // talent ids (repeats = stacks)
  log: string[];
  createdAt: number;
  fate?: 'boss' | 'defeated' | 'fallen';
}

export interface Sub { id: string; text: string }
export type TaskType = 'daily' | 'weekly' | 'once';
export interface Task {
  id: string;
  name: string;
  desc: string;
  type: TaskType;
  xp: number;
  gems: number;
  gold: number; // bonus Gold paid on completion (separate from level-up Gold)
  priority: 1 | 2 | 3;
  dueDate: string; // YYYY-MM-DD or ''. Weekly: last day the quest appears.
  dueTime: string; // HH:MM or ''
  days: number[]; // weekly: 0=Sun..6=Sat
  subs: Sub[]; // checklist: the quest pays out when every item is checked
  icon: string;
  createdAt: number;
}
export interface Completion { taskId: string; name: string; xp: number; gems: number; gold: number; at: number; charId: string; occ: string; xpGot?: number; levels?: number; lvGold?: number }

export interface ShopItem {
  id: string; name: string; desc: string; price: number; gems: number; icon: string;
  cat: string; fav: boolean;
  limit: 'none' | 'daily' | 'stock'; // daily: n buys per day; stock: n left in stock (decreases)
  n: number;
} // price = Gold, gems = Gems (either or both)
export interface Purchase { id: string; itemId: string; name: string; price: number; gems: number; at: number }

export interface Round {
  n: number;
  options: Stat[]; // the three stats the opponent offered
  pStat: Stat; bStat: Stat;
  pEff: number; bEff: number;
  pFlat: number; bFlat: number; pPct: number; bPct: number; // battle-talent bonuses, already included in final
  pMatch: number; bMatch: number; // 0 or 0.25
  pRand: number; bRand: number;
  pFinal: number; bFinal: number;
  winner: 'p' | 'b' | 'tie';
  pHp: number; bHp: number;
}
export interface Battle {
  id: string;
  player: Character; boss: Character;
  pMax: number; bMax: number; pHp: number; bHp: number;
  options: Stat[];
  rounds: Round[];
  over: boolean;
  winner?: 'p' | 'b';
  startedAt: number;
}
export interface BattleRecord {
  id: string; at: number; gen: number;
  player: Character; boss: Character;
  winner: 'player' | 'boss'; winnerName: string; loserName: string;
  rounds: Round[]; pHp: number; bHp: number; pMax: number; bMax: number;
}

export interface Game {
  v: 1;
  gen: number;
  character: Character | null;
  boss: Character;
  archive: Character[];
  gold: number;
  gems: number;
  tasks: Task[];
  completions: Record<string, Completion>;
  shop: ShopItem[];
  purchases: Purchase[];
  battle: Battle | null;
  battles: BattleRecord[];
  prefs: { anim: boolean; sound: boolean };
  subDone: Record<string, true>; // `${taskId}|${occurrence}|${subId}`
  achievements: Record<string, number>; // id -> unlocked at
  title: string; // equipped achievement id
  rerolls: number;
  lastBackup: number;
  startedAt: number;
  backupSnooze: number;
}

export type Ev =
  | { t: 'toast'; text: string; kind?: 'good' | 'bad' | 'info' }
  | { t: 'levelup'; level: number; levels: number }
  | { t: 'reveal'; char: Character }
  | { t: 'talent'; id: string }
  | { t: 'sfx'; k: 'clear' | 'buy' };
export type Out = { g: Game; ev?: Ev[] };
