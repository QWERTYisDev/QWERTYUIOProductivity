import type { Game, Out, ShopItem } from './types.ts';
import { uid } from './rand.ts';

export function validateItem(i: Partial<ShopItem>): string | null {
  if (!i.name || !i.name.trim()) return 'Item needs a name.';
  if (i.name.length > 60) return 'Name is too long (60 max).';
  if (i.price === undefined || !Number.isInteger(i.price) || i.price < 0 || i.price > 1000000) return 'Price must be a whole number of Gold, 0 or more.';
  return null;
}
export const blankItem = (): ShopItem => ({ id: uid(), name: '', desc: '', price: 100, icon: '🎁' });
export const STARTER_ITEMS: ShopItem[] = [
  { id: 'starter-game', name: '10 minutes of gaming', desc: 'A short play break.', price: 100, icon: '🎮' },
  { id: 'starter-ep', name: 'Watch an episode', desc: 'One episode of anything.', price: 200, icon: '📺' },
  { id: 'starter-snack', name: 'Buy a snack', desc: 'Treat yourself.', price: 150, icon: '🍿' },
];
export function saveItem(g: Game, i: ShopItem): Game {
  const exists = g.shop.some((x) => x.id === i.id);
  return { ...g, shop: exists ? g.shop.map((x) => (x.id === i.id ? i : x)) : [...g.shop, i] };
}
export const deleteItem = (g: Game, id: string): Game => ({ ...g, shop: g.shop.filter((i) => i.id !== id) });

/** Deducts Gold only. Blocks the same item bought again within 800ms (double tap). */
export function purchase(g: Game, id: string, now: number = Date.now()): Out {
  const item = g.shop.find((i) => i.id === id);
  if (!item) return { g };
  const last = g.purchases[g.purchases.length - 1];
  if (last && last.itemId === id && now - last.at < 800) return { g };
  if (g.gold < item.price) return { g, ev: [{ t: 'toast', kind: 'bad', text: `Not enough Gold (need ${item.price}).` }] };
  return {
    g: { ...g, gold: g.gold - item.price, purchases: [...g.purchases, { id: uid(), itemId: id, name: item.name, price: item.price, at: now }] },
    ev: [{ t: 'toast', kind: 'good', text: `Purchased: ${item.name} (-${item.price} Gold)` }],
  };
}
