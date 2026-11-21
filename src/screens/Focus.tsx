import { useEffect, useState } from 'react';
import { completeTask } from '../logic/tasks.ts';
import { act, closeFocusPick, endFocus, startFocus, toast, useSnap } from '../store.ts';
import { Modal } from '../ui.tsx';

const LENGTHS = [15, 25, 45, 60];

/** Choose a duration for a quest's focus session. */
export function FocusPicker() {
  const { focus, game: g } = useSnap();
  const [closing, setClosing] = useState(false);
  const [mins, setMins] = useState(25);
  const t = g.tasks.find((x) => x.id === focus.pick);
  if (!focus.pick || !t) return null;
  const close = () => { if (closing) return; setClosing(true); setTimeout(() => { closeFocusPick(); setClosing(false); }, 450); };
  return (
    <Modal title="Focus Timer" onClose={close} closing={closing}>
      <p><b>{t.icon} {t.name}</b></p>
      <p className="dim">Work without leaving the app. When the timer ends, the quest completes and pays out. The timer only runs while this app is open, and the quest is not completed if you cancel.</p>
      <div className="chips">{LENGTHS.map((m) => <button key={m} className={'chip' + (mins === m ? ' on' : '')} onClick={() => setMins(m)}>{m} min</button>)}</div>
      {focus.run && <p className="err">A focus session is already running. Cancel it first.</p>}
      <button className="btn wide" disabled={!!focus.run} onClick={() => { startFocus(t.id, mins); toast(`Focus started: ${mins} minutes.`, 'info'); }}>Start {mins}-minute focus</button>
    </Modal>
  );
}

/** Running timer pinned to the top of the screen. */
export function FocusBar() {
  const { focus, game: g } = useSnap();
  const [, tick] = useState(0);
  const run = focus.run;
  useEffect(() => {
    if (!run) return;
    const id = setInterval(() => tick((n) => n + 1), 1000);
    const vis = () => tick((n) => n + 1); // timers pause in the background; the clock does not
    document.addEventListener('visibilitychange', vis);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', vis); };
  }, [run?.endsAt]);
  const t = run ? g.tasks.find((x) => x.id === run.taskId) : undefined;
  const left = run ? run.endsAt - Date.now() : 1;
  const expired = !!run && (left <= 0 || !t);
  useEffect(() => {
    if (!expired || !run) return;
    endFocus();
    if (t) act((x) => completeTask(x, t.id, new Date()));
  }, [expired]);
  if (!run || !t || expired) return null;
  const s = Math.ceil(left / 1000);
  const total = run.mins * 60000;
  return (
    <div className="focusbar">
      <div className="grow"><small>[ FOCUS ]</small><b>{t.icon} {t.name}</b></div>
      <span className="clock">{String(Math.floor(s / 60)).padStart(2, '0')}:{String(s % 60).padStart(2, '0')}</span>
      <button className="btn ghost sm danger" onClick={() => window.confirm('Cancel the focus session? The quest will not be completed.') && endFocus()}>Cancel</button>
      <i className="fill" style={{ width: `${100 - (left / total) * 100}%` }} />
    </div>
  );
}
