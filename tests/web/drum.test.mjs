// SPDX-License-Identifier: AGPL-3.0-or-later
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DRUM, drumSvg, drumPhase, streaksOffset, STREAK_PERIOD } from '../../web/js/drum.js';

test('drum: faptele din surse — 1024 de cuvinte de 31 de biți, 50 de rotații pe secundă', () => {
  assert.equal(DRUM.words, 1024);
  assert.equal(DRUM.bits, 31);
  assert.equal(DRUM.revPerSec, 50);
});

test('drum: desenul după fotografie — tamburul vertical, capetele jur-împrejur, panoul cu FŰTÉS, TÖRLÉS și becul verde', () => {
  const svg = drumSvg();
  assert.match(svg, /^<svg[^>]*role="img"/);
  assert.match(svg, /class="surface"/);
  assert.ok((svg.match(/class="head-block"/g) || []).length >= 4);
  assert.match(svg, />FŰTÉS</);
  assert.match(svg, />TÖRLÉS</);
  assert.match(svg, /class="lamp-green"/);
  assert.doesNotMatch(svg, /heads-glow/);          // capetele reale n-au lumini
});

test('drum: rotația desenată e încetinită, continuă și oprită când mișcarea e redusă', () => {
  const p0 = drumPhase(0), p1 = drumPhase(100), pLoop = drumPhase(DRUM.drawnCycleMs);
  assert.ok(p1 > p0 && p1 < 1);
  assert.ok(Math.abs(pLoop - p0) < 1e-9);
  assert.ok(DRUM.drawnCycleMs >= 1000);
  assert.equal(drumPhase(1234, { reducedMotion: true }), 0);
});

test('drum: lucirea se repetă exact la capătul unei rotații desenate', () => {
  assert.equal(streaksOffset(0), 0);
  assert.equal(streaksOffset(1), STREAK_PERIOD);
  assert.ok(streaksOffset(0.5) > 0 && streaksOffset(0.5) < STREAK_PERIOD);
});
