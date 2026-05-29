# systems/movement — déplacement de l'ouvrier
Interface : `stepMovement(state, intent, dt)`. Mute worker.pos/dir/moving, décrémente worker.placing.
Bloqué pendant la pose (placing>0). Clamp aux bornes [0, gridW-1]x[0, gridH-1]. NE gère PAS les collisions véhicules.
Dépend de `core/` et du type `Intent` de `systems/input` (lecture seule).
