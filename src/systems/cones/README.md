# systems/cones — pose temporisée + physique fake + marques
Interface : `tryPlaceCone(state, intent)` (arme/démarre une pose), `stepCones(state, dt)` (matérialise la pose, intègre les culbutes, maj marks).
NE détecte PAS les collisions (c'est `collision` qui injecte vel dans le cône). Ici on intègre vel + friction et on décide marks.satisfied.
Une marque est satisfaite ssi un cône debout occupe sa case. Dépend de `core/` et du type `Intent`.

## Pose temporisée
`movement` décrémente `worker.placing` chaque tick pendant la pose ; ce module ne le décrémente jamais.
- `tryPlaceCone` : si `intent.place && worker.placing === 0 && conesLeft > 0`, **arme** une pose : `worker.placing = PLACE_TIME` et mémorise la case cible (case devant l'ouvrier selon `worker.dir`, `pos` arrondie). La pose en attente est stockée dans une `WeakMap` module keyée par `state` (aucun champ libre dans `GameState`). `conesLeft` n'est PAS décrémenté ici.
- `stepCones` (a) : quand une pose en attente existe et que `worker.placing` est retombé à 0 (movement l'a écoulé), **matérialise** le cône sur la case mémorisée (`toppled=false`, `vel={0,0}`, `markId` = id de la marque éventuelle sur la case), `id = state.nextId++`, puis `conesLeft--` (une seule fois).

## Physique fake (b) & marques (c)
- Pour chaque cône avec `vel != 0` : `pos += vel*dt`, on réduit `|vel|` de `CONE_FRICTION*dt` (clamp à 0, direction conservée) ; `|vel| ~ 0` → `vel={0,0}`.
- Un cône qui a quitté la case de sa marque → `markId = null`.
- Pour chaque `Mark` : `satisfied` ssi il existe un cône NON `toppled` dont la case (arrondie) == `mark.pos`.

## Mutations
`state.cones`, `state.marks`, `state.conesLeft`, `worker.placing` (armement uniquement) et `state.nextId` (allocation d'id, cf. `core/types`: compteur vehicles/cones).
