/* CONE CREW — cone.js : stylised EHS product cone
   Tall curved PVC body, two retro-reflective sleeves, ribbed collar,
   flared cap and a clearly visible black rubber foot. */
(function () {
  'use strict';
  const CC = (window.CC = window.CC || {});
  const { clamp, rr, TAU } = CC.util;

  const ORANGE = '#FF4218';
  const ORANGE_HI = '#FF7142';
  const ORANGE_DK = '#C92D0C';
  const BAND = '#E9EDF0';
  const BASE = '#15171A';

  function draw(ctx, o) {
    const h = o.h;
    const alpha = o.alpha == null ? 1 : o.alpha;
    const lie = o.lie || 0;
    const lieDir = o.lieDir || 1;

    const baseW = h * 0.59;
    const baseH = h * 0.072;
    const bodyBottom = -baseH * 0.78;
    const bodyTop = -h * 0.94;

    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.globalAlpha = alpha;

    if (o.shadow !== false && !o.ghost) {
      const sw = baseW * (0.48 + lie * 0.7);
      const sx = lie * lieDir * h * 0.33;
      const sg = ctx.createRadialGradient(sx, 0, 0, sx, 0, sw);
      sg.addColorStop(0, 'rgba(0,0,0,0.34)');
      sg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = sg;
      ctx.save();
      ctx.scale(1, 0.20);
      ctx.beginPath();
      ctx.arc(sx, baseH * 0.9, sw, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    if (lie > 0) {
      const px = lieDir * baseW * 0.47;
      ctx.translate(px, 0);
      ctx.rotate(lieDir * lie * 1.43);
      ctx.translate(-px, 0);
    }
    if (o.tilt) ctx.rotate(o.tilt);
    if (o.squash) {
      const s = clamp(o.squash, 0, 0.4);
      ctx.scale(1 + s * 0.68, 1 - s);
    }

    function halfWAt(t) {
      // Curved real-product silhouette: narrow neck, long taper, fuller lower skirt.
      const top = h * 0.043;
      const upper = h * 0.074;
      const mid = h * 0.142;
      const lower = h * 0.218;
      const foot = h * 0.258;
      if (t < 0.10) return top + (upper - top) * (t / 0.10);
      if (t < 0.58) return upper + (mid - upper) * ((t - 0.10) / 0.48);
      if (t < 0.88) return mid + (lower - mid) * ((t - 0.58) / 0.30);
      return lower + (foot - lower) * ((t - 0.88) / 0.12);
    }

    function yAt(t) { return bodyTop + (bodyBottom - bodyTop) * t; }

    function bodyPath() {
      ctx.beginPath();
      ctx.moveTo(-halfWAt(1), bodyBottom);
      ctx.bezierCurveTo(-h * 0.245, yAt(0.88), -h * 0.155, yAt(0.52), -h * 0.074, yAt(0.12));
      ctx.lineTo(-h * 0.051, bodyTop + h * 0.015);
      ctx.quadraticCurveTo(-h * 0.051, bodyTop, 0, bodyTop);
      ctx.quadraticCurveTo(h * 0.051, bodyTop, h * 0.051, bodyTop + h * 0.015);
      ctx.lineTo(h * 0.074, yAt(0.12));
      ctx.bezierCurveTo(h * 0.155, yAt(0.52), h * 0.245, yAt(0.88), halfWAt(1), bodyBottom);
      ctx.closePath();
    }

    function drawBase(strokeOnly) {
      const y = -baseH;
      rr(ctx, -baseW / 2, y, baseW, baseH * 1.06, h * 0.018);
      if (strokeOnly) {
        ctx.stroke();
        return;
      }
      const bg = ctx.createLinearGradient(0, y, 0, y + baseH);
      bg.addColorStop(0, '#32363B');
      bg.addColorStop(0.35, '#1D2024');
      bg.addColorStop(1, '#0B0C0E');
      ctx.fillStyle = bg;
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      rr(ctx, -baseW / 2 + h * 0.014, y + h * 0.006, baseW - h * 0.028, baseH * 0.18, h * 0.01);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.50)';
      ctx.lineWidth = Math.max(1, h * 0.009);
      rr(ctx, -baseW / 2, y, baseW, baseH * 1.06, h * 0.018);
      ctx.stroke();
    }

    if (o.ghost) {
      ctx.setLineDash([h * 0.055, h * 0.038]);
      ctx.lineWidth = Math.max(1.5, h * 0.022);
      ctx.strokeStyle = 'rgba(255,120,70,0.92)';
      ctx.fillStyle = 'rgba(255,66,24,0.09)';
      bodyPath(); ctx.fill(); ctx.stroke();
      drawBase(true);
      ctx.setLineDash([]);
      ctx.restore();
      return;
    }

    drawBase(false);

    bodyPath();
    const bodyGrad = ctx.createLinearGradient(-h * 0.22, 0, h * 0.23, 0);
    bodyGrad.addColorStop(0, ORANGE_DK);
    bodyGrad.addColorStop(0.18, ORANGE);
    bodyGrad.addColorStop(0.43, ORANGE_HI);
    bodyGrad.addColorStop(0.62, ORANGE);
    bodyGrad.addColorStop(1, '#B9270B');
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    ctx.save();
    bodyPath();
    ctx.clip();

    // Product layout: two broad reflective sleeves separated by orange PVC.
    const bands = [[0.24, 0.43], [0.61, 0.80]];
    const flash = o.flash || 0;
    for (const [a, b] of bands) {
      const y1 = yAt(a), y2 = yAt(b);
      const g = ctx.createLinearGradient(-h * 0.20, 0, h * 0.20, 0);
      g.addColorStop(0, '#AEB6BC');
      g.addColorStop(0.28, '#F7F8F8');
      g.addColorStop(0.50, '#FFFFFF');
      g.addColorStop(0.72, '#D7DDE1');
      g.addColorStop(1, '#8F989F');
      ctx.fillStyle = g;
      ctx.fillRect(-h * 0.29, y1, h * 0.58, y2 - y1);

      // Fine dotted suggestion of the retro-reflective material.
      ctx.fillStyle = 'rgba(82,92,100,0.24)';
      const step = Math.max(3, h * 0.025);
      const r = Math.max(0.55, h * 0.0032);
      for (let y = y1 + step * 0.45; y < y2; y += step) {
        const t = (y - bodyTop) / (bodyBottom - bodyTop);
        const hw = halfWAt(t);
        for (let x = -hw + step * 0.5; x < hw; x += step) {
          ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
        }
      }

      ctx.fillStyle = 'rgba(70,45,35,0.22)';
      ctx.fillRect(-h * 0.29, y1, h * 0.58, Math.max(1, h * 0.006));
      ctx.fillRect(-h * 0.29, y2 - Math.max(1, h * 0.006), h * 0.58, Math.max(1, h * 0.006));

      if (flash > 0.01) {
        ctx.save();
        ctx.globalAlpha = alpha * flash;
        ctx.shadowColor = '#FFFFFF';
        ctx.shadowBlur = h * 0.22;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-h * 0.29, y1, h * 0.58, y2 - y1);
        ctx.restore();
      }
    }

    // Narrow glossy highlight and broad right-side shade preserve readability at small sizes.
    ctx.fillStyle = 'rgba(255,255,255,0.20)';
    ctx.beginPath();
    ctx.moveTo(-h * 0.135, bodyBottom);
    ctx.bezierCurveTo(-h * 0.105, yAt(0.65), -h * 0.06, yAt(0.25), -h * 0.023, bodyTop);
    ctx.lineTo(h * 0.006, bodyTop);
    ctx.bezierCurveTo(-h * 0.018, yAt(0.30), -h * 0.036, yAt(0.68), -h * 0.058, bodyBottom);
    ctx.closePath(); ctx.fill();

    ctx.fillStyle = 'rgba(0,0,0,0.14)';
    ctx.beginPath();
    ctx.moveTo(h * 0.258, bodyBottom);
    ctx.bezierCurveTo(h * 0.19, yAt(0.62), h * 0.10, yAt(0.22), h * 0.05, bodyTop);
    ctx.lineTo(h * 0.022, bodyTop);
    ctx.bezierCurveTo(h * 0.07, yAt(0.30), h * 0.13, yAt(0.70), h * 0.17, bodyBottom);
    ctx.closePath(); ctx.fill();

    ctx.restore();

    // Ribbed collar and flared product cap.
    const collarTop = bodyTop + h * 0.016;
    const collarBottom = yAt(0.115);
    ctx.strokeStyle = 'rgba(92,22,8,0.40)';
    ctx.lineWidth = Math.max(1, h * 0.0065);
    for (let y = collarTop + h * 0.025; y < collarBottom; y += h * 0.017) {
      const t = (y - bodyTop) / (bodyBottom - bodyTop);
      const w = halfWAt(t) * 0.96;
      ctx.beginPath(); ctx.moveTo(-w, y); ctx.lineTo(w, y); ctx.stroke();
    }

    const neckY = bodyTop - h * 0.004;
    const capW = h * 0.112;
    const capH = h * 0.045;
    ctx.fillStyle = ORANGE;
    rr(ctx, -capW / 2, neckY - capH * 0.58, capW, capH, h * 0.012);
    ctx.fill();
    ctx.fillStyle = ORANGE_HI;
    ctx.beginPath();
    ctx.ellipse(0, neckY - capH * 0.58, capW * 0.48, capH * 0.22, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#7E1B09';
    ctx.beginPath();
    ctx.ellipse(0, neckY - capH * 0.57, capW * 0.31, capH * 0.12, 0, 0, TAU);
    ctx.fill();

    bodyPath();
    ctx.strokeStyle = 'rgba(70,20,8,0.30)';
    ctx.lineWidth = Math.max(1, h * 0.010);
    ctx.stroke();

    if (o.face) {
      const ey = yAt(0.51);
      const ex = h * 0.060;
      const er = h * 0.042;
      const blink = clamp(o.blink || 0, 0, 1);
      const lookX = ((o.look && o.look.x) || 0) * er * 0.42;
      const lookY = ((o.look && o.look.y) || 0) * er * 0.42;
      for (const side of [-1, 1]) {
        ctx.save();
        ctx.translate(side * ex, ey);
        ctx.scale(1, 1 - blink * 0.92);
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(0, 0, er, 0, TAU); ctx.fill();
        ctx.fillStyle = '#17191C';
        ctx.beginPath(); ctx.arc(lookX, lookY, er * 0.47, 0, TAU); ctx.fill();
        ctx.restore();
      }
      ctx.strokeStyle = '#17191C';
      ctx.lineWidth = Math.max(1.2, h * 0.014);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, ey + h * 0.043, h * 0.038, 0.18 * Math.PI, 0.82 * Math.PI);
      ctx.stroke();
    }

    ctx.restore();
  }

  CC.cone = {
    draw,
    width: (h) => h * 0.59,
    ORANGE, ORANGE_DK, BAND, BASE
  };
})();