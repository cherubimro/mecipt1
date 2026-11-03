// SPDX-License-Identifier: AGPL-3.0-or-later
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lampNodeMap, lampEmissive } from '../../web/js/lamp3d.js';
import { lampIds, LAMP_COLORS } from '../../web/js/panel.js';
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
