import type { Game } from './types.ts';
import { freshGame, SAVE_VERSION } from './game.ts';

const KEY = 'system-rpg-save';
const PREV = KEY + '.prev';

export interface Loaded { game: Game | null; error: string | null; raw: string | null; note?: string }

/** Turns parsed JSON (any older version) into a current Game. Add a step per version bump. */
export function migrate(obj: any): Game {
  if (!obj || typeof obj !== 'object') throw new Error('Save is not an object.');
  const v = obj.v ?? 1;
  if (v > SAVE_VERSION) throw new Error(`Save is from a newer version (v${v}). Update the app.`);
  // v1 is current. Future: if (v === 1) obj = { ...obj, newField: ..., v: 2 };
  const g: Game = { ...freshGame(), ...obj, v: 1 };
  if (!g.boss || !g.boss.base || !Array.isArray(g.tasks) || !Array.isArray(g.shop) || !Array.isArray(g.archive) || !Array.isArray(g.battles) || !Array.isArray(g.purchases)) {
    throw new Error('Save is missing required data.');
  }
  if (typeof g.gold !== 'number' || typeof g.gems !== 'number' || typeof g.gen !== 'number') throw new Error('Save has invalid numbers.');
  g.completions = g.completions && typeof g.completions === 'object' ? g.completions : {};
  g.prefs = { anim: g.prefs?.anim !== false };
  return g;
}

export function load(): Loaded {
  let raw: string | null;
  try { raw = localStorage.getItem(KEY); } catch { return { game: null, raw: null, error: 'Browser storage is unavailable (private mode or blocked). Progress cannot be saved.' }; }
  if (raw === null) return { game: freshGame(), error: null, raw: null };
  try { return { game: migrate(JSON.parse(raw)), error: null, raw }; } catch (e) {
    try {
      const prev = localStorage.getItem(PREV);
      if (prev) return { game: migrate(JSON.parse(prev)), error: null, raw, note: 'Your latest save was damaged, so the previous save was restored.' };
    } catch { /* fall through */ }
    return { game: null, raw, error: `Saved data could not be read: ${(e as Error).message}` };
  }
}

/** Returns an error message, or null on success. Keeps the previous save as a fallback. */
export function save(g: Game): string | null {
  try {
    const old = localStorage.getItem(KEY);
    localStorage.setItem(KEY, JSON.stringify(g));
    if (old) localStorage.setItem(PREV, old);
    return null;
  } catch (e) { return `Could not save progress: ${(e as Error).message}`; }
}

export const exportJson = (g: Game) => JSON.stringify({ app: 'system-rpg', exportedAt: new Date().toISOString(), ...g }, null, 1);
export function importJson(text: string): Game { return migrate(JSON.parse(text)); }
