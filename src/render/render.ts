// render/render.ts — dessine GameState en iso, trié par profondeur.
// LIT l'état, ne le MUTE jamais. Aucune logique de jeu, aucune lecture clavier.
// Dépend uniquement de core/ (iso, types, constants) et assets/ (fonctions draw*).
import type { GameState, Lane, Vec2 } from '../core/types';
import { TILE, depth, worldToScreen } from '../core';
import {
  drawTile,
  drawMark,
  drawCone,
  drawWorker,
  drawVehicle,
} from '../assets/sprites';

// Taille de grille du PROTOTYPE. resize() centre la scène sur cette base
// (cf. data/levels/level01 : gridW = gridH = 8). Un niveau de taille différente
// nécessiterait de passer ses bornes à resize() ; hors périmètre du proto.
const GRID = { w: 8, h: 8 } as const;

const BG = '#1a1d23'; // fond sombre (cohérent avec index.html)

export function createRenderer(canvas: HTMLCanvasElement): {
  draw(state: GameState, alpha: number): void;
  resize(): void;
} {
  const ctx = canvas.getContext('2d')!;

  // État de rendu conservé en closure (recalculé par resize()).
  let dpr = 1;
  let cssW = 0;
  let cssH = 0;
  let origin: Vec2 = { x: 0, y: 0 }; // origine iso (px CSS), centre la grille

  function resize(): void {
    dpr = window.devicePixelRatio || 1;
    // Taille CSS réelle du canvas (fallback fenêtre si pas encore mis en page).
    cssW = canvas.clientWidth || window.innerWidth;
    cssH = canvas.clientHeight || window.innerHeight;

    // Buffer de dessin en pixels physiques.
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);

    // Centrage iso d'une grille GRID.w × GRID.h.
    //  - x : les losanges s'étalent symétriquement autour de origin.x -> centre horizontal.
    //  - y : le sol va de origin.y (case 0,0) à origin.y + (N-1)*TILE.h (case N-1,N-1).
    origin = {
      x: cssW / 2,
      y: (cssH - (GRID.h - 1) * TILE.h) / 2,
    };
  }

  // 'road' si la case est sous une lane, 'work' sinon.
  function tileKind(x: number, y: number, lanes: Lane[]): 'road' | 'work' {
    for (const l of lanes) {
      if (l.axis === 'x' ? y === l.offset : x === l.offset) return 'road';
    }
    return 'work';
  }

  function draw(state: GameState, alpha: number): void {
    // `alpha` : facteur d'interpolation (0..1) entre deux ticks fixes.
    // Ignoré proprement en v1 (rendu sur l'état courant). On pourrait l'utiliser
    // pour lisser la position des véhicules : pos + vel*alpha*dt.
    void alpha;

    const now = performance.now();

    // Base : repère en pixels CSS (origin appliqué par worldToScreen).
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // (a) Fond sombre.
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, cssW, cssH);

    // (b) Sol : double boucle sur la grille du proto.
    for (let y = 0; y < GRID.h; y++) {
      for (let x = 0; x < GRID.w; x++) {
        const s = worldToScreen({ x, y }, origin, TILE);
        ctx.save();
        ctx.translate(s.x, s.y);
        drawTile(ctx, tileKind(x, y, state.lanes));
        ctx.restore();
      }
    }

    // (c) Marques : pulsation douce basée sur le temps réel.
    const pulse = 0.5 + 0.5 * Math.sin(now / 300);
    for (const mark of state.marks) {
      const s = worldToScreen(mark.pos, origin, TILE);
      ctx.save();
      ctx.translate(s.x, s.y);
      drawMark(ctx, mark.satisfied, pulse);
      ctx.restore();
    }

    // (d) Entités : worker + véhicules + cônes, triées par profondeur croissante
    //     pour un z-order correct (ce qui est "devant" est dessiné en dernier).
    type Drawable = { z: number; s: Vec2; paint: () => void };
    const drawables: Drawable[] = [];

    const w = state.worker;
    drawables.push({
      z: depth(w.pos),
      s: worldToScreen(w.pos, origin, TILE),
      // animFrame dérivé du temps seulement si l'ouvrier marche.
      paint: () =>
        drawWorker(ctx, w.dir, w.moving ? (now / 1000) * 8 : 0, w.placing > 0),
    });

    for (const v of state.vehicles) {
      const lane = state.lanes.find((l) => l.id === v.laneId);
      const axis = lane?.axis ?? 'x';
      drawables.push({
        z: depth(v.pos),
        s: worldToScreen(v.pos, origin, TILE),
        paint: () => drawVehicle(ctx, v.kind, axis),
      });
    }

    for (const c of state.cones) {
      drawables.push({
        z: depth(c.pos),
        s: worldToScreen(c.pos, origin, TILE),
        paint: () => drawCone(ctx, c.toppled),
      });
    }

    drawables.sort((a, b) => a.z - b.z);
    for (const d of drawables) {
      ctx.save();
      ctx.translate(d.s.x, d.s.y);
      d.paint();
      ctx.restore();
    }

    // (e) HUD : coords écran fixes (le repère de base est déjà sans translation iso).
    drawHud(state);
  }

  function drawHud(state: GameState): void {
    const satisfied = state.marks.reduce((n, m) => n + (m.satisfied ? 1 : 0), 0);
    const total = state.marks.length;
    const timer = Math.max(0, Math.ceil(state.timeLeft));

    const phaseLabel: Record<GameState['phase'], string> = {
      placing: 'POSE',
      rush: 'RUSH',
      won: 'GAGNÉ',
      lost: 'PERDU',
    };

    ctx.save();
    ctx.textBaseline = 'top';
    ctx.font = '16px system-ui, sans-serif';

    // Vies (cœurs).
    ctx.fillStyle = '#ff5a5a';
    ctx.fillText('♥'.repeat(Math.max(0, state.worker.lives)), 12, 12);

    // Marques satisfaites / total.
    ctx.fillStyle = '#f2f2f2';
    ctx.fillText(`Marques ${satisfied}/${total}`, 12, 34);

    // Timer (haut droite).
    ctx.textAlign = 'right';
    ctx.fillText(`${timer}s`, cssW - 12, 12);

    // Phase (haut centre).
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff7a18';
    ctx.fillText(phaseLabel[state.phase], cssW / 2, 12);

    ctx.restore();

    if (state.phase === 'won' || state.phase === 'lost') {
      drawEndOverlay(state.phase === 'won');
    }
  }

  function drawEndOverlay(won: boolean): void {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, cssW, cssH);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = won ? '#37c871' : '#ff5a5a';
    ctx.font = 'bold 32px system-ui, sans-serif';
    const label = won ? 'GAGNÉ — R pour rejouer' : 'PERDU — R pour rejouer';
    ctx.fillText(label, cssW / 2, cssH / 2);
    ctx.restore();
  }

  resize(); // initialise dpr/origin/css* dès la création
  return { draw, resize };
}
