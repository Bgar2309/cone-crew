// core/types.ts — vocabulaire commun du projet. NE PAS modifier sans INTERFACE_CHANGE_REQUEST.

export type Vec2 = { x: number; y: number };          // coords monde (cases, float)
export type Dir = 'N' | 'E' | 'S' | 'W';
export type Phase = 'placing' | 'rush' | 'won' | 'lost';

export interface Worker {
  pos: Vec2;
  dir: Dir;
  moving: boolean;
  placing: number;   // secondes restantes d'animation de pose (0 = libre)
  lives: number;
  invuln: number;    // i-frames en secondes après un choc
}

export interface Vehicle {
  id: number;
  pos: Vec2;
  laneId: number;
  speed: number;     // cases/seconde
  kind: 'car';
  width: number;
  length: number;
}

export interface Cone {
  id: number;
  pos: Vec2;
  vel: Vec2;         // != 0 quand renversé (culbute fake-physics)
  toppled: boolean;
  markId: number | null; // marque satisfaite, ou null si délogé
}

export interface Mark {
  id: number;
  pos: Vec2;         // case cible (coords entières)
  satisfied: boolean;
}

export interface Lane {
  id: number;
  axis: 'x' | 'y';
  offset: number;    // position fixe sur l'autre axe
  dirSign: 1 | -1;
}

export interface GameState {
  worker: Worker;
  vehicles: Vehicle[];
  cones: Cone[];
  marks: Mark[];
  lanes: Lane[];
  phase: Phase;
  timeLeft: number;
  waveTime: number;
  score: number;
  conesLeft: number; // cônes restant à poser
  nextId: number;    // compteur d'id pour vehicles/cones
  rng: RNG;
}

export interface RNG {
  next(): number;        // [0,1)
  int(maxExcl: number): number;
}
