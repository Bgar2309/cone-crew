/* CONE CREW — sprites.js : optional AI-art sprites (assets/img/) with vector fallback.
   Every consumer checks CC.sprites.has(key) and falls back to the original
   procedural drawing, so the game stays fully playable if images are missing. */
(function () {
  'use strict';
  const CC = (window.CC = window.CC || {});

  const FILES = {
    cone:    'assets/img/cone.png',
    truck:   'assets/img/truck.png',
    bgMenu:  'assets/img/bg-menu.jpg',
    bgDusk:  'assets/img/bg-dusk.jpg',
    bgNight: 'assets/img/bg-night.jpg',
    bgDepot: 'assets/img/bg-depot.jpg'
  };

  const img = {};
  const ready = {};
  const white = {};

  const S = {
    has: (k) => ready[k] === true,
    get: (k) => img[k],

    // white silhouette of a sprite (for retro-reflective flashes), cached
    silhouette(k) {
      if (white[k]) return white[k];
      if (!S.has(k) || typeof document === 'undefined') return null;
      const im = img[k];
      const c = document.createElement('canvas');
      c.width = im.naturalWidth || im.width;
      c.height = im.naturalHeight || im.height;
      const x = c.getContext && c.getContext('2d');
      if (!x || !x.drawImage) return null;
      x.drawImage(im, 0, 0);
      x.globalCompositeOperation = 'source-in';
      x.fillStyle = '#FFFFFF';
      x.fillRect(0, 0, c.width, c.height);
      white[k] = c;
      return c;
    },

    // Draw image covering the rect (x,y,w,h), clipped to it. The image line at
    // fraction `fy` of its height is pinned to the rect's bottom edge (fy=1 →
    // bottom-aligned; fy=0.8 → the lower 20% of the image spills below the rect,
    // useful to pin a horizon/floor line). Returns false if the image isn't ready.
    cover(ctx, k, x, y, w, h, fy) {
      if (!S.has(k)) return false;
      const im = img[k];
      const iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height;
      if (!iw || !ih) return false;
      fy = fy == null ? 1 : fy;
      const s = Math.max(w / iw, h / (ih * fy));
      const dw = iw * s, dh = ih * s;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();
      ctx.drawImage(im, x + (w - dw) / 2, y + h - dh * fy, dw, dh);
      ctx.restore();
      return true;
    }
  };

  // Headless/test environments have no Image: keys just stay "not ready".
  if (typeof Image !== 'undefined') {
    for (const k of Object.keys(FILES)) {
      const im = new Image();
      im.onload = () => { ready[k] = true; };
      im.onerror = () => { ready[k] = false; };
      im.src = FILES[k];
      img[k] = im;
    }
  }

  CC.sprites = S;
})();
