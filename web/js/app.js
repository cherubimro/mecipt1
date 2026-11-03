// SPDX-License-Identifier: AGPL-3.0-or-later
// Pagina pupitrului: leagă mașina (WASM), bucla de cadre, panourile, banda și mașina de scris.
import { loadMecipt, HALT } from './mecipt.js';
import { Clock } from './clock.js';
import { Runner } from './runner.js';
import { renderPanel } from './panel.js';
import { lampTargets, uopIndexForGrid, actionFor, isMomentary } from './bindings.js';
import { glowStep } from './glow.js';
import { renderTape } from './tape.js';
import { Sheet, renderSheet } from './typewriter.js';
import { S } from './strings.js';

const $ = (id) => document.getElementById(id);
const getJson = async (url) => (await fetchOk(url)).json();
const getText = async (url) => (await fetchOk(url)).text();
async function fetchOk(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  return r;
}

function setTexts() {
  $('subtitle').textContent = S.subtitle;
  $('program-label').textContent = S.program;
  $('speed-label').textContent = S.speed;
  $('speed-epoca').textContent = S.speedEpoca;
  $('speed-rapid').textContent = S.speedRapid;
  $('reload').textContent = S.reload;
  $('hint').textContent = S.hint;
  $('reader-label').textContent = S.tapeReader;
  $('typewriter-label').textContent = S.typewriter;
  $('attribution').textContent = S.attribution;
  $('status').textContent = S.loading;
}

function provenanceLabel(machine, hasTape) {
  const el = $('provenance');
  el.textContent = '';
  const parts = machine.provenanceSummary();
  parts.forEach((p, i) => {
    if (i) el.append(' · ');
    const k = document.createElement('span');
    k.className = `kind kind-${p.kind}`;
    k.textContent = S.prov[p.kind] ?? p.kind;
    el.append(k, ` — ${p.source}: ${S.words(p.words)}`);
  });
  if (hasTape) el.append(` · ${S.tapeTest}`);
}

async function main() {
  setTexts();
  const [wasm, catalog, positions, colors, artL, artM, artR] = await Promise.all([
    fetchOk('mecipt.wasm').then((r) => r.arrayBuffer()), getJson('programs/catalog.json'),
    getJson('data/positions.json'), getJson('data/lamp-colors.json'),
    getJson('data/art-left.json'), getJson('data/art-middle.json'), getJson('data/art-right.json'),
  ]);
  const machine = await loadMecipt(wasm);
  const runner = new Runner(machine, new Clock('epoca'));
  const uopIndex = uopIndexForGrid(machine);
  const sheet = new Sheet();

  $('panel-left').innerHTML = renderPanel('left', artL, positions, colors);
  $('panel-middle').innerHTML = renderPanel('middle', artM, positions, colors);
  $('panel-right').innerHTML = renderPanel('right', artR, positions, colors);

  // becurile: elementul de lumină și strălucirea curentă
  const lamps = [...document.querySelectorAll('.lamp')].map((g) => ({ id: g.id, glow: g.querySelector('.glow'), b: 0, shown: -1 }));
  const switches = { M: new Uint8Array(31), RAI: new Uint8Array(10) };
  const setLever = (id, up) => {
    const el = $(id);
    if (el) { el.classList.toggle('up', up); el.classList.toggle('down', !up); }
  };
  const showSwitchWord = (group, bits) => bits.forEach((v, i) => setLever(`switch-${group}-${i}`, v === 1));

  for (const p of catalog) {
    const o = document.createElement('option');
    o.value = p.id;
    o.textContent = p.title;
    $('program').append(o);
  }

  let current = null, tapeRows = new Uint8Array(0), smoothTape = 0, lastHalt = null;
  async function select(id) {
    const p = catalog.find((c) => c.id === id) ?? catalog[0];
    const [text, tape] = await Promise.all([getText(`programs/${p.file}`), p.tape ? getText(`programs/${p.tape}`) : null]);
    const start = parseInt(p.start, 8);
    runner.load(text, tape, start);
    current = p;
    $('program').value = p.id;
    tapeRows = machine.tape();
    smoothTape = 0;
    sheet.clear();
    lastHalt = null;
    for (let i = 0; i < 10; i++) switches.RAI[i] = (start >> (9 - i)) & 1;
    switches.M.fill(0);
    showSwitchWord('RAI', switches.RAI);
    showSwitchWord('M', switches.M);
    provenanceLabel(machine, !!p.tape);
    $('tape-info').textContent = p.tape ? `${tapeRows.length} rânduri · ${S.tapeTest}` : S.tapeEmpty;
    $('status').textContent = S.idle;
  }

  function press(id) {
    const a = actionFor(id, switches);
    if (id.startsWith('switch-M-')) showSwitchWord('M', switches.M);
    else if (id.startsWith('switch-RAI-')) showSwitchWord('RAI', switches.RAI);
    else if (id === 'switch-pulses-0') setLever(id, !runner.pulsesOff);
    else if (isMomentary(id)) { setLever(id, true); setTimeout(() => setLever(id, false), 150); }
    if (a) runner.enqueue(a);
    if (a && a.ui === 'automat') lastHalt = null;
  }
  document.addEventListener('click', (e) => {
    const sw = e.target.closest && e.target.closest('.switch');
    if (sw) press(sw.id);
  });
  document.addEventListener('keydown', (e) => {
    const sw = e.target.closest && e.target.closest('.switch');
    if (sw && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); press(sw.id); }
  });

  const setSpeed = (name) => {
    runner.clock.setSpeed(name);
    const r = document.querySelector(`input[name=speed][value=${name}]`);
    if (r) r.checked = true;
  };
  document.querySelectorAll('input[name=speed]').forEach((r) => r.addEventListener('change', () => setSpeed(r.value)));
  $('program').addEventListener('change', () => select($('program').value));
  $('reload').addEventListener('click', () => select(current ? current.id : catalog[0].id));

  // Un cadru: acțiuni, mașină, becuri, bandă, coală. Bucla rAF îl cheamă la fiecare imagine;
  // testul de fum îl cheamă direct (în Chrome cu timp virtual rAF nu rulează).
  function advance(dt) {
    const snap = runner.frame(dt);
    if (snap.typed) sheet.add(snap.typed);
    if (snap.halted !== null) lastHalt = snap.halted;
    const targets = lampTargets(snap, runner, uopIndex);
    for (const l of lamps) {
      l.b = glowStep(l.b, targets.get(l.id) ?? 0, Math.min(dt, 100));
      const v = Math.round(l.b * 50) / 50;
      if (v !== l.shown) { l.glow.style.opacity = String(v); l.shown = v; }
    }
    smoothTape += (snap.tapePos - smoothTape) * (1 - Math.exp(-dt / 60));
    if (Math.abs(snap.tapePos - smoothTape) < 0.01) smoothTape = snap.tapePos;
    renderTape($('tape'), tapeRows, snap.tapePos, smoothTape);
    renderSheet($('sheet'), sheet);
    const st = runner.mode === 'automat' && !runner.pulsesOff ? S.running
      : lastHalt !== null && lastHalt !== HALT.OK ? S.halt[lastHalt] : S.idle;
    const msg = `${st} (${S.machineTime}: ${machine.seconds().toFixed(1)} s)`;
    if ($('status').textContent !== msg) $('status').textContent = msg;
  }
  let last = null;
  function frame(now) {
    advance(last === null ? 16 : now - last);
    last = now;
    requestAnimationFrame(frame);
  }

  await select(catalog[0].id);
  requestAnimationFrame(frame);
  return { runner, select, setSpeed, sheet, advance };
}

const api = {};
api.ready = main().then((o) => Object.assign(api, o)).catch((e) => {
  $('status').textContent = S.loadError + e.message;
  throw e;
});
window.__pupitru = api;
