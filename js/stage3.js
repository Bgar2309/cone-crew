/* CONE CREW — stage3.js : RUSH HOUR — night shift, keep the line standing for 60s */
(function () {
  'use strict';
  const CC = (window.CC = window.CC || {});
  const { clamp, lerp, rand, randi, pick, TAU, easeOutCubic } = CC.util;
  const t = (k) => CC.i18n.t(k);

  const DURATION = 60;

  const S = {
    enter() {
      this.t = 0;
      this.phase = 'ready';
      this.readyT = 0;
      this.saidReady = false;
      this.saidGo = false;
      this.playT = 0;
      this.integrity = 100;
      this.fixed = 0;
      this.quickStreak = 0;
      this.bestMult = 1;
      this.holdBonus = 0;
      this.win = false;
      this.banner = null;
      this.bannerT = 0;
      this.outroT = -1;
      this.cars = [];
      this.carT = 0.8;
      this.nextGust = 2.4;
      this.nextGraze = 23;
      this.vanAt = 46.5;
      this.vanDone = false;
      this.gustFx = null;
      this.skyGrad = null;
      this.skyKey = '';
      this.buildCones();

      CC.hud.setStage(`${t('stage.word')} 3 — ${t('s3.name')}`);
      CC.hud.setCombo(1);
    },
    exit() { CC.hud.setInfo(''); },

    layout() {
      const W = CC.view.W, H = CC.view.H;
      const s = clamp(W / 1200, 0.72, 1.3);
      return {
        W, H, s,
        trafficTop: H * 0.295,
        lane1: H * 0.36,
        lane2: H * 0.455,
        divider: H * 0.525,
        coneY: H * 0.555,
        zoneTop: H * 0.575,
        zoneBot: H * 0.93,
        coneH: clamp(H * 0.10, 48, 80)
      };
    },

    buildCones() {
      const L = this.layout();
      const n = clamp(Math.floor(L.W / 110), 5, 9);
      this.cones = [];
      for (let i = 0; i < n; i++) {
        const p = n === 1 ? 0.5 : i / (n - 1);
        this.cones.push({
          x: lerp(L.W * 0.09, L.W * 0.91, p),
          y: L.coneY + (i % 2 ? 6 : -2),
          state: 'up',          // up | warn | down | pop
          warn: 0,
          lie: 0,
          lieDir: Math.random() < 0.5 ? -1 : 1,
          downAt: 0,
          popT: 0,
          shine: 0
        });
      }
      this.tapR = Math.max(50, (L.W * 0.82) / n * 0.46);
    },

    resize() { this.buildCones(); },

    downCount() {
      let n = 0;
      for (const c of this.cones) if (c.state === 'down') n++;
      return n;
    },
    upCones() { return this.cones.filter((c) => c.state === 'up'); },

    update(dt) {
      this.t += dt;
      const L = this.layout();

      if (this.phase === 'ready') {
        this.readyT += dt;
        if (!this.saidReady) { this.saidReady = true; CC.audio.play('count'); }
        if (this.readyT > 0.9 && !this.saidGo) { this.saidGo = true; CC.audio.play('countGo'); }
        if (this.readyT > 1.35) this.phase = 'play';
      }

      if (this.phase === 'play') {
        this.playT += dt;
        const ramp = clamp(this.playT / DURATION, 0, 1);

        // integrity
        const down = this.downCount();
        if (down > 0) this.integrity -= 4.5 * down * dt;
        else this.integrity = Math.min(100, this.integrity + 6 * dt);
        if (this.integrity <= 0) { this.integrity = 0; this.finish(false); }

        // wind gusts
        if (this.playT >= this.nextGust) {
          const size = this.playT < 13 ? 1 : this.playT < 30 ? randi(1, 2) : randi(1, 3);
          this.gust(size);
          this.nextGust = this.playT + lerp(3.6, 1.6, ramp) * rand(0.8, 1.2);
        }

        // grazing cars
        if (this.playT >= this.nextGraze) {
          this.spawnGraze(1 + (this.playT > 38 && Math.random() < 0.5 ? 1 : 0), false);
          this.nextGraze = this.playT + rand(8, 13);
        }
        if (!this.vanDone && this.playT >= this.vanAt) {
          this.vanDone = true;
          this.spawnGraze(3, true);
        }

        // timer
        const left = Math.max(0, DURATION - this.playT);
        const mm = Math.floor(left / 60), ss = Math.floor(left % 60);
        CC.hud.setInfo(`<b class="timer ${left < 11 ? 'low' : ''}">${mm}:${String(ss).padStart(2, '0')}</b>`);
        if (left <= 0) this.finish(true);
      }

      // ambient traffic
      this.carT -= dt;
      if (this.carT <= 0 && this.phase !== 'done') {
        this.cars.push({
          x: -160, y: Math.random() < 0.5 ? L.lane1 : L.lane2,
          v: rand(420, 680) * L.s,
          w: rand(64, 92), c: pick(['#39414F', '#4A3F55', '#2F4A45', '#5A4632', '#3E3E46']),
          graze: false
        });
        this.carT = rand(0.8, 1.9);
      }

      for (let i = this.cars.length - 1; i >= 0; i--) {
        const car = this.cars[i];
        car.x += car.v * dt;

        if (car.graze) {
          // dip toward the cone line around the target span
          const inDip = car.x > car.dipX1 && car.x < car.dipX2;
          car.dip = lerp(car.dip || 0, inDip ? 1 : 0, dt * 6);
          car.targets = car.targets.filter((ci) => {
            const cone = this.cones[ci];
            if (!cone) return false;
            const dx = cone.x - car.x;
            if (cone.state === 'up' && dx > 0 && dx < car.v * 0.55 && cone.warn <= 0) {
              cone.warn = dx / car.v;
              cone.state = 'warn';
            }
            if (dx <= 6) {
              // the car passes the cone exactly once — knock it if still standing
              if (cone.state === 'up' || cone.state === 'warn') {
                this.knock(cone, 1);
                CC.fx.shake(car.van ? 10 : 6);
              }
              return false;
            }
            return true;
          });
        }

        // headlights make the reflective bands shine (product moment!)
        for (const cone of this.cones) {
          const dx = cone.x - car.x;
          if (dx > 0 && dx < 190) cone.shine = Math.max(cone.shine, 1 - dx / 190);
        }

        if (car.x > L.W + 220) this.cars.splice(i, 1);
      }

      // cone state animation
      for (const cone of this.cones) {
        cone.shine = Math.max(0, cone.shine - dt * 2.4);
        if (cone.state === 'warn') {
          cone.warn -= dt;
          if (cone.warn <= 0 && cone.gustPending) {
            cone.gustPending = false;
            this.knock(cone, cone.lieDir);
          }
        }
        if (cone.state === 'down' && cone.lie < 1) {
          cone.lie = Math.min(1, cone.lie + dt * 4.5);
        }
        if (cone.state === 'pop') {
          cone.popT += dt * 6;
          cone.lie = Math.max(0, 1 - easeOutCubic(Math.min(cone.popT, 1)));
          if (cone.popT >= 1) { cone.state = 'up'; cone.lie = 0; }
        }
      }

      if (this.gustFx) {
        this.gustFx.t += dt;
        if (this.gustFx.t > 0.7) this.gustFx = null;
      }

      if (this.banner) this.bannerT += dt;

      if (this.phase === 'done') {
        this.outroT += dt;
        if (this.outroT > 2.2) {
          const stats = [
            ['result.fixed', String(this.fixed)],
            ['result.integrity', Math.round(this.integrity) + '%']
          ];
          if (this.holdBonus > 0) stats.push(['result.holdBonus', '+' + this.holdBonus, true]);
          CC.flow.stageDone(3, stats);
        }
      }
    },

    gust(size) {
      const ups = this.upCones();
      if (!ups.length) return;
      const targets = [];
      const first = randi(0, ups.length - 1);
      for (let k = 0; k < size && k < ups.length; k++) {
        targets.push(ups[(first + k) % ups.length]);
      }
      for (const cone of targets) {
        cone.state = 'warn';
        cone.warn = 0.75;
        cone.gustPending = true;
        cone.lieDir = 1;
      }
      this.gustFx = { t: 0 };
      CC.audio.play('gust');
      CC.audio.play('warn');
    },

    spawnGraze(size, van) {
      const L = this.layout();
      const ups = this.upCones();
      if (!ups.length) return;
      const start = randi(0, Math.max(0, ups.length - size));
      const targets = [];
      for (let k = 0; k < size && start + k < ups.length; k++) {
        targets.push(this.cones.indexOf(ups[start + k]));
      }
      const x1 = this.cones[targets[0]].x;
      const x2 = this.cones[targets[targets.length - 1]].x;
      this.cars.push({
        x: -260, y: L.lane2,
        v: (van ? 560 : 640) * L.s,
        w: van ? 130 : 88,
        c: van ? '#C8CDD6' : '#8A2F2F',
        graze: true, van: !!van,
        targets, dipX1: x1 - 240, dipX2: x2 + 120, dip: 0
      });
      CC.audio.play('honk');
    },

    knock(cone, dir) {
      cone.state = 'down';
      cone.gustPending = false;
      cone.lie = 0.12;
      cone.lieDir = dir || 1;
      cone.downAt = this.playT;
      CC.audio.play('fall');
      CC.fx.dust(cone.x, cone.y, 7);
      CC.fx.shake(4);
    },

    onPress(x, y) {
      if (this.phase !== 'play') return;
      let best = null, bd = 1e9;
      for (const cone of this.cones) {
        const d = Math.hypot(cone.x - x, cone.y - 18 - y);
        if (d < bd) { bd = d; best = cone; }
      }
      if (best && bd <= this.tapR && best.state === 'down') {
        this.pop(best);
      } else {
        CC.fx.ring(x, y, { r1: 26, color: 'rgba(255,255,255,0.35)', dur: 0.25, lw: 3 });
      }
    },
    onAction() {},

    pop(cone) {
      const L = this.layout();
      const downFor = this.playT - cone.downAt;
      cone.state = 'pop';
      cone.popT = 0;
      cone.warn = 0;
      cone.gustPending = false;
      this.fixed++;

      let pts, label, color;
      if (downFor < 1.4) {
        this.quickStreak++;
        const mult = Math.min(this.quickStreak, 3);
        this.bestMult = Math.max(this.bestMult, mult);
        pts = 200 * mult;
        label = `${t('grade.quick')} +${pts}`;
        color = '#FFC400';
        CC.hud.setCombo(mult);
        if (mult >= 2) CC.audio.play('combo', mult);
      } else {
        this.quickStreak = 0;
        CC.hud.setCombo(1);
        pts = 100;
        label = '+100';
        color = '#CFD6E2';
      }
      CC.flow.score(pts);
      CC.audio.play('pop');
      CC.fx.ring(cone.x, cone.y - L.coneH * 0.5, { r1: L.coneH * 1.3, color: '#FFD9A8' });
      CC.fx.floater(cone.x, cone.y - L.coneH * 1.4, label, { color, size: Math.max(20, L.coneH * 0.36) });
      CC.fx.burst(cone.x, cone.y - L.coneH * 0.4, { n: 8, colors: ['#FF7A45', '#FFD9A8'], sp: 180, g: 500, size: 4 });
    },

    finish(win) {
      if (this.phase === 'done') return;
      this.phase = 'done';
      this.win = win;
      this.outroT = 0;
      this.banner = win ? t('banner.s3done') : t('banner.breach');
      this.bannerT = 0;
      const L = this.layout();
      if (win) {
        this.holdBonus = 500 + Math.round(this.integrity) * 10;
        CC.flow.score(this.holdBonus);
        CC.fx.confetti(L.W / 2, L.H * 0.3, 80);
        CC.audio.play('clear');
      } else {
        CC.audio.play('fail');
        CC.fx.shake(14);
      }
      CC.hud.setInfo('');
    },

    /* ---------------- drawing ---------------- */

    draw(ctx) {
      const L = this.layout();
      const { W, H } = L;

      // night sky (cached)
      const key = W + 'x' + H;
      if (this.skyKey !== key) {
        const g = ctx.createLinearGradient(0, 0, 0, L.trafficTop);
        g.addColorStop(0, '#05070F');
        g.addColorStop(0.7, '#0D1424');
        g.addColorStop(1, '#1A2030');
        this.skyGrad = g;
        this.skyKey = key;
      }
      ctx.fillStyle = this.skyGrad;
      ctx.fillRect(0, 0, W, L.trafficTop);

      // stars (varied sizes, slow twinkle) + a thin moon glow
      for (let i = 0; i < 34; i++) {
        const sx = (i * 419.7) % W;
        const sy = (i * 173.3) % (L.trafficTop * 0.6);
        const big = CC.tex.hash(i) > 0.8;
        ctx.globalAlpha = (0.14 + 0.22 * Math.abs(Math.sin(this.t * 0.7 + i * 2))) * (big ? 1.6 : 1);
        ctx.fillStyle = big ? '#DCE8FF' : '#FFFFFF';
        ctx.fillRect(sx, sy, big ? 2.4 : 1.5, big ? 2.4 : 1.5);
      }
      ctx.globalAlpha = 1;
      CC.tex.glow(ctx, W * 0.16, L.trafficTop * 0.22, W * 0.06, '190,210,255', 0.16);

      // skyline: varied silhouettes, mixed warm/cool windows, antennas
      for (let i = 0; i < 14; i++) {
        const bw = W / 14;
        const bh = (0.30 + 0.62 * CC.tex.hash(i * 3.7)) * L.trafficTop * 0.55;
        const bx = i * bw;
        const bg2 = ctx.createLinearGradient(0, L.trafficTop - bh, 0, L.trafficTop);
        bg2.addColorStop(0, '#0B0F1A');
        bg2.addColorStop(1, '#10141F');
        ctx.fillStyle = bg2;
        ctx.fillRect(bx, L.trafficTop - bh, bw - 4, bh);
        // rooftop details
        if (CC.tex.hash(i + 40) > 0.6) {
          ctx.fillStyle = '#0B0F1A';
          ctx.fillRect(bx + bw * 0.42, L.trafficTop - bh - 9, 2, 9);
          const beat = Math.sin(this.t * 1.8 + i) > 0.6;
          if (beat) {
            ctx.fillStyle = '#FF3344';
            ctx.fillRect(bx + bw * 0.42 - 1, L.trafficTop - bh - 11, 4, 3);
            CC.tex.glow(ctx, bx + bw * 0.42 + 1, L.trafficTop - bh - 10, 8, '255,60,80', 0.5);
          }
        }
        for (let wy = 0; wy < 4; wy++) {
          for (let wx2 = 0; wx2 < 2; wx2++) {
            if (CC.tex.hash(i * 13 + wy * 5 + wx2) < 0.42) continue;
            const warm = CC.tex.hash(i * 7 + wy + wx2 * 3) > 0.35;
            ctx.fillStyle = warm ? 'rgba(255,206,130,0.30)' : 'rgba(150,190,255,0.22)';
            ctx.fillRect(bx + bw * (0.18 + wx2 * 0.36), L.trafficTop - bh + 7 + wy * 11, 4.5, 5);
          }
        }
      }
      // ground haze in front of the city
      const haze = ctx.createLinearGradient(0, L.trafficTop - 26, 0, L.trafficTop);
      haze.addColorStop(0, 'rgba(20,28,48,0)');
      haze.addColorStop(1, 'rgba(24,32,52,0.55)');
      ctx.fillStyle = haze;
      ctx.fillRect(0, L.trafficTop - 26, W, 26);

      // traffic lanes
      const rg = ctx.createLinearGradient(0, L.trafficTop, 0, L.divider);
      rg.addColorStop(0, '#191C24');
      rg.addColorStop(1, '#262A34');
      ctx.fillStyle = rg;
      ctx.fillRect(0, L.trafficTop, W, L.divider - L.trafficTop);
      CC.tex.overlay(ctx, 0, L.trafficTop, W, L.divider - L.trafficTop, 0.10, CC.tex.asphalt());
      ctx.fillStyle = 'rgba(237,234,224,0.5)';
      ctx.fillRect(0, L.trafficTop + 3, W, 3);
      // lane dashes
      ctx.fillStyle = 'rgba(237,234,224,0.35)';
      const off = -((this.t * 120) % 120);
      for (let x = off; x < W + 120; x += 120) {
        ctx.fillRect(x, (L.lane1 + L.lane2) / 2 + 6, 52, 4);
      }
      // wet-road light streaks under the moving headlights
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const car of this.cars) {
        const cy2 = car.y + (car.dip ? car.dip * (L.divider - car.y - 14) : 0);
        const st = ctx.createLinearGradient(0, cy2, 0, L.divider + 8);
        st.addColorStop(0, 'rgba(255,236,190,0.16)');
        st.addColorStop(1, 'rgba(255,236,190,0)');
        ctx.fillStyle = st;
        ctx.fillRect(car.x + car.w * 0.25, cy2, car.w * 0.9, L.divider + 8 - cy2);
      }
      ctx.restore();

      // cars (behind the cone line)
      for (const car of this.cars) this.drawCar(ctx, car, L);

      // divider line (solid — closed)
      ctx.fillStyle = '#EDEAE0';
      ctx.fillRect(0, L.divider - 2, W, 4);

      // work zone
      const zg = ctx.createLinearGradient(0, L.zoneTop, 0, L.zoneBot);
      zg.addColorStop(0, '#31353F');
      zg.addColorStop(0.5, '#282C36');
      zg.addColorStop(1, '#1F222A');
      ctx.fillStyle = zg;
      ctx.fillRect(0, L.zoneTop, W, L.zoneBot - L.zoneTop);
      CC.tex.overlay(ctx, 0, L.zoneTop, W, L.zoneBot - L.zoneTop, 0.12, CC.tex.asphalt());
      // hazard hatch at the zone edge
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, L.zoneTop, W, 12);
      ctx.clip();
      for (let x = -40; x < W + 40; x += 34) {
        ctx.fillStyle = (x / 34) % 2 ? '#FF4A1F' : '#F4F1E8';
        ctx.beginPath();
        ctx.moveTo(x, L.zoneTop + 12);
        ctx.lineTo(x + 17, L.zoneTop);
        ctx.lineTo(x + 34, L.zoneTop);
        ctx.lineTo(x + 17, L.zoneTop + 12);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      this.drawZone(ctx, L);

      // floodlight pool over the zone
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const fg = ctx.createRadialGradient(W * 0.60, L.zoneTop + 50, 20, W * 0.60, L.zoneTop + 50, W * 0.48);
      fg.addColorStop(0, 'rgba(255,228,175,0.13)');
      fg.addColorStop(1, 'rgba(255,228,175,0)');
      ctx.fillStyle = fg;
      ctx.fillRect(0, L.trafficTop, W, L.zoneBot - L.trafficTop);
      ctx.restore();

      // the cone line
      for (const cone of this.cones) this.drawCone(ctx, cone, L);

      // gust streaks
      if (this.gustFx) {
        const gt = this.gustFx.t / 0.7;
        ctx.save();
        ctx.globalAlpha = Math.sin(Math.PI * gt) * 0.5;
        ctx.strokeStyle = '#DDE6F2';
        ctx.lineWidth = 2.5;
        for (let i = 0; i < 4; i++) {
          const gy = L.coneY - 30 - i * 26 + Math.sin(gt * 9 + i) * 6;
          const gx = lerp(-200, W + 100, gt) + i * 90;
          ctx.beginPath();
          ctx.moveTo(gx, gy);
          ctx.quadraticCurveTo(gx + 70, gy - 8, gx + 150, gy);
          ctx.stroke();
        }
        ctx.restore();
      }

      CC.tex.overlay(ctx, 0, 0, W, H, 0.05);

      this.drawIntegrity(ctx, L);
      this.drawBanners(ctx, L);

      // breach red flash
      if (this.phase === 'done' && !this.win) {
        ctx.fillStyle = `rgba(255,40,40,${0.22 * Math.max(0, 1 - this.outroT)})`;
        ctx.fillRect(0, 0, W, H);
      }
    },

    drawCar(ctx, car, L) {
      const y = car.y + (car.dip ? car.dip * (L.divider - car.y - 14) : 0);
      const w = car.w, h = w * 0.36;
      ctx.save();
      // headlight: wide soft throw + bright core + lamp glow
      ctx.globalCompositeOperation = 'lighter';
      const hb = ctx.createLinearGradient(car.x + w / 2, y, car.x + w / 2 + 230, y);
      hb.addColorStop(0, 'rgba(255,240,200,0.20)');
      hb.addColorStop(1, 'rgba(255,240,200,0)');
      ctx.fillStyle = hb;
      ctx.beginPath();
      ctx.moveTo(car.x + w / 2 - 6, y - 5);
      ctx.lineTo(car.x + w / 2 + 235, y - 22);
      ctx.lineTo(car.x + w / 2 + 235, y + 16);
      ctx.lineTo(car.x + w / 2 - 6, y + 6);
      ctx.closePath();
      ctx.fill();
      const hc = ctx.createLinearGradient(car.x + w / 2, y, car.x + w / 2 + 120, y);
      hc.addColorStop(0, 'rgba(255,248,225,0.30)');
      hc.addColorStop(1, 'rgba(255,248,225,0)');
      ctx.fillStyle = hc;
      ctx.beginPath();
      ctx.moveTo(car.x + w / 2 - 4, y - 3);
      ctx.lineTo(car.x + w / 2 + 125, y - 8);
      ctx.lineTo(car.x + w / 2 + 125, y + 6);
      ctx.lineTo(car.x + w / 2 - 4, y + 4);
      ctx.closePath();
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';

      // body with night shading
      const bodyG = ctx.createLinearGradient(0, y - h * (car.van ? 1.7 : 1.5), 0, y);
      bodyG.addColorStop(0, car.c);
      bodyG.addColorStop(0.75, car.c);
      bodyG.addColorStop(1, 'rgba(5,6,10,0.95)');
      ctx.fillStyle = bodyG;
      CC.util.rr(ctx, car.x - w / 2, y - h, w, h, 7);
      ctx.fill();
      ctx.fillStyle = 'rgba(190,215,255,0.14)';
      ctx.fillRect(car.x - w * 0.36, y - h + 1.5, w * 0.72, 1.8);
      if (car.van) {
        CC.util.rr(ctx, car.x - w / 2, y - h * 1.7, w * 0.8, h, 6);
        ctx.fill();
        ctx.fillStyle = 'rgba(120,150,190,0.7)';
        CC.util.rr(ctx, car.x - w / 2 + 6, y - h * 1.6, w * 0.2, h * 0.55, 3);
        ctx.fill();
      } else {
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        CC.util.rr(ctx, car.x - w * 0.30, y - h * 1.52, w * 0.58, h * 0.62, 6);
        ctx.fill();
        ctx.fillStyle = 'rgba(140,170,210,0.55)';
        CC.util.rr(ctx, car.x - w * 0.26, y - h * 1.46, w * 0.5, h * 0.5, 5);
        ctx.fill();
      }
      // lights
      ctx.fillStyle = '#FFF2C8';
      ctx.fillRect(car.x + w / 2 - 5, y - h * 0.7, 5, 5);
      CC.tex.glow(ctx, car.x + w / 2 - 2, y - h * 0.62, 11, '255,242,200', 0.7);
      ctx.fillStyle = '#FF4040';
      ctx.fillRect(car.x - w / 2, y - h * 0.7, 4, 5);
      CC.tex.glow(ctx, car.x - w / 2 + 2, y - h * 0.62, 9, '255,60,60', 0.6);
      // wheels
      ctx.fillStyle = '#0C0E12';
      ctx.beginPath(); ctx.arc(car.x - w * 0.3, y, h * 0.32, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(car.x + w * 0.3, y, h * 0.32, 0, TAU); ctx.fill();
      ctx.restore();
    },

    drawCone(ctx, cone, L) {
      let tilt = 0;
      if (cone.state === 'warn') {
        tilt = Math.sin(this.t * 26) * 0.09;
        // exclamation
        ctx.font = `${L.coneH * 0.5}px ${CC.fx.FONT}`;
        ctx.textAlign = 'center';
        ctx.fillStyle = `rgba(255,196,0,${0.6 + 0.4 * Math.sin(this.t * 12)})`;
        ctx.fillText('!', cone.x, cone.y - L.coneH * 1.25);
      }
      let squash = 0;
      if (cone.state === 'pop' && cone.popT > 0.7) squash = (1 - cone.popT) * 0.5;

      CC.cone.draw(ctx, {
        x: cone.x, y: cone.y, h: L.coneH,
        tilt,
        lie: cone.state === 'down' ? easeOutCubic(Math.min(cone.lie, 1)) : cone.lie,
        lieDir: cone.lieDir,
        squash,
        flash: cone.shine * 0.9
      });

      // pulsing halo on downed cones (tap target)
      if (cone.state === 'down' && cone.lie > 0.8) {
        const pul = 0.5 + 0.5 * Math.sin(this.t * 7);
        ctx.strokeStyle = `rgba(255,196,0,${0.25 + 0.45 * pul})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cone.x + cone.lieDir * L.coneH * 0.3, cone.y - 8, this.tapR * (0.62 + 0.1 * pul), 0, TAU);
        ctx.stroke();
      }
    },

    drawZone(ctx, L) {
      const { W } = L;
      // gravel pile + patch
      ctx.fillStyle = '#1D2027';
      CC.util.rr(ctx, W * 0.36, L.zoneTop + (L.zoneBot - L.zoneTop) * 0.32, W * 0.3, (L.zoneBot - L.zoneTop) * 0.3, 8);
      ctx.fill();
      ctx.fillStyle = '#4A4E58';
      ctx.beginPath();
      ctx.ellipse(W * 0.31, L.zoneBot - 36, 36, 14, 0, Math.PI, 0);
      ctx.fill();

      // two crew members at work
      this.drawWorker(ctx, W * 0.43, L.zoneTop + (L.zoneBot - L.zoneTop) * 0.55, 0);
      this.drawWorker(ctx, W * 0.58, L.zoneTop + (L.zoneBot - L.zoneTop) * 0.72, 2.1);

      // floodlight tripod with visible beam
      const fx = W * 0.84, fy = L.zoneBot - 10;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const beam = ctx.createLinearGradient(fx, fy - 92, fx - W * 0.34, L.zoneBot);
      beam.addColorStop(0, 'rgba(255,228,170,0.20)');
      beam.addColorStop(1, 'rgba(255,228,170,0)');
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(fx - 12, fy - 96);
      ctx.lineTo(fx - 2, fy - 84);
      ctx.lineTo(fx - W * 0.30, L.zoneBot);
      ctx.lineTo(fx - W * 0.46, L.zoneBot);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = '#3A4150';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(fx - 14, fy); ctx.lineTo(fx, fy - 70);
      ctx.lineTo(fx + 14, fy);
      ctx.moveTo(fx, fy - 70); ctx.lineTo(fx, fy - 86);
      ctx.stroke();
      const lg3 = ctx.createLinearGradient(0, fy - 98, 0, fy - 84);
      lg3.addColorStop(0, '#FFF3D0');
      lg3.addColorStop(1, '#E8B96A');
      ctx.fillStyle = lg3;
      CC.util.rr(ctx, fx - 12, fy - 98, 24, 14, 3);
      ctx.fill();
      CC.tex.glow(ctx, fx - 4, fy - 91, 30, '255,232,180', 0.55);

      // EHS site sign
      const sx = W * 0.93, sy = L.zoneTop + 30;
      CC.tex.softShadow(ctx, sx, sy + 50, 30, 6, 0.3);
      const sg2 = ctx.createLinearGradient(0, sy, 0, sy + 44);
      sg2.addColorStop(0, '#FFFDF6');
      sg2.addColorStop(1, '#DFDACB');
      ctx.fillStyle = sg2;
      CC.util.rr(ctx, sx - 30, sy, 60, 44, 4);
      ctx.fill();
      ctx.strokeStyle = CC.cone.ORANGE;
      ctx.lineWidth = 4;
      CC.util.rr(ctx, sx - 30, sy, 60, 44, 4);
      ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      for (const bx of [-24, 24]) {
        ctx.beginPath(); ctx.arc(sx + bx, sy + 6, 1.6, 0, TAU); ctx.fill();
      }
      ctx.font = `bold 16px ${CC.fx.FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#15171C';
      ctx.fillText('EHS', sx, sy + 22);
      // sign posts
      ctx.strokeStyle = '#2A2F3A';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sx - 14, sy + 44); ctx.lineTo(sx - 14, sy + 52);
      ctx.moveTo(sx + 14, sy + 44); ctx.lineTo(sx + 14, sy + 52);
      ctx.stroke();
    },

    drawWorker(ctx, x, y, phase) {
      const k = Math.sin(this.t * 5 + phase);
      ctx.save();
      ctx.lineCap = 'round';
      // legs
      ctx.strokeStyle = '#23262E';
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x - 5, y - 18); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 5, y); ctx.lineTo(x + 5, y - 18); ctx.stroke();
      // torso
      ctx.fillStyle = '#FFB400';
      CC.util.rr(ctx, x - 8, y - 38, 17, 22, 4);
      ctx.fill();
      ctx.fillStyle = '#EDF1F6';
      ctx.fillRect(x - 8, y - 31, 17, 4);
      // head + helmet
      ctx.fillStyle = '#E8B88F';
      ctx.beginPath(); ctx.arc(x + 1, y - 45, 6, 0, TAU); ctx.fill();
      ctx.fillStyle = '#FF4A1F';
      ctx.beginPath(); ctx.arc(x + 1, y - 47, 6.5, Math.PI, 0); ctx.fill();
      // working arm + shovel
      ctx.strokeStyle = '#FFB400';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(x + 6, y - 33);
      ctx.lineTo(x + 14, y - 26 + k * 4);
      ctx.stroke();
      ctx.strokeStyle = '#6E5232';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + 14, y - 26 + k * 4);
      ctx.lineTo(x + 24, y - 8 + k * 2);
      ctx.stroke();
      ctx.fillStyle = '#9AA3B5';
      ctx.beginPath();
      ctx.ellipse(x + 26, y - 6 + k * 2, 6, 4, 0.6, 0, TAU);
      ctx.fill();
      ctx.restore();
    },

    drawIntegrity(ctx, L) {
      if (this.phase === 'ready') return;
      const { W, H } = L;
      const bw = Math.min(W * 0.5, 420), bh = 14;
      const bx = W / 2 - bw / 2, by = H * 0.105;
      const pct = this.integrity / 100;
      const danger = this.integrity < 30;

      ctx.save();
      ctx.font = `12px ${CC.fx.FONT}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = 'rgba(244,241,232,0.8)';
      ctx.fillText(t('hud.zone'), bx, by - 4);

      ctx.fillStyle = 'rgba(10,12,16,0.7)';
      CC.util.rr(ctx, bx, by, bw, bh, 7);
      ctx.fill();
      if (pct > 0.005) {
        const fill = danger
          ? `rgba(255,70,70,${0.75 + 0.25 * Math.sin(this.t * 10)})`
          : pct < 0.6 ? '#FFC400' : '#5FD98A';
        ctx.fillStyle = fill;
        CC.util.rr(ctx, bx + 2, by + 2, (bw - 4) * pct, bh - 4, 5);
        ctx.fill();
      }
      ctx.strokeStyle = 'rgba(244,241,232,0.35)';
      ctx.lineWidth = 1.5;
      CC.util.rr(ctx, bx, by, bw, bh, 7);
      ctx.stroke();
      ctx.restore();
    },

    drawBanners(ctx, L) {
      const { W, H } = L;
      if (this.phase === 'ready') {
        const txt = this.readyT < 0.9 ? t('stage.ready') : t('stage.go');
        this.bigText(ctx, W / 2, H * 0.45, txt, Math.min(W, H) * 0.085, '#FFFFFF');
      }
      if (this.banner && this.phase === 'done') {
        const a = clamp(this.bannerT * 2.2, 0, 1);
        ctx.save();
        ctx.globalAlpha = a;
        this.bigText(ctx, W / 2, H * 0.45, this.banner, Math.min(W, H) * 0.07,
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

  CC.scenes.add('stage3', S);
})();
