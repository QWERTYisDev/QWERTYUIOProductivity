import type { Game } from '../logic/types.ts';
import { TALENTS, TALENT_BY_ID } from '../logic/talents.ts';
import { eligible, meetsReq, owned } from '../logic/talentLogic.ts';
import { openTalentHand, pickTalent } from '../logic/game.ts';
import { act } from '../store.ts';
import { Panel, TalentCard, TalentChips } from '../ui.tsx';

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
            <div className="hand">{offer.map((id, i) => <TalentCard key={id} t={TALENT_BY_ID[id]} delay={i * 220} onPick={() => act((x) => pickTalent(x, id))} />)}</div>
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
        {TALENTS.map((t) => {
          const n = owned(c, t.id);
          return <TalentCard key={t.id} t={t} note={`${n >= t.max ? 'Maxed' : meetsReq(c, t) ? 'Eligible' : 'Locked'} · owned ${n}/${t.max}`} />;
        })}
      </Panel>
    </>
  );
}
