# assets/ — sprites placeholder (ISOLÉ, swappable)

Visuels du jeu. En v1 : dessins géométriques au canvas. Remplaçables par de vrais sprites
PNG/atlas plus tard SANS toucher au reste du code.

## Interface (figée)
- `drawWorker(ctx, dir, animFrame, placing)`
- `drawVehicle(ctx, kind, axis)`
- `drawCone(ctx, toppled)`
- `drawMark(ctx, satisfied, pulse)`
- `drawTile(ctx, kind)`

## Contraintes
- Chaque fonction dessine à l'origine (0,0) ; le `render/` translate le contexte avant l'appel.
- NE connaît PAS `GameState`. NE calcule AUCUNE position écran. NE lit aucune entrée.
- Dépend uniquement de `core/types` (Dir) et `core/constants` (TILE).
- Style : palette chantier (orange #ff7a18, gris bitume #3a3f47, blanc bandes), lisible en petit.

## Exemple d'appel (depuis `render/`)
Le `render/` translate le contexte à la position écran, puis appelle la fonction
(qui dessine centrée à l'origine) :

```ts
import { drawTile, drawCone, drawWorker, drawVehicle, drawMark } from '../assets/sprites';

// sx, sy = position écran calculée par render/ (worldToScreen)
ctx.save(); ctx.translate(sx, sy); drawTile(ctx, 'road');                ctx.restore();
ctx.save(); ctx.translate(sx, sy); drawMark(ctx, false, pulse);         ctx.restore(); // pulse ∈ [0,1]
ctx.save(); ctx.translate(sx, sy); drawCone(ctx, cone.toppled);         ctx.restore();
ctx.save(); ctx.translate(sx, sy); drawWorker(ctx, 'S', frame, placing); ctx.restore();
ctx.save(); ctx.translate(sx, sy); drawVehicle(ctx, 'car', 'x');        ctx.restore();
```

## Aperçu visuel
`preview.html` affiche les 5 fonctions dans une grille de vignettes.
Lancer `npm run dev` puis ouvrir `/src/assets/preview.html`.
