import type { Talent } from './types.ts';

// The catalog: exactly 100 talents (45 originals + 10 tree talents + 45 more). Percent values are percent (15 = +15%).
// Every talent can be held once (max: 1), so an owned talent never appears in a hand again.
// Order of effects: effective = (base + flat) * (1 + sum(pct)/100). Health is added to the base 10.
export const TALENTS: Talent[] = [
  // ---- Common (14): small, stackable up to 3 ----
  { id: 'strong', name: 'Strong', rarity: 'common', desc: '+2 Strength.', flat: { str: 2 }, max: 1 },
  { id: 'nimble', name: 'Nimble', rarity: 'common', desc: '+2 Agility.', flat: { agi: 2 }, max: 1 },
  { id: 'hardy', name: 'Hardy', rarity: 'common', desc: '+2 Fortitude.', flat: { fort: 2 }, max: 1 },
  { id: 'attuned', name: 'Attuned', rarity: 'common', desc: '+2 Mana.', flat: { mana: 2 }, max: 1 },
  { id: 'durable', name: 'Durable', rarity: 'common', desc: '+1 Health.', health: 1, max: 1 },
  { id: 'brawler', name: 'Brawler', rarity: 'common', desc: '+1 Strength, +1 Fortitude.', flat: { str: 1, fort: 1 }, max: 1 },
  { id: 'skirmisher', name: 'Skirmisher', rarity: 'common', desc: '+1 Strength, +1 Agility.', flat: { str: 1, agi: 1 }, max: 1 },
  { id: 'sentinel', name: 'Sentinel', rarity: 'common', desc: '+1 Fortitude, +1 Mana.', flat: { fort: 1, mana: 1 }, max: 1 },
  { id: 'scholar', name: 'Scholar', rarity: 'common', desc: '+1 Mana, +1 Agility.', flat: { mana: 1, agi: 1 }, max: 1 },
  { id: 'thick_skin', name: 'Thick Skin', rarity: 'common', desc: '+1 Fortitude, +1 Health.', flat: { fort: 1 }, health: 1, max: 1 },
  { id: 'iron_fist', name: 'Iron Fist', rarity: 'common', desc: 'Battle: +2 when using Strength against Fortitude.', cond: [{ use: 'str', vs: 'fort', flat: 2 }], max: 1 },
  { id: 'quick_feet', name: 'Quick Feet', rarity: 'common', desc: 'Battle: +2 when using Agility against Strength.', cond: [{ use: 'agi', vs: 'str', flat: 2 }], max: 1 },
  { id: 'stone_wall', name: 'Stone Wall', rarity: 'common', desc: 'Battle: +2 when using Fortitude against Mana.', cond: [{ use: 'fort', vs: 'mana', flat: 2 }], max: 1 },
  { id: 'mind_spark', name: 'Mind Spark', rarity: 'common', desc: 'Battle: +2 when using Mana against Agility.', cond: [{ use: 'mana', vs: 'agi', flat: 2 }], max: 1 },

  // ---- Uncommon (14): need modest base stats, stackable up to 2 ----
  { id: 'powerful', name: 'Powerful', rarity: 'uncommon', desc: '+10% Strength. Requires 10 base Strength.', req: { str: 10 }, pct: { str: 10 }, max: 1 },
  { id: 'swift', name: 'Swift', rarity: 'uncommon', desc: '+10% Agility. Requires 10 base Agility.', req: { agi: 10 }, pct: { agi: 10 }, max: 1 },
  { id: 'resilient', name: 'Resilient', rarity: 'uncommon', desc: '+10% Fortitude. Requires 10 base Fortitude.', req: { fort: 10 }, pct: { fort: 10 }, max: 1 },
  { id: 'insightful', name: 'Insightful', rarity: 'uncommon', desc: '+10% Mana. Requires 10 base Mana.', req: { mana: 10 }, pct: { mana: 10 }, max: 1 },
  { id: 'vitality', name: 'Vitality', rarity: 'uncommon', desc: '+2 Health.', health: 2, max: 1 },
  { id: 'duelist', name: 'Duelist', rarity: 'uncommon', desc: '+2 Strength, +2 Agility. Requires 8 base Strength and Agility.', req: { str: 8, agi: 8 }, flat: { str: 2, agi: 2 }, max: 1 },
  { id: 'bulwark', name: 'Bulwark', rarity: 'uncommon', desc: '+2 Fortitude, +1 Health. Requires 8 base Fortitude.', req: { fort: 8 }, flat: { fort: 2 }, health: 1, max: 1 },
  { id: 'spellblade', name: 'Spellblade', rarity: 'uncommon', desc: '+2 Strength, +2 Mana. Requires 8 base Strength and Mana.', req: { str: 8, mana: 8 }, flat: { str: 2, mana: 2 }, max: 1 },
  { id: 'windcaller', name: 'Windcaller', rarity: 'uncommon', desc: '+2 Agility, +2 Mana. Requires 8 base Agility and Mana.', req: { agi: 8, mana: 8 }, flat: { agi: 2, mana: 2 }, max: 1 },
  { id: 'balanced', name: 'Balanced', rarity: 'uncommon', desc: '+1 to every stat. Requires 7 base in every stat.', req: { str: 7, agi: 7, fort: 7, mana: 7 }, flat: { str: 1, agi: 1, fort: 1, mana: 1 }, max: 1 },
  { id: 'crusher', name: 'Crusher', rarity: 'uncommon', desc: 'Battle: +15% when using Strength against Fortitude.', cond: [{ use: 'str', vs: 'fort', pct: 15 }], max: 1 },
  { id: 'shadow_step', name: 'Shadow Step', rarity: 'uncommon', desc: 'Battle: +15% when using Agility against Strength.', cond: [{ use: 'agi', vs: 'str', pct: 15 }], max: 1 },
  { id: 'bastion', name: 'Bastion', rarity: 'uncommon', desc: 'Battle: +15% when using Fortitude against Mana.', cond: [{ use: 'fort', vs: 'mana', pct: 15 }], max: 1 },
  { id: 'hex', name: 'Hex', rarity: 'uncommon', desc: 'Battle: +15% when using Mana against Agility.', cond: [{ use: 'mana', vs: 'agi', pct: 15 }], max: 1 },

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

  // ---- Talent tree (10): each needs other talents first ----
  { id: 'iron_body', name: 'Iron Body', rarity: 'uncommon', desc: '+1 Fortitude, +2 Health. Requires 9 base Fortitude and the talent Thick Skin.', req: { fort: 9 }, needs: ['thick_skin'], flat: { fort: 1 }, health: 2, max: 1 },
  { id: 'war_cry', name: 'War Cry', rarity: 'rare', desc: '+15% Strength; Battle: +10% when using Strength against Fortitude. Requires 11 base Strength and the talent Brawler.', req: { str: 11 }, needs: ['brawler'], pct: { str: 15 }, cond: [{ use: 'str', vs: 'fort', pct: 10 }], max: 1 },
  { id: 'blade_dancer', name: 'Blade Dancer', rarity: 'rare', desc: '+15% Agility; Battle: +3 when using Agility against Strength. Requires 12 base Agility and the talent Skirmisher.', req: { agi: 12 }, needs: ['skirmisher'], pct: { agi: 15 }, cond: [{ use: 'agi', vs: 'str', flat: 3 }], max: 1 },
  { id: 'arcane_shield', name: 'Arcane Shield', rarity: 'rare', desc: '+10% Fortitude, +10% Mana, +1 Health. Requires 11 base Fortitude and Mana and the talent Sentinel.', req: { fort: 11, mana: 11 }, needs: ['sentinel'], pct: { fort: 10, mana: 10 }, health: 1, max: 1 },
  { id: 'sage_mind', name: 'Sage Mind', rarity: 'rare', desc: '+15% Mana, +1 Agility. Requires 12 base Mana and the talent Scholar.', req: { mana: 12 }, needs: ['scholar'], pct: { mana: 15 }, flat: { agi: 1 }, max: 1 },
  { id: 'vital_surge', name: 'Vital Surge', rarity: 'rare', desc: '+4 Health. Requires the talents Vitality and Durable.', needs: ['vitality', 'durable'], health: 4, max: 1 },
  { id: 'executioner', name: 'Executioner', rarity: 'epic', desc: '+20% Strength; Battle: +20% when using Strength against Fortitude. Requires 14 base Strength and the talents War Cry and Crusher.', req: { str: 14 }, needs: ['war_cry', 'crusher'], pct: { str: 20 }, cond: [{ use: 'str', vs: 'fort', pct: 20 }], max: 1 },
  { id: 'ghost_walker', name: 'Ghost Walker', rarity: 'epic', desc: '+20% Agility; Battle: +20% when using Agility against Strength. Requires 14 base Agility and the talents Blade Dancer and Shadow Step.', req: { agi: 14 }, needs: ['blade_dancer', 'shadow_step'], pct: { agi: 20 }, cond: [{ use: 'agi', vs: 'str', pct: 20 }], max: 1 },
  { id: 'eternal_bulwark', name: 'Eternal Bulwark', rarity: 'epic', desc: '+20% Fortitude, +3 Health; Battle: +20% when using Fortitude against Mana. Requires 14 base Fortitude and the talents Iron Body and Bastion.', req: { fort: 14 }, needs: ['iron_body', 'bastion'], pct: { fort: 20 }, health: 3, cond: [{ use: 'fort', vs: 'mana', pct: 20 }], max: 1 },
  { id: 'spell_sovereign', name: 'Spell Sovereign', rarity: 'legendary', desc: '+30% Mana, +1 Health; Battle: +25% when using Mana against Agility. Requires 15 base Mana and the talents Sage Mind and Hex.', req: { mana: 15 }, needs: ['sage_mind', 'hex'], pct: { mana: 30 }, health: 1, cond: [{ use: 'mana', vs: 'agi', pct: 25 }], max: 1 },

  // ---- 45 more talents (total 100): small talents, then branches that need earlier talents ----
  // Common
  { id: 'sturdy', name: 'Sturdy', rarity: 'common', desc: '+1 Strength, +1 Health.', flat: { str: 1 }, health: 1, max: 1 },
  { id: 'evasive', name: 'Evasive', rarity: 'common', desc: '+1 Agility, +1 Fortitude.', flat: { agi: 1, fort: 1 }, max: 1 },
  { id: 'focused', name: 'Focused', rarity: 'common', desc: '+1 Mana, +1 Health.', flat: { mana: 1 }, health: 1, max: 1 },
  { id: 'sharp_edge', name: 'Sharp Edge', rarity: 'common', desc: 'Battle: +1 when using Strength.', cond: [{ use: 'str', flat: 1 }], max: 1 },
  { id: 'light_step', name: 'Light Step', rarity: 'common', desc: 'Battle: +1 when using Agility.', cond: [{ use: 'agi', flat: 1 }], max: 1 },
  { id: 'guard_up', name: 'Guard Up', rarity: 'common', desc: 'Battle: +1 when using Fortitude.', cond: [{ use: 'fort', flat: 1 }], max: 1 },
  { id: 'deep_focus', name: 'Deep Focus', rarity: 'common', desc: 'Battle: +1 when using Mana.', cond: [{ use: 'mana', flat: 1 }], max: 1 },
  { id: 'muscle_memory', name: 'Muscle Memory', rarity: 'common', desc: '+5% Strength.', pct: { str: 5 }, max: 1 },
  // Uncommon
  { id: 'heavy_hitter', name: 'Heavy Hitter', rarity: 'uncommon', desc: '+3 Strength. Requires 8 base Strength and the talent Strong.', req: { str: 8 }, needs: ['strong'], flat: { str: 3 }, max: 1 },
  { id: 'fleet_foot', name: 'Fleet Foot', rarity: 'uncommon', desc: '+3 Agility. Requires 8 base Agility and the talent Nimble.', req: { agi: 8 }, needs: ['nimble'], flat: { agi: 3 }, max: 1 },
  { id: 'stout', name: 'Stout', rarity: 'uncommon', desc: '+3 Fortitude. Requires 8 base Fortitude and the talent Hardy.', req: { fort: 8 }, needs: ['hardy'], flat: { fort: 3 }, max: 1 },
  { id: 'arcane_focus', name: 'Arcane Focus', rarity: 'uncommon', desc: '+3 Mana. Requires 8 base Mana and the talent Attuned.', req: { mana: 8 }, needs: ['attuned'], flat: { mana: 3 }, max: 1 },
  { id: 'second_wind', name: 'Second Wind', rarity: 'uncommon', desc: '+3 Health. Requires 8 base Fortitude and the talent Durable.', req: { fort: 8 }, needs: ['durable'], health: 3, max: 1 },
  { id: 'keen_eye', name: 'Keen Eye', rarity: 'uncommon', desc: '+1 Agility; Battle: +10% when using Agility against Strength. Requires the talent Quick Feet.', needs: ['quick_feet'], flat: { agi: 1 }, cond: [{ use: 'agi', vs: 'str', pct: 10 }], max: 1 },
  { id: 'fists_of_stone', name: 'Fists of Stone', rarity: 'uncommon', desc: '+1 Strength; Battle: +10% when using Strength against Fortitude. Requires the talent Iron Fist.', needs: ['iron_fist'], flat: { str: 1 }, cond: [{ use: 'str', vs: 'fort', pct: 10 }], max: 1 },
  { id: 'ward_mind', name: 'Ward Mind', rarity: 'uncommon', desc: '+1 Fortitude; Battle: +10% when using Fortitude against Mana. Requires the talent Stone Wall.', needs: ['stone_wall'], flat: { fort: 1 }, cond: [{ use: 'fort', vs: 'mana', pct: 10 }], max: 1 },
  { id: 'spell_echo', name: 'Spell Echo', rarity: 'uncommon', desc: '+1 Mana; Battle: +10% when using Mana against Agility. Requires the talent Mind Spark.', needs: ['mind_spark'], flat: { mana: 1 }, cond: [{ use: 'mana', vs: 'agi', pct: 10 }], max: 1 },
  { id: 'endurer', name: 'Endurer', rarity: 'uncommon', desc: '+5% Fortitude, +2 Health. Requires 9 base Fortitude.', req: { fort: 9 }, pct: { fort: 5 }, health: 2, max: 1 },
  { id: 'hunters_focus', name: 'Hunter\'s Focus', rarity: 'uncommon', desc: '+8% Strength, +8% Agility. Requires 9 base Strength and Agility.', req: { str: 9, agi: 9 }, pct: { str: 8, agi: 8 }, max: 1 },
  { id: 'mystic_guard', name: 'Mystic Guard', rarity: 'uncommon', desc: '+8% Fortitude, +8% Mana. Requires 9 base Fortitude and Mana.', req: { fort: 9, mana: 9 }, pct: { fort: 8, mana: 8 }, max: 1 },
  // Rare
  { id: 'colossal_strength', name: 'Colossal Strength', rarity: 'rare', desc: '+15% Strength, +1 Health. Requires 12 base Strength and the talent Heavy Hitter.', req: { str: 12 }, needs: ['heavy_hitter'], pct: { str: 15 }, health: 1, max: 1 },
  { id: 'lightning_reflex', name: 'Lightning Reflex', rarity: 'rare', desc: '+15% Agility; Battle: +2 when using Agility against Strength. Requires 12 base Agility and the talent Fleet Foot.', req: { agi: 12 }, needs: ['fleet_foot'], pct: { agi: 15 }, cond: [{ use: 'agi', vs: 'str', flat: 2 }], max: 1 },
  { id: 'unshakable', name: 'Unshakable', rarity: 'rare', desc: '+15% Fortitude, +1 Health. Requires 12 base Fortitude and the talent Stout.', req: { fort: 12 }, needs: ['stout'], pct: { fort: 15 }, health: 1, max: 1 },
  { id: 'mana_well', name: 'Mana Well', rarity: 'rare', desc: '+1 Mana, +15% Mana. Requires 12 base Mana and the talent Arcane Focus.', req: { mana: 12 }, needs: ['arcane_focus'], flat: { mana: 1 }, pct: { mana: 15 }, max: 1 },
  { id: 'brutal_force', name: 'Brutal Force', rarity: 'rare', desc: '+10% Strength; Battle: +15% when using Strength against Fortitude. Requires 12 base Strength and the talent Fists of Stone.', req: { str: 12 }, needs: ['fists_of_stone'], pct: { str: 10 }, cond: [{ use: 'str', vs: 'fort', pct: 15 }], max: 1 },
  { id: 'phase_shift', name: 'Phase Shift', rarity: 'rare', desc: '+10% Agility; Battle: +15% when using Agility against Strength. Requires 12 base Agility and the talent Keen Eye.', req: { agi: 12 }, needs: ['keen_eye'], pct: { agi: 10 }, cond: [{ use: 'agi', vs: 'str', pct: 15 }], max: 1 },
  { id: 'aegis', name: 'Aegis', rarity: 'rare', desc: '+10% Fortitude; Battle: +15% when using Fortitude against Mana. Requires 12 base Fortitude and the talent Ward Mind.', req: { fort: 12 }, needs: ['ward_mind'], pct: { fort: 10 }, cond: [{ use: 'fort', vs: 'mana', pct: 15 }], max: 1 },
  { id: 'spellweave', name: 'Spellweave', rarity: 'rare', desc: '+10% Mana; Battle: +15% when using Mana against Agility. Requires 12 base Mana and the talent Spell Echo.', req: { mana: 12 }, needs: ['spell_echo'], pct: { mana: 10 }, cond: [{ use: 'mana', vs: 'agi', pct: 15 }], max: 1 },
  { id: 'second_life', name: 'Second Life', rarity: 'rare', desc: '+4 Health. Requires 11 base Fortitude and the talent Second Wind.', req: { fort: 11 }, needs: ['second_wind'], health: 4, max: 1 },
  { id: 'balanced_mastery', name: 'Balanced Mastery', rarity: 'rare', desc: '+8% to every stat. Requires 11 base in every stat and the talents Hunter\'s Focus and Mystic Guard.', req: { str: 11, agi: 11, fort: 11, mana: 11 }, needs: ['hunters_focus', 'mystic_guard'], pct: { str: 8, agi: 8, fort: 8, mana: 8 }, max: 1 },
  { id: 'bloodlust', name: 'Bloodlust', rarity: 'rare', desc: '+12% Strength; Battle: +5% when using Strength. Requires 12 base Strength and 10 base Agility.', req: { str: 12, agi: 10 }, pct: { str: 12 }, cond: [{ use: 'str', pct: 5 }], max: 1 },
  { id: 'ironclad_will', name: 'Ironclad Will', rarity: 'rare', desc: '+2 Mana, +12% Fortitude. Requires 12 base Fortitude and 10 base Mana.', req: { fort: 12, mana: 10 }, flat: { mana: 2 }, pct: { fort: 12 }, max: 1 },
  { id: 'tempest_step', name: 'Tempest Step', rarity: 'rare', desc: '+3 Agility, +1 Health. Requires 13 base Agility.', req: { agi: 13 }, flat: { agi: 3 }, health: 1, max: 1 },
  // Epic
  { id: 'titan_form', name: 'Titan Form', rarity: 'epic', desc: '+25% Strength, +2 Health. Requires 15 base Strength and the talents Colossal Strength and Brutal Force.', req: { str: 15 }, needs: ['colossal_strength', 'brutal_force'], pct: { str: 25 }, health: 2, max: 1 },
  { id: 'stormlord', name: 'Stormlord', rarity: 'epic', desc: '+25% Agility; Battle: +15% when using Agility against Strength. Requires 15 base Agility and the talents Lightning Reflex and Phase Shift.', req: { agi: 15 }, needs: ['lightning_reflex', 'phase_shift'], pct: { agi: 25 }, cond: [{ use: 'agi', vs: 'str', pct: 15 }], max: 1 },
  { id: 'immortal_guard', name: 'Immortal Guard', rarity: 'epic', desc: '+25% Fortitude, +3 Health. Requires 15 base Fortitude and the talents Unshakable and Aegis.', req: { fort: 15 }, needs: ['unshakable', 'aegis'], pct: { fort: 25 }, health: 3, max: 1 },
  { id: 'archmage_supreme', name: 'Archmage Supreme', rarity: 'epic', desc: '+25% Mana; Battle: +15% when using Mana against Agility. Requires 15 base Mana and the talents Mana Well and Spellweave.', req: { mana: 15 }, needs: ['mana_well', 'spellweave'], pct: { mana: 25 }, cond: [{ use: 'mana', vs: 'agi', pct: 15 }], max: 1 },
  { id: 'perfect_balance', name: 'Perfect Balance', rarity: 'epic', desc: '+12% to every stat, +2 Health. Requires 13 base in every stat and the talent Balanced Mastery.', req: { str: 13, agi: 13, fort: 13, mana: 13 }, needs: ['balanced_mastery'], pct: { str: 12, agi: 12, fort: 12, mana: 12 }, health: 2, max: 1 },
  { id: 'lifeline', name: 'Lifeline', rarity: 'epic', desc: '+3 Health. Requires 13 base Fortitude and the talents Second Life and Vital Surge.', req: { fort: 13 }, needs: ['second_life', 'vital_surge'], health: 3, max: 1 },
  { id: 'blitz', name: 'Blitz', rarity: 'epic', desc: '+15% Strength, +15% Agility. Requires 13 base Strength and Agility and the talents Bloodlust and Tempest Step.', req: { str: 13, agi: 13 }, needs: ['bloodlust', 'tempest_step'], pct: { str: 15, agi: 15 }, max: 1 },
  { id: 'fortified_mind', name: 'Fortified Mind', rarity: 'epic', desc: '+15% Fortitude, +15% Mana, +1 Health. Requires 13 base Fortitude and Mana and the talents Ironclad Will and Arcane Shield.', req: { fort: 13, mana: 13 }, needs: ['ironclad_will', 'arcane_shield'], pct: { fort: 15, mana: 15 }, health: 1, max: 1 },
  // Legendary
  { id: 'world_breaker', name: 'World Breaker', rarity: 'legendary', desc: '+35% Strength; Battle: +30% when using Strength against Fortitude. Requires 16 base Strength and the talents Titan Form and Executioner.', req: { str: 16 }, needs: ['titan_form', 'executioner'], pct: { str: 35 }, cond: [{ use: 'str', vs: 'fort', pct: 30 }], max: 1 },
  { id: 'shadow_monarch', name: 'Shadow Monarch', rarity: 'legendary', desc: '+35% Agility; Battle: +30% when using Agility against Strength. Requires 16 base Agility and the talents Stormlord and Ghost Walker.', req: { agi: 16 }, needs: ['stormlord', 'ghost_walker'], pct: { agi: 35 }, cond: [{ use: 'agi', vs: 'str', pct: 30 }], max: 1 },
  { id: 'eternal_fortress', name: 'Eternal Fortress', rarity: 'legendary', desc: '+35% Fortitude, +5 Health; Battle: +30% when using Fortitude against Mana. Requires 16 base Fortitude and the talents Immortal Guard and Eternal Bulwark.', req: { fort: 16 }, needs: ['immortal_guard', 'eternal_bulwark'], pct: { fort: 35 }, health: 5, cond: [{ use: 'fort', vs: 'mana', pct: 30 }], max: 1 },
  { id: 'arise', name: 'Arise', rarity: 'legendary', desc: '+25% to every stat, +3 Health. Requires 15 base in every stat and the talents Perfect Balance and Monarch Blood.', req: { str: 15, agi: 15, fort: 15, mana: 15 }, needs: ['perfect_balance', 'monarch_blood'], pct: { str: 25, agi: 25, fort: 25, mana: 25 }, health: 3, max: 1 },
];

export const TALENT_BY_ID: Record<string, Talent> = Object.fromEntries(TALENTS.map((t) => [t.id, t]));
