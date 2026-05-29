// render/render.ts — SQUELETTE. Dessine GameState en iso, trié par profondeur. Lit, ne mute rien.
import type { GameState } from '../core/types';

export function createRenderer(_canvas: HTMLCanvasElement): {
  draw(state: GameState, alpha: number): void;
  resize(): void;
} {
  // TODO:
  //  - resize(): adapter canvas.width/height au devicePixelRatio + taille CSS, recalculer origin iso (centrage).
  //  - draw(state, alpha):
  //      1. clear
  //      2. dessiner le sol (boucle gridW x gridH) via assets.drawTile, en coords iso (worldToScreen)
  //      3. dessiner les marques (assets.drawMark, pulse basé sur le temps)
  //      4. construire la liste des entités { worker, vehicles, cones }, trier par core.depth(pos),
  //         puis dessiner chacune en translatant le ctx à sa position écran (assets.drawWorker/Vehicle/Cone)
  //      5. HUD : vies, marques restantes, timer, phase (placing/rush/won/lost)
  //  - `alpha` sert à interpoler les positions pour un rendu fluide (optionnel en v1).
  throw new Error('createRenderer not implemented');
}
