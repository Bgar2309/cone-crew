/* CONE CREW — menu.js : animated attract backdrop (dusk highway + mascot cones) */
(function () {
  'use strict';
  const CC = (window.CC = window.CC || {});
  const { rand, clamp, lerp, TAU } = CC.util;

  const scene = {
    t: 0,
    streaks: [],
    streakTimer: 1,
    shinePhase: -1,
    shineTimer: 2.5,
    blink: 0,
    blinkTimer: 2,
    hops: [{ t: -1, timer: 3 }, { t: -1, timer: 5.2 }, { t: -1, timer: 7.6 }],
    celebrateLeft: 0,
    confTimer: 0,
    skyGrad: null,
    skyKey: '',

    enter(p) {
      if (p.celebrate) { this.celebrateLeft = 6; this.confTimer = 0.2; }
    },
    exit() {},

    update(dt) {
      this.t += dt;
      const W = CC.view.W, H = CC.view.H;

      // celebration confetti behind the final report card
      if (this.celebrateLeft > 0) {
        this.confTimer -= dt;
        if (this.confTimer <= 0) {
          CC.fx.confetti(rand(W * 0.15, W * 0.85), H * 0.22, 50);
          this.confTimer = 1.1;
          this.celebrateLeft--;
        }
      }

      // distant car light streaks
      this.streakTimer -= dt;
      if (this.streakTimer <= 0) {
        const dir = Math.random() < 0.5 ? 1 : -1;
        this.streaks.push({
          x: dir > 0 ? -150 : W + 150,
          y: H * rand(0.42, 0.47),
          sp: rand(650, 1050) * dir,
          white: Math.random() < 0.6
        });
        this.streakTimer = rand(1.8, 4);
      }
      for (let i = this.streaks.length - 1; i >= 0; i--) {
        const s = this.streaks[i];
        s.x += s.sp * dt;
        if (s.x < -300 || s.x > W + 300) this.streaks.splice(i, 1);
      }

      // band shine sweep on the hero cone
      this.shineTimer -= dt;
      if (this.shineTimer <= 0) { this.shinePhase = 0; this.shineTimer = rand(4.5, 7); }
      if (this.shinePhase >= 0) {
        this.shinePhase += dt * 1.6;
        if (this.shinePhase > 1) this.shinePhase = -1;
      }

      // mascot blink
      this.blinkTimer -= dt;
      if (this.blinkTimer <= 0) { this.blink = 0.14; this.blinkTimer = rand(2.2, 4.5); }
      if (this.blink > 0) this.blink -= dt;

      // little crew hops
      for (const hop of this.hops) {
        hop.timer -= dt;
        if (hop.timer <= 0 && hop.t < 0) { hop.t = 0; hop.timer = rand(3.5, 7); }
        if (hop.t >= 0) { hop.t += dt * 2.2; if (hop.t > 1) hop.t = -1; }
      }
    },

    draw(ctx) {
      const W = CC.view.W, H = CC.view.H;
      const hor = H * 0.48;

      // dusk sky (cached gradient)
      const key = W + 'x' + H;
      if (this.skyKey !== key) {
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#0B1026');
        g.addColorStop(0.45, '#1B2140');
        g.addColorStop(0.72, '#5A2A33');
        g.addColorStop(1, '#1A130F');
        this.skyGrad = g;
        this.skyKey = key;
      }
      ctx.fillStyle = this.skyGrad;
      ctx.fillRect(0, 0, W, H);

      // sun glow on the horizon
      const sg = ctx.createRadialGradient(W * 0.32, hor, 10, W * 0.32, hor, W * 0.42);
      sg.addColorStop(0, 'rgba(255,120,60,0.30)');
      sg.addColorStop(1, 'rgba(255,120,60,0)');
      ctx.fillStyle = sg;
      ctx.fillRect(0, 0, W, H);

      // stars
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      for (let i = 0; i < 24; i++) {
        const sx = ((i * 467.3) % W);
        const sy = ((i * 211.7) % (hor * 0.7));
        const tw = 0.4 + 0.6 * Math.abs(Math.sin(this.t * 0.8 + i));
        ctx.globalAlpha = 0.25 * tw;
        ctx.fillRect(sx, sy, 2, 2);
      }
      ctx.globalAlpha = 1;

      // far hills
      ctx.fillStyle = '#11141F';
      ctx.beginPath();
      ctx.moveTo(0, hor);
      for (let x = 0; x <= W; x += W / 14) {
        ctx.lineTo(x, hor - 14 - 26 * Math.abs(Math.sin(x * 0.013 + 2)));
      }
      ctx.lineTo(W, hor);
      ctx.closePath();
      ctx.fill();

      // car light streaks (just past the horizon)
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const s of this.streaks) {
        const dir = Math.sign(s.sp);
        const len = 150;
        const g = ctx.createLinearGradient(s.x, 0, s.x - dir * len, 0);
        const c = s.white ? '255,240,210' : '255,60,60';
        g.addColorStop(0, `rgba(${c},0.85)`);
        g.addColorStop(1, `rgba(${c},0)`);
        ctx.strokeStyle = g;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - dir * len, s.y);
        ctx.stroke();
      }
      ctx.restore();

      // road: perspective trapezoid
      ctx.fillStyle = '#23252D';
      ctx.beginPath();
      ctx.moveTo(W * 0.44, hor);
      ctx.lineTo(W * 0.56, hor);
      ctx.lineTo(W * 1.05, H);
      ctx.lineTo(-W * 0.05, H);
      ctx.closePath();
      ctx.fill();
      // edge lines
      ctx.strokeStyle = 'rgba(244,241,232,0.5)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(W * 0.452, hor); ctx.lineTo(W * 0.01, H);
      ctx.moveTo(W * 0.548, hor); ctx.lineTo(W * 0.99, H);
      ctx.stroke();
      // animated centre dashes flying toward the viewer
      ctx.fillStyle = 'rgba(244,241,232,0.85)';
      for (let k = 0; k < 9; k++) {
        const tt = ((k / 9 + this.t * 0.22) % 1);
        const p = tt * tt;
        const y = lerp(hor + 4, H + 40, p);
        const len = lerp(4, 60, p);
        const wd = lerp(1.5, 12, p);
        ctx.globalAlpha = clamp(tt * 3, 0, 1) * 0.9;
        ctx.fillRect(W * 0.5 - wd / 2, y, wd, len);
      }
      ctx.globalAlpha = 1;

      // hero cone + spotlight
      const hh = clamp(Math.min(W, H) * 0.46, 170, 430);
      const hx = W > 760 ? W * 0.70 : W * 0.5;
      const hy = W > 760 ? H * 0.80 : H * 0.87;
      const bob = Math.sin(this.t * 1.3) * hh * 0.012;

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      // warm pool of light on the tarmac
      const lg = ctx.createRadialGradient(hx, hy + 6, 8, hx, hy + 6, hh * 0.95);
      lg.addColorStop(0, 'rgba(255,190,120,0.30)');
      lg.addColorStop(1, 'rgba(255,190,120,0)');
      ctx.fillStyle = lg;
      ctx.beginPath();
      ctx.ellipse(hx, hy + 8, hh * 0.95, hh * 0.30, 0, 0, TAU);
      ctx.fill();
      // spotlight beam from above
      const bg2 = ctx.createLinearGradient(0, hy - hh * 1.8, 0, hy + 10);
      bg2.addColorStop(0, 'rgba(255,235,205,0.11)');
      bg2.addColorStop(1, 'rgba(255,235,205,0.015)');
      ctx.fillStyle = bg2;
      ctx.beginPath();
      ctx.moveTo(hx - hh * 0.14, hy - hh * 1.8);
      ctx.lineTo(hx + hh * 0.14, hy - hh * 1.8);
      ctx.lineTo(hx + hh * 0.62, hy + 10);
      ctx.lineTo(hx - hh * 0.62, hy + 10);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      // low podium disc under the star
      const pr = hh * 0.52;
      const pdg = ctx.createLinearGradient(0, hy - 6, 0, hy + 14);
      pdg.addColorStop(0, '#2E323D');
      pdg.addColorStop(1, '#14161C');
      ctx.fillStyle = pdg;
      ctx.beginPath();
      ctx.ellipse(hx, hy + 6, pr, pr * 0.22, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,200,140,0.28)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(hx, hy + 3, pr * 0.99, pr * 0.21, 0, Math.PI, TAU);
      ctx.stroke();

      const shine = this.shinePhase >= 0 ? Math.sin(Math.PI * this.shinePhase) : 0;
      CC.cone.draw(ctx, {
        x: hx, y: hy + bob, h: hh,
        tilt: Math.sin(this.t * 0.9) * 0.015,
        face: true,
        blink: this.blink > 0 ? Math.sin((0.14 - this.blink) / 0.14 * Math.PI) : 0,
        look: { x: W > 760 ? -0.55 : 0, y: -0.15 + Math.sin(this.t * 0.5) * 0.1 },
        flash: shine * 0.9
      });

      // the little crew
      const crewX = W > 760 ? [0.16, 0.235, 0.305] : [0.18, 0.5, 0.82];
      const crewY = W > 760 ? 0.92 : 0.965;
      for (let i = 0; i < 3; i++) {
        const ch = hh * (0.30 - i * 0.03);
        const hop = this.hops[i];
        let yoff = Math.sin(this.t * 2 + i * 1.7) * 2;
        let squash = 0;
        if (hop.t >= 0) {
          const ht = hop.t;
          yoff -= Math.sin(Math.PI * Math.min(ht, 1)) * ch * 0.45;
          if (ht > 0.92) squash = (ht - 0.92) * 3;
        }
        CC.cone.draw(ctx, {
          x: W * crewX[i], y: H * crewY + yoff, h: ch,
          face: true,
          blink: this.blink > 0 ? 1 : 0,
          look: { x: 0.5, y: -0.3 },
          squash,
          tilt: Math.sin(this.t * 2 + i) * 0.04
        });
      }

      CC.tex.overlay(ctx, 0, 0, W, H, 0.045);
    },

    onPress() {},
    onAction() {}
  };

  CC.scenes.add('menu', scene);
})();
