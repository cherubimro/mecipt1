// SPDX-License-Identifier: AGPL-3.0-or-later
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { describeValue } from '../../web/js/values.js';
import { uopIndexForGrid } from '../../web/js/bindings.js';
import { newMachine, readJson } from './helpers.mjs';

const m = await newMachine();
const tables = readJson('web/data/core-tables.json');
const uopIndex = uopIndexForGrid(m);
const ZERO = { S: 0, I: 0, M: 0, RI: 0, RAI: 0, RA: 0, R1: 0, R2: 0, alpha: 0, beta: 0, gamma: 0,
  phase: 1, dcr: 0, oprit: 0, hirtie: 0, stopOnDcr: 1 };
const ctx = (lang = 'ro', extra = {}) => ({ tables, wordValue: (w) => m.wordValue(w), uopIndex,
  uops: new Uint16Array(39), lang, mode: 'idle', pulsesOff: false, uopName: null, ...extra });
const V = (id, st, c = ctx()) => describeValue(id, { ...ZERO, ...st }, c);
const pack = (c1, a1, c2, a2) => ((c2 << 25) | (c1 << 20) | (a2 << 10) | a1) >>> 0;

test('RAI in decimal and octal', () => {
  const t = V('lamp-RAI-3', { RAI: 8 });
  assert.match(t, /\b8\b/);
  assert.match(t, /0010/);
  assert.match(V('switch-RAI-0', { RAI: 0o1477 }), /831.*1477/);
});

test('M as fraction and instructions', () => {
  const t = V('lamp-M-1', { M: 0x20000000 });
  assert.ok(t.includes('0,500000'), t);
  assert.ok(t.includes('04000000000'), t);
  const w = pack(0o27, 0, 0o30, 0);
  const u = V('switch-M-5', { M: w });
  assert.ok(u.includes('27 0000  30 0000'), u);
  assert.ok(u.includes('UI 0000') && u.includes('CU 0000'), u);
  const x = V('switch-M-5', { M: pack(0o33, 0o100, 0o35, 0) });
  assert.ok(x.includes('CIT 0100') && x.includes('35 → necunoscut'), x);
  assert.ok(V('lamp-M-1', { M: 0x20000000 }, ctx('en')).includes('0.500000'));
});

test('negative zero is zero', () => {
  assert.ok(V('lamp-M-0', { M: 0x7FFFFFFF }).includes('0,000000'));
});

test('RI names the instruction', () => {
  const t = V('lamp-RI-0', { RI: (0o27 << 10) | 0o1477 });
  assert.ok(t.includes('UI') && t.includes('1477') && t.includes('831'), t);
});

test('RI gives the real jump condition of codes 14 and 15', () => {
  const c = ctx('ro', { opEffect: (code) => m.opEffect(code) });
  assert.ok(V('lamp-RI-0', { RI: (14 << 10) | 5 }, c).includes('s < 0'), V('lamp-RI-0', { RI: (14 << 10) | 5 }, c));
  assert.ok(V('lamp-RI-0', { RI: (15 << 10) | 5 }, c).includes('s ≥ 0'));
  const e = ctx('en', { opText: (code) => (code === 14 ? 'jump to y if s < 0 (deduced)' : 'x') });
  assert.ok(V('lamp-RI-0', { RI: (14 << 10) | 5 }, e).includes('s < 0'));
});

test('uop lamp names the micro-operation', () => {
  const k = [...uopIndex].indexOf(16);
  const uops = new Uint16Array(39); uops[16] = 1;
  const t = V(`lamp-uop-${k}`, {}, ctx('ro', { uops }));
  assert.ok(t.includes('(ra)/2 trece în RA'), t);
  const e = V(`lamp-uop-${k}`, {}, ctx('en', { uopName: (id) => (id === 16 ? '(ra)/2 goes into RA' : '?') }));
  assert.ok(e.includes('(ra)/2 goes into RA'), e);
  const blank = [...uopIndex].indexOf(-1);
  assert.equal(V(`lamp-uop-${blank}`, {}), null);
});

test('indicators and registers of micro-instructions', () => {
  assert.ok(V('lamp-indicators-2', { oprit: 1 }).length > 0);
  assert.ok(V('lamp-R1-0', { R1: 16 }).includes('(ra)/2 trece în RA'));
});

test('decor has no value', () => {
  assert.equal(V('meter-0', {}), null);
  assert.equal(V('knob', {}), null);
  assert.equal(V('switch-commands-6', {}), null);
});
