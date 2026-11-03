// SPDX-License-Identifier: AGPL-3.0-or-later
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SoundEngine, LEVELS, HUM_HZ } from '../../web/js/sound/engine.js';

// Un AudioContext fals: ține minte nodurile, pornirile, opririle și programările parametrilor.
class FakeParam {
  constructor(v = 0) { this.value = v; this.calls = []; }
  setValueAtTime(v, t) { this.calls.push(['set', v, t]); this.value = v; return this; }
  linearRampToValueAtTime(v, t) { this.calls.push(['ramp', v, t]); this.value = v; return this; }
  exponentialRampToValueAtTime(v, t) { this.calls.push(['exp', v, t]); this.value = v; return this; }
  setTargetAtTime(v, t, tc) { this.calls.push(['target', v, t, tc]); this.value = v; return this; }
  cancelScheduledValues(t) { this.calls.push(['cancel', t]); return this; }
  last() { return this.calls.filter((c) => c[0] !== 'cancel').at(-1); }
}
class FakeNode {
  constructor(ctx, type) { this.ctx = ctx; this.kind = type; this.outs = []; ctx.nodes.push(this); }
  connect(n) { this.outs.push(n); return n; }
  disconnect() { this.outs = []; }
}
class FakeSource extends FakeNode {
  constructor(ctx, type) { super(ctx, type); this.started = null; this.stopped = null; this.onended = null; }
  start(t = 0) { this.started = t; }
  stop(t = 0) { this.stopped = t; }
}
class FakeContext {
  constructor() { this.nodes = []; this.currentTime = 0; this.sampleRate = 48000; this.state = 'suspended'; this.destination = new FakeNode(this, 'dest'); }
  resume() { this.state = 'running'; return Promise.resolve(); }
  createGain() { const n = new FakeNode(this, 'gain'); n.gain = new FakeParam(1); return n; }
  createOscillator() { const n = new FakeSource(this, 'osc'); n.frequency = new FakeParam(440); return n; }
  createBiquadFilter() { const n = new FakeNode(this, 'filter'); n.frequency = new FakeParam(350); n.Q = new FakeParam(1); n.gain = new FakeParam(0); return n; }
  createBuffer(ch, len, rate) { const d = new Float32Array(len); return { length: len, sampleRate: rate, numberOfChannels: ch, getChannelData: () => d }; }
  createBufferSource() { const n = new FakeSource(this, 'buffer'); n.buffer = null; n.loop = false; n.playbackRate = new FakeParam(1); return n; }
}
const engine = () => { let ctx; const e = new SoundEngine({ createContext: () => (ctx = new FakeContext()) }); return { e, ctx: () => ctx }; };
const started = (ctx) => ctx.nodes.filter((n) => n.started !== undefined && n.started !== null);
const master = (ctx) => ctx.nodes.find((n) => n.kind === 'gain' && n.outs.includes(ctx.destination));

test('engine: fără AudioContext e indisponibil și nu aruncă', () => {
  const e = new SoundEngine({ createContext: () => { throw new Error('nu există'); } });
  assert.equal(e.unlock(), false);
  assert.equal(e.available, false);
  e.play('tape');
  e.buzz({ tape: true, type: false });
  e.stopAll();
});

test('engine: zumzetul are fundamentala de 50 Hz', () => {
  const { e, ctx } = engine();
  assert.equal(e.unlock(), true);
  assert.equal(HUM_HZ, 50);
  assert.ok(ctx().nodes.some((n) => n.kind === 'osc' && n.frequency.value === 50 && n.started !== null));
});

test('engine: nivelurile — comenzile și bâzâitul mai încete decât mașina', () => {
  const machine = Math.min(LEVELS.tape, LEVELS.key);
  assert.ok(LEVELS.button < machine && LEVELS.lever < machine);
  assert.ok(LEVELS.buzzTape < LEVELS.tape);
  assert.ok(LEVELS.buzzType < LEVELS.key);
  assert.ok(LEVELS.hum <= 0.06);
});

test('engine: dezactivat nu cântă', () => {
  const { e, ctx } = engine();
  e.unlock();
  e.setEnabled(false);
  const before = started(ctx()).length;
  e.play('key');
  assert.equal(started(ctx()).length, before);
});

test('engine: dezactivat taie bâzâitul', () => {
  const { e, ctx } = engine();
  e.unlock();
  e.setEnabled(true);
  e.buzz({ tape: true, type: false });
  e.setEnabled(false);
  const m = master(ctx());
  const last = m.gain.last();
  assert.equal(last[1], 0);
  assert.ok(last[2] <= ctx().currentTime + 0.03 + 1e-9);
  e.buzz({ tape: false, type: false });
  e.setEnabled(true);
  assert.equal(e.buzzGain('tape').gain.last()[1], 0);
});

test('engine: stopAll oprește ce e programat', () => {
  const { e, ctx } = engine();
  e.unlock();
  e.setEnabled(true);
  const before = new Set(started(ctx()));
  for (let i = 0; i < 3; i++) e.play('tape', e.now() + 1);
  const fresh = started(ctx()).filter((n) => !before.has(n));
  assert.ok(fresh.length >= 3);
  e.stopAll();
  assert.ok(fresh.every((n) => n.stopped !== null));
});

test('engine: ascuns coboară masterul la 0, vizibil îl readuce cu rampă de 1 s', () => {
  const { e, ctx } = engine();
  e.unlock();
  e.setEnabled(true);
  e.setHidden(true);
  assert.equal(master(ctx()).gain.last()[1], 0);
  e.setHidden(false);
  const last = master(ctx()).gain.last();
  assert.equal(last[0], 'ramp');
  assert.equal(last[1], 1);
  assert.ok(Math.abs(last[2] - (ctx().currentTime + 1)) < 1e-9);
});
