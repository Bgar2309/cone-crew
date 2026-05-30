# systems/waves — rythme de la manche

Interface : `stepWaves(state, level, dt)`. Machine à états de la manche, ne mute que
`state.phase`, `state.timeLeft` et `state.waveTime`. NE dessine pas, NE lit pas le clavier.
Dépend de `core/` et `data/levels` (LevelDef).

## Machine à états (`Phase`)

- **`placing`** — fenêtre de pose tranquille. `timeLeft -= dt`. Quand `timeLeft <= 0` :
  bascule en `rush`, réarme `timeLeft = level.wave.duration` et `waveTime = 0`.
- **`rush`** — la vague est lancée. `waveTime += dt` ; `timeLeft -= dt`.
  - si `worker.lives <= 0` → `lost` (prioritaire).
  - sinon si `timeLeft <= 0` : `won` si **toutes** les marks sont `satisfied`, sinon `lost`.
- **`won` / `lost`** — états terminaux, no-op (la scène gère overlay + restart).

`stepWaves` ne throw jamais. Un niveau sans marks gagne automatiquement à l'échéance du rush
(`[].every(...) === true`).
