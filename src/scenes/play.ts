// scenes/play.ts — SQUELETTE. Orchestre un tick complet puis le rendu.
import type { LevelDef } from '../data/levels/types';

export function createPlayScene(_canvas: HTMLCanvasElement, _level: LevelDef): {
  update(dt: number): void;
  render(alpha: number): void;
} {
  // TODO:
  //  - construire le GameState initial à partir du LevelDef (worker à workerStart, marks, lanes,
  //    conesLeft=conesAvailable, lives, phase='placing', timeLeft=placingTime, rng=makeRNG(seed)).
  //  - instancier createInput() et createRenderer(canvas).
  //  - update(dt) dans CET ORDRE FIGÉ :
  //      1. intent = input.read()
  //      2. stepWaves(state, level, dt)
  //      3. tryPlaceCone(state, intent)
  //      4. stepMovement(state, intent, dt)
  //      5. stepTraffic(state, level.wave, dt)
  //      6. stepCollision(state, dt)
  //      7. stepCones(state, dt)
  //     Si phase 'won'/'lost' : geler la logique, attendre une touche (R) pour réinitialiser.
  //  - render(alpha) : renderer.draw(state, alpha) + overlay win/lose si besoin.
  throw new Error('createPlayScene not implemented');
}
