// core/clock.ts — boucle à pas de temps fixe avec interpolation.
import { TICK } from './constants';

export function createFixedLoop(
  update: (dt: number) => void,
  render: (alpha: number) => void,
): { start(): void; stop(): void } {
  let raf = 0;
  let last = 0;
  let acc = 0;
  let running = false;

  const frame = (now: number): void => {
    if (!running) return;
    const elapsed = Math.min((now - last) / 1000, 0.25); // anti spirale
    last = now;
    acc += elapsed;
    while (acc >= TICK) {
      update(TICK);
      acc -= TICK;
    }
    render(acc / TICK);
    raf = requestAnimationFrame(frame);
  };

  return {
    start(): void {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    },
    stop(): void {
      running = false;
      cancelAnimationFrame(raf);
    },
  };
}
