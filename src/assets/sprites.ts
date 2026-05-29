// assets/sprites.ts — SQUELETTE. Dessins géométriques iso placeholder.
// Chaque fonction dessine à l'origine (0,0) du contexte ; le render gère la translation.
// Module TOTALEMENT isolé : ne connaît pas GameState, ne calcule aucune position écran.
import type { Dir } from '../core/types';

/** Ouvrier : capsule + casque orange. `animFrame` anime la marche, `placing` = pose en cours. */
export function drawWorker(
  _ctx: CanvasRenderingContext2D,
  _dir: Dir,
  _animFrame: number,
  _placing: boolean,
): void {
  // TODO: dessiner une capsule (corps) + ellipse casque, teinte selon dir, oscillation selon animFrame
  throw new Error('drawWorker not implemented');
}

/** Véhicule : boîte iso. `axis` oriente la caisse selon la lane. */
export function drawVehicle(_ctx: CanvasRenderingContext2D, _kind: 'car', _axis: 'x' | 'y'): void {
  // TODO: prisme iso (toit + 2 faces), roues, phares
  throw new Error('drawVehicle not implemented');
}

/** Cône orange ; couché si `toppled`. */
export function drawCone(_ctx: CanvasRenderingContext2D, _toppled: boolean): void {
  // TODO: triangle + base + bande blanche ; si toppled -> tourné ~80° + ombre allongée
  throw new Error('drawCone not implemented');
}

/** Marque au sol : losange ; clignote via `pulse` (0..1) ; vert si `satisfied`. */
export function drawMark(_ctx: CanvasRenderingContext2D, _satisfied: boolean, _pulse: number): void {
  // TODO: losange iso, contour pointillé, alpha = pulse si non satisfait, vert plein si satisfied
  throw new Error('drawMark not implemented');
}

/** Tuile de sol. `road` = bitume, `work` = zone de chantier. */
export function drawTile(_ctx: CanvasRenderingContext2D, _kind: 'road' | 'work'): void {
  // TODO: losange iso rempli, légère bordure
  throw new Error('drawTile not implemented');
}
