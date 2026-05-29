// systems/traffic/traffic.ts — Spawn cadencé + déplacement + cleanup des véhicules.
import type { GameState, Vehicle } from '../../core/types';
import type { WaveDef } from '../../data/levels/types';

// Bornes de vie d'un véhicule sur son axe : grille 8x8 + marge hors-écran.
const AXIS_MIN = -2; // suppression sous cette borne
const AXIS_MAX = 10; // suppression au-dessus de cette borne
const SPAWN_INSET = 0.5; // décalage du point d'entrée, hors-grille mais dans les bornes de cleanup

// Dimensions par défaut d'une voiture (en cases).
const CAR_WIDTH = 1.6;
const CAR_LENGTH = 0.9;

// Accumulateur de spawn. GameState n'a pas de champ dédié : on stocke le timer
// dans une WeakMap module-level keyed par state. C'est le plus simple — pas de
// fuite mémoire (l'entrée meurt avec le state) et on ne mute jamais GameState
// en dehors de state.vehicles / state.nextId.
const spawnTimers = new WeakMap<GameState, number>();

export function stepTraffic(state: GameState, wave: WaveDef, dt: number): void {
  // 1. N'agir qu'en phase 'rush'.
  if (state.phase !== 'rush') return;

  // 2. Spawn cadencé : un véhicule tous les wave.spawnInterval secondes.
  if (state.lanes.length > 0 && wave.spawnInterval > 0) {
    let acc = (spawnTimers.get(state) ?? 0) + dt;
    while (acc >= wave.spawnInterval) {
      spawnVehicle(state, wave);
      acc -= wave.spawnInterval;
    }
    spawnTimers.set(state, acc);
  }

  // 4. Avance chaque véhicule le long de son axe : pos[axis] += speed * dirSign * dt.
  for (const v of state.vehicles) {
    const lane = state.lanes.find((l) => l.id === v.laneId);
    if (!lane) continue;
    v.pos[lane.axis] += v.speed * lane.dirSign * dt;
  }

  // 5. Supprime les véhicules sortis de [AXIS_MIN, AXIS_MAX] sur leur axe.
  state.vehicles = state.vehicles.filter((v) => {
    const lane = state.lanes.find((l) => l.id === v.laneId);
    if (!lane) return false;
    const p = v.pos[lane.axis];
    return p >= AXIS_MIN && p <= AXIS_MAX;
  });
}

// 3. Crée un véhicule entrant par le bord opposé à son sens de circulation.
function spawnVehicle(state: GameState, wave: WaveDef): void {
  const lane =
    state.lanes.length > 1
      ? state.lanes[state.rng.int(state.lanes.length)]
      : state.lanes[0];

  // dirSign === 1 → entrée par le bord bas (AXIS_MIN) ; dirSign === -1 → bord haut (AXIS_MAX).
  const start = lane.dirSign === 1 ? AXIS_MIN + SPAWN_INSET : AXIS_MAX - SPAWN_INSET;

  const pos =
    lane.axis === 'x'
      ? { x: start, y: lane.offset }
      : { x: lane.offset, y: start };

  const vehicle: Vehicle = {
    id: state.nextId++,
    pos,
    laneId: lane.id,
    speed: wave.speed,
    kind: 'car',
    width: CAR_WIDTH,
    length: CAR_LENGTH,
  };

  state.vehicles.push(vehicle);
}
