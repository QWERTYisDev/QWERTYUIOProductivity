export type Kind = 'daily' | 'weekly' | 'once'
export type Task = { id: string; title: string; kind: Kind; days: number[]; xp: number; ess: number }
export type Reward = { id: string; name: string; cost: number }
export type Log = { key: string; id: string; title: string; date: string; xp: number; ess: number }
export type Buy = { name: string; cost: number; date: string }
export type S = {
  v: 1; name: string; accent: string; tasks: Task[]; rewards: Reward[]; log: Log[]; buys: Buy[]
  bonus: number; bossName: string; bossHp: number; bossBase: number; bossPaid: boolean
}

const KEY = 'system-v1'
export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const today = () => new Date().toLocaleDateString('en-CA') // local YYYY-MM-DD
const add = (d: string, n: number) => { const x = new Date(d + 'T00:00'); x.setDate(x.getDate() + n); return x.toLocaleDateString('en-CA') }

export const def = (): S => ({ v: 1, name: 'Hunter', accent: '#22d3ee', tasks: [], rewards: [], log: [], buys: [],
  bonus: 0, bossName: 'Gate Guardian', bossHp: 300, bossBase: 0, bossPaid: false })

// Merge over defaults so fields added in later versions never break old saves.
export function migrate(o: any): S {
  const s = { ...def(), ...(o && typeof o === 'object' ? o : {}) }
  for (const k of ['tasks', 'rewards', 'log', 'buys'] as const) if (!Array.isArray(s[k])) s[k] = []
  return s
}
export function load(): S { try { return migrate(JSON.parse(localStorage.getItem(KEY) || '')) } catch { return def() } }
export const save = (s: S) => { try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* storage full or blocked */ } }

// XP and Essence are always derived from the log, so one completion = one award, whatever the taps.
export function toggle(s: S, t: Task): S {
  const key = `${t.id}:${t.kind === 'once' ? 'once' : today()}`
  return s.log.some(l => l.key === key)
    ? { ...s, log: s.log.filter(l => l.key !== key) }
    : { ...s, log: [...s.log, { key, id: t.id, title: t.title, date: today(), xp: t.xp, ess: t.ess }] }
}
export const isDone = (s: S, t: Task) => s.log.some(l => l.key === `${t.id}:${t.kind === 'once' ? 'once' : today()}`)
export const activeToday = (t: Task) => t.kind !== 'weekly' || t.days.includes(new Date().getDay())

export function derive(s: S) {
  const xp = s.log.reduce((a, l) => a + l.xp, 0)
  const level = Math.floor((1 + Math.sqrt(1 + xp / 12.5)) / 2) // xp to reach level L = 50*L*(L-1)
  const ess = s.log.reduce((a, l) => a + l.ess, 0) + s.bonus - s.buys.reduce((a, b) => a + b.cost, 0)
  const rank = level < 5 ? 'E' : level < 10 ? 'D' : level < 20 ? 'C' : level < 30 ? 'B' : level < 40 ? 'A' : 'S'
  const set = new Set(s.log.map(l => l.date))
  let cur = 0
  for (let d = set.has(today()) ? today() : add(today(), -1); set.has(d); d = add(d, -1)) cur++
  let best = 0
  set.forEach(d => { if (set.has(add(d, -1))) return; let n = 0; for (let e = d; set.has(e); e = add(e, 1)) n++; best = Math.max(best, n) })
  const dmg = Math.max(0, xp - s.bossBase)
  return { xp, level, lo: 50 * level * (level - 1), hi: 50 * level * (level + 1), ess, rank, cur, best, dmg, won: dmg >= s.bossHp }
}
