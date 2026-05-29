// systems/movement/movement.ts — Applique l'intention de déplacement à l'ouvrier.
// Ne mute QUE state.worker. Ne gère pas les collisions véhicules.
import type { GameState } from '../../core/types';
import type { Intent } from '../input/input';
import { WORKER_SPEED } from '../../core/constants';

// Bornes de la grille. gridW/gridH ne sont PAS dans GameState (voir
// INTERFACE_CHANGE_REQUEST.md) : en attendant, on clampe sur la grille du
// proto, qui est 8x8 -> indices valides [0, 7] sur les deux axes.
const GRID_MAX_INDEX = 7;

export function stepMovement(state: GameState, intent: Intent, dt: number): void {
  const worker = state.worker;

  // 1) Pose en cours : l'ouvrier est figé. On décrémente le timer et on sort.
  if (worker.placing > 0) {
    worker.placing = Math.max(0, worker.placing - dt);
    worker.moving = false;
    return;
  }

  let { x, y } = intent.move;

  // 2) Normalisation : une diagonale ne doit pas être plus rapide qu'un
  // déplacement cardinal. On ramène le vecteur d'entrée à une norme <= 1.
  const len = Math.hypot(x, y);
  if (len > 0) {
    x /= len;
    y /= len;
  }

  const moving = len > 0;
  worker.moving = moving;

  if (moving) {
    worker.pos.x += x * WORKER_SPEED * dt;
    worker.pos.y += y * WORKER_SPEED * dt;

    // 4) Direction selon la composante dominante du mouvement.
    // Convention d'input (cf. systems/input) : +x=E, -x=W, +y=S, -y=N.
    // Égalité (diagonale parfaite) : on privilégie l'horizontale (E/W).
    if (Math.abs(x) >= Math.abs(y)) {
      worker.dir = x > 0 ? 'E' : 'W';
    } else {
      worker.dir = y > 0 ? 'S' : 'N';
    }
  }

  // 3) Clamp aux bornes de la grille [0, GRID_MAX_INDEX] sur les deux axes.
  worker.pos.x = clamp(worker.pos.x, 0, GRID_MAX_INDEX);
  worker.pos.y = clamp(worker.pos.y, 0, GRID_MAX_INDEX);
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
