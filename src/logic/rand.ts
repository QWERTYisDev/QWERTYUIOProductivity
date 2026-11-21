export type Rnd = () => number;
export const randInt = (min: number, max: number, rnd: Rnd = Math.random) => min + Math.floor(rnd() * (max - min + 1));
export const uid = (rnd: Rnd = Math.random) => Date.now().toString(36) + Math.floor(rnd() * 1e9).toString(36);

/** Index chosen with probability proportional to weights. */
export function pickWeighted(weights: number[], rnd: Rnd = Math.random): number {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rnd() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r < 0) return i;
  }
  return weights.length - 1;
}

export function shuffle<T>(arr: T[], rnd: Rnd = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
