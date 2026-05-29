# scenes/ — orchestration d'un tick
Interface : `createPlayScene(canvas, level): { update(dt), render(alpha) }`. Construit le GameState initial
depuis le LevelDef, appelle les systèmes dans l'ORDRE FIGÉ (voir ARCHITECTURE.md), gère win/lose + restart (touche R).
Dépend de `core/`, TOUS les `systems/`, `render/`, `data/levels`. C'est la seule couche qui assemble.
