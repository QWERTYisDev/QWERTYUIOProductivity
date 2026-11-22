import type { Game } from './types.ts';
import { dateKey } from './tasks.ts';

const at = (d: Date, n: number) => { const x = new Date(d); x.setHours(12, 0, 0, 0); x.setDate(x.getDate() + n); return x; };

/** Gold/Gems earned are derived: what you hold now plus everything spent (shop buys, talent re-rolls). */
export function totals(g: Game) {
  const goldOut = g.purchases.reduce((a, p) => a + p.price, 0);
  const gemsOut = g.purchases.reduce((a, p) => a + (p.gems ?? 0), 0) + g.rerolls * 10 + g.favorsBought * 25;
  return { goldIn: g.gold + goldOut, goldOut, gemsIn: g.gems + gemsOut, gemsOut };
}

export function statsOf(g: Game, now: Date = new Date()) {
  const recs = Object.values(g.completions);
  const perDay: Record<string, { n: number; xp: number }> = {};
  for (const r of recs) { const k = dateKey(new Date(r.at)); (perDay[k] ??= { n: 0, xp: 0 }); perDay[k].n++; perDay[k].xp += r.xp; }
  const days = Array.from({ length: 14 }, (_, i) => { const d = at(now, i - 13); const k = dateKey(d); return { date: k, label: `${d.getMonth() + 1}/${d.getDate()}`, xp: perDay[k]?.xp ?? 0 }; });
  const mon = at(now, -((now.getDay() + 6) % 7)); // this week's Monday
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const start = at(mon, (i - 7) * 7);
    let n = 0;
    for (let d = 0; d < 7; d++) n += perDay[dateKey(at(start, d))]?.n ?? 0;
    return { label: `${start.getMonth() + 1}/${start.getDate()}`, n };
  });
  const sun = at(now, -now.getDay() - 77); // 12 columns, Sunday first
  const today = dateKey(now);
  const heat = Array.from({ length: 84 }, (_, i) => { const k = dateKey(at(sun, i)); return { date: k, n: perDay[k]?.n ?? 0, future: k > today }; });
  return { days, weeks, heat, quests: recs.length, xp: recs.reduce((a, r) => a + r.xp, 0), ...totals(g) };
}
