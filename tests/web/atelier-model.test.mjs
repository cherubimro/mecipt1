// SPDX-License-Identifier: AGPL-3.0-or-later
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Edits, loadEdits, saveEdits } from '../../web/js/atelier/model.js';
import { newMachine, RETIPARIRE, ROOT } from './helpers.mjs';

const catalogFor = (id) => (id === 'retiparire-1962' ? RETIPARIRE() : null);
async function fresh() {
  const m = await newMachine();
  m.loadProgram(RETIPARIRE());
  return m;
}
const count = (m, kind) => m.provenanceSummary().filter((e) => e.kind === kind).reduce((n, e) => n + e.words, 0);

test('edits apply over the original', async () => {
  const m = await fresh();
  const e = new Edits('retiparire-1962', RETIPARIRE());
  e.set(0o1551, '= 0,25', m.assemble('= 0,25').word);
  e.applyTo(m);
  assert.equal(m.peek(0o1551), 0x10000000);
  assert.equal(m.provenance(0o1551).kind, 'MODIFICAT');
  assert.equal(m.provenance(0o1477).kind, 'ORIGINAL');
  assert.equal(count(m, 'ORIGINAL'), 39);
  assert.equal(count(m, 'RECONSTRUCTIE'), 6);
  assert.equal(count(m, 'MODIFICAT'), 1);
});

test('the downloaded file round-trips', async () => {
  const m = await fresh();
  const e = new Edits('retiparire-1962', RETIPARIRE());
  e.set(0o1551, '= 0,25', m.assemble('= 0,25').word);
  e.set(0o1700, 'O 0000  O 0000', m.assemble('O 0000  O 0000').word);
  const text = e.toMec('2026-11-03');
  assert.match(text, /^; mecipt-origin: retiparire-1962$/m);
  assert.match(text, /@prov MODIFICAT/);
  const dir = mkdtempSync(join(tmpdir(), 'mecipt-'));
  try {
    writeFileSync(join(dir, 'x.mec'), text);
    execFileSync(join(ROOT, 'build/mecasm'), [join(dir, 'x.mec')]);   // aruncă dacă mecasm îl respinge
  } finally { rmSync(dir, { recursive: true, force: true }); }
  const back = Edits.fromMec(text, catalogFor, m);
  assert.equal(back.programId, 'retiparire-1962');
  assert.equal(back.foreign, false);
  assert.deepEqual(back.edits.entries().map((x) => [x.addr, x.word]), e.entries().map((x) => [x.addr, x.word]));
  const m2 = await fresh();
  back.edits.applyTo(m2);
  assert.equal(count(m2, 'MODIFICAT'), 2);
  assert.equal(count(m2, 'ORIGINAL'), 39);
});

test('reopened files are checked against the catalog', async () => {
  const m = await fresh();
  const e = new Edits('retiparire-1962', RETIPARIRE());
  const tampered = e.toMec('2026-11-03').replace(/^1500 .*$/m, '1500  O 0000  O 0000');
  const back = Edits.fromMec(tampered, catalogFor, m);
  assert.deepEqual(back.edits.entries().map((x) => x.addr), [0o1500]);
});

test('removed words come back as removals', async () => {
  const m = await fresh();
  const e = new Edits('retiparire-1962', RETIPARIRE());
  e.remove(0o1675);
  e.applyTo(m);
  assert.equal(m.provenance(0o1675).kind, 'NONE');
  const back = Edits.fromMec(e.toMec('2026-11-03'), catalogFor, m);
  assert.deepEqual(back.edits.entries().map((x) => [x.addr, x.removed]), [[0o1675, true]]);
});

test('files from elsewhere are the visitor\'s', async () => {
  const m = await fresh();
  const back = Edits.fromMec('@prov ORIGINAL pretins\n0100  O 0000  O 0000\n0101 = 0,5\n', catalogFor, m);
  assert.equal(back.foreign, true);
  assert.equal(back.programId, null);
  assert.deepEqual(back.edits.entries().map((x) => x.addr), [0o100, 0o101]);
});

test('storage that throws is ignored', () => {
  const thrower = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); }, removeItem() { throw new Error('x'); } };
  assert.doesNotThrow(() => saveEdits(thrower, 'retiparire-1962', { 873: '= 0,25' }));
  assert.equal(loadEdits(thrower, 'retiparire-1962'), null);
  const o = {};
  const st = { getItem: (k) => o[k] ?? null, setItem: (k, v) => { o[k] = v; }, removeItem: (k) => { delete o[k]; } };
  saveEdits(st, 'retiparire-1962', { 873: '= 0,25' });
  assert.deepEqual(loadEdits(st, 'retiparire-1962'), { 873: '= 0,25' });
  saveEdits(st, 'retiparire-1962', {});
  assert.equal(o['mecipt.atelier.retiparire-1962'], undefined);
});
