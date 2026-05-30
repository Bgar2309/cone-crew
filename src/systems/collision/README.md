# systems/collision — résolution des chocs (UNIQUE)
Interface : `stepCollision(state, dt)`. Véhicule↔ouvrier -> perte de vie + i-frames. Véhicule↔cône -> toppled + impulsion vel.
Gère worker.invuln (décrément + i-frames). NE déplace AUCUNE entité, NE décide PAS la victoire/défaite (c'est `waves`).
Détection AABB en coords monde : demi-tailles du véhicule = length/2 le long de son axe de circulation (lane.axis) et width/2 perpendiculairement ; ouvrier et cône = boîte de demi-taille 0.3 case. Sens d'impulsion = vecteur unitaire de la lane (axis + dirSign). Dépend de `core/`.

Mutations autorisées (et uniquement celles-ci) : `worker.lives`, `worker.invuln`, et `cone.toppled` / `cone.vel` / `cone.markId`. Un véhicule sans lane est ignoré (orientation inconnue).
