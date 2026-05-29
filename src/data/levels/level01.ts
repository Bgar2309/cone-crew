// data/levels/level01.ts — PROTOTYPE. Grille 8x8, une lane horizontale, 4 marques.
import type { LevelDef } from './types';

export const LEVEL_01: LevelDef = {
  id: 1,
  name: 'Premier balisage',
  gridW: 8,
  gridH: 8,
  // Une lane sur l'axe x, à la rangée y=3, véhicules roulant vers les x croissants.
  lanes: [{ id: 0, axis: 'x', offset: 3, dirSign: 1 }],
  // 4 marques le long du bord de la lane (à ajuster au playtest).
  marks: [
    { x: 1, y: 4 },
    { x: 3, y: 4 },
    { x: 5, y: 4 },
    { x: 6, y: 4 },
  ],
  workerStart: { x: 0, y: 6 },
  conesAvailable: 6,
  placingTime: 6,
  wave: { spawnInterval: 1.6, speed: 4, duration: 18 },
  lives: 3,
};
