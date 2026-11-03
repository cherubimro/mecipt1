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
