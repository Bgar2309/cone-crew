# render/ — dessin iso de l'état
Interface : `createRenderer(canvas): { draw(state, alpha), resize() }`. Trie les entités par `core.depth` (x+y)
pour un z-order correct. Dessine sol -> marques -> entités triées -> HUD. LIT GameState, ne le mute JAMAIS.
Aucune logique de jeu. Dépend de `core/` (iso, types, constants) et `assets/` (fonctions draw*).
