# systems/input — clavier -> Intent
Interface : `createInput(): { read(): Intent; dispose() }`. `Intent = { move: Vec2, place: boolean }`.
Ne déplace pas l'ouvrier, ne pose pas de cône. `place` est un front montant (une frame par appui).
Dépend de `core/`. Mappe WASD + flèches pour move, Espace pour place.

## Mapping
- **move** : `A`/`←` → `x:-1`, `D`/`→` → `x:+1`, `W`/`↑` → `y:-1`, `S`/`↓` → `y:+1`.
  Les axes opposés maintenus s'annulent ; chaque composante reste dans `{-1,0,1}`.
- **place** : `Espace`. Front montant — `true` une seule frame par appui, puis `false`
  jusqu'au prochain relâche/réappui (l'auto-répétition clavier ne redéclenche pas).
- Le scroll de la page est annulé (`preventDefault`) sur les flèches et `Espace`.

## Exemple d'usage
```ts
import { createInput } from './systems/input/input';

const input = createInput(); // écoute keydown/keyup sur window

// dans la boucle de jeu, une fois par tick :
function tick(state: GameState): void {
  const intent = input.read();
  // intent.move : { x, y } dans {-1,0,1} — à passer au système de déplacement
  // intent.place : true exactement au tick où Espace vient d'être pressé
}

// au démontage de la scène :
input.dispose(); // retire les listeners
```
