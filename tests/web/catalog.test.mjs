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

test('catalog: programele ilustrative poartă eticheta', () => {
  for (const id of ['vidraru', 'romexpo']) {
    const p = CATALOG.find((c) => c.id === id);
    assert.ok(p, id);
    assert.match(catalogNote(p, 'note', 'ro'), /calcul ilustrativ.*cifrele nu sunt cele reale/, id);
    assert.match(catalogNote(p, 'note', 'en'), /illustrative calculation.*not the real ones/, id);
  }
});

test('catalog: titluri în ambele limbi', () => {
  const ids = CATALOG.map((c) => c.id);
  for (const id of ['retiparire-1962', 'inex1', 'sinus-1962', 'vidraru', 'romexpo']) assert.ok(ids.includes(id), id);
  for (const p of CATALOG) assert.ok(p.title && p.title_en && p.title !== p.title_en, p.id);
  assert.match(catalogNote(CATALOG.find((c) => c.id === 'sinus-1962'), 'note', 'ro'), /Facsimilul 3/);
});
