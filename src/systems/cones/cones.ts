// systems/cones/cones.ts — Pose temporisée des cônes + culbute fake-physics + statut des marques.
// Ne détecte PAS les collisions : c'est `collision` qui injecte vel dans un cône
// percuté. Ici on intègre vel + friction, on matérialise les poses terminées et
// on décide quelles marques sont satisfaites.
// Mutations : state.cones, state.marks, state.conesLeft, worker.placing (armement
// uniquement) et state.nextId (allocation d'id, cf. core/types: compteur vehicles/cones).
import type { GameState, Vec2, Dir, Mark } from '../../core/types';
import type { Intent } from '../input/input';
import { PLACE_TIME, CONE_FRICTION } from '../../core/constants';

// Pose « armée » mais pas encore matérialisée, mémorisée hors de GameState (aucun
// champ disponible) : la case cible calculée au moment de l'armement. WeakMap keyed
// par state -> pas de fuite mémoire, isolation entre parties simultanées (tests).
const pendingPlacements = new WeakMap<GameState, Vec2>();

// Décalage de case selon la direction de l'ouvrier.
// Convention d'input (cf. systems/input) : +x=E, -x=W, +y=S, -y=N.
const DIR_OFFSET: Record<Dir, Vec2> = {
  N: { x: 0, y: -1 },
  E: { x: 1, y: 0 },
  S: { x: 0, y: 1 },
  W: { x: -1, y: 0 },
};

// En deçà de ce seuil, on considère un cône immobile (évite les vel résiduelles).
const VEL_EPSILON = 1e-6;

/** Démarre une pose si possible (cônes restants, ouvrier libre, intention de pose). */
export function tryPlaceCone(state: GameState, intent: Intent): void {
  const worker = state.worker;
  // Front de pose seulement quand l'ouvrier est libre et qu'il reste des cônes.
  if (!intent.place || worker.placing !== 0 || state.conesLeft <= 0) return;

  // Case cible = case devant l'ouvrier (pos arrondie + décalage de direction).
  const off = DIR_OFFSET[worker.dir];
  const target: Vec2 = {
    x: Math.round(worker.pos.x) + off.x,
    y: Math.round(worker.pos.y) + off.y,
  };

  // Armement : movement décrémentera worker.placing chaque tick. La pose sera
  // matérialisée par stepCones quand placing repassera à 0. conesLeft n'est PAS
  // décrémenté ici (seulement à la matérialisation).
  worker.placing = PLACE_TIME;
  pendingPlacements.set(state, target);
}

/** Matérialise la pose terminée, intègre les culbutes (friction) et recalcule marks. */
export function stepCones(state: GameState, dt: number): void {
  // a. Matérialisation : une pose en attente + placing retombé à 0 (movement l'a
  //    décrémenté) => la pose est terminée, on pose le cône sur sa case.
  const pending = pendingPlacements.get(state);
  if (pending !== undefined && state.worker.placing === 0) {
    state.cones.push({
      id: state.nextId++,
      pos: { x: pending.x, y: pending.y },
      vel: { x: 0, y: 0 },
      toppled: false,
      markId: markIdAt(state.marks, pending),
    });
    state.conesLeft -= 1;
    pendingPlacements.delete(state);
  }

  // b. Physique fake : intégration + friction des cônes renversés (vel != 0).
  for (const cone of state.cones) {
    const speed = Math.hypot(cone.vel.x, cone.vel.y);
    if (speed > VEL_EPSILON) {
      cone.pos.x += cone.vel.x * dt;
      cone.pos.y += cone.vel.y * dt;

      // Réduit la norme de CONE_FRICTION*dt (clamp à 0), direction conservée.
      const newSpeed = speed - CONE_FRICTION * dt;
      if (newSpeed <= VEL_EPSILON) {
        cone.vel.x = 0;
        cone.vel.y = 0;
      } else {
        const scale = newSpeed / speed;
        cone.vel.x *= scale;
        cone.vel.y *= scale;
      }
    }

    // Un cône qui a quitté la case de sa marque n'y est plus rattaché.
    if (cone.markId !== null) {
      const mark = state.marks.find((m) => m.id === cone.markId);
      if (mark === undefined || !onTile(cone.pos, mark.pos)) {
        cone.markId = null;
      }
    }
  }

  // c. Recalcul des marques : satisfaite ssi un cône debout occupe sa case.
  for (const mark of state.marks) {
    mark.satisfied = state.cones.some(
      (c) => !c.toppled && onTile(c.pos, mark.pos),
    );
  }
}

/** id de la marque sur la case `pos` (entière), ou null. */
function markIdAt(marks: Mark[], pos: Vec2): number | null {
  const mark = marks.find((m) => m.pos.x === pos.x && m.pos.y === pos.y);
  return mark ? mark.id : null;
}

/** La case (arrondie) de `p` coïncide-t-elle avec la case entière `tile` ? */
function onTile(p: Vec2, tile: Vec2): boolean {
  return Math.round(p.x) === tile.x && Math.round(p.y) === tile.y;
}
