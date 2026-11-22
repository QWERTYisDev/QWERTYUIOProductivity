import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Character, Round, Stat, Talent } from './logic/types.ts';
import { STATS, STAT_LABEL, STAT_SHORT } from './logic/types.ts';
import { TALENT_BY_ID } from './logic/talents.ts';
import { bonus, effective, maxHealth } from './logic/character.ts';
import { MAX_LEVEL, MAX_XP, XP_PER_LEVEL, levelOf, xpInLevel } from './logic/leveling.ts';
import { dismissLevelup, dismissReveal, dismissTalent, openTalent, useSnap } from './store.ts';

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

/** Last XP value shown per bar, so gains made on another tab still animate when you return. */
const seenXp: Record<string, number> = {};
const xpPct = (t: number, overall: boolean) => (overall ? (t / MAX_XP) * 100 : levelOf(t) >= MAX_LEVEL ? 100 : (xpInLevel(t) / XP_PER_LEVEL) * 100);

/** XP bar: fills smoothly; on a level-up it fills to 100%, then resets to 0 and fills to the carried-over XP. */
export function XpBar({ id, total, overall = false }: { id: string; total: number; overall?: boolean }) {
  const key = id + (overall ? ':all' : ':lv');
  const [w, setW] = useState(xpPct(seenXp[key] ?? total, overall));
  const [snap, setSnap] = useState(false);
  useEffect(() => {
    const from = seenXp[key] ?? total;
    seenXp[key] = total;
    const timers: number[] = [];
    if (!overall && levelOf(total) > levelOf(from)) {
      setW(100);
      timers.push(window.setTimeout(() => {
        setSnap(true); setW(0);
        timers.push(window.setTimeout(() => { setSnap(false); setW(xpPct(total, overall)); }, 60));
      }, 650));
    } else setW(xpPct(total, overall));
    return () => timers.forEach(clearTimeout);
  }, [total, key, overall]);
  return <div className={'bar xp' + (overall ? ' alt' : '') + (snap ? ' snap' : '')}><i style={{ width: `${w}%` }} /></div>;
}

/** Health bar with a lagging trail so damage and healing read as a transition. */
export function HpBar({ value, max }: { value: number; max: number }) {
  const w = `${Math.max(0, Math.min(100, (value / max) * 100))}%`;
  return <div className="hpbar"><i className="trail" style={{ width: w }} /><i className="fill" style={{ width: w }} /></div>;
}

/** Sub-window state with an exit animation: close() plays the fold-away, then unmounts. */
export function useSheet<T>() {
  const [v, setV] = useState<T | null>(null);
  const [closing, setClosing] = useState(false);
  const busy = useRef(false);
  return {
    v, closing,
    open: (x: T) => { busy.current = false; setClosing(false); setV(x); },
    close: () => {
      if (busy.current) return;
      busy.current = true;
      setClosing(true);
      setTimeout(() => { setV(null); setClosing(false); busy.current = false; }, document.body.classList.contains('noanim') ? 0 : 450);
    },
  };
}

export function Modal({ title, onClose, closing, children }: { title: string; onClose: () => void; closing?: boolean; children: ReactNode }) {
  return (
    <div className={'scrim' + (closing ? ' closing' : '')} onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <header><h2>{title}</h2><button className="x" onClick={onClose} aria-label="Close">✕</button></header>
        {children}
      </div>
    </div>
  );
}

const seenStat: Record<string, number> = {};
const calm = () => document.body.classList.contains('noanim') || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function StatCard({ c, s, onSpend }: { c: Character; s: Stat; onSpend?: (s: Stat) => void }) {
  const v = effective(c, s);
  const key = c.id + ':' + s;
  const card = useRef<HTMLDivElement>(null);
  const num = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(v);
  const [pulse, setPulse] = useState(0);
  const [delta, setDelta] = useState(0);
  useEffect(() => {
    const prev = seenStat[key];
    seenStat[key] = v;
    if (prev === undefined || v <= prev) { setShown(v); setDelta(0); return; } // only a real increase animates
    setPulse((n) => n + 1);
    setDelta(v - prev);
    if (!calm()) {
      // Web Animations: re-triggerable without remounting the card (so rapid +1 taps are never lost)
      card.current?.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-2px)' }, { transform: 'translateX(2px)' }, { transform: 'translateX(-1px)' }, { transform: 'translateX(1px)' }, { transform: 'translateX(0)' }], { duration: 340, easing: 'ease-out' });
      num.current?.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 440, easing: 'cubic-bezier(.2,1.5,.4,1)' });
    }
    const t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / 600);
      setShown(prev + (v - prev) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [v, key]);
  const text = shown === v ? fmt(v) : Number.isInteger(v) ? String(Math.round(shown)) : shown.toFixed(1);
  return (
    <div className="stat" ref={card}>
      {pulse > 0 && <i key={pulse} className="flash" />}
      {pulse > 0 && <i key={'r' + pulse} className="ripple" />}
      <span className="sl">{STAT_LABEL[s]}</span>
      <span className="sv" ref={num}>{text}</span>
      <span className="sb">base {c.base[s]}{bonus(c, s) !== 0 && <em> {bonus(c, s) > 0 ? '+' : ''}{fmt(bonus(c, s))} talents</em>}</span>
      {delta > 0 && <span key={'d' + pulse} className="delta">+{fmt(delta)}</span>}
      {onSpend && <button className="plus" disabled={c.sp < 1} onClick={() => onSpend(s)} aria-label={`Spend a skill point on ${STAT_LABEL[s]}`}>+1</button>}
    </div>
  );
}
export function StatGrid({ c, onSpend }: { c: Character; onSpend?: (s: Stat) => void }) {
  return <div className="stats">{STATS.map((s) => <StatCard key={s} c={c} s={s} onSpend={onSpend} />)}</div>;
}

export const TalentChips = ({ c }: { c: Character }) => {
  if (!c.talents.length) return <p className="dim">No talents.</p>;
  const counts: Record<string, number> = {};
  c.talents.forEach((id) => (counts[id] = (counts[id] ?? 0) + 1));
  return (
    <div className="chips">
      {Object.entries(counts).map(([id, n]) => (
        <button key={id} className={'chip tchip r-' + TALENT_BY_ID[id]?.rarity} onClick={() => openTalent(id)} aria-label={`Talent details: ${TALENT_BY_ID[id]?.name ?? id}`}>
          {TALENT_BY_ID[id]?.name ?? id}{n > 1 ? ` ×${n}` : ''}
        </button>
      ))}
    </div>
  );
};

export function TalentCard({ t, delay = 0, onPick, note }: { t: Talent; delay?: number; onPick?: () => void; note?: string }) {
  return (
    <div
      className={'tcard r-' + t.rarity + (onPick ? ' pick' : '')}
      style={{ animationDelay: `${delay}ms` }}
      onClick={onPick}
      role={onPick ? 'button' : undefined}
      tabIndex={onPick ? 0 : undefined}
      onKeyDown={onPick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(); } } : undefined}
    >
      <span className="rar">{t.rarity}</span>
      <h3>{t.name}</h3>
      <p>{t.desc}</p>
      {note && <p className="dim">{note}</p>}
    </div>
  );
}

export function Fighter({ c, hp, max, side, hit }: { c: Character; hp?: number; max?: number; side: 'l' | 'r'; hit?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (hit && !calm()) ref.current?.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(2px)' }, { transform: 'translateX(0)' }], { duration: 380, easing: 'ease-out' });
  }, [hit]);
  return (
    <div className={'fighter ' + side} ref={ref}>
      {hit ? <i key={hit} className="hitfx" /> : null}
      {hit ? <b key={'d' + hit} className="dmg">-1</b> : null}
      <h3>{c.name}</h3>
      <p className="dim">Gen {c.gen} · Lv {levelOf(c.totalXp)}</p>
      <HpBar value={hp ?? maxHealth(c)} max={max ?? maxHealth(c)} />
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
export function RoundDetail({ r, pName, bName, stag }: { r: Round; pName: string; bName: string; stag?: boolean }) {
  return (
    <div className={'round' + (stag ? ' stag' : '')}>
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
  const { reveal, levelup, talentGot, game } = useSnap();
  const [out, setOut] = useState(false);
  // dismiss with a fold-away first
  const leave = (fn: () => void) => () => {
    if (out) return;
    setOut(true);
    setTimeout(() => { fn(); setOut(false); }, document.body.classList.contains('noanim') ? 0 : 450);
  };
  const cls = 'scrim over' + (out ? ' closing' : '');
  if (reveal) {
    return (
      <div className={cls}>
        <div className="reveal">
          <small className="sysh">[ PLAYER REGISTERED ]</small>
          <p className="dim">The System has chosen you</p>
          <h1>{reveal.name}</h1>
          <ul>
            {STATS.map((s, i) => <li key={s}><span>{STAT_LABEL[s]}</span><Roll to={reveal.base[s]} delay={i * 450} anim={game.prefs.anim} /></li>)}
          </ul>
          <p className="dim">Health 10 · Level 1</p>
          <button className="btn" onClick={leave(dismissReveal)}>Begin</button>
        </div>
      </div>
    );
  }
  if (levelup) {
    return (
      <div className={cls} onClick={leave(dismissLevelup)}>
        <div className="rays" aria-hidden="true" />
        <div className="burst" aria-hidden="true"><i /><i /><i /></div>
        <div className="reveal lvl">
          <small className="sysh">[ NOTIFICATION ]</small>
          <h1>LEVEL UP</h1>
          <p className="big">Level {levelup.level}</p>
          <ul className="rew">
            <li>+{levelup.levels * 100} Gold</li>
            <li>+{levelup.levels * 3} Skill Points</li>
            <li>+{levelup.levels} Talent Hand{levelup.levels > 1 ? 's' : ''}</li>
          </ul>
          <button className="btn" onClick={leave(dismissLevelup)}>Continue</button>
        </div>
      </div>
    );
  }
  const tg = talentGot ? TALENT_BY_ID[talentGot] : null;
  if (tg) {
    return (
      <div className={cls} onClick={leave(dismissTalent)}>
        <div className="rays" aria-hidden="true" />
        <div className="burst" aria-hidden="true"><i /><i /><i /></div>
        <div className={'reveal tget r-' + tg.rarity}>
          <small className="sysh">[ TALENT ACQUIRED ]</small>
          <h1>{tg.name}</h1>
          <p className="rar">{tg.rarity}</p>
          <p>{tg.desc}</p>
          <button className="btn" onClick={leave(dismissTalent)}>Continue</button>
        </div>
      </div>
    );
  }
  return null;
}

export function Toasts() {
  const { toasts } = useSnap();
  const label = { good: 'NOTIFICATION', bad: 'WARNING', info: 'SYSTEM' };
  return <div className="toasts" aria-live="polite">{toasts.map((t) => <div key={t.id} className={'toast ' + t.kind}><small>[ {label[t.kind]} ]</small><span>{t.text}</span></div>)}</div>;
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
