# systems/traffic — véhicules
Interface : `stepTraffic(state, wave, dt)`. Spawn selon wave.spawnInterval, avance selon lane, supprime hors-grille.
N'agit qu'en phase 'rush'. NE gère PAS les collisions. Utilise state.nextId pour les ids et state.rng si choix de lane.
Dépend de `core/` et `data/levels/types` (WaveDef).
