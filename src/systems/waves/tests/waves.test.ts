// @vitest-environment node
// Tests de stepWaves : transition placing->rush, conditions de victoire/défaite, phases terminales.
import { describe, it, expect } from 'vitest';
import { stepWaves } from '../waves';
import type { GameState, Mark, Phase } from '../../../core/types';
import type { LevelDef } from '../../../data/levels/types';

const LEVEL: LevelDef = {
  id: 1,
  name: 'test',
  gridW: 10,
  gridH: 10,
  lanes: [],
  marks: [],
  workerStart: { x: 0, y: 0 },
  conesAvailable: 3,
  placingTime: 10,
  wave: { spawnInterval: 1, speed: 4, duration: 18 },
  lives: 3,
};

/** GameState minimal centré sur la machine à états (seuls phase/timeLeft/waveTime sont mutés). */
function makeState(opts: {
  phase?: Phase;
  timeLeft?: number;
  waveTime?: number;
  lives?: number;
  marks?: Mark[];
} = {}): GameState {
  return {
    worker: { pos: { x: 0, y: 0 }, dir: 'S', moving: false, placing: 0, lives: opts.lives ?? 3, invuln: 0 },
    vehicles: [],
    cones: [],
    marks: opts.marks ?? [],
    lanes: [],
    phase: opts.phase ?? 'placing',
    timeLeft: opts.timeLeft ?? 10,
    waveTime: opts.waveTime ?? 0,
    score: 0,
    conesLeft: 0,
    nextId: 1,
    rng: { next: () => 0, int: () => 0 },
  };
}

const close = (a: number, b: number) => Math.abs(a - b) < 1e-9;
const mark = (id: number, satisfied: boolean): Mark => ({ id, pos: { x: id, y: 0 }, satisfied });

describe('stepWaves', () => {
  it('phase placing : décompte timeLeft sans changer de phase', () => {
    const s = makeState({ phase: 'placing', timeLeft: 10 });
    stepWaves(s, LEVEL, 1);
    expect(s.phase).toBe('placing');
    expect(close(s.timeLeft, 9)).toBe(true);
  });

  it('placing -> rush quand timeLeft atteint 0 (timeLeft=duration, waveTime=0)', () => {
    const s = makeState({ phase: 'placing', timeLeft: 0.5, waveTime: 99 });
    stepWaves(s, LEVEL, 0.5); // timeLeft -> 0 -> bascule
    expect(s.phase).toBe('rush');
    expect(s.timeLeft).toBe(LEVEL.wave.duration);
    expect(s.waveTime).toBe(0);
  });

  it('placing -> rush aussi si dt dépasse largement (timeLeft <= 0)', () => {
    const s = makeState({ phase: 'placing', timeLeft: 0.2 });
    stepWaves(s, LEVEL, 5);
    expect(s.phase).toBe('rush');
    expect(s.timeLeft).toBe(LEVEL.wave.duration);
  });

  it('phase rush : avance waveTime et décompte timeLeft', () => {
    const s = makeState({ phase: 'rush', timeLeft: 18, waveTime: 0 });
    stepWaves(s, LEVEL, 2);
    expect(s.phase).toBe('rush');
    expect(close(s.waveTime, 2)).toBe(true);
    expect(close(s.timeLeft, 16)).toBe(true);
  });

  it('rush -> lost dès que worker.lives <= 0', () => {
    const s = makeState({ phase: 'rush', timeLeft: 18, lives: 0, marks: [mark(0, true)] });
    stepWaves(s, LEVEL, 1);
    expect(s.phase).toBe('lost');
  });

  it('rush -> won si toutes les marks satisfaites à la fin du rush', () => {
    const s = makeState({
      phase: 'rush',
      timeLeft: 0.5,
      marks: [mark(0, true), mark(1, true)],
    });
    stepWaves(s, LEVEL, 1); // timeLeft -> <=0
    expect(s.phase).toBe('won');
  });

  it('rush -> lost si le temps est écoulé mais une mark reste non satisfaite', () => {
    const s = makeState({
      phase: 'rush',
      timeLeft: 0.5,
      marks: [mark(0, true), mark(1, false)],
    });
    stepWaves(s, LEVEL, 1);
    expect(s.phase).toBe('lost');
  });

  it('rush : la perte de vie prime sur la fin de temps', () => {
    const s = makeState({
      phase: 'rush',
      timeLeft: 0.5,
      lives: 0,
      marks: [mark(0, true)],
    });
    stepWaves(s, LEVEL, 1);
    expect(s.phase).toBe('lost');
  });

  it('rush : pas de marks -> won à l\'échéance (every sur tableau vide)', () => {
    const s = makeState({ phase: 'rush', timeLeft: 0.5, marks: [] });
    stepWaves(s, LEVEL, 1);
    expect(s.phase).toBe('won');
  });

  it('phases terminales won/lost : no-op total', () => {
    for (const phase of ['won', 'lost'] as Phase[]) {
      const s = makeState({ phase, timeLeft: 5, waveTime: 3 });
      stepWaves(s, LEVEL, 10);
      expect(s.phase).toBe(phase);
      expect(s.timeLeft).toBe(5);
      expect(s.waveTime).toBe(3);
    }
  });

  it('ne throw jamais', () => {
    const s = makeState();
    expect(() => stepWaves(s, LEVEL, 0.016)).not.toThrow();
  });
});
