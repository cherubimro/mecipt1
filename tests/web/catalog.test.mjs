// SPDX-License-Identifier: AGPL-3.0-or-later
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { catalogNote } from '../../web/js/catalog.js';
import { ROOT, read, readJson, newMachine } from './helpers.mjs';

const CATALOG = readJson('web/programs/catalog.json');

test('catalog: fiecare program se încarcă', async () => {
  const m = await newMachine();
  for (const p of CATALOG) {
    for (const f of [p.file, p.tape].filter(Boolean)) assert.ok(existsSync(`${ROOT}programs/${f}`), `${p.id}: lipsește programs/${f}`);
    m.loadProgram(read(`programs/${p.file}`));
    if (p.tape) assert.ok(m.setTapeWords(read(`programs/${p.tape}`)) > 0, p.id);
    assert.match(p.start, /^[0-7]{4}$/, p.id);
  }
});

test('catalog: intrarea inex1 folosește banda reconstruită', () => {
  const p = CATALOG.find((c) => c.id === 'inex1');
  assert.equal(p.tape, 'inex1-banda.mec');
  assert.match(catalogNote(p, 'tape_note', 'ro'), /reconstruită/);
  assert.match(catalogNote(p, 'tape_note', 'en'), /reconstructed/);
});

test('catalogNote: limba cerută, altfel nimic', () => {
  const p = { note: 'ro', note_en: 'en' };
  assert.equal(catalogNote(p, 'note', 'ro'), 'ro');
  assert.equal(catalogNote(p, 'note', 'en'), 'en');
  assert.equal(catalogNote({}, 'note', 'ro'), null);
  assert.equal(catalogNote(null, 'note', 'en'), null);
});
