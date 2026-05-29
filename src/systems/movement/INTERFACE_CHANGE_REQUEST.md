# INTERFACE_CHANGE_REQUEST — gridW / gridH dans GameState

## Constat
`stepMovement` doit clamper `worker.pos` dans `[0, gridW-1] x [0, gridH-1]`,
mais **`GameState` n'expose ni `gridW` ni `gridH`** (cf. `src/core/types.ts`).

## Contournement actuel
En attendant, `movement.ts` clampe en dur sur la grille du proto **8x8**,
soit les indices valides `[0, 7]` sur les deux axes (constante locale
`GRID_MAX_INDEX = 7`). Choix documenté en commentaire dans `movement.ts`.

## Demande
Ajouter à `GameState` (ou à une sous-structure de niveau) les dimensions de
la grille :

```ts
export interface GameState {
  // ...
  gridW: number; // nombre de cases en x
  gridH: number; // nombre de cases en y
}
```

Une fois disponible, remplacer la constante `GRID_MAX_INDEX` par un clamp
sur `[0, state.gridW - 1] x [0, state.gridH - 1]`. Cela évite que des
niveaux de tailles différentes ne soient silencieusement tronqués à 8x8.
