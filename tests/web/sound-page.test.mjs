// SPDX-License-Identifier: AGPL-3.0-or-later
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickSound, saveSound, clickKind } from '../../web/js/sound/page.js';

const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), m }; };
const blocked = { getItem() { throw new Error('blocat'); }, setItem() { throw new Error('blocat'); } };

test("sound: implicit pornit; 'off' îl oprește; stocarea blocată → pornit", () => {
  assert.equal(pickSound(mem()), true);
  assert.equal(pickSound(null), true);
  const s = mem();
  s.setItem('mecipt.sound', 'off');
  assert.equal(pickSound(s), false);
  s.setItem('mecipt.sound', 'on');
  assert.equal(pickSound(s), true);
  assert.equal(pickSound(blocked), true);
});

test("sound: saveSound scrie 'on'/'off' la mecipt.sound și nu aruncă pe stocare blocată", () => {
  const s = mem();
  saveSound(false, s);
  assert.equal(s.m.get('mecipt.sound'), 'off');
  saveSound(true, s);
  assert.equal(s.m.get('mecipt.sound'), 'on');
  saveSound(true, blocked);
  saveSound(true, null);
});

test("sound: butoanele cu revenire sunt 'button', comutatoarele M/RAI/IMPULSURI sunt 'lever'", () => {
  for (const id of ['switch-compute-0', 'switch-commands-2', 'switch-memory-0', 'switch-instr-1']) assert.equal(clickKind(id), 'button', id);
  for (const id of ['switch-M-4', 'switch-RAI-0', 'switch-pulses-0']) assert.equal(clickKind(id), 'lever', id);
});
