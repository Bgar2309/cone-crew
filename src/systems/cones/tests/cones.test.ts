// @vitest-environment node
// Tests de tryPlaceCone / stepCones : armement de la pose, matérialisation après
// écoulement de placing, conesLeft décrémenté une seule fois, friction qui stoppe
// le cône, marque satisfaite/désatisfaite.
import { describe, it, expect } from 'vitest';
import { tryPlaceCone, stepCones } from '../cones';
import { PLACE_TIME, CONE_FRICTION } from '../../../core/constants';
import type { Cone, GameState, Mark, Worker } from '../../../core/types';
import type { Intent } from '../../input/input';

const close = (a: number, b: number) => Math.abs(a - b) < 1e-9;

/** GameState minimal centré sur les cônes (seuls worker/cones/marks/conesLeft comptent). */
function makeState(opts: {
  worker?: Partial<Worker>;
  cones?: Cone[];
  marks?: Mark[];
  conesLeft?: number;
  nextId?: number;
} = {}): GameState {
  return {
    worker: {
      pos: { x: 3, y: 3 },
      dir: 'S',
      moving: false,
      placing: 0,
      lives: 3,
      invuln: 0,
      ...opts.worker,
    },
    vehicles: [],
    cones: opts.cones ?? [],
    marks: opts.marks ?? [],
    lanes: [],
    phase: 'rush',
    timeLeft: 60,
    waveTime: 0,
    score: 0,
    conesLeft: opts.conesLeft ?? 5,
    nextId: opts.nextId ?? 1,
    rng: { next: () => 0, int: () => 0 },
  };
}

function place(want = true): Intent {
  return { move: { x: 0, y: 0 }, place: want };
}

/** Simule le décompte de placing fait par movement, puis intègre les cônes. */
function tick(state: GameState, dt: number): void {
  state.worker.placing = Math.max(0, state.worker.placing - dt);
  stepCones(state, dt);
}

describe('tryPlaceCone (armement)', () => {
  it('arme une pose : placing = PLACE_TIME, sans créer de cône ni toucher conesLeft', () => {
    const s = makeState({ conesLeft: 3 });
    tryPlaceCone(s, place());
    expect(close(s.worker.placing, PLACE_TIME)).toBe(true);
    expect(s.cones.length).toBe(0); // rien n'est matérialisé à l'armement
    expect(s.conesLeft).toBe(3); // décrémenté seulement à la matérialisation
  });

  it("n'arme pas si l'ouvrier est déjà en train de poser", () => {
    const s = makeState({ worker: { placing: 0.4 } });
    tryPlaceCone(s, place());
    expect(close(s.worker.placing, 0.4)).toBe(true); // inchangé
  });

  it("n'arme pas sans intention de pose", () => {
    const s = makeState();
    tryPlaceCone(s, place(false));
    expect(s.worker.placing).toBe(0);
  });

  it("n'arme pas s'il ne reste aucun cône", () => {
    const s = makeState({ conesLeft: 0 });
    tryPlaceCone(s, place());
    expect(s.worker.placing).toBe(0);
  });

  it('ne throw jamais (état vide)', () => {
    const s = makeState();
    expect(() => tryPlaceCone(s, place(false))).not.toThrow();
    expect(() => stepCones(s, 0.016)).not.toThrow();
  });
});

describe('stepCones (matérialisation)', () => {
  it('matérialise le cône sur la case devant l\'ouvrier quand la pose se termine', () => {
    const s = makeState({ worker: { pos: { x: 3, y: 3 }, dir: 'E' }, conesLeft: 5 });
    tryPlaceCone(s, place());

    // Tant que placing > 0, rien n'est matérialisé.
    stepCones(s, 0); // placing encore à PLACE_TIME
    expect(s.cones.length).toBe(0);

    // On écoule entièrement la pose (movement décrémente placing).
    let guard = 0;
    while (s.worker.placing > 0 && guard++ < 1000) tick(s, 0.1);

    expect(s.cones.length).toBe(1);
    const c = s.cones[0];
    expect(c.pos).toEqual({ x: 4, y: 3 }); // case à l'E de (3,3)
    expect(c.toppled).toBe(false);
    expect(c.vel).toEqual({ x: 0, y: 0 });
    expect(c.markId).toBeNull(); // aucune marque ici
  });

  it('décrémente conesLeft une seule fois sur toute la durée de la pose', () => {
    const s = makeState({ conesLeft: 5 });
    tryPlaceCone(s, place());
    let guard = 0;
    while (s.worker.placing > 0 && guard++ < 1000) tick(s, 0.05);
    expect(s.conesLeft).toBe(4);

    // Ticks supplémentaires : pas de nouvelle matérialisation tant qu'on ne ré-arme pas.
    tick(s, 0.05);
    tick(s, 0.05);
    expect(s.cones.length).toBe(1);
    expect(s.conesLeft).toBe(4);
  });

  it('rattache le cône à la marque présente sur la case de pose', () => {
    const s = makeState({
      worker: { pos: { x: 2, y: 2 }, dir: 'N' },
      marks: [{ id: 7, pos: { x: 2, y: 1 }, satisfied: false }],
    });
    tryPlaceCone(s, place());
    let guard = 0;
    while (s.worker.placing > 0 && guard++ < 1000) tick(s, 0.1);
    expect(s.cones[0].pos).toEqual({ x: 2, y: 1 });
    expect(s.cones[0].markId).toBe(7);
    expect(s.marks[0].satisfied).toBe(true);
  });
});

describe('stepCones (physique fake)', () => {
  it('déplace un cône renversé selon vel et la friction finit par l\'arrêter', () => {
    const c: Cone = { id: 1, pos: { x: 0, y: 0 }, vel: { x: 3, y: 0 }, toppled: true, markId: null };
    const s = makeState({ cones: [c] });

    // Un pas court : avance et la vitesse décroît de CONE_FRICTION*dt.
    stepCones(s, 0.1);
    expect(close(c.pos.x, 0.3)).toBe(true);
    expect(close(c.vel.x, 3 - CONE_FRICTION * 0.1)).toBe(true);

    // On laisse filer : la friction (6 cases/s²) doit annuler la vel.
    let guard = 0;
    while (Math.hypot(c.vel.x, c.vel.y) > 0 && guard++ < 1000) stepCones(s, 0.1);
    expect(c.vel).toEqual({ x: 0, y: 0 });
  });

  it('conserve la direction de la vel pendant la décélération', () => {
    const c: Cone = { id: 1, pos: { x: 0, y: 0 }, vel: { x: 3, y: 4 }, toppled: true, markId: null };
    const s = makeState({ cones: [c] });
    stepCones(s, 0.1);
    // Même direction (ratio x/y conservé) tant que non nulle.
    expect(close(c.vel.x / c.vel.y, 3 / 4)).toBe(true);
  });

  it('ne bouge pas un cône immobile', () => {
    const c: Cone = { id: 1, pos: { x: 2, y: 2 }, vel: { x: 0, y: 0 }, toppled: false, markId: null };
    const s = makeState({ cones: [c] });
    stepCones(s, 0.5);
    expect(c.pos).toEqual({ x: 2, y: 2 });
  });
});

describe('stepCones (statut des marques)', () => {
  it('marque satisfaite par un cône debout sur sa case, désatisfaite sinon', () => {
    const onMark: Cone = { id: 1, pos: { x: 4, y: 4 }, vel: { x: 0, y: 0 }, toppled: false, markId: 9 };
    const s = makeState({
      cones: [onMark],
      marks: [{ id: 9, pos: { x: 4, y: 4 }, satisfied: false }],
    });
    stepCones(s, 0.016);
    expect(s.marks[0].satisfied).toBe(true);

    // Un cône renversé sur la case ne satisfait plus la marque.
    onMark.toppled = true;
    stepCones(s, 0.016);
    expect(s.marks[0].satisfied).toBe(false);
  });

  it('un cône qui quitte la case de sa marque perd son markId et désatisfait la marque', () => {
    // Cône debout sur la marque mais poussé (vel) : il va quitter la case.
    const c: Cone = { id: 1, pos: { x: 4, y: 4 }, vel: { x: 10, y: 0 }, toppled: false, markId: 9 };
    const s = makeState({
      cones: [c],
      marks: [{ id: 9, pos: { x: 4, y: 4 }, satisfied: true }],
    });
    // Un pas suffisant pour franchir la frontière de case (>0.5).
    stepCones(s, 0.1); // avance de ~1 case
    expect(Math.round(c.pos.x)).not.toBe(4);
    expect(c.markId).toBeNull();
    expect(s.marks[0].satisfied).toBe(false);
  });

  it('une marque sans cône n\'est pas satisfaite', () => {
    const s = makeState({ marks: [{ id: 1, pos: { x: 0, y: 0 }, satisfied: true }] });
    stepCones(s, 0.016);
    expect(s.marks[0].satisfied).toBe(false);
  });
});
