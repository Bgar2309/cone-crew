// @vitest-environment node
// Tests de stepCollision : décrément i-frames, choc ouvrier (-1 vie + invuln),
// pas de double-décompte pendant les i-frames, choc cône (toppled + vel orientée),
// absence de choc sans chevauchement.
import { describe, it, expect } from 'vitest';
import { stepCollision } from '../collision';
import { INVULN_TIME, CONE_TOPPLE_IMPULSE } from '../../../core/constants';
import type { Cone, GameState, Lane, Vehicle, Worker } from '../../../core/types';

const close = (a: number, b: number) => Math.abs(a - b) < 1e-9;

/** GameState minimal centré sur la collision (seuls worker/vehicles/cones/lanes comptent). */
function makeState(opts: {
  worker?: Partial<Worker>;
  vehicles?: Vehicle[];
  cones?: Cone[];
  lanes?: Lane[];
} = {}): GameState {
  return {
    worker: {
      pos: { x: 0, y: 0 },
      dir: 'S',
      moving: false,
      placing: 0,
      lives: 3,
      invuln: 0,
      ...opts.worker,
    },
    vehicles: opts.vehicles ?? [],
    cones: opts.cones ?? [],
    marks: [],
    lanes: opts.lanes ?? [{ id: 0, axis: 'x', offset: 0, dirSign: 1 }],
    phase: 'rush',
    timeLeft: 60,
    waveTime: 0,
    score: 0,
    conesLeft: 0,
    nextId: 1,
    rng: { next: () => 0, int: () => 0 },
  };
}

function car(pos: { x: number; y: number }, laneId = 0): Vehicle {
  return { id: 1, pos, laneId, speed: 4, kind: 'car', width: 1.6, length: 0.9 };
}

function cone(pos: { x: number; y: number }): Cone {
  return { id: 1, pos, vel: { x: 0, y: 0 }, toppled: false, markId: 7 };
}

describe('stepCollision', () => {
  it("décrémente worker.invuln de dt, borné à 0", () => {
    const s = makeState({ worker: { invuln: 1 } });
    stepCollision(s, 0.3);
    expect(close(s.worker.invuln, 0.7)).toBe(true);
    // Ne descend jamais sous 0.
    stepCollision(s, 5);
    expect(s.worker.invuln).toBe(0);
  });

  it('ne throw jamais (état vide)', () => {
    const s = makeState();
    expect(() => stepCollision(s, 0.016)).not.toThrow();
  });

  it("choc véhicule ↔ ouvrier : -1 vie + i-frames", () => {
    const s = makeState({ vehicles: [car({ x: 0, y: 0 })] });
    stepCollision(s, 0.016);
    expect(s.worker.lives).toBe(2);
    expect(s.worker.invuln).toBe(INVULN_TIME);
  });

  it("pas de double-décompte pendant les i-frames", () => {
    const s = makeState({
      worker: { invuln: 0.05 },
      vehicles: [car({ x: 0, y: 0 })],
    });
    // dt < invuln : encore invulnérable au moment du test -> aucune perte.
    stepCollision(s, 0.016);
    expect(s.worker.lives).toBe(3);
    expect(close(s.worker.invuln, 0.034)).toBe(true);
  });

  it("ne touche pas l'ouvrier hors de la boîte du véhicule", () => {
    // Véhicule axe x : demi-tailles (length/2=0.45 sur x, width/2=0.8 sur y).
    // Ouvrier à x=2 : |2-0| > 0.45+0.3 -> pas de chevauchement.
    const s = makeState({ vehicles: [car({ x: 2, y: 0 })] });
    stepCollision(s, 0.016);
    expect(s.worker.lives).toBe(3);
    expect(s.worker.invuln).toBe(0);
  });

  it('un seul décompte même avec plusieurs véhicules superposés', () => {
    const s = makeState({
      vehicles: [car({ x: 0, y: 0 }), { ...car({ x: 0, y: 0 }), id: 2 }],
    });
    stepCollision(s, 0.016);
    expect(s.worker.lives).toBe(2);
  });

  it("choc véhicule ↔ cône : toppled + markId null + vel orientée", () => {
    const s = makeState({
      worker: { pos: { x: 9, y: 9 } }, // ouvrier loin, hors du choc
      vehicles: [car({ x: 0, y: 0 })],
      cones: [cone({ x: 0, y: 0 })],
    });
    stepCollision(s, 0.016);
    const c = s.cones[0];
    expect(c.toppled).toBe(true);
    expect(c.markId).toBeNull();
    // Lane axe x, dirSign 1 -> impulsion sur +x uniquement.
    expect(close(c.vel.x, CONE_TOPPLE_IMPULSE)).toBe(true);
    expect(c.vel.y).toBe(0);
  });

  it("oriente la vel selon le sens du véhicule (axe y, dirSign -1)", () => {
    const s = makeState({
      worker: { pos: { x: 9, y: 9 } },
      lanes: [{ id: 0, axis: 'y', offset: 0, dirSign: -1 }],
      vehicles: [car({ x: 0, y: 0 })],
      cones: [cone({ x: 0, y: 0 })],
    });
    stepCollision(s, 0.016);
    const c = s.cones[0];
    expect(c.vel.x).toBe(0);
    expect(close(c.vel.y, -CONE_TOPPLE_IMPULSE)).toBe(true);
  });

  it("ignore les cônes déjà renversés (pas de ré-impulsion)", () => {
    const toppled: Cone = {
      id: 1, pos: { x: 0, y: 0 }, vel: { x: 1, y: 0 }, toppled: true, markId: null,
    };
    const s = makeState({
      worker: { pos: { x: 9, y: 9 } },
      vehicles: [car({ x: 0, y: 0 })],
      cones: [toppled],
    });
    stepCollision(s, 0.016);
    // vel inchangée : la collision n'a pas re-touché ce cône.
    expect(close(s.cones[0].vel.x, 1)).toBe(true);
  });

  it("pas de choc cône sans chevauchement", () => {
    const s = makeState({
      worker: { pos: { x: 9, y: 9 } },
      vehicles: [car({ x: 0, y: 0 })],
      cones: [cone({ x: 3, y: 3 })],
    });
    stepCollision(s, 0.016);
    expect(s.cones[0].toppled).toBe(false);
    expect(s.cones[0].markId).toBe(7);
  });

  it('ne déplace aucune entité', () => {
    const s = makeState({
      vehicles: [car({ x: 0, y: 0 })],
      cones: [cone({ x: 0, y: 0 })],
    });
    const wp = { ...s.worker.pos };
    const vp = { ...s.vehicles[0].pos };
    const cp = { ...s.cones[0].pos };
    stepCollision(s, 0.016);
    expect(s.worker.pos).toEqual(wp);
    expect(s.vehicles[0].pos).toEqual(vp);
    expect(s.cones[0].pos).toEqual(cp);
  });
});
