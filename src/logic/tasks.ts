import type { Game, Out, Task, TaskType } from './types.ts';
import { addXp } from './leveling.ts';
import { LEVEL_SP, levelOf } from './leveling.ts';
import { uid } from './rand.ts';

const p2 = (n: number) => String(n).padStart(2, '0');
export const dateKey = (d: Date = new Date()) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Does this quest appear on the given local date? */
export function activeOn(t: Task, d: Date): boolean {
  if (t.type === 'once') return true;
  if (t.type === 'daily') return true;
  return t.days.includes(d.getDay()) && (!t.dueDate || dateKey(d) <= t.dueDate);
}
export const occurrence = (t: Task, today: string) => (t.type === 'once' ? 'once' : today);
export const completionKey = (t: Task, today: string) => `${t.id}|${occurrence(t, today)}`;
export const subKey = (t: Task, occ: string, subId: string) => `${t.id}|${occ}|${subId}`;
const withoutSubs = (d: Game['subDone'], prefix: string) => Object.fromEntries(Object.entries(d).filter(([key]) => !key.startsWith(prefix))) as Game['subDone'];
export const isDone = (g: Game, t: Task, today: string) => !!g.completions[completionKey(t, today)];

export function isOverdue(t: Task, g: Game, now: Date = new Date()): boolean {
  if (t.type !== 'once' || !t.dueDate || isDone(g, t, dateKey(now))) return false;
  return `${t.dueDate} ${t.dueTime || '23:59'}` < `${dateKey(now)} ${p2(now.getHours())}:${p2(now.getMinutes())}`;
}

export function validateTask(t: Partial<Task>): string | null {
  if (!t.name || !t.name.trim()) return 'Quest needs a name.';
  if (t.name.length > 60) return 'Name is too long (60 max).';
  for (const [k, v] of [['XP', t.xp], ['Gems', t.gems], ['Gold', t.gold]] as const) {
    if (v === undefined || !Number.isInteger(v) || v < 0 || v > 100000) return `${k} must be a whole number from 0 to 100000.`;
  }
  if (t.type === 'weekly' && (!t.days || t.days.length === 0)) return 'Pick at least one weekday.';
  if ((t.subs?.length ?? 0) > 10) return 'Checklists are limited to 10 items.';
  if (t.subs?.some((s) => !s.text.trim() || s.text.length > 60)) return 'Checklist items need text (60 characters max).';
  if (t.dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(t.dueDate)) return 'Invalid date.';
  if (t.dueTime && !/^\d{2}:\d{2}$/.test(t.dueTime)) return 'Invalid time.';
  return null;
}

export function saveTask(g: Game, t: Task): Game {
  const exists = g.tasks.some((x) => x.id === t.id);
  return { ...g, tasks: exists ? g.tasks.map((x) => (x.id === t.id ? t : x)) : [...g.tasks, t] };
}
export const blankTask = (type: TaskType = 'daily'): Task => ({
  id: uid(), name: '', desc: '', type, xp: 100, gems: 5, gold: 0, priority: 2, dueDate: '', dueTime: '', days: [1, 2, 3, 4, 5], icon: '⚔️', subs: [], createdAt: Date.now(),
});
export const deleteTask = (g: Game, id: string): Game => ({ ...g, tasks: g.tasks.filter((t) => t.id !== id) });

/** Completes one occurrence. Reward is granted only if that occurrence has no completion record yet. */
export function completeTask(g: Game, id: string, now: Date = new Date()): Out {
  const t = g.tasks.find((x) => x.id === id);
  const c = g.character;
  if (!t || !c || !activeOn(t, now)) return { g };
  const key = completionKey(t, dateKey(now));
  if (g.completions[key]) return { g };
  const occ = occurrence(t, dateKey(now));
  if (t.subs.length && !t.subs.every((s) => g.subDone[subKey(t, occ, s.id)])) return { g }; // checklist must be finished first
  const before = levelOf(c.totalXp);
  const r = addXp(c, t.xp);
  const ev: Out['ev'] = [{ t: 'sfx', k: 'clear' }, { t: 'toast', kind: 'good', text: `Quest complete: +${t.xp} XP, +${t.gems} Gems${t.gold ? `, +${t.gold} Gold` : ''}` }];
  if (r.wasted > 0) ev.push({ t: 'toast', kind: 'info', text: 'Level cap reached: XP not added.' });
  if (r.levels > 0) ev.push({ t: 'levelup', level: before + r.levels, levels: r.levels });
  return {
    g: {
      ...g,
      character: r.c,
      gold: g.gold + r.gold + t.gold,
      gems: g.gems + t.gems,
      completions: { ...g.completions, [key]: { taskId: t.id, name: t.name, xp: t.xp, gems: t.gems, gold: t.gold, at: now.getTime(), charId: c.id, occ, xpGot: r.c.totalXp - c.totalXp, levels: r.levels, lvGold: r.gold } },
    },
    ev,
  };
}

/** Explicit reset of a one-time quest so it can be earned again. */
export function resetOnce(g: Game, id: string): Game {
  const t = g.tasks.find((x) => x.id === id);
  if (!t || t.type !== 'once') return g;
  const { [`${id}|once`]: _gone, ...rest } = g.completions;
  return { ...g, completions: rest, subDone: withoutSubs(g.subDone, `${id}|once|`) };
}

export const UNDO_MS = 15000;
/** Takes back a completion made in the last 15s and reverses exactly what it paid. Refuses if those rewards were already spent. */
export function undoCompletion(g: Game, key: string, now: number = Date.now()): Out {
  const rec = g.completions[key];
  const c = g.character;
  const bad = (text: string): Out => ({ g, ev: [{ t: 'toast', kind: 'bad', text }] });
  if (!rec || !c || rec.charId !== c.id || now - rec.at > UNDO_MS) return bad('Too late to undo.');
  const levels = rec.levels ?? 0, lvGold = rec.lvGold ?? 0, xpGot = rec.xpGot ?? 0;
  if (c.sp < levels * LEVEL_SP || c.hands < levels || (levels > 0 && c.offer) || g.gold < rec.gold + lvGold || g.gems < rec.gems || c.totalXp < xpGot) {
    return bad('Cannot undo: those rewards were already spent.');
  }
  const { [key]: _gone, ...rest } = g.completions;
  return {
    g: {
      ...g, completions: rest, subDone: withoutSubs(g.subDone, `${rec.taskId}|${rec.occ}|`),
      gold: g.gold - rec.gold - lvGold, gems: g.gems - rec.gems,
      character: { ...c, totalXp: c.totalXp - xpGot, sp: c.sp - levels * LEVEL_SP, hands: c.hands - levels },
    },
    ev: [{ t: 'toast', kind: 'info', text: 'Quest undone: rewards refunded.' }],
  };
}

/** Checks or unchecks a checklist item; checking the last one completes the quest. */
export function toggleSub(g: Game, taskId: string, subId: string, now: Date = new Date()): Out {
  const t = g.tasks.find((x) => x.id === taskId);
  if (!t || !g.character || !activeOn(t, now) || !t.subs.some((s) => s.id === subId)) return { g };
  const today = dateKey(now);
  if (isDone(g, t, today)) return { g };
  const occ = occurrence(t, today);
  const k = subKey(t, occ, subId);
  const subDone = { ...g.subDone };
  if (subDone[k]) delete subDone[k]; else subDone[k] = true;
  const g2 = { ...g, subDone };
  return t.subs.every((s) => subDone[subKey(t, occ, s.id)]) ? completeTask(g2, taskId, now) : { g: g2 };
}

/** Consecutive days a daily quest was completed, counting back from today (or yesterday if today is still open). Display only. */
export function streakOf(g: Game, t: Task, now: Date = new Date()): number {
  if (t.type !== 'daily') return 0;
  const d = new Date(now);
  d.setHours(12, 0, 0, 0);
  if (!g.completions[`${t.id}|${dateKey(d)}`]) d.setDate(d.getDate() - 1);
  let n = 0;
  while (n < 400 && g.completions[`${t.id}|${dateKey(d)}`]) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

export interface Template { name: string; type: TaskType; xp: number; gems: number; icon: string; days?: number[] }
export const TEMPLATES: Template[] = [
  { name: 'Workout', type: 'daily', xp: 150, gems: 5, icon: '💪' },
  { name: 'Read 20 minutes', type: 'daily', xp: 100, gems: 3, icon: '📚' },
  { name: 'Study session', type: 'daily', xp: 150, gems: 5, icon: '📝' },
  { name: 'Drink water', type: 'daily', xp: 50, gems: 2, icon: '💧' },
  { name: 'Meditate', type: 'daily', xp: 80, gems: 3, icon: '🧘' },
  { name: 'Tidy up', type: 'daily', xp: 80, gems: 3, icon: '🧹' },
  { name: 'Weekly review', type: 'weekly', xp: 200, gems: 8, icon: '🎯', days: [0] },
  { name: 'Laundry', type: 'weekly', xp: 120, gems: 4, icon: '🧹', days: [6] },
  { name: 'Pay a bill', type: 'once', xp: 100, gems: 5, icon: '💰' },
];

const PRI_SORT = (a: Task, b: Task) => b.priority - a.priority || (a.dueDate + a.dueTime || '~').localeCompare(b.dueDate + b.dueTime || '~') || a.name.localeCompare(b.name);
export type SortKey = 'priority' | 'xp' | 'gems' | 'due' | 'name';
export function sortTasks(ts: Task[], key: SortKey): Task[] {
  const a = [...ts];
  if (key === 'priority') return a.sort(PRI_SORT);
  if (key === 'xp') return a.sort((x, y) => y.xp - x.xp);
  if (key === 'gems') return a.sort((x, y) => y.gems - x.gems);
  if (key === 'name') return a.sort((x, y) => x.name.localeCompare(y.name));
  return a.sort((x, y) => (x.dueDate + x.dueTime || '~').localeCompare(y.dueDate + y.dueTime || '~'));
}
