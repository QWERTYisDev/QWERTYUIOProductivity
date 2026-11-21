import { useState } from 'react';
import type { Game, Sub, Task, TaskType } from '../logic/types.ts';
import { uid } from '../logic/rand.ts';
import { DAYS, TEMPLATES, activeOn, blankTask, dateKey, deleteTask, isDone, saveTask, sortTasks, validateTask, type SortKey } from '../logic/tasks.ts';
import { act, toast } from '../store.ts';
import { Modal, Panel, useSheet } from '../ui.tsx';
import { TaskRow, useRecentlyDone } from './TaskRow.tsx';

const ICONS = ['⚔️', '📚', '💪', '🏃', '🧘', '💧', '🧹', '💻', '📝', '🎯', '🍎', '🛌', '💰', '🎨', '📞', '🌱'];

function TaskForm({ initial, onClose, closing }: { initial: Task; onClose: () => void; closing: boolean }) {
  const [t, setT] = useState<Task>(initial);
  const [xp, setXp] = useState(String(initial.xp));
  const [gems, setGems] = useState(String(initial.gems));
  const [gold, setGold] = useState(String(initial.gold));
  const [err, setErr] = useState('');
  const [subs, setSubs] = useState<Sub[]>(initial.subs);
  const up = (p: Partial<Task>) => setT({ ...t, ...p });
  const submit = () => {
    const out: Task = { ...t, name: t.name.trim(), xp: xp.trim() === '' ? NaN : Number(xp), gems: gems.trim() === '' ? NaN : Number(gems), gold: gold.trim() === '' ? NaN : Number(gold), subs: subs.map((s) => ({ ...s, text: s.text.trim() })).filter((s) => s.text), days: t.type === 'weekly' ? t.days : [], dueDate: t.type === 'daily' ? '' : t.dueDate };
    const e = validateTask(out);
    if (e) return setErr(e);
    act((g) => saveTask(g, out));
    toast('Quest saved.', 'good');
    onClose();
  };
  return (
    <Modal title={initial.name ? 'Edit Quest' : 'New Quest'} onClose={onClose} closing={closing}>
      {!initial.name && (
        <div>
          <p className="dim">Quick start: tap a preset to fill the form, then adjust and save.</p>
          <div className="chips">
            {TEMPLATES.map((p) => (
              <button key={p.name} type="button" className="chip" onClick={() => { setT({ ...t, name: p.name, type: p.type, icon: p.icon, days: p.days ?? t.days }); setXp(String(p.xp)); setGems(String(p.gems)); setGold('0'); }}>{p.icon} {p.name}</button>
            ))}
          </div>
        </div>
      )}
      <label>Name<input value={t.name} maxLength={60} onChange={(e) => up({ name: e.target.value })} /></label>
      <label>Description (optional)<textarea rows={2} value={t.desc} onChange={(e) => up({ desc: e.target.value })} /></label>
      <label>Type
        <select value={t.type} onChange={(e) => up({ type: e.target.value as TaskType })}>
          <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="once">One-time</option>
        </select>
      </label>
      {t.type === 'weekly' && (
        <div className="days">
          {DAYS.map((d, i) => (
            <button key={d} type="button" className={'chip' + (t.days.includes(i) ? ' on' : '')} onClick={() => up({ days: t.days.includes(i) ? t.days.filter((x) => x !== i) : [...t.days, i] })}>{d}</button>
          ))}
        </div>
      )}
      <div className="three">
        <label>XP<input inputMode="numeric" value={xp} onChange={(e) => setXp(e.target.value)} /></label>
        <label>Gems<input inputMode="numeric" value={gems} onChange={(e) => setGems(e.target.value)} /></label>
        <label>Gold<input inputMode="numeric" value={gold} onChange={(e) => setGold(e.target.value)} /></label>
      </div>
      <label>Priority
        <select value={t.priority} onChange={(e) => up({ priority: Number(e.target.value) as 1 | 2 | 3 })}>
          <option value={1}>Low</option><option value={2}>Medium</option><option value={3}>High</option>
        </select>
      </label>
      <div className="two">
        {t.type !== 'daily' && <label>{t.type === 'weekly' ? 'Last day (optional)' : 'Due date (optional)'}<input type="date" value={t.dueDate} onChange={(e) => up({ dueDate: e.target.value })} /></label>}
        <label>Due time (optional)<input type="time" value={t.dueTime} onChange={(e) => up({ dueTime: e.target.value })} /></label>
      </div>
      <div>
        <p className="dim">Checklist (optional): the quest pays out when every item is checked.</p>
        {subs.map((s, i) => (
          <div className="subrow" key={s.id}>
            <input value={s.text} maxLength={60} placeholder={`Item ${i + 1}`} onChange={(e) => setSubs(subs.map((x) => (x.id === s.id ? { ...x, text: e.target.value } : x)))} />
            <button type="button" className="x" aria-label="Remove item" onClick={() => setSubs(subs.filter((x) => x.id !== s.id))}>✕</button>
          </div>
        ))}
        {subs.length < 10 && <button type="button" className="btn ghost sm" onClick={() => setSubs([...subs, { id: uid(), text: '' }])}>+ Add checklist item</button>}
      </div>
      <div className="icons">{ICONS.map((i) => <button key={i} type="button" className={'ic' + (t.icon === i ? ' on' : '')} onClick={() => up({ icon: i })}>{i}</button>)}</div>
      {err && <p className="err">{err}</p>}
      <button className="btn wide" onClick={submit}>Save Quest</button>
    </Modal>
  );
}

export default function Tasks({ g, now }: { g: Game; now: Date }) {
  const [type, setType] = useState<'all' | TaskType>('all');
  const [status, setStatus] = useState<'all' | 'open' | 'done'>('all');
  const [sort, setSort] = useState<SortKey>('priority');
  const sheet = useSheet<Task>();
  const today = dateKey(now);
  const stay = useRecentlyDone(g);
  // Finished one-time quests disappear (view them with Status: Done). Open quests come first, then not-today, then done.
  const rank = (t: Task) => (isDone(g, t, today) ? 2 : activeOn(t, now) ? 0 : 1);
  const list = sortTasks(
    g.tasks.filter((t) => {
      const done = isDone(g, t, today);
      if (type !== 'all' && t.type !== type) return false;
      if (status !== 'all') return (status === 'done') === done;
      return !(t.type === 'once' && done && !stay.includes(t.id));
    }),
    sort
  ).sort((a, b) => rank(a) - rank(b));
  return (
    <>
      <Panel title="Quests" right={<button className="btn sm" onClick={() => sheet.open(blankTask(type === 'all' ? 'daily' : type))}>+ New</button>}>
        <div className="chips">
          {(['all', 'daily', 'weekly', 'once'] as const).map((k) => <button key={k} className={'chip' + (type === k ? ' on' : '')} onClick={() => setType(k)}>{k === 'all' ? 'All' : k === 'once' ? 'One-time' : k[0].toUpperCase() + k.slice(1)}</button>)}
        </div>
        <div className="two">
          <label>Status<select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}><option value="all">All</option><option value="open">Open</option><option value="done">Done</option></select></label>
          <label>Sort<select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}><option value="priority">Priority</option><option value="due">Due</option><option value="xp">XP</option><option value="gems">Gems</option><option value="name">Name</option></select></label>
        </div>
      </Panel>
      <Panel>
        <div className="scrollbox">
        {list.length === 0 && <p className="dim">No quests match. Tap “+ New” to create one.</p>}
        {list.map((t) => (
          <TaskRow key={t.id} t={t} g={g} now={now} onEdit={() => sheet.open(t)} onDelete={() => window.confirm(`Delete “${t.name}”?`) && act((x) => deleteTask(x, t.id))} />
        ))}
        </div>
      </Panel>
      {sheet.v && <TaskForm key={sheet.v.id} initial={sheet.v} closing={sheet.closing} onClose={sheet.close} />}
    </>
  );
}
