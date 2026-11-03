// SPDX-License-Identifier: AGPL-3.0-or-later
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderPanel, lampIds, switchIds } from '../../web/js/panel.js';
import { readJson } from './helpers.mjs';

const POS = readJson('web/data/positions.json');
const COLORS = readJson('web/data/lamp-colors.json');
const ART_R = readJson('web/data/art-right.json');
const svgR = renderPanel('right', ART_R, POS, COLORS);
const once = (svg, id) => svg.split(`id="${id}"`).length === 2;
const tag = (svg, id) => {
  const i = svg.indexOf(`id="${id}"`);
  return svg.slice(svg.lastIndexOf('<', i), svg.indexOf('</g>', i));
};
const texts = (art) => art.items.filter((it) => it.t === 'text').map((it) => it.text);

test('fiecare bec și comutator din pozițiile panoului drept apare o dată în SVG', () => {
  const ids = [...lampIds(POS), ...switchIds(POS)].filter((id) => {
    const g = id.split('-')[1];
    return g in POS.right;
  });
  assert.equal(ids.length, 148);
  for (const id of ids) assert.ok(once(svgR, id), id);
});

test('culorile vin din tabelul fotografiei', () => {
  assert.match(tag(svgR, 'lamp-M-0'), /data-color="green"/);
  assert.match(tag(svgR, 'lamp-RI-2'), /data-color="amber"/);
  assert.match(tag(svgR, 'lamp-R1-0'), /data-color="white"/);
  assert.match(tag(svgR, 'lamp-RAI-0'), /data-color="red"/);
  const mem = tag(svgR, 'lamp-memory-1');
  assert.match(mem, /data-color="blue"/);
  assert.match(mem, /<rect/);
});

test('inscripțiile lizibile sunt toate prezente', () => {
  const all = texts(ART_R).join(' ');
  for (const w of ['CODUL 2', 'CODUL 1', 'ADRESA 2', 'ADRESA 1', 'RA', 'RAI', 'ANULEAZA', 'INTRODUCE',
    'ADUNARE', 'MEMORIE', 'SCRIERE', 'CITIRE', 'DEPASIT', 'CAPACITATEA', 'REGISTRULUI', 'HIRTIA', 'OPRIT',
    'CALCULEAZA', 'AUTOMAT', 'INSTRUCTIE', 'UNICA']) assert.ok(all.includes(w), w);
  const t = texts(ART_R);
  for (let i = 0; i <= 30; i++) assert.ok(t.includes(String(i)), String(i));
});

test('SVG-ul e bine format', () => {
  assert.equal(svgR.split('<svg').length, 2);
  assert.ok(svgR.trimEnd().endsWith('</svg>'));
  assert.ok(!/undefined|NaN/.test(svgR));
});

const ART_L = readJson('web/data/art-left.json');
const ART_M = readJson('web/data/art-middle.json');
const svgL = renderPanel('left', ART_L, POS, COLORS);
const svgM = renderPanel('middle', ART_M, POS, COLORS);

test('panoul stâng: 57 de becuri de microoperații, R2, generatorul', () => {
  const ids = [...lampIds(POS), ...switchIds(POS)].filter((id) => id.split('-')[1] in POS.left);
  assert.equal(ids.length, 76);
  for (const id of ids) assert.ok(once(svgL, id), id);
  assert.ok(once(svgL, 'knob'));
  assert.match(tag(svgL, 'lamp-uop-0'), /data-color="white"/);
  assert.match(tag(svgL, 'lamp-R2-0'), /data-color="red"/);
  assert.ok(!/undefined|NaN/.test(svgL));
});

test('grila stângă are inscripțiile panoului', () => {
  const t = texts(ART_L);
  const all = t.join(' | ');
  assert.ok(all.includes('Muta RAI') || all.includes('Mută RAI'), 'Mută RAI');
  for (const w of ['GENERATOR PRINCIPAL', 'IMPULSURI']) assert.ok(all.includes(w), w);
  assert.ok(all.includes('FRECVENTA') || all.includes('FRECVENȚĂ'), 'FRECVENȚĂ');
  const cell = ART_L.items.find((it) => it.t === 'text' && it.cell && it.cell[0] === 1 && it.cell[1] === 16);
  assert.ok(cell && cell.text.includes('RAI'), JSON.stringify(cell));
});

test('panoul din mijloc are 11 aparate', () => {
  assert.equal(svgM.split('id="meter-').length - 1, 11);
  assert.ok(once(svgM, 'selector'));
  assert.ok(once(svgM, 'power'));
  assert.ok(!/undefined|NaN/.test(svgM));
  assert.ok(!svgM.includes('class="switch'), 'comenzile din mijloc sunt decor');
});

test('voltmetrele de sus au scala 0–250 V', () => {
  const meter = (i) => {
    const a = svgM.indexOf(`id="meter-${i}"`);
    return svgM.slice(a, svgM.indexOf('<g class="meter"', a + 1) > 0 ? svgM.indexOf('<g class="meter"', a + 1) : undefined);
  };
  for (const i of [0, 1, 2, 3]) {
    const g = meter(i);
    for (const v of ['>0<', '>50<', '>100<', '>150<', '>200<', '>250<']) assert.ok(g.includes(v), `meter-${i} ${v}`);
  }
  assert.ok(!meter(4).includes('>250<'), 'cadranele fără cifre vizibile rămân fără scală');
});

test('the bar over M̄ is a real overline in the SVG', () => {
  assert.ok(!svgL.includes('\u0304'), 'accentul combinat nu se vede în Barlow');
  assert.ok(svgL.includes('text-decoration="overline"'));
});
