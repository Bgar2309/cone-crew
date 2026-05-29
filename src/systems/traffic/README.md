# systems/traffic — véhicules

Interface : `stepTraffic(state, wave, dt)`. Spawn cadencé, déplacement le long de la lane, suppression hors-grille.
N'agit qu'en phase `'rush'` (retour immédiat sinon). NE gère PAS les collisions.
Mute uniquement `state.vehicles` et `state.nextId`. Dépend de `core/` et `data/levels/types` (WaveDef).

## Comportement

1. **Garde de phase** — si `state.phase !== 'rush'`, retour immédiat (aucun spawn, aucun déplacement).
2. **Spawn cadencé** — un accumulateur de temps déclenche un spawn tous les `wave.spawnInterval`
   secondes (boucle `while`, donc plusieurs spawns possibles si `dt` couvre plusieurs intervalles).
3. **Choix de lane** — `state.lanes[state.rng.int(n)]` s'il y a plusieurs lanes, sinon la seule.
   Le véhicule entre par le bord **opposé** à son sens : `dirSign === 1` → bord bas, `dirSign === -1`
   → bord haut, hors-grille mais à l'intérieur des bornes de cleanup.
4. **Déplacement** — pour chaque véhicule : `pos[lane.axis] += speed * lane.dirSign * dt`.
5. **Cleanup** — suppression des véhicules sortis de `[-2, 10]` sur leur axe (marge autour du 8x8).

Ordre par pas : spawn → déplacement (les véhicules fraîchement spawnés avancent aussi ce pas-là,
négligeable au `dt` réel) → cleanup.

## Accumulateur de spawn

`GameState` n'a pas de champ dédié au timer de spawn. On le conserve dans une **`WeakMap`
module-level keyed par `state`** (`src/systems/traffic/traffic.ts`). Choix le plus simple :
pas de fuite mémoire (l'entrée disparaît avec le `state`) et aucune mutation de `GameState` hors
de `state.vehicles` / `state.nextId`.

## Caractéristiques du Vehicle spawné

`kind='car'`, `speed=wave.speed`, `width=1.6`, `length=0.9` (cases), `id = state.nextId++`.
