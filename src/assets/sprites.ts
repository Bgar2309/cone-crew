// assets/sprites.ts — dessins PLACEHOLDER géométriques (swappables).
// Règle: chaque fonction dessine CENTRÉE à l'origine (0,0). Le render/ translate avant l'appel.
// Dépend uniquement de core/types (Dir) et core/constants (TILE).
//
// Exemple d'appel (depuis render/, ctx déjà translaté à la bonne position écran) :
//   ctx.save(); ctx.translate(sx, sy); drawTile(ctx, 'road');   ctx.restore();
//   ctx.save(); ctx.translate(sx, sy); drawCone(ctx, false);    ctx.restore();
//   ctx.save(); ctx.translate(sx, sy); drawWorker(ctx, 'S', t*8, false); ctx.restore();
// Voir aussi src/assets/preview.html pour un aperçu visuel des 5 fonctions.

import type { Dir } from '../core/types';
import { TILE } from '../core/constants';

// ── Palette chantier ────────────────────────────────────────────────
export const PAL = {
  orange: '#ff7a18',
  bitume: '#3a3f47',
  white: '#f2f2f2',
  dark: '#23262b',
  green: '#37c871',
  shadow: 'rgba(0,0,0,0.25)',
} as const;

// Rayons iso d'une case (demi-largeur / demi-hauteur du losange).
const RX = TILE.w / 2; // 32
const RY = TILE.h / 2; // 16

// ── Helpers iso ─────────────────────────────────────────────────────

// Losange iso centré à l'origine, rayons (rx, ry).
function isoDiamond(ctx: CanvasRenderingContext2D, rx: number, ry: number) {
  ctx.beginPath();
  ctx.moveTo(0, -ry);   // haut
  ctx.lineTo(rx, 0);    // droite
  ctx.lineTo(0, ry);    // bas
  ctx.lineTo(-rx, 0);   // gauche
  ctx.closePath();
}

// Ellipse pleine centrée, utilitaire (ombres, bases, casque).
function ellipse(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, rx: number, ry: number,
) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.closePath();
}

// ── API publique (interface figée) ──────────────────────────────────

// 1. Case du sol : losange iso plein + fine bordure.
export function drawTile(
  ctx: CanvasRenderingContext2D,
  kind: 'road' | 'work',
) {
  ctx.save();
  isoDiamond(ctx, RX, RY);
  ctx.fillStyle = kind === 'work' ? '#4a4038' : PAL.bitume; // 'work' légèrement orangé
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.stroke();
  ctx.restore();
}

// 2. Marque cible : petit losange à contour pointillé.
//    !satisfied -> orange, alpha pulsé via `pulse` (0..1). satisfied -> vert plein discret.
export function drawMark(
  ctx: CanvasRenderingContext2D,
  satisfied: boolean,
  pulse: number,
) {
  ctx.save();
  const rx = RX * 0.55;
  const ry = RY * 0.55;
  if (satisfied) {
    isoDiamond(ctx, rx, ry);
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = PAL.green;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = PAL.green;
    ctx.stroke();
  } else {
    const p = Math.max(0, Math.min(1, pulse));
    ctx.globalAlpha = 0.35 + 0.5 * p; // pulsation
    ctx.setLineDash([4, 3]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = PAL.orange;
    isoDiamond(ctx, rx, ry);
    ctx.stroke();
  }
  ctx.restore();
}

// 3. Cône : triangle orange + base elliptique + bande blanche.
//    toppled -> couché (~80°) + ombre allongée.
export function drawCone(
  ctx: CanvasRenderingContext2D,
  toppled: boolean,
) {
  ctx.save();

  // Ombre au sol (allongée si renversé).
  ctx.fillStyle = PAL.shadow;
  ellipse(ctx, 0, 2, toppled ? 16 : 9, toppled ? 5 : 4);
  ctx.fill();

  if (toppled) ctx.rotate((80 * Math.PI) / 180); // ~couché

  const h = 22;   // hauteur du cône
  const base = 9; // demi-largeur de base

  // Corps (triangle).
  ctx.beginPath();
  ctx.moveTo(0, -h);       // pointe
  ctx.lineTo(base, 0);     // base droite
  ctx.lineTo(-base, 0);    // base gauche
  ctx.closePath();
  ctx.fillStyle = PAL.orange;
  ctx.fill();

  // Bande blanche.
  ctx.beginPath();
  ctx.moveTo(-base * 0.62, -h * 0.45);
  ctx.lineTo(base * 0.62, -h * 0.45);
  ctx.lineTo(base * 0.48, -h * 0.62);
  ctx.lineTo(-base * 0.48, -h * 0.62);
  ctx.closePath();
  ctx.fillStyle = PAL.white;
  ctx.fill();

  // Base elliptique (socle).
  ctx.fillStyle = '#e06a10';
  ellipse(ctx, 0, 0, base + 2, 4);
  ctx.fill();

  ctx.restore();
}

// 4. Ouvrier : capsule (corps) + casque orange. Léger décalage selon dir,
//    oscillation verticale selon animFrame, indicateur si placing.
export function drawWorker(
  ctx: CanvasRenderingContext2D,
  dir: Dir,
  animFrame: number,
  placing: boolean,
) {
  ctx.save();

  // Décalage de "regard" selon la direction.
  const lean: Record<Dir, number> = { N: -1.5, S: 1.5, E: 2, W: -2 };
  const dx = lean[dir];

  // Oscillation de marche.
  const bob = Math.sin(animFrame * 0.5) * 1.5;

  // Ombre.
  ctx.fillStyle = PAL.shadow;
  ellipse(ctx, 0, 2, 8, 4);
  ctx.fill();

  ctx.translate(dx, bob);

  const bodyW = 12;
  const bodyH = 20;
  const top = -bodyH - 4; // sommet du corps

  // Corps (capsule jaune/gris).
  ctx.beginPath();
  const r = bodyW / 2;
  ctx.moveTo(-r, -bodyH + r);
  ctx.arc(0, -bodyH + r, r, Math.PI, 0);     // épaules arrondies
  ctx.lineTo(r, -r);
  ctx.arc(0, -r, r, 0, Math.PI);             // bas arrondi
  ctx.closePath();
  ctx.fillStyle = '#f2c200'; // gilet jaune chantier
  ctx.fill();

  // Bande réfléchissante.
  ctx.fillStyle = PAL.white;
  ctx.fillRect(-r, -bodyH * 0.6, bodyW, 3);

  // Casque orange (ellipse).
  ctx.fillStyle = PAL.orange;
  ellipse(ctx, 0, top + 2, 7, 5);
  ctx.fill();

  // Indicateur de pose : petit cône au sol devant l'ouvrier.
  if (placing) {
    ctx.beginPath();
    ctx.moveTo(dx + 8, 0);
    ctx.lineTo(dx + 12, 4);
    ctx.lineTo(dx + 4, 4);
    ctx.closePath();
    ctx.fillStyle = PAL.orange;
    ctx.fill();
  }

  ctx.restore();
}

// 5. Véhicule : prisme iso (toit + 2 faces), roues sombres, 2 phares.
export function drawVehicle(
  ctx: CanvasRenderingContext2D,
  kind: 'car',
  axis: 'x' | 'y',
) {
  void kind;
  ctx.save();

  // Le losange du toit est allongé selon l'axe de déplacement.
  const longA = RX * 0.95; // demi-longueur (sens de la route)
  const shortA = RX * 0.5; // demi-largeur
  // axis 'x' : long sur l'arête droite-iso ; 'y' : long sur l'arête gauche-iso.
  const rxTop = axis === 'x' ? longA : shortA;
  const ryTop = axis === 'x' ? shortA * 0.5 : longA * 0.5;
  const lift = 16; // hauteur du prisme

  // Sommets du losange (toit), avant translation verticale.
  const top = { x: 0, y: -ryTop };
  const right = { x: rxTop, y: 0 };
  const bottom = { x: 0, y: ryTop };
  const left = { x: -rxTop, y: 0 };

  // Ombre.
  ctx.fillStyle = PAL.shadow;
  ellipse(ctx, 0, ryTop + 2, rxTop * 0.9, ryTop * 0.6);
  ctx.fill();

  ctx.translate(0, -lift / 2);

  // Face droite (sombre).
  ctx.beginPath();
  ctx.moveTo(right.x, right.y);
  ctx.lineTo(bottom.x, bottom.y);
  ctx.lineTo(bottom.x, bottom.y + lift);
  ctx.lineTo(right.x, right.y + lift);
  ctx.closePath();
  ctx.fillStyle = '#c44a06';
  ctx.fill();

  // Face gauche (plus sombre).
  ctx.beginPath();
  ctx.moveTo(left.x, left.y);
  ctx.lineTo(bottom.x, bottom.y);
  ctx.lineTo(bottom.x, bottom.y + lift);
  ctx.lineTo(left.x, left.y + lift);
  ctx.closePath();
  ctx.fillStyle = '#9c3a04';
  ctx.fill();

  // Toit (losange clair).
  ctx.beginPath();
  ctx.moveTo(top.x, top.y);
  ctx.lineTo(right.x, right.y);
  ctx.lineTo(bottom.x, bottom.y);
  ctx.lineTo(left.x, left.y);
  ctx.closePath();
  ctx.fillStyle = PAL.orange;
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.stroke();

  // Phares (2 points clairs à l'avant = pointe haute du losange).
  ctx.fillStyle = '#fff4d6';
  ellipse(ctx, -rxTop * 0.18, top.y + ryTop * 0.4, 2, 1.5);
  ctx.fill();
  ellipse(ctx, rxTop * 0.18, top.y + ryTop * 0.4, 2, 1.5);
  ctx.fill();

  // Roues sombres aux coins bas des faces.
  ctx.fillStyle = PAL.dark;
  ellipse(ctx, left.x * 0.6, bottom.y + lift, 3, 2);
  ctx.fill();
  ellipse(ctx, right.x * 0.6, bottom.y + lift, 3, 2);
  ctx.fill();

  ctx.restore();
}
