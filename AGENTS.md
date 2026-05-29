# Agents — Cone Crew

## Mode d'emploi

Le squelette est déjà scaffoldé (`core/`, `data/levels/` et toute la config sont **déjà
implémentés**). Chaque agent ci-dessous remplit UN module dont le fichier existe avec
signatures + TODO.

Workflow :
1. `git init && git add -A && git commit -m "chore: scaffolding initial"` (état de départ).
2. Ouvre un terminal Claude Code par agent d'une vague, lance-les **en parallèle**.
3. Astuce : renomme chaque onglet selon le module, et démarre l'agent avec
   `cd src/systems/<module> && claude` pour qu'il soit déjà dans son périmètre.
4. Quand TOUS les agents d'une vague ont fini + `npm run typecheck` vert + commit,
   lance la vague suivante.
5. Garde un terminal "orchestrateur" séparé pour les commits et `npm run dev`.

**Règle d'or commune à tous :** un agent écrit UNIQUEMENT dans son dossier. Lecture
autorisée partout (pour lire les interfaces). `src/core/` et `src/data/levels/` sont
**FIGÉS** — interdiction d'y toucher. Tout besoin de changer une interface → écrire dans
`INTERFACE_CHANGE_REQUEST.md` à la racine et s'arrêter, Bruno arbitre.

---

## Carte des vagues

```
Vague 1  (4 agents en parallèle)   ── modules ne dépendant que de core/ (+ data)
  1.A input        1.B movement
  1.C traffic      1.D collision

Vague 2  (3 agents en parallèle)   ── dépendent de core/ ; cones a une subtilité de timing
  2.A cones        2.B waves        2.C assets

Vague 3  (1 agent)                 ── render (a besoin d'assets fini)
  3.A render

Vague 4  (1 agent, séquentiel)     ── glue finale
  4.A scenes + main
```

Pourquoi ce regroupement : les 6 systèmes ne se connaissent pas entre eux (ils ne
communiquent que via `GameState`), donc ils sont parallélisables. J'ai juste mis `cones`
en vague 2 parce que sa logique de pose (armer la pose, matérialiser le cône quand
`worker.placing` retombe à 0) gagne à être écrite après que `movement` ait figé la façon
dont `placing` est décrémenté — évite une divergence. `render` attend `assets`. `scenes`
attend tout le monde.

> Tu PEUX tout mettre en moins de vagues si tu pilotes peu d'agents : l'important est que
> `assets` soit fini avant `render`, et que `render` + tous les `systems` soient finis
> avant `scenes`.

---

# VAGUE 1 — 4 agents en parallèle

---

### Agent 1.A — `systems/input`

```
Tu travailles sur "Cone Crew", un jeu arcade 2.5D iso en Vite + TypeScript (Canvas 2D, pas de framework). L'état du jeu est une donnée pure `GameState` (dans src/core/) que les systèmes mutent ; les systèmes ne s'importent jamais entre eux.

TON PÉRIMÈTRE : tu écris EXCLUSIVEMENT dans src/systems/input/. Lecture autorisée partout. src/core/ et src/data/ sont FIGÉS, n'y touche pas. Ne modifie pas package.json ni tsconfig.json.

Lis d'abord src/systems/input/README.md, src/core/types.ts et src/core/constants.ts.

INTERFACE À RESPECTER (gravée) — src/systems/input/input.ts :
  export interface Intent { move: Vec2; place: boolean; }
  export function createInput(): { read(): Intent; dispose(): void };

TÂCHES :
1. Implémente createInput() : écoute keydown/keyup sur window pour WASD + flèches (move) et Espace (place).
2. read() renvoie l'Intent courant. `move` a des composantes dans {-1,0,1} (somme des touches maintenues, ex: gauche+haut). `place` est un FRONT MONTANT : true une seule frame par appui d'Espace, puis false tant qu'on ne relâche/réappuie pas. dispose() retire les listeners.
3. Empêche le scroll de la page sur les flèches/Espace (preventDefault).
4. Écris des tests Vitest dans src/systems/input/tests/ (simule des KeyboardEvent, vérifie move et le edge de place). Mocke window si besoin.

CRITÈRES DE FIN :
- [ ] createInput implémenté, aucun throw restant
- [ ] `npm run typecheck` vert
- [ ] `npm run test` vert pour tes tests
- [ ] README mis à jour avec un exemple d'usage
- [ ] commit : "feat(input): clavier -> Intent avec edge sur place"

CONTRAINTES : type hints partout, pas de console.log en prod, ne touche à aucun autre module.
```

---

### Agent 1.B — `systems/movement`

```
Tu travailles sur "Cone Crew", jeu arcade 2.5D iso en Vite + TypeScript (Canvas 2D). L'état est une donnée pure `GameState` (src/core/) que les systèmes mutent ; aucun système n'importe un autre système (sauf le TYPE Intent de input, en lecture seule).

TON PÉRIMÈTRE : tu écris EXCLUSIVEMENT dans src/systems/movement/. src/core/ et src/data/ FIGÉS. Ne modifie pas la config racine.

Lis src/systems/movement/README.md, src/core/types.ts, src/core/constants.ts, et le type Intent dans src/systems/input/input.ts.

INTERFACE À RESPECTER (gravée) — src/systems/movement/movement.ts :
  export function stepMovement(state: GameState, intent: Intent, dt: number): void;

TÂCHES :
1. Si state.worker.placing > 0 : l'ouvrier est immobilisé pendant la pose -> décrémente placing de dt (min 0), worker.moving=false, et NE bouge pas. Sortir.
2. Sinon : normalise intent.move (diagonale = même vitesse), worker.pos += move * WORKER_SPEED * dt.
3. Clamp worker.pos dans [0, gridW-1] x [0, gridH-1]. Récupère gridW/gridH : déduis-les des marks/lanes si besoin OU stocke-les — IMPORTANT : gridW/gridH ne sont PAS dans GameState. Utilise une constante de bornes raisonnable basée sur les positions, OU note dans INTERFACE_CHANGE_REQUEST.md qu'il faudrait gridW/gridH dans GameState et, en attendant, clampe sur [0, 7] (le proto est 8x8). Documente ton choix en commentaire.
4. Mets à jour worker.dir selon la dominante du mouvement (N/E/S/W) et worker.moving = (move != 0).
5. Tests Vitest dans src/systems/movement/tests/ : déplacement simple, blocage pendant placing, clamp aux bords, choix de dir.

CRITÈRES DE FIN :
- [ ] stepMovement implémenté, aucun throw
- [ ] `npm run typecheck` + `npm run test` verts
- [ ] README à jour, commit "feat(movement): déplacement ouvrier + blocage pose + clamp"

CONTRAINTES : pas de mutation d'autre chose que state.worker. Ne touche pas aux autres modules.
```

---

### Agent 1.C — `systems/traffic`

```
Tu travailles sur "Cone Crew", jeu arcade 2.5D iso en Vite + TypeScript. État pur `GameState` (src/core/). Aucun système n'importe un autre système.

TON PÉRIMÈTRE : EXCLUSIVEMENT src/systems/traffic/. src/core/ et src/data/ FIGÉS. Pas de modif config.

Lis src/systems/traffic/README.md, src/core/types.ts (Vehicle, Lane, GameState), src/core/constants.ts, src/data/levels/types.ts (WaveDef).

INTERFACE À RESPECTER (gravée) — src/systems/traffic/traffic.ts :
  export function stepTraffic(state: GameState, wave: WaveDef, dt: number): void;

TÂCHES :
1. N'agir que si state.phase === 'rush'. Sinon, retour immédiat.
2. Maintiens un accumulateur de spawn. Tu n'as pas de champ dédié dans GameState : utilise un module-level WeakMap/Map keyed par state, OU stocke le timer dans une closure module. Choisis le plus simple et documente-le. Tous les wave.spawnInterval secondes, spawne un Vehicle.
3. Spawn : choisis une lane de state.lanes (s'il y en a plusieurs, state.rng.int(...)). Position de départ hors-grille selon lane.axis et lane.dirSign (entrée par le bord opposé au sens). id = state.nextId++. kind='car', speed=wave.speed, width/length raisonnables (ex 1.6 x 0.9 cases).
4. Avance chaque véhicule le long de son axe : pos[axis] += speed * dirSign * dt.
5. Supprime de state.vehicles ceux sortis de [-2, 10] sur l'axe concerné (marge hors 8x8).
6. Tests Vitest dans src/systems/traffic/tests/ : pas de spawn hors 'rush', spawn cadencé, avancée, suppression hors-grille.

CRITÈRES DE FIN :
- [ ] stepTraffic implémenté, aucun throw
- [ ] typecheck + test verts
- [ ] README à jour, commit "feat(traffic): spawn cadencé + déplacement + cleanup"

CONTRAINTES : ne gère PAS les collisions. Mute uniquement state.vehicles et state.nextId.
```

---

### Agent 1.D — `systems/collision`

```
Tu travailles sur "Cone Crew", jeu arcade 2.5D iso en Vite + TypeScript. État pur `GameState` (src/core/). Aucun système n'importe un autre système.

TON PÉRIMÈTRE : EXCLUSIVEMENT src/systems/collision/. src/core/ et src/data/ FIGÉS. Pas de modif config.

Lis src/systems/collision/README.md, src/core/types.ts (Worker, Vehicle, Cone), src/core/constants.ts (INVULN_TIME, CONE_TOPPLE_IMPULSE).

INTERFACE À RESPECTER (gravée) — src/systems/collision/collision.ts :
  export function stepCollision(state: GameState, dt: number): void;

TÂCHES :
1. Décrémente state.worker.invuln de dt (min 0) en début de fonction.
2. Collision véhicule ↔ ouvrier (AABB en coords monde, demi-tailles : véhicule = width/2 & length/2 selon son axe, ouvrier ~0.3 case) : si chevauchement ET worker.invuln <= 0 -> worker.lives-- ; worker.invuln = INVULN_TIME.
3. Collision véhicule ↔ cône NON toppled (même AABB, cône ~0.3 case) : -> cone.toppled = true ; cone.markId = null ; cone.vel = vecteur unitaire du sens du véhicule * CONE_TOPPLE_IMPULSE.
4. NE déplace AUCUNE entité (le mouvement du cône renversé est intégré par systems/cones au tick suivant). NE décide PAS victoire/défaite (c'est systems/waves).
5. Tests Vitest dans src/systems/collision/tests/ : choc ouvrier -> -1 vie + i-frames, pas de double-décompte pendant invuln, choc cône -> toppled + vel orientée, pas de choc si pas de chevauchement.

CRITÈRES DE FIN :
- [ ] stepCollision implémenté, aucun throw
- [ ] typecheck + test verts
- [ ] README à jour, commit "feat(collision): chocs ouvrier/cône + i-frames"

CONTRAINTES : mute uniquement worker.lives/invuln et les champs toppled/vel/markId des cônes. Rien d'autre.
```

---

# VAGUE 2 — 3 agents en parallèle (après vague 1 commitée + typecheck vert)

---

### Agent 2.A — `systems/cones`

```
Tu travailles sur "Cone Crew", jeu arcade 2.5D iso en Vite + TypeScript. État pur `GameState` (src/core/). Aucun système n'importe un autre système (sauf le TYPE Intent de input, lecture seule).

TON PÉRIMÈTRE : EXCLUSIVEMENT src/systems/cones/. src/core/ et src/data/ FIGÉS. Pas de modif config.

Lis src/systems/cones/README.md, src/core/types.ts (Cone, Mark, Worker), src/core/constants.ts (PLACE_TIME, CONE_FRICTION). Lis aussi src/systems/movement/movement.ts pour voir COMMENT worker.placing est décrémenté (movement le fait déjà pendant la pose) — n'en décrémente pas une seconde fois.

INTERFACE À RESPECTER (gravée) — src/systems/cones/cones.ts :
  export function tryPlaceCone(state: GameState, intent: Intent): void;
  export function stepCones(state: GameState, dt: number): void;

MÉCANISME DE POSE (important) : movement décrémente worker.placing chaque tick. Donc :
- tryPlaceCone : si intent.place && worker.placing === 0 && state.conesLeft > 0 : arme une pose -> worker.placing = PLACE_TIME, et mémorise la case cible = case devant l'ouvrier selon worker.dir (arrondie). Stocke cette "pose en attente" (closure module Map keyed par state, ou champ — pas de champ dispo dans GameState, donc Map module documentée).
- stepCones : détecte le passage de placing > 0 à placing === 0 (pose terminée) -> matérialise le Cone à la case mémorisée (toppled=false, vel={0,0}, markId = id de la marque sur cette case si elle existe), state.conesLeft-- (au moment de la matérialisation, pas à l'armement).

TÂCHES :
1. Implémente tryPlaceCone (armement) comme ci-dessus.
2. Implémente stepCones :
   a. matérialisation du cône en attente quand la pose se termine.
   b. physique fake : pour chaque cône avec vel != 0 : pos += vel*dt ; réduis |vel| de CONE_FRICTION*dt (clamp à 0) ; si |vel| ~ 0 -> vel={0,0}. Un cône qui a quitté la case de sa marque -> markId=null.
   c. recalcul des marques : pour chaque Mark, satisfied = il existe un cône NON toppled dont la case (arrondie) == mark.pos.
3. Tests Vitest dans src/systems/cones/tests/ : armement -> placing=PLACE_TIME, matérialisation après écoulement, conesLeft décrémenté une seule fois, friction qui stoppe le cône, marque satisfaite/désatisfaite.

CRITÈRES DE FIN :
- [ ] les 2 fonctions implémentées, aucun throw
- [ ] typecheck + test verts
- [ ] README à jour, commit "feat(cones): pose temporisée + culbute + statut marques"

CONTRAINTES : ne détecte PAS les collisions (collision injecte vel). Mute uniquement state.cones, state.marks, state.conesLeft et worker.placing UNIQUEMENT via l'armement (pas de décrément ici).
```

---

### Agent 2.B — `systems/waves`

```
Tu travailles sur "Cone Crew", jeu arcade 2.5D iso en Vite + TypeScript. État pur `GameState` (src/core/).

TON PÉRIMÈTRE : EXCLUSIVEMENT src/systems/waves/. src/core/ et src/data/ FIGÉS. Pas de modif config.

Lis src/systems/waves/README.md, src/core/types.ts (Phase, GameState), src/data/levels/types.ts (LevelDef, WaveDef).

INTERFACE À RESPECTER (gravée) — src/systems/waves/waves.ts :
  export function stepWaves(state: GameState, level: LevelDef, dt: number): void;

TÂCHES :
1. phase 'placing' : state.timeLeft -= dt. Quand timeLeft <= 0 -> phase='rush', timeLeft = level.wave.duration, waveTime = 0.
2. phase 'rush' : state.waveTime += dt ; state.timeLeft -= dt.
   - si state.worker.lives <= 0 -> phase='lost'.
   - sinon si timeLeft <= 0 : si TOUTES les marks sont satisfied -> phase='won', sinon phase='lost'.
3. phases 'won'/'lost' : no-op (la scène gère overlay + restart).
4. Tests Vitest dans src/systems/waves/tests/ : transition placing->rush au bon moment, lost si lives<=0, won si toutes marks satisfaites à la fin du rush, lost si timeout incomplet.

CRITÈRES DE FIN :
- [ ] stepWaves implémenté, aucun throw
- [ ] typecheck + test verts
- [ ] README à jour, commit "feat(waves): machine à états manche + conditions win/lose"

CONTRAINTES : NE dessine pas, NE lit pas le clavier. Mute uniquement state.phase/timeLeft/waveTime.
```

---

### Agent 2.C — `assets`

```
Tu travailles sur "Cone Crew", jeu arcade 2.5D iso en Vite + TypeScript (Canvas 2D). Tu produis les visuels PLACEHOLDER : des dessins géométriques iso au canvas, lisibles et "chantier" (palette orange #ff7a18, bitume #3a3f47, bandes blanches). Ils seront remplacés par de vrais sprites plus tard SANS toucher au reste.

TON PÉRIMÈTRE : EXCLUSIVEMENT src/assets/. src/core/ FIGÉ. Pas de modif config.

Lis src/assets/README.md, src/core/types.ts (Dir), src/core/constants.ts (TILE).

INTERFACE À RESPECTER (gravée) — src/assets/sprites.ts :
  drawWorker(ctx, dir, animFrame, placing)
  drawVehicle(ctx, kind, axis)
  drawCone(ctx, toppled)
  drawMark(ctx, satisfied, pulse)
  drawTile(ctx, kind)

RÈGLE DE DESSIN : chaque fonction dessine centrée à l'origine (0,0) du contexte — c'est le render/ qui translate le ctx à la bonne position écran AVANT d'appeler. Ne fais donc AUCUN calcul de position monde/écran. Base les tailles sur TILE (w=64, h=32).

TÂCHES :
1. drawTile : losange iso (4 points : haut, droite, bas, gauche selon TILE), rempli ('road' bitume, 'work' légèrement orangé), fine bordure.
2. drawMark : losange iso plus petit, contour pointillé ; si !satisfied -> alpha pulsé via `pulse` (0..1), couleur orange ; si satisfied -> vert plein discret.
3. drawCone : petit cône orange (triangle) + base elliptique + bande blanche. Si toppled -> couché (~80° de rotation) + ombre allongée.
4. drawWorker : capsule (corps gris/jaune) + ellipse casque orange. Oriente un léger décalage selon dir (N/E/S/W). Oscillation verticale légère selon animFrame (marche). Si placing -> petit indicateur (ex: bras baissé / icône cône au sol).
5. drawVehicle : prisme iso (toit + 2 faces visibles) orienté selon axis ('x' ou 'y'), roues sombres, 2 phares.
6. Pas de tests unitaires pertinents (dessin) : à la place, crée src/assets/preview.html (ou un commentaire d'usage) montrant comment chaque fonction est appelée. typecheck doit passer.

CRITÈRES DE FIN :
- [ ] 5 fonctions implémentées, aucun throw
- [ ] `npm run typecheck` vert
- [ ] README à jour avec un mini exemple d'appel
- [ ] commit "feat(assets): sprites géométriques iso placeholder"

CONTRAINTES : ne connais PAS GameState, ne calcule AUCUNE position écran, ne lis aucune entrée. Dépend uniquement de core/types et core/constants.
```

---

# VAGUE 3 — 1 agent (après assets fini)

---

### Agent 3.A — `render`

```
Tu travailles sur "Cone Crew", jeu arcade 2.5D iso en Vite + TypeScript (Canvas 2D). Tu dessines l'état `GameState` à l'écran en iso. Tu LIS l'état, tu ne le mutes JAMAIS, tu ne contiens AUCUNE logique de jeu.

TON PÉRIMÈTRE : EXCLUSIVEMENT src/render/. src/core/ et src/assets/ sont finis et FIGÉS pour toi (lecture seule). Pas de modif config.

Lis src/render/README.md, src/core/iso.ts (worldToScreen, depth), src/core/types.ts, src/core/constants.ts (TILE), et src/assets/sprites.ts (toutes les fonctions draw*).

INTERFACE À RESPECTER (gravée) — src/render/render.ts :
  export function createRenderer(canvas: HTMLCanvasElement): { draw(state: GameState, alpha: number): void; resize(): void };

TÂCHES :
1. resize() : ajuste canvas.width/height au devicePixelRatio et à la taille CSS, calcule l'origin iso pour centrer la grille (déduis la taille de grille des bornes des marks/lanes, ou suppose 8x8 pour le proto — documente). Stocke origin/scale en closure.
2. draw(state, alpha) :
   a. clear (fond sombre).
   b. sol : double boucle sur la grille (8x8 proto), pour chaque case worldToScreen -> translate ctx -> assets.drawTile (les cases sous une lane = 'road', sinon 'work').
   c. marques : pour chaque state.marks, translate -> assets.drawMark(satisfied, pulse) où pulse oscille avec performance.now().
   d. entités : construis un tableau [worker, ...vehicles, ...cones], trie par core.depth(entité.pos) croissant, puis pour chacune translate ctx à worldToScreen(pos) et appelle le bon draw* (drawWorker avec un animFrame dérivé du temps si worker.moving ; drawVehicle avec l'axis de sa lane ; drawCone avec toppled).
   e. HUD (coords écran fixes, pas iso) : vies (♥ x lives), marques satisfaites / total, timer (timeLeft arrondi), libellé de phase. Overlay semi-transparent "GAGNÉ — R pour rejouer" / "PERDU — R pour rejouer" si phase 'won'/'lost'.
3. Utilise ctx.save()/restore() autour de chaque entité translatée.
4. `alpha` : interpolation optionnelle en v1 — tu peux l'ignorer proprement (commente) ou interpoler les véhicules. Pas bloquant.

CRITÈRES DE FIN :
- [ ] createRenderer implémenté, aucun throw, z-order correct (ouvrier passe devant/derrière selon depth)
- [ ] `npm run typecheck` vert
- [ ] `npm run dev` affiche la scène statique sans erreur console (même avant que scenes/ existe, tu peux tester avec un GameState factice dans un commentaire/preview)
- [ ] README à jour, commit "feat(render): rendu iso trié par profondeur + HUD"

CONTRAINTES : aucune mutation de state, aucune logique de jeu, aucune lecture clavier. Dépend uniquement de core/ et assets/.
```

---

# VAGUE 4 — 1 agent séquentiel (après TOUT le reste)

---

### Agent 4.A — `scenes` + `main.ts`

```
Tu travailles sur "Cone Crew", jeu arcade 2.5D iso en Vite + TypeScript. Tu écris la GLUE finale : construire l'état initial, appeler les systèmes dans le bon ordre, brancher la game loop. Tous les autres modules sont finis et FIGÉS pour toi.

TON PÉRIMÈTRE : src/scenes/ ET src/main.ts. src/core/, src/systems/*, src/render/, src/assets/, src/data/ sont FIGÉS (lecture seule). Tu peux réactiver noUnusedLocals/noUnusedParameters dans tsconfig.json À LA FIN si tout est branché (c'est la seule modif config autorisée, et seulement si typecheck reste vert).

Lis src/scenes/README.md, ARCHITECTURE.md (section "Ordre d'update canonique"), et les interfaces de TOUS les modules (leurs README + signatures).

INTERFACE À RESPECTER (gravée) — src/scenes/play.ts :
  export function createPlayScene(canvas: HTMLCanvasElement, level: LevelDef): { update(dt: number): void; render(alpha: number): void };

TÂCHES :
1. createPlayScene :
   a. construis le GameState initial depuis le LevelDef : worker à workerStart (dir 'S', placing 0, invuln 0, lives level.lives), vehicles=[], cones=[], marks depuis level.marks (satisfied=false), lanes=level.lanes, phase='placing', timeLeft=level.placingTime, waveTime=0, score=0, conesLeft=level.conesAvailable, nextId=1, rng=makeRNG(12345).
   b. instancie createInput() et createRenderer(canvas) ; appelle renderer.resize() une fois.
   c. update(dt) DANS CET ORDRE EXACT (ne pas réordonner — l'ordre est critique pour la culbute des cônes) :
        1. const intent = input.read()
        2. stepWaves(state, level, dt)
        3. tryPlaceCone(state, intent)
        4. stepMovement(state, intent, dt)
        5. stepTraffic(state, level.wave, dt)
        6. stepCollision(state, dt)
        7. stepCones(state, dt)
      Gère le restart : si phase 'won'/'lost' et touche R pressée (lis-la via un petit listener local ou via l'Intent étendu — au choix, documente), reconstruis l'état initial.
   d. render(alpha) : renderer.draw(state, alpha).
2. main.ts : récupère <canvas id="game">, crée la scène avec LEVEL_01, branche window 'resize' -> scene (via renderer.resize accessible, ou recrée la scène — au plus simple), createFixedLoop(scene.update, scene.render).start().
3. Lance `npm run dev` et vérifie la boucle complète : poser des cônes en phase placing, le rush qui démarre, les voitures qui renversent un cône mal placé, perte de vie, win/lose, restart avec R.

CRITÈRES DE FIN :
- [ ] le jeu est JOUABLE de bout en bout dans le navigateur
- [ ] `npm run typecheck` vert (idéalement avec noUnused* réactivés)
- [ ] commit "feat(scenes): assemblage game loop — prototype jouable"

CONTRAINTES : respecte l'ordre d'update à la lettre. Si un module a un bug, note-le dans BUGS_FOUND.md et applique un workaround documenté plutôt que de modifier le module fautif.
```

---

## Après la vague 4 : playtest & polish (toi + une session Claude unique)

Une fois jouable, le travail restant n'est plus de l'archi mais du réglage :
- Ajuster les valeurs de `data/levels/level01.ts` (spawnInterval, speed, placingTime, positions des marques) jusqu'à ce que le *game feel* soit bon.
- Si le feel est validé : dupliquer en `level02.ts` … `level10.ts` (montée de difficulté), ajouter un niveau 1 "tutoriel", un menu, le son. Tout ça sans toucher au moteur.
- Remplacer les placeholders d'`assets/` par de vrais sprites (un seul module impacté).
