# systems/waves — rythme de la manche
Interface : `stepWaves(state, level, dt)`. Transition placing->rush au bout de level.placingTime, gère timeLeft,
décide 'won' (toutes marks satisfaites à la fin du rush) / 'lost' (plus de vie, ou temps écoulé sans balisage complet).
NE dessine pas, NE lit pas le clavier. Dépend de `core/` et `data/levels` (LevelDef).
