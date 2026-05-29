// systems/waves/waves.ts — SQUELETTE. Machine à états de la manche.
import type { GameState } from '../../core/types';
import type { LevelDef } from '../../data/levels/types';

export function stepWaves(_state: GameState, _level: LevelDef, _dt: number): void {
  // TODO: phase 'placing' : décrémenter timeLeft ; à 0 -> phase='rush', timeLeft=level.wave.duration, waveTime=0.
  //       phase 'rush' : waveTime+=dt ; décrémenter timeLeft.
  //         - si worker.lives<=0 -> phase='lost'.
  //         - si timeLeft<=0 : si toutes marks.satisfied -> phase='won' sinon 'lost'.
  //       phases 'won'/'lost' : ne rien faire (la scene gère l'overlay/restart).
  throw new Error('stepWaves not implemented');
}
