# data/levels/ — contenu des niveaux (données pures)

Aucune logique, aucun rendu. Un niveau = un objet `LevelDef`.

- `types.ts` — `WaveDef`, `LevelDef`
- `level01.ts` — le prototype jouable (FIGÉ pour la v1, valeurs ajustables au playtest)
- `index.ts` — exports

Passer de 1 à 10 niveaux = ajouter `level02.ts`, etc. et les exporter ici. Zéro impact ailleurs.
Dépend uniquement de `core/types` (Lane, Vec2).
