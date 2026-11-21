import type { Game, Stat } from '../logic/types.ts';
import { STATS, STAT_LABEL, STAT_SHORT } from '../logic/types.ts';
import { MAX_LEVEL, levelOf } from '../logic/leveling.ts';
import { effective } from '../logic/character.ts';
import { BEATS, finishBattle, playRound, startBattle } from '../logic/battle.ts';
import { act } from '../store.ts';
import { Fighter, Panel, RoundDetail, fmt } from '../ui.tsx';

export default function Battle({ g }: { g: Game }) {
  const c = g.character!;
  if (levelOf(c.totalXp) < MAX_LEVEL) {
    return <Panel title="Battle"><h3>Locked</h3><p className="dim">Reach Level {MAX_LEVEL} to face {g.boss.name}.</p></Panel>;
  }
  const b = g.battle;
  if (!b) {
    return (
      <>
        <Panel title="Confrontation" cls="vs">
          <div className="versus"><Fighter c={c} side="l" /><div className="vsmark">VS</div><Fighter c={g.boss} side="r" /></div>
          <p className="dim">Each round: pick a stat. The boss picks from the three stats it shows you. Higher final value wins; the loser takes 1 damage. Ties do nothing. Strength beats Fortitude, Agility beats Strength, Fortitude beats Mana, Mana beats Agility (+25%).</p>
          <button className="btn wide" onClick={() => act((x) => startBattle(x))}>Begin Battle</button>
        </Panel>
      </>
    );
  }
  const last = b.rounds[b.rounds.length - 1];
  const hint = (s: Stat) => {
    const adv = b.options.includes(BEATS[s]);
    const weak = b.options.some((o) => BEATS[o] === s);
    return adv && weak ? '▲▼' : adv ? `▲ +25% vs ${STAT_SHORT[BEATS[s]]}` : weak ? '▼ boss may counter' : '';
  };
  return (
    <>
      <Panel title={`Round ${b.over ? b.rounds.length : b.rounds.length + 1}`} cls="vs">
        <div className="versus"><Fighter c={b.player} hp={b.pHp} max={b.pMax} side="l" /><div className="vsmark">VS</div><Fighter c={b.boss} hp={b.bHp} max={b.bMax} side="r" /></div>
      </Panel>
      {!b.over && (
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
      {last && <Panel title={`Round ${last.n} result`}><RoundDetail r={last} pName={b.player.name} bName={b.boss.name} /></Panel>}
      {b.over && (
        <Panel title={b.winner === 'p' ? 'Victory' : 'Defeat'} cls="result">
          <p>{b.winner === 'p' ? `${b.player.name} defeats ${b.boss.name} and becomes the new boss.` : `${b.player.name} has fallen. ${b.boss.name} remains the boss.`}</p>
          <button className="btn wide" onClick={() => act(finishBattle)}>Continue to next generation</button>
        </Panel>
      )}
      {b.rounds.length > 1 && (
        <Panel title="Earlier rounds">
          {[...b.rounds].slice(0, -1).reverse().map((r) => <div key={r.n}><p className="rn">Round {r.n}</p><RoundDetail r={r} pName={b.player.name} bName={b.boss.name} /></div>)}
        </Panel>
      )}
    </>
  );
}
