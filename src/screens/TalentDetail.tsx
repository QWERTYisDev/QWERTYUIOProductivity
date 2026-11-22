import { useState } from 'react';
import { STAT_LABEL, STATS } from '../logic/types.ts';
import { TALENTS, TALENT_BY_ID } from '../logic/talents.ts';
import { FAVOR_GEMS, effectLines, owned } from '../logic/talentLogic.ts';
import { favorTalent } from '../logic/game.ts';
import { act, closeTalent, useSnap } from '../store.ts';
import { Modal } from '../ui.tsx';

/** Talent description window. Names of talents you have not discovered yet stay hidden as ???. */
export function TalentDetail() {
  const { talentView, game: g } = useSnap();
  const [closing, setClosing] = useState(false);
  const t = talentView ? TALENT_BY_ID[talentView] : null;
  if (!t) return null;
  const c = g.character;
  const close = () => { if (closing) return; setClosing(true); setTimeout(() => { closeTalent(); setClosing(false); }, document.body.classList.contains('noanim') ? 0 : 450); };
  const name = (id: string) => (g.seenTalents[id] ? TALENT_BY_ID[id].name : '???');
  const effects = effectLines(t);
  const leadsTo = TALENTS.filter((x) => x.needs?.includes(t.id));
  const have = c ? owned(c, t.id) : 0;
  const stat = STATS.filter((s) => t.req?.[s]);
  return (
    <Modal title="Talent" onClose={close} closing={closing}>
      <div className={'tdetail r-' + t.rarity}>
        <span className="rar">{t.rarity}</span>
        <h3>{t.name}</h3>
        <p>{t.desc}</p>
      </div>
      <div>
        <h4 className="gh">Effects</h4>
        <ul className="tlist">{effects.map((e) => <li key={e}>{e}</li>)}</ul>
      </div>
      <div>
        <h4 className="gh">Requirements</h4>
        {stat.length === 0 && !t.needs?.length && <p className="dim">None.</p>}
        <ul className="tlist">
          {stat.map((s) => {
            const ok = !!c && c.base[s] >= t.req![s]!;
            return <li key={s} className={c ? (ok ? 'ok' : 'no') : ''}>Base {STAT_LABEL[s]} {t.req![s]}+{c ? ` (you: ${c.base[s]})` : ''}</li>;
          })}
          {(t.needs ?? []).map((id) => {
            const ok = !!c && c.talents.includes(id);
            return <li key={id} className={c ? (ok ? 'ok' : 'no') : ''}>Talent: {name(id)}</li>;
          })}
        </ul>
        <p className="dim">Requirements use base stats only, never talent bonuses.</p>
      </div>
      {leadsTo.length > 0 && (
        <div>
          <h4 className="gh">Leads to</h4>
          <ul className="tlist">{leadsTo.map((x) => <li key={x.id}>{name(x.id)}</li>)}</ul>
        </div>
      )}
      <div>
        <h4 className="gh">Favor</h4>
        {g.favored[t.id]
          ? <p className="ok">★ Favored: counts four times in future Talent Hands until you pick it.</p>
          : <>
              <p className="dim">Spend {FAVOR_GEMS} Gems to make this talent four times as likely to appear in future hands. The favor is used up when you pick it.</p>
              <button className="btn wide" disabled={g.gems < FAVOR_GEMS || !c || have > 0} onClick={() => act((x) => favorTalent(x, t.id))}>Favor for {FAVOR_GEMS} Gems (you have {g.gems})</button>
            </>}
      </div>
      <p className="dim">Each talent can only be held once{c ? ` · ${have ? 'you own this one' : 'you do not own this yet'}` : ''}.</p>
    </Modal>
  );
}
