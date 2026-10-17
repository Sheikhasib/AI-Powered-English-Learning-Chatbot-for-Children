import type { Rng } from "@/types/domain";

/** Mulberry32: a tiny seeded generator, so the same seed always gives the same sequence. */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates shuffle that returns a new array and leaves the input untouched. */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Picks one element uniformly; the list must not be empty. */
export function pickOne<T>(items: readonly T[], rng: Rng): T {
  if (items.length === 0) throw new Error("pickOne needs a non-empty list");
  return items[Math.floor(rng() * items.length)];
}
