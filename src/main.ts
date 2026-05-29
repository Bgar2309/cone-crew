// main.ts — SQUELETTE. Point d'entrée : boot + game loop.
import { createFixedLoop } from './core';
import { LEVEL_01 } from './data/levels';
import { createPlayScene } from './scenes/play';

function boot(): void {
  // TODO:
  //  - récupérer <canvas id="game">
  //  - const scene = createPlayScene(canvas, LEVEL_01)
  //  - gérer window 'resize'
  //  - const loop = createFixedLoop(scene.update, scene.render); loop.start();
  throw new Error('boot not implemented');
}

boot();
