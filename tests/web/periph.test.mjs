// SPDX-License-Identifier: AGPL-3.0-or-later
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tapeWindow } from '../../web/js/tape.js';
import { Sheet } from '../../web/js/typewriter.js';

test('fereastra benzii marchează ce s-a citit', () => {
  const w = tapeWindow(new Uint8Array([0b10000, 0b00001, 0b11111]), 1, 1, 2);
  assert.deepEqual(w, [
    { index: 0, holes: [true, false, false, false, false], read: true },
    { index: 1, holes: [false, false, false, false, true], read: false },
    { index: 2, holes: [true, true, true, true, true], read: false },
  ]);
});

test('capetele benzii sunt goale', () => {
  const w = tapeWindow(new Uint8Array([1, 2, 3]), 0, 2, 4);
  assert.equal(w.length, 6);
  assert.equal(w[0], null);
  assert.equal(w[1], null);
  assert.equal(w[2].index, 0);
  assert.equal(w[5], null);
});

test('coala trece la rând nou', () => {
  const s = new Sheet();
  s.add('ab\ncd');
  assert.deepEqual(s.lines(), ['ab', 'cd']);
  assert.deepEqual(s.cursor(), { line: 1, col: 2 });
});

test('diacriticele ocupă o coloană', () => {
  const s = new Sheet();
  s.add('ȘȚ');
  assert.equal(s.cursor().col, 2);
});

test('marginea', () => {
  const s = new Sheet();
  s.add('x'.repeat(73));
  assert.deepEqual(s.lines().map((l) => l.length), [72, 1]);
});

test('coala păstrează 200 de rânduri', () => {
  const s = new Sheet();
  s.add('\n'.repeat(250));
  assert.equal(s.lines().length, 200);
  s.add('z');
  assert.equal(s.lines()[199], 'z');
  assert.equal(s.cursor().line, 199);
});
