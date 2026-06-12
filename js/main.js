/* CONE CREW — main.js : boot, game loop, input plumbing, flow & leaderboard */
(function () {
  'use strict';
  const CC = (window.CC = window.CC || {});

  let canvas, ctx;
  CC.view = { W: 0, H: 0, dpr: 1 };

  /* ---------------- flow : game state machine ---------------- */

  const RANKS = [5500, 11000, 17000]; // rookie | road crew | foreman | legend
  const BOARD_MAX = 10;

  const game = { scores: [0, 0, 0], stats: [null, null, null], total: 0 };
  let banked = 0;
  let stageScore = 0;
  let currentStage = 0;
  let paused = false;

  const flow = {
    get paused() { return paused; },

    score(pts) {
      stageScore += pts;
      CC.hud.setScore(banked + stageScore);
    },
    get stageScore() { return stageScore; },

    newGame() {
      game.scores = [0, 0, 0];
      game.stats = [null, null, null];
      game.total = 0;
      banked = 0;
      stageScore = 0;
      currentStage = 0;
      CC.hud.snapScore(0);
      this.showIntro(1);
    },

    showIntro(n) {
      currentStage = n;
      stageScore = 0;
      CC.fx.clear();
      CC.scenes.go('menu');
      CC.hud.hide();
      CC.ui.show('intro', { n });
    },

    beginStage(n) {
      currentStage = n;
      stageScore = 0;
      CC.ui.hide();
      CC.fx.clear();
      CC.hud.snapScore(banked);
      CC.hud.show();
      CC.scenes.go('stage' + n);
      CC.audio.play('start');
    },

    stageDone(n, stats) {
      banked += stageScore;
      game.scores[n - 1] = stageScore;
      game.stats[n - 1] = stats;
      const sc = stageScore;
      stageScore = 0;
      CC.hud.hide();
      CC.hud.snapScore(banked);
      CC.fx.clear();
      CC.scenes.go('menu');
      CC.ui.show('result', { n, score: sc, stats });
    },

    finishGame() {
      game.total = banked;
      const best = CC.store.get('cc_best', 0);
      const isBest = game.total > best && game.total > 0;
      if (isBest) CC.store.set('cc_best', game.total);
      const board = this.getBoard();
      const qualifies = game.total > 0 &&
        (board.length < BOARD_MAX || game.total > board[board.length - 1].score);
      let rank = 0;
      for (const th of RANKS) if (game.total >= th) rank++;
      CC.fx.clear();
      CC.scenes.go('menu', { celebrate: true });
      CC.ui.show('final', { total: game.total, scores: game.scores, rank, isBest, qualifies });
      CC.audio.play(isBest ? 'record' : 'clear');
    },

    getBoard() { return CC.store.get('cc_board', []); },

    submitScore() {
      const name = (CC.ui.initials || 'AAA').padEnd(3, 'A').slice(0, 3);
      CC.store.set('cc_initials', name);
      const board = this.getBoard();
      const entry = { name, score: game.total, d: Date.now() };
      board.push(entry);
      board.sort((a, b) => b.score - a.score || a.d - b.d);
      board.length = Math.min(board.length, BOARD_MAX);
      CC.store.set('cc_board', board);
      const hi = board.indexOf(entry);
      CC.audio.play('record');
      CC.ui.show('board', { hi });
    },

    goMenu() {
      paused = false;
      currentStage = 0;
      CC.hud.hide();
      CC.fx.clear();
      CC.scenes.go('menu');
      CC.ui.show('menu');
    },

    act(action, data) {
      switch (action) {
        case 'play':          CC.audio.play('ui'); this.newGame(); break;
        case 'howto':         CC.audio.play('ui'); CC.ui.show('howto'); break;
        case 'board':         CC.audio.play('ui'); CC.ui.show('board', { hi: -1 }); break;
        case 'menu':          CC.audio.play('ui'); this.goMenu(); break;
        case 'startStage':    this.beginStage(parseInt(data.n, 10) || 1); break;
        case 'next':
          CC.audio.play('ui');
          if (currentStage < 3) this.showIntro(currentStage + 1);
          else this.finishGame();
          break;
        case 'replay':        CC.audio.play('ui'); this.newGame(); break;
        case 'pause':
          if (currentStage > 0 && !paused && CC.scenes.name.startsWith('stage')) {
            paused = true;
            CC.audio.play('ui');
            CC.ui.show('pause');
          }
          break;
        case 'resume':        paused = false; CC.audio.play('ui'); CC.ui.hide(); break;
        case 'quit':          CC.audio.play('ui'); this.goMenu(); break;
        case 'sound':         CC.audio.toggleMute(); CC.audio.play('ui'); CC.ui.rerender(); break;
        case 'lang':          CC.audio.play('ui'); CC.i18n.toggle(); break;
        case 'fs':            toggleFullscreen(); break;
        case 'enterInitials': CC.audio.play('ui'); CC.ui.show('entry', { total: game.total }); break;
        case 'backspace':     CC.ui.entryKey('BACK'); break;
        case 'saveScore':     this.submitScore(); break;
      }
    }
  };
  CC.flow = flow;

  function toggleFullscreen() {
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen();
    } catch (e) { /* iframe or unsupported — ignore */ }
  }

  /* ---------------- resize ---------------- */

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = window.innerWidth;
    const H = window.innerHeight;
    CC.view.W = W; CC.view.H = H; CC.view.dpr = dpr;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sc = CC.scenes.current;
    if (sc && sc.resize) sc.resize();
  }

  /* ---------------- input ---------------- */

  let lastInput = performance.now();

  function onPointerDown(e) {
    lastInput = performance.now();
    CC.audio.init();
    if (e.target.closest('#overlay') || e.target.closest('#hud')) return;
    if (paused) return;
    const sc = CC.scenes.current;
    if (sc && sc.onPress) sc.onPress(e.clientX, e.clientY, e.pointerId);
  }

  function onKeyDown(e) {
    lastInput = performance.now();
    CC.audio.init();

    // initials entry typing
    if (CC.ui.screenName === 'entry') {
      if (/^[a-zA-Z]$/.test(e.key)) { e.preventDefault(); CC.ui.entryKey(e.key.toUpperCase()); return; }
      if (e.key === 'Backspace') { e.preventDefault(); CC.ui.entryKey('BACK'); return; }
      if (e.key === 'Enter') { e.preventDefault(); CC.ui.entryKey('OK'); return; }
      return;
    }

    if (e.key === 'Escape') {
      if (CC.scenes.name.startsWith('stage')) {
        if (paused) flow.act('resume');
        else flow.act('pause');
      }
      return;
    }

    if (e.key === ' ' || e.key === 'Enter') {
      const prim = document.querySelector('#overlay [data-primary]');
      if (prim) { e.preventDefault(); prim.click(); return; }
      if (!paused) {
        e.preventDefault();
        const sc = CC.scenes.current;
        if (sc && sc.onAction) sc.onAction();
      }
    }
  }

  /* ---------------- main loop ---------------- */

  let last = performance.now();

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    if (!paused) {
      const sc = CC.scenes.current;
      if (sc && sc.update) sc.update(dt);
      CC.fx.update(dt);
    }
    CC.hud.update(dt);

    const sc2 = CC.scenes.current;
    if (sc2 && sc2.draw) {
      const sh = CC.fx.shakeOffset();
      ctx.save();
      ctx.translate(sh.x, sh.y);
      sc2.draw(ctx);
      CC.fx.draw(ctx);
      ctx.restore();
    }

    // booth idle watchdog — abandoned sessions return to the menu
    const idle = (now - lastInput) / 1000;
    if (CC.scenes.name.startsWith('stage') && !paused && idle > 75) flow.goMenu();
    else if (CC.ui.screenName && CC.ui.screenName !== 'menu' && idle > 120) flow.goMenu();

    requestAnimationFrame(frame);
  }

  /* ---------------- boot ---------------- */

  function boot() {
    canvas = document.getElementById('game');
    ctx = canvas.getContext('2d');

    CC.i18n.init();
    CC.ui.init();
    resize();

    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', () => setTimeout(resize, 60));
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('contextmenu', (e) => {
      if (e.target.closest('#app')) e.preventDefault();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && CC.scenes.name.startsWith('stage') && !paused) flow.act('pause');
    });

    CC.scenes.go('menu');
    CC.ui.show('menu');

    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }

    requestAnimationFrame((t0) => { last = t0; requestAnimationFrame(frame); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
