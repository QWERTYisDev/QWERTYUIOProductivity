import { useRef, useState } from 'react';
import type { Character as Char, Game } from '../logic/types.ts';
import { MAX_LEVEL, XP_PER_LEVEL, levelOf, xpInLevel } from '../logic/leveling.ts';
import { maxHealth } from '../logic/character.ts';
import { spendStat } from '../logic/game.ts';
import { act, backupText, importBackup, toast } from '../store.ts';
import { Panel, RoundDetail, StatGrid, TalentChips } from '../ui.tsx';

function Sheet({ g }: { g: Game }) {
  const c = g.character!;
  const lv = levelOf(c.totalXp);
  return (
    <>
      <Panel title={c.name} right={<span className="tag">Gen {c.gen}</span>}>
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
      <Panel title="History">{[...c.log].reverse().map((l, i) => <p className="dim" key={i}>{l}</p>)}</Panel>
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
      <CharEntry c={g.boss} tag="Current boss" />
      {[...g.archive].reverse().map((c) => <CharEntry key={c.id + c.fate} c={c} tag={c.fate === 'fallen' ? 'Eliminated' : 'Defeated boss'} />)}
      {g.archive.length === 0 && <p className="dim">No fallen characters yet.</p>}
    </Panel>
  );
}
function History({ g }: { g: Game }) {
  if (!g.battles.length) return <Panel title="Battle History"><p className="dim">No battles fought yet.</p></Panel>;
  return (
    <Panel title="Battle History">
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
    </Panel>
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
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };
  const share = async () => {
    const f = new File([backupText()], stamp(), { type: 'application/json' });
    try {
      if (navigator.canShare?.({ files: [f] })) await navigator.share({ files: [f] });
      else toast('Sharing files is not supported here. Use Copy.', 'info');
    } catch { /* user cancelled */ }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(backupText()); toast('Backup copied to clipboard.', 'good'); } catch { toast('Copy failed. Use Download.', 'bad'); }
  };
  const doImport = (t: string) => {
    if (!window.confirm('Replace ALL current progress with this backup?')) return;
    try { importBackup(t); setText(''); } catch (e) { toast('Import failed: ' + (e as Error).message, 'bad'); }
  };
  return (
    <>
      <Panel title="Backup">
        <p className="dim">Progress is stored only in this browser on this device. It does not sync to other devices. Back up before changing the site URL or clearing Safari data.</p>
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
      <Panel title="Preferences">
        <label className="check"><input type="checkbox" checked={g.prefs.anim} onChange={(e) => act((x) => ({ ...x, prefs: { ...x.prefs, anim: e.target.checked } }))} /> Animations</label>
      </Panel>
    </>
  );
}

export default function CharacterScreen({ g }: { g: Game }) {
  const [tab, setTab] = useState<'sheet' | 'archive' | 'history' | 'system'>('sheet');
  return (
    <>
      <div className="tabs">
        {(['sheet', 'archive', 'history', 'system'] as const).map((k) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{k[0].toUpperCase() + k.slice(1)}</button>)}
      </div>
      {tab === 'sheet' && <Sheet g={g} />}
      {tab === 'archive' && <Archive g={g} />}
      {tab === 'history' && <History g={g} />}
      {tab === 'system' && <System g={g} />}
    </>
  );
}
