// SPDX-License-Identifier: AGPL-3.0-or-later
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Tour } from '../../web/js/tour.js';
import { lampIds, switchIds } from '../../web/js/panel.js';
import { readJson } from './helpers.mjs';

const RO = readJson('web/data/help/ro.json');
const EN = readJson('web/data/help/en.json');
const POS = readJson('web/data/positions.json');
const IDS = ['welcome', 'middle-panel', 'memory-drum', 'words', 'rai', 'start-address', 'run', 'typewriter', 'microops',
  'r2', 'generator', 'tape', 'provenance', 'more'];
const RUN = IDS.indexOf('run');

test('steps come in order', () => {
  const t = new Tour(RO.tour);
  assert.equal(t.active, false);
  t.start();
  assert.equal(t.step().id, 'welcome');
  for (let i = 0; i < RUN; i++) t.next();
  assert.equal(t.step().id, 'run');
  assert.equal(t.index, RUN);
});

test('waiting step blocks next', () => {
  const t = new Tour(RO.tour);
  t.start();
  for (let i = 0; i < RUN; i++) t.next();
  t.next();
  assert.equal(t.step().id, 'run');
  assert.equal(t.onEvent({ type: 'halted' }), false);
  assert.equal(t.onEvent({ type: 'typed' }), true);
  assert.equal(t.step().id, 'typewriter');
});

test('wrong click does not advance', () => {
  const t = new Tour([{ id: 'a', target: 'x', view: 'all', text: 'a', waitFor: 'click:switch-compute-0' },
    { id: 'b', target: 'x', view: 'all', text: 'b', waitFor: null }]);
  t.start();
  assert.equal(t.onEvent({ type: 'click', id: 'switch-M-0' }), false);
  assert.equal(t.step().id, 'a');
  assert.equal(t.onEvent({ type: 'click', id: 'switch-compute-0' }), true);
  assert.equal(t.step().id, 'b');
});

test('prev and stop', () => {
  const t = new Tour(RO.tour);
  t.start();
  t.next();
  t.next();
  t.prev();
  assert.equal(t.step().id, 'middle-panel');
  t.prev(); t.prev();
  assert.equal(t.index, 0);
  t.stop();
  assert.equal(t.active, false);
  assert.equal(t.step(), null);
  assert.equal(t.onEvent({ type: 'typed' }), false);
});

test('the last next ends the tour', () => {
  const t = new Tour(RO.tour);
  t.start();
  for (let i = 0; i < RUN; i++) t.next();
  t.onEvent({ type: 'typed' });
  for (let i = 0; i < 10; i++) t.next();
  assert.equal(t.active, false);
});

test('tour survives program change', () => {
  const t = new Tour(RO.tour);
  t.start();
  for (let i = 0; i < RUN; i++) t.next();
  assert.equal(t.onEvent({ type: 'load' }), false);
  assert.equal(t.active, true);
  assert.equal(t.step().id, 'run');
});

test('content', () => {
  assert.deepEqual(RO.tour.map((s) => s.id), IDS);
  assert.deepEqual(EN.tour.map((s) => s.id), IDS);
  const ok = new Set([...lampIds(POS), ...switchIds(POS), 'knob', 'meter-0', 'panel-left', 'panel-middle', 'panel-right', 'desk',
    'tape', 'sheet', 'provenance', 'doc-link']);
  for (const H of [RO, EN]) {
    for (const s of H.tour) {
      assert.ok(ok.has(s.target), `${s.id}: ${s.target}`);
      assert.ok(['all', 'left', 'middle', 'right'].includes(s.view), s.id);
      assert.ok(s.text && s.text.length < 600, s.id);
    }
  }
  assert.equal(RO.tour[RUN].waitFor, 'typed');
  for (let i = 0; i < IDS.length; i++) assert.deepEqual(
    [RO.tour[i].target, RO.tour[i].view, RO.tour[i].waitFor], [EN.tour[i].target, EN.tour[i].view, EN.tour[i].waitFor]);
});

test('register steps frame their whole group', () => {
  const want = { 'middle-panel': 'meters', 'memory-drum': 'M', words: 'RI', rai: 'RAI', 'start-address': 'RAI',
    run: 'compute', microops: 'uop', r2: 'R2', generator: 'generator' };
  for (const H of [RO, EN]) for (const s of H.tour) {
    if (s.id in want) assert.equal(s.group, want[s.id], s.id);
    if (s.group) assert.ok(s.group === 'meters' || s.group in POS.right || s.group in POS.left, s.group);
  }
  const views = RO.tour.map((s) => s.view);
  assert.ok(views.includes('left') && views.includes('middle') && views.includes('right'), 'turul trece prin toate panourile');
});
