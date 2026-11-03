// SPDX-License-Identifier: AGPL-3.0-or-later
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lampTargets, uopIndexForGrid, actionFor, isMomentary } from '../../web/js/bindings.js';
import { glowStep } from '../../web/js/glow.js';
import { OP } from '../../web/js/mecipt.js';
import { newMachine } from './helpers.mjs';

const machine = await newMachine();
const UOP_INDEX = uopIndexForGrid(machine);
const ZERO = { S: 0, I: 0, M: 0, RI: 0, RAI: 0, RA: 0, R1: 0, R2: 0, alpha: 0, beta: 0, gamma: 0,
  phase: 1, dcr: 0, oprit: 0, hirtie: 0, stopOnDcr: 1 };
const snap = (st = {}, uops = new Uint16Array(39)) => ({ state: { ...ZERO, ...st }, uops,
  memFlash: { write: false, read: false } });
const UI = { mode: 'idle', pulsesOff: false };
const L = (st, uops) => lampTargets(snap(st, uops), UI, UOP_INDEX);
const sw = () => ({ M: new Uint8Array(31), RAI: new Uint8Array(10) });

test('M 0 e semnul', () => {
  let t = L({ M: 0x40000000 });
  assert.equal(t.get('lamp-M-0'), 1);
  assert.equal(t.get('lamp-M-1'), 0);
  t = L({ M: 1 });
  assert.equal(t.get('lamp-M-30'), 1);
  assert.equal(t.get('lamp-M-0'), 0);
});

test('RI desparte codul de adresă', () => {
  const t = L({ RI: (0o27 << 10) | 0o1477 });
  const bits = (k0, n) => Array.from({ length: n }, (_, i) => t.get(`lamp-RI-${k0 + i}`));
  assert.deepEqual(bits(0, 5), [1, 0, 1, 1, 1]);
  assert.deepEqual(bits(5, 10), [1, 1, 0, 0, 1, 1, 1, 1, 1, 1]);
});

test('INSTRUCTIA 1/2 urmează faza', () => {
  const t = L({ phase: 2 });
  assert.equal(t.get('lamp-instr-1'), 1);
  assert.equal(t.get('lamp-instr-0'), 0);
});

test('becul de microoperație se aprinde la folosire', () => {
  const u = new Uint16Array(39);
  u[16] = 1;
  const t = L({}, u);
  const k16 = [...UOP_INDEX].indexOf(16);
  assert.ok(k16 >= 0);
  assert.equal(t.get(`lamp-uop-${k16}`), 1);
  let on = 0;
  for (let k = 0; k < 57; k++) on += t.get(`lamp-uop-${k}`);
  assert.equal(on, 1);
  const blank = [...UOP_INDEX].indexOf(-1);
  assert.ok(blank >= 0);
  assert.equal(t.get(`lamp-uop-${blank}`), 0);
  assert.equal([...UOP_INDEX].filter((v) => v >= 0).length, 39);
});

test('comutatorul RAI 0 e ponderea 512', () => {
  const s = sw();
  assert.deepEqual(actionFor('switch-RAI-0', s), { op: OP.SWITCHES_RAI, arg: 512 });
  assert.deepEqual(actionFor('switch-RAI-0', s), { op: OP.SWITCHES_RAI, arg: 0 });
});

test('comutatoarele M pun cuvântul întreg', () => {
  const s = sw();
  actionFor('switch-M-30', s);
  assert.deepEqual(actionFor('switch-M-0', s), { op: OP.SWITCHES_M, arg: 0x40000001 });
});

test('butoanele cu funcție necunoscută nu fac nimic', () => {
  const s = sw();
  assert.equal(actionFor('switch-commands-6', s), null);
  assert.equal(actionFor('switch-commands-7', s), null);
  assert.equal(actionFor('switch-instr-3', s), null);
  assert.equal(actionFor('switch-generator-0', s), null);
  assert.equal(actionFor('knob', s), null);
  assert.deepEqual(actionFor('switch-commands-0', s), { op: OP.ANULEAZA_RAI, arg: 0 });
  assert.deepEqual(actionFor('switch-instr-1', s), { op: OP.INSTRUCTIA, arg: 2 });
  assert.deepEqual(actionFor('switch-overflow-1', s), { op: OP.DEPASIRE, arg: 0 });
  assert.deepEqual(actionFor('switch-compute-0', s), { ui: 'automat' });
  assert.deepEqual(actionFor('switch-pulses-0', s), { ui: 'toggle-pulses' });
  assert.equal(isMomentary('switch-commands-0'), true);
  assert.equal(isMomentary('switch-M-3'), false);
  assert.equal(isMomentary('switch-pulses-0'), false);
});

test('inerția', () => {
  assert.ok(Math.abs(glowStep(0, 1, 25) - 0.632) < 0.01);
  assert.ok(Math.abs(glowStep(1, 0, 70) - 0.368) < 0.01);
  assert.equal(glowStep(0.5, 0.5, 100), 0.5);
});
