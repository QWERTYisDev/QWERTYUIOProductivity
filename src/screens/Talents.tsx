import { useEffect, useState, type CSSProperties } from 'react';
import type { Game } from '../logic/types.ts';
import { TALENTS, TALENT_BY_ID } from '../logic/talents.ts';
import { REROLL_GEMS, eligible, meetsReq, owned } from '../logic/talentLogic.ts';
import { openTalentHand, pickTalent, rerollHand } from '../logic/game.ts';
import { act, buzz } from '../store.ts';
import { Panel, TalentCard, TalentChips } from '../ui.tsx';

let dealt = ''; // last offer that played the deal animation, so revisiting the tab does not replay it

function Hand({ offer, id }: { offer: string[]; id: string }) {
  const [fresh] = useState(dealt !== id);
  const [ready, setReady] = useState(!fresh);
  const [picked, setPicked] = useState<string | null>(null);
  useEffect(() => {
    dealt = id;
    if (fresh) { const timer = setTimeout(() => setReady(true), 1300 + offer.length * 550 + 700); return () => clearTimeout(timer); }
  }, [id, fresh, offer.length]);
  // Tap a card: it flares, the others dissolve, then the talent is applied and the "acquired" window opens.
  const pick = (tid: string) => {
    if (picked) return;
    setPicked(tid);
    buzz(); // vibration happens now, inside the tap
    setTimeout(() => act((x) => {
      const g2 = pickTalent(x, tid);
      return g2 === x ? { g: x } : { g: g2, ev: [{ t: 'talent', id: tid }] };
    }), document.body.classList.contains('noanim') ? 0 : 950);
  };
  return (
    <>
      <p className="sysh">{ready ? '[ TAP A CARD TO CHOOSE ]' : '[ TALENT HAND ]'}</p>
      <div className={'hand' + (picked ? ' picked' : '')}>
        {offer.map((tid, i) => (
          <div key={tid} className={`deal r-${TALENT_BY_ID[tid].rarity}${fresh ? ' fresh' : ''}${picked === tid ? ' chosen' : ''}`} style={{ '--i': i } as CSSProperties}>
            <div className="deal-inner">
              <div className="dface back"><span /></div>
              <div className="dface front"><TalentCard t={TALENT_BY_ID[tid]} onPick={ready && !picked ? () => pick(tid) : undefined} /></div>
            </div>
            <i className="beam" />
          </div>
        ))}
      </div>
    </>
  );
}

export default function Talents({ g }: { g: Game }) {
  const c = g.character!;
  const offer = c.offer;
  return (
    <>
      <Panel title="Talent Hands" right={<span className="tag">{c.hands} available</span>}>
        {c.hands < 1 && <p className="dim">Earn a Talent Hand with every level-up.</p>}
        {c.hands >= 1 && !offer && (
          <>
            <p className="dim">{eligible(c).length} talents currently qualify. A hand shows up to 3 and you keep one.</p>
            <button className="btn wide" onClick={() => act(openTalentHand)}>Open Talent Hand</button>
          </>
        )}
        {c.hands >= 1 && offer && offer.length > 0 && (
          <>
            <p className="dim">Choose one. Your offer is saved, so leaving this screen will not re-roll it.</p>
            <Hand key={offer.join() + ':' + g.gems} id={offer.join() + ':' + g.gems} offer={offer} />
            <button className="btn ghost wide" disabled={g.gems < REROLL_GEMS} onClick={() => act(rerollHand)}>Re-roll offer ({REROLL_GEMS} Gems, you have {g.gems})</button>
          </>
        )}
        {c.hands >= 1 && offer && offer.length === 0 && (
          <>
            <p>No talent qualifies right now. Raise your base stats with Skill Points and you will be offered more next time.</p>
            <button className="btn wide" onClick={() => act((x) => pickTalent(x, null))}>Resolve hand without a talent</button>
          </>
        )}
      </Panel>
      <Panel title="Your Talents"><TalentChips c={c} /></Panel>
      <Panel title={`Talent Catalog (${TALENTS.length})`}>
        <p className="dim">Requirements use base stats only. Percent bonuses apply after flat bonuses.</p>
        <div className="scrollbox cards">
        {TALENTS.map((t) => {
          const n = owned(c, t.id);
          return <TalentCard key={t.id} t={t} note={`${n >= t.max ? 'Maxed' : meetsReq(c, t) ? 'Eligible' : 'Locked'} · owned ${n}/${t.max}`} />;
        })}
        </div>
      </Panel>
    </>
  );
}
