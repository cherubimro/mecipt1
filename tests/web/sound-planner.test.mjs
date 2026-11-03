// SPDX-License-Identifier: AGPL-3.0-or-later
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Planner, MAX_CLICKS_PER_FRAME, LOOKAHEAD_S } from '../../web/js/sound/planner.js';
import { MAX_FRAME_MS } from '../../web/js/clock.js';

// Rulează planificatorul `seconds` secunde, cu `perSecond` evenimente de felul `kind` ('tape' | 'type').
// Întoarce toate rezultatele cadrelor, cu timpul cadrului alături.
function run(p, seconds, perSecond, kind = 'tape', fps = 60, st = { t: 0, pos: 0, acc: 0 }) {
  const dtMs = 1000 / fps;
  const out = [];
  for (let k = 0; k < Math.round(seconds * fps); k++) {
    st.acc += (perSecond * dtMs) / 1000;
    const n = Math.floor(st.acc);
    st.acc -= n;
    let typed = '';
    if (kind === 'tape') st.pos += n; else typed = 'x'.repeat(n);
    st.t += dtMs / 1000;
    out.push({ t: st.t, r: p.frame({ t: st.t, dtMs, tapePos: st.pos, typed }) });
  }
  return out;
}
const count = (frames, kind) => frames.reduce((s, f) => s + f.r.events.filter((e) => e.kind === kind).length, 0);

test('planner: ca în 1962 (10 rânduri/s) dă câte un clic pe rând, fără bâzâit', () => {
  const p = new Planner();
  const fr = run(p, 3, 10);
  assert.ok(Math.abs(count(fr, 'tape') - 30) <= 1, `clicuri: ${count(fr, 'tape')}`);
  assert.ok(fr.every((f) => !f.r.buzz.tape));
});

test('planner: rapid (1000 rânduri/s) bâzâie în 0,2 s și nu mai dă clicuri', () => {
  const p = new Planner();
  const st = { t: 0, pos: 0, acc: 0 };
  const first = run(p, 0.2, 1000, 'tape', 60, st);
  assert.equal(first.at(-1).r.buzz.tape, true);
  const after = run(p, 1, 1000, 'tape', 60, st);
  assert.equal(count(after, 'tape'), 0);
  assert.ok(after.every((f) => f.r.buzz.tape));
});

test('planner: bâzâitul se stinge în 0,5 s după ultima citire', () => {
  const p = new Planner();
  const st = { t: 0, pos: 0, acc: 0 };
  run(p, 1, 1000, 'tape', 60, st);
  const quiet = run(p, 0.5, 0, 'tape', 60, st);
  assert.equal(quiet.at(-1).r.buzz.tape, false);
});

test('planner: rar la rapid rămâne clic', () => {
  const p = new Planner();
  const fr = run(p, 10.1, 0.5);   // 10,1 s: acumulatorul fracționar atinge sigur al 5-lea rând
  assert.equal(count(fr, 'tape'), 5);
  assert.ok(fr.every((f) => !f.r.buzz.tape));
});

test('planner: evenimentele unui cadru se întind pe durata lui', () => {
  const p = new Planner();
  p.frame({ t: 9.9, dtMs: 100, tapePos: 0, typed: '' });
  const r = p.frame({ t: 10, dtMs: 100, tapePos: 4, typed: '' });
  const ts = r.events.map((e) => e.t);
  [10.05, 10.075, 10.1, 10.125].forEach((v, i) => assert.ok(Math.abs(ts[i] - v) < 1e-9, `${ts}`));
  assert.equal(ts.length, 4);
});

test('planner: un cadru uriaș nu dă rafală', () => {
  const p = new Planner();
  p.frame({ t: 1, dtMs: 16, tapePos: 0, typed: '' });
  const r = p.frame({ t: 2, dtMs: 600000, tapePos: 50, typed: '' });
  assert.ok(r.events.length <= MAX_CLICKS_PER_FRAME, `${r.events.length}`);
  assert.ok(r.events.every((e) => e.t >= 2 && e.t <= 2 + LOOKAHEAD_S + MAX_FRAME_MS / 1000));
});

test('planner: tapePos care scade = reset', () => {
  const p = new Planner();
  const st = { t: 0, pos: 0, acc: 0 };
  run(p, 0.5, 1000, 'tape', 60, st);
  const r = p.frame({ t: st.t + 0.016, dtMs: 16, tapePos: 0, typed: '' });
  assert.equal(r.events.length, 0);
  assert.equal(r.buzz.tape, false);
});

test('planner: rândul nou e carul', () => {
  const p = new Planner();
  const r = p.frame({ t: 0, dtMs: 16, tapePos: 0, typed: 'AB\nC' });
  assert.deepEqual(r.events.map((e) => e.kind), ['key', 'key', 'carriage', 'key']);
});

test('planner: reset() oprește ambele bâzâituri', () => {
  const p = new Planner();
  const a = { t: 0, pos: 0, acc: 0 };
  run(p, 0.5, 1000, 'tape', 60, a);
  const b = { t: a.t, pos: 0, acc: 0 };
  const fr = run(p, 0.5, 1000, 'type', 60, b);
  assert.equal(fr.at(-1).r.buzz.type, true);
  p.reset();
  const r = p.frame({ t: b.t + 0.016, dtMs: 16, tapePos: a.pos, typed: '' });
  assert.deepEqual(r.buzz, { tape: false, type: false });
});
