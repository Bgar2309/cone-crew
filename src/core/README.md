# core/ — socle partagé (FIGÉ)

Le contrat commun de tout le projet. **Ne dépend de rien.** Tout le monde en dépend.

## Contenu
- `types.ts` — `Vec2`, `Dir`, `Phase`, `Worker`, `Vehicle`, `Cone`, `Mark`, `Lane`, `GameState`, `RNG`
- `constants.ts` — `TICK`, `TILE`, `PLACE_TIME`, `WORKER_SPEED`, `INVULN_TIME`, `CONE_FRICTION`, `CONE_TOPPLE_IMPULSE`
- `iso.ts` — `worldToScreen()`, `depth()`
- `rng.ts` — `makeRNG(seed)` (mulberry32 déterministe)
- `clock.ts` — `createFixedLoop(update, render)` (pas fixe 1/60 + interpolation)

## Règle
Ce module est **gravé dans le marbre** pendant le dev parallèle. Tout besoin de changement
passe par `INTERFACE_CHANGE_REQUEST.md` à la racine, arbitré par Bruno. Les systèmes communiquent
EXCLUSIVEMENT en mutant le `GameState` — aucun système n'importe un autre système.
