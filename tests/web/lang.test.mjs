// SPDX-License-Identifier: AGPL-3.0-or-later
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickLang, saveLang, LANGS } from '../../web/js/lang.js';
import { STRINGS, S } from '../../web/js/strings.js';

const store = (o) => ({ getItem: (k) => (k in o ? o[k] : null), setItem: (k, v) => { o[k] = v; } });
const thrower = { getItem() { throw new Error('blocat'); }, setItem() { throw new Error('blocat'); } };

test('?lang=en wins', () => assert.equal(pickLang('?lang=en', store({ 'mecipt.lang': 'ro' })), 'en'));
test('storage is remembered', () => {
  assert.equal(pickLang('', store({ 'mecipt.lang': 'en' })), 'en');
  const o = {};
  saveLang('en', store(o));
  assert.equal(o['mecipt.lang'], 'en');
});
test('lang falls back when storage throws', () => {
  assert.equal(pickLang('', thrower), 'ro');
  assert.equal(pickLang('', null), 'ro');
  assert.doesNotThrow(() => saveLang('en', thrower));
});
test('invalid values are ignored', () => {
  assert.equal(pickLang('?lang=fr', store({ 'mecipt.lang': 'xx' })), 'ro');
  assert.deepEqual(LANGS, ['ro', 'en']);
});

const keys = (o, p = '') => Object.entries(o).flatMap(([k, v]) =>
  v && typeof v === 'object' && !Array.isArray(v) ? keys(v, p + k + '.') : [p + k]).sort();
test('both languages have the same keys', () => {
  assert.deepEqual(keys(STRINGS.ro), keys(STRINGS.en));
  assert.ok(S('en').switchLabel('switch-compute-0').startsWith('CALCULEAZA AUTOMAT'));
  assert.ok(S('en').switchLabel('switch-compute-0').includes('('));
  assert.equal(S('ro').switchLabel('switch-RAI-0'), 'Comutatorul RAI 512');
  assert.notEqual(S('en').hint, S('ro').hint);
});
