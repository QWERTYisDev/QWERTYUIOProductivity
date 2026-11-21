import type { Battle, BattleRecord, Character, Game, Round, Stat } from './types.ts';
import { STATS } from './types.ts';
import { effective, maxHealth, talentTotals } from './character.ts';
import { TALENT_BY_ID } from './talents.ts';
import { randInt, pickWeighted, uid, type Rnd } from './rand.ts';
import { levelOf, MAX_LEVEL } from './leveling.ts';

/** Attacker stat -> the defender stat it gets +25% against. */
export const BEATS: Record<Stat, Stat> = { str: 'fort', agi: 'str', fort: 'mana', mana: 'agi' };
export const MATCHUP_BONUS = 0.25;
const RANK_WEIGHTS = [130, 115, 105, 100];
const r1 = (n: number) => Math.round(n * 10) / 10;

/** Weight per stat: 100 base, rank by effective value (highest 130, then 115, 105, lowest 100). Ties keep STR/AGI/FOR/MAN order. */
export function statWeights(c: Character): Record<Stat, number> {
  const ranked = [...STATS].sort((a, b) => effective(c, b) - effective(c, a) || STATS.indexOf(a) - STATS.indexOf(b));
  const w = {} as Record<Stat, number>;
  ranked.forEach((s, i) => (w[s] = RANK_WEIGHTS[i]));
  return w;
}

/** Three unique stats drawn by weight from the four. */
export function pickOptions(c: Character, rnd: Rnd = Math.random): Stat[] {
  const w = statWeights(c);
  const pool = [...STATS];
  const out: Stat[] = [];
  while (out.length < 3) {
    const i = pickWeighted(pool.map((s) => w[s]), rnd);
    out.push(pool.splice(i, 1)[0]);
  }
  return out;
}
export const pickBossStat = (c: Character, options: Stat[], rnd: Rnd = Math.random): Stat => {
  const w = statWeights(c);
  return options[pickWeighted(options.map((s) => w[s]), rnd)];
};

/** Battle-talent bonus for using `use` against `vs`. */
export function condBonus(c: Character, use: Stat, vs: Stat): { flat: number; pct: number } {
  let flat = 0, pct = 0;
  for (const id of c.talents) {
    for (const k of TALENT_BY_ID[id]?.cond ?? []) {
      if (k.use === use && (!k.vs || k.vs === vs)) { flat += k.flat ?? 0; pct += k.pct ?? 0; }
    }
  }
  return { flat, pct };
}

/** final = (effective + cond flat) * (1 + matchup 25% + cond %) + random(-3..+3), rounded to 0.1. */
export function rollSide(c: Character, use: Stat, vs: Stat, rnd: Rnd = Math.random) {
  const eff = effective(c, use);
  const match = BEATS[use] === vs ? MATCHUP_BONUS : 0;
  const k = condBonus(c, use, vs);
  const rand = randInt(-3, 3, rnd);
  return { eff, match, flat: k.flat, pct: k.pct, rand, final: r1((eff + k.flat) * (1 + match + k.pct / 100) + rand) };
}

export function startBattle(g: Game, rnd: Rnd = Math.random): Game {
  const c = g.character;
  if (!c || levelOf(c.totalXp) < MAX_LEVEL || g.battle) return g;
  const pMax = maxHealth(c), bMax = maxHealth(g.boss);
  const battle: Battle = {
    id: uid(rnd), player: c, boss: g.boss, pMax, bMax, pHp: pMax, bHp: bMax,
    options: pickOptions(g.boss, rnd), rounds: [], over: false, startedAt: Date.now(),
  };
  return { ...g, battle };
}

export function playRound(g: Game, pStat: Stat, rnd: Rnd = Math.random): Game {
  const b = g.battle;
  if (!b || b.over || !STATS.includes(pStat)) return g;
  const bStat = pickBossStat(b.boss, b.options, rnd);
  const p = rollSide(b.player, pStat, bStat, rnd);
  const o = rollSide(b.boss, bStat, pStat, rnd);
  const winner: Round['winner'] = p.final > o.final ? 'p' : p.final < o.final ? 'b' : 'tie';
  const pHp = Math.max(0, b.pHp - (winner === 'b' ? 1 : 0));
  const bHp = Math.max(0, b.bHp - (winner === 'p' ? 1 : 0));
  const round: Round = {
    n: b.rounds.length + 1, options: b.options, pStat, bStat,
    pEff: p.eff, bEff: o.eff, pFlat: p.flat, bFlat: o.flat, pPct: p.pct, bPct: o.pct, pMatch: p.match, bMatch: o.match,
    pRand: p.rand, bRand: o.rand, pFinal: p.final, bFinal: o.final, winner, pHp, bHp,
  };
  const over = pHp === 0 || bHp === 0;
  return {
    ...g,
    battle: { ...b, pHp, bHp, rounds: [...b.rounds, round], over, winner: over ? (pHp === 0 ? 'b' : 'p') : undefined, options: over ? b.options : pickOptions(b.boss, rnd) },
  };
}

/** Applies the result once: boss inheritance, archive, history, next generation. */
export function finishBattle(g: Game): Game {
  const b = g.battle;
  if (!b || !b.over || !b.winner) return g;
  const playerWon = b.winner === 'p';
  const rec: BattleRecord = {
    id: b.id, at: Date.now(), gen: g.gen, player: b.player, boss: b.boss,
    winner: playerWon ? 'player' : 'boss', winnerName: playerWon ? b.player.name : b.boss.name, loserName: playerWon ? b.boss.name : b.player.name,
    rounds: b.rounds, pHp: b.pHp, bHp: b.bHp, pMax: b.pMax, bMax: b.bMax,
  };
  const newBoss: Character = playerWon ? { ...b.player, sp: 0, hands: 0, offer: null, fate: 'boss' } : g.boss;
  const archived: Character = playerWon ? { ...b.boss, fate: 'defeated' } : { ...b.player, sp: 0, hands: 0, offer: null, fate: 'fallen' };
  return {
    ...g, boss: newBoss, archive: [...g.archive, archived], battles: [...g.battles, rec],
    gen: g.gen + 1, character: null, battle: null,
  };
}
