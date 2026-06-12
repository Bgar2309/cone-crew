/* CONE CREW — stage2.js : ROLLING DEPLOY — close the lane from a moving works truck */
(function () {
  'use strict';
  const CC = (window.CC = window.CC || {});
  const { clamp, lerp, rand, TAU, easeInOut, easeOutCubic } = CC.util;
  const t = (k) => CC.i18n.t(k);

  const SLOTS = 14;
  // rhythm pattern: time gaps between markers (three quick doubles)
  const GAPS = [1.7, 1.5, 1.4, 1.3, 1.2, 1.15, 0.62, 1.2, 1.05, 1.0, 0.62, 1.05, 0.95, 0.62];

  const S = {
    enter() {
      this.t = 0;
      this.phase = 'ready';
      this.readyT = 0;
      this.saidReady = false;
      this.saidGo = false;
      this.playT = 0;
      this.scroll = 0;
      this.v = 0;
      this.vTarget = 300;
      this.slots = [];
      this.spawned = 0;
      this.nextSpawnT = 1.1;
      this.placed = [];   // cones standing on the road
      this.strays = [];   // cones that missed everything
      this.falling = null;
      this.reloadT = 0;
      this.throwT = 1;
      this.deployed = 0;
      this.perfects = 0;
      this.missedSlots = 0;
      this.streak = 0;
      this.bestMult = 1;
      this.taperBonus = 0;
      this.firstFill = false;
      this.banner = null;
      this.bannerT = 0;
      this.outroT = -1;
      this.board = null;   // arrow board trailer
      this.bgCars = [];
      this.bgCarT = 1.5;
      this.skyGrad = null;
      this.skyKey = '';

      CC.hud.setStage(`${t('stage.word')} 2 — ${t('s2.name')}`);
      CC.hud.setCombo(1);
      this.syncInfo();
    },
    exit() { CC.hud.setInfo(''); },

    layout() {
      const W = CC.view.W, H = CC.view.H;
      const s = clamp(W / 1200, 0.72, 1.3);
      return {
        W, H, s,
        hor: H * 0.34,
        roadTop: H * 0.455,
        midY: H * 0.695,
        roadBot: H * 0.95,
        dropX: clamp(W * 0.30, 180, 460),
        truckY: H * 0.640,
        bedY: H * 0.560,
        coneH: clamp(H * 0.085, 42, 66)
      };
    },

    taperY(p) {
      const H = CC.view.H;
      return lerp(H * 0.895, H * 0.725, easeInOut(p));
    },

    syncInfo() {
      let pips = '';
      for (let i = 0; i < SLOTS; i++) {
        const sl = this.slots[i];
        const cls = sl ? (sl.filled ? 'on' : sl.missed ? 'bad' : '') : '';
        pips += `<i class="pip sm ${cls}"></i>`;
      }
      CC.hud.setInfo(`<span class="pips">${pips}</span>`);
    },

    update(dt) {
      this.t += dt;
      const L = this.layout();

      if (this.phase === 'ready') {
        this.readyT += dt;
        if (!this.saidReady) { this.saidReady = true; CC.audio.play('count'); }
        if (this.readyT > 0.9 && !this.saidGo) { this.saidGo = true; CC.audio.play('countGo'); }
        if (this.readyT > 1.35) this.phase = 'play';
        this.v = lerp(this.v, this.vTarget * L.s, dt * 2);
      }

      if (this.phase === 'play') {
        this.playT += dt;
        this.vTarget = Math.min(300 + this.spawned * 19, 560);
        this.v = lerp(this.v, this.vTarget * L.s, dt * 1.5);

        // spawn markers on rhythm
        if (this.spawned < SLOTS) {
          this.nextSpawnT -= dt;
          if (this.nextSpawnT <= 0) {
            const i = this.spawned++;
            this.slots.push({
              x: L.W + 60, y: this.taperY(i / (SLOTS - 1)),
              filled: false, missed: false, reserved: false, grade: null, flash: 0
            });
            this.nextSpawnT = GAPS[Math.min(i, GAPS.length - 1)];
          }
        }
      }

      if (this.phase === 'outro') {
        this.v = lerp(this.v, 0, dt * 1.6);
        this.outroT += dt;
        if (this.board) this.board.x = lerp(this.board.x, L.W * 0.74, dt * 2.2);
        if (this.outroT > 2.4) {
          const stats = [
            ['result.deployed', `${this.deployed}/${SLOTS}`],
            ['result.perfects', String(this.perfects)],
            ['result.combo', 'x' + this.bestMult]
          ];
          if (this.taperBonus > 0) stats.push(['result.taperBonus', '+' + this.taperBonus, true]);
          CC.flow.stageDone(2, stats);
          return;
        }
      }

      this.scroll += this.v * dt;

      // move world objects with the road
      for (const sl of this.slots) {
        sl.x -= this.v * dt;
        if (sl.flash > 0) sl.flash -= dt * 2;
        if (!sl.filled && !sl.missed && !sl.reserved && sl.x < L.dropX - 74 * L.s) {
          sl.missed = true;
          this.missedSlots++;
          this.streak = 0;
          CC.hud.setCombo(1);
          CC.audio.play('miss');
          sl.flash = 1;
          this.syncInfo();
        }
      }
      for (const c of this.placed) c.x -= this.v * dt;
      for (const c of this.strays) {
        c.x -= this.v * dt;
        if (c.lie < 1) c.lie = Math.min(1, c.lie + dt * 3.2);
      }
      while (this.placed.length && this.placed[0].x < -80) this.placed.shift();
      while (this.strays.length && this.strays[0].x < -80) this.strays.shift();

      // settle squash
      for (const c of this.placed) if (c.settle < 1) c.settle = Math.min(1, c.settle + dt * 5);

      // falling cone — arcs back from the truck bed onto its target marker
      if (this.falling) {
        const f = this.falling;
        f.vy += L.H * 5.5 * dt;
        f.y += f.vy * dt;
        if (f.slot) {
          f.landY = f.slot.y;
          const p = clamp((f.y - f.startY) / Math.max(1, f.landY - f.startY), 0, 1);
          f.x = lerp(f.startX, f.slot.x, easeInOut(p));
        }
        if (f.y >= f.landY) {
          this.falling = null;
          this.land(f, L);
        }
      }

      if (this.reloadT > 0) this.reloadT -= dt;
      if (this.throwT < 1) this.throwT += dt * 3.5;

      // background opposite-carriageway traffic
      this.bgCarT -= dt;
      if (this.bgCarT <= 0) {
        const dir = Math.random() < 0.5 ? 1 : -1;
        this.bgCars.push({
          x: dir > 0 ? -80 : L.W + 80,
          y: L.hor + L.H * rand(0.025, 0.06),
          v: dir * rand(280, 420) * L.s,
          c: CC.util.pick(['#8FA3BF', '#C2CCD9', '#6B7888', '#A88B72'])
        });
        this.bgCarT = rand(1.6, 3.4);
        if (Math.random() < 0.4) CC.audio.play('whoosh');
      }
      for (let i = this.bgCars.length - 1; i >= 0; i--) {
        const c = this.bgCars[i];
        c.x += c.v * dt;
        if (c.x < -150 || c.x > L.W + 150) this.bgCars.splice(i, 1);
      }

      if (this.banner) this.bannerT += dt;

      // stage end check
      if (this.phase === 'play' && this.spawned === SLOTS && !this.falling) {
        const allResolved = this.slots.every((sl) => sl.filled || sl.missed);
        if (allResolved) this.finish(L);
      }
    },

    drop() {
      if (this.phase !== 'play') return;
      if (this.falling || this.reloadT > 0) { CC.audio.play('denied'); return; }
      const L = this.layout();

      // judged at release: how close is a pending marker to the drop line?
      let best = null, bd = 1e9;
      for (const sl of this.slots) {
        if (sl.filled || sl.missed || sl.reserved) continue;
        const d = Math.abs(sl.x - L.dropX);
        if (d < bd) { bd = d; best = sl; }
      }

      let slot = null, grade = null;
      if (best && bd <= 64 * L.s) {
        slot = best;
        slot.reserved = true;
        grade = bd <= 16 * L.s ? 'perfect' : bd <= 38 * L.s ? 'good' : 'ok';
      }

      const landY = slot ? slot.y
        : this.taperY(Math.min(this.deployed + this.missedSlots, SLOTS - 1) / (SLOTS - 1));
      this.falling = {
        x: L.dropX, y: L.bedY, startX: L.dropX, startY: L.bedY,
        vy: 90, landY, slot, grade
      };
      this.reloadT = 0.55;
      this.throwT = 0;
      CC.audio.play('drop');
    },

    land(f, L) {
      if (!f.slot) {
        // stray cone — tips over on the tarmac
        this.strays.push({ x: f.x, y: f.landY, lie: 0.05, dir: Math.random() < 0.5 ? -1 : 1 });
        this.streak = 0;
        CC.hud.setCombo(1);
        CC.fx.dust(f.x, f.landY, 6);
        CC.fx.shake(4);
        CC.audio.play('fall');
        CC.fx.floater(f.x, f.landY - L.coneH * 1.3, t('grade.miss'), { color: '#FF5A5A', size: Math.max(20, L.coneH * 0.42) });
        return;
      }

      const slot = f.slot, grade = f.grade;
      let pts;
      if (grade === 'perfect') {
        this.streak++;
        this.perfects++;
        const mult = Math.min(this.streak, 4);
        this.bestMult = Math.max(this.bestMult, mult);
        pts = 300 * mult;
        CC.hud.setCombo(mult);
        if (mult >= 2) CC.audio.play('combo', mult);
        CC.fx.ring(slot.x, slot.y - L.coneH * 0.5, { r1: L.coneH * 1.6, color: '#FFD9A8' });
      } else if (grade === 'good') {
        this.streak = 0; CC.hud.setCombo(1);
        pts = 150;
      } else {
        this.streak = 0; CC.hud.setCombo(1);
        pts = 60;
      }

      slot.filled = true;
      slot.reserved = false;
      slot.grade = grade;
      this.deployed++;
      this.firstFill = true;
      this.placed.push({ x: slot.x, y: slot.y, settle: 0 });

      CC.flow.score(pts);
      CC.audio.play('land');
      CC.audio.play(grade);
      CC.fx.dust(slot.x, slot.y, 6);
      CC.fx.shake(grade === 'perfect' ? 3 : 2);
      const col = grade === 'perfect' ? '#FFC400' : grade === 'good' ? '#9FF09F' : '#CFD6E2';
      CC.fx.floater(slot.x, slot.y - L.coneH * 1.5, `${t('grade.' + grade)}  +${pts}`,
        { color: col, size: Math.max(20, L.coneH * (grade === 'perfect' ? 0.5 : 0.4)) });
      this.syncInfo();
    },

    finish(L) {
      this.phase = 'outro';
      this.outroT = 0;
      this.banner = t('banner.s2done');
      this.bannerT = 0;
      this.board = { x: L.W + 160 };
      if (this.deployed === SLOTS) {
        this.taperBonus = 1200;
        CC.flow.score(1200);
        CC.fx.floater(L.W / 2, L.H * 0.30, t('result.taperBonus') + ' +1200', { color: '#FFC400', size: 26, dur: 1.5 });
      }
      CC.fx.confetti(L.W / 2, L.H * 0.35, 60);
      CC.audio.play('clear');
    },

    onPress() { this.drop(); },
    onAction() { this.drop(); },

    /* ---------------- drawing ---------------- */

    draw(ctx) {
      const L = this.layout();
      const { W, H } = L;

      // dusk sky (cached)
      const key = W + 'x' + H;
      if (this.skyKey !== key) {
        const g = ctx.createLinearGradient(0, 0, 0, L.roadTop);
        g.addColorStop(0, '#1A2147');
        g.addColorStop(0.55, '#4A3158');
        g.addColorStop(0.85, '#C75B3C');
        g.addColorStop(1, '#E8854A');
        this.skyGrad = g;
        this.skyKey = key;
      }
      ctx.fillStyle = this.skyGrad;
      ctx.fillRect(0, 0, W, L.roadTop);

      // low sun
      const sg = ctx.createRadialGradient(W * 0.78, L.hor, 6, W * 0.78, L.hor, W * 0.3);
      sg.addColorStop(0, 'rgba(255,210,140,0.8)');
      sg.addColorStop(0.18, 'rgba(255,170,90,0.35)');
      sg.addColorStop(1, 'rgba(255,170,90,0)');
      ctx.fillStyle = sg;
      ctx.fillRect(0, 0, W, L.roadTop);

      // distant hills
      ctx.fillStyle = '#2A2238';
      ctx.beginPath();
      ctx.moveTo(0, L.hor + 2);
      for (let x = 0; x <= W; x += W / 12) {
        ctx.lineTo(x, L.hor - 10 - 30 * Math.abs(Math.sin(x * 0.008 + 5)));
      }
      ctx.lineTo(W, L.hor + 2);
      ctx.closePath();
      ctx.fill();

      // opposite carriageway strip + bg cars
      ctx.fillStyle = '#23222B';
      ctx.fillRect(0, L.hor, W, L.roadTop - L.hor);
      for (const c of this.bgCars) {
        ctx.fillStyle = c.c;
        CC.util.rr(ctx, c.x - 26, c.y - 11, 52, 12, 4);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,210,0.8)';
        ctx.fillRect(c.v > 0 ? c.x + 22 : c.x - 26, c.y - 8, 4, 3);
      }
      // guardrail
      ctx.fillStyle = '#3A4150';
      ctx.fillRect(0, L.roadTop - 8, W, 4);
      ctx.fillStyle = '#2A2F3A';
      for (let k = 0; k < 24; k++) {
        const px = ((k * 110 - this.scroll * 0.85) % (W + 120) + W + 120) % (W + 120) - 60;
        ctx.fillRect(px, L.roadTop - 8, 5, 10);
      }

      // main road
      const rg = ctx.createLinearGradient(0, L.roadTop, 0, L.roadBot);
      rg.addColorStop(0, '#33363F');
      rg.addColorStop(1, '#3E424D');
      ctx.fillStyle = rg;
      ctx.fillRect(0, L.roadTop, W, L.roadBot - L.roadTop);

      // edge lines
      ctx.fillStyle = '#EDEAE0';
      ctx.fillRect(0, L.roadTop + 6, W, 4);
      ctx.fillRect(0, L.roadBot - 8, W, 5);
      // dashed centre line (scrolls)
      const period = 130;
      const off = -((this.scroll % period) + period) % period;
      ctx.fillStyle = 'rgba(237,234,224,0.85)';
      for (let x = off; x < W + period; x += period) {
        ctx.fillRect(x, L.midY - 3, 64, 6);
      }
      // grass below
      ctx.fillStyle = '#15201A';
      ctx.fillRect(0, L.roadBot, W, H - L.roadBot);

      // markers (ghost cones)
      for (const sl of this.slots) {
        if (sl.filled) continue;
        if (sl.missed) {
          if (sl.flash > 0) {
            ctx.globalAlpha = clamp(sl.flash, 0, 1);
            ctx.strokeStyle = '#FF5A5A';
            ctx.lineWidth = 4;
            const r = L.coneH * 0.45;
            ctx.beginPath();
            ctx.moveTo(sl.x - r, sl.y - r * 2); ctx.lineTo(sl.x + r, sl.y);
            ctx.moveTo(sl.x + r, sl.y - r * 2); ctx.lineTo(sl.x - r, sl.y);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
          continue;
        }
        CC.cone.draw(ctx, { x: sl.x, y: sl.y, h: L.coneH, ghost: true });
      }

      // drop line marker
      if (this.phase !== 'outro') {
        const pul = 0.5 + 0.5 * Math.sin(this.t * 6);
        ctx.fillStyle = `rgba(255,196,0,${0.35 + 0.3 * pul})`;
        const my = this.falling ? this.falling.landY : (this.nextPendingY() || L.midY + 30);
        ctx.beginPath();
        ctx.moveTo(L.dropX, my + 14);
        ctx.lineTo(L.dropX - 9, my + 26);
        ctx.lineTo(L.dropX + 9, my + 26);
        ctx.closePath();
        ctx.fill();
        if (!this.firstFill && this.phase === 'play') {
          ctx.font = `${Math.max(14, L.coneH * 0.34)}px ${CC.fx.FONT}`;
          ctx.textAlign = 'center';
          ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.5 * pul})`;
          ctx.fillText('▼', L.dropX, my - L.coneH * 1.5);
        }
      }

      this.drawTruck(ctx, L);

      // placed cones (closer to camera than the truck)
      for (const c of this.placed) {
        const squash = (1 - easeOutCubic(c.settle)) * 0.22;
        CC.cone.draw(ctx, { x: c.x, y: c.y, h: L.coneH, squash });
      }
      for (const c of this.strays) {
        CC.cone.draw(ctx, { x: c.x, y: c.y, h: L.coneH, lie: easeOutCubic(c.lie), lieDir: c.dir });
      }

      // falling cone in front of everything
      if (this.falling) {
        CC.cone.draw(ctx, { x: this.falling.x, y: this.falling.y, h: L.coneH, shadow: false, tilt: 0.05 });
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(this.falling.x, this.falling.landY, L.coneH * 0.3, 4, 0, 0, TAU);
        ctx.fill();
      }

      if (this.board) this.drawBoard(ctx, L);

      this.drawBanners(ctx, L);
    },

    nextPendingY() {
      for (const sl of this.slots) if (!sl.filled && !sl.missed) return sl.y;
      return null;
    },

    drawTruck(ctx, L) {
      const x = L.dropX;            // rear of the truck
      const len = clamp(L.W * 0.22, 170, 280);
      const y = L.truckY + Math.sin(this.t * 9) * 1.5;
      const bedTop = L.bedY;
      const cabW = len * 0.34;

      ctx.save();

      // shadow
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(x + len / 2, y + 6, len * 0.55, 10, 0, 0, TAU);
      ctx.fill();

      // flatbed
      ctx.fillStyle = '#262A33';
      CC.util.rr(ctx, x, bedTop + 26, len - cabW + 10, y - bedTop - 22, 4);
      ctx.fill();
      ctx.fillStyle = '#3A4150';
      CC.util.rr(ctx, x - 4, bedTop + 18, len - cabW + 16, 12, 3);
      ctx.fill();
      // bed rail
      ctx.fillStyle = '#2E3340';
      ctx.fillRect(x - 4, bedTop - 6, 6, 28);

      // supply cones on the bed
      const sh = L.coneH * 0.78;
      for (let i = 0; i < 4; i++) {
        CC.cone.draw(ctx, {
          x: x + 30 + i * sh * 0.45, y: bedTop + 22, h: sh,
          shadow: false, tilt: 0
        });
      }

      // crew member at the rear of the bed
      const wx = x + 14, wy = bedTop + 20;
      const throwK = this.throwT < 1 ? Math.sin(Math.PI * clamp(this.throwT, 0, 1)) : 0;
      ctx.lineCap = 'round';
      // legs
      ctx.strokeStyle = '#23262E';
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx - 3, wy - 14); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(wx + 4, wy); ctx.lineTo(wx + 3, wy - 14); ctx.stroke();
      // hi-vis torso
      ctx.fillStyle = '#FFB400';
      CC.util.rr(ctx, wx - 6, wy - 30, 13, 18, 3);
      ctx.fill();
      ctx.fillStyle = '#EDF1F6';
      ctx.fillRect(wx - 6, wy - 25, 13, 3);
      // head + helmet
      ctx.fillStyle = '#E8B88F';
      ctx.beginPath(); ctx.arc(wx + 1, wy - 36, 5, 0, TAU); ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath(); ctx.arc(wx + 1, wy - 38, 5.5, Math.PI, 0); ctx.fill();
      // throwing arm
      ctx.strokeStyle = '#FFB400';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(wx, wy - 26);
      ctx.lineTo(wx - 10 - throwK * 8, wy - 22 + throwK * 12);
      ctx.stroke();

      // cab
      const cx = x + len - cabW;
      ctx.fillStyle = CC.cone.ORANGE;
      CC.util.rr(ctx, cx, bedTop - 4, cabW, y - bedTop + 2, 7);
      ctx.fill();
      ctx.fillStyle = '#D63A12';
      ctx.fillRect(cx, y - 14, cabW, 12);
      // window
      ctx.fillStyle = '#BFE3F2';
      CC.util.rr(ctx, cx + cabW * 0.42, bedTop + 2, cabW * 0.46, (y - bedTop) * 0.42, 5);
      ctx.fill();
      // EHS door logo
      ctx.font = `bold ${Math.max(11, cabW * 0.16)}px ${CC.fx.FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('EHS', cx + cabW * 0.34, bedTop + (y - bedTop) * 0.62);
      // beacon
      const blink = Math.sin(this.t * 9) > 0;
      ctx.fillStyle = blink ? '#FFC400' : '#8F6A00';
      CC.util.rr(ctx, cx + cabW * 0.5 - 6, bedTop - 12, 12, 9, 3);
      ctx.fill();
      if (blink) {
        const bg = ctx.createRadialGradient(cx + cabW * 0.5, bedTop - 8, 2, cx + cabW * 0.5, bedTop - 8, 46);
        bg.addColorStop(0, 'rgba(255,196,0,0.45)');
        bg.addColorStop(1, 'rgba(255,196,0,0)');
        ctx.fillStyle = bg;
        ctx.beginPath(); ctx.arc(cx + cabW * 0.5, bedTop - 8, 46, 0, TAU); ctx.fill();
      }

      // wheels
      const wr = Math.max(10, L.coneH * 0.26);
      for (const wxp of [x + len * 0.16, x + len * 0.82]) {
        ctx.fillStyle = '#14161A';
        ctx.beginPath(); ctx.arc(wxp, y, wr, 0, TAU); ctx.fill();
        ctx.fillStyle = '#3A4150';
        ctx.beginPath(); ctx.arc(wxp, y, wr * 0.45, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#14161A';
        ctx.lineWidth = 2;
        const a = this.scroll / wr;
        ctx.beginPath();
        ctx.moveTo(wxp - Math.cos(a) * wr * 0.4, y - Math.sin(a) * wr * 0.4);
        ctx.lineTo(wxp + Math.cos(a) * wr * 0.4, y + Math.sin(a) * wr * 0.4);
        ctx.stroke();
      }

      ctx.restore();
    },

    drawBoard(ctx, L) {
      const b = this.board;
      const y = L.midY + 36;
      ctx.save();
      // trailer
      ctx.fillStyle = '#2A2F3A';
      CC.util.rr(ctx, b.x - 44, y - 70, 88, 62, 6);
      ctx.fill();
      ctx.strokeStyle = '#3A4150';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(b.x - 30, y - 8); ctx.lineTo(b.x - 30, y + 8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(b.x + 30, y - 8); ctx.lineTo(b.x + 30, y + 8); ctx.stroke();
      // blinking chevron pointing to the open lane
      const on = Math.sin(this.t * 7) > -0.2;
      ctx.fillStyle = on ? '#FFC400' : '#5d4a00';
      for (let i = 0; i < 3; i++) {
        const ax = b.x + 18 - i * 18;
        ctx.beginPath();
        ctx.moveTo(ax, y - 58);
        ctx.lineTo(ax - 10, y - 39);
        ctx.lineTo(ax, y - 20);
        ctx.lineTo(ax - 7, y - 39);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    },

    drawBanners(ctx, L) {
      const { W, H } = L;
      if (this.phase === 'ready') {
        const txt = this.readyT < 0.9 ? t('stage.ready') : t('stage.go');
        this.bigText(ctx, W / 2, H * 0.30, txt, Math.min(W, H) * 0.085, '#FFFFFF');
      }
      if (this.banner && this.phase === 'outro') {
        const a = clamp(this.bannerT * 2.2, 0, 1);
        ctx.save();
        ctx.globalAlpha = a;
        this.bigText(ctx, W / 2, H * 0.26, this.banner, Math.min(W, H) * 0.07, '#FFC400');
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

  CC.scenes.add('stage2', S);
})();
