// SPDX-License-Identifier: AGPL-3.0-or-later
// Motorul de sunet: sinteză Web Audio a zumzetului tamburului, a cititorului, a mașinii de scris
// și a comenzilor pupitrului. Nu există înregistrări ale MECIPT-1: timbrurile sunt GHICIT,
// fundamentala zumzetului e DEDUS (50 de rotații ale tamburului pe secundă).

export const HUM_HZ = 50;
export const LEVELS = {
  hum: 0.05,        // zumzetul: fundal discret
  tape: 0.5,        // țăcănitul cititorului
  key: 0.45,        // clapa mașinii de scris
  carriage: 0.35,   // carul, la rând nou
  button: 0.18,     // butoanele pupitrului — mai încete decât mașina
  lever: 0.22,      // pârghiile pupitrului
  buzzTape: 0.16,   // bâzâitul cititorului la ritm mare — mai încet decât clicurile
  buzzType: 0.12,   // ropotul mașinii de scris la ritm mare
};
const FADE_S = 0.03;      // oprirea: fără pocnet, dar imediat
const HUM_IN_S = 1;       // zumzetul apare treptat
const HIDE_S = 0.2;

// Rețetele clicurilor: impulsuri de zgomot filtrat [întârziere s, filtru, frecvență Hz, Q, nivel relativ, stingere s].
const RECIPES = {
  tape: [[0, 'bandpass', 2500, 1.2, 1, 0.012], [0, 'lowpass', 400, 0.7, 0.5, 0.02], [0.012, 'bandpass', 4200, 2, 0.6, 0.008]],
  key: [[0, 'bandpass', 1500, 0.9, 1, 0.03], [0.002, 'lowpass', 300, 0.7, 0.7, 0.04]],
  carriage: [[0, 'bandpass', 700, 0.5, 0.5, 0.15, 0.02], [0.16, 'lowpass', 500, 0.7, 1, 0.05]],
  button: [[0, 'bandpass', 3500, 1.5, 1, 0.006]],
  lever: [[0, 'bandpass', 2200, 1.2, 1, 0.006], [0.009, 'bandpass', 1600, 1.2, 0.8, 0.01]],
};

const defaultContext = () => {
  const C = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!C) throw new Error('fără Web Audio');
  return new C();
};

export class SoundEngine {
  constructor({ createContext = defaultContext } = {}) {
    this.createContext = createContext;
    this.ctx = null;
    this.failed = false;
    this._enabled = true;
    this.hidden = false;
    this.live = new Set();      // sursele programate, ca stopAll să le poată opri
  }

  get available() { return !!this.ctx; }
  get enabled() { return this._enabled; }
  now() { return this.ctx ? this.ctx.currentTime : 0; }
  buzzGain(source) { return this.buzzers ? this.buzzers[source] : null; }

  // La primul gest al vizitatorului: creează (sau reia) contextul. false dacă browserul nu poate.
  unlock() {
    if (this.ctx) { this.resume(); return true; }
    if (this.failed) return false;
    try {
      this.ctx = this.createContext();
      this.build();
    } catch {
      this.ctx = null;
      this.failed = true;
      return false;
    }
    this.resume();
    this.apply();
    return true;
  }

  resume() {
    try { const p = this.ctx.resume && this.ctx.resume(); if (p && p.catch) p.catch(() => {}); } catch { /* nu e grav */ }
  }

  build() {
    const c = this.ctx;
    this.master = c.createGain();
    this.master.gain.setValueAtTime(0, c.currentTime);
    this.master.connect(c.destination);
    this.noise = this.noiseBuffer(1);

    // zumzetul: 50 Hz și armonicele lui, plus zgomotul lagărului
    this.hum = c.createGain();
    this.hum.gain.setValueAtTime(0, c.currentTime);
    this.hum.connect(this.master);
    for (const [k, g] of [[1, 1], [2, 0.6], [3, 0.35], [4, 0.2], [6, 0.1]]) {
      const o = c.createOscillator();
      o.type = 'sine';
      o.frequency.value = HUM_HZ * k;
      const gn = c.createGain();
      gn.gain.value = g;
      o.connect(gn).connect(this.hum);
      o.start(c.currentTime);
    }
    const bearing = this.loop(this.noise, 'bandpass', 220, 2);
    bearing.gain.gain.value = 0.3;
    bearing.out.connect(this.hum);

    // bâzâitul: trenuri de clicuri foarte dese, în buclă, pornite mereu, cu câștigul 0 până e nevoie
    this.buzzers = {};
    this.buzzOn = { tape: false, type: false };
    for (const [src, every, f] of [['tape', 0.001, 2600], ['type', 0.003, 1200]]) {
      const l = this.loop(this.clickTrain(0.5, every), 'bandpass', f, 0.8);
      l.gain.gain.setValueAtTime(0, c.currentTime);
      l.out.connect(this.master);
      this.buzzers[src] = l.gain;
    }
  }

  noiseBuffer(seconds) {
    const c = this.ctx;
    const b = c.createBuffer(1, Math.floor(c.sampleRate * seconds), c.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }

  clickTrain(seconds, every) {
    const c = this.ctx;
    const b = c.createBuffer(1, Math.floor(c.sampleRate * seconds), c.sampleRate);
    const d = b.getChannelData(0);
    const step = Math.max(1, Math.floor(c.sampleRate * every));
    const decay = Math.max(1, Math.floor(c.sampleRate * 0.0003));
    for (let s = 0; s < d.length; s += step) {
      const start = s + Math.floor(Math.random() * step * 0.3);
      const a = 0.5 + Math.random() * 0.5;
      for (let i = 0; i < decay * 4 && start + i < d.length; i++) d[start + i] += a * (Math.random() * 2 - 1) * Math.exp(-i / decay);
    }
    return b;
  }

  loop(buffer, type, f, q) {
    const c = this.ctx;
    const s = c.createBufferSource();
    s.buffer = buffer;
    s.loop = true;
    const fl = c.createBiquadFilter();
    fl.type = type;
    fl.frequency.value = f;
    fl.Q.value = q;
    const gain = c.createGain();
    s.connect(fl).connect(gain);
    s.start(c.currentTime);
    return { gain, out: gain };
  }

  ramp(param, v, seconds) {
    const t = this.ctx.currentTime;
    param.cancelScheduledValues(t);
    param.setValueAtTime(param.value, t);
    param.linearRampToValueAtTime(v, t + seconds);
  }

  // Câștigurile urmează alegerea vizitatorului și vizibilitatea tabului.
  apply(masterSeconds = FADE_S) {
    if (!this.ctx) return;
    const on = this._enabled && !this.hidden;
    this.ramp(this.master.gain, on ? 1 : 0, on ? masterSeconds : (this.hidden ? HIDE_S : FADE_S));
    if (on) { if (this.hum.gain.value < LEVELS.hum) this.ramp(this.hum.gain, LEVELS.hum, HUM_IN_S); }
    else if (!this.hidden) this.ramp(this.hum.gain, 0, FADE_S);     // la repornire zumzetul crește iar treptat
  }

  setEnabled(on) {
    this._enabled = !!on;
    if (this.ctx && on) this.resume();
    this.apply();
  }

  setHidden(hidden) {
    this.hidden = !!hidden;
    this.apply(HUM_IN_S);
  }

  play(kind, t) {
    if (!this.ctx || !this._enabled || this.hidden) return;
    const recipe = RECIPES[kind];
    if (!recipe) return;
    const at = Math.max(t ?? this.ctx.currentTime, this.ctx.currentTime);
    const level = LEVELS[kind];
    for (const [delay, type, f, q, rel, decay, attack = 0.001] of recipe) {
      this.burst(at + delay, type, f * (0.95 + Math.random() * 0.1), q, level * rel, attack, decay);
    }
  }

  burst(t, type, f, q, level, attack, decay) {
    const c = this.ctx;
    const s = c.createBufferSource();
    s.buffer = this.noise;
    const fl = c.createBiquadFilter();
    fl.type = type;
    fl.frequency.value = f;
    fl.Q.value = q;
    const env = c.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(level, t + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    s.connect(fl).connect(env).connect(this.master);
    const offset = Math.random() * 0.8;
    s.start(t, offset);
    s.stop(t + attack + decay + 0.02);
    this.live.add(s);
    s.onended = () => { this.live.delete(s); try { env.disconnect(); } catch { /* deja */ } };
  }

  buzz({ tape, type }) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    for (const [src, on, lvl] of [['tape', tape, LEVELS.buzzTape], ['type', type, LEVELS.buzzType]]) {
      if (this.buzzOn[src] === !!on) continue;    // se programează doar la schimbare
      this.buzzOn[src] = !!on;
      const g = this.buzzers[src].gain;
      g.cancelScheduledValues(t);
      g.setTargetAtTime(on ? lvl : 0, t, on ? 0.03 : 0.06);
    }
  }

  // Reîncărcare / Reset: tac clicurile deja programate și bâzâitul; zumzetul rămâne.
  stopAll() {
    if (!this.ctx) return;
    for (const s of this.live) { try { s.stop(); } catch { /* deja oprită */ } }
    this.live.clear();
    this.buzz({ tape: false, type: false });
  }
}
