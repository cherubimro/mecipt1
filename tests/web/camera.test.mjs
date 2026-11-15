// SPDX-License-Identifier: AGPL-3.0-or-later
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ZONES, CHIPS, VIEWBOX, PLATE_H, plateWidth, unitPx, zoneById, pageCount,
  regionRect, fitCamera, cameraTransform, miniWindow } from '../../web/js/camera.js';
import { STRINGS } from '../../web/js/strings.js';
import { readJson } from './helpers.mjs';

const POS = readJson('web/data/positions.json');

test('placa panoului păstrează proporțiile viewBox-ului', () => {
  assert.equal(PLATE_H, 262);
  assert.ok(Math.abs(plateWidth('right') / PLATE_H - 2048 / 1340) < 1e-9);
  assert.ok(Math.abs(plateWidth('middle') / PLATE_H - 2600 / 1340) < 1e-9);
});

test('o regiune din viewBox devine un dreptunghi în pixelii pupitrului', () => {
  const slot = { left: 969, top: 8, width: plateWidth('right'), height: PLATE_H };
  const r = regionRect(slot, 'right', [0, 372, 2048, 1712]);   // tot panoul
  assert.ok(Math.abs(r.x0 - 969) < 1e-6);
  assert.ok(Math.abs(r.y0 - 8) < 1e-6);
  assert.ok(Math.abs(r.x1 - (969 + slot.width)) < 1e-6);
  assert.ok(Math.abs(r.y1 - (8 + PLATE_H)) < 1e-6);
  // colțurile date în ordine inversă dau același dreptunghi
  const flipped = regionRect(slot, 'right', [2048, 1712, 0, 372]);
  assert.deepEqual(flipped, r);
});

test('camera duce mijlocul regiunii în mijlocul casetei și o încape', () => {
  const rect = { x0: 100, y0: 50, x1: 300, y1: 150 };          // 200 × 100
  const box = { x0: 0, y0: 0, x1: 400, y1: 400 };              // încape pe lățime
  const cam = fitCamera(rect, box, { originX: 0 });
  assert.equal(cam.scale, 2);
  assert.ok(Math.abs(cam.x + cam.scale * 200 - 200) < 1e-6, 'mijlocul pe orizontală');
  assert.ok(Math.abs(cam.y + cam.scale * 100 - 200) < 1e-6, 'mijlocul pe verticală');
  assert.ok(cam.x + cam.scale * rect.x0 >= box.x0 - 1e-6, 'marginea stângă încape');
  assert.ok(cam.x + cam.scale * rect.x1 <= box.x1 + 1e-6, 'marginea dreaptă încape');
  // originea camerei se scade din deplasare
  const shifted = fitCamera(rect, box, { originX: 50 });
  assert.ok(Math.abs(shifted.x - (cam.x - 50)) < 1e-6);
  assert.match(cameraTransform(cam), /^translate\(-?[\d.]+px, -?[\d.]+px\) scale\([\d.]+\)$/);
});

test('camera nu depășește limitele de mărire', () => {
  const tiny = { x0: 0, y0: 0, x1: 1, y1: 1 };
  const big = { x0: 0, y0: 0, x1: 10000, y1: 10000 };
  assert.equal(fitCamera(tiny, big, { maxScale: 5 }).scale, 5);
  assert.equal(fitCamera(big, tiny, { minScale: 0.1 }).scale, 0.1);
});

test('harta mică arată partea din pupitru care se vede', () => {
  const box = { x0: 0, y0: 0, x1: 100, y1: 100 };
  const whole = fitCamera({ x0: 0, y0: 0, x1: 100, y1: 100 }, box, { originX: 0 });
  const w = miniWindow(whole, box, 100, 0);
  assert.ok(Math.abs(w.left) < 1e-6 && Math.abs(w.width - 100) < 1e-6);
  const half = fitCamera({ x0: 50, y0: 0, x1: 100, y1: 50 }, box, { originX: 0 });
  const h = miniWindow(half, box, 100, 0);
  assert.ok(Math.abs(h.left - 50) < 1e-6 && Math.abs(h.width - 50) < 1e-6);
});

test('fiecare zonă și fiecare oprire are nume în ambele limbi', () => {
  for (const l of ['ro', 'en']) {
    for (const z of ZONES) {
      assert.ok(STRINGS[l].zones[z.id], `${l}: zones.${z.id}`);
      assert.ok(z.id === 'all' || STRINGS[l].zoneNote[z.id], `${l}: zoneNote.${z.id}`);
    }
    for (const z of CHIPS) {
      assert.ok(STRINGS[l].chips[z.id], `${l}: chips.${z.id}`);
      for (const name of z.pageNames || []) assert.ok(STRINGS[l].pages[name], `${l}: pages.${name}`);
    }
  }
  assert.equal(zoneById(ZONES, 'nu-există').id, 'all');
  assert.equal(pageCount(zoneById(CHIPS, 'M')), 4);
  assert.equal(pageCount(zoneById(CHIPS, 'all')), 1);
});

test('paginile au tot atâtea nume câte pagini', () => {
  for (const z of CHIPS) {
    if (z.pageNames) assert.equal(z.pageNames.length, z.pages.length, z.id);
    if (z.pages && z.pages.length > 1) assert.ok(z.pageNames, `${z.id} are pagini fără nume`);
  }
});

test('regiunile zonelor stau în viewBox-ul panoului lor', () => {
  for (const z of [...ZONES, ...CHIPS]) {
    if (!z.pages) continue;
    const [vx, vy, vw, vh] = VIEWBOX[z.panel];
    for (const [x0, y0, x1, y1] of z.pages) {
      assert.ok(x0 >= vx && x1 <= vx + vw, `${z.id}: ${x0}–${x1} pe orizontală`);
      assert.ok(y0 >= vy && y1 <= vy + vh, `${z.id}: ${y0}–${y1} pe verticală`);
      assert.ok(x1 > x0 && y1 > y0, `${z.id}: regiune goală`);
    }
  }
});

// Scena telefonului, așa cum o socotește js/shell.js pe un ecran de 375 px.
const PHONE = { width: 375, height: 471 };
const phoneBox = { x0: 6, y0: 96, x1: PHONE.width - 6, y1: PHONE.height - 62 };
const phoneScale = (zone, page) => {
  const k = unitPx(zone.panel);
  const slot = { left: 8, top: 8, width: plateWidth(zone.panel), height: PLATE_H };
  const rect = regionRect(slot, zone.panel, zone.pages[page]);
  return fitCamera(rect, phoneBox, { originX: PHONE.width / 2 }).scale * k;
};

test('pe telefon, între două manete vecine rămân cel puțin 44 px', () => {
  const pageOf = { compute: 'compute', commands: 'commands', rai: 'RAI', M: 'M' };
  for (const z of CHIPS) {
    const group = pageOf[z.id];
    if (!group) continue;
    const xs = POS.right[group].switches.map((s) => s[0]);
    const per = Math.ceil(xs.length / z.pages.length);
    for (let p = 0; p < z.pages.length; p++) {
      const px = phoneScale(z, p);
      const chunk = xs.slice(p * per, (p + 1) * per);
      for (let i = 0; i + 1 < chunk.length; i++) {
        const d = (chunk[i + 1] - chunk[i]) * px;
        assert.ok(d >= 44, `${z.id} pagina ${p}: ${d.toFixed(1)} px între manetele ${i} și ${i + 1}`);
      }
    }
  }
});

test('pe telefon, manetele paginii încap pe ecran', () => {
  const pageOf = { compute: 'compute', commands: 'commands', rai: 'RAI', M: 'M' };
  for (const z of CHIPS) {
    const group = pageOf[z.id];
    if (!group) continue;
    const xs = POS.right[group].switches.map((s) => s[0]);
    const per = Math.ceil(xs.length / z.pages.length);
    for (let p = 0; p < z.pages.length; p++) {
      const [x0, , x1] = z.pages[p];
      const chunk = xs.slice(p * per, (p + 1) * per);
      assert.ok(Math.min(...chunk) >= x0 && Math.max(...chunk) <= x1,
        `${z.id} pagina ${p}: manetele ies din regiune`);
    }
  }
});
