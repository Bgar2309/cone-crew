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
