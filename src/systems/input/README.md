# systems/input — clavier -> Intent
Interface : `createInput(): { read(): Intent; dispose() }`. `Intent = { move: Vec2, place: boolean }`.
Ne déplace pas l'ouvrier, ne pose pas de cône. `place` est un front montant (une frame par appui).
Dépend de `core/`. Mappe WASD + flèches pour move, Espace pour place.
