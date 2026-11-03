// SPDX-License-Identifier: AGPL-3.0-or-later
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Clock, MAX_INSTR_PER_FRAME, MAX_FRAME_MS, SPEEDS, TICKS_PER_SECOND } from '../../web/js/clock.js';
import { Runner } from '../../web/js/runner.js';
import { HALT, OP } from '../../web/js/mecipt.js';
import { newMachine, RETIPARIRE, INEX, INEX_TAPE, prog } from './helpers.mjs';

async function runner(text = RETIPARIRE(), start = 0o1477, speed = 'epoca', opts) {
  const r = new Runner(await newMachine(), new Clock(speed), opts);
  r.load(text, null, start);
  return r;
}

test('constantele ceasului', () => {
  assert.equal(TICKS_PER_SECOND, 51200);
  assert.deepEqual(SPEEDS, { epoca: 1, rapid: 100 });
  assert.equal(MAX_FRAME_MS, 250);
  assert.equal(MAX_INSTR_PER_FRAME, 20000);
});

test('ca în 1962: o secundă de cadre = o secundă de mașină', async () => {
  const m = await newMachine();
  m.loadProgram(RETIPARIRE());
  m.console(OP.SWITCHES_RAI, 0o1477);
  m.run(51200, 1e9);
  const n0 = m.instructions();
  const r = await runner();
  r.enqueue({ ui: 'automat' });
  for (let i = 0; i < 60; i++) r.frame(1000 / 60);
  assert.ok(Math.abs(r.machine.instructions() - n0) <= 2, `${r.machine.instructions()} vs ${n0}`);
  assert.equal(r.mode, 'automat');
});

test('rapid termină retipărirea în cel mult 200 de cadre', async () => {
  const r = await runner(RETIPARIRE(), 0o1477, 'rapid');
  r.enqueue({ ui: 'automat' });
  let text = '', halted = null, frames = 0;
  while (halted === null && frames < 200) {
    const s = r.frame(16);
    text += s.typed;
    halted = s.halted;
    frames++;
  }
  assert.equal(halted, HALT.STOP);
  assert.equal(text.split('\n').length - 1, 39);
  assert.equal(r.mode, 'idle');
});

test('clamps a long frame', async () => {
  const r = await runner();
  r.enqueue({ ui: 'automat' });
  r.frame(600000);
  assert.ok(r.machine.seconds() <= 0.25 + 0.2, String(r.machine.seconds()));
});

test('caps instructions per frame', async () => {
  const r = await runner(prog('0000  T 0000  T 0000\n'), 0, 'rapid', { maxInstrPerFrame: 500 });
  r.enqueue({ ui: 'automat' });
  r.frame(250);
  assert.equal(r.machine.instructions(), 500);
  const d = await runner(prog('0000  T 0000  T 0000\n'), 0, 'rapid');
  assert.equal(d.maxInstrPerFrame, 20000);
});

test('applies queued actions between frames', async () => {
  const r = await runner(prog('0000  O 0000  O 0000\n0100  T 0100  T 0100\n'), 0o100);
  r.enqueue({ ui: 'automat' });
  for (let i = 0; i < 5; i++) assert.equal(r.frame(50).halted, null);
  assert.ok(r.machine.instructions() > 0);
  r.enqueue({ op: OP.ANULEAZA_RAI });
  const s = r.frame(50);
  assert.equal(s.halted, HALT.STOP);
  assert.equal(s.state.RAI, 0);
});

test('INSTRUCȚIE UNICĂ execută exact una', async () => {
  const r = await runner();
  r.enqueue({ ui: 'unic' });
  r.frame(16);
  r.frame(16);
  assert.equal(r.machine.instructions(), 1);
  assert.equal(r.mode, 'unic');
});

test('IMPULSURI ÎNTRERUPE oprește și aprinde OPRIT', async () => {
  const r = await runner();
  r.enqueue({ ui: 'automat' });
  r.frame(500);
  r.enqueue({ ui: 'toggle-pulses' });
  const s = r.frame(16);
  assert.equal(s.state.oprit, 1);
  assert.equal(r.pulsesOff, true);
  const n = r.machine.instructions();
  for (let i = 0; i < 10; i++) r.frame(100);
  assert.equal(r.machine.instructions(), n);
});

test('MEMORIE SCRIERE aprinde becul de scriere', async () => {
  const r = await runner();
  r.enqueue({ op: OP.MEM_SCRIERE });
  assert.deepEqual(r.frame(16).memFlash, { write: true, read: false });
  assert.deepEqual(r.frame(16).memFlash, { write: false, read: false });
});

test('loading stops the run', async () => {
  const r = await runner();
  r.enqueue({ ui: 'automat' });
  r.frame(250);
  r.frame(250);
  r.load(INEX(), INEX_TAPE(), 0o10);
  assert.equal(r.mode, 'idle');
  const s = r.frame(16);
  assert.equal(s.typed, '');
  assert.equal(s.tapePos, 0);
  assert.equal(s.state.RAI, 0o10);
  assert.equal(r.machine.instructions(), 0);
});

test('încărcarea readuce impulsurile', async () => {
  const r = await runner();
  r.enqueue({ ui: 'toggle-pulses' });
  r.frame(16);
  assert.equal(r.pulsesOff, true);
  r.load(RETIPARIRE(), null, 0o1477);
  assert.equal(r.pulsesOff, false);
  r.enqueue({ ui: 'automat' });
  r.frame(500);
  assert.ok(r.machine.instructions() > 0);
});
