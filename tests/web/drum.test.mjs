// SPDX-License-Identifier: AGPL-3.0-or-later
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DRUM, drumSvg, drumPhase, seams, SEAMS, drumSlot, MAP_COLORS, mapSector } from '../../web/js/drum.js';
import { cellKind } from '../../web/js/atelier/drum.js';

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

test('drum: dungile oțelului trec prin față ca pe un cilindru — repede la mijloc, strânse la margini', () => {
  const svg = drumSvg();
  assert.equal((svg.match(/class="seam"/g) || []).length, SEAMS);
  const a = seams(0), b = seams(0.01);
  assert.equal(a.length, SEAMS);
  for (const s of a) if (s.visible) assert.ok(s.x >= 132 && s.x <= 288, s.x);
  // la mijloc dunga e lată și se mișcă mult; spre margine e îngustă
  const mid = a.reduce((m, s) => (s.visible && Math.abs(s.x - 210) < Math.abs(m.x - 210) ? s : m));
  const edge = a.reduce((m, s) => (s.visible && Math.abs(s.x - 210) > Math.abs(m.x - 210) ? s : m));
  assert.ok(mid.w > edge.w);
  const i = a.indexOf(mid);
  assert.ok(b[i].x > a[i].x);                                  // se rotește spre dreapta
  assert.ok(a.some((s) => !s.visible));                        // jumătatea din spate nu se vede
  assert.deepEqual(seams(1).map((s) => s.x.toFixed(3)), a.map((s) => s.x.toFixed(3)));   // fără salt la capătul rotației
});

test('drum: harta — adresele pare pe o jumătate a tamburului, cele impare pe cealaltă (Baltac, Facsimilul 8)', () => {
  assert.equal(drumSlot(0), 0);
  assert.equal(drumSlot(2), 1);
  assert.equal(drumSlot(1022), 511);
  assert.equal(drumSlot(1), 512);
  assert.equal(drumSlot(1023), 1023);
  const all = new Set(Array.from({ length: 1024 }, (_, a) => drumSlot(a)));
  assert.equal(all.size, 1024);
});

test('drum: harta — fiecare celulă își are sectorul ei pe inel, în sensul acelor de ceas de sus', () => {
  const s0 = mapSector(0), s512 = mapSector(512), s1023 = mapSector(1023);
  assert.ok(Math.abs(s0.a0 + Math.PI / 2) < 1e-9);             // primul cuvânt sus
  assert.ok(Math.abs(s512.a0 - Math.PI / 2) < 1e-9);           // jumătatea impară începe jos
  assert.ok(s1023.a1 <= 3 * Math.PI / 2 + 1e-9 && s0.a1 > s0.a0);
});

test('drum: harta folosește aceleași culori ca tamburul din Atelier, pentru fiecare fel de cuvânt', () => {
  for (const k of ['EMPTY', 'ORIGINAL', 'DEDUS', 'RECONSTRUCTIE', 'GHICIT', 'MODIFICAT', 'WRITTEN']) assert.match(MAP_COLORS[k], /^#[0-9a-f]{6}$/, k);
  assert.equal(MAP_COLORS[cellKind(1, false)], '#b9d3b0');     // ORIGINAL, ca .kind-ORIGINAL din console.css
  assert.equal(MAP_COLORS[cellKind(0, true)], '#a9c4de');      // scris de program
});
