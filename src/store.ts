import { useSyncExternalStore } from 'react';
import type { Character, Ev, Game, Out } from './logic/types.ts';
import { exportJson, importJson, load, save, wipe } from './logic/storage.ts';
import { freshGame } from './logic/game.ts';

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
}

const loaded = load();
let snap: Snap = {
  game: loaded.game ?? freshGame(),
  fatal: loaded.error ? { error: loaded.error, raw: loaded.raw } : null,
  saveError: null, note: loaded.note ?? null, toasts: [], levelup: null, reveal: null, talentGot: null,
};
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
    else if (e.t === 'levelup') set({ levelup: { level: e.level, levels: e.levels } });
    else if (e.t === 'reveal') set({ reveal: e.char });
    else if (e.t === 'talent') set({ talentGot: e.id });
  }
};

/** Runs a state change synchronously (so rapid taps always see the latest state), saves, then shows events. */
export function act(fn: (g: Game) => Game | Out) {
  if (snap.fatal) return;
  const r = fn(snap.game);
  const out: Out = 'g' in r ? r : { g: r };
  if (out.g !== snap.game) set({ game: out.g, saveError: save(out.g) });
  if (out.ev) applyEvents(out.ev);
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
