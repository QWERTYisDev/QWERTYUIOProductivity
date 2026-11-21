import { useEffect, useRef, useState } from 'react';
import type { Game, ShopItem } from '../logic/types.ts';
import { blankItem, canAfford, costText, deleteItem, purchase, saveItem, validateItem } from '../logic/shop.ts';
import { act, toast } from '../store.ts';
import { Modal, Panel } from '../ui.tsx';

const ICONS = ['🎮', '📺', '🍿', '📖', '☕', '🍕', '🎬', '🛋️', '🎧', '🍫', '🛍️', '🎁', '🚶', '😴', '🍦', '🎲'];

function ItemForm({ initial, onClose }: { initial: ShopItem; onClose: () => void }) {
  const [i, setI] = useState(initial);
  const [price, setPrice] = useState(String(initial.price));
  const [gems, setGems] = useState(String(initial.gems));
  const [err, setErr] = useState('');
  const submit = () => {
    const out = { ...i, name: i.name.trim(), price: price.trim() === '' ? NaN : Number(price), gems: gems.trim() === '' ? NaN : Number(gems) };
    const e = validateItem(out);
    if (e) return setErr(e);
    act((g) => saveItem(g, out));
    toast('Item saved.', 'good');
    onClose();
  };
  return (
    <Modal title={initial.name ? 'Edit Item' : 'New Item'} onClose={onClose}>
      <label>Name<input value={i.name} maxLength={60} onChange={(e) => setI({ ...i, name: e.target.value })} /></label>
      <label>Description<textarea rows={2} value={i.desc} onChange={(e) => setI({ ...i, desc: e.target.value })} /></label>
      <div className="two">
        <label>Gold cost<input inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} /></label>
        <label>Gems cost<input inputMode="numeric" value={gems} onChange={(e) => setGems(e.target.value)} /></label>
      </div>
      <div className="icons">{ICONS.map((x) => <button key={x} type="button" className={'ic' + (i.icon === x ? ' on' : '')} onClick={() => setI({ ...i, icon: x })}>{x}</button>)}</div>
      {err && <p className="err">{err}</p>}
      <button className="btn wide" onClick={submit}>Save Item</button>
    </Modal>
  );
}

export default function Shop({ g }: { g: Game }) {
  const [edit, setEdit] = useState<ShopItem | null>(null);
  const [bought, setBought] = useState<{ id: string; n: number; text: string } | null>(null);
  const count = useRef(g.purchases.length);
  useEffect(() => {
    const last = g.purchases[g.purchases.length - 1];
    if (g.purchases.length > count.current && last) {
      setBought({ id: last.itemId, n: g.purchases.length, text: `-${costText(last)}` });
      const t = setTimeout(() => setBought(null), 1100);
      count.current = g.purchases.length;
      return () => clearTimeout(t);
    }
    count.current = g.purchases.length;
  }, [g.purchases.length]);
  return (
    <>
      <Panel title="Reward Shop" right={<button className="btn sm" onClick={() => setEdit(blankItem())}>+ New</button>}>
        <p className="row"><span>Your Gold / Gems</span><b><span className="gold">{g.gold}</span> / <span className="gem">{g.gems}</span></b></p>
        {g.shop.length === 0 && <p className="dim">The shop is empty. Add a reward.</p>}
        {g.shop.map((i) => (
          <div className={'task shopitem' + (bought?.id === i.id ? ' bought' : '')} key={i.id}>
            {bought?.id === i.id && <span key={bought.n} className="spent">{bought.text}</span>}
            <span className="ticon">{i.icon}</span>
            <div className="tbody"><b>{i.name}</b>{i.desc && <p className="dim">{i.desc}</p>}<p className="rw gold">{costText(i)}</p></div>
            <div className="tact">
              <button className="btn sm" disabled={!canAfford(g, i)} onClick={() => act((x) => purchase(x, i.id))}>Buy</button>
              <button className="btn ghost sm" onClick={() => setEdit(i)}>Edit</button>
              <button className="btn ghost sm danger" onClick={() => window.confirm(`Delete “${i.name}”?`) && act((x) => deleteItem(x, i.id))}>Delete</button>
            </div>
          </div>
        ))}
      </Panel>
      <Panel title="Purchase History">
        {g.purchases.length === 0 && <p className="dim">No purchases yet.</p>}
        {[...g.purchases].reverse().slice(0, 30).map((p) => (
          <p className="row" key={p.id}><span>{p.name}</span><span className="dim">-{costText(p)} · {new Date(p.at).toLocaleDateString()}</span></p>
        ))}
      </Panel>
      {edit && <ItemForm key={edit.id} initial={edit} onClose={() => setEdit(null)} />}
    </>
  );
}
