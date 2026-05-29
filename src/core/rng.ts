// core/rng.ts — RNG déterministe seedé (mulberry32).
import type { RNG } from './types';

export function makeRNG(seed: number): RNG {
  let s = seed >>> 0;
  const next = (): number => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return { next, int: (maxExcl: number) => Math.floor(next() * maxExcl) };
}
