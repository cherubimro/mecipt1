// SPDX-License-Identifier: AGPL-3.0-or-later
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lampNodeMap, lampEmissive, switchNodeMap, leverTilt } from '../../web/js/lamp3d.js';
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
