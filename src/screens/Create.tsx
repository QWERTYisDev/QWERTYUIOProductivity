import { useState } from 'react';
import type { Game } from '../logic/types.ts';
import { randomName } from '../logic/character.ts';
import { createHero } from '../logic/game.ts';
import { act } from '../store.ts';
import { Panel } from '../ui.tsx';

export default function Create({ g }: { g: Game }) {
  const [name, setName] = useState(randomName());
  return (
    <Panel title={`Generation ${g.gen}`}>
      <h1>A new Player awakens</h1>
      <p className="dim">Your stats are rolled once from 5 to 15 each. Gold and Gems carry over. Level, XP, Skill Points and talents start fresh.</p>
      <label>Name<input value={name} maxLength={24} onChange={(e) => setName(e.target.value)} /></label>
      <div className="two">
        <button className="btn ghost" onClick={() => setName(randomName())}>Random name</button>
        <button className="btn" disabled={!name.trim()} onClick={() => act((x) => createHero(x, name))}>Awaken</button>
      </div>
    </Panel>
  );
}
