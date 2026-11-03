// SPDX-License-Identifier: AGPL-3.0-or-later
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readJson } from './helpers.mjs';

const P = readJson('web/data/positions.json');
const EXPECT = {
  right: { M: [31, 31], RI: [15, 0], R1: [7, 0], RA: [10, 0], RAI: [10, 10], instr: [4, 4], commands: [0, 8],
    memory: [2, 2], pulses: [2, 1], overflow: [2, 2], indicators: [3, 0], compute: [2, 2] },
  left: { uop: [57, 0], pilot: [3, 0], generator: [6, 3], R2: [7, 0] },
};
const len = (a) => (a ? a.length : 0);

test('fiecare grup are numărul de elemente al pupitrului', () => {
  for (const side of ['right', 'left']) {
    assert.deepEqual(Object.keys(P[side]).sort(), Object.keys(EXPECT[side]).sort());
    for (const [g, [l, s]] of Object.entries(EXPECT[side])) {
      assert.equal(len(P[side][g].lamps), l, `${side}.${g}.lamps`);
      assert.equal(len(P[side][g].switches), s, `${side}.${g}.switches`);
    }
  }
  const total = (side, k) => Object.values(P[side]).reduce((n, g) => n + len(g[k]), 0);
  assert.equal(total('right', 'lamps'), 88);
  assert.equal(total('left', 'lamps'), 73);
  assert.equal(total('right', 'switches'), 60);
  assert.equal(total('left', 'switches'), 3);
  assert.equal(P.left.generator.knob.length, 2);
});

test('rândurile sunt ordonate', () => {
  for (const side of ['right', 'left']) {
    for (const [g, grp] of Object.entries(P[side])) {
      for (const k of ['lamps', 'switches']) {
        const a = grp[k] || [];
        if (g === 'uop' || (g === 'pulses' && k === 'lamps')) continue;
        if (g === 'generator' && k === 'switches') continue;
        for (let i = 1; i < a.length; i++) assert.ok(a[i][0] > a[i - 1][0], `${side}.${g}.${k}[${i}]`);
      }
    }
  }
  const pl = P.right.pulses.lamps;
  assert.ok(pl[1][1] > pl[0][1]);
});

test('grila de microoperații are 3 rânduri de câte 19', () => {
  const u = P.left.uop.lamps;
  const ys = (a, b) => u.slice(a, b).map((p) => p[1]);
  assert.ok(Math.max(...ys(0, 19)) < Math.min(...ys(19, 38)));
  assert.ok(Math.max(...ys(19, 38)) < Math.min(...ys(38, 57)));
  for (const r of [0, 19, 38]) for (let i = 1; i < 19; i++) assert.ok(u[r + i][0] > u[r + i - 1][0]);
});

test('becul M 0 e în stânga panoului și M 30 în dreapta', () => {
  assert.ok(P.right.M.lamps[0][0] < 200);
  assert.ok(P.right.M.lamps[30][0] > 1850);
});
