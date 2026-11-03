// SPDX-License-Identifier: AGPL-3.0-or-later
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { MACROS } from '../../web/js/md.js';
import { ROOT, read, readJson } from './helpers.mjs';

const CHAPTERS = ['01-masina.md', '02-cuvantul.md', '03-instructiuni.md', '04-pupitrul.md',
  '05-banda-si-masina-de-scris.md', '06-programe.md', '07-ce-e-sigur.md', '08-surse.md', '09-atelierul.md'];

test('chapters exist in both languages', () => {
  for (const l of ['ro', 'en']) assert.deepEqual(readdirSync(`${ROOT}web/doc/${l}`).sort(), CHAPTERS);
});

const rowsPerSection = (md) => {
  const out = [];
  for (const line of md.split('\n')) {
    if (line.startsWith('## ')) out.push(0);
    else if (line.startsWith('|') && !/^\|[-\s|:]+\|$/.test(line) && out.length) out[out.length - 1]++;
  }
  return out;
};
test('semantica.en.md has the same table rows per section as semantica.md', () => {
  const ro = rowsPerSection(read('docs/semantica.md'));
  assert.ok(ro.length > 5);
  assert.deepEqual(rowsPerSection(read('docs/semantica.en.md')), ro);
});

test('every {{macro}} used is known', () => {
  for (const l of ['ro', 'en']) for (const c of CHAPTERS) {
    for (const m of read(`web/doc/${l}/${c}`).matchAll(/\{\{([a-z-]+)\}\}/g)) assert.ok(MACROS.includes(m[1]), `${l}/${c}: ${m[1]}`);
  }
});

test('the tape chapter states each rule with its status', () => {
  const ro = read('web/doc/ro/05-banda-si-masina-de-scris.md');
  for (const w of ['SIGUR', 'DEDUS', 'GHICIT', '{{tape-example}}', 'perforația']) assert.ok(ro.includes(w), w);
  const en = read('web/doc/en/05-banda-si-masina-de-scris.md');
  for (const w of ['CERTAIN', 'DEDUCED', 'GUESSED', '{{tape-example}}', 'punched']) assert.ok(en.includes(w), w);
});

test('chapters cite sources and do not embed facsimiles', () => {
  for (const l of ['ro', 'en']) for (const c of CHAPTERS) {
    const t = read(`web/doc/${l}/${c}`);
    assert.ok(t.startsWith('# '), `${l}/${c}: începe cu un titlu`);
    assert.ok(!t.includes('!['), `${l}/${c}: fără imagini`);
  }
});

test('the glyph sets follow Baltac L6 and use one number base', () => {
  const ro = read('web/doc/ro/05-banda-si-masina-de-scris.md');
  assert.ok(ro.includes('L6') && ro.includes('nu era folosit'), 'ro: setul din L6');
  assert.ok(!ro.includes('din 10–15'), 'ro: coduri zecimale lângă tabele octale');
  const en = read('web/doc/en/05-banda-si-masina-de-scris.md');
  assert.ok(en.includes('L6') && en.includes('not used'), 'en: the L6 set');
  assert.ok(!en.includes('from 10–15'));
});

test('the workshop chapter states its guesses', () => {
  const ro = read('web/doc/ro/09-atelierul.md');
  for (const w of ['MODIFICAT', '0014', 'GHICIT', 'scris de program']) assert.ok(ro.includes(w), w);
  const en = read('web/doc/en/09-atelierul.md');
  for (const w of ['MODIFIED', '0014', 'GUESSED', 'written by the program']) assert.ok(en.includes(w), w);
  assert.ok(read('docs/semantica.md').includes('## Atelierul'));
  assert.ok(read('docs/semantica.en.md').includes('## The workshop'));
});

// Citările colii (numere cu 9 zecimale, cum le bate mașina de scris): „o” pentru zero, niciodată „0” amestecat.
test('citările tipăriturii folosesc „o” pentru zero', () => {
  const files = ['docs/semantica.md', 'docs/semantica.en.md', 'web/data/help/ro.json', 'web/data/help/en.json',
    ...['ro', 'en'].flatMap((l) => readdirSync(`${ROOT}web/doc/${l}`).map((f) => `web/doc/${l}/${f}`))];
  for (const f of files) {
    for (const m of read(f).matchAll(/(?<![0-9o])[0o][,.][0-9o]{9}(?![0-9o])/g)) {
      if (!m[0].includes('o', 2) && m[0][0] === '0') continue;     // un număr obișnuit, nu o citare a colii
      assert.ok(m[0][0] === 'o' && !m[0].includes('0'), `${f}: ${m[0]}`);
    }
  }
});

test('LICENSE-CONTINUT numește fiecare program din catalog', () => {
  const lic = read('LICENSE-CONTINUT.md');
  for (const p of readJson('web/programs/catalog.json')) {
    for (const f of [p.file, p.tape].filter(Boolean)) assert.ok(lic.includes(f), f);
  }
  assert.ok(!lic.includes('inex-banda-3-cuvinte.mec` e GHICITĂ, făcută pentru verificare'), 'banda de test nu mai e în pagină');
});

test('paginile au descriere, imagine de partajare, iconiță și mesaj fără JavaScript', () => {
  for (const page of ['web/index.html', 'web/doc.html']) {
    const h = read(page);
    assert.match(h, /<meta name="description" content="[^"]{40,}">/, page);
    assert.match(h, /<meta property="og:title" content="[^"]+">/, page);
    assert.match(h, /<meta property="og:description" content="[^"]+">/, page);
    assert.match(h, /<meta property="og:image" content="img\/mecipt-1\.png">/, page);
    assert.match(h, /<link rel="icon" href="favicon\.svg" type="image\/svg\+xml">/, page);
    assert.match(h, /<noscript>.*JavaScript.*<\/noscript>/, page);
  }
  assert.ok(read('web/favicon.svg').startsWith('<svg'));
  assert.ok(readdirSync(`${ROOT}web/img`).includes('mecipt-1.png'));
});
