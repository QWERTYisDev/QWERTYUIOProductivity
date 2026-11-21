import type { Game, Out, Task, TaskType } from './types.ts';
import { addXp } from './leveling.ts';
import { levelOf } from './leveling.ts';
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
export const isDone = (g: Game, t: Task, today: string) => !!g.completions[completionKey(t, today)];

export function isOverdue(t: Task, g: Game, now: Date = new Date()): boolean {
  if (t.type !== 'once' || !t.dueDate || isDone(g, t, dateKey(now))) return false;
  return `${t.dueDate} ${t.dueTime || '23:59'}` < `${dateKey(now)} ${p2(now.getHours())}:${p2(now.getMinutes())}`;
}

export function validateTask(t: Partial<Task>): string | null {
  if (!t.name || !t.name.trim()) return 'Quest needs a name.';
  if (t.name.length > 60) return 'Name is too long (60 max).';
  for (const [k, v] of [['XP', t.xp], ['Gems', t.gems]] as const) {
    if (v === undefined || !Number.isInteger(v) || v < 0 || v > 100000) return `${k} must be a whole number from 0 to 100000.`;
  }
  if (t.type === 'weekly' && (!t.days || t.days.length === 0)) return 'Pick at least one weekday.';
  if (t.dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(t.dueDate)) return 'Invalid date.';
  if (t.dueTime && !/^\d{2}:\d{2}$/.test(t.dueTime)) return 'Invalid time.';
  return null;
}

export function saveTask(g: Game, t: Task): Game {
  const exists = g.tasks.some((x) => x.id === t.id);
  return { ...g, tasks: exists ? g.tasks.map((x) => (x.id === t.id ? t : x)) : [...g.tasks, t] };
}
export const blankTask = (type: TaskType = 'daily'): Task => ({
  id: uid(), name: '', desc: '', type, xp: 100, gems: 5, priority: 2, dueDate: '', dueTime: '', days: [1, 2, 3, 4, 5], icon: '⚔️', createdAt: Date.now(),
});
export const deleteTask = (g: Game, id: string): Game => ({ ...g, tasks: g.tasks.filter((t) => t.id !== id) });

/** Completes one occurrence. Reward is granted only if that occurrence has no completion record yet. */
export function completeTask(g: Game, id: string, now: Date = new Date()): Out {
  const t = g.tasks.find((x) => x.id === id);
  const c = g.character;
  if (!t || !c || !activeOn(t, now)) return { g };
  const key = completionKey(t, dateKey(now));
  if (g.completions[key]) return { g };
  const before = levelOf(c.totalXp);
  const r = addXp(c, t.xp);
  const ev: Out['ev'] = [{ t: 'toast', kind: 'good', text: `Quest complete: +${t.xp} XP, +${t.gems} Gems` }];
  if (r.wasted > 0) ev.push({ t: 'toast', kind: 'info', text: 'Level cap reached: XP not added.' });
  if (r.levels > 0) ev.push({ t: 'levelup', level: before + r.levels, levels: r.levels });
  return {
    g: {
      ...g,
      character: r.c,
      gold: g.gold + r.gold,
      gems: g.gems + t.gems,
      completions: { ...g.completions, [key]: { taskId: t.id, name: t.name, xp: t.xp, gems: t.gems, at: now.getTime(), charId: c.id, occ: occurrence(t, dateKey(now)) } },
    },
    ev,
  };
}

/** Explicit reset of a one-time quest so it can be earned again. */
export function resetOnce(g: Game, id: string): Game {
  const t = g.tasks.find((x) => x.id === id);
  if (!t || t.type !== 'once') return g;
  const { [`${id}|once`]: _gone, ...rest } = g.completions;
  return { ...g, completions: rest };
}

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
