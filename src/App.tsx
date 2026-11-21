import { useEffect, useState } from 'react';
import { levelOf, MAX_LEVEL } from './logic/leveling.ts';
import { dismissNote, eraseAll, importBackup, toast, useSnap } from './store.ts';
import { Icon, Overlays, Panel, Toasts } from './ui.tsx';
import Home from './screens/Home.tsx';
import Tasks from './screens/Tasks.tsx';
import Shop from './screens/Shop.tsx';
import CharacterScreen from './screens/Character.tsx';
import Talents from './screens/Talents.tsx';
import Battle from './screens/Battle.tsx';
import Create from './screens/Create.tsx';

const NAV = [['home', 'Home'], ['tasks', 'Tasks'], ['shop', 'Shop'], ['character', 'Character'], ['talents', 'Talents'], ['battle', 'Battle']] as const;

function Fatal({ error, raw }: { error: string; raw: string | null }) {
  const download = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([raw ?? ''], { type: 'text/plain' }));
    a.download = 'system-damaged-save.txt';
    a.click();
  };
  return (
    <main className="screen">
      <Panel title="Storage problem">
        <p className="err">{error}</p>
        <p className="dim">Nothing has been overwritten or deleted. Saving is paused until you choose below.</p>
        {raw && <button className="btn wide" onClick={download}>Download the damaged data</button>}
        <label>Paste a backup to restore<textarea id="fatal-import" rows={4} /></label>
        <button className="btn wide" onClick={() => { try { importBackup((document.getElementById('fatal-import') as HTMLTextAreaElement).value); } catch (e) { toast('Import failed: ' + (e as Error).message, 'bad'); } }}>Restore backup</button>
        <button className="btn ghost wide danger" onClick={() => window.confirm('Erase the damaged data and start fresh?') && eraseAll()}>Erase and start fresh</button>
      </Panel>
      <Toasts />
    </main>
  );
}

export default function App() {
  const { game: g, fatal, saveError, note } = useSnap();
  const [screen, setScreen] = useState<(typeof NAV)[number][0]>('home');
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 30000); // roll over to the next day while open
    const vis = () => tick((n) => n + 1);
    document.addEventListener('visibilitychange', vis);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', vis); };
  }, []);
  useEffect(() => { document.body.classList.toggle('noanim', !g.prefs.anim); }, [g.prefs.anim]);

  useEffect(() => { if (!g.character) setScreen('home'); }, [g.character]);

  if (fatal) return <Fatal {...fatal} />;
  const now = new Date();
  const c = g.character;
  const ready = !!c && levelOf(c.totalXp) >= MAX_LEVEL;

  return (
    <div className="app">
      {c && (
        <nav>
          {NAV.map(([k, label]) => (
            <button key={k} className={screen === k ? 'on' : ''} onClick={() => (k === 'battle' && !ready ? toast(`Battle unlocks at Level ${MAX_LEVEL}.`, 'info') : setScreen(k))}>
              <Icon n={k === 'battle' && !ready ? 'lock' : k} /><span>{label}</span>
            </button>
          ))}
        </nav>
      )}
      <main className="screen">
        {note && <div className="banner" onClick={dismissNote}>{note} (tap to dismiss)</div>}
        {saveError && <div className="banner bad">{saveError} Export a backup if you can.</div>}
        {!c ? <Create g={g} /> : (
          <>
            {screen === 'home' && <Home g={g} now={now} go={(s) => setScreen(s as typeof screen)} />}
            {screen === 'tasks' && <Tasks g={g} now={now} />}
            {screen === 'shop' && <Shop g={g} />}
            {screen === 'character' && <CharacterScreen g={g} />}
            {screen === 'talents' && <Talents g={g} />}
            {screen === 'battle' && <Battle g={g} />}
          </>
        )}
      </main>
      <Toasts />
      <Overlays />
    </div>
  );
}
