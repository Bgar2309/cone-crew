// systems/collision/collision.ts — Seul résolveur de chocs.
// Véhicule↔ouvrier -> perte de vie + i-frames. Véhicule↔cône -> toppled + impulsion vel.
// Décrémente worker.invuln. NE déplace AUCUNE entité, NE décide PAS victoire/défaite.
import type { GameState, Vec2, Vehicle, Lane } from '../../core/types';
import { INVULN_TIME, CONE_TOPPLE_IMPULSE } from '../../core/constants';

// Demi-taille (en cases) de la boîte de collision de l'ouvrier et des cônes.
const ENTITY_HALF = 0.3;

export function stepCollision(state: GameState, dt: number): void {
  // 1. I-frames : décrément du compteur d'invulnérabilité (jamais négatif).
  state.worker.invuln = Math.max(0, state.worker.invuln - dt);

  for (const v of state.vehicles) {
    const lane = state.lanes.find((l) => l.id === v.laneId);
    if (!lane) continue; // orientation inconnue sans lane -> on ignore ce véhicule.

    // Demi-tailles du véhicule : length/2 le long de son axe de circulation,
    // width/2 perpendiculairement.
    const half = vehicleHalf(v, lane);

    // 2. Choc véhicule ↔ ouvrier (hors i-frames).
    if (
      state.worker.invuln <= 0 &&
      overlaps(state.worker.pos, ENTITY_HALF, v.pos, half)
    ) {
      state.worker.lives--;
      state.worker.invuln = INVULN_TIME;
    }

    // 3. Choc véhicule ↔ cône debout -> culbute.
    for (const cone of state.cones) {
      if (cone.toppled) continue;
      if (!overlaps(cone.pos, ENTITY_HALF, v.pos, half)) continue;
      cone.toppled = true;
      cone.markId = null;
      // Impulsion dans le sens du véhicule (vecteur unitaire * impulsion).
      const dir = laneDir(lane);
      cone.vel = { x: dir.x * CONE_TOPPLE_IMPULSE, y: dir.y * CONE_TOPPLE_IMPULSE };
    }
  }
}

/** Demi-tailles AABB du véhicule selon son axe de circulation. */
function vehicleHalf(v: Vehicle, lane: Lane): Vec2 {
  return lane.axis === 'x'
    ? { x: v.length / 2, y: v.width / 2 }
    : { x: v.width / 2, y: v.length / 2 };
}

/** Vecteur unitaire du sens de circulation de la lane. */
function laneDir(lane: Lane): Vec2 {
  return lane.axis === 'x'
    ? { x: lane.dirSign, y: 0 }
    : { x: 0, y: lane.dirSign };
}

/** Test de chevauchement AABB entre deux boîtes centrées (coords monde). */
function overlaps(ca: Vec2, ha: number, cb: Vec2, hb: Vec2): boolean {
  return (
    Math.abs(ca.x - cb.x) <= ha + hb.x &&
    Math.abs(ca.y - cb.y) <= ha + hb.y
  );
}
