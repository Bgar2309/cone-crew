// systems/traffic/traffic.ts — SQUELETTE. Spawn + déplacement des véhicules.
import type { GameState } from '../../core/types';
import type { WaveDef } from '../../data/levels/types';

export function stepTraffic(_state: GameState, _wave: WaveDef, _dt: number): void {
  // TODO: n'agir que si phase==='rush'. Accumuler un timer de spawn ; tous les wave.spawnInterval s,
  //       créer un Vehicle sur une lane (pos de départ hors écran selon lane.dirSign), speed=wave.speed,
  //       id = state.nextId++. Avancer chaque véhicule le long de son axe (pos += speed*dirSign*dt).
  //       Retirer les véhicules sortis de [−2, gridW+2] / [−2, gridH+2].
  throw new Error('stepTraffic not implemented');
}
