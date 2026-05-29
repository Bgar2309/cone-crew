# systems/movement — déplacement de l'ouvrier

Interface : `stepMovement(state, intent, dt)`. Mute **uniquement** `state.worker`
(pos/dir/moving) et décrémente `worker.placing`.

## Comportement
- **Pose en cours** (`placing > 0`) : ouvrier figé. On décrémente `placing` de `dt`
  (borné à 0), `moving=false`, aucun déplacement. Sortie immédiate.
- **Sinon** : `intent.move` est normalisé (une diagonale ne va pas plus vite qu'un
  cardinal), puis `pos += move_normalisé * WORKER_SPEED * dt`.
- **Clamp** aux bornes de la grille. ⚠️ `gridW/gridH` ne sont **pas** dans
  `GameState` : en attendant, clamp en dur sur la grille du proto **8x8**, soit
  `[0, 7] x [0, 7]` (constante `GRID_MAX_INDEX`). Voir `INTERFACE_CHANGE_REQUEST.md`.
- **dir** suit la composante dominante du mouvement (convention input : +x=E, -x=W,
  +y=S, -y=N ; égalité → horizontale). Inchangée si l'ouvrier ne bouge pas.
- **moving** = vrai ssi `intent.move != 0`.

Ne gère **pas** les collisions véhicules. Dépend de `core/` et du type `Intent` de
`systems/input` (lecture seule).
