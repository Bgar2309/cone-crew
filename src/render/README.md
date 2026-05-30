# render/ — dessin iso de l'état
Interface : `createRenderer(canvas): { draw(state, alpha), resize() }`. Trie les entités par `core.depth` (x+y)
pour un z-order correct. Dessine sol -> marques -> entités triées -> HUD. LIT GameState, ne le mute JAMAIS.
Aucune logique de jeu. Dépend de `core/` (iso, types, constants) et `assets/` (fonctions draw*).

## resize()
Ajuste `canvas.width/height` au `devicePixelRatio` × taille CSS, puis calcule l'`origin` iso pour
centrer la grille. **Hypothèse proto : grille 8×8** (cf. `data/levels/level01`), stockée dans la
constante `GRID`. `origin`, `dpr` et la taille CSS sont conservés en closure. Un niveau de taille
différente demanderait de passer ses bornes à `resize()` (hors périmètre du proto).

## draw(state, alpha)
1. **clear** : fond sombre plein écran.
2. **sol** : double boucle 8×8 → `worldToScreen` → `translate` → `drawTile`. Une case sous une lane
   (`axis 'x'` ⇒ `y === offset` ; `axis 'y'` ⇒ `x === offset`) est `'road'`, sinon `'work'`.
3. **marques** : pour chaque `state.marks`, `drawMark(satisfied, pulse)` où `pulse` oscille via
   `performance.now()`.
4. **entités** : tableau `[worker, ...vehicles, ...cones]` trié par `core.depth(pos)` croissant, puis
   pour chacune `translate` à `worldToScreen(pos)` + le bon `draw*` (worker avec `animFrame` dérivé du
   temps si `moving` ; vehicle avec l'`axis` de sa lane ; cone avec `toppled`). Chaque entité est
   encadrée par `ctx.save()/restore()`.
5. **HUD** (coords écran fixes, pas iso) : vies (♥), marques satisfaites/total, timer (`timeLeft`
   arrondi), libellé de phase. Overlay semi-transparent « GAGNÉ / PERDU — R pour rejouer » si phase
   `won`/`lost`.

`alpha` (interpolation inter-tick) est ignoré proprement en v1 — un usage futur lisserait la position
des véhicules.

## Aperçu manuel
`preview.html` construit un `GameState` factice et l'anime : `npm run dev` puis ouvrir
`/src/render/preview.html`. (Le rendu mute uniquement la copie locale du preview, jamais l'état.)
