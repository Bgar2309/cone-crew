/* CONE CREW — ui.js : DOM HUD + overlay screens (menu, intro, results, leaderboard…) */
(function () {
  'use strict';
  const CC = (window.CC = window.CC || {});
  const { fmt, clamp } = CC.util;
  const t = (k) => CC.i18n.t(k);

  /* ---------------- HUD ---------------- */

  const hudEls = {};
  let scoreTarget = 0, scoreShown = 0, comboShown = 1;

  const hud = {
    init() {
      hudEls.root = document.getElementById('hud');
      hudEls.stage = document.getElementById('hud-stage');
      hudEls.info = document.getElementById('hud-info');
      hudEls.combo = document.getElementById('hud-combo');
      hudEls.score = document.getElementById('hud-score');
      hudEls.pause = document.getElementById('hud-pause');
      hudEls.pause.addEventListener('click', () => CC.flow.act('pause'));
    },
    show() { hudEls.root.classList.remove('hidden'); },
    hide() { hudEls.root.classList.add('hidden'); },
    setStage(txt) { hudEls.stage.textContent = txt; },
    setInfo(html) { if (hudEls.info.innerHTML !== html) hudEls.info.innerHTML = html; },
    setScore(n) {
      scoreTarget = n;
    },
    snapScore(n) {
      scoreTarget = n; scoreShown = n;
      hudEls.score.textContent = fmt(n);
    },
    setCombo(m) {
      if (m === comboShown) return;
      comboShown = m;
      if (m >= 2) {
        hudEls.combo.textContent = 'x' + m;
        hudEls.combo.classList.remove('hidden');
        hudEls.combo.classList.remove('pulse');
        void hudEls.combo.offsetWidth; // restart animation
        hudEls.combo.classList.add('pulse');
      } else {
        hudEls.combo.classList.add('hidden');
      }
    },
    update(dt) {
      if (Math.abs(scoreTarget - scoreShown) > 0.5) {
        scoreShown += (scoreTarget - scoreShown) * Math.min(1, dt * 9);
        if (Math.abs(scoreTarget - scoreShown) < 1) scoreShown = scoreTarget;
        hudEls.score.textContent = fmt(scoreShown);
      }
    }
  };

  /* ---------------- Overlay screens ---------------- */

  let overlay = null;
  let last = null;          // {name, params} for i18n rerender
  let initials = '';        // entry screen state

  const coneIcon = (cls) =>
    `<svg class="cone-icon ${cls || ''}" viewBox="0 0 64 72" aria-hidden="true"><use href="#icn-cone"/></svg>`;

  function stageMeta(n) {
    return {
      name: t(`s${n}.name`),
      task: t(`s${n}.task`),
      hint: t(`s${n}.hint`)
    };
  }

  const screens = {

    menu() {
      const best = CC.store.get('cc_best', 0);
      return `
      <div class="screen menu">
        <div class="menu-bar">
          <span class="brand-badge">EHS</span>
          <div class="menu-tools">
            <button class="tool-btn" data-act="sound" aria-label="sound">${CC.audio.muted ? '🔇' : '🔊'}</button>
            <button class="tool-btn" data-act="lang" aria-label="language">${CC.i18n.lang === 'fr' ? 'EN' : 'FR'}</button>
            <button class="tool-btn" data-act="fs" aria-label="fullscreen">⛶</button>
          </div>
        </div>
        <div class="menu-center">
          <div class="title-kicker">EHS · ROADWORKS ARCADE</div>
          <h1 class="game-title"><span>CONE</span> <span class="t-orange">CREW</span></h1>
          <div class="hazard-bar"></div>
          <p class="tagline">${t('menu.tagline')}</p>
          <div class="menu-actions">
            <button class="btn btn-primary btn-xl" data-act="play" data-primary>${t('menu.play')}</button>
            <div class="menu-row2">
              <button class="btn btn-ghost" data-act="howto">${t('menu.howto')}</button>
              <button class="btn btn-ghost" data-act="board">${t('menu.board')}</button>
            </div>
          </div>
          ${best > 0 ? `<div class="best-chip">★ ${t('menu.best')} : <b>${fmt(best)}</b></div>` : ''}
        </div>
        <div class="menu-credit">${t('menu.credit')}</div>
      </div>`;
    },

    howto() {
      const row = (n) => {
        const m = stageMeta(n);
        return `
        <div class="howto-row">
          <div class="howto-num">${n}</div>
          ${coneIcon('small')}
          <div class="howto-txt">
            <b>${m.name}</b>
            <span>${m.task}</span>
          </div>
        </div>`;
      };
      return `
      <div class="screen dim">
        <div class="card">
          <div class="card-kicker">${t('howto.title')}</div>
          ${row(1)}${row(2)}${row(3)}
          <div class="card-actions">
            <button class="btn btn-primary" data-act="menu" data-primary>${t('howto.close')}</button>
          </div>
        </div>
      </div>`;
    },

    intro(p) {
      const m = stageMeta(p.n);
      return `
      <div class="screen dim">
        <div class="card intro-card">
          <div class="card-kicker">${t('stage.word')} ${p.n}<span class="dim-txt">/3</span></div>
          <h2 class="card-title">${m.name}</h2>
          <div class="intro-icon">${coneIcon('big')}</div>
          <p class="card-task">${m.task}</p>
          <p class="card-hint">${m.hint}</p>
          <div class="card-actions">
            <button class="btn btn-primary btn-xl" data-act="startStage" data-n="${p.n}" data-primary>${t('stage.start')}</button>
          </div>
        </div>
      </div>`;
    },

    result(p) {
      const rows = (p.stats || [])
        .map(([k, v, hot]) => `<div class="stat-row ${hot ? 'hot' : ''}"><span>${t(k)}</span><b>${v}</b></div>`)
        .join('');
      return `
      <div class="screen dim">
        <div class="card">
          <div class="card-kicker">${t('stage.word')} ${p.n}/3 — ${stageMeta(p.n).name}</div>
          <h2 class="card-title small">${t('result.clear')}</h2>
          <div class="score-big">${fmt(p.score)}</div>
          <div class="stats">${rows}</div>
          <div class="card-actions">
            <button class="btn btn-primary btn-xl" data-act="next" data-primary>${t('result.next')} →</button>
          </div>
        </div>
      </div>`;
    },

    final(p) {
      const names = [1, 2, 3].map((n) => stageMeta(n).name);
      const rows = p.scores
        .map((s, i) => `<div class="stat-row"><span>${i + 1} · ${names[i]}</span><b>${fmt(s)}</b></div>`)
        .join('');
      return `
      <div class="screen dim">
        <div class="card">
          <div class="card-kicker">${t('final.title')}</div>
          <div class="rank-line">${coneIcon('small')}<h2 class="card-title rank">${t('rank.' + p.rank)}</h2>${coneIcon('small')}</div>
          ${p.isBest ? `<div class="new-record">★ ${t('final.newBest')} ★</div>` : ''}
          <div class="score-label">${t('final.total')}</div>
          <div class="score-big">${fmt(p.total)}</div>
          <div class="stats">${rows}</div>
          <div class="card-actions col">
            ${p.qualifies
              ? `<button class="btn btn-primary btn-xl" data-act="enterInitials" data-primary>${t('final.save')}</button>`
              : `<button class="btn btn-primary btn-xl" data-act="replay" data-primary>${t('final.replay')}</button>`}
            <div class="menu-row2">
              ${p.qualifies ? `<button class="btn btn-ghost" data-act="replay">${t('final.replay')}</button>` : ''}
              <button class="btn btn-ghost" data-act="board">${t('final.board')}</button>
              <button class="btn btn-ghost" data-act="menu">${t('final.menu')}</button>
            </div>
          </div>
          <div class="product-card">
            <div class="pwrap"><img src="assets/revo-42-r2.jpg" alt="EHS REVO 42 R2" loading="lazy"></div>
            <div class="product-txt">
              <b>REVO 42 R2</b>
              <span>${t('final.product')}</span>
            </div>
          </div>
        </div>
      </div>`;
    },

    entry(p) {
      const boxes = [0, 1, 2]
        .map((i) => `<div class="initial-box ${i === initials.length ? 'active' : ''}">${initials[i] || ''}</div>`)
        .join('');
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
        .map((l) => `<button class="key" data-letter="${l}">${l}</button>`)
        .join('');
      return `
      <div class="screen dim">
        <div class="card">
          <div class="card-kicker">★ ${fmt(p.total)} ★</div>
          <h2 class="card-title small">${t('entry.title')}</h2>
          <div class="initials">${boxes}</div>
          <div class="keys">
            ${letters}
            <button class="key key-wide" data-act="backspace">⌫</button>
            <button class="key key-wide key-ok ${initials.length === 3 ? '' : 'disabled'}" data-act="saveScore" data-primary>OK</button>
          </div>
        </div>
      </div>`;
    },

    board(p) {
      const board = CC.flow.getBoard();
      const rows = board.length
        ? board.map((e, i) => `
          <div class="board-row ${i === p.hi ? 'me' : ''} ${i < 3 ? 'top' + (i + 1) : ''}">
            <span class="b-rank">${i + 1}</span>
            <span class="b-name">${e.name}</span>
            <span class="b-score">${fmt(e.score)}</span>
          </div>`).join('')
        : `<div class="board-empty">${t('board.empty')}</div>`;
      return `
      <div class="screen dim">
        <div class="card">
          <div class="card-kicker">EHS · CONE CREW</div>
          <h2 class="card-title small">${t('board.title')}</h2>
          <div class="board">${rows}</div>
          <div class="card-actions">
            <button class="btn btn-primary" data-act="replay" data-primary>${t('final.replay')}</button>
            <button class="btn btn-ghost" data-act="menu">${t('final.menu')}</button>
          </div>
        </div>
      </div>`;
    },

    pause() {
      return `
      <div class="screen dim">
        <div class="card">
          <h2 class="card-title small">${t('pause.title')}</h2>
          <div class="card-actions col">
            <button class="btn btn-primary btn-xl" data-act="resume" data-primary>${t('pause.resume')}</button>
            <button class="btn btn-ghost" data-act="quit">${t('pause.quit')}</button>
          </div>
        </div>
      </div>`;
    }
  };

  const ui = {
    init() {
      overlay = document.getElementById('overlay');
      overlay.addEventListener('click', (e) => {
        const keyBtn = e.target.closest('[data-letter]');
        if (keyBtn) { ui.entryKey(keyBtn.dataset.letter); return; }
        const btn = e.target.closest('[data-act]');
        if (!btn || btn.classList.contains('disabled')) return;
        CC.audio.init();
        CC.flow.act(btn.dataset.act, btn.dataset);
      });
      hud.init();
    },

    show(name, params) {
      const prevName = last ? last.name : null;
      last = { name, params: params || {} };
      if (name === 'entry' && prevName !== 'entry') initials = '';
      overlay.innerHTML = screens[name](last.params);
      overlay.classList.add('show');
      // NB: no auto-focus — Enter is routed to [data-primary] by the key handler,
      // and focusing a fresh button lets the browser's deferred key activation click it.
      const active = document.activeElement;
      if (active && active.blur && active !== document.body) active.blur();
    },

    hide() {
      last = null;
      overlay.classList.remove('show');
      overlay.innerHTML = '';
    },

    rerender() {
      if (last) ui.show(last.name, last.params);
    },

    get screenName() { return last ? last.name : null; },

    /* initials entry — shared by on-screen keys and physical keyboard */
    entryKey(k) {
      if (!last || last.name !== 'entry') return;
      if (k === 'BACK') {
        initials = initials.slice(0, -1);
        CC.audio.play('denied');
      } else if (k === 'OK') {
        if (initials.length === 3) CC.flow.act('saveScore');
        return;
      } else if (/^[A-Z]$/.test(k) && initials.length < 3) {
        initials += k;
        CC.audio.play('ui');
      } else {
        return;
      }
      ui.show('entry', last.params); // refresh boxes
    },

    get initials() { return initials; }
  };

  CC.hud = hud;
  CC.ui = ui;
})();
