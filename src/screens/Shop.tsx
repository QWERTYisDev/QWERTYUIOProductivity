import { useState } from 'react';
import type { Game, ShopItem } from '../logic/types.ts';
import { blankItem, deleteItem, purchase, saveItem, validateItem } from '../logic/shop.ts';
import { act, toast } from '../store.ts';
import { Modal, Panel } from '../ui.tsx';

const ICONS = ['🎮', '📺', '🍿', '📖', '☕', '🍕', '🎬', '🛋️', '🎧', '🍫', '🛍️', '🎁', '🚶', '😴', '🍦', '🎲'];

function ItemForm({ initial, onClose }: { initial: ShopItem; onClose: () => void }) {
  const [i, setI] = useState(initial);
  const [price, setPrice] = useState(String(initial.price));
  const [err, setErr] = useState('');
  const submit = () => {
    const out = { ...i, name: i.name.trim(), price: price.trim() === '' ? NaN : Number(price) };
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
      <label>Price (Gold)<input inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} /></label>
      <div className="icons">{ICONS.map((x) => <button key={x} type="button" className={'ic' + (i.icon === x ? ' on' : '')} onClick={() => setI({ ...i, icon: x })}>{x}</button>)}</div>
      {err && <p className="err">{err}</p>}
      <button className="btn wide" onClick={submit}>Save Item</button>
    </Modal>
  );
}

export default function Shop({ g }: { g: Game }) {
  const [edit, setEdit] = useState<ShopItem | null>(null);
  return (
    <>
      <Panel title="Reward Shop" right={<button className="btn sm" onClick={() => setEdit(blankItem())}>+ New</button>}>
        <p className="row"><span>Your Gold</span><b className="gold">{g.gold}</b></p>
        {g.shop.length === 0 && <p className="dim">The shop is empty. Add a reward.</p>}
        {g.shop.map((i) => (
          <div className="task" key={i.id}>
            <span className="ticon">{i.icon}</span>
            <div className="tbody"><b>{i.name}</b>{i.desc && <p className="dim">{i.desc}</p>}<p className="rw gold">{i.price} Gold</p></div>
            <div className="tact">
              <button className="btn sm" disabled={g.gold < i.price} onClick={() => act((x) => purchase(x, i.id))}>Buy</button>
              <button className="btn ghost sm" onClick={() => setEdit(i)}>Edit</button>
              <button className="btn ghost sm danger" onClick={() => window.confirm(`Delete “${i.name}”?`) && act((x) => deleteItem(x, i.id))}>Delete</button>
            </div>
          </div>
        ))}
      </Panel>
      <Panel title="Purchase History">
        {g.purchases.length === 0 && <p className="dim">No purchases yet.</p>}
        {[...g.purchases].reverse().slice(0, 30).map((p) => (
          <p className="row" key={p.id}><span>{p.name}</span><span className="dim">-{p.price} · {new Date(p.at).toLocaleDateString()}</span></p>
        ))}
      </Panel>
      {edit && <ItemForm key={edit.id} initial={edit} onClose={() => setEdit(null)} />}
    </>
  );
}
