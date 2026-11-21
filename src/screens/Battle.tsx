import { useEffect, useRef, useState } from 'react';
import type { Game, Stat } from '../logic/types.ts';
import { STATS, STAT_LABEL, STAT_SHORT } from '../logic/types.ts';
import { MAX_LEVEL, levelOf } from '../logic/leveling.ts';
import { effective } from '../logic/character.ts';
import { BEATS, finishBattle, playRound, startBattle } from '../logic/battle.ts';
import { act, sfx } from '../store.ts';
import { Fighter, Panel, RoundDetail, fmt } from '../ui.tsx';

const quick = () => document.body.classList.contains('noanim') || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function Battle({ g }: { g: Game }) {
  const c = g.character!;
  const b = g.battle;
  const n = b?.rounds.length ?? 0;
  // The game state already holds the finished round; the screen replays it: rolls appear one by one, then the hit lands.
  const [hpN, setHpN] = useState(n); // rounds whose damage is shown on the health bars
  const [doneN, setDoneN] = useState(n); // rounds whose reveal has finished
  const [hit, setHit] = useState<{ side: 'p' | 'b'; k: number } | null>(null);
  const timers = useRef<number[]>([]);
  useEffect(() => {
    if (!b) { setHpN(0); setDoneN(0); setHit(null); return; }
    if (n <= doneN) return;
    const last = b.rounds[n - 1];
    const land = () => {
      setHpN(n);
      if (last.winner !== 'tie') { setHit({ side: last.winner === 'p' ? 'b' : 'p', k: n }); sfx('hit'); }
    };
    if (quick()) { land(); setDoneN(n); return; }
    timers.current = [window.setTimeout(land, 1700), window.setTimeout(() => setDoneN(n), 2500)];
    return () => timers.current.forEach(clearTimeout);
  }, [n, b?.id]);
  const finished = !!b?.over && doneN >= n;
  useEffect(() => { if (finished && b) sfx(b.winner === 'p' ? 'win' : 'lose'); }, [finished]);

  if (levelOf(c.totalXp) < MAX_LEVEL) {
    return <Panel title="Battle"><h3>Locked</h3><p className="dim">Reach Level {MAX_LEVEL} to face {g.boss.name}.</p></Panel>;
  }
  if (!b) {
    return (
      <Panel title="Confrontation" cls="vs">
        <div className="versus"><Fighter c={c} side="l" /><div className="vsmark">VS</div><Fighter c={g.boss} side="r" /></div>
        <p className="dim">Each round: pick a stat. The boss picks from the three stats it shows you. Higher final value wins; the loser takes 1 damage. Ties do nothing. Strength beats Fortitude, Agility beats Strength, Fortitude beats Mana, Mana beats Agility (+25%).</p>
        <button className="btn wide" onClick={() => act((x) => startBattle(x))}>Begin Battle</button>
      </Panel>
    );
  }
  const last = b.rounds[n - 1];
  const revealing = doneN < n;
  const pHp = hpN === 0 ? b.pMax : b.rounds[hpN - 1].pHp;
  const bHp = hpN === 0 ? b.bMax : b.rounds[hpN - 1].bHp;
  const skip = () => { timers.current.forEach(clearTimeout); setHpN(n); setDoneN(n); };
  const hint = (s: Stat) => {
    const adv = b.options.includes(BEATS[s]);
    const weak = b.options.some((o) => BEATS[o] === s);
    return adv && weak ? '▲▼' : adv ? `▲ +25% vs ${STAT_SHORT[BEATS[s]]}` : weak ? '▼ boss may counter' : '';
  };
  return (
    <>
      <Panel title={`Round ${finished ? n : revealing ? n : n + 1}`} cls="vs">
        <div className="versus">
          <Fighter c={b.player} hp={pHp} max={b.pMax} side="l" hit={hit?.side === 'p' ? hit.k : undefined} />
          <div className="vsmark">VS</div>
          <Fighter c={b.boss} hp={bHp} max={b.bMax} side="r" hit={hit?.side === 'b' ? hit.k : undefined} />
        </div>
      </Panel>
      {!b.over && !revealing && (
        <>
          <Panel title="Boss may use">
            <div className="opts">
              {b.options.map((s) => <div key={s} className="opt"><span>{STAT_LABEL[s]}</span><b>{fmt(effective(b.boss, s))}</b></div>)}
            </div>
          </Panel>
          <Panel title="Your move">
            <div className="moves">
              {STATS.map((s) => (
                <button key={s} className="move" onClick={() => act((x) => playRound(x, s))}>
                  <span>{STAT_LABEL[s]}</span><b>{fmt(effective(b.player, s))}</b><small className={hint(s).startsWith('▲') ? 'up' : 'dn'}>{hint(s) || '—'}</small>
                </button>
              ))}
            </div>
          </Panel>
        </>
      )}
      {last && (
        <Panel title={`Round ${last.n} result`}>
          <div onClick={revealing ? skip : undefined}>
            <RoundDetail r={last} pName={b.player.name} bName={b.boss.name} stag={revealing} />
            {revealing && <p className="dim">Tap to skip</p>}
          </div>
        </Panel>
      )}
      {finished && (
        <Panel title={b.winner === 'p' ? 'Victory' : 'Defeat'} cls="result">
          <p>{b.winner === 'p' ? `${b.player.name} defeats ${b.boss.name} and becomes the new boss.` : `${b.player.name} has fallen. ${b.boss.name} remains the boss.`}</p>
          <button className="btn wide" onClick={() => act(finishBattle)}>Continue to next generation</button>
        </Panel>
      )}
      {b.rounds.length > 1 && (
        <Panel title="Earlier rounds">
          <div className="scrollbox">
          {[...b.rounds].slice(0, -1).reverse().map((r) => <div key={r.n}><p className="rn">Round {r.n}</p><RoundDetail r={r} pName={b.player.name} bName={b.boss.name} /></div>)}
          </div>
        </Panel>
      )}
    </>
  );
}
