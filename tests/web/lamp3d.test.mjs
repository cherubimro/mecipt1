// SPDX-License-Identifier: AGPL-3.0-or-later
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lampNodeMap, lampEmissive, switchNodeMap, leverTilt, ZONES3D, zoneNodes, wideTriangles, NEEDLES, MISSING_DIAL } from '../../web/js/lamp3d.js';
import { lampIds, switchIds, LAMP_COLORS } from '../../web/js/panel.js';
import { readJson } from './helpers.mjs';

const POS = readJson('web/data/positions.json');
const COLORS = readJson('web/data/lamp-colors.json');
const GLTF = readJson('web/model3d/scene.gltf');

test('3D: fiecare bec al emulatorului are obiectul lui în model, fără dubluri', () => {
  const map = lampNodeMap(POS);
  const ids = lampIds(POS);
  assert.equal(ids.length, 161);
  assert.equal(map.size, 161);
  for (const id of ids) assert.ok(map.has(id), id);
  assert.equal(new Set(map.values()).size, 161);
  const names = new Set(GLTF.nodes.map((n) => n.name));
  for (const [id, node] of map) assert.ok(names.has(node), `${id} → ${node} lipsește din model`);
  assert.equal(map.get('lamp-M-0'), 'LED');
});

test('3D: becul strălucește în culoarea lui de pe panou', () => {
  assert.equal(lampEmissive('lamp-M-0', COLORS), LAMP_COLORS.green.on[1]);
  assert.equal(lampEmissive('lamp-RI-2', COLORS), LAMP_COLORS.amber.on[1]);
  assert.equal(lampEmissive('lamp-nimic-0', COLORS), LAMP_COLORS.white.on[1]);
});

test('3D: fiecare comutator al pupitrului are obiectul lui în model, fără dubluri', () => {
  const map = switchNodeMap(POS);
  const ids = switchIds(POS);
  assert.equal(map.size, ids.length);
  for (const id of ids) assert.ok(map.has(id), id);
  assert.equal(new Set(map.values()).size, ids.length);
  const names = new Set(GLTF.nodes.map((n) => n.name));
  for (const [id, node] of map) assert.ok(names.has(node), `${id} → ${node} lipsește din model`);
  assert.equal(map.get('switch-compute-0'), 'Switch.051');
  assert.equal(map.get('switch-M-0'), 'Switch.065');
});

test('3D: maneta se înclină în sus sau în jos, ca în desenul 2D, oricum ar fi întors obiectul', () => {
  // rotație în jurul axei x a manetei; capătul ei pleacă spre −y propriu când unghiul crește
  assert.ok(leverTilt(true, true) < 0 && leverTilt(false, true) > 0);   // y propriu urcă pe panou (panoul drept)
  assert.ok(leverTilt(true, false) > 0 && leverTilt(false, false) < 0); // y propriu coboară (generatorul, panoul stâng)
  assert.equal(leverTilt(true, true), -leverTilt(false, true));
});

test('3D: zonele camerei — fiecare are obiectele ei din model, pe panoul ei', () => {
  const ids = ZONES3D.map((z) => z.id);
  assert.deepEqual(ids, ['all', 'compute', 'commands', 'RAI', 'M', 'registers', 'left', 'meters']);
  const names = new Set(GLTF.nodes.map((n) => n.name));
  assert.deepEqual(zoneNodes(POS, 'all'), []);
  for (const z of ZONES3D.filter((x) => x.id !== 'all')) {
    const nodes = zoneNodes(POS, z.id);
    assert.ok(nodes.length > 0, z.id);
    for (const n of nodes) assert.ok(names.has(n), `${z.id}: ${n}`);
    assert.ok(names.has(z.panel), `${z.id}: panoul ${z.panel}`);
  }
  assert.ok(zoneNodes(POS, 'compute').includes('Switch.051'));          // CALCULEAZA AUTOMAT
  assert.equal(zoneNodes(POS, 'M').length, 62);                         // 31 de becuri + 31 de comutatoare
  assert.ok(zoneNodes(POS, 'left').includes('Switch.020'));             // generatorul, pe panoul stâng
  assert.deepEqual(zoneNodes(POS, 'meters'), ['Center']);
  assert.deepEqual(zoneNodes(POS, 'nimic'), []);
});

test('3D: fețele late ale ramei (raftul, fața din jurul panourilor) se despart de fâșiile înguste de aluminiu', () => {
  // un pătrat 1×1 (două triunghiuri) și o fâșie 1×0,03 (două triunghiuri)
  const pos = new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 0, 2, 0, 1, 2, 0, 1, 2.03, 0, 0, 2.03, 0]);
  const idx = new Uint32Array([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]);
  assert.deepEqual([...wideTriangles(pos, idx, 0.095)], [1, 1, 0, 0]);
  assert.deepEqual([...wideTriangles(pos, idx, 2)], [0, 0, 0, 0]);
});

test('3D: acele voltmetrelor de sus — fiecare pe cadranul lui, înclinat ca în fotografia din muzeu', () => {
  const names = new Set(GLTF.nodes.map((n) => n.name));
  assert.equal(NEEDLES.length, 4);
  for (const nd of NEEDLES) {
    assert.ok(names.has(nd.arrow) && names.has(nd.dial), nd.arrow);
    assert.ok(Math.abs(nd.angle) >= 20 && Math.abs(nd.angle) <= 60, nd.arrow);
  }
  assert.equal(new Set(NEEDLES.map((n) => n.dial)).size, 4);
  assert.deepEqual(NEEDLES.map((n) => Math.sign(n.angle)), [-1, 1, -1, -1]);   // al doilea arată spre dreapta
});

test('3D: voltmetrul lipsă de pe rândul al doilea se completează cu fața unui vecin de pe același rând', () => {
  const names = new Set(GLTF.nodes.map((n) => n.name));
  for (const k of ['copy', 'from', 'to']) assert.ok(names.has(MISSING_DIAL[k]), MISSING_DIAL[k]);
  const pos = (nm) => GLTF.nodes.find((n) => n.name === nm);
  assert.ok(pos(MISSING_DIAL.copy) && pos(MISSING_DIAL.to));
});
