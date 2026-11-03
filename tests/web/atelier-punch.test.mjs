// SPDX-License-Identifier: AGPL-3.0-or-later
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { punchWords, punchRows, punchRange, inexPlan } from '../../web/js/atelier/punch.js';
import { HALT, OP } from '../../web/js/mecipt.js';
import { newMachine, INEX, RETIPARIRE } from './helpers.mjs';

const read = (rows) => [...rows].map((r) => (~r & 31).toString(2).padStart(5, '0'));

test('words are punched like the core encodes them', async () => {
  const m = await newMachine();
  const p = punchWords('05 1626  25 1512', m);
  assert.equal(p.words, 1);
  assert.deepEqual(read(p.rows), ['10101', '00101', '11010', '01010', '11100', '10110']);
  m.setTapeWords('@prov GHICIT t\n0000  05 1626  25 1512\n');
  assert.deepEqual([...p.rows], [...m.tape()]);
});

test('rows mode writes what CIT reads', () => {
  const p = punchRows('25 00');
  assert.deepEqual([...p.rows], [~0o25 & 31, 31]);
  assert.ok(punchRows('40').error);
});

test('the sign bit cannot be punched', async () => {
  const m = await newMachine();
  assert.equal(punchWords('= -0,5', m).signWarnings.length, 1);
  assert.equal(punchWords('= 0,5', m).signWarnings.length, 0);
});

test('bad lines are reported', async () => {
  const m = await newMachine();
  const p = punchWords('UI 0000  CU 0000\nXX 1', m);
  assert.equal(p.error.line, 2);
  assert.equal(punchWords('; doar un comentariu\n\nUI 0000  CU 0000', m).words, 1);
});

test('punchRange takes words from the drum', async () => {
  const m = await newMachine();
  m.loadProgram(RETIPARIRE());
  const t = punchRange(m, 0o1477, 0o1501);
  assert.equal(punchWords(t, m).words, 3);
});

test('warns when the tape would overwrite the preloader', async () => {
  const m = await newMachine();
  m.loadProgram('');
  m.mergeProgram(INEX());
  assert.equal(inexPlan(m, 7).start, 2);
  assert.equal(inexPlan(m, 7).overwritesPreloader, true);
  assert.equal(inexPlan(m, 6).overwritesPreloader, false);
  m.poke(0o14, m.assemble('25 1477  01 0001').word);
  const p = inexPlan(m, 39);
  assert.equal(p.start, 0o1477);
  assert.equal(p.end, 0o1477 + 38);
  assert.equal(p.overwritesPreloader, false);
});


test('the preloader check covers 0000–0001 and the wrap past 1777', async () => {
  const m = await newMachine();
  m.loadProgram('');
  m.mergeProgram(INEX());
  m.poke(0o14, m.assemble('25 0000  01 0001').word);
  assert.equal(inexPlan(m, 2).overwritesPreloader, true);
  m.poke(0o14, m.assemble('25 1776  01 0001').word);
  const p = inexPlan(m, 5);
  assert.equal(p.overwritesPreloader, true);
  m.poke(0o14, m.assemble('25 1770  01 0001').word);
  assert.equal(inexPlan(m, 8).overwritesPreloader, false);
});

test('punchRange keeps the sign, so punchWords can warn', async () => {
  const m = await newMachine();
  m.loadProgram('');
  m.poke(0o100, m.assemble('= -0,5').word);
  const t = punchRange(m, 0o100, 0o100);
  const p = punchWords(t, m);
  assert.equal(p.signWarnings.length, 1);
});

test('the punched program loads through INEX-1', async () => {
  const m = await newMachine();
  m.loadProgram('');
  m.mergeProgram(INEX());
  m.poke(0o14, m.assemble('25 1000  01 0001').word);
  const src = 'UI 0000  CU 0000\n= 0,25\n05 1626  25 1512';
  const p = punchWords(src, m);
  m.setTapeRows(p.rows);
  m.setVisitorTape(true);
  m.console(OP.SWITCHES_RAI, 0o10);
  assert.equal(m.run(1e12, 1e5), HALT.TAPE_JAM);
  const want = src.split('\n').map((t) => m.assemble(t).word);
  for (let i = 0; i < 3; i++) {
    assert.equal(m.peek(0o1000 + i), want[i], `cuvântul ${i}`);
    assert.equal(m.provenance(0o1000 + i).kind, 'MODIFICAT');
  }
});
