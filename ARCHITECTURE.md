# Architecture — Cone Crew (prototype v1)

Jeu arcade 2.5D iso. L'ouvrier d'un chantier pose des cônes de signalisation sur des
marques au sol pendant que le trafic s'intensifie par vagues, en esquivant les véhicules
qui peuvent aussi renverser les cônes déjà posés.

Stack : **Vite + TypeScript**, rendu **Canvas 2D**, aucun framework de jeu, aucun backend.
Déploiement : **Railway** (service statique servant le build `dist/`).

---

## Principe de découpage

Pour un jeu, on n'a pas les couches UI/API/Service/Storage d'une web app. On a les couches
naturelles d'un moteur arcade. La règle d'or reste identique : **les dépendances vont vers le
bas, jamais de cycle**.

```
┌──────────────────────────────────────────────┐
│  main.ts (orchestration : boot + game loop)    │  ← assemble tout
├──────────────────────────────────────────────┤
│  scenes/         (états macro : Play, Win…)     │  ← pilote la frame
├──────────────────────────────────────────────┤
│  systems/        (logique : input, movement,    │  ← font évoluer l'état
│                   traffic, collision, cones,     │
│                   waves)                         │
├──────────────────────────────────────────────┤
│  render/         (dessine l'état → canvas iso)   │  ← lit l'état, n'écrit rien
├──────────────────────────────────────────────┤
│  core/           (état, types, math iso, RNG,    │  ← socle, ne dépend de rien
│                   constantes, horloge)           │
├──────────────────────────────────────────────┤
│  assets/         (sprites placeholder géométr.)  │  ← isolé, swappable
├──────────────────────────────────────────────┤
│  data/levels/    (définition des niveaux JSON)   │  ← contenu pur
└──────────────────────────────────────────────┘
```

Idée centrale qui rend la parallélisation possible : **l'état du jeu est une donnée pure**
(`GameState`) qui vit dans `core/`. Les `systems/` la font muter à chaque tick. `render/` la
lit pour dessiner. Personne ne court-circuite ce flux. Un système ne dessine jamais ; le
rendu ne décide jamais de la logique.

---

## Diagramme de dépendances

```
core/         ←  (rien — socle)
assets/       ←  core (types couleur/dimensions seulement)
data/levels/  ←  core (types LevelDef)

systems/input      ←  core
systems/movement   ←  core
systems/traffic    ←  core
systems/cones      ←  core
systems/collision  ←  core
systems/waves      ←  core, data/levels

render/            ←  core, assets

scenes/            ←  core, systems/*, render/, data/levels
main.ts            ←  core, scenes/
```

Aucun système ne dépend d'un autre système. Ils communiquent **uniquement via `GameState`**.
C'est ce qui permet de coder `traffic`, `cones`, `collision`, `movement` en parallèle.

---

## Modules

### `core/`  — le socle (aucune dépendance)

**Rôle** : types partagés, état du jeu, conversions iso↔écran, RNG déterministe, constantes,
horloge à pas fixe. Tout le monde en dépend ; il ne dépend de personne.

**Interface publique** :
```typescript
// core/types.ts
export type Vec2 = { x: number; y: number };            // coords monde (cases, float)
export type Dir = 'N' | 'E' | 'S' | 'W';

export interface Worker {
  pos: Vec2;
  dir: Dir;
  moving: boolean;
  placing: number;        // secondes restantes d'animation de pose (0 = libre)
  lives: number;
  invuln: number;         // i-frames en secondes après un choc
}

export interface Vehicle {
  id: number;
  pos: Vec2;
  laneId: number;
  speed: number;          // cases/seconde
  kind: 'car';            // v1 : un seul type
  width: number; length: number;
}

export interface Cone {
  id: number;
  pos: Vec2;
  vel: Vec2;              // !=0 quand renversé (culbute fake-physics)
  toppled: boolean;
  markId: number | null;  // marque qu'il satisfait, ou null si délogé
}

export interface Mark {
  id: number;
  pos: Vec2;              // case cible (entière)
  satisfied: boolean;     // un cône debout est dessus
}

export interface Lane {
  id: number;
  axis: 'x' | 'y';
  offset: number;         // position fixe sur l'autre axe
  dirSign: 1 | -1;
}

export type Phase = 'placing' | 'rush' | 'won' | 'lost';

export interface GameState {
  worker: Worker;
  vehicles: Vehicle[];
  cones: Cone[];
  marks: Mark[];
  lanes: Lane[];
  phase: Phase;
  timeLeft: number;       // secondes
  waveTime: number;       // temps écoulé dans la vague
  score: number;
  rng: RNG;
}

// core/iso.ts
export function worldToScreen(p: Vec2, origin: Vec2, tile: { w: number; h: number }): Vec2;
export function depth(p: Vec2): number;          // z-order = p.x + p.y

// core/rng.ts
export interface RNG { next(): number; int(maxExcl: number): number; }
export function makeRNG(seed: number): RNG;       // déterministe (mulberry32)

// core/clock.ts  — boucle à pas fixe (le seul timing du jeu)
export function createFixedLoop(
  update: (dt: number) => void,                  // dt constant (ex 1/60)
  render: (alpha: number) => void,               // alpha = interpolation
): { start(): void; stop(): void };

// core/constants.ts
export const TICK = 1 / 60;
export const TILE = { w: 64, h: 32 };            // losange iso
export const PLACE_TIME = 0.8;                   // durée de pose (vulnérable)
export const WORKER_SPEED = 3.2;                 // cases/s
```

**Types exposés** : tous ceux ci-dessus (c'est le vocabulaire commun du projet).
**Ne fait PAS** : aucune logique de gameplay, aucun rendu, aucune lecture clavier.
**Dépend de** : rien.

---

### `data/levels/`  — contenu des niveaux

**Rôle** : décrire un niveau en données pures (positions des marques, lanes, réglages de
vagues, timer). La v1 contient `level01.ts` (le prototype). Les 9 autres niveaux seront
juste d'autres fichiers de ce dossier — aucune logique à toucher.

**Interface publique** :
```typescript
// data/levels/types.ts
export interface WaveDef {
  spawnInterval: number;   // secondes entre deux véhicules
  speed: number;           // cases/s
  duration: number;        // durée de la phase rush
}
export interface LevelDef {
  id: number;
  name: string;
  gridW: number; gridH: number;
  lanes: Lane[];
  marks: Vec2[];           // positions à baliser
  workerStart: Vec2;
  conesAvailable: number;
  placingTime: number;     // durée de la fenêtre de pose tranquille
  wave: WaveDef;
  lives: number;
}
export const LEVEL_01: LevelDef;   // le prototype jouable
```

**Ne fait PAS** : aucune logique, aucun rendu. Données seulement.
**Dépend de** : `core/types` (Lane, Vec2).

---

### `assets/`  — sprites placeholder

**Rôle** : fournir les visuels. En v1 ce sont des **dessins géométriques iso** tracés au
canvas (ouvrier = capsule + casque, voiture = boîte iso, cône = vrai petit cône orange,
marque = losange clignotant). Module **totalement isolé** pour qu'on remplace par de vrais
sprites PNG/atlas plus tard sans toucher au reste.

**Interface publique** :
```typescript
// assets/sprites.ts  — chaque fonction dessine à (0,0), le render gère la position
export function drawWorker(ctx: CanvasRenderingContext2D, dir: Dir, animFrame: number, placing: boolean): void;
export function drawVehicle(ctx: CanvasRenderingContext2D, kind: 'car', axis: 'x'|'y'): void;
export function drawCone(ctx: CanvasRenderingContext2D, toppled: boolean): void;
export function drawMark(ctx: CanvasRenderingContext2D, satisfied: boolean, pulse: number): void;
export function drawTile(ctx: CanvasRenderingContext2D, kind: 'road'|'work'): void;
```

**Ne fait PAS** : ne connaît pas `GameState`, ne calcule pas de position écran (reçoit un
contexte déjà translaté), ne lit aucune entrée.
**Dépend de** : `core/types` (Dir) et `core/constants` (TILE) uniquement.

---

### `systems/input`

**Rôle** : transformer le clavier en intentions. Ne mute pas le monde, produit une
structure d'intention lue par `movement` et `cones`.

**Interface publique** :
```typescript
export interface Intent { move: Vec2; place: boolean; }   // move normalisé {-1,0,1}
export function createInput(): { read(): Intent; dispose(): void };
```
**Ne fait PAS** : ne déplace pas l'ouvrier, ne pose pas de cône (il dit juste "le joueur veut").
**Dépend de** : `core/types`.

---

### `systems/movement`

**Rôle** : appliquer l'intention de déplacement à l'ouvrier (vitesse, direction, blocage
pendant la pose). Met à jour `worker.pos`, `worker.dir`, `worker.moving`, décrémente `placing`.

**Interface publique** :
```typescript
export function stepMovement(state: GameState, intent: Intent, dt: number): void;
```
**Ne fait PAS** : ne gère pas les collisions véhicules, ne pose pas de cône.
**Dépend de** : `core/`.

---

### `systems/cones`

**Rôle** : logique des cônes. Déclencher la pose (consomme `PLACE_TIME`, crée un `Cone` sur la
case ciblée), faire évoluer la culbute des cônes renversés (vélocité + friction), recalculer
quelles `marks` sont satisfaites.

**Interface publique** :
```typescript
export function tryPlaceCone(state: GameState, intent: Intent): void;   // démarre la pose si possible
export function stepCones(state: GameState, dt: number): void;          // physique fake + maj marques
```
**Ne fait PAS** : ne détecte pas la collision véhicule↔cône (c'est `collision` qui pousse la
vélocité ; `cones` ne fait qu'intégrer le mouvement et décider du statut des marques).
**Dépend de** : `core/`.

---

### `systems/traffic`

**Rôle** : faire spawner et avancer les véhicules selon la vague courante. Supprime ceux
sortis du terrain.

**Interface publique** :
```typescript
export function stepTraffic(state: GameState, wave: WaveDef, dt: number): void;
```
**Ne fait PAS** : ne gère pas les collisions (il ne fait que déplacer).
**Dépend de** : `core/`, `data/levels/types` (WaveDef).

---

### `systems/collision`

**Rôle** : le seul module qui résout les chocs. Véhicule↔ouvrier → perte de vie + i-frames.
Véhicule↔cône → marque le cône `toppled` et lui injecte une `vel` (impulsion dans le sens du
véhicule). N'intègre pas le mouvement du cône (c'est `cones` qui le fait au tick suivant).

**Interface publique** :
```typescript
export function stepCollision(state: GameState, dt: number): void;
```
**Ne fait PAS** : ne déplace pas les entités, ne décide pas victoire/défaite.
**Dépend de** : `core/`.

---

### `systems/waves`

**Rôle** : la machine à états de la manche. Gère la transition `placing → rush`, le timer,
et les conditions de fin : toutes les marques satisfaites à la fin du rush → `won` ; plus de
vie ou temps écoulé sans balisage complet → `lost`.

**Interface publique** :
```typescript
export function stepWaves(state: GameState, level: LevelDef, dt: number): void;
```
**Ne fait PAS** : ne dessine pas, ne lit pas le clavier.
**Dépend de** : `core/`, `data/levels`.

---

### `render/`

**Rôle** : dessiner `GameState` sur le canvas, en iso, **trié par profondeur** (`depth = x+y`)
pour que l'ouvrier passe correctement devant/derrière voitures et cônes. Dessine aussi le HUD
(vies, marques restantes, timer, phase). Lit l'état, n'écrit jamais dedans.

**Interface publique** :
```typescript
export function createRenderer(canvas: HTMLCanvasElement): {
  draw(state: GameState, alpha: number): void;     // alpha = interpolation de la loop
  resize(): void;
};
```
**Ne fait PAS** : aucune logique de jeu, aucune mutation d'état.
**Dépend de** : `core/`, `assets/`.

---

### `scenes/`

**Rôle** : orchestrer un tick complet. `PlayScene` appelle les systèmes dans le bon ordre
puis le rendu. Gère aussi les écrans Win/Lose (overlay + touche pour rejouer).

**Ordre d'update canonique (important, figé) :**
```
1. input.read()                → intent
2. stepWaves(state, level, dt)        (transitions de phase / fin de manche)
3. tryPlaceCone(state, intent)        (démarre une pose si demandé)
4. stepMovement(state, intent, dt)
5. stepTraffic(state, wave, dt)
6. stepCollision(state, dt)           (chocs → vies, impulsions cônes)
7. stepCones(state, dt)               (intègre culbutes, recalcule marques)
8. render.draw(state, alpha)
```

**Interface publique** :
```typescript
export function createPlayScene(canvas: HTMLCanvasElement, level: LevelDef): {
  update(dt: number): void;
  render(alpha: number): void;
};
```
**Dépend de** : `core/`, tous les `systems/`, `render/`, `data/levels`.

---

### `main.ts`

**Rôle** : point d'entrée. Récupère le canvas, charge `LEVEL_01`, instancie `PlayScene`,
démarre `createFixedLoop`. ~30 lignes.
**Dépend de** : `core/clock`, `scenes/`, `data/levels`.

---

## Vagues de construction (parallélisation)

- **Vague 1 (parallèle, dès le départ)** — modules sans dépendance interne autre que `core/` :
  - `core/` (à faire en premier OU en tout début ; les autres en dépendent → idéalement
    livré/figé d'abord, mais comme c'est surtout des types + petites fonctions pures, un seul
    agent le boucle vite)
  - `assets/`
  - `data/levels/`
- **Vague 2 (parallèle, après que `core/` est figé)** — les systèmes, indépendants entre eux :
  - `systems/input`, `systems/movement`, `systems/cones`, `systems/traffic`,
    `systems/collision`, `systems/waves`  → **6 agents simultanés possibles**
  - `render/` (dépend aussi de `assets/`, donc à lancer une fois `assets/` prêt)
- **Vague 3 (séquentiel)** — assemblage :
  - `scenes/` puis `main.ts` (un seul agent, c'est de la glue)

Recommandation pratique : **un agent fait `core/` seul d'abord** (c'est le contrat partagé,
il ne doit pas bouger ensuite). Une fois `core/` commité, lancer la vague 2 en parallèle.

---

## Décisions techniques notables

- **TypeScript strict** : `GameState` typé = chaque système sait exactement ce qu'il peut muter.
- **État pur centralisé** : pas de logique dans le rendu, pas de rendu dans la logique. C'est
  CE qui rend les 6 systèmes parallélisables sans conflit.
- **Pas de moteur physique** : la culbute des cônes est une simple intégration `pos += vel*dt`
  avec friction. Suffisant et sans dépendance.
- **Boucle à pas de temps fixe** (`TICK = 1/60`) avec interpolation au rendu → comportement
  déterministe, indépendant du framerate de la machine.
- **RNG déterministe seedé** : utile pour rejouer/débugger une vague à l'identique.
- **Assets isolés** : remplacer les placeholders géométriques par de vrais sprites = ne toucher
  QUE `assets/` + éventuellement le chargement d'un atlas. Zéro impact sur la logique.
- **Niveaux = données** : passer de 1 à 10 niveaux = ajouter des fichiers dans `data/levels/`.
- **Railway** : build Vite → `dist/` servi en statique (pas de backend v1).
