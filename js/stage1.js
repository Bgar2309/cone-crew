/* CONE CREW — stage1.js : THE DEPOT — swing-and-drop cone stacker */
(function () {
  'use strict';
  const CC = (window.CC = window.CC || {});
  const { clamp, lerp, rand, TAU, easeOutCubic } = CC.util;
  const t = (k) => CC.i18n.t(k);

  const TARGET = 10;
  const MAX_MISS = 3;

  const S = {
    enter() {
      this.t = 0;
      this.phase = 'ready';     // ready → play → done
      this.readyT = 0;
      this.saidReady = false;
      this.saidGo = false;
      this.placed = [];
      this.tumbles = [];
      this.falling = null;
      this.misses = 0;
      this.perfects = 0;
      this.streak = 0;
      this.bestMult = 1;
      this.swingPhase = rand(0, TAU);
      this.swingSpeed = 1.45;
      this.hasCone = true;
      this.reloadT = 0;
      this.clawOpen = 0;
      this.banner = null;
      this.bannerT = 0;
      this.outroT = 0;
      this.cleanBonus = 0;
      this.win = false;

      CC.hud.setStage(`${t('stage.word')} 1 — ${t('s1.name')}`);
      CC.hud.setCombo(1);
      this.syncInfo();
    },
    exit() { CC.hud.setInfo(''); },

    layout() {
      const W = CC.view.W, H = CC.view.H;
      const coneH = clamp(H * 0.135, 64, 120);
      return {
        W, H,
        floorY: H * 0.845,
        palletH: Math.max(8, coneH * 0.11),
        coneH,
        coneW: CC.cone.width(coneH),
        step: coneH * 0.34,
        baseX: W / 2,
        amp: Math.min(W * 0.36, 360),
        railY: H * 0.105,
        cable: H * 0.055
      };
    },

    syncInfo() {
      let pips = '';
      for (let i = 0; i < TARGET; i++) pips += `<i class="pip ${i < this.placed.length ? 'on' : ''}"></i>`;
      let lives = '';
      for (let i = 0; i < MAX_MISS; i++) lives += `<i class="mpip ${i < this.misses ? 'off' : ''}">▲</i>`;
      CC.hud.setInfo(`<span class="pips">${pips}</span><span class="lives">${lives}</span>`);
    },

    update(dt) {
      this.t += dt;
      const L = this.layout();

      if (this.phase === 'ready') {
        this.readyT += dt;
        if (!this.saidReady) { this.saidReady = true; CC.audio.play('count'); }
        if (this.readyT > 0.9 && !this.saidGo) { this.saidGo = true; CC.audio.play('countGo'); }
        if (this.readyT > 1.35) this.phase = 'play';
      }

      // carrier swing
      if (this.phase !== 'done' || this.hasCone) {
        this.swingPhase += this.swingSpeed * dt;
      }

      // reload after a drop
      if (this.reloadT > 0) {
        this.reloadT -= dt;
        if (this.reloadT <= 0 && this.phase === 'play') this.hasCone = true;
      }
      this.clawOpen = Math.max(0, this.clawOpen - dt * 4);

      // falling cone
      if (this.falling) {
        const f = this.falling;
        f.vy += L.H * 5.2 * dt;
        f.y += f.vy * dt;
        f.x += f.vx * dt;
        const targetY = L.floorY - L.palletH - this.placed.length * L.step;
        if (f.y >= targetY) {
          this.falling = null;
          this.judge(f.x, targetY, L);
        }
      }

      // tumbling rejects
      for (let i = this.tumbles.length - 1; i >= 0; i--) {
        const c = this.tumbles[i];
        c.vy += L.H * 4 * dt;
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.rot += c.vr * dt;
        if (c.y > L.H + 250) this.tumbles.splice(i, 1);
      }

      // settle squash on landed cones
      for (const p of this.placed) if (p.settle < 1) p.settle = Math.min(1, p.settle + dt * 5);

      if (this.banner) this.bannerT += dt;

      if (this.phase === 'done') {
        this.outroT += dt;
        if (this.outroT > 2.1) {
          const stats = [
            ['result.perfects', `${this.perfects}/${TARGET}`],
            ['result.combo', 'x' + this.bestMult],
            ['result.misses', String(this.misses)]
          ];
          if (this.cleanBonus > 0) stats.push(['result.cleanBonus', '+' + this.cleanBonus, true]);
          CC.flow.stageDone(1, stats);
        }
      }
    },

    carrierX(L) {
      return L.baseX + L.amp * Math.sin(this.swingPhase);
    },

    drop() {
      if (this.phase !== 'play' || !this.hasCone) {
        if (this.phase === 'play') CC.audio.play('denied');
        return;
      }
      const L = this.layout();
      const vel = L.amp * Math.cos(this.swingPhase) * this.swingSpeed;
      this.hasCone = false;
      this.reloadT = 0.55;
      this.clawOpen = 1;
      this.falling = {
        x: this.carrierX(L),
        y: L.railY + L.cable + L.coneH,
        vx: vel * 0.16,
        vy: 40
      };
      CC.audio.play('drop');
    },

    judge(x, y, L) {
      const topX = this.placed.length ? this.placed[this.placed.length - 1].x : L.baseX;
      const dx = x - topX;
      const adx = Math.abs(dx);
      const cw = L.coneW;

      if (adx > cw * 0.46) {
        // bounced off the stack
        this.misses++;
        this.streak = 0;
        CC.hud.setCombo(1);
        this.tumbles.push({
          x, y: y - 6, vx: (dx > 0 ? 1 : -1) * rand(140, 260),
          vy: -L.H * 0.55, rot: 0, vr: (dx > 0 ? 1 : -1) * rand(4, 8), h: L.coneH
        });
        CC.fx.shake(9);
        CC.fx.dust(x, y, 6);
        CC.fx.floater(x, y - L.coneH * 1.2, t('grade.miss'), { color: '#FF5A5A', size: Math.max(22, L.coneH * 0.30) });
        CC.audio.play('miss');
        this.syncInfo();
        if (this.misses >= MAX_MISS) this.finish(false);
        return;
      }

      let grade, pts, snapX;
      if (adx <= cw * 0.10) {
        this.streak++;
        this.perfects++;
        const mult = Math.min(this.streak, 4);
        this.bestMult = Math.max(this.bestMult, mult);
        grade = 'perfect';
        pts = 300 * mult;
        snapX = topX;
        CC.hud.setCombo(mult);
        if (mult >= 2) CC.audio.play('combo', mult);
        CC.fx.ring(x, y - L.coneH * 0.5, { r1: cw * 1.5, color: '#FFD9A8' });
      } else if (adx <= cw * 0.26) {
        this.streak = 0; CC.hud.setCombo(1);
        grade = 'good'; pts = 150;
        snapX = topX + dx * 0.55;
      } else {
        this.streak = 0; CC.hud.setCombo(1);
        grade = 'ok'; pts = 60;
        snapX = topX + dx * 0.62;
      }
      snapX = clamp(snapX, L.baseX - cw * 0.9, L.baseX + cw * 0.9);

      this.placed.push({ x: snapX, settle: 0 });
      CC.flow.score(pts);
      CC.audio.play('land');
      CC.audio.play(grade);
      CC.fx.dust(snapX, y, 7);
      CC.fx.shake(grade === 'perfect' ? 4 : 2.5);
      const gradeColor = grade === 'perfect' ? '#FFC400' : grade === 'good' ? '#9FF09F' : '#CFD6E2';
      CC.fx.floater(snapX, y - L.coneH * 1.25,
        `${t('grade.' + grade)}  +${pts}`,
        { color: gradeColor, size: Math.max(22, L.coneH * (grade === 'perfect' ? 0.34 : 0.26)) });

      this.syncInfo();
      if (this.placed.length >= TARGET) this.finish(true);
    },

    finish(win) {
      this.phase = 'done';
      this.win = win;
      this.hasCone = false;
      this.banner = win ? t('banner.s1done') : t('banner.s1fail');
      this.bannerT = 0;
      const L = this.layout();
      if (win) {
        if (this.misses === 0) {
          this.cleanBonus = 800;
          CC.flow.score(800);
          CC.fx.floater(L.baseX, L.H * 0.3, t('result.cleanBonus') + ' +800', { color: '#FFC400', size: 26, dur: 1.4 });
        }
        CC.fx.confetti(L.baseX, L.floorY - TARGET * L.step, 70);
        CC.audio.play('clear');
      } else {
        CC.audio.play('fail');
        CC.fx.shake(12);
      }
    },

    onPress() { this.drop(); },
    onAction() { this.drop(); },

    /* ---------------- drawing ---------------- */

    draw(ctx) {
      const L = this.layout();
      const { W, H } = L;

      // depot wall
      let g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#14161D');
      g.addColorStop(0.55, '#1E222B');
      g.addColorStop(0.85, '#232833');
      g.addColorStop(1, '#161920');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      // wall panel seams
      ctx.strokeStyle = 'rgba(0,0,0,0.22)';
      ctx.lineWidth = 1.5;
      for (let px = W * 0.125; px < W; px += W * 0.125) {
        ctx.beginPath(); ctx.moveTo(px, H * 0.16); ctx.lineTo(px, L.floorY); ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.025)';
      ctx.fillRect(0, H * 0.16, W, 2);

      // shelving racks with stacked crates
      const rackY = H * 0.30;
      for (const rx of [W * 0.06, W * 0.79]) {
        const rw = W * 0.15;
        ctx.fillStyle = '#10131A';
        ctx.fillRect(rx, rackY, 7, L.floorY - rackY);
        ctx.fillRect(rx + rw - 7, rackY, 7, L.floorY - rackY);
        for (let s = 0; s < 4; s++) {
          const sy = rackY + 8 + s * H * 0.125;
          ctx.fillStyle = '#0E1117';
          ctx.fillRect(rx, sy + H * 0.095, rw, 5);
          // crates with a hint of volume
          for (let b = 0; b < 3; b++) {
            if (CC.tex.hash(s * 17 + b + rx) < 0.25) continue;
            const bw = rw * 0.27, bx = rx + 8 + b * (rw - 16) / 3;
            const warm = CC.tex.hash(s * 7 + b * 3 + rx) > 0.5;
            const bg2 = ctx.createLinearGradient(0, sy, 0, sy + H * 0.09);
            bg2.addColorStop(0, warm ? '#3A2E22' : '#262B36');
            bg2.addColorStop(1, warm ? '#241C14' : '#171B23');
            ctx.fillStyle = bg2;
            CC.util.rr(ctx, bx, sy + H * 0.012, bw, H * 0.085, 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            ctx.fillRect(bx, sy + H * 0.012, bw, 2);
          }
        }
      }

      // hanging lamps + volumetric light, with drifting dust motes
      const lamps = [W * 0.25, W * 0.5, W * 0.75];
      for (let li = 0; li < lamps.length; li++) {
        const lx = lamps[li];
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, H * 0.05); ctx.stroke();
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const lp = ctx.createLinearGradient(0, H * 0.06, 0, H * 0.92);
        lp.addColorStop(0, 'rgba(255,206,140,0.13)');
        lp.addColorStop(1, 'rgba(255,206,140,0)');
        ctx.fillStyle = lp;
        ctx.beginPath();
        ctx.moveTo(lx - 13, H * 0.06);
        ctx.lineTo(lx + 13, H * 0.06);
        ctx.lineTo(lx + H * 0.27, H * 0.92);
        ctx.lineTo(lx - H * 0.27, H * 0.92);
        ctx.closePath();
        ctx.fill();
        // dust motes drifting up through the beam
        for (let m = 0; m < 9; m++) {
          const seed = li * 37 + m;
          const ly = (CC.tex.hash(seed) + this.t * (0.018 + CC.tex.hash(seed + 5) * 0.02)) % 1;
          const spread = lerp(12, H * 0.25, ly);
          const mx = lx + (CC.tex.hash(seed + 11) * 2 - 1) * spread + Math.sin(this.t * 0.7 + seed) * 6;
          const my = lerp(H * 0.88, H * 0.08, ly);
          ctx.globalAlpha = Math.sin(Math.PI * ly) * 0.4;
          ctx.fillStyle = '#FFE2B8';
          ctx.fillRect(mx, my, 1.6, 1.6);
        }
        ctx.restore();
        // lamp shade
        const lg2 = ctx.createLinearGradient(0, H * 0.045, 0, H * 0.06);
        lg2.addColorStop(0, '#3A4150');
        lg2.addColorStop(1, '#FFD696');
        ctx.fillStyle = lg2;
        CC.util.rr(ctx, lx - 13, H * 0.044, 26, H * 0.016, 3);
        ctx.fill();
        CC.tex.glow(ctx, lx, H * 0.058, 26, '255,214,150', 0.5);
      }

      // floor: gradient + light pools + safety line
      g = ctx.createLinearGradient(0, L.floorY, 0, H);
      g.addColorStop(0, '#31353F');
      g.addColorStop(0.25, '#272B35');
      g.addColorStop(1, '#171A21');
      ctx.fillStyle = g;
      ctx.fillRect(0, L.floorY, W, H - L.floorY);
      for (const lx of lamps) {
        const fp = ctx.createRadialGradient(lx, L.floorY + 14, 6, lx, L.floorY + 14, H * 0.22);
        fp.addColorStop(0, 'rgba(255,210,150,0.10)');
        fp.addColorStop(1, 'rgba(255,210,150,0)');
        ctx.fillStyle = fp;
        ctx.save();
        ctx.translate(lx, L.floorY + 14);
        ctx.scale(1, 0.35);
        ctx.translate(-lx, -(L.floorY + 14));
        ctx.beginPath(); ctx.arc(lx, L.floorY + 14, H * 0.22, 0, CC.util.TAU); ctx.fill();
        ctx.restore();
      }
      ctx.strokeStyle = 'rgba(255,196,0,0.45)';
      ctx.lineWidth = 3;
      ctx.setLineDash([26, 18]);
      ctx.beginPath();
      ctx.moveTo(0, L.floorY + 8); ctx.lineTo(W, L.floorY + 8);
      ctx.stroke();
      ctx.setLineDash([]);

      // pallet
      const pw = L.coneW * 2.4, ph = L.palletH;
      CC.tex.softShadow(ctx, L.baseX, L.floorY + 2, pw * 0.62, ph * 0.9, 0.35);
      const pg = ctx.createLinearGradient(0, L.floorY - ph, 0, L.floorY);
      pg.addColorStop(0, '#7E6040');
      pg.addColorStop(0.5, '#66492C');
      pg.addColorStop(1, '#4A3520');
      ctx.fillStyle = pg;
      CC.util.rr(ctx, L.baseX - pw / 2, L.floorY - ph, pw, ph, 3);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      ctx.fillRect(L.baseX - pw / 2 + 2, L.floorY - ph, pw - 4, 1.5);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      for (let i = 0; i < 4; i++) ctx.fillRect(L.baseX - pw / 2 + 6 + i * (pw - 12) / 3.2, L.floorY - ph, 5, ph);
      // centre target mark
      ctx.fillStyle = 'rgba(255,196,0,0.65)';
      ctx.beginPath();
      ctx.moveTo(L.baseX, L.floorY - ph - 7);
      ctx.lineTo(L.baseX - 7, L.floorY - ph + 1);
      ctx.lineTo(L.baseX + 7, L.floorY - ph + 1);
      ctx.closePath();
      ctx.fill();

      // stack (with a gentle living wobble) + faint reflection on the painted floor
      const lean = this.placed.length ? this.placed[this.placed.length - 1].x - L.baseX : 0;
      const swayAmp = clamp(Math.abs(lean) * 0.05, 0.4, 3.2);
      const drawStack = (refl) => {
        for (let i = 0; i < this.placed.length; i++) {
          const p = this.placed[i];
          const sway = Math.sin(this.t * 2.4 + i * 0.4) * swayAmp * (i / TARGET);
          const squash = (1 - easeOutCubic(p.settle)) * 0.22;
          CC.cone.draw(ctx, {
            x: p.x + sway,
            y: L.floorY - ph - i * L.step,
            h: L.coneH,
            squash,
            shadow: !refl && i === 0
          });
        }
      };
      if (this.placed.length) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, L.floorY, W, H - L.floorY);
        ctx.clip();
        // squashed mirror about the pallet top: y' = yM + 0.55*(yM - y)
        ctx.translate(0, 1.55 * (L.floorY - ph));
        ctx.scale(1, -0.55);
        ctx.globalAlpha = 0.10;
        drawStack(true);
        ctx.restore();
      }
      drawStack(false);

      // tumbling rejects
      for (const c of this.tumbles) {
        CC.cone.draw(ctx, { x: c.x, y: c.y, h: c.h, tilt: c.rot, shadow: false });
      }

      // falling cone
      if (this.falling) {
        const f = this.falling;
        CC.cone.draw(ctx, { x: f.x, y: f.y, h: L.coneH, tilt: clamp(f.vx * 0.0012, -0.18, 0.18), shadow: false });
        // landing hint shadow
        const ty = L.floorY - ph - this.placed.length * L.step;
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(f.x, ty, L.coneW * 0.4, 5, 0, 0, TAU);
        ctx.fill();
      }

      // overhead rail + trolley + claw
      ctx.fillStyle = '#0F1117';
      ctx.fillRect(0, L.railY - 10, W, 14);
      ctx.fillStyle = 'rgba(255,255,255,0.07)';
      ctx.fillRect(0, L.railY - 10, W, 4);
      const cx = this.carrierX(L);
      const tilt = clamp(Math.cos(this.swingPhase) * this.swingSpeed * 0.045, -0.16, 0.16);

      ctx.fillStyle = '#2E3340';
      CC.util.rr(ctx, cx - 26, L.railY - 16, 52, 24, 5);
      ctx.fill();
      ctx.fillStyle = CC.cone.ORANGE;
      CC.util.rr(ctx, cx - 26, L.railY - 16, 52, 6, 3);
      ctx.fill();

      ctx.strokeStyle = '#3A4150';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, L.railY + 8);
      ctx.lineTo(cx + tilt * 80, L.railY + L.cable);
      ctx.stroke();

      const clawX = cx + tilt * 80;
      const clawY = L.railY + L.cable;
      const open = easeOutCubic(this.clawOpen) * 10;
      ctx.strokeStyle = '#9AA3B5';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(clawX, clawY);
        ctx.lineTo(clawX + s * (8 + open), clawY + 12);
        ctx.lineTo(clawX + s * (4 + open), clawY + 22);
        ctx.stroke();
      }

      // cone in the claw
      if (this.hasCone) {
        CC.cone.draw(ctx, {
          x: clawX, y: clawY + L.coneH * 1.02, h: L.coneH,
          tilt: tilt * 1.4, shadow: false
        });
        // drop guide
        ctx.strokeStyle = 'rgba(255,255,255,0.10)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 10]);
        ctx.beginPath();
        ctx.moveTo(clawX, clawY + L.coneH * 1.05);
        ctx.lineTo(clawX, L.floorY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      CC.tex.overlay(ctx, 0, 0, W, H, 0.05);

      this.drawBanners(ctx, L);
    },

    drawBanners(ctx, L) {
      const { W, H } = L;
      if (this.phase === 'ready') {
        const txt = this.readyT < 0.9 ? t('stage.ready') : t('stage.go');
        this.bigText(ctx, W / 2, H * 0.42, txt, Math.min(W, H) * 0.085, '#FFFFFF');
      }
      if (this.phase === 'done' && this.banner) {
        const a = clamp(this.bannerT * 2.2, 0, 1);
        ctx.save();
        ctx.globalAlpha = a;
        this.bigText(ctx, W / 2, H * 0.40, this.banner, Math.min(W, H) * 0.075,
          this.win ? '#FFC400' : '#FF6A5A');
        ctx.restore();
      }
    },

    bigText(ctx, x, y, txt, size, color) {
      ctx.save();
      ctx.font = `${size}px ${CC.fx.FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.lineWidth = size * 0.2;
      ctx.strokeStyle = 'rgba(10,12,16,0.9)';
      ctx.strokeText(txt, x, y);
      ctx.fillStyle = color;
      ctx.fillText(txt, x, y);
      ctx.restore();
    }
  };

  CC.scenes.add('stage1', S);
})();
