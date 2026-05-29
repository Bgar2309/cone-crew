// @vitest-environment node
// Tests de stepTraffic : spawn cadencé, déplacement, cleanup hors-grille, garde de phase.
import { describe, it, expect } from 'vitest';
import { stepTraffic } from '../traffic';
import type { GameState, Lane, Phase, Vehicle } from '../../../core/types';
import type { WaveDef } from '../../../data/levels/types';

const WAVE: WaveDef = { spawnInterval: 1, speed: 4, duration: 18 };

/** Construit un GameState minimal centré sur le trafic (seuls vehicles/nextId sont mutés). */
function makeState(opts: {
  phase?: Phase;
  lanes?: Lane[];
  vehicles?: Vehicle[];
  nextId?: number;
  rngInt?: (maxExcl: number) => number;
} = {}): GameState {
  return {
    worker: { pos: { x: 0, y: 0 }, dir: 'S', moving: false, placing: 0, lives: 3, invuln: 0 },
    vehicles: opts.vehicles ?? [],
    cones: [],
    marks: [],
    lanes: opts.lanes ?? [{ id: 0, axis: 'x', offset: 3, dirSign: 1 }],
    phase: opts.phase ?? 'rush',
    timeLeft: 60,
    waveTime: 0,
    score: 0,
    conesLeft: 0,
    nextId: opts.nextId ?? 1,
    rng: { next: () => 0, int: opts.rngInt ?? (() => 0) },
  };
}

const close = (a: number, b: number) => Math.abs(a - b) < 1e-9;

describe('stepTraffic', () => {
  it('ne spawne rien hors de la phase rush', () => {
    for (const phase of ['placing', 'won', 'lost'] as Phase[]) {
      const s = makeState({ phase });
      // Beaucoup de temps écoulé : aucun spawn ne doit avoir lieu.
      stepTraffic(s, WAVE, 100);
      expect(s.vehicles).toHaveLength(0);
      expect(s.nextId).toBe(1);
    }
  });

  it('spawne un véhicule à chaque intervalle (cadence)', () => {
    const s = makeState();
    // Pas plus petits que l'intervalle : pas de spawn avant d'atteindre spawnInterval.
    stepTraffic(s, WAVE, 0.5);
    expect(s.vehicles).toHaveLength(0);
    stepTraffic(s, WAVE, 0.5); // acc = 1.0 -> 1 spawn
    expect(s.vehicles).toHaveLength(1);
    stepTraffic(s, WAVE, 0.99);
    expect(s.vehicles).toHaveLength(1); // acc = 0.99 < 1
    stepTraffic(s, WAVE, 0.01);
    expect(s.vehicles).toHaveLength(2);
  });

  it('spawne plusieurs véhicules si dt couvre plusieurs intervalles', () => {
    const s = makeState();
    // speed faible pour qu'aucun véhicule fraîchement spawné ne quitte la grille ce pas.
    stepTraffic(s, { ...WAVE, speed: 1 }, 3.2); // 3 intervalles entiers
    expect(s.vehicles).toHaveLength(3);
    expect(s.nextId).toBe(4); // ids 1,2,3 consommés
    // ids uniques et croissants
    expect(s.vehicles.map((v) => v.id)).toEqual([1, 2, 3]);
  });

  it('place le véhicule au bon point d\'entrée selon dirSign', () => {
    // dt minuscule : on observe le point d'entrée avant tout déplacement notable.
    const tiny = { spawnInterval: 0.001, speed: 4, duration: 18 };

    // dirSign=1 sur axe x : entrée par le bord bas (x négatif, hors-grille), à l'offset y.
    const right = makeState({ lanes: [{ id: 0, axis: 'x', offset: 3, dirSign: 1 }] });
    stepTraffic(right, tiny, 0.001);
    expect(right.vehicles[0].pos.y).toBe(3);
    expect(right.vehicles[0].pos.x).toBeLessThan(0);

    // dirSign=-1 sur axe y : entrée par le bord haut (y > grille), à l'offset x.
    const up = makeState({ lanes: [{ id: 0, axis: 'y', offset: 5, dirSign: -1 }] });
    stepTraffic(up, tiny, 0.001);
    expect(up.vehicles[0].pos.x).toBe(5);
    expect(up.vehicles[0].pos.y).toBeGreaterThan(8);
  });

  it('utilise rng.int pour choisir parmi plusieurs lanes', () => {
    const lanes: Lane[] = [
      { id: 0, axis: 'x', offset: 1, dirSign: 1 },
      { id: 1, axis: 'x', offset: 5, dirSign: -1 },
    ];
    const s = makeState({ lanes, rngInt: () => 1 });
    stepTraffic(s, WAVE, 1);
    expect(s.vehicles[0].laneId).toBe(1);
  });

  it('avance chaque véhicule le long de son axe (pos += speed*dirSign*dt)', () => {
    const vehicles: Vehicle[] = [
      { id: 10, pos: { x: 2, y: 3 }, laneId: 0, speed: 4, kind: 'car', width: 1.6, length: 0.9 },
    ];
    // dirSign=1, speed=4, dt=0.5 -> +2 sur x. spawnInterval grand pour éviter un spawn parasite.
    const s = makeState({ vehicles, lanes: [{ id: 0, axis: 'x', offset: 3, dirSign: 1 }] });
    stepTraffic(s, { ...WAVE, spawnInterval: 1000 }, 0.5);
    expect(close(s.vehicles[0].pos.x, 4)).toBe(true);
    expect(s.vehicles[0].pos.y).toBe(3);
  });

  it('recule un véhicule dirSign=-1', () => {
    const vehicles: Vehicle[] = [
      { id: 11, pos: { x: 5, y: 2 }, laneId: 0, speed: 4, kind: 'car', width: 1.6, length: 0.9 },
    ];
    const s = makeState({ vehicles, lanes: [{ id: 0, axis: 'y', offset: 5, dirSign: -1 }] });
    stepTraffic(s, { ...WAVE, spawnInterval: 1000 }, 0.5);
    expect(close(s.vehicles[0].pos.y, 0)).toBe(true);
  });

  it('supprime les véhicules sortis de [-2, 10] sur leur axe', () => {
    const vehicles: Vehicle[] = [
      // déjà au-delà de la borne haute -> supprimé
      { id: 1, pos: { x: 11, y: 3 }, laneId: 0, speed: 0, kind: 'car', width: 1.6, length: 0.9 },
      // sous la borne basse -> supprimé
      { id: 2, pos: { x: -3, y: 3 }, laneId: 0, speed: 0, kind: 'car', width: 1.6, length: 0.9 },
      // dans la grille -> conservé
      { id: 3, pos: { x: 4, y: 3 }, laneId: 0, speed: 0, kind: 'car', width: 1.6, length: 0.9 },
    ];
    const s = makeState({ vehicles, lanes: [{ id: 0, axis: 'x', offset: 3, dirSign: 1 }] });
    stepTraffic(s, { ...WAVE, spawnInterval: 1000 }, 0);
    expect(s.vehicles.map((v) => v.id)).toEqual([3]);
  });

  it('supprime un véhicule qui franchit la borne via son déplacement', () => {
    const vehicles: Vehicle[] = [
      { id: 7, pos: { x: 9.5, y: 3 }, laneId: 0, speed: 4, kind: 'car', width: 1.6, length: 0.9 },
    ];
    const s = makeState({ vehicles, lanes: [{ id: 0, axis: 'x', offset: 3, dirSign: 1 }] });
    // 9.5 + 4*1*1 = 13.5 > 10 -> supprimé
    stepTraffic(s, { ...WAVE, spawnInterval: 1000 }, 1);
    expect(s.vehicles).toHaveLength(0);
  });

  it('ne throw jamais (cas sans lane)', () => {
    const s = makeState({ lanes: [] });
    expect(() => stepTraffic(s, WAVE, 5)).not.toThrow();
    expect(s.vehicles).toHaveLength(0);
  });
});
