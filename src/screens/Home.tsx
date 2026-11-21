import type { Game } from '../logic/types.ts';
import { STATS, STAT_LABEL } from '../logic/types.ts';
import { MAX_LEVEL, MAX_XP, XP_PER_LEVEL, levelOf, xpInLevel } from '../logic/leveling.ts';
import { activeOn, dateKey, isDone, sortTasks } from '../logic/tasks.ts';
import { bonus, effective, maxHealth } from '../logic/character.ts';
import { Bar, Panel, StatGrid, TalentChips, fmt } from '../ui.tsx';
import { TaskRow } from './TaskRow.tsx';

export default function Home({ g, now, go }: { g: Game; now: Date; go: (s: string) => void }) {
  const c = g.character!;
  const lv = levelOf(c.totalXp);
  const today = dateKey(now);
  const todays = (type: 'daily' | 'weekly') => sortTasks(g.tasks.filter((t) => t.type === type && activeOn(t, now)), 'priority');
  const once = sortTasks(g.tasks.filter((t) => t.type === 'once' && !isDone(g, t, today)), 'due');
  const beaten = g.battles.filter((b) => b.boss.id === g.boss.id && b.winner === 'boss').length;
  const Quests = ({ title, list }: { title: string; list: typeof once }) => (
    <Panel title={title}>
      {list.length ? list.map((t) => <TaskRow key={t.id} t={t} g={g} now={now} />) : <p className="dim">Nothing here. <button className="link" onClick={() => go('tasks')}>Add quests</button></p>}
    </Panel>
  );
  return (
    <>
      <Panel title="Player" right={<span className="tag">Gen {c.gen}</span>}>
        <div className="hero">
          <div className="lv"><small>LV</small><b>{lv}</b></div>
          <div className="grow">
            <h1>{c.name}</h1>
            <p className="dim">{lv >= MAX_LEVEL ? 'Status: READY. The boss awaits.' : 'Status: Awakened, leveling'}</p>
          </div>
        </div>
        <p className="row"><span>XP</span><span>{lv >= MAX_LEVEL ? 'MAX' : `${xpInLevel(c.totalXp)} / ${XP_PER_LEVEL}`}</span></p>
        <Bar value={lv >= MAX_LEVEL ? 1 : xpInLevel(c.totalXp)} max={lv >= MAX_LEVEL ? 1 : XP_PER_LEVEL} />
        <p className="row"><span>Progress to Level {MAX_LEVEL}</span><span>{c.totalXp.toLocaleString()} / {MAX_XP.toLocaleString()}</span></p>
        <Bar value={c.totalXp} max={MAX_XP} cls="alt" />
        {lv >= MAX_LEVEL && <button className="btn wide" onClick={() => go('battle')}>Enter Battle</button>}
      </Panel>

      <Panel title="Resources">
        <div className="cur">
          <div><small>Gold</small><b className="gold">{g.gold}</b></div>
          <div><small>Gems</small><b className="gem">{g.gems}</b></div>
          <div><small>Skill Pts</small><b>{c.sp}</b></div>
          <div><small>Hands</small><b>{c.hands}</b></div>
        </div>
      </Panel>

      <Panel title="Stats" right={<span className="tag">HP {maxHealth(c)}</span>}>
        <StatGrid c={c} />
        <TalentChips c={c} />
      </Panel>

      <Panel title="Current Boss" right={<span className="tag red">Lv {levelOf(g.boss.totalXp)}</span>} cls="boss">
        <h3>{g.boss.name}</h3>
        <p className="dim">{g.boss.gen === 0 ? 'Original guardian of the System.' : `Champion of Gen ${g.boss.gen}.`} Held the throne against {beaten} challenger{beaten === 1 ? '' : 's'}.</p>
        <p className="row"><span>Health</span><span>{maxHealth(g.boss)}</span></p>
        <div className="stats mini">
          {STATS.map((s) => <div className="stat" key={s}><span className="sl">{STAT_LABEL[s]}</span><span className="sv">{fmt(effective(g.boss, s))}</span><span className="sb">base {g.boss.base[s]}{bonus(g.boss, s) ? ` +${fmt(bonus(g.boss, s))}` : ''}</span></div>)}
        </div>
        <TalentChips c={g.boss} />
      </Panel>

      <Quests title="Daily Quests" list={todays('daily')} />
      <Quests title="Weekly Quests (today)" list={todays('weekly')} />
      <Quests title="One-time Quests" list={once} />
    </>
  );
}
