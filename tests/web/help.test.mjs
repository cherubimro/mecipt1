// SPDX-License-Identifier: AGPL-3.0-or-later
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { helpKey, helpFor } from '../../web/js/help.js';
import { lampIds, switchIds } from '../../web/js/panel.js';
import { readJson } from './helpers.mjs';

const POS = readJson('web/data/positions.json');
const RO = readJson('web/data/help/ro.json');
const EN = readJson('web/data/help/en.json');
const TARGETS = [...lampIds(POS), ...switchIds(POS), 'knob', ...Array.from({ length: 11 }, (_, i) => `meter-${i}`),
  'selector', 'power', 'toggle-0', 'toggle-1', 'panel-left', 'panel-middle', 'panel-right', 'drum', 'tape', 'sheet', 'provenance', 'view3d'];
const STATUS = ['SIGUR', 'DEDUS', 'GHICIT', 'MIXT'];

test('helpKey falls back from id to group', () => {
  assert.equal(helpKey('lamp-M-12', RO), 'lamp-M');
  assert.equal(helpKey('switch-commands-3', RO), 'switch-commands-3');
  assert.equal(helpKey('meter-5', RO), 'meter-5');
  assert.equal(helpKey('meter-3', RO), 'meter');
  assert.equal(helpKey('toggle-1', RO), 'toggle');
});

test('every element on the console has help', () => {
  for (const id of TARGETS) {
    assert.ok(helpFor(id, RO), `ro ${id}`);
    assert.ok(helpFor(id, EN), `en ${id}`);
  }
  assert.throws(() => helpFor('nimic-de-felul-asta', RO));
});

test('languages match', () => {
  assert.deepEqual(Object.keys(RO.entries).sort(), Object.keys(EN.entries).sort());
  assert.deepEqual(Object.keys(RO.sources).sort(), Object.keys(EN.sources).sort());
  assert.equal(Object.keys(EN.uops).length, 39);
  assert.equal(Object.keys(EN.ops).length, 29);
  for (const k of Object.keys(RO.entries)) assert.equal(RO.entries[k].status, EN.entries[k].status, k);
});

test('entries are well formed', () => {
  for (const [lang, H] of [['ro', RO], ['en', EN]]) {
    for (const [k, e] of Object.entries(H.entries)) {
      assert.ok(e.title && e.short && e.more, `${lang} ${k}`);
      assert.ok(e.short.length <= 220, `${lang} ${k}: short are ${e.short.length} caractere`);
      assert.ok(STATUS.includes(e.status), `${lang} ${k}: ${e.status}`);
      assert.ok(Array.isArray(e.sources) && e.sources.length > 0, `${lang} ${k}: fără surse`);
      for (const s of e.sources) assert.ok(s in H.sources, `${lang} ${k}: sursa ${s}`);
    }
  }
  for (const id of ['baltac2011', 'baltacLab', 'geier1961', 'wikiRO', 'farcas2005', 'maruster', 'baltacKey',
    'model3d', 'photo2011', 'semantica']) assert.ok(id in RO.sources, id);
});

test('english keeps the inscription', () => {
  assert.ok(EN.entries['switch-compute-0'].title.startsWith('CALCULEAZA AUTOMAT'));
  assert.ok(EN.entries['switch-commands-0'].title.startsWith('ANULEAZA RAI'));
});

test('no facsimile images', () => {
  for (const H of [RO, EN]) for (const e of Object.values(H.entries)) assert.ok(!e.more.includes('!['));
});

test('honest labels where the reviewer found slips', () => {
  assert.equal(RO.entries['lamp-RAI'].status, 'MIXT');
  for (const k of ['lamp-R1', 'lamp-R2']) {
    assert.equal(RO.entries[k].status, 'MIXT', k);
    assert.ok(RO.entries[k].more.includes('GHICIT'), k);
    assert.ok(EN.entries[k].more.includes('GUESSED'), k);
  }
  for (const k of ['switch-instr-2', 'switch-instr-3']) {
    assert.ok(!RO.entries[k].more.includes('trece instrucția 2'), k);
    assert.ok(!EN.entries[k].more.includes('instruction 2 moves'), k);
  }
  assert.ok(RO.entries.sheet.more.includes('L6') && EN.entries.sheet.more.includes('L6'));
  const rai = (H) => H.tour.find((s) => s.id === 'rai').text;
  assert.ok(rai(RO).includes('ANULEAZA') && /ghicit/i.test(rai(RO)), rai(RO));
  assert.ok(rai(EN).includes('ANULEAZA') && /guessed/i.test(rai(EN)), rai(EN));
});

test('the workshop has explanations', () => {
  for (const k of ['atelier-editor', 'atelier-row', 'atelier-drum', 'atelier-cell', 'atelier-punch', 'atelier-controls', 'prov-modificat']) {
    for (const H of [RO, EN]) {
      const e = helpFor(k, H);
      assert.ok(e.title && e.short && e.sources.length, k);
    }
  }
  assert.ok(RO.entries['atelier-punch'].more.includes('0014') && RO.entries['atelier-punch'].more.includes('GHICIT'));
});

test('help: are intrarea sound în ro și en', () => {
  for (const H of [RO, EN]) {
    assert.ok(H.entries.sound, 'lipsește intrarea sound');
    assert.equal(H.entries.sound.status, 'GHICIT');
    assert.ok(H.entries.sound.more.includes('50'), 'zumzetul de 50 Hz');
  }
});

test('fiecare program din catalog are ajutor', () => {
  for (const id of ['inex1', 'sinus-1962', 'vidraru', 'romexpo']) {
    for (const H of [RO, EN]) assert.ok(H.entries[`program-${id}`], `program-${id}`);
  }
  for (const id of ['vidraru', 'romexpo']) {
    const ro = RO.entries[`program-${id}`], en = EN.entries[`program-${id}`];
    assert.match(ro.short + ro.more, /cifrele nu sunt cele reale/, id);
    assert.match(en.short + en.more, /not the real ones/, id);
  }
  assert.match(RO.entries['program-sinus-1962'].more, /32°/);
});
