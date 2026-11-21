import { useEffect, useRef, useState } from 'react';
import type { Game, ShopItem } from '../logic/types.ts';
import { blankItem, canAfford, costText, deleteItem, leftOf, limitText, purchase, saveItem, toggleFav, validateItem } from '../logic/shop.ts';
import { act, toast } from '../store.ts';
import { Modal, Panel, useSheet } from '../ui.tsx';

const ICONS = ['🎮', '📺', '🍿', '📖', '☕', '🍕', '🎬', '🛋️', '🎧', '🍫', '🛍️', '🎁', '🚶', '😴', '🍦', '🎲'];

function ItemForm({ initial, onClose, closing, cats }: { initial: ShopItem; onClose: () => void; closing: boolean; cats: string[] }) {
  const [i, setI] = useState(initial);
  const [price, setPrice] = useState(String(initial.price));
  const [gems, setGems] = useState(String(initial.gems));
  const [n, setN] = useState(String(initial.n));
  const [err, setErr] = useState('');
  const submit = () => {
    const out = { ...i, name: i.name.trim(), price: price.trim() === '' ? NaN : Number(price), gems: gems.trim() === '' ? NaN : Number(gems), cat: i.cat.trim(), n: i.limit === 'none' ? 1 : n.trim() === '' ? NaN : Number(n) };
    const e = validateItem(out);
    if (e) return setErr(e);
    act((g) => saveItem(g, out));
    toast('Item saved.', 'good');
    onClose();
  };
  return (
    <Modal title={initial.name ? 'Edit Item' : 'New Item'} onClose={onClose} closing={closing}>
      <label>Name<input value={i.name} maxLength={60} onChange={(e) => setI({ ...i, name: e.target.value })} /></label>
      <label>Description<textarea rows={2} value={i.desc} onChange={(e) => setI({ ...i, desc: e.target.value })} /></label>
      <div className="two">
        <label>Gold cost<input inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} /></label>
        <label>Gems cost<input inputMode="numeric" value={gems} onChange={(e) => setGems(e.target.value)} /></label>
      </div>
      <label>Category (optional)<input list="shop-cats" value={i.cat} maxLength={24} placeholder="e.g. Gaming, Food" onChange={(e) => setI({ ...i, cat: e.target.value })} /></label>
      <datalist id="shop-cats">{cats.map((c) => <option key={c} value={c} />)}</datalist>
      <div className="two">
        <label>Availability
          <select value={i.limit} onChange={(e) => setI({ ...i, limit: e.target.value as ShopItem['limit'] })}>
            <option value="none">Unlimited</option><option value="daily">Limited per day</option><option value="stock">Limited stock</option>
          </select>
        </label>
        {i.limit !== 'none' && <label>{i.limit === 'daily' ? 'Max per day' : 'Stock left'}<input inputMode="numeric" value={n} onChange={(e) => setN(e.target.value)} /></label>}
      </div>
      <div className="icons">{ICONS.map((x) => <button key={x} type="button" className={'ic' + (i.icon === x ? ' on' : '')} onClick={() => setI({ ...i, icon: x })}>{x}</button>)}</div>
      {err && <p className="err">{err}</p>}
      <button className="btn wide" onClick={submit}>Save Item</button>
    </Modal>
  );
}

export default function Shop({ g }: { g: Game }) {
  const sheet = useSheet<ShopItem>();
  const [bought, setBought] = useState<{ id: string; n: number; text: string } | null>(null);
  const count = useRef(g.purchases.length);
  // Favourites are pinned on top; everything else is grouped by category.
  const favs = g.shop.filter((i) => i.fav);
  const rest = g.shop.filter((i) => !i.fav);
  const cats = [...new Set(g.shop.map((i) => i.cat).filter(Boolean))].sort();
  const groups: [string, ShopItem[]][] = [
    ...(favs.length ? ([['★ Favourites', favs]] as [string, ShopItem[]][]) : []),
    ...([...new Set(rest.map((i) => i.cat || 'General'))].sort().map((c) => [c, rest.filter((i) => (i.cat || 'General') === c)] as [string, ShopItem[]])),
  ];
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
      <Panel title="Reward Shop" right={<button className="btn sm" onClick={() => sheet.open(blankItem())}>+ New</button>}>
        <p className="row"><span>Your Gold / Gems</span><b><span className="gold">{g.gold}</span> / <span className="gem">{g.gems}</span></b></p>
        <div className="scrollbox">
        {g.shop.length === 0 && <p className="dim">The shop is empty. Add a reward.</p>}
        {groups.map(([label, items]) => (
          <div key={label}>
            <h4 className="gh">{label}</h4>
        {items.map((i) => (
          <div className="task shopitem" key={i.id}>
            {bought?.id === i.id && (
              <span key={bought.n} className="buyfx" aria-hidden="true">
                <i className="bsweep" />
                <span className="spent"><small>[ PURCHASED ]</small>{bought.text}</span>
              </span>
            )}
            <span className="ticon">{i.icon}</span>
            <div className="tbody"><b>{i.name}</b> <button className={'star' + (i.fav ? ' on' : '')} aria-label={i.fav ? 'Unpin favourite' : 'Pin as favourite'} onClick={() => act((x) => toggleFav(x, i.id))}>{i.fav ? '★' : '☆'}</button>{i.desc && <p className="dim">{i.desc}</p>}<p className="rw gold">{costText(i)}</p>{i.limit !== 'none' && <p className="meta">{limitText(g, i)}</p>}</div>
            <div className="tact">
              <button className="btn sm" disabled={!canAfford(g, i) || leftOf(g, i) <= 0} onClick={() => act((x) => purchase(x, i.id))}>Buy</button>
              <button className="btn ghost sm" onClick={() => sheet.open(i)}>Edit</button>
              <button className="btn ghost sm danger" onClick={() => window.confirm(`Delete “${i.name}”?`) && act((x) => deleteItem(x, i.id))}>Delete</button>
            </div>
          </div>
        ))}
          </div>
        ))}
        </div>
      </Panel>
      <Panel title="Purchase History">
        <div className="scrollbox">
        {g.purchases.length === 0 && <p className="dim">No purchases yet.</p>}
        {[...g.purchases].reverse().slice(0, 30).map((p) => (
          <p className="row" key={p.id}><span>{p.name}</span><span className="dim">-{costText(p)} · {new Date(p.at).toLocaleDateString()}</span></p>
        ))}
        </div>
      </Panel>
      {sheet.v && <ItemForm key={sheet.v.id} initial={sheet.v} closing={sheet.closing} onClose={sheet.close} cats={cats} />}
    </>
  );
}
