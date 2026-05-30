// systems/waves/waves.ts — machine à états de la manche.
import type { GameState } from '../../core/types';
import type { LevelDef } from '../../data/levels/types';

/**
 * Fait avancer le rythme de la manche d'un pas `dt` (secondes).
 * Ne mute que `state.phase`, `state.timeLeft` et `state.waveTime`.
 * - 'placing' : décompte de la fenêtre de pose ; à 0, bascule en 'rush'.
 * - 'rush'    : décompte de la vague ; 'lost' si plus de vie, sinon à l'échéance
 *               'won' si toutes les marks sont satisfaites, 'lost' sinon.
 * - 'won'/'lost' : terminal, no-op (la scène gère overlay + restart).
 */
export function stepWaves(state: GameState, level: LevelDef, dt: number): void {
  switch (state.phase) {
    case 'placing': {
      state.timeLeft -= dt;
      if (state.timeLeft <= 0) {
        state.phase = 'rush';
        state.timeLeft = level.wave.duration;
        state.waveTime = 0;
      }
      break;
    }
    case 'rush': {
      state.waveTime += dt;
      state.timeLeft -= dt;
      if (state.worker.lives <= 0) {
        state.phase = 'lost';
      } else if (state.timeLeft <= 0) {
        const allSatisfied = state.marks.every((m) => m.satisfied);
        state.phase = allSatisfied ? 'won' : 'lost';
      }
      break;
    }
    case 'won':
    case 'lost':
      // Terminal : rien à faire.
      break;
  }
}
