/**
 * Seeded RNG (seedrandom) — every poster is reproducible from its seed, so any
 * composition can be re-generated and re-exported (PLAN.md §2). All randomness
 * in the generator flows through one of these; nothing calls Math.random.
 */
import seedrandom from "seedrandom";

export interface Rng {
  readonly seed: string;
  /** Float in [0, 1). */
  next(): number;
  /** Float in [min, max). */
  float(min: number, max: number): number;
  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number;
  /** True with probability p (default 0.5). */
  bool(p?: number): boolean;
  /** Uniform pick from a non-empty array. */
  pick<T>(arr: readonly T[]): T;
  /** Weighted pick. */
  weighted<T>(items: readonly { value: T; weight: number }[]): T;
  /** Fisher–Yates shuffle (returns a new array). */
  shuffle<T>(arr: readonly T[]): T[];
}

export function makeRng(seed: string): Rng {
  const prng = seedrandom(seed);
  const next = () => prng();
  const float = (min: number, max: number) => min + next() * (max - min);
  const rng: Rng = {
    seed,
    next,
    float,
    int: (min, max) => Math.floor(float(min, max + 1)),
    bool: (p = 0.5) => next() < p,
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    weighted: (items) => {
      const total = items.reduce((s, i) => s + i.weight, 0);
      let t = next() * total;
      for (const it of items) {
        t -= it.weight;
        if (t < 0) return it.value;
      }
      return items[items.length - 1].value;
    },
    shuffle: (arr) => {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
  };
  return rng;
}

const SEED_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** A short human-readable seed, e.g. "K7Q-M2P9". Uses Math.random (UI action). */
export function randomSeed(): string {
  const pick = () => SEED_ALPHABET[Math.floor(Math.random() * SEED_ALPHABET.length)];
  const block = (n: number) =>
    Array.from({ length: n }, pick).join("");
  return `${block(3)}-${block(4)}`;
}
