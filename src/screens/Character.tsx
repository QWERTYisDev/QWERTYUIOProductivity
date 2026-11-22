import { useRef, useState } from 'react';
import type { Character as Char, Game } from '../logic/types.ts';
import { MAX_LEVEL, XP_PER_LEVEL, levelOf, xpInLevel } from '../logic/leveling.ts';
import { maxHealth } from '../logic/character.ts';
import { spendStat } from '../logic/game.ts';
import { act, backupText, eraseAll, importBackup, markBackup, nav, toast } from '../store.ts';
import { ACHIEVEMENTS, ACH_BY_ID, equipTitle } from '../logic/achievements.ts';
import { statsOf } from '../logic/stats.ts';
import { Panel, RoundDetail, StatGrid, TalentChips } from '../ui.tsx';

function Sheet({ g }: { g: Game }) {
  const c = g.character!;
  const lv = levelOf(c.totalXp);
  return (
    <>
      <Panel title={c.name} right={<span className="tag">Gen {c.gen}</span>}>
        {g.title && <p className="ttl">« {ACH_BY_ID[g.title]?.title} »</p>}
        <p className="row"><span>Level</span><b>{lv}{lv >= MAX_LEVEL ? ' (max)' : ''}</b></p>
        <p className="row"><span>XP</span><b>{lv >= MAX_LEVEL ? 'MAX' : `${xpInLevel(c.totalXp)} / ${XP_PER_LEVEL}`}</b></p>
        <p className="row"><span>Health</span><b>{maxHealth(c)} <small className="dim">(10 base + {maxHealth(c) - 10} talents)</small></b></p>
        <p className="row"><span>Skill Points</span><b>{c.sp}</b></p>
      </Panel>
      <Panel title="Stats" right={<span className="tag">{c.sp} SP</span>}>
        <p className="dim">Tap +1 to permanently spend a Skill Point on a base stat. Talent bonuses are separate.</p>
        <StatGrid c={c} onSpend={(s) => act((x) => spendStat(x, s))} />
      </Panel>
      <Panel title="Talents"><TalentChips c={c} /></Panel>
      <Panel title="History"><div className="scrollbox">{[...c.log].reverse().map((l, i) => <p className="dim" key={i}>{l}</p>)}</div></Panel>
    </>
  );
}

function CharEntry({ c, tag }: { c: Char; tag: string }) {
  return (
    <details className="entry">
      <summary><b>{c.name}</b> <span className="tag">{tag}</span> <span className="dim">Gen {c.gen} · Lv {levelOf(c.totalXp)}</span></summary>
      <StatGrid c={c} />
      <p className="row"><span>Health</span><b>{maxHealth(c)}</b></p>
      <TalentChips c={c} />
    </details>
  );
}
function Archive({ g }: { g: Game }) {
  return (
    <Panel title="Character Archive">
      <div className="scrollbox cards">
      <CharEntry c={g.boss} tag="Current boss" />
      {[...g.archive].reverse().map((c) => <CharEntry key={c.id + c.fate} c={c} tag={c.fate === 'fallen' ? 'Eliminated' : 'Defeated boss'} />)}
      {g.archive.length === 0 && <p className="dim">No fallen characters yet.</p>}
      </div>
    </Panel>
  );
}
function History({ g }: { g: Game }) {
  if (!g.battles.length) return <Panel title="Battle History"><p className="dim">No battles fought yet.</p></Panel>;
  return (
    <Panel title="Battle History">
      <div className="scrollbox cards">
      {[...g.battles].reverse().map((b) => (
        <details className="entry" key={b.id}>
          <summary>
            <b>{b.winnerName}</b> defeated <b>{b.loserName}</b>
            <span className="dim"> · Gen {b.gen} · {b.rounds.length} rounds · {new Date(b.at).toLocaleDateString()}</span>
          </summary>
          <p className="dim">{b.player.name}: {b.pHp}/{b.pMax} HP · {b.boss.name}: {b.bHp}/{b.bMax} HP · {b.winner === 'player' ? 'Player victory' : 'Boss victory'}</p>
          {b.rounds.map((r) => <div key={r.n}><p className="rn">Round {r.n}</p><RoundDetail r={r} pName={b.player.name} bName={b.boss.name} /></div>)}
        </details>
      ))}
      </div>
    </Panel>
  );
}

function Titles({ g }: { g: Game }) {
  const [q, setQ] = useState('');
  const needle = q.trim().toLowerCase();
  const list = ACHIEVEMENTS.filter((a) => !needle || `${a.name} ${a.title} ${a.desc}`.toLowerCase().includes(needle));
  const got = ACHIEVEMENTS.filter((a) => g.achievements[a.id]).length;
  return (
    <Panel title="Achievements" right={<span className="tag">{got}/{ACHIEVEMENTS.length}</span>}>
      <p className="dim">Cosmetic only. Equip a title to show it under your name.</p>
      <input type="search" className="search" placeholder="Search titles and achievements…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search titles" />
      <div className="scrollbox">
        {list.length === 0 && <p className="dim">No titles match.</p>}
        {list.map((a) => {
          const at = g.achievements[a.id];
          return (
            <div className={'task' + (at ? '' : ' off')} key={a.id}>
              <span className="ticon">{at ? '🏆' : '🔒'}</span>
              <div className="tbody"><b>{a.name}</b><p className="dim">{a.desc}</p><p className="rw">Title: {a.title}{at ? ` · ${new Date(at).toLocaleDateString()}` : ''}</p></div>
              <div className="tact">
                {at && (g.title === a.id
                  ? <button className="btn ghost sm" onClick={() => act((x) => equipTitle(x, ''))}>Unequip</button>
                  : <button className="btn sm" onClick={() => act((x) => equipTitle(x, a.id))}>Equip</button>)}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function Bars({ data }: { data: { label: string; v: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.v));
  return (
    <div className="chart">
      {data.map((d, i) => (
        <div className="col" key={i} title={`${d.label}: ${d.v}`}>
          <span className="cv">{d.v || ''}</span>
          <i style={{ height: `${(d.v / max) * 100}%` }} />
          <small>{d.label}</small>
        </div>
      ))}
    </div>
  );
}
const Flow = ({ label, earned, spent }: { label: string; earned: number; spent: number }) => (
  <div>
    <p className="row"><span>{label}</span><span>earned {earned} · spent {spent}</span></p>
    <div className="bar"><i style={{ width: `${earned ? (Math.min(spent, earned) / earned) * 100 : 0}%` }} /></div>
  </div>
);
function StatsTab({ g }: { g: Game }) {
  const s = statsOf(g, new Date());
  const peak = Math.max(1, ...s.heat.map((h) => h.n));
  return (
    <>
      <Panel title="Totals">
        <div className="cur"><div><small>Quests</small><b>{s.quests}</b></div><div><small>Quest XP</small><b>{s.xp}</b></div><div><small>Battles</small><b>{g.battles.length}</b></div><div><small>Gen</small><b>{g.gen}</b></div></div>
      </Panel>
      <Panel title="XP, last 14 days"><Bars data={s.days.map((d) => ({ label: d.label, v: d.xp }))} /></Panel>
      <Panel title="Quests per week"><Bars data={s.weeks.map((w) => ({ label: w.label, v: w.n }))} /></Panel>
      <Panel title="Gold and Gems">
        <Flow label="Gold" earned={s.goldIn} spent={s.goldOut} />
        <Flow label="Gems" earned={s.gemsIn} spent={s.gemsOut} />
        <p className="dim">The bar shows how much of what you earned has been spent.</p>
      </Panel>
      <Panel title="Activity, last 12 weeks">
        <div className="heat">
          {s.heat.map((h) => <i key={h.date} title={`${h.date}: ${h.n} quest${h.n === 1 ? '' : 's'}`} className={h.future ? 'fut' : ''} style={{ opacity: h.future ? 0.15 : h.n ? 0.3 + 0.7 * (h.n / peak) : 1 }} data-on={h.n > 0 ? '1' : '0'} />)}
        </div>
      </Panel>
    </>
  );
}

function System({ g }: { g: Game }) {
  const [text, setText] = useState('');
  const file = useRef<HTMLInputElement>(null);
  const stamp = () => `system-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const download = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([backupText()], { type: 'application/json' }));
    a.download = stamp();
    a.click();
    markBackup();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };
  const share = async () => {
    const f = new File([backupText()], stamp(), { type: 'application/json' });
    try {
      if (navigator.canShare?.({ files: [f] })) { await navigator.share({ files: [f] }); markBackup(); }
      else toast('Sharing files is not supported here. Use Copy.', 'info');
    } catch { /* user cancelled */ }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(backupText()); markBackup(); toast('Backup copied to clipboard.', 'good'); } catch { toast('Copy failed. Use Download.', 'bad'); }
  };
  const doImport = (t: string) => {
    if (!window.confirm('Replace ALL current progress with this backup?')) return;
    try { importBackup(t); setText(''); } catch (e) { toast('Import failed: ' + (e as Error).message, 'bad'); }
  };
  return (
    <>
      <Panel title="Backup">
        <p className="dim">Last backup: {g.lastBackup ? new Date(g.lastBackup).toLocaleDateString() : 'never'}. Progress is stored only in this browser on this device. It does not sync to other devices. Back up before changing the site URL or clearing Safari data.</p>
        <div className="three">
          <button className="btn" onClick={download}>Download</button>
          <button className="btn" onClick={share}>Share</button>
          <button className="btn" onClick={copy}>Copy</button>
        </div>
      </Panel>
      <Panel title="Restore">
        <input ref={file} type="file" accept=".json,application/json" onChange={async (e) => { const f = e.target.files?.[0]; if (f) doImport(await f.text()); e.target.value = ''; }} />
        <label>Or paste backup text<textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} /></label>
        <button className="btn wide" disabled={!text.trim()} onClick={() => doImport(text)}>Import pasted backup</button>
      </Panel>
      <Panel title="Reset">
        <p className="dim">Erases everything (character, boss, archive, quests, shop, Gold, Gems, history) and starts from the very beginning. Download a backup first if you might want it back.</p>
        <button className="btn ghost wide danger" onClick={() => window.confirm('Reset ALL data and start from the very beginning? This cannot be undone.') && eraseAll()}>Reset all data</button>
      </Panel>
      <Panel title="Preferences">
        <label className="check"><input type="checkbox" checked={g.prefs.sound} onChange={(e) => act((x) => ({ ...x, prefs: { ...x.prefs, sound: e.target.checked } }))} /> Sound and haptics</label>
        <label className="check"><input type="checkbox" checked={g.prefs.anim} onChange={(e) => act((x) => ({ ...x, prefs: { ...x.prefs, anim: e.target.checked } }))} /> Animations</label>
      </Panel>
    </>
  );
}

export default function CharacterScreen({ g }: { g: Game }) {
  const [tab, setTab] = useState<'sheet' | 'archive' | 'history' | 'titles' | 'stats' | 'system'>(() => { const t = nav.charTab; nav.charTab = 'sheet'; return t; });
  return (
    <>
      <div className="tabs">
        {(['sheet', 'archive', 'history', 'titles', 'stats', 'system'] as const).map((k) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{k[0].toUpperCase() + k.slice(1)}</button>)}
      </div>
      {tab === 'sheet' && <Sheet g={g} />}
      {tab === 'archive' && <Archive g={g} />}
      {tab === 'history' && <History g={g} />}
      {tab === 'titles' && <Titles g={g} />}
      {tab === 'stats' && <StatsTab g={g} />}
      {tab === 'system' && <System g={g} />}
    </>
  );
}
