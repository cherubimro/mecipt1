// SPDX-License-Identifier: AGPL-3.0-or-later
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decodeLive, bitsMsbFirst, dotClasses, M_GAPS, RI_GAPS } from '../../web/js/live.js';
import { readJson } from './helpers.mjs';

const TABLES = readJson('web/data/core-tables.json');
const ctx = (lang = 'ro') => ({ tables: TABLES, lang, uopName: (i) => `uop ${i} in english`, opText: () => 'english effect' });

// Cuvântul de la 1534 din listingul retipăririi: „21 oo13  22 ooo3”
// (core/isa.h: m0 = 0 · m1–m5 codul 2 · m6–m10 codul 1 · m11–m20 adresa 2 · m21–m30 adresa 1)
const pack = (c1, a1, c2, a2) => ((c2 << 25) | (c1 << 20) | (a2 << 10) | a1) >>> 0;
const WORD = pack(0o21, 0o13, 0o22, 0o3);
const state = (over = {}) => ({ M: WORD, RI: (0o22 << 10) | 0o3, RAI: 0o1534, R1: 3, phase: 2, ...over });

test('biții se numără de la cel mai tare, ca becurile de pe panou', () => {
  assert.deepEqual(bitsMsbFirst(0b1011, 4), [1, 0, 1, 1]);
  assert.deepEqual(bitsMsbFirst(0, 3), [0, 0, 0]);
  assert.deepEqual(dotClasses([1, 0], 'r', [1]), ['r on', 'r gap']);
});

test('cuvântul se citește în notația listingurilor din 1962', () => {
  const d = decodeLive(state(), ctx());
  assert.equal(d.m.text, '21 0013  22 0003');
  assert.deepEqual(d.halves.map((h) => h.text), ['21 0013', '22 0003']);
  assert.equal(d.rai.oct, '1534');
  assert.equal(d.rai.dec, 0o1534);
});

test('becurile: 31 pentru M, 15 pentru RI, 10 pentru RAI, cu golurile câmpurilor', () => {
  const d = decodeLive(state(), ctx());
  assert.equal(d.m.dots.length, 31);
  assert.equal(d.ri.dots.length, 15);
  assert.equal(d.rai.dots.length, 10);
  for (const i of M_GAPS) assert.ok(d.m.dots[i].includes('gap'), `M gol la ${i}`);
  for (const i of RI_GAPS) assert.ok(d.ri.dots[i].includes('gap'), `RI gol la ${i}`);
  // m0 (becul 0) e bitul de semn: la un cuvânt-instrucțiune e stins
  assert.ok(!d.m.dots[0].includes('on'));
  // becurile 6–10 sunt codul 1 = 0o21 = 10001
  assert.deepEqual(d.m.dots.slice(6, 11).map((c) => (c.includes('on') ? 1 : 0)), [1, 0, 0, 0, 1]);
  // becurile 21–30 sunt adresa 1 = 0o13 = 0000001011
  assert.deepEqual(d.m.dots.slice(21).map((c) => (c.includes('on') ? 1 : 0)), [0, 0, 0, 0, 0, 0, 1, 0, 1, 1]);
});

test('jumătatea în execuție e cea din RI', () => {
  assert.equal(decodeLive(state(), ctx()).now, 2);
  assert.equal(decodeLive(state({ RI: (0o21 << 10) | 0o13 }), ctx()).now, 1);
  // două jumătăți la fel: hotărăște faza
  const same = pack(0o21, 0o13, 0o21, 0o13);
  assert.equal(decodeLive({ ...state(), M: same, RI: (0o21 << 10) | 0o13, phase: 2 }, ctx()).now, 2);
  assert.equal(decodeLive({ ...state(), M: same, RI: (0o21 << 10) | 0o13, phase: 1 }, ctx()).now, 1);
});

test('codul instrucțiunii vine din tabelul nucleului, nu dintr-o ghicitură', () => {
  const d = decodeLive(state(), ctx());
  assert.equal(d.ri.code, '22');
  assert.equal(d.ri.addr, '0003');
  assert.equal(d.ri.mnemonic, TABLES.ops[0o22].mnemonic);
  assert.equal(d.ri.effect, TABLES.ops[0o22].effect_ro);
  // în engleză, efectul e traducerea; mnemonicul rămâne cel al tabelului Geier
  const en = decodeLive(state(), ctx('en'));
  assert.equal(en.ri.effect, 'english effect');
  assert.equal(en.ri.mnemonic, TABLES.ops[0o22].mnemonic);
});

test('codurile fără intrare în tabel nu inventează un nume', () => {
  const d = decodeLive(state({ RI: (31 << 10) | 7 }), ctx());
  assert.equal(d.ri.code, '37');
  assert.equal(d.ri.mnemonic, null);
  assert.equal(d.ri.effect, null);
});

test('microoperația poartă inscripția românească; traducerea apare doar în engleză', () => {
  const ro = decodeLive(state({ R1: 3 }), ctx('ro'));
  assert.equal(ro.uop.label, TABLES.uops[3].label_ro);
  assert.equal(ro.uop.gloss, null);
  const en = decodeLive(state({ R1: 3 }), ctx('en'));
  assert.equal(en.uop.label, TABLES.uops[3].label_ro);
  assert.equal(en.uop.gloss, 'uop 3 in english');
  // un număr fără microoperație nu scoate nimic din tabel
  assert.equal(decodeLive(state({ R1: 126 }), ctx()).uop.label, null);
});
