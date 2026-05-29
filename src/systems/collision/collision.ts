// systems/collision/collision.ts — SQUELETTE. Seul résolveur de chocs.
import type { GameState } from '../../core/types';

export function stepCollision(_state: GameState, _dt: number): void {
  // TODO: décrémenter worker.invuln.
  //       Véhicule vs ouvrier : si chevauchement (AABB en coords monde) et invuln<=0 ->
  //         worker.lives-- ; worker.invuln = INVULN_TIME.
  //       Véhicule vs cône (non toppled) : si chevauchement -> cone.toppled=true,
  //         cone.vel = direction du véhicule * CONE_TOPPLE_IMPULSE, cone.markId=null.
  //       NE déplace PAS les entités (le mouvement du cône est intégré par stepCones au tick suivant).
  throw new Error('stepCollision not implemented');
}
