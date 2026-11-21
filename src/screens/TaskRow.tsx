import { useEffect, useRef, useState } from 'react';
import type { Game, Task } from '../logic/types.ts';
import { DAYS, activeOn, completeTask, dateKey, isDone, isOverdue, resetOnce } from '../logic/tasks.ts';
import { act } from '../store.ts';

/** Ids of quests completed in the last second, so a finished row can play its sweep before it leaves the list. */
export function useRecentlyDone(g: Game): string[] {
  const seen = useRef(new Set(Object.keys(g.completions)));
  const [stay, setStay] = useState<string[]>([]);
  useEffect(() => {
    const keys = Object.keys(g.completions);
    const fresh = keys.filter((k) => !seen.current.has(k));
    seen.current = new Set(keys);
    if (!fresh.length) return;
    const ids = fresh.map((k) => k.split('|')[0]);
    setStay((s) => [...s, ...ids]);
    setTimeout(() => setStay((s) => s.filter((x) => !ids.includes(x))), 1100);
  }, [g.completions]);
  return stay;
}

const PRI = ['', 'Low', 'Med', 'High'];
const TYPE = { daily: 'Daily', weekly: 'Weekly', once: 'One-time' };

export function TaskRow({ t, g, now, onEdit, onDelete }: { t: Task; g: Game; now: Date; onEdit?: () => void; onDelete?: () => void }) {
  const done = isDone(g, t, dateKey(now));
  const live = activeOn(t, now);
  const late = isOverdue(t, g, now);
  const was = useRef(done);
  const [sweep, setSweep] = useState(false);
  useEffect(() => {
    if (done && !was.current) { setSweep(true); const id = setTimeout(() => setSweep(false), 1000); was.current = done; return () => clearTimeout(id); }
    was.current = done;
  }, [done]);
  return (
    <div className={'task' + (sweep ? ' sweep' : '') + (done ? ' done' : '') + (!live ? ' off' : '') + (late ? ' late' : '')}>
      <span className="ticon">{t.icon}</span>
      <div className="tbody">
        <b>{t.name}</b>
        {t.desc && <p className="dim">{t.desc}</p>}
        <p className="meta">
          {TYPE[t.type]} · {PRI[t.priority]}
          {t.type === 'weekly' && ` · ${t.days.map((d) => DAYS[d]).join(' ')}`}
          {t.dueDate && ` · ${t.type === 'weekly' ? 'until' : 'due'} ${t.dueDate}`}
          {t.dueTime && ` · by ${t.dueTime}`}
          {late && ' · OVERDUE'}
        </p>
        <p className="rw">+{t.xp} XP · +{t.gems} Gems{t.gold > 0 && ` · +${t.gold} Gold`}</p>
      </div>
      <div className="tact">
        {done ? (
          t.type === 'once'
            ? <button className="btn ghost sm" onClick={() => window.confirm('Reset this quest so it can be earned again?') && act((x) => resetOnce(x, t.id))}>Reset</button>
            : <span className="ok">✓ Done</span>
        ) : live ? (
          <button className="btn sm" disabled={!g.character} onClick={() => act((x) => completeTask(x, t.id, new Date()))}>Complete</button>
        ) : <span className="dim">Not today</span>}
        {onEdit && <button className="btn ghost sm" onClick={onEdit}>Edit</button>}
        {onDelete && <button className="btn ghost sm danger" onClick={onDelete}>Delete</button>}
      </div>
    </div>
  );
}
