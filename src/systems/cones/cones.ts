// systems/cones/cones.ts — SQUELETTE. Pose des cônes + culbute fake-physics + statut des marques.
import type { GameState } from '../../core/types';
import type { Intent } from '../input/input';

/** Démarre une pose si possible (cônes restants, ouvrier libre, case devant valide). */
export function tryPlaceCone(_state: GameState, _intent: Intent): void {
  // TODO: si intent.place && worker.placing===0 && conesLeft>0 :
  //       worker.placing = PLACE_TIME ; à la fin de la pose (géré ici via flag ou dans stepCones),
  //       créer un Cone à la case devant l'ouvrier (selon worker.dir), conesLeft--.
  //       NB: décider d'un mécanisme simple : armer la pose ici, matérialiser le cône quand placing atteint 0.
  throw new Error('tryPlaceCone not implemented');
}

/** Intègre le mouvement des cônes renversés (friction) et recalcule marks.satisfied. */
export function stepCones(_state: GameState, _dt: number): void {
  // TODO: pour chaque cône toppled avec vel!=0 : pos += vel*dt ; vel -= normalize(vel)*CONE_FRICTION*dt ;
  //       si |vel| ~ 0 -> stop. Un cône qui quitte sa case de marque -> markId=null.
  //       Recalcul: pour chaque Mark, satisfied = il existe un cône NON toppled sur sa case.
  //       Si la pose vient de se terminer (placing repassé à 0), matérialiser le cône en attente.
  throw new Error('stepCones not implemented');
}
