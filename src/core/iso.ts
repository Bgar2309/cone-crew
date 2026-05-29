// core/iso.ts — conversions monde <-> écran et profondeur de tri.
import type { Vec2 } from './types';

/** Projette une coord monde (cases) en pixels écran, losange iso. */
export function worldToScreen(p: Vec2, origin: Vec2, tile: { w: number; h: number }): Vec2 {
  return {
    x: origin.x + (p.x - p.y) * (tile.w / 2),
    y: origin.y + (p.x + p.y) * (tile.h / 2),
  };
}

/** Ordre de dessin : plus la somme est grande, plus c'est "devant". */
export function depth(p: Vec2): number {
  return p.x + p.y;
}
