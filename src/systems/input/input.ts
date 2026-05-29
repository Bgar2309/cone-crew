// systems/input/input.ts — Clavier -> intention. Ne mute pas le monde.
import type { Vec2 } from '../../core/types';

export interface Intent {
  move: Vec2;     // composantes dans {-1,0,1}
  place: boolean; // le joueur veut poser un cône ce tick (front montant)
}

// Mapping des `KeyboardEvent.code` vers les directions de déplacement.
const LEFT_CODES: ReadonlySet<string> = new Set(['KeyA', 'ArrowLeft']);
const RIGHT_CODES: ReadonlySet<string> = new Set(['KeyD', 'ArrowRight']);
const UP_CODES: ReadonlySet<string> = new Set(['KeyW', 'ArrowUp']);
const DOWN_CODES: ReadonlySet<string> = new Set(['KeyS', 'ArrowDown']);
const PLACE_CODES: ReadonlySet<string> = new Set(['Space']);

// Touches qui font scroller la page par défaut : on annule ce comportement.
const PREVENT_DEFAULT_CODES: ReadonlySet<string> = new Set([
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Space',
]);

export function createInput(): { read(): Intent; dispose(): void } {
  // Touches de déplacement actuellement maintenues (par `code`).
  const held: Set<string> = new Set();
  // État maintenu d'Espace, pour distinguer un nouvel appui d'une répétition clavier.
  let placeHeld = false;
  // Front montant en attente : passe à true à l'appui, consommé par read().
  let placeEdge = false;

  const onKeyDown = (e: KeyboardEvent): void => {
    if (PREVENT_DEFAULT_CODES.has(e.code)) {
      e.preventDefault();
    }
    if (PLACE_CODES.has(e.code)) {
      // Ignore l'auto-répétition : un seul front par appui physique.
      if (!placeHeld) {
        placeHeld = true;
        placeEdge = true;
      }
      return;
    }
    held.add(e.code);
  };

  const onKeyUp = (e: KeyboardEvent): void => {
    if (PREVENT_DEFAULT_CODES.has(e.code)) {
      e.preventDefault();
    }
    if (PLACE_CODES.has(e.code)) {
      placeHeld = false;
      return;
    }
    held.delete(e.code);
  };

  const anyHeld = (codes: ReadonlySet<string>): boolean => {
    for (const code of codes) {
      if (held.has(code)) return true;
    }
    return false;
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  return {
    read(): Intent {
      const x = (anyHeld(RIGHT_CODES) ? 1 : 0) - (anyHeld(LEFT_CODES) ? 1 : 0);
      const y = (anyHeld(DOWN_CODES) ? 1 : 0) - (anyHeld(UP_CODES) ? 1 : 0);
      const place = placeEdge;
      placeEdge = false; // consommé : false tant qu'aucun nouvel appui.
      return { move: { x, y }, place };
    },
    dispose(): void {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      held.clear();
      placeHeld = false;
      placeEdge = false;
    },
  };
}
