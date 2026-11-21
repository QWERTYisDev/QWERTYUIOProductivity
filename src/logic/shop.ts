import type { Game, Out, ShopItem } from './types.ts';
import { uid } from './rand.ts';
import { dateKey } from './tasks.ts';

export function validateItem(i: Partial<ShopItem>): string | null {
  if (!i.name || !i.name.trim()) return 'Item needs a name.';
  if (i.name.length > 60) return 'Name is too long (60 max).';
  for (const [k, v] of [['Gold', i.price], ['Gems', i.gems]] as const) {
    if (v === undefined || !Number.isInteger(v) || v < 0 || v > 1000000) return `${k} cost must be a whole number, 0 or more.`;
  }
  if (i.price === 0 && i.gems === 0) return 'Set a cost in Gold, Gems, or both.';
  if (i.limit && i.limit !== 'none' && (i.n === undefined || !Number.isInteger(i.n) || i.n < (i.limit === 'daily' ? 1 : 0) || i.n > 100000)) return i.limit === 'daily' ? 'Daily limit must be 1 or more.' : 'Stock must be a whole number, 0 or more.';
  if ((i.cat ?? '').length > 24) return 'Category is too long (24 max).';
  return null;
}
export const costText = (i: { price: number; gems: number }) => [i.price && `${i.price} Gold`, i.gems && `${i.gems} Gems`].filter(Boolean).join(' + ') || 'Free';
/** Buys still allowed: Infinity if unlimited, else today's remaining (daily) or the stock left. */
export function leftOf(g: Game, i: ShopItem, now: number = Date.now()): number {
  if (i.limit === 'stock') return i.n;
  if (i.limit === 'daily') return Math.max(0, i.n - g.purchases.filter((p) => p.itemId === i.id && dateKey(new Date(p.at)) === dateKey(new Date(now))).length);
  return Infinity;
}
export const limitText = (g: Game, i: ShopItem) => (i.limit === 'daily' ? `${leftOf(g, i)}/${i.n} left today` : i.limit === 'stock' ? (i.n > 0 ? `${i.n} in stock` : 'Sold out') : '');
export const toggleFav = (g: Game, id: string): Game => ({ ...g, shop: g.shop.map((i) => (i.id === id ? { ...i, fav: !i.fav } : i)) });
export const canAfford = (g: Game, i: ShopItem) => g.gold >= i.price && g.gems >= i.gems;
export const blankItem = (): ShopItem => ({ id: uid(), name: '', desc: '', price: 100, gems: 0, icon: '🎁', cat: '', fav: false, limit: 'none', n: 1 });
export const STARTER_ITEMS: ShopItem[] = [
  { id: 'starter-game', name: '10 minutes of gaming', desc: 'A short play break.', price: 100, gems: 0, icon: '🎮', cat: '', fav: false, limit: 'none', n: 1 },
  { id: 'starter-ep', name: 'Watch an episode', desc: 'One episode of anything.', price: 200, gems: 0, icon: '📺', cat: '', fav: false, limit: 'none', n: 1 },
  { id: 'starter-snack', name: 'Buy a snack', desc: 'Treat yourself.', price: 150, gems: 0, icon: '🍿', cat: '', fav: false, limit: 'none', n: 1 },
];
export function saveItem(g: Game, i: ShopItem): Game {
  const exists = g.shop.some((x) => x.id === i.id);
  return { ...g, shop: exists ? g.shop.map((x) => (x.id === i.id ? i : x)) : [...g.shop, i] };
}
export const deleteItem = (g: Game, id: string): Game => ({ ...g, shop: g.shop.filter((i) => i.id !== id) });

/** Deducts the item's Gold and/or Gems. Blocks the same item bought again within 800ms (double tap). */
export function purchase(g: Game, id: string, now: number = Date.now()): Out {
  const item = g.shop.find((i) => i.id === id);
  if (!item) return { g };
  const last = g.purchases[g.purchases.length - 1];
  if (last && last.itemId === id && now - last.at < 800) return { g };
  if (leftOf(g, item, now) <= 0) return { g, ev: [{ t: 'toast', kind: 'bad', text: item.limit === 'stock' ? 'Sold out.' : 'Daily limit reached.' }] };
  if (g.gold < item.price || g.gems < item.gems) return { g, ev: [{ t: 'toast', kind: 'bad', text: `Not enough funds (need ${costText(item)}).` }] };
  return {
    g: { ...g, gold: g.gold - item.price, gems: g.gems - item.gems, shop: item.limit === 'stock' ? g.shop.map((x) => (x.id === id ? { ...x, n: x.n - 1 } : x)) : g.shop, purchases: [...g.purchases, { id: uid(), itemId: id, name: item.name, price: item.price, gems: item.gems, at: now }] },
    ev: [{ t: 'sfx', k: 'buy' }, { t: 'toast', kind: 'good', text: `Purchased: ${item.name} (-${costText(item)})` }],
  };
}
