import { useEffect, useRef, useState } from 'react';
import type { Game, Task } from '../logic/types.ts';
import { DAYS, activeOn, completeTask, dateKey, isDone, isOverdue, occurrence, resetOnce, streakOf, subKey, toggleSub } from '../logic/tasks.ts';
import { act, openFocusPick } from '../store.ts';

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
  const today = dateKey(now);
  const done = isDone(g, t, today);
  const live = activeOn(t, now);
  const late = isOverdue(t, g, now);
  const streak = streakOf(g, t, now);
  const occ = occurrence(t, today);
  const ticked = t.subs.filter((s) => g.subDone[subKey(t, occ, s.id)]).length;
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
        <b>{t.name}</b>{streak > 0 && <span className="streak" title="Consecutive days completed"> 🔥 {streak}</span>}
        {t.desc && <p className="dim">{t.desc}</p>}
        <p className="meta">
          {TYPE[t.type]} · {PRI[t.priority]}
          {t.type === 'weekly' && ` · ${t.days.map((d) => DAYS[d]).join(' ')}`}
          {t.dueDate && ` · ${t.type === 'weekly' ? 'until' : 'due'} ${t.dueDate}`}
          {t.dueTime && ` · by ${t.dueTime}`}
          {late && ' · OVERDUE'}
        </p>
        {t.subs.length > 0 && (
          <ul className="subs">
            {t.subs.map((s) => {
              const on = !!g.subDone[subKey(t, occ, s.id)] || done;
              return (
                <li key={s.id}>
                  <button className={'sub' + (on ? ' on' : '')} disabled={done || !live || !g.character} onClick={() => act((x) => toggleSub(x, t.id, s.id, new Date()))}>
                    <i>{on ? '✓' : ''}</i>{s.text}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <p className="rw">+{t.xp} XP · +{t.gems} Gems{t.gold > 0 && ` · +${t.gold} Gold`}{t.subs.length > 0 && ` · ${done ? t.subs.length : ticked}/${t.subs.length} done`}</p>
      </div>
      <div className="tact">
        {done ? (
          t.type === 'once'
            ? <button className="btn ghost sm" onClick={() => window.confirm('Reset this quest so it can be earned again?') && act((x) => resetOnce(x, t.id))}>Reset</button>
            : <span className="ok">✓ Done</span>
        ) : live ? (
          <>
            {t.subs.length === 0 && <button className="btn sm" disabled={!g.character} onClick={() => act((x) => completeTask(x, t.id, new Date()))}>Complete</button>}
            {t.subs.length === 0 && g.character && <button className="btn ghost sm" onClick={() => openFocusPick(t.id)} aria-label={`Start a focus timer for ${t.name}`}>⏱ Focus</button>}
          </>
        ) : <span className="dim">Not today</span>}
        {onEdit && <button className="btn ghost sm" onClick={onEdit}>Edit</button>}
        {onDelete && <button className="btn ghost sm danger" onClick={onDelete}>Delete</button>}
      </div>
    </div>
  );
}
