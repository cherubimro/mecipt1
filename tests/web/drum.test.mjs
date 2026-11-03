// SPDX-License-Identifier: AGPL-3.0-or-later
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DRUM, drumSvg, drumActive, drumPhase, cellsOffset, TRACKS } from '../../web/js/drum.js';

test('drum: faptele din surse — 1024 de cuvinte de 31 de biți, 50 de rotații pe secundă', () => {
  assert.equal(DRUM.words, 1024);
  assert.equal(DRUM.bits, 31);
  assert.equal(DRUM.revPerSec, 50);
});

test('drum: desenul are cilindrul, câte o pistă pe bit și capetele', () => {
  const svg = drumSvg();
  assert.match(svg, /^<svg[^>]*role="img"/);
  assert.equal(TRACKS, 31);
  assert.equal((svg.match(/class="track"/g) || []).length, TRACKS);
  assert.equal((svg.match(/class="head"/g) || []).length, TRACKS);
  assert.match(svg, /class="surface"/);
  assert.match(svg, /class="heads-glow"/);
});

test('drum: capetele lucrează doar când mașina a făcut ceva în cadru', () => {
  assert.equal(drumActive({ uops: new Uint8Array([3, 4]) }), true);
  assert.equal(drumActive({ uops: new Uint8Array(0) }), false);
  assert.equal(drumActive({ uops: [] }), false);
  assert.equal(drumActive(null), false);
});

test('drum: rotația desenată e încetinită, continuă și oprită când mișcarea e redusă', () => {
  const p0 = drumPhase(0), p1 = drumPhase(100), pLoop = drumPhase(DRUM.drawnCycleMs);
  assert.ok(p1 > p0 && p1 < 1);
  assert.ok(Math.abs(pLoop - p0) < 1e-9);                    // o rotație desenată = un ciclu
  assert.ok(DRUM.drawnCycleMs >= 1000);                      // nu 20 ms: la 50 rot/s ochiul n-ar vedea nimic
  assert.equal(drumPhase(1234, { reducedMotion: true }), 0);
});

test('drum: modelul celulelor se repetă exact la capătul unei rotații desenate', () => {
  assert.equal(cellsOffset(0), 0);
  assert.equal(cellsOffset(1) % 12, 0);                       // un număr întreg de rânduri de celule: fără salt
  assert.ok(cellsOffset(0.5) > 0);
});
