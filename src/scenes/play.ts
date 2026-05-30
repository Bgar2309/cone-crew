// scenes/play.ts — orchestre un tick complet puis le rendu.
// Construit le GameState initial depuis le LevelDef, appelle les systèmes dans
// l'ORDRE FIGÉ (voir ARCHITECTURE.md « Ordre d'update canonique ») puis dessine.
import { makeRNG } from '../core';
import type { GameState } from '../core/types';
import type { LevelDef } from '../data/levels/types';

import { createInput } from '../systems/input/input';
import { stepWaves } from '../systems/waves/waves';
import { tryPlaceCone, stepCones } from '../systems/cones/cones';
import { stepMovement } from '../systems/movement/movement';
import { stepTraffic } from '../systems/traffic/traffic';
import { stepCollision } from '../systems/collision/collision';
import { createRenderer } from '../render/render';

// Seed RNG fixe : vagues déterministes (utile au debug / playtest reproductible).
const RNG_SEED = 12345;

/**
 * Construit un GameState neuf à partir du LevelDef.
 * Toutes les structures issues du level (worker pos, marks, lanes) sont COPIÉES
 * pour ne jamais muter la donnée du niveau (le restart doit repartir propre).
 */
function buildInitialState(level: LevelDef): GameState {
  return {
    worker: {
      pos: { x: level.workerStart.x, y: level.workerStart.y },
      dir: 'S',
      moving: false,
      placing: 0,
      lives: level.lives,
      invuln: 0,
    },
    vehicles: [],
    cones: [],
    marks: level.marks.map((m, i) => ({
      id: i,
      pos: { x: m.x, y: m.y },
      satisfied: false,
    })),
    lanes: level.lanes.map((l) => ({ ...l })),
    phase: 'placing',
    timeLeft: level.placingTime,
    waveTime: 0,
    score: 0,
    conesLeft: level.conesAvailable,
    nextId: 1,
    rng: makeRNG(RNG_SEED),
  };
}

export function createPlayScene(canvas: HTMLCanvasElement, level: LevelDef): {
  update(dt: number): void;
  render(alpha: number): void;
} {
  let state = buildInitialState(level);

  const input = createInput();
  const renderer = createRenderer(canvas);
  renderer.resize();

  // Restart : l'Intent ne porte pas la touche R, on l'écoute donc via un petit
  // listener local. Latch consommé dans update() pour ne déclencher qu'une fois.
  let restartLatch = false;
  const onKey = (e: KeyboardEvent): void => {
    if (e.code === 'KeyR') restartLatch = true;
  };
  window.addEventListener('keydown', onKey);

  return {
    update(dt: number): void {
      // En fin de manche, la logique est gelée ; seul R relance.
      if (state.phase === 'won' || state.phase === 'lost') {
        if (restartLatch) {
          restartLatch = false;
          state = buildInitialState(level);
        }
        // On vide quand même l'intent pour ne pas accumuler le latch de pose.
        input.read();
        return;
      }
      restartLatch = false;

      // ORDRE FIGÉ — ne pas réordonner (critique pour la culbute des cônes).
      const intent = input.read();
      stepWaves(state, level, dt);
      tryPlaceCone(state, intent);
      stepMovement(state, intent, dt);
      stepTraffic(state, level.wave, dt);
      stepCollision(state, dt);
      stepCones(state, dt);
    },

    render(alpha: number): void {
      renderer.draw(state, alpha);
    },
  };
}
