import type { Game, Task } from '../logic/types.ts';
import { STATS, STAT_LABEL } from '../logic/types.ts';
import { MAX_LEVEL, MAX_XP, XP_PER_LEVEL, levelOf, xpInLevel } from '../logic/leveling.ts';
import { activeOn, dateKey, isDone, sortTasks } from '../logic/tasks.ts';
import { bonus, effective, maxHealth } from '../logic/character.ts';
import { HpBar, Panel, StatGrid, TalentChips, XpBar, fmt } from '../ui.tsx';
import { TaskRow } from './TaskRow.tsx';

function Boss({ g }: { g: Game }) {
  const b = g.boss;
  const max = maxHealth(b);
  const hp = g.battle ? g.battle.bHp : max; // live health only while a battle is running
  const defended = g.battles.filter((x) => x.boss.id === b.id && x.winner === 'boss').length;
  const crowned = g.battles.find((x) => x.winner === 'player' && x.player.id === b.id);
  return (
    <section className="panel boss-panel">
      <header><h2>Current Boss</h2><span className="tag red">Lv {levelOf(b.totalXp)}</span></header>
      <div>
        <h3 className="bname">{b.name}</h3>
        <p className="btitle">{b.gen === 0 ? 'Guardian of the System' : `Reigning Champion · Gen ${b.gen}`}</p>
      </div>
      <div>
        <p className="row"><span>Health</span><b>{hp} / {max}</b></p>
        <HpBar value={hp} max={max} />
      </div>
      <div className="bstats">
        {STATS.map((s) => (
          <div key={s}><span>{STAT_LABEL[s]}</span><b>{fmt(effective(b, s))}</b>{bonus(b, s) !== 0 && <small>base {b.base[s]}</small>}</div>
        ))}
      </div>
      <TalentChips c={b} />
      <p className="dim">
        {defended > 0 ? `Undefeated against ${defended} challenger${defended === 1 ? '' : 's'}.` : 'Unchallenged. No one has stood against it yet.'}
        {crowned ? ` Took the throne from ${crowned.boss.name}.` : b.gen === 0 ? ' Has held the throne since the beginning.' : ''}
      </p>
    </section>
  );
}

export default function Home({ g, now, go }: { g: Game; now: Date; go: (s: string) => void }) {
  const c = g.character!;
  const lv = levelOf(c.totalXp);
  const today = dateKey(now);
  const todays = (type: 'daily' | 'weekly') => sortTasks(g.tasks.filter((t) => t.type === type && activeOn(t, now)), 'priority');
  const daily = todays('daily'), weekly = todays('weekly');
  const once = sortTasks(g.tasks.filter((t) => t.type === 'once' && !isDone(g, t, today)), 'due');
  const recurring = [...daily, ...weekly];
  const doneCount = recurring.filter((t) => isDone(g, t, today)).length;
  const Group = ({ label, list }: { label: string; list: Task[] }) => (
    <div className="group">
      <h4>{label}</h4>
      {list.length ? list.map((t) => <TaskRow key={t.id} t={t} g={g} now={now} />) : <p className="dim">None right now.</p>}
    </div>
  );
  return (
    <>
      <Panel title="Quests" right={<span className="tag">{doneCount}/{recurring.length} today</span>}>
        {g.tasks.length === 0 && <p className="dim">No quests yet. <button className="link" onClick={() => go('tasks')}>Create your first quest</button></p>}
        <Group label="Daily" list={daily} />
        <Group label="Weekly" list={weekly} />
        <Group label="One-time" list={once} />
      </Panel>

      <Panel title="Player" right={<span className="tag">Gen {c.gen}</span>}>
        <div className="hero">
          <div className="lv"><small>LV</small><b>{lv}</b></div>
          <div className="grow">
            <h1>{c.name}</h1>
            <p className="dim">{lv >= MAX_LEVEL ? 'Status: READY. The boss awaits.' : 'Status: Awakened, leveling'}</p>
          </div>
        </div>
        <div>
          <p className="row"><span>XP</span><span>{lv >= MAX_LEVEL ? 'MAX' : `${xpInLevel(c.totalXp)} / ${XP_PER_LEVEL}`}</span></p>
          <XpBar id={c.id} total={c.totalXp} />
        </div>
        <div>
          <p className="row"><span>Progress to Level {MAX_LEVEL}</span><span>{c.totalXp.toLocaleString()} / {MAX_XP.toLocaleString()}</span></p>
          <XpBar id={c.id} total={c.totalXp} overall />
        </div>
        {lv >= MAX_LEVEL && <button className="btn wide" onClick={() => go('battle')}>Enter Battle</button>}
        <div className="cur">
          <div><small>Gold</small><b className="gold">{g.gold}</b></div>
          <div><small>Gems</small><b className="gem">{g.gems}</b></div>
          <div><small>Skill Pts</small><b>{c.sp}</b></div>
          <div><small>Hands</small><b>{c.hands}</b></div>
        </div>
      </Panel>

      <section className="panel">
        <details open>
          <summary><h2>Stats</h2><span className="tag">HP {maxHealth(c)}</span></summary>
          <StatGrid c={c} />
          <TalentChips c={c} />
        </details>
      </section>

      <Boss g={g} />
    </>
  );
}
