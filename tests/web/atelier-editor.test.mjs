// SPDX-License-Identifier: AGPL-3.0-or-later
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatWord, rowsFor, provLabel } from '../../web/js/atelier/editor.js';
import { S } from '../../web/js/strings.js';
import { OP } from '../../web/js/mecipt.js';
import { newMachine, RETIPARIRE, readJson } from './helpers.mjs';

const tables = readJson('web/data/core-tables.json');

test('formats like the period listings', async () => {
  const m = await newMachine();
  m.loadProgram(RETIPARIRE());
  const f = formatWord(m.peek(0o1477), tables, (w) => m.wordValue(w), 'ro');
  assert.equal(f.ins, 'UI 0000  CU 0000');
  assert.equal(f.oct, '27 0000  30 0000');
});

test('unknown codes are shown as such', async () => {
  const m = await newMachine();
  const w = ((0o35 << 25) | (0o33 << 20) | 0o100) >>> 0;
  const f = formatWord(w, tables, (x) => m.wordValue(x), 'ro');
  assert.ok(f.ins.includes('35?'), f.ins);
  assert.ok(f.ins.startsWith('CIT 0100'), f.ins);
});

test('fractions follow the language', async () => {
  const m = await newMachine();
  assert.equal(formatWord(0x20000000, tables, (x) => m.wordValue(x), 'ro').frac, '0,500000');
  assert.equal(formatWord(0x20000000, tables, (x) => m.wordValue(x), 'en').frac, '0.500000');
  assert.equal(formatWord(0x5FFFFFFF, tables, (x) => m.wordValue(x), 'ro').frac, '−0,500000');
});

test('rows list loaded and written words', async () => {
  const m = await newMachine();
  m.loadProgram(RETIPARIRE());
  m.console(OP.SWITCHES_RAI, 0o1477);
  m.run(1e12, 200);
  const rows = rowsFor(m);
  const addrs = rows.map((r) => r.addr);
  assert.ok(addrs.includes(0o1477));
  for (let i = 1; i < addrs.length; i++) assert.ok(addrs[i] > addrs[i - 1]);
  const w = rows.find((r) => r.written && r.prov === 1);
  assert.ok(w, 'retipărirea își scrie instrucțiunea de la 1512');
  assert.equal(provLabel(w, S('ro')), 'scris de program');
  assert.equal(provLabel(w, S('en')), 'written by the program');
  const o = rows.find((r) => r.addr === 0o1477);
  assert.ok(provLabel(o, S('ro')).startsWith('ORIGINAL'), provLabel(o, S('ro')));
  m.poke(0o1477, 1);
  assert.equal(provLabel(rowsFor(m).find((r) => r.addr === 0o1477), S('ro')), 'MODIFICAT');
});

test('invalid input leaves the drum unchanged', async () => {
  const m = await newMachine();
  m.loadProgram(RETIPARIRE());
  const before = m.peek(0o1551);
  for (const t of ['XX 9999', '= 2,5', '27 0000 30', '']) assert.ok(m.assemble(t).error, t);
  assert.equal(m.peek(0o1551), before);
});
