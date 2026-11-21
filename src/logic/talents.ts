import type { Talent } from './types.ts';

// The starting catalog: exactly 45 talents. Percent values are percent (15 = +15%).
// Order of effects: effective = (base + flat) * (1 + sum(pct)/100). Health is added to the base 10.
export const TALENTS: Talent[] = [
  // ---- Common (14): small, stackable up to 3 ----
  { id: 'strong', name: 'Strong', rarity: 'common', desc: '+2 Strength.', flat: { str: 2 }, max: 3 },
  { id: 'nimble', name: 'Nimble', rarity: 'common', desc: '+2 Agility.', flat: { agi: 2 }, max: 3 },
  { id: 'hardy', name: 'Hardy', rarity: 'common', desc: '+2 Fortitude.', flat: { fort: 2 }, max: 3 },
  { id: 'attuned', name: 'Attuned', rarity: 'common', desc: '+2 Mana.', flat: { mana: 2 }, max: 3 },
  { id: 'durable', name: 'Durable', rarity: 'common', desc: '+1 Health.', health: 1, max: 3 },
  { id: 'brawler', name: 'Brawler', rarity: 'common', desc: '+1 Strength, +1 Fortitude.', flat: { str: 1, fort: 1 }, max: 3 },
  { id: 'skirmisher', name: 'Skirmisher', rarity: 'common', desc: '+1 Strength, +1 Agility.', flat: { str: 1, agi: 1 }, max: 3 },
  { id: 'sentinel', name: 'Sentinel', rarity: 'common', desc: '+1 Fortitude, +1 Mana.', flat: { fort: 1, mana: 1 }, max: 3 },
  { id: 'scholar', name: 'Scholar', rarity: 'common', desc: '+1 Mana, +1 Agility.', flat: { mana: 1, agi: 1 }, max: 3 },
  { id: 'thick_skin', name: 'Thick Skin', rarity: 'common', desc: '+1 Fortitude, +1 Health.', flat: { fort: 1 }, health: 1, max: 3 },
  { id: 'iron_fist', name: 'Iron Fist', rarity: 'common', desc: 'Battle: +2 when using Strength against Fortitude.', cond: [{ use: 'str', vs: 'fort', flat: 2 }], max: 3 },
  { id: 'quick_feet', name: 'Quick Feet', rarity: 'common', desc: 'Battle: +2 when using Agility against Strength.', cond: [{ use: 'agi', vs: 'str', flat: 2 }], max: 3 },
  { id: 'stone_wall', name: 'Stone Wall', rarity: 'common', desc: 'Battle: +2 when using Fortitude against Mana.', cond: [{ use: 'fort', vs: 'mana', flat: 2 }], max: 3 },
  { id: 'mind_spark', name: 'Mind Spark', rarity: 'common', desc: 'Battle: +2 when using Mana against Agility.', cond: [{ use: 'mana', vs: 'agi', flat: 2 }], max: 3 },

  // ---- Uncommon (14): need modest base stats, stackable up to 2 ----
  { id: 'powerful', name: 'Powerful', rarity: 'uncommon', desc: '+10% Strength. Requires 10 base Strength.', req: { str: 10 }, pct: { str: 10 }, max: 2 },
  { id: 'swift', name: 'Swift', rarity: 'uncommon', desc: '+10% Agility. Requires 10 base Agility.', req: { agi: 10 }, pct: { agi: 10 }, max: 2 },
  { id: 'resilient', name: 'Resilient', rarity: 'uncommon', desc: '+10% Fortitude. Requires 10 base Fortitude.', req: { fort: 10 }, pct: { fort: 10 }, max: 2 },
  { id: 'insightful', name: 'Insightful', rarity: 'uncommon', desc: '+10% Mana. Requires 10 base Mana.', req: { mana: 10 }, pct: { mana: 10 }, max: 2 },
  { id: 'vitality', name: 'Vitality', rarity: 'uncommon', desc: '+2 Health.', health: 2, max: 2 },
  { id: 'duelist', name: 'Duelist', rarity: 'uncommon', desc: '+2 Strength, +2 Agility. Requires 8 base Strength and Agility.', req: { str: 8, agi: 8 }, flat: { str: 2, agi: 2 }, max: 2 },
  { id: 'bulwark', name: 'Bulwark', rarity: 'uncommon', desc: '+2 Fortitude, +1 Health. Requires 8 base Fortitude.', req: { fort: 8 }, flat: { fort: 2 }, health: 1, max: 2 },
  { id: 'spellblade', name: 'Spellblade', rarity: 'uncommon', desc: '+2 Strength, +2 Mana. Requires 8 base Strength and Mana.', req: { str: 8, mana: 8 }, flat: { str: 2, mana: 2 }, max: 2 },
  { id: 'windcaller', name: 'Windcaller', rarity: 'uncommon', desc: '+2 Agility, +2 Mana. Requires 8 base Agility and Mana.', req: { agi: 8, mana: 8 }, flat: { agi: 2, mana: 2 }, max: 2 },
  { id: 'balanced', name: 'Balanced', rarity: 'uncommon', desc: '+1 to every stat. Requires 7 base in every stat.', req: { str: 7, agi: 7, fort: 7, mana: 7 }, flat: { str: 1, agi: 1, fort: 1, mana: 1 }, max: 2 },
  { id: 'crusher', name: 'Crusher', rarity: 'uncommon', desc: 'Battle: +15% when using Strength against Fortitude.', cond: [{ use: 'str', vs: 'fort', pct: 15 }], max: 2 },
  { id: 'shadow_step', name: 'Shadow Step', rarity: 'uncommon', desc: 'Battle: +15% when using Agility against Strength.', cond: [{ use: 'agi', vs: 'str', pct: 15 }], max: 2 },
  { id: 'bastion', name: 'Bastion', rarity: 'uncommon', desc: 'Battle: +15% when using Fortitude against Mana.', cond: [{ use: 'fort', vs: 'mana', pct: 15 }], max: 2 },
  { id: 'hex', name: 'Hex', rarity: 'uncommon', desc: 'Battle: +15% when using Mana against Agility.', cond: [{ use: 'mana', vs: 'agi', pct: 15 }], max: 2 },

  // ---- Rare (10): single copy ----
  { id: 'arcane_trickster', name: 'Arcane Trickster', rarity: 'rare', desc: '+15% Agility, +15% Mana. Requires 15 base Agility and Mana.', req: { agi: 15, mana: 15 }, pct: { agi: 15, mana: 15 }, max: 1 },
  { id: 'titan', name: 'Titan', rarity: 'rare', desc: '+15% Strength, +2 Health. Requires 13 base Strength and Fortitude.', req: { str: 13, fort: 13 }, pct: { str: 15 }, health: 2, max: 1 },
  { id: 'berserker', name: 'Berserker', rarity: 'rare', desc: '+20% Strength. Requires 14 base Strength.', req: { str: 14 }, pct: { str: 20 }, max: 1 },
  { id: 'phantom', name: 'Phantom', rarity: 'rare', desc: '+20% Agility. Requires 14 base Agility.', req: { agi: 14 }, pct: { agi: 20 }, max: 1 },
  { id: 'fortress', name: 'Fortress', rarity: 'rare', desc: '+20% Fortitude, +1 Health. Requires 14 base Fortitude.', req: { fort: 14 }, pct: { fort: 20 }, health: 1, max: 1 },
  { id: 'archmage', name: 'Archmage', rarity: 'rare', desc: '+20% Mana. Requires 14 base Mana.', req: { mana: 14 }, pct: { mana: 20 }, max: 1 },
  { id: 'war_mage', name: 'War Mage', rarity: 'rare', desc: '+10% Strength, +10% Mana, +1 Health. Requires 12 base Strength and Mana.', req: { str: 12, mana: 12 }, pct: { str: 10, mana: 10 }, health: 1, max: 1 },
  { id: 'vanguard', name: 'Vanguard', rarity: 'rare', desc: '+2 Strength, +2 Fortitude, +1 Health. Requires 12 base Strength and Fortitude.', req: { str: 12, fort: 12 }, flat: { str: 2, fort: 2 }, health: 1, max: 1 },
  { id: 'storm_dancer', name: 'Storm Dancer', rarity: 'rare', desc: '+10% Strength, +10% Agility; Battle: +2 when using Agility against Strength. Requires 12 base Strength and Agility.', req: { str: 12, agi: 12 }, pct: { str: 10, agi: 10 }, cond: [{ use: 'agi', vs: 'str', flat: 2 }], max: 1 },
  { id: 'colossus', name: 'Colossus', rarity: 'rare', desc: '+3 Health. Requires 12 base Fortitude.', req: { fort: 12 }, health: 3, max: 1 },

  // ---- Epic (5) ----
  { id: 'overlord', name: 'Overlord', rarity: 'epic', desc: '+25% Strength, +1 Health. Requires 15 base Strength.', req: { str: 15 }, pct: { str: 25 }, health: 1, max: 1 },
  { id: 'untouchable', name: 'Untouchable', rarity: 'epic', desc: '+25% Agility; Battle: +10% when using Agility against Strength. Requires 15 base Agility.', req: { agi: 15 }, pct: { agi: 25 }, cond: [{ use: 'agi', vs: 'str', pct: 10 }], max: 1 },
  { id: 'unbreakable', name: 'Unbreakable', rarity: 'epic', desc: '+25% Fortitude, +2 Health. Requires 15 base Fortitude.', req: { fort: 15 }, pct: { fort: 25 }, health: 2, max: 1 },
  { id: 'grand_sorcerer', name: 'Grand Sorcerer', rarity: 'epic', desc: '+25% Mana; Battle: +10% when using Mana against Agility. Requires 15 base Mana.', req: { mana: 15 }, pct: { mana: 25 }, cond: [{ use: 'mana', vs: 'agi', pct: 10 }], max: 1 },
  { id: 'all_rounder', name: 'All-Rounder', rarity: 'epic', desc: '+10% to every stat. Requires 12 base in every stat.', req: { str: 12, agi: 12, fort: 12, mana: 12 }, pct: { str: 10, agi: 10, fort: 10, mana: 10 }, max: 1 },

  // ---- Legendary (2) ----
  { id: 'monarch_blood', name: 'Monarch Blood', rarity: 'legendary', desc: '+15% to every stat, +2 Health. Requires 13 base in every stat.', req: { str: 13, agi: 13, fort: 13, mana: 13 }, pct: { str: 15, agi: 15, fort: 15, mana: 15 }, health: 2, max: 1 },
  { id: 'sovereign', name: 'Sovereign', rarity: 'legendary', desc: '+20% to every stat, +3 Health. Requires 14 base in every stat.', req: { str: 14, agi: 14, fort: 14, mana: 14 }, pct: { str: 20, agi: 20, fort: 20, mana: 20 }, health: 3, max: 1 },
];

export const TALENT_BY_ID: Record<string, Talent> = Object.fromEntries(TALENTS.map((t) => [t.id, t]));
