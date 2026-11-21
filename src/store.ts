import { useSyncExternalStore } from 'react';
import type { Character, Ev, Game, Out } from './logic/types.ts';
import { exportJson, importJson, load, save, wipe } from './logic/storage.ts';
import { freshGame } from './logic/game.ts';
import { unlock } from './logic/achievements.ts';
import { ACH_BY_ID } from './logic/achievements.ts';
import { haptic, play, type Sfx } from './sound.ts';

export interface Toast { id: number; text: string; kind: 'good' | 'bad' | 'info' }
interface Snap {
  game: Game;
  fatal: { error: string; raw: string | null } | null; // storage problem: saving is paused so nothing gets overwritten
  saveError: string | null;
  note: string | null;
  toasts: Toast[];
  levelup: { level: number; levels: number } | null;
  reveal: Character | null;
  talentGot: string | null;
  focus: { pick: string | null; run: { taskId: string; endsAt: number; mins: number } | null };
}

const loaded = load();
let snap: Snap = {
  game: loaded.game ?? freshGame(),
  fatal: loaded.error ? { error: loaded.error, raw: loaded.raw } : null,
  saveError: null, note: loaded.note ?? null, toasts: [], levelup: null, reveal: null, talentGot: null, focus: { pick: null, run: null },
};
// Existing saves get any achievements they already qualify for, silently.
snap = { ...snap, game: unlock(snap.game).g };

/** Sound + haptics, honoring the mute toggle. */
export function sfx(k: Sfx) {
  if (!snap.game.prefs.sound) return;
  play(k);
  if (k === 'clear' || k === 'level' || k === 'talent') haptic(k === 'clear' ? 15 : 35);
}
export const buzz = () => { if (snap.game.prefs.sound) haptic(40); };
const subs = new Set<() => void>();
const set = (p: Partial<Snap>) => { snap = { ...snap, ...p }; subs.forEach((f) => f()); };
export const useSnap = () => useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f); }; }, () => snap);

let tid = 0;
export function toast(text: string, kind: Toast['kind'] = 'info') {
  const id = ++tid;
  set({ toasts: [...snap.toasts, { id, text, kind }].slice(-3) });
  setTimeout(() => set({ toasts: snap.toasts.filter((t) => t.id !== id) }), 3200);
}
const applyEvents = (ev: Ev[]) => {
  for (const e of ev) {
    if (e.t === 'toast') toast(e.text, e.kind ?? 'info');
    else if (e.t === 'levelup') { set({ levelup: { level: e.level, levels: e.levels } }); sfx('level'); }
    else if (e.t === 'sfx') sfx(e.k);
    else if (e.t === 'reveal') set({ reveal: e.char });
    else if (e.t === 'talent') { set({ talentGot: e.id }); play2talent(); }
  }
};

/** Runs a state change synchronously (so rapid taps always see the latest state), saves, then shows events. */
const play2talent = () => { if (snap.game.prefs.sound) play('talent'); };

export function act(fn: (g: Game) => Game | Out) {
  if (snap.fatal) return;
  const r = fn(snap.game);
  const out: Out = 'g' in r ? r : { g: r };
  const ev = [...(out.ev ?? [])];
  if (out.g !== snap.game) {
    const u = unlock(out.g, new Date());
    out.g = u.g;
    u.names.forEach((n) => ev.push({ t: 'toast', kind: 'good', text: `Achievement unlocked: ${n}` }));
    set({ game: out.g, saveError: save(out.g) });
  }
  applyEvents(ev);
}
export const dismissLevelup = () => set({ levelup: null });
export const dismissReveal = () => set({ reveal: null });
export const dismissTalent = () => set({ talentGot: null });
export const dismissNote = () => set({ note: null });

function replaceGame(g: Game) {
  set({ game: g, fatal: null, saveError: save(g), note: null });
}
/** Replace everything with a backup. Throws if the backup is invalid (current data stays untouched). */
export function importBackup(text: string) {
  replaceGame(importJson(text));
  toast('Backup imported.', 'good');
}
export function eraseAll() { wipe(); replaceGame(freshGame()); }
export const backupText = () => exportJson(snap.game);

/** Backup bookkeeping for the reminder. */
export const markBackup = () => act((g) => ({ ...g, lastBackup: Date.now(), backupSnooze: 0 }));
export const snoozeBackup = () => act((g) => ({ ...g, backupSnooze: Date.now() + 3 * 864e5 }));
/** Lets another screen ask the Character screen to open a specific tab. */
export const nav = { charTab: 'sheet' as 'sheet' | 'archive' | 'history' | 'titles' | 'stats' | 'system' };

/** Focus timer (kept in memory only: it runs while the app is open). */
export const openFocusPick = (taskId: string) => set({ focus: { ...snap.focus, pick: taskId } });
export const closeFocusPick = () => set({ focus: { ...snap.focus, pick: null } });
export const startFocus = (taskId: string, mins: number) => set({ focus: { pick: null, run: { taskId, mins, endsAt: Date.now() + mins * 60000 } } });
export const endFocus = () => set({ focus: { ...snap.focus, run: null } });
export const achName = (id: string) => ACH_BY_ID[id]?.name ?? id;
