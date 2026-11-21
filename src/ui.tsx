import { useEffect, useState, type ReactNode } from 'react';
import type { Character, Round, Stat, Talent } from './logic/types.ts';
import { STATS, STAT_LABEL, STAT_SHORT } from './logic/types.ts';
import { TALENT_BY_ID } from './logic/talents.ts';
import { bonus, effective, maxHealth } from './logic/character.ts';
import { levelOf } from './logic/leveling.ts';
import { dismissLevelup, dismissReveal, useSnap } from './store.ts';

export const fmt = (n: number) => String(+n.toFixed(2));

export function Panel({ title, right, children, cls = '' }: { title?: string; right?: ReactNode; children: ReactNode; cls?: string }) {
  return (
    <section className={'panel ' + cls}>
      {title && <header><h2>{title}</h2>{right}</header>}
      {children}
    </section>
  );
}
export const Bar = ({ value, max, cls = '' }: { value: number; max: number; cls?: string }) => (
  <div className={'bar ' + cls}><i style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%` }} /></div>
);

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <header><h2>{title}</h2><button className="x" onClick={onClose} aria-label="Close">✕</button></header>
        {children}
      </div>
    </div>
  );
}

export function StatGrid({ c, onSpend }: { c: Character; onSpend?: (s: Stat) => void }) {
  return (
    <div className="stats">
      {STATS.map((s) => (
        <div className="stat" key={s}>
          <span className="sl">{STAT_LABEL[s]}</span>
          <span className="sv">{fmt(effective(c, s))}</span>
          <span className="sb">base {c.base[s]}{bonus(c, s) !== 0 && <em> {bonus(c, s) > 0 ? '+' : ''}{fmt(bonus(c, s))} talents</em>}</span>
          {onSpend && <button className="plus" disabled={c.sp < 1} onClick={() => onSpend(s)} aria-label={`Spend a skill point on ${STAT_LABEL[s]}`}>+1</button>}
        </div>
      ))}
    </div>
  );
}

export const TalentChips = ({ c }: { c: Character }) => {
  if (!c.talents.length) return <p className="dim">No talents.</p>;
  const counts: Record<string, number> = {};
  c.talents.forEach((id) => (counts[id] = (counts[id] ?? 0) + 1));
  return <div className="chips">{Object.entries(counts).map(([id, n]) => <span key={id} className={'chip r-' + TALENT_BY_ID[id]?.rarity}>{TALENT_BY_ID[id]?.name ?? id}{n > 1 ? ` ×${n}` : ''}</span>)}</div>;
};

export function TalentCard({ t, delay = 0, onPick, note }: { t: Talent; delay?: number; onPick?: () => void; note?: string }) {
  return (
    <div className={'tcard r-' + t.rarity} style={{ animationDelay: `${delay}ms` }}>
      <span className="rar">{t.rarity}</span>
      <h3>{t.name}</h3>
      <p>{t.desc}</p>
      {note && <p className="dim">{note}</p>}
      {onPick && <button className="btn" onClick={onPick}>Choose</button>}
    </div>
  );
}

export function Fighter({ c, hp, max, side }: { c: Character; hp?: number; max?: number; side: 'l' | 'r' }) {
  return (
    <div className={'fighter ' + side}>
      <h3>{c.name}</h3>
      <p className="dim">Gen {c.gen} · Lv {levelOf(c.totalXp)}</p>
      <Bar value={hp ?? maxHealth(c)} max={max ?? maxHealth(c)} cls="hp" />
      <p className="hpn">HP {hp ?? maxHealth(c)}/{max ?? maxHealth(c)}</p>
      <ul className="fstats">
        {STATS.map((s) => (
          <li key={s}><span>{STAT_SHORT[s]}</span><b>{fmt(effective(c, s))}</b><small>{c.base[s]}{bonus(c, s) ? ` ${bonus(c, s) > 0 ? '+' : ''}${fmt(bonus(c, s))}` : ''}</small></li>
        ))}
      </ul>
      <TalentChips c={c} />
    </div>
  );
}

const side = (who: string, s: Stat, eff: number, flat: number, pct: number, match: number, rand: number, fin: number) => (
  <p className="calc"><b>{who}</b> {STAT_SHORT[s]} {fmt(eff)}{flat ? ` +${flat} talent` : ''}{pct ? ` +${pct}% talent` : ''}{match ? ' +25% matchup' : ''} {rand >= 0 ? '+' : ''}{rand} roll = <b>{fmt(fin)}</b></p>
);
export function RoundDetail({ r, pName, bName }: { r: Round; pName: string; bName: string }) {
  return (
    <div className="round">
      {side(pName, r.pStat, r.pEff, r.pFlat, r.pPct, r.pMatch, r.pRand, r.pFinal)}
      {side(bName, r.bStat, r.bEff, r.bFlat, r.bPct, r.bMatch, r.bRand, r.bFinal)}
      <p className={'res ' + r.winner}>{r.winner === 'tie' ? 'Tie: no damage' : `${r.winner === 'p' ? pName : bName} wins the round (-1 HP to the other)`} · HP {r.pHp} / {r.bHp}</p>
    </div>
  );
}

/** Slot-machine reveal that settles on the real value. Honors the animation preference. */
function Roll({ to, delay, anim }: { to: number; delay: number; anim: boolean }) {
  const [v, setV] = useState<number | null>(anim ? null : to);
  useEffect(() => {
    if (!anim) { setV(to); return; }
    const t0 = Date.now() + delay;
    const id = setInterval(() => {
      const t = Date.now() - t0;
      if (t < 0) return;
      if (t > 900) { setV(to); clearInterval(id); } else setV(5 + Math.floor(Math.random() * 11));
    }, 60);
    return () => clearInterval(id);
  }, [to, delay, anim]);
  return <b>{v ?? '?'}</b>;
}

export function Overlays() {
  const { reveal, levelup, game } = useSnap();
  if (reveal) {
    return (
      <div className="scrim over">
        <div className="reveal">
          <p className="dim">The System has chosen you</p>
          <h1>{reveal.name}</h1>
          <ul>
            {STATS.map((s, i) => <li key={s}><span>{STAT_LABEL[s]}</span><Roll to={reveal.base[s]} delay={i * 450} anim={game.prefs.anim} /></li>)}
          </ul>
          <p className="dim">Health 10 · Level 1</p>
          <button className="btn" onClick={dismissReveal}>Begin</button>
        </div>
      </div>
    );
  }
  if (levelup) {
    return (
      <div className="scrim over" onClick={dismissLevelup}>
        <div className="reveal lvl">
          <p className="dim">System notification</p>
          <h1>LEVEL UP</h1>
          <p className="big">Level {levelup.level}</p>
          <ul className="rew">
            <li>+{levelup.levels * 100} Gold</li>
            <li>+{levelup.levels * 3} Skill Points</li>
            <li>+{levelup.levels} Talent Hand{levelup.levels > 1 ? 's' : ''}</li>
          </ul>
          <button className="btn" onClick={dismissLevelup}>Continue</button>
        </div>
      </div>
    );
  }
  return null;
}

export function Toasts() {
  const { toasts } = useSnap();
  return <div className="toasts" aria-live="polite">{toasts.map((t) => <div key={t.id} className={'toast ' + t.kind}>{t.text}</div>)}</div>;
}

const P: Record<string, string> = {
  home: 'M3 11l9-8 9 8v10h-6v-6H9v6H3z',
  tasks: 'M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2',
  shop: 'M5 8h14l-1 12H6zM9 8a3 3 0 0 1 6 0',
  character: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 4-6 8-6s8 2 8 6',
  talents: 'M12 3l2.8 5.8 6.2.9-4.5 4.4 1 6.2L12 17.3l-5.5 3 1-6.2L3 9.7l6.2-.9z',
  battle: 'M4 4l9 9M20 4l-9 9M3 21l4-4M21 21l-4-4M7 13l4 4M17 13l-4 4',
  lock: 'M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3',
};
export const Icon = ({ n }: { n: string }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={P[n]} /></svg>
);
