/* CONE CREW — fx.js : particles, confetti, rings, score floaters, screen shake */
(function () {
  'use strict';
  const CC = (window.CC = window.CC || {});
  const { rand, randi, pick, clamp, TAU, easeOutCubic } = CC.util;

  const parts = [];    // dust / sparks
  const confs = [];    // confetti rects
  const rings = [];    // expanding rings
  const floats = [];   // text popups
  let shakeP = 0;

  const FONT = "'Archivo Black','Arial Black',system-ui,sans-serif";

  function burst(x, y, o) {
    o = o || {};
    const n = o.n || 12;
    for (let i = 0; i < n; i++) {
      if (parts.length > 380) parts.shift();
      const a = o.angle != null ? o.angle + rand(-o.spread || -0.5, o.spread || 0.5) : rand(0, TAU);
      const sp = rand(0.4, 1) * (o.sp || 260);
      parts.push({
        x, y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (o.up || 0),
        g: o.g == null ? 900 : o.g,
        r: rand(0.5, 1) * (o.size || 5),
        life: 0, max: rand(0.35, 0.8) * (o.life || 1),
        color: o.colors ? pick(o.colors) : '#FFB28F',
        fade: true
      });
    }
  }

  function dust(x, y, n) {
    for (let i = 0; i < (n || 8); i++) {
      if (parts.length > 380) parts.shift();
      const a = rand(Math.PI, TAU); // upward half
      const sp = rand(40, 160);
      parts.push({
        x: x + rand(-10, 10), y,
        vx: Math.cos(a) * sp * 1.6, vy: Math.sin(a) * sp * 0.5,
        g: -60, r: rand(4, 11), life: 0, max: rand(0.4, 0.9),
        color: pick(['rgba(190,185,175,0.5)', 'rgba(150,148,140,0.45)', 'rgba(120,118,112,0.4)']),
        grow: 36, fade: true
      });
    }
  }

  function confetti(x, y, n) {
    for (let i = 0; i < (n || 60); i++) {
      if (confs.length > 260) confs.shift();
      confs.push({
        x: x + rand(-30, 30), y: y + rand(-10, 10),
        vx: rand(-260, 260), vy: rand(-520, -160),
        rot: rand(0, TAU), vr: rand(-9, 9),
        w: rand(5, 10), h: rand(8, 16),
        life: 0, max: rand(1.4, 2.6),
        color: pick(['#FF4A1F', '#FF7A45', '#FFFFFF', '#FFC400', '#EDF1F6'])
      });
    }
  }

  function ring(x, y, o) {
    o = o || {};
    rings.push({
      x, y, r0: o.r0 || 8, r1: o.r1 || 80,
      life: 0, max: o.dur || 0.45,
      color: o.color || '#FFFFFF', lw: o.lw || 5
    });
  }

  function floater(x, y, text, o) {
    o = o || {};
    if (floats.length > 24) floats.shift();
    floats.push({
      x, y, text,
      life: 0, max: o.dur || 0.9,
      size: o.size || 26, color: o.color || '#FFFFFF',
      vy: o.vy == null ? -70 : o.vy
    });
  }

  function shake(p) { shakeP = Math.max(shakeP, p); }

  function shakeOffset() {
    if (shakeP < 0.2) return { x: 0, y: 0 };
    return { x: rand(-shakeP, shakeP), y: rand(-shakeP, shakeP) };
  }

  function update(dt) {
    shakeP *= Math.max(0, 1 - dt * 7);

    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life += dt;
      if (p.life >= p.max) { parts.splice(i, 1); continue; }
      p.vy += (p.g || 0) * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= Math.max(0, 1 - dt * 1.5);
      if (p.grow) p.r += p.grow * dt;
    }
    for (let i = confs.length - 1; i >= 0; i--) {
      const c = confs[i];
      c.life += dt;
      if (c.life >= c.max) { confs.splice(i, 1); continue; }
      c.vy += 780 * dt;
      c.vx *= Math.max(0, 1 - dt * 0.8);
      c.x += c.vx * dt; c.y += c.vy * dt;
      c.rot += c.vr * dt;
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].life += dt;
      if (rings[i].life >= rings[i].max) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.life += dt;
      f.y += f.vy * dt;
      if (f.life >= f.max) floats.splice(i, 1);
    }
  }

  function draw(ctx) {
    for (const p of parts) {
      const t = p.life / p.max;
      ctx.globalAlpha = p.fade ? (1 - t) : 1;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.5, p.r), 0, TAU);
      ctx.fill();
    }
    for (const c of confs) {
      const t = c.life / c.max;
      ctx.save();
      ctx.globalAlpha = t > 0.75 ? (1 - t) * 4 : 1;
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rot);
      ctx.fillStyle = c.color;
      ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h * (0.4 + 0.6 * Math.abs(Math.sin(c.rot * 1.7))));
      ctx.restore();
    }
    for (const r of rings) {
      const t = easeOutCubic(r.life / r.max);
      ctx.globalAlpha = 1 - t;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = r.lw * (1 - t * 0.6);
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r0 + (r.r1 - r.r0) * t, 0, TAU);
      ctx.stroke();
    }
    for (const f of floats) {
      const t = f.life / f.max;
      const pop = t < 0.18 ? 0.6 + 2.4 * (t / 0.18) * (1 - (t / 0.18) * 0.45) : 1.05 - 0.05 * t;
      ctx.save();
      ctx.globalAlpha = clamp(t > 0.6 ? (1 - t) / 0.4 : 1, 0, 1);
      ctx.translate(f.x, f.y);
      ctx.scale(pop, pop);
      ctx.font = `${f.size}px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = f.size * 0.18;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(10,12,16,0.85)';
      ctx.strokeText(f.text, 0, 0);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, 0, 0);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  function clear() {
    parts.length = 0; confs.length = 0; rings.length = 0; floats.length = 0;
    shakeP = 0;
  }

  CC.fx = { burst, dust, confetti, ring, floater, shake, shakeOffset, update, draw, clear, FONT };
})();
