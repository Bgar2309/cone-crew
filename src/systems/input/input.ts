// systems/input/input.ts — SQUELETTE. Clavier -> intention. Ne mute pas le monde.
import type { Vec2 } from '../../core/types';

export interface Intent {
  move: Vec2;     // composantes dans {-1,0,1}
  place: boolean; // le joueur veut poser un cône ce tick
}

export function createInput(): { read(): Intent; dispose(): void } {
  // TODO: écouter keydown/keyup (WASD + flèches + Espace), maintenir un set de touches,
  //       read() renvoie l'intention courante ; dispose() retire les listeners.
  //       `place` doit être un EDGE (true une seule frame par appui), pas maintenu.
  throw new Error('createInput not implemented');
}
