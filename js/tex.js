/* CONE CREW — tex.js : shared texture/lighting helpers (grain, asphalt, soft shadows, glows) */
(function () {
  'use strict';
  const CC = (window.CC = window.CC || {});
  const { TAU } = CC.util;

  // deterministic pseudo-random (stable speckle between frames/sessions)
  function hash(n) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  function makeTile(size, painter) {
    const cv = document.createElement('canvas');
    cv.width = size; cv.height = size;
    const c = cv.getContext('2d');
    if (c) painter(c, size);
    return cv;
  }

  let grainTile = null;
  function grain() {
    if (!grainTile) {
      grainTile = makeTile(160, (c, s) => {
        for (let i = 0; i < 1500; i++) {
          const x = hash(i) * s, y = hash(i + 9000) * s;
          const l = hash(i + 4000);
          c.fillStyle = l > 0.5
            ? `rgba(255,255,255,${0.25 + l * 0.35})`
            : `rgba(0,0,0,${0.3 + l * 0.4})`;
          c.fillRect(x, y, 1, 1);
        }
      });
    }
    return grainTile;
  }

  let asphaltTile = null;
  function asphalt() {
    if (!asphaltTile) {
      asphaltTile = makeTile(200, (c, s) => {
        for (let i = 0; i < 2400; i++) {
          const x = hash(i + 100) * s, y = hash(i + 7100) * s;
          const l = hash(i + 3300);
          const g = Math.round(120 + l * 110);
          c.fillStyle = l > 0.82
            ? `rgba(${g},${g},${g},0.5)`
            : `rgba(8,10,14,${0.25 + l * 0.4})`;
          c.fillRect(x, y, l > 0.94 ? 2 : 1, 1);
        }
      });
    }
    return asphaltTile;
  }

  function pattern(ctx, tile) {
    if (!tile._pat) {
      try { tile._pat = ctx.createPattern(tile, 'repeat'); } catch (e) { tile._pat = null; }
    }
    return tile._pat;
  }

  // film grain over a region — kills the flat-vector look
  function overlay(ctx, x, y, w, h, alpha, tile) {
    const p = pattern(ctx, tile || grain());
    if (!p) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }

  // soft elliptical contact shadow (radial gradient, no hard edge)
  function softShadow(ctx, x, y, rx, ry, alpha) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, rx);
    g.addColorStop(0, `rgba(0,0,0,${alpha})`);
    g.addColorStop(0.65, `rgba(0,0,0,${alpha * 0.55})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, ry / rx);
    ctx.translate(-x, -y);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, rx, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  // additive light glow
  function glow(ctx, x, y, r, rgb, alpha) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rgb},${alpha})`);
    g.addColorStop(0.5, `rgba(${rgb},${alpha * 0.35})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  CC.tex = { hash, grain, asphalt, overlay, softShadow, glow, pattern };
})();
