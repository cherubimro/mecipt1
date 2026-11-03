// SPDX-License-Identifier: AGPL-3.0-or-later
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickSound, saveSound, clickKind } from '../../web/js/sound/page.js';

const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), m }; };
const blocked = { getItem() { throw new Error('blocat'); }, setItem() { throw new Error('blocat'); } };

test("sound: implicit pornit; 'off' îl oprește; stocarea blocată → pornit", () => {
  assert.equal(pickSound(mem()), true);
  assert.equal(pickSound(null), true);
  const s = mem();
  s.setItem('mecipt.sound', 'off');
  assert.equal(pickSound(s), false);
  s.setItem('mecipt.sound', 'on');
  assert.equal(pickSound(s), true);
  assert.equal(pickSound(blocked), true);
});

test("sound: saveSound scrie 'on'/'off' la mecipt.sound și nu aruncă pe stocare blocată", () => {
  const s = mem();
  saveSound(false, s);
  assert.equal(s.m.get('mecipt.sound'), 'off');
  saveSound(true, s);
  assert.equal(s.m.get('mecipt.sound'), 'on');
  saveSound(true, blocked);
  saveSound(true, null);
});

test("sound: butoanele cu revenire sunt 'button', comutatoarele M/RAI/IMPULSURI sunt 'lever'", () => {
  for (const id of ['switch-compute-0', 'switch-commands-2', 'switch-memory-0', 'switch-instr-1']) assert.equal(clickKind(id), 'button', id);
  for (const id of ['switch-M-4', 'switch-RAI-0', 'switch-pulses-0']) assert.equal(clickKind(id), 'lever', id);
});

// ---- orchestrarea din pagină, cu un document și un motor falși ----
import { setupSound } from '../../web/js/sound/page.js';

function fakeDoc() {
  const ls = new Map();
  return {
    hidden: false,
    addEventListener(t, fn) { if (!ls.has(t)) ls.set(t, []); ls.get(t).push(fn); },
    removeEventListener(t, fn) { const a = ls.get(t) || []; const i = a.indexOf(fn); if (i >= 0) a.splice(i, 1); },
    fire(t) { for (const fn of [...(ls.get(t) || [])]) fn({ type: t }); },
  };
}
function fakeButton() { return { disabled: false, innerHTML: '', title: '', attrs: {}, setAttribute(k, v) { this.attrs[k] = v; } }; }
function fakeEngine({ startsRunning = true } = {}) {
  const log = [];
  let resolveResume = null;
  const e = {
    log, available: false, running: false, enabledValue: true,
    unlock() {
      log.push('unlock');
      e.available = true;
      if (startsRunning) e.running = true;
      return true;
    },
    resumeNow() { e.running = true; if (resolveResume) { const r = resolveResume; resolveResume = null; r(); } },
    whenRunning() { if (e.running) return Promise.resolve(); return new Promise((r) => { resolveResume = r; }); },
    setEnabled(v) { e.enabledValue = v; log.push(`enabled:${v}`); },
    setHidden(h) { log.push(`hidden:${h}`); },
    now: () => 1,
    play(kind, t) { log.push(`play:${kind}`); },
    buzz(b) { log.push(`buzz:${b.tape}:${b.type}`); },
    stopAll() { log.push('stopAll'); },
  };
  return e;
}
const T = () => ({ sound: { on: 'pornit', off: 'oprit', unavailable: 'indisponibil' } });
const setup = (engine, storage = mem(), doc = fakeDoc()) => ({ doc, s: setupSound({ button: fakeButton(), storage, T, engine, doc, supported: true }) });

test('sound page: primul gest cu 🔇 ținut minte → setEnabled(false) înainte de unlock', () => {
  const st = mem(); st.setItem('mecipt.sound', 'off');
  const e = fakeEngine();
  const { doc } = setup(e, st);
  doc.fire('pointerdown');
  assert.ok(e.log.indexOf('enabled:false') >= 0 && e.log.indexOf('enabled:false') < e.log.indexOf('unlock'), e.log.join(' '));
  assert.ok(!e.log.includes('enabled:true'));
});

test('sound page: o atingere (touchend / click) deblochează și gesturile reîncearcă până pornește contextul', () => {
  const e = fakeEngine({ startsRunning: false });
  const { doc } = setup(e);
  doc.fire('touchend');
  assert.equal(e.log.filter((x) => x === 'unlock').length, 1);
  doc.fire('click');
  assert.equal(e.log.filter((x) => x === 'unlock').length, 2, 'al doilea gest reîncearcă');
  e.resumeNow();
  doc.fire('click');
  assert.equal(e.log.filter((x) => x === 'unlock').length, 2, 'contextul pornit: nimic de reîncercat');
});

test('sound page: cu contextul suspendat onFrame nu programează nimic', () => {
  const e = fakeEngine({ startsRunning: false });
  const { doc, s } = setup(e);
  doc.fire('pointerdown');
  for (let k = 0; k < 60; k++) s.onFrame({ tapePos: k, typed: 'x' }, 16);
  assert.ok(!e.log.some((x) => x.startsWith('play:')), e.log.join(' '));
});

test('sound page: comutarea în timpul bâzâitului oprește bâzâitul', () => {
  const e = fakeEngine();
  const { doc, s } = setup(e);
  doc.fire('pointerdown');
  let pos = 0;
  for (let k = 0; k < 30; k++) s.onFrame({ tapePos: (pos += 20), typed: '' }, 16);
  assert.ok(e.log.includes('buzz:true:false'));
  s.toggle();
  assert.equal(e.log.at(-1) === 'buzz:false:false' || e.log.includes('buzz:false:false'), true);
  assert.equal(s.on, false);
});

test('sound page: clicul primului gest se aude după ce contextul pornește', async () => {
  const e = fakeEngine({ startsRunning: false });
  const { doc, s } = setup(e);
  doc.fire('pointerdown');
  s.control('switch-compute-0');
  assert.ok(!e.log.includes('play:button'));
  e.resumeNow();
  await new Promise((r) => setTimeout(r, 0));
  assert.ok(e.log.includes('play:button'), e.log.join(' '));
});
