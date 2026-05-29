// @vitest-environment node
// Tests de stepMovement : déplacement, blocage pendant la pose, clamp, dir.
import { describe, it, expect } from 'vitest';
import { stepMovement } from '../movement';
import { WORKER_SPEED } from '../../../core/constants';
import type { GameState, Vec2 } from '../../../core/types';
import type { Intent } from '../../input/input';

/** Construit un GameState minimal centré sur le worker (seul ce que mute le système). */
function makeState(over: Partial<GameState['worker']> = {}): GameState {
  return {
    worker: {
      pos: { x: 3, y: 3 },
      dir: 'S',
      moving: false,
      placing: 0,
      lives: 3,
      invuln: 0,
      ...over,
    },
    vehicles: [],
    cones: [],
    marks: [],
    lanes: [],
    phase: 'rush',
    timeLeft: 60,
    waveTime: 0,
    score: 0,
    conesLeft: 0,
    nextId: 1,
    rng: { next: () => 0, int: () => 0 },
  };
}

function intent(x: number, y: number): Intent {
  return { move: { x, y }, place: false };
}

const close = (a: number, b: number) => Math.abs(a - b) < 1e-9;

describe('stepMovement', () => {
  it('déplace l\'ouvrier selon l\'intention (déplacement simple)', () => {
    const s = makeState({ pos: { x: 3, y: 3 } });
    stepMovement(s, intent(1, 0), 0.5);
    expect(close(s.worker.pos.x, 3 + WORKER_SPEED * 0.5)).toBe(true);
    expect(s.worker.pos.y).toBe(3);
    expect(s.worker.moving).toBe(true);
    expect(s.worker.dir).toBe('E');
  });

  it('normalise la diagonale (même vitesse qu\'un cardinal)', () => {
    const diag = makeState({ pos: { x: 3, y: 3 } });
    stepMovement(diag, intent(1, 1), 1);
    const dx = diag.worker.pos.x - 3;
    const dy = diag.worker.pos.y - 3;
    const dist = Math.hypot(dx, dy);
    expect(close(dist, WORKER_SPEED)).toBe(true);
  });

  it('bloque le déplacement pendant la pose et décrémente placing', () => {
    const s = makeState({ pos: { x: 3, y: 3 }, placing: 0.5, moving: true });
    stepMovement(s, intent(1, 0), 0.2);
    expect(s.worker.pos).toEqual<Vec2>({ x: 3, y: 3 });
    expect(s.worker.moving).toBe(false);
    expect(close(s.worker.placing, 0.3)).toBe(true);
  });

  it('placing ne descend jamais sous 0', () => {
    const s = makeState({ placing: 0.1 });
    stepMovement(s, intent(0, 0), 1);
    expect(s.worker.placing).toBe(0);
  });

  it('clamp aux bords de la grille', () => {
    const hi = makeState({ pos: { x: 7, y: 7 } });
    stepMovement(hi, intent(1, 1), 1);
    expect(hi.worker.pos.x).toBe(7);
    expect(hi.worker.pos.y).toBe(7);

    const lo = makeState({ pos: { x: 0, y: 0 } });
    stepMovement(lo, intent(-1, -1), 1);
    expect(lo.worker.pos.x).toBe(0);
    expect(lo.worker.pos.y).toBe(0);
  });

  it('met à jour dir selon la composante dominante', () => {
    const w = makeState();
    stepMovement(w, intent(-1, 0), 0.1);
    expect(w.worker.dir).toBe('W');

    const n = makeState();
    stepMovement(n, intent(0, -1), 0.1);
    expect(n.worker.dir).toBe('N');

    const sdir = makeState();
    stepMovement(sdir, intent(0, 1), 0.1);
    expect(sdir.worker.dir).toBe('S');

    // Dominante verticale franche : dir vertical malgré une petite compo x.
    const dom = makeState();
    stepMovement(dom, { move: { x: 0, y: 1 }, place: false }, 0.1);
    expect(dom.worker.dir).toBe('S');
  });

  it('moving=false et dir inchangé quand aucune intention', () => {
    const s = makeState({ dir: 'N', moving: true });
    stepMovement(s, intent(0, 0), 0.1);
    expect(s.worker.moving).toBe(false);
    expect(s.worker.dir).toBe('N'); // pas de mouvement -> dir conservé
    expect(s.worker.pos).toEqual<Vec2>({ x: 3, y: 3 });
  });
});
