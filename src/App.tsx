import { useEffect, useState } from 'react'
import { S, Kind, Task, DAYS, load, save, derive, toggle, isDone, activeToday, migrate } from './store'

const TABS = ['Status', 'Quests', 'Rewards', 'Profile']
const uid = () => crypto.randomUUID()

export default function App() {
  const [s, setS] = useState<S>(load)
  const [tab, setTab] = useState('Status')
  const [toast, setToast] = useState('')
  const [f, setF] = useState({ title: '', kind: 'daily' as Kind, days: [] as number[], xp: 10, ess: 5 })
  const [r, setR] = useState({ name: '', cost: 20 })
  useEffect(() => save(s), [s])
  useEffect(() => { document.documentElement.style.setProperty('--a', s.accent) }, [s.accent])
  const d = derive(s)
  const say = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2500) }

  const act = (fn: (s: S) => S, msg?: string) => {
    const a = derive(s); let n = fn(s); const b = derive(n)
    if (b.won && !n.bossPaid) { n = { ...n, bossPaid: true, bonus: n.bonus + 50 }; say('Boss defeated. +50 Essence') }
    else if (b.level > a.level) say(`Level up. You are level ${b.level}`)
    else if (msg) say(msg)
    setS(n)
  }
  const complete = (t: Task) => act(x => toggle(x, t), isDone(s, t) ? 'Quest undone' : `Quest complete. +${t.xp} XP, +${t.ess} Essence`)
  const addTask = () => {
    if (!f.title.trim()) return say('Name the quest first')
    if (f.kind === 'weekly' && !f.days.length) return say('Pick at least one day')
    act(x => ({ ...x, tasks: [...x.tasks, { id: uid(), title: f.title.trim(), kind: f.kind, days: f.days, xp: f.xp, ess: f.ess }] }), 'Quest added')
    setF({ ...f, title: '' })
  }
  const edit = (t: Task) => {
    const title = prompt('Quest name', t.title); if (title === null) return
    const xp = Number(prompt('XP reward', String(t.xp))); if (!(xp >= 0)) return say('XP must be a number')
    act(x => ({ ...x, tasks: x.tasks.map(k => k.id === t.id ? { ...k, title: title.trim() || t.title, xp } : k) }), 'Quest updated')
  }
  const del = (t: Task) => confirm(`Delete "${t.title}"? Past XP stays.`) && act(x => ({ ...x, tasks: x.tasks.filter(k => k.id !== t.id) }), 'Quest deleted')
  const buy = (w: { id: string; name: string; cost: number }) => act(x =>
    derive(x).ess < w.cost ? x : { ...x, buys: [...x.buys, { name: w.name, cost: w.cost, date: new Date().toLocaleString() }] }, d.ess < w.cost ? 'Not enough Essence' : `Redeemed: ${w.name}`)
  const newBoss = () => {
    const bossName = prompt('Boss name', 'New Boss'); if (!bossName) return
    const bossHp = Number(prompt('Boss HP (XP to defeat)', '500')); if (!(bossHp > 0)) return say('HP must be above 0')
    act(x => ({ ...x, bossName, bossHp, bossBase: derive(x).xp, bossPaid: false }), 'New boss appeared')
  }
  const exportData = () => {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(s)], { type: 'application/json' }))
    a.download = 'system-backup.json'; a.click()
  }
  const importData = (file?: File) => file?.text().then(t => { try { const o = JSON.parse(t); if (!Array.isArray(o.log)) throw 0; setS(migrate(o)); say('Backup restored') } catch { say('Not a valid backup file') } })

  const quests = s.tasks.filter(activeToday)
  const bar = (p: number) => <div className="bar"><i style={{ width: Math.min(100, p) + '%' }} /></div>
  return (
    <div className="app">
      {toast && <div className="toast" role="status">{toast}</div>}
      <main key={tab}>
        {tab === 'Status' && <>
          <section className="panel"><h2>{s.name}</h2>
            <p className="big">Rank {d.rank} &nbsp; Level {d.level}</p>
            {bar(((d.xp - d.lo) / (d.hi - d.lo)) * 100)}
            <p className="dim">{d.xp - d.lo} / {d.hi - d.lo} XP to next level. Total {d.xp} XP.</p>
            <p>Streak {d.cur} days. Best {d.best}. Done today {s.log.filter(l => l.date === new Date().toLocaleDateString('en-CA')).length}. Total {s.log.length}.</p></section>
          <section className="panel boss"><h3>{s.bossName}</h3>
            {bar((d.dmg / s.bossHp) * 100)}
            <p>{d.won ? 'Defeated' : `${s.bossHp - d.dmg} HP left`}. Damage {Math.min(d.dmg, s.bossHp)} of {s.bossHp}. Each quest hits for its XP.</p>
            <button onClick={newBoss}>{d.won ? 'Summon next boss' : 'Replace boss'}</button></section>
          <section className="panel"><h3>Today</h3>
            <p>{quests.filter(t => !isDone(s, t)).length} quests left. {s.tasks.filter(t => t.kind === 'once' && !isDone(s, t)).length} one-time quests open.</p>
            {s.log.slice(-3).reverse().map(l => <p key={l.key} className="dim">Done: {l.title} (+{l.xp} XP)</p>)}
            <button onClick={() => setTab('Quests')}>Add or complete quests</button></section></>}
        {tab === 'Quests' && <>
          <section className="panel"><h3>New quest</h3>
            <input placeholder="Quest name" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} />
            <select value={f.kind} onChange={e => setF({ ...f, kind: e.target.value as Kind })}>
              <option value="daily">Daily</option><option value="weekly">Weekly (pick days)</option><option value="once">One-time</option></select>
            {f.kind === 'weekly' && <div className="days">{DAYS.map((n, i) => <button key={n} className={f.days.includes(i) ? 'on' : ''}
              onClick={() => setF({ ...f, days: f.days.includes(i) ? f.days.filter(x => x !== i) : [...f.days, i] })}>{n}</button>)}</div>}
            <div className="row"><label>XP<input type="number" min="0" value={f.xp} onChange={e => setF({ ...f, xp: +e.target.value })} /></label>
              <label>Essence<input type="number" min="0" value={f.ess} onChange={e => setF({ ...f, ess: +e.target.value })} /></label></div>
            <button onClick={addTask}>Add quest</button></section>
          <section className="panel"><h3>Active today</h3>
            {!quests.length && <p className="dim">No quests yet. Add one above.</p>}
            {quests.map(t => <div key={t.id} className={'item ' + (isDone(s, t) ? 'done' : '')}>
              <button className="chk" aria-label="Toggle complete" onClick={() => complete(t)}>{isDone(s, t) ? '✓' : ''}</button>
              <span>{t.title}<small>{t.kind} · {t.xp} XP · {t.ess} Essence</small></span>
              <button onClick={() => edit(t)}>Edit</button><button onClick={() => del(t)}>Delete</button></div>)}</section>
          {s.tasks.some(t => !activeToday(t)) && <section className="panel"><h3>Other days</h3>
            {s.tasks.filter(t => !activeToday(t)).map(t => <div key={t.id} className="item"><span>{t.title}<small>{t.days.map(i => DAYS[i]).join(' ')}</small></span>
              <button onClick={() => edit(t)}>Edit</button><button onClick={() => del(t)}>Delete</button></div>)}</section>}</>}
        {tab === 'Rewards' && <>
          <section className="panel"><h2>{d.ess} Essence</h2>
            <input placeholder="Reward name" value={r.name} onChange={e => setR({ ...r, name: e.target.value })} />
            <label>Cost<input type="number" min="1" value={r.cost} onChange={e => setR({ ...r, cost: +e.target.value })} /></label>
            <button onClick={() => { if (!r.name.trim() || !(r.cost > 0)) return say('Add a name and a cost'); act(x => ({ ...x, rewards: [...x.rewards, { id: uid(), name: r.name.trim(), cost: r.cost }] }), 'Reward added'); setR({ ...r, name: '' }) }}>Add reward</button></section>
          <section className="panel"><h3>Shop</h3>
            {!s.rewards.length && <p className="dim">No rewards yet. Add one above.</p>}
            {s.rewards.map(w => <div key={w.id} className={'item ' + (d.ess < w.cost ? 'locked' : '')}><span>{w.name}<small>{w.cost} Essence{d.ess < w.cost ? ` · need ${w.cost - d.ess} more` : ''}</small></span>
              <button disabled={d.ess < w.cost} onClick={() => buy(w)}>Redeem</button>
              <button onClick={() => confirm(`Delete "${w.name}"?`) && act(x => ({ ...x, rewards: x.rewards.filter(k => k.id !== w.id) }), 'Reward deleted')}>Delete</button></div>)}</section>
          <section className="panel"><h3>Redeemed</h3>{!s.buys.length && <p className="dim">Nothing redeemed yet.</p>}
            {[...s.buys].reverse().map((b, i) => <p key={i} className="dim">{b.name} · {b.cost} Essence · {b.date}</p>)}</section></>}
        {tab === 'Profile' && <>
          <section className="panel"><h3>Hunter</h3>
            <input value={s.name} onChange={e => setS({ ...s, name: e.target.value })} aria-label="Hunter name" />
            <label>Accent color<input type="color" value={s.accent} onChange={e => setS({ ...s, accent: e.target.value })} /></label>
            <p className="dim">XP comes from quests. Level n needs 50×n×(n−1) total XP. Rank is E, D, C, B, A, S at levels 1, 5, 10, 20, 30, 40.</p></section>
          <section className="panel"><h3>Backup</h3><button onClick={exportData}>Export JSON</button>
            <label className="btn">Import JSON<input type="file" accept="application/json,.json" hidden onChange={e => importData(e.target.files?.[0])} /></label>
            <button onClick={() => confirm('Erase all progress? This cannot be undone.') && (setS(migrate(null)), say('Progress reset'))}>Reset everything</button></section>
          <section className="panel"><h3>History</h3>{!s.log.length && <p className="dim">Complete a quest to start your history.</p>}
            {[...s.log].reverse().slice(0, 30).map(l => <p key={l.key} className="dim">{l.date} · {l.title} · +{l.xp} XP · +{l.ess} Essence</p>)}</section></>}
      </main>
      <nav>{TABS.map(t => <button key={t} className={t === tab ? 'on' : ''} onClick={() => setTab(t)}>{t}</button>)}</nav>
    </div>
  )
}
