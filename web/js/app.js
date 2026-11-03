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
import { pickLang, saveLang } from './lang.js';
import { HelpPanel } from './help.js';
import { renderMarkdown } from './md.js';
import { Tour } from './tour.js';
import { describeValue } from './values.js';

const $ = (id) => document.getElementById(id);
const storage = (() => { try { return window.localStorage; } catch { return null; } })();
let lang = pickLang(location.search, storage);
const T = () => S(lang);
const getJson = async (url) => (await fetchOk(url)).json();
const getText = async (url) => (await fetchOk(url)).text();
async function fetchOk(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  return r;
}

function setTexts() {
  document.documentElement.lang = lang;
  document.title = T().title;
  $('title').textContent = T().title;
  $('lang-label').textContent = T().langLabel;
  for (const l of ['ro', 'en']) $(`lang-${l}`).setAttribute('aria-pressed', String(l === lang));
  $('subtitle').textContent = T().subtitle;
  $('program-label').textContent = T().program;
  $('speed-label').textContent = T().speed;
  $('speed-epoca').textContent = T().speedEpoca;
  $('speed-rapid').textContent = T().speedRapid;
  $('reload').textContent = T().reload;
  $('explain').textContent = T().explain;
  $('tour-start').textContent = T().tourStart;
  $('tour-prev').textContent = T().tourPrev;
  $('tour-close').textContent = T().tourClose;
  $('tour-wait').textContent = T().tourWaiting;
  $('doc-link').textContent = T().docLink;
  $('doc-link').href = `doc.html?lang=${lang}`;
  $('explain-banner').textContent = T().explainOn;
  $('view-label').textContent = T().view;
  for (const o of $('view').options) o.textContent = T().views[o.value];
  $('hint').textContent = T().hint;
  $('reader-label').textContent = T().tapeReader;
  $('typewriter-label').textContent = T().typewriter;
  $('attribution').textContent = T().attribution;
  $('status').textContent = T().loading;
}

function provenanceLabel(machine, hasTape) {
  const el = $('provenance');
  el.textContent = '';
  const parts = machine.provenanceSummary();
  parts.forEach((p, i) => {
    if (i) el.append(' · ');
    const k = document.createElement('span');
    k.className = `kind kind-${p.kind}`;
    k.textContent = T().prov[p.kind] ?? p.kind;
    el.append(k, ` — ${p.source}: ${T().words(p.words)}`);
  });
  if (hasTape) el.append(` · ${T().tapeTest}`);
}

async function main() {
  setTexts();
  const [wasm, catalog, positions, colors, artL, artM, artR, tables, helpRo, helpEn] = await Promise.all([
    fetchOk('mecipt.wasm').then((r) => r.arrayBuffer()), getJson('programs/catalog.json'),
    getJson('data/positions.json'), getJson('data/lamp-colors.json'),
    getJson('data/art-left.json'), getJson('data/art-middle.json'), getJson('data/art-right.json'),
    getJson('data/core-tables.json'), getJson('data/help/ro.json'), getJson('data/help/en.json'),
  ]);
  const HELP = { ro: helpRo, en: helpEn };
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
  const LATCHING = /^switch-(M|RAI|pulses)-/;
  const setLever = (id, up) => {
    const el = $(id);
    if (!el) return;
    el.classList.toggle('up', up);
    el.classList.toggle('down', !up);
    if (LATCHING.test(id)) el.setAttribute('aria-pressed', String(up));
  };
  const labelSwitches = () => {
    for (const el of document.querySelectorAll('.switch')) el.setAttribute('aria-label', T().switchLabel(el.id));
  };
  labelSwitches();
  setLever('switch-pulses-0', false);
  $('switch-compute-0').classList.add('cue');   // îndrumarea arată butonul de pornire până la prima apăsare
  const showSwitchWord = (group, bits) => bits.forEach((v, i) => setLever(`switch-${group}-${i}`, v === 1));

  for (const p of catalog) {
    const o = document.createElement('option');
    o.value = p.id;
    o.textContent = lang === 'en' && p.title_en ? p.title_en : p.title;
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
    setLever('switch-pulses-0', false);
    describeProgram();
    $('status').textContent = T().idle;
  }
  function describeProgram() {
    if (!current) return;
    provenanceLabel(machine, !!current.tape);
    $('tape-info').textContent = current.tape ? `${T().tapeRows(tapeRows.length)} · ${T().tapeTest}` : T().tapeEmpty;
    for (const o of $('program').options) {
      const p = catalog.find((c) => c.id === o.value);
      o.textContent = lang === 'en' && p.title_en ? p.title_en : p.title;
    }
  }
  function setLang(l) {
    if (l !== 'ro' && l !== 'en') return;
    lang = l;
    saveLang(l, storage);
    setTexts();
    labelSwitches();
    describeProgram();
    $('status').textContent = '';
    for (const fn of langListeners) fn(l);
  }
  const langListeners = [];
  for (const l of ['ro', 'en']) $(`lang-${l}`).addEventListener('click', () => setLang(l));

  // ---- explicațiile ----
  let lastSnap = null, explaining = false;
  const help = new HelpPanel({
    panel: $('help-panel'), title: $('help-title'), status: $('help-status'), short: $('help-short'),
    value: $('help-value'), moreBtn: $('help-more-btn'), more: $('help-more'), close: $('help-close'),
  }, { render: renderMarkdown, onClose: () => document.body.classList.remove('help-open') });
  const valueOf = (id) => (lastSnap ? describeValue(id, lastSnap.state, {
    tables, wordValue: (w) => machine.wordValue(w), uopIndex, uops: lastSnap.uops, lang,
    mode: runner.mode, pulsesOff: runner.pulsesOff,
    uopName: (i) => helpEn.uops[String(i)], opText: (c) => helpEn.ops[String(c)],
  }) : null);
  function explain(id, from = null) {
    help.show(id, HELP[lang], T(), valueOf(id), from);
    document.body.classList.add('help-open');   // pe ecrane late pagina se strânge, ca panoul să nu acopere pupitrul
  }
  function explainMode(on) {
    explaining = on;
    $('explain').setAttribute('aria-pressed', String(on));
    $('explain-banner').hidden = !on;
    document.body.classList.toggle('explaining', on);
  }
  $('explain').addEventListener('click', () => explainMode(!explaining));
  langListeners.push(() => { if (help.open) explain(help.target); });
  // ---- turul ghidat ----
  const tour = new Tour(HELP[lang].tour);
  let loadedFor = -1;
  function renderTour() {
    for (const el of document.querySelectorAll('.tour-target')) el.classList.remove('tour-target');
    const st = tour.step();
    $('tour-card').hidden = !st;
    if (!st) { loadedFor = -1; return; }
    setView(st.view);
    if (st.load && loadedFor !== tour.index) { loadedFor = tour.index; select(st.load); }
    const el = $(st.target);
    if (el) {
      el.classList.add('tour-target');
      if (el.scrollIntoView) el.scrollIntoView({ block: 'center', inline: 'nearest' });
    }
    $('tour-count').textContent = `${tour.index + 1} / ${tour.steps.length}`;
    $('tour-text').textContent = st.text;
    $('tour-wait').hidden = !st.waitFor;
    $('tour-prev').disabled = tour.index === 0;
    $('tour-next').disabled = !!st.waitFor;
    $('tour-next').textContent = tour.index + 1 === tour.steps.length ? T().tourDone : T().tourNext;
  }
  const tourEvent = (ev) => { if (tour.onEvent(ev)) renderTour(); };
  $('tour-start').addEventListener('click', () => { help.close(); tour.start(); renderTour(); });
  $('tour-next').addEventListener('click', () => { tour.next(); renderTour(); });
  $('tour-prev').addEventListener('click', () => { tour.prev(); renderTour(); });
  $('tour-close').addEventListener('click', () => { tour.stop(); renderTour(); });
  langListeners.push(() => { tour.steps = HELP[lang].tour; if (tour.active) renderTour(); });
  const tourApi = {
    start: () => { tour.start(); renderTour(); }, stop: () => { tour.stop(); renderTour(); },
    next: () => { tour.next(); renderTour(); }, step: () => tour.step(), get active() { return tour.active; },
  };

  const EXPLAINABLE = '.switch, .lamp, .knob, .meter, .decor[id], #tape, #sheet, #provenance, .panel-slot';

  function press(id) {
    if (id === 'switch-compute-0') $(id).classList.remove('cue');
    const a = actionFor(id, switches);
    if (id.startsWith('switch-M-')) showSwitchWord('M', switches.M);
    else if (id.startsWith('switch-RAI-')) showSwitchWord('RAI', switches.RAI);
    else if (id === 'switch-pulses-0') setLever(id, !runner.pulsesOff);
    else if (isMomentary(id)) { setLever(id, true); setTimeout(() => setLever(id, false), 150); }
    if (a) runner.enqueue(a);
    if (a && a.ui === 'automat') lastHalt = null;
  }
  document.addEventListener('click', (e) => {
    if (!e.target.closest || e.target.closest('#help-panel, header')) return;
    const el = e.target.closest(EXPLAINABLE);
    if (!el || !el.id) return;
    if (explaining) { explain(el.id, el); return; }
    if (el.classList.contains('switch')) { press(el.id); tourEvent({ type: 'click', id: el.id }); }
    else if (!el.classList.contains('panel-slot')) explain(el.id, el);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (explaining) explainMode(false);
      else if (help.open) help.close();
      else if (tour.active) { tour.stop(); renderTour(); }
      return;
    }
    const sw = e.target.closest && e.target.closest('.switch');
    if (!sw) return;
    if (e.key === '?') { e.preventDefault(); explain(sw.id, sw); return; }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (explaining) explain(sw.id, sw); else { press(sw.id); tourEvent({ type: 'click', id: sw.id }); }
    }
  });

  const setSpeed = (name) => {
    runner.clock.setSpeed(name);
    const r = document.querySelector(`input[name=speed][value=${name}]`);
    if (r) r.checked = true;
  };
  document.querySelectorAll('input[name=speed]').forEach((r) => r.addEventListener('change', () => setSpeed(r.value)));
  const setView = (name) => {
    $('panels').dataset.view = name;
    $('view').value = name;
  };
  $('view').addEventListener('change', () => setView($('view').value));
  $('program').addEventListener('change', () => select($('program').value));
  $('reload').addEventListener('click', () => select(current ? current.id : catalog[0].id));

  // Un cadru: acțiuni, mașină, becuri, bandă, coală. Bucla rAF îl cheamă la fiecare imagine;
  // testul de fum îl cheamă direct (în Chrome cu timp virtual rAF nu rulează).
  function advance(dt) {
    const snap = runner.frame(dt);
    lastSnap = snap;
    if (snap.typed) { sheet.add(snap.typed); tourEvent({ type: 'typed' }); }
    if (snap.halted !== null) { lastHalt = snap.halted; tourEvent({ type: 'halted' }); }
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
    const st = runner.pulsesOff ? T().pulsesOff
      : runner.mode === 'automat' ? T().running
        : lastHalt !== null && lastHalt !== HALT.OK ? T().halt[lastHalt] : T().idle;
    if ($('status').textContent !== st) $('status').textContent = st;   // anunțat doar la schimbare
    const t = `${T().machineTime}: ${machine.seconds().toFixed(1)} s`;
    if ($('machine-time').textContent !== t) $('machine-time').textContent = t;
    if (help.open) help.setValue(valueOf(help.target));
  }
  let last = null;
  function frame(now) {
    advance(last === null ? 16 : now - last);
    last = now;
    requestAnimationFrame(frame);
  }

  await select(catalog[0].id);
  requestAnimationFrame(frame);
  return { runner, select, setSpeed, setView, setLang, sheet, advance, explain, explainMode, closeHelp: () => help.close(), tour: tourApi };
}

const api = {};
api.ready = main().then((o) => Object.assign(api, o)).catch((e) => {
  $('status').textContent = T().loadError + e.message;
  throw e;
});
window.__pupitru = api;
