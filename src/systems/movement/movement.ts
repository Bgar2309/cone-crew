// systems/movement/movement.ts — SQUELETTE. Applique l'intention de déplacement à l'ouvrier.
import type { GameState } from '../../core/types';
import type { Intent } from '../input/input';

export function stepMovement(_state: GameState, _intent: Intent, _dt: number): void {
  // TODO: si worker.placing > 0 -> immobilisé (decrémenter placing, moving=false), sortir.
  //       sinon: normaliser intent.move, pos += move * WORKER_SPEED * dt, clamp à la grille,
  //       mettre à jour worker.dir (selon dominante du mouvement) et worker.moving.
  throw new Error('stepMovement not implemented');
}
