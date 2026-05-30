// main.ts — point d'entrée : boot + game loop.
import { createFixedLoop } from './core';
import { LEVEL_01 } from './data/levels';
import { createPlayScene } from './scenes/play';

function boot(): void {
  const canvas = document.getElementById('game');
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error('main: <canvas id="game"> introuvable');
  }

  // La scène possède son renderer (interface gravée : update + render seulement).
  // Sur resize on recrée donc la scène — option « au plus simple » prévue par la
  // spec — ce qui réinitialise le rendu à la bonne taille. Effet de bord : la
  // partie repart à zéro. Acceptable pour le prototype (resize rare en jeu).
  let scene = createPlayScene(canvas, LEVEL_01);
  window.addEventListener('resize', () => {
    scene = createPlayScene(canvas, LEVEL_01);
  });

  const loop = createFixedLoop(
    (dt) => scene.update(dt),
    (alpha) => scene.render(alpha),
  );
  loop.start();
}

boot();
