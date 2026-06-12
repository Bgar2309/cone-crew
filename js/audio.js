/* CONE CREW — audio.js : tiny WebAudio synth, no audio files needed */
(function () {
  'use strict';
  const CC = (window.CC = window.CC || {});

  let ctx = null;
  let master = null;
  let noiseBuf = null;
  let muted = !!CC.store.get('cc_mute', false);

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
    // 1s of white noise, reused by every noise-based effect
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && ctx && ctx.state === 'suspended') ctx.resume();
    });
  }

  function tone(o) {
    // o: {f, f2, dur, type, vol, delay, attack}
    if (!ctx) return;
    const t0 = ctx.currentTime + (o.delay || 0);
    const dur = o.dur || 0.12;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = o.type || 'square';
    osc.frequency.setValueAtTime(o.f || 440, t0);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f2), t0 + dur);
    const a = o.attack || 0.004;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(o.vol || 0.2, t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(master);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  }

  function noise(o) {
    // o: {dur, vol, f, f2, q, type, delay}
    if (!ctx) return;
    const t0 = ctx.currentTime + (o.delay || 0);
    const dur = o.dur || 0.2;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    const flt = ctx.createBiquadFilter();
    flt.type = o.type || 'lowpass';
    flt.Q.value = o.q || 1;
    flt.frequency.setValueAtTime(o.f || 800, t0);
    if (o.f2) flt.frequency.exponentialRampToValueAtTime(Math.max(40, o.f2), t0 + dur);
    const g = ctx.createGain();
    const a = o.attack || 0.01;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(o.vol || 0.15, t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(flt); flt.connect(g); g.connect(master);
    src.start(t0); src.stop(t0 + dur + 0.05);
  }

  const recipes = {
    ui()      { tone({ f: 660, type: 'square', dur: 0.06, vol: 0.12 }); },
    denied()  { tone({ f: 220, type: 'square', dur: 0.05, vol: 0.1 }); },
    start()   { [523, 659, 784].forEach((f, i) => tone({ f, type: 'square', dur: 0.1, vol: 0.16, delay: i * 0.09 })); },
    count()   { tone({ f: 440, type: 'square', dur: 0.07, vol: 0.16 }); },
    countGo() { tone({ f: 880, type: 'square', dur: 0.22, vol: 0.2 }); },
    drop()    { noise({ f: 2400, f2: 300, dur: 0.18, vol: 0.1, type: 'bandpass', q: 1.4 }); },
    land()    { tone({ f: 120, f2: 60, type: 'triangle', dur: 0.13, vol: 0.3 }); noise({ f: 900, f2: 200, dur: 0.06, vol: 0.14 }); },
    perfect() {
      tone({ f: 880, type: 'sine', dur: 0.1, vol: 0.2 });
      tone({ f: 1318, type: 'sine', dur: 0.14, vol: 0.18, delay: 0.07 });
      tone({ f: 1760, type: 'sine', dur: 0.18, vol: 0.1, delay: 0.13 });
    },
    good()    { tone({ f: 660, type: 'sine', dur: 0.1, vol: 0.16 }); tone({ f: 880, type: 'sine', dur: 0.1, vol: 0.1, delay: 0.06 }); },
    ok()      { tone({ f: 440, type: 'sine', dur: 0.09, vol: 0.12 }); },
    miss()    { tone({ f: 150, f2: 80, type: 'sawtooth', dur: 0.28, vol: 0.2 }); },
    combo(lvl) {
      const base = 520 + 110 * Math.min(lvl || 2, 5);
      tone({ f: base, type: 'square', dur: 0.07, vol: 0.14 });
      tone({ f: base * 1.5, type: 'square', dur: 0.09, vol: 0.12, delay: 0.06 });
    },
    pop()     { tone({ f: 500, f2: 950, type: 'square', dur: 0.11, vol: 0.18 }); },
    fall()    { tone({ f: 200, f2: 70, type: 'triangle', dur: 0.16, vol: 0.22 }); noise({ f: 600, f2: 150, dur: 0.12, vol: 0.12 }); },
    warn()    { tone({ f: 740, type: 'triangle', dur: 0.08, vol: 0.1 }); tone({ f: 740, type: 'triangle', dur: 0.08, vol: 0.1, delay: 0.12 }); },
    whoosh()  { noise({ f: 300, f2: 1600, dur: 0.4, vol: 0.08, type: 'bandpass', q: 0.8, attack: 0.12 }); },
    gust()    { noise({ f: 200, f2: 1100, dur: 0.55, vol: 0.1, type: 'lowpass', attack: 0.18 }); },
    honk()    { tone({ f: 392, type: 'sawtooth', dur: 0.18, vol: 0.12 }); tone({ f: 494, type: 'sawtooth', dur: 0.18, vol: 0.12 }); },
    clear()   { [523, 659, 784, 1046].forEach((f, i) => tone({ f, type: 'triangle', dur: 0.16, vol: 0.2, delay: i * 0.11 })); },
    fail()    { tone({ f: 220, f2: 110, type: 'sawtooth', dur: 0.5, vol: 0.18 }); tone({ f: 165, f2: 82, type: 'sawtooth', dur: 0.6, vol: 0.14, delay: 0.08 }); },
    record()  { [659, 784, 988, 1318, 1568].forEach((f, i) => tone({ f, type: 'square', dur: 0.13, vol: 0.16, delay: i * 0.09 })); },
    tick()    { tone({ f: 1200, type: 'square', dur: 0.03, vol: 0.07 }); }
  };

  CC.audio = {
    init,
    get muted() { return muted; },
    toggleMute() {
      muted = !muted;
      CC.store.set('cc_mute', muted);
      return muted;
    },
    play(name, arg) {
      if (muted || !ctx) return;
      const r = recipes[name];
      if (r) { try { r(arg); } catch (e) { /* audio is never fatal */ } }
    }
  };
})();
