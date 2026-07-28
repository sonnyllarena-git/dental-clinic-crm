/**
 * Deterministic PRNG. Every generator in src/data/seed/generators pulls
 * randomness only from a SeededRandom instance built here — never from
 * Math.random() — so the same seed string produces byte-identical output
 * on every machine and every run. See referenceDate.ts for the matching
 * rule about dates.
 */

export interface SeededRandom {
  /** Next float in [0, 1). */
  next(): number;
  /** Integer in [min, max) — max is exclusive. */
  int(min: number, max: number): number;
  /** Float in [min, max). */
  float(min: number, max: number): number;
  pick<T>(arr: readonly T[]): T;
  /** Pick `count` distinct elements, order not guaranteed. */
  pickMany<T>(arr: readonly T[], count: number): T[];
  shuffle<T>(arr: readonly T[]): T[];
  bool(trueProbability?: number): boolean;
  /** Deterministic UUID-v4-shaped id, optionally namespaced with a prefix. */
  id(prefix?: string): string;
}

/** xmur3: hashes an arbitrary string into a 32-bit seed for mulberry32. */
function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i += 1) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

/** mulberry32: small, fast, good-enough-for-fixtures PRNG. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const HEX_CHARS = '0123456789abcdef';

export function createSeededRandom(seedString: string): SeededRandom {
  const seedFn = xmur3(seedString);
  const next = mulberry32(seedFn());

  const int = (min: number, max: number): number => Math.floor(next() * (max - min)) + min;

  const float = (min: number, max: number): number => next() * (max - min) + min;

  const pick = <T,>(arr: readonly T[]): T => {
    if (arr.length === 0) throw new Error('Cannot pick from an empty array');
    return arr[int(0, arr.length)];
  };

  const shuffle = <T,>(arr: readonly T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = int(0, i + 1);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const pickMany = <T,>(arr: readonly T[], count: number): T[] => shuffle(arr).slice(0, count);

  const bool = (trueProbability = 0.5): boolean => next() < trueProbability;

  const id = (prefix?: string): string => {
    const section = (len: number) =>
      Array.from({ length: len }, () => HEX_CHARS[int(0, 16)]).join('');
    const uuid = [
      section(8),
      section(4),
      `4${section(3)}`,
      `${HEX_CHARS[int(8, 12)]}${section(3)}`,
      section(12),
    ].join('-');
    return prefix ? `${prefix}_${uuid}` : uuid;
  };

  return { next, int, float, pick, pickMany, shuffle, bool, id };
}

/** Fixed across every environment — this is what makes the dataset deterministic. */
export const SEED = 'DENTAL_CRM_SEED_V1';
