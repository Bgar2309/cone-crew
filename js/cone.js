/* CONE CREW — cone.js : the REVO 42 R2, rendered properly.
   Curved silhouette with flared foot + knurled collar, cylindrical shading,
   retro-reflective bands with sparkle, bevelled rubber base, soft contact shadow.
   Upright cones are rendered once per size into an offscreen sprite and blitted,
   so the richer rendering is also cheaper than the old per-frame vector pass.   */
(function () {
  'use strict';
  const CC = (window.CC = window.CC || {});
  const { lerp, clamp, rr, TAU } = CC.util;
  const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  const ORANGE = '#FF4A1F';
  const ORANGE_DK = '#D63A12';
  const BAND = '#EDF1F6';
  const BASE = '#15171C';

  /* ---- geometry (all relative to total height h, base centre at origin) ---- */

  const GEO = {
    baseW: 0.62, baseH: 0.08,
    footHW: 0.255, footY: -0.045,
    kneeHW: 0.150, kneeY: -0.235,
    collarHW: 0.054, collarY: -0.855,
    neckHW: 0.046, neckY: -0.915,
    tipY: -0.965,
    bands: [ [-0.455, -0.295], [-0.665, -0.545] ]  // [topY, bottomY] in h units
  };

  // half-width of the body at a given y (h units), piecewise on the knots
  function halfW(y) {
    const g = GEO;
    if (y > g.kneeY) return lerp(g.kneeHW, g.footHW, (y - g.kneeY) / (g.footY - g.kneeY));
    if (y > g.collarY) return lerp(g.collarHW, g.kneeHW, (y - g.collarY) / (g.kneeY - g.collarY));
    return lerp(g.neckHW, g.collarHW, (y - g.neckY) / (g.collarY - g.neckY));
  }

  function bodyPath(c, h) {
    const g = GEO;
    c.beginPath();
    c.moveTo(-g.footHW * h, g.footY * h);
    // flared foot → knee (concave)
    c.quadraticCurveTo(-g.footHW * 0.86 * h, -0.17 * h, -g.kneeHW * h, g.kneeY * h);
    // long gentle taper to the collar
    c.quadraticCurveTo(-0.092 * h, -0.575 * h, -g.collarHW * h, g.collarY * h);
    // collar → neck → rounded tip
    c.lineTo(-g.neckHW * h, g.neckY * h);
    c.quadraticCurveTo(-g.neckHW * h, g.tipY * h, 0, g.tipY * h);
    c.quadraticCurveTo(g.neckHW * h, g.tipY * h, g.neckHW * h, g.neckY * h);
    c.lineTo(g.collarHW * h, g.collarY * h);
    c.quadraticCurveTo(0.092 * h, -0.575 * h, g.kneeHW * h, g.kneeY * h);
    c.quadraticCurveTo(g.footHW * 0.86 * h, -0.17 * h, g.footHW * h, g.footY * h);
    c.closePath();
  }

  /* ----------------------------- sprite painting ----------------------------- */

  function paintBase(c, h) {
    const g = GEO;
    const bw = g.baseW * h, bh = g.baseH * h;
    const grad = c.createLinearGradient(0, -bh, 0, bh * 0.3);
    grad.addColorStop(0, '#2E323B');
    grad.addColorStop(0.45, '#1A1D23');
    grad.addColorStop(1, '#0C0E12');
    c.fillStyle = grad;
    rr(c, -bw / 2, -bh, bw, bh * 1.06, h * 0.028);
    c.fill();
    // top bevel catch-light
    c.fillStyle = 'rgba(255,255,255,0.13)';
    rr(c, -bw / 2 + h * 0.015, -bh, bw - h * 0.03, bh * 0.22, h * 0.02);
    c.fill();
    // soft AO where the body meets the rubber
    const ao = c.createRadialGradient(0, -bh, 0, 0, -bh, g.footHW * h * 1.15);
    ao.addColorStop(0, 'rgba(0,0,0,0.34)');
    ao.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = ao;
    c.save();
    c.translate(0, -bh);
    c.scale(1, 0.32);
    c.beginPath(); c.arc(0, 0, g.footHW * h * 1.15, 0, TAU); c.fill();
    c.restore();
  }

  function paintBody(c, h) {
    const g = GEO;

    c.save();
    bodyPath(c, h);
    c.clip();

    // base orange, lit slightly from above
    const v = c.createLinearGradient(0, g.tipY * h, 0, 0);
    v.addColorStop(0, '#FF6A33');
    v.addColorStop(0.45, '#FF5222');
    v.addColorStop(0.9, '#F2430F');
    v.addColorStop(1, '#D93C0C');
    c.fillStyle = v;
    c.fillRect(-g.footHW * h, g.tipY * h, g.footHW * 2 * h, -g.tipY * h + 2);

    // reflective bands (under the cylindrical shading so the form reads unified)
    for (let bi = 0; bi < g.bands.length; bi++) {
      const [y1, y2] = g.bands[bi];           // y1 = top (more negative)
      const top = y1 * h, bot = y2 * h;
      const bg = c.createLinearGradient(0, top, 0, bot);
      bg.addColorStop(0, '#FFFFFF');
      bg.addColorStop(0.18, '#F2F6FA');
      bg.addColorStop(0.72, '#DCE4ED');
      bg.addColorStop(1, '#B9C4D2');
      c.fillStyle = bg;
      c.fillRect(-g.footHW * h, top, g.footHW * 2 * h, bot - top);
      // seams where the sleeve meets the PVC
      c.fillStyle = 'rgba(60,25,8,0.30)';
      c.fillRect(-g.footHW * h, top, g.footHW * 2 * h, Math.max(1, h * 0.006));
      c.fillRect(-g.footHW * h, bot - Math.max(1, h * 0.006), g.footHW * 2 * h, Math.max(1, h * 0.006));
      // retro-reflective micro-sparkle (deterministic)
      const mid = (y1 + y2) / 2;
      const hw = halfW(mid) * h;
      for (let i = 0; i < 9; i++) {
        const sx = (hash(bi * 31 + i) * 2 - 1) * hw * 0.82;
        const sy = lerp(top, bot, 0.15 + 0.7 * hash(bi * 57 + i + 19));
        c.fillStyle = `rgba(255,255,255,${0.25 + hash(i + bi * 7) * 0.4})`;
        c.fillRect(sx, sy, Math.max(1, h * 0.007), Math.max(1, h * 0.007));
      }
      // diagonal sheen across the band
      const sh = c.createLinearGradient(-hw, top, hw * 0.4, bot);
      sh.addColorStop(0, 'rgba(255,255,255,0)');
      sh.addColorStop(0.5, 'rgba(255,255,255,0.30)');
      sh.addColorStop(0.62, 'rgba(255,255,255,0)');
      c.fillStyle = sh;
      c.fillRect(-g.footHW * h, top, g.footHW * 2 * h, bot - top);
    }

    // knurled collar near the tip
    const cy1 = g.collarY * h, cy2 = g.neckY * h;
    c.fillStyle = 'rgba(160,50,10,0.30)';
    c.fillRect(-g.collarHW * h * 1.2, cy2, g.collarHW * 2.4 * h, cy1 - cy2);
    c.strokeStyle = 'rgba(60,20,5,0.30)';
    c.lineWidth = Math.max(0.8, h * 0.007);
    for (let i = 1; i <= 3; i++) {
      const yy = lerp(cy1, cy2, i / 4);
      c.beginPath();
      c.moveTo(-halfW(yy / h) * h, yy);
      c.lineTo(halfW(yy / h) * h, yy);
      c.stroke();
    }

    // cylindrical shading across everything: core shadow left, specular, falloff right
    const cyl = c.createLinearGradient(-g.footHW * h, 0, g.footHW * h, 0);
    cyl.addColorStop(0.00, 'rgba(95,28,6,0.50)');
    cyl.addColorStop(0.14, 'rgba(80,25,8,0.16)');
    cyl.addColorStop(0.26, 'rgba(255,240,225,0.32)');
    cyl.addColorStop(0.34, 'rgba(255,225,200,0.10)');
    cyl.addColorStop(0.52, 'rgba(255,255,255,0)');
    cyl.addColorStop(0.80, 'rgba(85,22,6,0.16)');
    cyl.addColorStop(1.00, 'rgba(70,18,4,0.48)');
    c.fillStyle = cyl;
    c.fillRect(-g.footHW * h, g.tipY * h, g.footHW * 2 * h, -g.tipY * h + 2);

    // grounded foot AO
    const fa = c.createLinearGradient(0, -0.10 * h, 0, 0);
    fa.addColorStop(0, 'rgba(0,0,0,0)');
    fa.addColorStop(1, 'rgba(40,8,0,0.30)');
    c.fillStyle = fa;
    c.fillRect(-g.footHW * h, -0.10 * h, g.footHW * 2 * h, 0.10 * h + 2);

    c.restore();

    // tip specular dot
    c.fillStyle = 'rgba(255,255,255,0.45)';
    c.beginPath();
    c.arc(-h * 0.012, (g.tipY + 0.012) * h, Math.max(1, h * 0.011), 0, TAU);
    c.fill();

    // soft outline
    bodyPath(c, h);
    c.strokeStyle = 'rgba(58,18,4,0.42)';
    c.lineWidth = Math.max(1, h * 0.011);
    c.stroke();
  }

  function renderCone(c, h) {
    paintBase(c, h);
    paintBody(c, h);
  }

  function renderGhost(c, h) {
    const g = GEO;
    bodyPath(c, h);
    c.fillStyle = 'rgba(255,74,31,0.10)';
    c.fill();
    c.setLineDash([h * 0.07, h * 0.05]);
    c.lineWidth = Math.max(1.5, h * 0.028);
    c.strokeStyle = 'rgba(255,128,80,0.95)';
    c.stroke();
    c.setLineDash([]);
    rr(c, -g.baseW * h / 2, -g.baseH * h, g.baseW * h, g.baseH * h, h * 0.025);
    c.stroke();
  }

  /* ------------------------------- sprite cache ------------------------------ */

  const SPRITES = new Map();

  function getSprite(h, ghost) {
    h = Math.max(8, Math.round(h));
    const dpr = Math.min((CC.view && CC.view.dpr) || 1, 2);
    const key = h + '|' + (ghost ? 1 : 0) + '|' + dpr;
    let s = SPRITES.get(key);
    if (s) return s;
    if (SPRITES.size > 48) SPRITES.clear();

    const w = Math.ceil(GEO.baseW * h + h * 0.10);
    const hh = Math.ceil(h * 1.04);
    const ox = w / 2, oy = h * 1.0;
    const cv = document.createElement('canvas');
    cv.width = Math.max(1, Math.round(w * dpr));
    cv.height = Math.max(1, Math.round(hh * dpr));
    const c = cv.getContext('2d');
    if (c) {
      c.scale(dpr, dpr);
      c.translate(ox, oy);
      if (ghost) renderGhost(c, h); else renderCone(c, h);
    }
    s = { cv, w, hh, ox, oy };
    SPRITES.set(key, s);
    return s;
  }

  /* ---------------------------------- draw ---------------------------------- */

  // o: { x, y (base centre on ground), h, tilt, squash, lie (0..1), lieDir (±1),
  //      alpha, ghost, face, blink, look, flash (0..1 band glow), shadow }
  function draw(ctx, o) {
    const h = o.h;
    const lie = o.lie || 0;
    const lieDir = o.lieDir || 1;
    const alpha = o.alpha == null ? 1 : o.alpha;
    const baseW = GEO.baseW * h;

    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.globalAlpha = alpha;

    // soft contact shadow (stays on the ground)
    if (o.shadow !== false && !o.ghost) {
      const sx = lie * lieDir * h * 0.34;
      const rx = baseW * (0.58 + lie * 0.85 + (o.squash || 0) * 0.5);
      CC.tex.softShadow(ctx, sx, GEO.baseH * h * 0.3, rx, rx * 0.26, 0.36 * alpha);
    }

    // tip over the base edge when lying
    if (lie > 0) {
      const px = lieDir * baseW * 0.5;
      ctx.translate(px, 0);
      ctx.rotate(lieDir * lie * 1.42);
      ctx.translate(-px, 0);
    }
    if (o.tilt) ctx.rotate(o.tilt);
    if (o.squash) {
      const s = clamp(o.squash, 0, 0.4);
      ctx.scale(1 + s * 0.7, 1 - s);
    }

    const spr = getSprite(h, o.ghost);
    ctx.drawImage(spr.cv, -spr.ox, -spr.oy, spr.w, spr.hh);

    // headlight flash on the reflective bands (additive, on top of the sprite)
    const flash = o.flash || 0;
    if (flash > 0.02 && !o.ghost) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const [y1, y2] of GEO.bands) {
        const top = y1 * h, bot = y2 * h;
        const mid = (top + bot) / 2;
        const hw = halfW((y1 + y2) / 2) * h;
        ctx.globalAlpha = alpha * flash * 0.85;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-hw, top, hw * 2, bot - top);
        const gl = ctx.createRadialGradient(0, mid, 0, 0, mid, hw * 2.6);
        gl.addColorStop(0, `rgba(255,250,235,${0.55 * flash})`);
        gl.addColorStop(1, 'rgba(255,250,235,0)');
        ctx.globalAlpha = alpha;
        ctx.fillStyle = gl;
        ctx.beginPath();
        ctx.arc(0, mid, hw * 2.6, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }

    // mascot face (menus only)
    if (o.face) {
      const ey = -0.50 * h;
      const ex = h * 0.062;
      const er = h * 0.048;
      const blink = clamp(o.blink || 0, 0, 1);
      const lookX = ((o.look && o.look.x) || 0) * er * 0.45;
      const lookY = ((o.look && o.look.y) || 0) * er * 0.45;
      for (const s of [-1, 1]) {
        ctx.save();
        ctx.translate(s * ex, ey);
        ctx.scale(1, 1 - blink * 0.92);
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(0, 0, er, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.beginPath(); ctx.arc(0, -er * 0.55, er, 0, TAU); ctx.arc(0, 0, er, 0, TAU, true); ctx.fill();
        ctx.fillStyle = '#1A1D23';
        ctx.beginPath(); ctx.arc(lookX, lookY, er * 0.46, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath(); ctx.arc(lookX + er * 0.16, lookY - er * 0.16, er * 0.13, 0, TAU); ctx.fill();
        ctx.restore();
      }
      ctx.strokeStyle = '#1A1D23';
      ctx.lineWidth = Math.max(1.2, h * 0.016);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, ey + h * 0.045, h * 0.045, 0.25 * Math.PI, 0.75 * Math.PI);
      ctx.stroke();
    }

    ctx.restore();
  }

  CC.cone = {
    draw,
    width: (h) => h * 0.62,
    ORANGE, ORANGE_DK, BAND, BASE
  };
})();
