import type { Game, Out, ShopItem } from './types.ts';
import { uid } from './rand.ts';

export function validateItem(i: Partial<ShopItem>): string | null {
  if (!i.name || !i.name.trim()) return 'Item needs a name.';
  if (i.name.length > 60) return 'Name is too long (60 max).';
  for (const [k, v] of [['Gold', i.price], ['Gems', i.gems]] as const) {
    if (v === undefined || !Number.isInteger(v) || v < 0 || v > 1000000) return `${k} cost must be a whole number, 0 or more.`;
  }
  if (i.price === 0 && i.gems === 0) return 'Set a cost in Gold, Gems, or both.';
  return null;
}
export const costText = (i: { price: number; gems: number }) => [i.price && `${i.price} Gold`, i.gems && `${i.gems} Gems`].filter(Boolean).join(' + ') || 'Free';
export const canAfford = (g: Game, i: ShopItem) => g.gold >= i.price && g.gems >= i.gems;
export const blankItem = (): ShopItem => ({ id: uid(), name: '', desc: '', price: 100, gems: 0, icon: '🎁' });
export const STARTER_ITEMS: ShopItem[] = [
  { id: 'starter-game', name: '10 minutes of gaming', desc: 'A short play break.', price: 100, gems: 0, icon: '🎮' },
  { id: 'starter-ep', name: 'Watch an episode', desc: 'One episode of anything.', price: 200, gems: 0, icon: '📺' },
  { id: 'starter-snack', name: 'Buy a snack', desc: 'Treat yourself.', price: 150, gems: 0, icon: '🍿' },
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
  if (g.gold < item.price || g.gems < item.gems) return { g, ev: [{ t: 'toast', kind: 'bad', text: `Not enough funds (need ${costText(item)}).` }] };
  return {
    g: { ...g, gold: g.gold - item.price, gems: g.gems - item.gems, purchases: [...g.purchases, { id: uid(), itemId: id, name: item.name, price: item.price, gems: item.gems, at: now }] },
    ev: [{ t: 'toast', kind: 'good', text: `Purchased: ${item.name} (-${costText(item)})` }],
  };
}
