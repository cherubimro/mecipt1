// SPDX-License-Identifier: AGPL-3.0-or-later
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cellKind, CELL_MARK } from '../../web/js/atelier/drum.js';

test('kinds follow provenance and writes', () => {
  assert.equal(cellKind(1, false), 'ORIGINAL');
  assert.equal(cellKind(2, false), 'DEDUS');
  assert.equal(cellKind(3, false), 'RECONSTRUCTIE');
  assert.equal(cellKind(4, false), 'GHICIT');
  assert.equal(cellKind(1, true), 'WRITTEN');
  assert.equal(cellKind(5, true), 'MODIFICAT');
  assert.equal(cellKind(0, false), 'EMPTY');
  assert.equal(cellKind(0, true), 'WRITTEN');
});

test('every kind has a letter', () => {
  const kinds = ['ORIGINAL', 'DEDUS', 'RECONSTRUCTIE', 'GHICIT', 'MODIFICAT', 'WRITTEN'];
  const letters = kinds.map((k) => CELL_MARK[k]);
  for (const l of letters) assert.ok(l && l.length === 1, l);
  assert.equal(new Set(letters).size, kinds.length);
  assert.equal(CELL_MARK.EMPTY, '');
});
