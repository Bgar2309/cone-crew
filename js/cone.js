/* CONE CREW — cone.js : stylised EHS product cone
   Inspired by the approved asset sheet:
   - tall orange PVC cone
   - two wide reflective sleeves with the correct placement
   - ribbed upper collar and flared top
   - black rubber foot/base
   - same shared proportions for gameplay, mascot and fallen states */
(function () {
  'use strict';
  const CC = (window.CC = window.CC || {});
  const { clamp, rr, TAU } = CC.util;

  const ORANGE = '#FF4A1F';
  const ORANGE_HI = '#FF7A46';
  const ORANGE_DK = '#C92F0E';
  const BAND = '#E8ECEF';
  const BASE = '#16181C';
  const DOT = '#FF5B1D';

  function draw(ctx, o) {
    const h = o.h;
    const alpha = o.alpha == null ? 1 : o.alpha;
    const lie = o.lie || 0;
    const lieDir = o.lieDir || 1;

    const baseW = h * 0.62;
    const baseH = h * 0.080;
    const bodyBottom = -baseH * 0.78;
    const bodyTop = -h * 0.94;

    function yAt(t) {
      return bodyTop + (bodyBottom - bodyTop) * t;
    }

    function halfWAt(t) {
      if (t < 0.08) return h * (0.041 + (0.060 - 0.041) * (t / 0.08));
      if (t < 0.26) return h * (0.060 + (0.090 - 0.060) * ((t - 0.08) / 0.18));
      if (t < 0.60) return h * (0.090 + (0.152 - 0.090) * ((t - 0.26) / 0.34));
      if (t < 0.86) return h * (0.152 + (0.216 - 0.152) * ((t - 0.60) / 0.26));
      return h * (0.216 + (0.258 - 0.216) * ((t - 0.86) / 0.14));
    }

    function bodyPath() {
      ctx.beginPath();
      ctx.moveTo(-halfWAt(1), bodyBottom);
      ctx.bezierCurveTo(-h * 0.235, yAt(0.90), -h * 0.162, yAt(0.58), -h * 0.085, yAt(0.20));
      ctx.lineTo(-h * 0.055, bodyTop + h * 0.016);
      ctx.quadraticCurveTo(-h * 0.055, bodyTop, 0, bodyTop);
      ctx.quadraticCurveTo(h * 0.055, bodyTop, h * 0.055, bodyTop + h * 0.016);
      ctx.lineTo(h * 0.085, yAt(0.20));
      ctx.bezierCurveTo(h * 0.162, yAt(0.58), h * 0.235, yAt(0.90), halfWAt(1), bodyBottom);
      ctx.closePath();
    }

    function drawBase(strokeOnly) {
      const y = -baseH;
      rr(ctx, -baseW / 2, y, baseW, baseH * 1.08, h * 0.020);
      if (strokeOnly) {
        ctx.stroke();
        return;
      }
      const g = ctx.createLinearGradient(0, y, 0, y + baseH * 1.08);
      g.addColorStop(0, '#34383D');
      g.addColorStop(0.38, '#1E2126');
      g.addColorStop(1, '#0B0C0F');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      rr(ctx, -baseW / 2 + h * 0.015, y + h * 0.006, baseW - h * 0.03, baseH * 0.20, h * 0.010);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.55)';
      ctx.lineWidth = Math.max(1, h * 0.009);
      rr(ctx, -baseW / 2, y, baseW, baseH * 1.08, h * 0.020);
      ctx.stroke();
    }

    function drawDotRing() {
      const cy = -baseH * 0.35;
      const rx = baseW * 0.36;
      const ry = baseH * 0.50;
      const dots = 28;
      ctx.fillStyle = DOT;
      for (let i = 0; i < dots; i++) {
        const a = (i / dots) * TAU;
        const x = Math.cos(a) * rx;
        const y = cy + Math.sin(a) * ry;
        ctx.beginPath();
        ctx.arc(x, y, Math.max(1.2, h * 0.006), 0, TAU);
        ctx.fill();
      }
    }

    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.globalAlpha = alpha;

    if (o.shadow !== false && !o.ghost) {
      const sw = baseW * (0.52 + lie * 0.72);
      const sx = lie * lieDir * h * 0.33;
      const sg = ctx.createRadialGradient(sx, 0, 0, sx, 0, sw);
      sg.addColorStop(0, 'rgba(0,0,0,0.34)');
      sg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = sg;
      ctx.save();
      ctx.scale(1, 0.21);
      ctx.beginPath();
      ctx.arc(sx, baseH * 0.95, sw, 0, TAU);
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
      ctx.scale(1 + s * 0.70, 1 - s);
    }

    if (o.ghost) {
      ctx.setLineDash([h * 0.055, h * 0.038]);
      ctx.lineWidth = Math.max(1.5, h * 0.022);
      ctx.strokeStyle = 'rgba(255,120,70,0.92)';
      ctx.fillStyle = 'rgba(255,66,24,0.09)';
      bodyPath();
      ctx.fill();
      ctx.stroke();
      drawBase(true);
      ctx.setLineDash([]);
      ctx.restore();
      return;
    }

    drawBase(false);
    drawDotRing();

    bodyPath();
    const bodyGrad = ctx.createLinearGradient(-h * 0.25, 0, h * 0.25, 0);
    bodyGrad.addColorStop(0, ORANGE_DK);
    bodyGrad.addColorStop(0.16, ORANGE);
    bodyGrad.addColorStop(0.42, ORANGE_HI);
    bodyGrad.addColorStop(0.62, ORANGE);
    bodyGrad.addColorStop(1, '#B8280C');
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    ctx.save();
    bodyPath();
    ctx.clip();

    const bands = [[0.18, 0.39], [0.57, 0.80]];
    const flash = o.flash || 0;
    for (const [a, b] of bands) {
      const y1 = yAt(a);
      const y2 = yAt(b);
      const g = ctx.createLinearGradient(-h * 0.22, 0, h * 0.22, 0);
      g.addColorStop(0, '#9FA7AE');
      g.addColorStop(0.28, '#F5F7F8');
      g.addColorStop(0.50, '#FFFFFF');
      g.addColorStop(0.72, '#D7DDE1');
      g.addColorStop(1, '#9199A0');
      ctx.fillStyle = g;
      ctx.fillRect(-h * 0.30, y1, h * 0.60, y2 - y1);

      ctx.fillStyle = 'rgba(84,94,102,0.22)';
      const step = Math.max(3, h * 0.024);
      const r = Math.max(0.55, h * 0.0030);
      for (let y = y1 + step * 0.45; y < y2; y += step) {
        const t = (y - bodyTop) / (bodyBottom - bodyTop);
        const hw = halfWAt(t);
        for (let x = -hw + step * 0.5; x < hw; x += step) {
          ctx.beginPath();
          ctx.arc(x, y, r, 0, TAU);
          ctx.fill();
        }
      }

      ctx.fillStyle = 'rgba(70,45,35,0.18)';
      ctx.fillRect(-h * 0.30, y1, h * 0.60, Math.max(1, h * 0.006));
      ctx.fillRect(-h * 0.30, y2 - Math.max(1, h * 0.006), h * 0.60, Math.max(1, h * 0.006));

      if (flash > 0.01) {
        ctx.save();
        ctx.globalAlpha = alpha * flash;
        ctx.shadowColor = '#FFFFFF';
        ctx.shadowBlur = h * 0.22;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-h * 0.30, y1, h * 0.60, y2 - y1);
        ctx.restore();
      }
    }

    ctx.fillStyle = 'rgba(255,255,255,0.20)';
    ctx.beginPath();
    ctx.moveTo(-h * 0.128, bodyBottom);
    ctx.bezierCurveTo(-h * 0.102, yAt(0.68), -h * 0.055, yAt(0.24), -h * 0.020, bodyTop + h * 0.008);
    ctx.lineTo(h * 0.008, bodyTop + h * 0.008);
    ctx.bezierCurveTo(-h * 0.015, yAt(0.28), -h * 0.035, yAt(0.72), -h * 0.052, bodyBottom);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(0,0,0,0.14)';
    ctx.beginPath();
    ctx.moveTo(h * 0.258, bodyBottom);
    ctx.bezierCurveTo(h * 0.188, yAt(0.64), h * 0.10, yAt(0.24), h * 0.048, bodyTop + h * 0.008);
    ctx.lineTo(h * 0.024, bodyTop + h * 0.008);
    ctx.bezierCurveTo(h * 0.070, yAt(0.30), h * 0.135, yAt(0.72), h * 0.172, bodyBottom);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    const collarTop = bodyTop + h * 0.018;
    const collarBottom = yAt(0.14);
    ctx.strokeStyle = 'rgba(90,22,8,0.38)';
    ctx.lineWidth = Math.max(1, h * 0.0065);
    for (let y = collarTop + h * 0.024; y < collarBottom; y += h * 0.0165) {
      const t = (y - bodyTop) / (bodyBottom - bodyTop);
      const w = halfWAt(t) * 0.97;
      ctx.beginPath();
      ctx.moveTo(-w, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const neckY = bodyTop - h * 0.004;
    const capW = h * 0.108;
    const capH = h * 0.046;
    ctx.fillStyle = ORANGE;
    rr(ctx, -capW / 2, neckY - capH * 0.56, capW, capH, h * 0.012);
    ctx.fill();
    ctx.fillStyle = ORANGE_HI;
    ctx.beginPath();
    ctx.ellipse(0, neckY - capH * 0.58, capW * 0.48, capH * 0.22, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#7C1B09';
    ctx.beginPath();
    ctx.ellipse(0, neckY - capH * 0.57, capW * 0.30, capH * 0.12, 0, 0, TAU);
    ctx.fill();

    bodyPath();
    ctx.strokeStyle = 'rgba(70,20,8,0.28)';
    ctx.lineWidth = Math.max(1, h * 0.010);
    ctx.stroke();

    if (o.face) {
      const ey = yAt(0.50);
      const ex = h * 0.060;
      const er = h * 0.040;
      const blink = clamp(o.blink || 0, 0, 1);
      const lookX = ((o.look && o.look.x) || 0) * er * 0.42;
      const lookY = ((o.look && o.look.y) || 0) * er * 0.42;
      for (const side of [-1, 1]) {
        ctx.save();
        ctx.translate(side * ex, ey);
        ctx.scale(1, 1 - blink * 0.92);
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 0, er, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#17191C';
        ctx.beginPath();
        ctx.arc(lookX, lookY, er * 0.47, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
      ctx.strokeStyle = '#17191C';
      ctx.lineWidth = Math.max(1.2, h * 0.014);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, ey + h * 0.045, h * 0.036, 0.18 * Math.PI, 0.82 * Math.PI);
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
