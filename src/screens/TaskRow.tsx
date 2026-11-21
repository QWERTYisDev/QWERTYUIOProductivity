import type { Game, Task } from '../logic/types.ts';
import { DAYS, activeOn, completeTask, dateKey, isDone, isOverdue, resetOnce } from '../logic/tasks.ts';
import { act } from '../store.ts';

const PRI = ['', 'Low', 'Med', 'High'];
const TYPE = { daily: 'Daily', weekly: 'Weekly', once: 'One-time' };

export function TaskRow({ t, g, now, onEdit, onDelete }: { t: Task; g: Game; now: Date; onEdit?: () => void; onDelete?: () => void }) {
  const done = isDone(g, t, dateKey(now));
  const live = activeOn(t, now);
  const late = isOverdue(t, g, now);
  return (
    <div className={'task' + (done ? ' done' : '') + (!live ? ' off' : '') + (late ? ' late' : '')}>
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
        <p className="rw">+{t.xp} XP · +{t.gems} Gems</p>
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
