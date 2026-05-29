// @vitest-environment node
// Tests de createInput : on simule un `window` minimal (le projet n'embarque
// pas de DOM côté tests) et on dispatche des évènements façon KeyboardEvent.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createInput } from '../input';

type Listener = (e: KeyboardEvent) => void;

/** Faux `window` : un simple bus d'évènements keydown/keyup. */
class MockWindow {
  private listeners: Record<string, Set<Listener>> = {};

  addEventListener(type: string, fn: Listener): void {
    (this.listeners[type] ??= new Set()).add(fn);
  }

  removeEventListener(type: string, fn: Listener): void {
    this.listeners[type]?.delete(fn);
  }

  /** Nombre total de handlers enregistrés (pour vérifier dispose()). */
  count(): number {
    return Object.values(this.listeners).reduce((n, s) => n + s.size, 0);
  }

  emit(type: string, code: string): { defaultPrevented: boolean } {
    let defaultPrevented = false;
    const event = {
      code,
      key: code,
      preventDefault(): void {
        defaultPrevented = true;
      },
    } as unknown as KeyboardEvent;
    for (const fn of this.listeners[type] ?? []) fn(event);
    return { defaultPrevented };
  }
}

let mock: MockWindow;

beforeEach(() => {
  mock = new MockWindow();
  (globalThis as { window?: unknown }).window = mock;
});

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
});

describe('createInput - move', () => {
  it('renvoie {0,0} au repos', () => {
    const input = createInput();
    expect(input.read().move).toEqual({ x: 0, y: 0 });
    input.dispose();
  });

  it('mappe les flèches et WASD sur des composantes {-1,0,1}', () => {
    const input = createInput();

    mock.emit('keydown', 'ArrowLeft');
    expect(input.read().move).toEqual({ x: -1, y: 0 });

    mock.emit('keyup', 'ArrowLeft');
    mock.emit('keydown', 'KeyD');
    expect(input.read().move).toEqual({ x: 1, y: 0 });

    mock.emit('keydown', 'KeyW');
    expect(input.read().move).toEqual({ x: 1, y: -1 });

    input.dispose();
  });

  it('combine gauche + haut (diagonale)', () => {
    const input = createInput();
    mock.emit('keydown', 'KeyA');
    mock.emit('keydown', 'ArrowUp');
    expect(input.read().move).toEqual({ x: -1, y: -1 });
    input.dispose();
  });

  it('annule les axes opposés maintenus simultanément', () => {
    const input = createInput();
    mock.emit('keydown', 'KeyA');
    mock.emit('keydown', 'KeyD');
    expect(input.read().move).toEqual({ x: 0, y: 0 });
    input.dispose();
  });

  it('relâcher une touche met à jour move', () => {
    const input = createInput();
    mock.emit('keydown', 'KeyS');
    expect(input.read().move).toEqual({ x: 0, y: 1 });
    mock.emit('keyup', 'KeyS');
    expect(input.read().move).toEqual({ x: 0, y: 0 });
    input.dispose();
  });
});

describe('createInput - place (front montant)', () => {
  it('place=true une seule frame par appui', () => {
    const input = createInput();

    mock.emit('keydown', 'Space');
    expect(input.read().place).toBe(true);  // front consommé
    expect(input.read().place).toBe(false); // toujours maintenu -> plus de front

    input.dispose();
  });

  it('ne redéclenche pas sur auto-répétition (keydown répétés sans keyup)', () => {
    const input = createInput();

    mock.emit('keydown', 'Space');
    mock.emit('keydown', 'Space'); // répétition clavier
    expect(input.read().place).toBe(true);
    expect(input.read().place).toBe(false);

    input.dispose();
  });

  it('redéclenche après relâche puis réappui', () => {
    const input = createInput();

    mock.emit('keydown', 'Space');
    expect(input.read().place).toBe(true);

    mock.emit('keyup', 'Space');
    mock.emit('keydown', 'Space');
    expect(input.read().place).toBe(true);
    expect(input.read().place).toBe(false);

    input.dispose();
  });

  it('place est false sans aucun appui', () => {
    const input = createInput();
    expect(input.read().place).toBe(false);
    input.dispose();
  });
});

describe('createInput - preventDefault', () => {
  it('annule le scroll sur flèches et Espace', () => {
    const input = createInput();
    for (const code of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space']) {
      expect(mock.emit('keydown', code).defaultPrevented).toBe(true);
    }
    input.dispose();
  });

  it("n'interfère pas avec les autres touches (WASD, etc.)", () => {
    const input = createInput();
    for (const code of ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyP']) {
      expect(mock.emit('keydown', code).defaultPrevented).toBe(false);
    }
    input.dispose();
  });
});

describe('createInput - dispose', () => {
  it('retire les listeners et fige les lectures', () => {
    const input = createInput();
    expect(mock.count()).toBe(2);

    mock.emit('keydown', 'KeyD');
    input.dispose();
    expect(mock.count()).toBe(0);

    // Après dispose, plus aucun handler : les évènements n'ont plus d'effet.
    mock.emit('keydown', 'KeyA');
    mock.emit('keydown', 'Space');
    expect(input.read()).toEqual({ move: { x: 0, y: 0 }, place: false });
  });
});
