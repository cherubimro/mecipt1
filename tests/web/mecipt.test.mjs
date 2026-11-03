// SPDX-License-Identifier: AGPL-3.0-or-later
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HALT, OP } from '../../web/js/mecipt.js';
import { newMachine, RETIPARIRE, prog } from './helpers.mjs';

test('retipărirea își tipărește prima linie', async () => {
  const m = await newMachine();
  m.loadProgram(RETIPARIRE());
  m.console(OP.SWITCHES_RAI, 0o1477);
  assert.equal(m.run(1e12, 1e6), HALT.STOP);
  assert.ok(m.takeTyped().startsWith('1477  27 0000  30 0000\n'));
  assert.ok(m.seconds() > 110 && m.seconds() < 120, String(m.seconds()));
});

test('eroarea de încărcare ajunge ca excepție', async () => {
  const m = await newMachine();
  assert.throws(() => m.loadProgram(prog('0000  99 0000  00 0000')), /linia 2/);
});

test('state() citește registrele', async () => {
  const m = await newMachine();
  m.loadProgram(RETIPARIRE());
  m.console(OP.SWITCHES_RAI, 0o1477);
  assert.equal(m.state().RAI, 0o1477);
  assert.equal(m.state().phase, 1);
});

test('textul cu diacritice trece întreg', async () => {
  const m = await newMachine();
  const body = (w) => prog(`0000  U 0002  AC 0133\n0001  O 0001  O 0001\n0002 = ${w}\n`);
  m.loadProgram(body('o01400000000'));
  m.run(1e12, 100);
  assert.equal(m.takeTyped(), 'C');
  m.loadProgram(body('o00400000000'));
  m.run(1e12, 100);
  assert.equal(m.takeTyped(), 'Ă');
});

test('rezumatul provenienței retipăririi', async () => {
  const m = await newMachine();
  m.loadProgram(RETIPARIRE());
  const s = m.provenanceSummary();
  assert.ok(s.some((e) => e.kind === 'ORIGINAL' && e.words === 39), JSON.stringify(s));
  const recon = s.filter((e) => e.kind === 'RECONSTRUCTIE').reduce((n, e) => n + e.words, 0);
  assert.equal(recon, 7, JSON.stringify(s));
  assert.ok(s.every((e) => e.kind !== 'NONE'));
  for (let i = 1; i < s.length; i++) assert.ok(s[i - 1].words >= s[i].words);
  assert.equal(m.provenance(0o1477).kind, 'ORIGINAL');
});

test('takeMicroops golește', async () => {
  const m = await newMachine();
  m.loadProgram(RETIPARIRE());
  m.console(OP.SWITCHES_RAI, 0o1477);
  m.step();
  const sum = (a) => a.reduce((x, y) => x + y, 0);
  const u = m.takeMicroops();
  assert.equal(u.length, 39);
  assert.ok(sum(u) > 0);
  assert.equal(sum(m.takeMicroops()), 0);
});

test('memoria crescută nu strică citirile', async () => {
  const m = await newMachine();
  m.loadProgram(RETIPARIRE());
  m.console(OP.SWITCHES_RAI, 0o1477);
  m.run(1e12, 50);
  m.exports.memory.grow(1);
  assert.ok(m.takeTyped().startsWith('1477'));
  assert.equal(typeof m.state().S, 'number');
  m.loadProgram(RETIPARIRE());
});

test('wordValue trece prin nucleu', async () => {
  const m = await newMachine();
  assert.equal(m.wordValue(0x20000000), 0.5);
  assert.equal(m.wordValue(0x5FFFFFFF), -0.5);
  assert.equal(m.wordValue(0x7FFFFFFF), 0);
});

test('opEffect dă efectul real al codului', async () => {
  const m = await newMachine();
  assert.ok(m.opEffect(14).includes('s < 0'));
  assert.equal(m.opEffect(31), '');
});
