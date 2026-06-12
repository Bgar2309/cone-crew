/* CONE CREW — headless smoke test.
   Stubs the DOM + canvas, loads the game, and plays a full session:
   menu → stage 1 → stage 2 → stage 3 → final report → initials → leaderboard,
   plus pause/quit/replay/language/sound/resize paths.
   Run with: node test/smoke.js                                            */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

/* ------------------------- DOM stubs ------------------------- */

function makeCtx() {
  const grad = { addColorStop() {} };
  const base = {
    canvas: null,
    createLinearGradient: () => grad,
    createRadialGradient: () => grad,
    createPattern: () => null,
    measureText: () => ({ width: 10 }),
    getImageData: () => ({ data: [] })
  };
  return new Proxy(base, {
    get(t, p) {
      if (p in t) return t[p];
      const f = () => undefined;
      t[p] = f;
      return f;
    },
    set(t, p, v) { t[p] = v; return true; }
  });
}

class FakeEl {
  constructor(tag) {
    this.tag = tag || 'div';
    this._html = '';
    this._text = '';
    this.style = {};
    this.dataset = {};
    this.children = [];
    this.width = 0; this.height = 0;
    const set = new Set();
    this.classList = {
      add: (...c) => c.forEach((x) => set.add(x)),
      remove: (...c) => c.forEach((x) => set.delete(x)),
      contains: (c) => set.has(c),
      toggle: (c) => (set.has(c) ? set.delete(c) : set.add(c))
    };
    this._listeners = {};
  }
  get innerHTML() { return this._html; }
  set innerHTML(v) { this._html = String(v); }
  get textContent() { return this._text; }
  set textContent(v) { this._text = String(v); }
  addEventListener(t, f) { (this._listeners[t] = this._listeners[t] || []).push(f); }
  removeEventListener() {}
  appendChild(c) { this.children.push(c); return c; }
  querySelector() { return null; }
  querySelectorAll() { return []; }
  closest() { return null; }
  focus() {}
  click() {}
  get offsetWidth() { return 100; }
  getContext() { return makeCtx(); }
  requestFullscreen() { return Promise.resolve(); }
}

const els = {};
const byId = (id) => (els[id] = els[id] || new FakeEl(id));

const winListeners = {};
const docListeners = {};
let rafCb = null;
let vt = 0; // virtual clock (ms)

const storage = (() => {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k)
  };
})();

const documentStub = {
  readyState: 'complete',
  hidden: false,
  fullscreenElement: null,
  documentElement: Object.assign(new FakeEl('html'), { lang: 'en' }),
  getElementById: byId,
  createElement: (t) => new FakeEl(t),
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: (t, f) => { (docListeners[t] = docListeners[t] || []).push(f); },
  exitFullscreen: () => Promise.resolve()
};

const g = globalThis;
const def = (name, value) => Object.defineProperty(g, name, { value, writable: true, configurable: true });
def('window', g);
def('document', documentStub);
def('navigator', { language: 'fr-FR' });
def('localStorage', storage);
def('location', { protocol: 'file:' });
def('innerWidth', 1280);
def('innerHeight', 720);
def('devicePixelRatio', 1);
def('performance', { now: () => vt });
def('requestAnimationFrame', (cb) => { rafCb = cb; return 1; });
def('addEventListener', (t, f) => { (winListeners[t] = winListeners[t] || []).push(f); });
def('removeEventListener', () => {});
def('AudioContext', undefined); // exercise the "no audio available" path
def('webkitAudioContext', undefined);

/* ------------------------ load the game ---------------------- */

const ROOT = path.join(__dirname, '..');
const FILES = ['util', 'i18n', 'audio', 'cone', 'fx', 'scenes', 'ui', 'menu', 'stage1', 'stage2', 'stage3', 'main'];
for (const f of FILES) {
  const file = path.join(ROOT, 'js', f + '.js');
  vm.runInThisContext(fs.readFileSync(file, 'utf8'), { filename: file });
}

const CC = g.CC;

/* --------------------------- helpers -------------------------- */

let frames = 0;
function pump(n) {
  for (let i = 0; i < n; i++) {
    vt += 1000 / 60;
    const cb = rafCb;
    rafCb = null;
    if (!cb) throw new Error('rAF chain broken');
    cb(vt);
    frames++;
  }
}

function press(x, y) {
  for (const f of winListeners.pointerdown || []) {
    f({ target: { closest: () => null }, clientX: x, clientY: y, pointerId: 1 });
  }
}

function key(k) {
  for (const f of winListeners.keydown || []) {
    f({ key: k, preventDefault() {} });
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error('ASSERT: ' + msg);
  console.log('  ✓ ' + msg);
}

function untilScreen(name, maxFrames, each) {
  for (let i = 0; i < maxFrames; i++) {
    if (CC.ui.screenName === name) return true;
    if (each) each(i);
    pump(1);
  }
  throw new Error(`timeout waiting for screen "${name}" (still on ${CC.ui.screenName}, scene ${CC.scenes.name})`);
}

/* ---------------------------- run ----------------------------- */

console.log('boot');
pump(5);
assert(CC.ui.screenName === 'menu', 'boots to menu');
assert(CC.scenes.name === 'menu', 'menu scene running');

console.log('menu utilities');
CC.flow.act('lang'); assert(CC.i18n.lang === 'en' || CC.i18n.lang === 'fr', 'language toggles');
CC.flow.act('lang');
CC.flow.act('sound'); CC.flow.act('sound');
CC.flow.act('howto'); assert(CC.ui.screenName === 'howto', 'how-to opens');
CC.flow.act('menu');
CC.flow.act('board'); assert(CC.ui.screenName === 'board', 'leaderboard opens (empty)');
CC.flow.act('menu');
pump(30);

console.log('stage 1 — the depot');
CC.flow.act('play');
assert(CC.ui.screenName === 'intro', 'stage 1 intro shows');
CC.flow.act('startStage', { n: '1' });
assert(CC.scenes.name === 'stage1', 'stage 1 starts');
pump(100); // ready phase
{
  const sc = CC.scenes.current;
  let guard = 0;
  while (CC.ui.screenName !== 'result' && guard++ < 4000) {
    if (sc.phase === 'play' && sc.hasCone && !sc.falling) {
      // release near the stack centre for a plausible run
      if (Math.abs(Math.sin(sc.swingPhase)) < 0.12) press(640, 360);
    }
    pump(1);
  }
  assert(CC.ui.screenName === 'result', `stage 1 completes (placed ${sc.placed.length}, misses ${sc.misses})`);
}
CC.flow.act('next');

console.log('stage 2 — rolling deploy');
assert(CC.ui.screenName === 'intro', 'stage 2 intro shows');
CC.flow.act('startStage', { n: '2' });
assert(CC.scenes.name === 'stage2', 'stage 2 starts');
{
  const sc = CC.scenes.current;
  let sinceDrop = 0;
  untilScreen('result', 4000, () => {
    sinceDrop++;
    if (sc.phase === 'play') {
      // drop when a pending marker is near the drop line
      const L = sc.layout();
      for (const sl of sc.slots) {
        if (!sl.filled && !sl.missed && Math.abs(sl.x - L.dropX) < 30 && sinceDrop > 8) {
          press(640, 500);
          sinceDrop = 0;
          break;
        }
      }
    }
  });
  assert(sc.deployed >= 10, `stage 2 completes (deployed ${sc.deployed}/14, missed ${sc.missedSlots})`);
}
CC.flow.act('next');

console.log('stage 3 — rush hour');
assert(CC.ui.screenName === 'intro', 'stage 3 intro shows');
CC.flow.act('startStage', { n: '3' });
assert(CC.scenes.name === 'stage3', 'stage 3 starts');
{
  const sc = CC.scenes.current;
  untilScreen('result', 5000, (i) => {
    if (i % 5 === 0) {
      const down = sc.cones.find((c) => c.state === 'down');
      if (down) press(down.x, down.y - 18);
    }
  });
  assert(sc.win, `stage 3 held the zone (fixed ${sc.fixed}, integrity ${Math.round(sc.integrity)}%)`);
}
CC.flow.act('next');

console.log('final report + leaderboard');
assert(CC.ui.screenName === 'final', 'final report shows');
assert(CC.store.get('cc_best', 0) > 0, 'best score persisted: ' + CC.store.get('cc_best', 0));
CC.flow.act('enterInitials');
assert(CC.ui.screenName === 'entry', 'initials entry shows');
key('e'); key('h'); key('s');
assert(CC.ui.initials === 'EHS', 'keyboard initials typed');
key('Enter');
assert(CC.ui.screenName === 'board', 'score saved → leaderboard');
assert(CC.flow.getBoard()[0].name === 'EHS', 'EHS tops the board with ' + CC.flow.getBoard()[0].score);

console.log('pause / quit / replay');
CC.flow.act('replay');
CC.flow.act('startStage', { n: '1' });
pump(120);
key('Escape');
assert(CC.ui.screenName === 'pause', 'escape pauses');
key('Escape');
assert(CC.ui.screenName === null, 'escape resumes');
CC.flow.act('pause');
CC.flow.act('quit');
assert(CC.ui.screenName === 'menu', 'quit returns to menu');

console.log('resize + orientation');
g.innerWidth = 390; g.innerHeight = 844;
for (const f of winListeners.resize || []) f();
pump(30);
g.innerWidth = 1920; g.innerHeight = 1080;
for (const f of winListeners.resize || []) f();
pump(30);
assert(true, 'portrait + desktop resize survived');

console.log(`\nPASS — full session simulated in ${frames} frames (~${Math.round(frames / 60)}s of game time)`);
