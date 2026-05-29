# systems/collision — résolution des chocs (UNIQUE)
Interface : `stepCollision(state, dt)`. Véhicule↔ouvrier -> perte de vie + i-frames. Véhicule↔cône -> toppled + impulsion vel.
Gère worker.invuln (décrément + i-frames). NE déplace AUCUNE entité, NE décide PAS la victoire/défaite (c'est `waves`).
Détection AABB en coords monde (utiliser vehicle.width/length, ~0.6 case pour l'ouvrier/cône). Dépend de `core/`.
