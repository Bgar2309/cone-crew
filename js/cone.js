/* CONE CREW — cone.js : vector REVO 42 R2 (orange body, twin reflective bands, black base) */
(function () {
  'use strict';
  const CC = (window.CC = window.CC || {});
  const { lerp, clamp, rr } = CC.util;

  const ORANGE = '#FF4A1F';
  const ORANGE_DK = '#D63A12';
  const BAND = '#EDF1F6';
  const BASE = '#15171C';

  // o: { x, y (base centre on ground), h, tilt, squash, lie (0..1), lieDir (±1),
  //      alpha, ghost, face, blink, flash (0..1 band glow), shadow }
  function draw(ctx, o) {
    const h = o.h;
    const baseW = h * 0.66;
    const baseH = h * 0.075;
    const B = h * 0.26;   // body bottom half-width
    const T = h * 0.055;  // body top half-width
    const bodyBot = -baseH * 0.75;
    const bodyTop = -h * 0.97;
    const lie = o.lie || 0;
    const lieDir = o.lieDir || 1;
    const alpha = o.alpha == null ? 1 : o.alpha;

    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.globalAlpha = alpha;

    // ground shadow (kept un-rotated)
    if (o.shadow !== false && !o.ghost) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.30)';
      const sw = baseW * (0.62 + lie * 0.9);
      const sx = lie * lieDir * h * 0.34;
      ctx.beginPath();
      ctx.ellipse(sx, baseH * 0.25, sw, baseH * 0.85, 0, 0, CC.util.TAU);
      ctx.fill();
      ctx.restore();
    }

    // tip over the base edge when lying, light sway tilt otherwise
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

    const halfW = (yr) => lerp(B, T, yr);
    const yAt = (yr) => lerp(bodyBot, bodyTop, yr);

    function bodyPath() {
      ctx.beginPath();
      ctx.moveTo(-B, bodyBot);
      ctx.lineTo(-T, bodyTop + h * 0.02);
      ctx.quadraticCurveTo(-T, bodyTop, 0, bodyTop);
      ctx.quadraticCurveTo(T, bodyTop, T, bodyTop + h * 0.02);
      ctx.lineTo(B, bodyBot);
      ctx.closePath();
    }

    if (o.ghost) {
      ctx.setLineDash([h * 0.07, h * 0.05]);
      ctx.lineWidth = Math.max(1.5, h * 0.03);
      ctx.strokeStyle = 'rgba(255,122,69,0.9)';
      ctx.fillStyle = 'rgba(255,74,31,0.10)';
      bodyPath();
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      rr(ctx, -baseW / 2, -baseH, baseW, baseH, h * 0.02);
      ctx.stroke();
      ctx.restore();
      return;
    }

    // black rubber base
    ctx.fillStyle = BASE;
    rr(ctx, -baseW / 2, -baseH, baseW, baseH * 1.05, h * 0.025);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    rr(ctx, -baseW / 2 + h * 0.02, -baseH, baseW - h * 0.04, baseH * 0.32, h * 0.02);
    ctx.fill();

    // orange body
    bodyPath();
    ctx.fillStyle = ORANGE;
    ctx.fill();

    ctx.save();
    bodyPath();
    ctx.clip();

    // reflective bands (lower wider, upper narrower — like the real one)
    const bands = [ [0.28, 0.46], [0.56, 0.70] ];
    const flash = o.flash || 0;
    for (const [a, b] of bands) {
      const y1 = yAt(b), y2 = yAt(a);
      ctx.fillStyle = BAND;
      ctx.fillRect(-B * 1.1, y1, B * 2.2, y2 - y1);
      // retro-reflective sheen
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(-B * 1.1, y1, B * 2.2, (y2 - y1) * 0.22);
      ctx.fillStyle = 'rgba(140,160,190,0.28)';
      ctx.fillRect(-B * 1.1, y2 - (y2 - y1) * 0.2, B * 2.2, (y2 - y1) * 0.2);
      if (flash > 0.01) {
        ctx.save();
        ctx.globalAlpha = alpha * flash;
        ctx.shadowColor = '#FFFFFF';
        ctx.shadowBlur = h * 0.25;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-B * 1.1, y1, B * 2.2, y2 - y1);
        ctx.restore();
      }
    }

    // cylindrical shading: left highlight, right shade
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.beginPath();
    ctx.moveTo(-B * 0.72, bodyBot);
    ctx.lineTo(-T * 1.6, bodyTop + h * 0.03);
    ctx.lineTo(-T * 0.4, bodyTop + h * 0.03);
    ctx.lineTo(-B * 0.38, bodyBot);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.moveTo(B, bodyBot);
    ctx.lineTo(T, bodyTop + h * 0.02);
    ctx.lineTo(T * 0.2, bodyTop + h * 0.02);
    ctx.lineTo(B * 0.62, bodyBot);
    ctx.closePath();
    ctx.fill();

    // knurled grip near the tip
    ctx.strokeStyle = 'rgba(0,0,0,0.22)';
    ctx.lineWidth = Math.max(1, h * 0.012);
    for (let i = 0; i < 3; i++) {
      const yr = 0.86 + i * 0.035;
      const y = yAt(yr), w = halfW(yr);
      ctx.beginPath();
      ctx.moveTo(-w, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.restore(); // unclip

    // soft outline
    bodyPath();
    ctx.strokeStyle = 'rgba(0,0,0,0.20)';
    ctx.lineWidth = Math.max(1, h * 0.014);
    ctx.stroke();

    // optional mascot face (menus only — the product stays serious on the job)
    if (o.face) {
      const ey = yAt(0.51);
      const ex = h * 0.062;
      const er = h * 0.05;
      const blink = clamp(o.blink || 0, 0, 1);
      const lookX = (o.look && o.look.x || 0) * er * 0.45;
      const lookY = (o.look && o.look.y || 0) * er * 0.45;
      for (const s of [-1, 1]) {
        ctx.save();
        ctx.translate(s * ex, ey);
        ctx.scale(1, 1 - blink * 0.92);
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(0, 0, er, 0, CC.util.TAU); ctx.fill();
        ctx.fillStyle = '#1A1D23';
        ctx.beginPath(); ctx.arc(lookX, lookY, er * 0.46, 0, CC.util.TAU); ctx.fill();
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
    width: (h) => h * 0.66,
    ORANGE, ORANGE_DK, BAND, BASE
  };
})();
