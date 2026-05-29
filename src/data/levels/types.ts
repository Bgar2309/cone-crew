// data/levels/types.ts — schéma de définition d'un niveau (données pures).
import type { Lane, Vec2 } from '../../core/types';

export interface WaveDef {
  spawnInterval: number; // s entre deux véhicules
  speed: number;         // cases/s
  duration: number;      // durée de la phase rush (s)
}

export interface LevelDef {
  id: number;
  name: string;
  gridW: number;
  gridH: number;
  lanes: Lane[];
  marks: Vec2[];         // positions à baliser
  workerStart: Vec2;
  conesAvailable: number;
  placingTime: number;   // durée de la fenêtre de pose tranquille (s)
  wave: WaveDef;
  lives: number;
}
