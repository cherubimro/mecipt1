// SPDX-License-Identifier: AGPL-3.0-or-later
// Pagina pupitrului: leagă mașina (WASM), bucla de cadre, panourile, banda și mașina de scris.
import { loadMecipt, HALT, OP } from './mecipt.js';
import { setupAtelier } from './atelier/page.js';
import { Clock } from './clock.js';
import { Runner } from './runner.js';
import { renderPanel, cueArrow } from './panel.js';
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
import { formatWord, rowsFor, provLabel } from './atelier/editor.js';
import { setupSound } from './sound/page.js';
import { catalogNote } from './catalog.js';
import { drumSvg, drumPhase, seams, drawDrumMap } from './drum.js';
import { cellKind } from './atelier/drum.js';
import { createView3D } from './view3d.js';
import { ZONES3D } from './lamp3d.js';

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
  for (const m of ['console', 'atelier', 'both']) $(`mode-${m}`).textContent = T().modes[m];
  $('mode-label').textContent = T().modes.label;
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
  $('drum-label').textContent = T().drumLabel;
  $('drum-info').textContent = T().drumInfo;
  $('drum-map').setAttribute('aria-label', T().drumMapLabel);
  $('drum-map-fig').dataset.help = 'drum-map';
  $('attribution').textContent = T().attribution;
  $('status').textContent = T().loading;
}

function provenanceLabel(machine, tapeSource, foreign, removed, prog) {
  const el = $('provenance');
  el.textContent = '';
  if (foreign) el.append(`${T().foreignFile} · `);
  const parts = machine.provenanceSummary();
  parts.forEach((p, i) => {
    if (i) el.append(' · ');
    const k = document.createElement('span');
    k.className = `kind kind-${p.kind}`;
    if (p.kind === 'MODIFICAT') k.dataset.help = 'prov-modificat';
    k.textContent = T().prov[p.kind] ?? p.kind;
    const src = p.kind === 'MODIFICAT' ? T().modifiedBy : p.source;
    el.append(k, ` — ${src}: ${T().words(p.words)}`);
  });
  if (removed) {
    const k = document.createElement('span');
    k.className = 'kind kind-MODIFICAT';
    k.dataset.help = 'prov-modificat';
    k.textContent = T().prov.MODIFICAT;
    el.append(' · ', k, ` — ${T().removedBy(removed)}`);
  }
  if (tapeSource === 'catalog') el.append(` · ${catalogNote(prog, 'tape_note', lang) ?? T().tapeTest}`);
  if (tapeSource === 'visitor') el.append(` · ${T().visitorTape}`);
  const note = catalogNote(prog, 'note', lang);
  if (note && !foreign) el.append(` · ${note}`);
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
  const sound = setupSound({ button: $('sound'), storage, T });
  $('sound').addEventListener('click', () => sound.toggle());
  $('at-reset').addEventListener('click', () => sound.reset());   // Reset din Atelier: tac clicurile programate
  const uopIndex = uopIndexForGrid(machine);
  const sheet = new Sheet();

  $('panel-left').innerHTML = renderPanel('left', artL, positions, colors);
  $('panel-middle').innerHTML = renderPanel('middle', artM, positions, colors);
  $('panel-right').innerHTML = renderPanel('right', artR, positions, colors);
  // tamburul: desenat o dată (după fotografia din 2015); la fiecare cadru oțelul se rotește, în timp real
  $('drum').innerHTML = drumSvg();
  const drumSeams = [...$('drum').querySelectorAll('.seam')];
  // harta tamburului: redesenată de câteva ori pe secundă (1024 de cuvinte citite din nucleu)
  const drumMap = $('drum-map'), drumKinds = new Array(1024).fill('EMPTY');
  let drumMapAge = Infinity, drumMapKey = '';
  const refreshDrumMap = (rai, running) => {
    let used = 0;
    for (let a = 0; a < 1024; a++) {
      const k = cellKind(machine.provCode(a), machine.written(a));
      drumKinds[a] = k;
      if (k !== 'EMPTY') used++;
    }
    const mark = running ? rai : -1, key = drumKinds.join() + mark;
    if (key !== drumMapKey) {
      drumMapKey = key;
      const size = drumMap.width;
      drawDrumMap(drumMap.getContext('2d'), size, drumKinds, mark);
    }
    const legend = T().drumMap(used, running ? rai.toString(8).padStart(4, '0') : null);
    if ($('drum-map-legend').textContent !== legend) $('drum-map-legend').textContent = legend;
  };
  const reducedMotion = globalThis.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

  // becurile: elementul de lumină și strălucirea curentă
  const lamps = [...document.querySelectorAll('.lamp')].map((g) => ({ id: g.id, glow: g.querySelector('.glow'), b: 0, shown: -1 }));
  const switches = { M: new Uint8Array(31), RAI: new Uint8Array(10) };
  const LATCHING = /^switch-(M|RAI|pulses)-/;
  let view3d = null, v3state = 'off', show3d = false;   // vederea 3D (mai jos); manetele ei urmează setLever
  const setLever = (id, up) => {
    const el = $(id);
    if (!el) return;
    el.classList.toggle('up', up);
    el.classList.toggle('down', !up);
    if (LATCHING.test(id)) el.setAttribute('aria-pressed', String(up));
    if (view3d) view3d.setLever(id, up);       // maneta din modelul 3D urmează desenul
  };
  const labelSwitches = () => {
    for (const el of document.querySelectorAll('.switch')) el.setAttribute('aria-label', T().switchLabel(el.id));
    const cueLabel = document.querySelector('#cue-arrow .cue-label');   // săgeata de pornire, în limba aleasă
    if (cueLabel) cueLabel.textContent = T().cuePress;
  };
  labelSwitches();
  setLever('switch-pulses-0', false);
  $('switch-compute-0').classList.add('cue');   // îndrumarea arată butonul de pornire până la prima apăsare
  // și o săgeată care pulsează spre el, mare cât să se vadă și pe tot pupitrul
  const [cx, cy] = positions.right.compute.switches[0];
  $('panel-right').querySelector('svg').insertAdjacentHTML('beforeend', cueArrow(cx, cy, T().cuePress));
  const showSwitchWord = (group, bits) => bits.forEach((v, i) => setLever(`switch-${group}-${i}`, v === 1));

  for (const p of catalog) {
    const o = document.createElement('option');
    o.value = p.id;
    o.textContent = lang === 'en' && p.title_en ? p.title_en : p.title;
    $('program').append(o);
  }

  let current = null, tapeRows = new Uint8Array(0), smoothTape = 0, lastHalt = null, foreign = false;
  let tapeSource = null;          // 'catalog' | 'visitor' | null: ce bandă e în cititor
  let atelier = null, lastProvVersion = -1;
  // original: încarcă programul din catalog fără modificările vizitatorului (pupitrul, turul, „Revino la original”);
  // empty: tambur gol (fișier deschis care nu vine din catalog).
  async function select(id, { fromTour = false, original = false, empty = false } = {}) {
    sound.reset();
    if (!fromTour) loadedFor = -1;   // vizitatorul a ales alt program: pasul turului care încarcă se reface
    let p, text, tape;
    if (empty) {
      p = { id: 'vizitator', title: '', start: '0000', tape: null };
      text = ''; tape = null;
    } else {
      p = catalog.find((c) => c.id === id) ?? catalog[0];
      [text, tape] = await Promise.all([getText(`programs/${p.file}`), p.tape ? getText(`programs/${p.tape}`) : null]);
    }
    const start = parseInt(p.start, 8);
    runner.load(text, tape, start);
    current = p;
    foreign = false;
    tapeSource = tape ? 'catalog' : null;
    if (!empty) $('program').value = p.id;
    atelier.afterLoad(empty ? null : p, text, { original: original || fromTour || mode === 'console', inAtelier: mode !== 'console' });
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
    provenanceLabel(machine, tapeSource, foreign, atelier ? atelier.removedCount() : 0, current);
    $('tape-info').textContent = tapeSource === 'catalog' ? `${T().tapeRows(tapeRows.length)} · ${catalogNote(current, 'tape_note', lang) ?? T().tapeTest}`
      : tapeSource === 'visitor' ? `${T().tapeRows(tapeRows.length)} · ${T().visitorTape}` : T().tapeEmpty;
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
    sound.setLang();
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
  let helpEl = null;
  // Explicația unui cuvânt din Atelier: adresa, cuvântul în cele două citiri și proveniența.
  const atelierValue = (addr) => {
    const r = rowsFor(machine).find((x) => x.addr === addr) || { addr, word: machine.peek(addr), prov: 0, source: '', written: false };
    const f = formatWord(r.word, tables, (w) => machine.wordValue(w), lang);
    const label = r.prov === 0 && !r.written ? T().drum.empty : provLabel(r, T());
    return `${addr.toString(8).padStart(4, '0')} (${addr}): ${f.ins} · ${f.oct} · = ${f.frac} · ${label}`;
  };
  const valueOf = (id) => ((id === 'atelier-cell' || id === 'atelier-row') && helpEl && helpEl.dataset.addr
    ? atelierValue(Number(helpEl.dataset.addr)) : lastSnap ? describeValue(id, lastSnap.state, {
    tables, wordValue: (w) => machine.wordValue(w), uopIndex, uops: lastSnap.uops, lang,
    mode: runner.mode, pulsesOff: runner.pulsesOff,
    uopName: (i) => helpEn.uops[String(i)], opEffect: (c) => machine.opEffect(c),
    opText: (c) => (helpEn.ops_real && helpEn.ops_real[String(c)] && tables.ops[c] && machine.opEffect(c) !== tables.ops[c].effect_ro
      ? helpEn.ops_real[String(c)] : helpEn.ops[String(c)]),
  }) : null);
  function explain(id, from = null) {
    helpEl = from;
    // eticheta de sub alegerea programului: ajutorul programului încărcat, dacă are unul
    if (id === 'provenance' && current && !foreign && HELP[lang].entries[`program-${current.id}`]) id = `program-${current.id}`;
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
  let loadedFor = -1, tourLoading = null;
  // Chenarul pasului: un dreptunghi galben în jurul tuturor becurilor și comutatoarelor grupului.
  function frameGroup(g) {
    const sel = g === 'meters' ? '[id^="meter-"]'
      : `[id^="lamp-${g}-"], [id^="switch-${g}-"]${g === 'generator' ? ', #knob' : ''}`;
    const els = [...document.querySelectorAll(sel)];
    const svg = els.length && els[0].ownerSVGElement;
    if (!svg) return;
    const inv = svg.getScreenCTM().inverse();
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const el of els) {
      const r = el.getBoundingClientRect();
      for (const [px, py] of [[r.left, r.top], [r.right, r.bottom]]) {
        const p = new DOMPoint(px, py).matrixTransform(inv);
        x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y);
      }
    }
    const pad = 12;
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('class', 'tour-frame');
    for (const [k, v] of [['x', x0 - pad], ['y', y0 - pad], ['width', x1 - x0 + 2 * pad], ['height', y1 - y0 + 2 * pad], ['rx', 8]]) rect.setAttribute(k, v);
    svg.append(rect);
  }
  let viewBeforeTour = null;
  function renderTour() {
    for (const el of document.querySelectorAll('.tour-target')) el.classList.remove('tour-target');
    for (const el of document.querySelectorAll('.tour-frame')) el.remove();
    const st = tour.step();
    $('tour-card').hidden = !st;
    if (!st) {
      loadedFor = -1;
      if (viewBeforeTour !== null) { setView(viewBeforeTour); viewBeforeTour = null; }   // vederea dinainte de tur
      return;
    }
    if (viewBeforeTour === null) viewBeforeTour = $('panels').dataset.view;
    setView(st.view);
    if (st.group) frameGroup(st.group);
    // pasul încarcă un program: „Înainte” stă blocat până se termină încărcarea, ca un AUTOMAT apăsat
    // repede să nu fie oprit de încărcarea care vine după el
    let loading = false;
    if (st.load && loadedFor !== tour.index) {
      loadedFor = tour.index;
      loading = true;
      tourLoading = select(st.load, { fromTour: true }).finally(() => { tourLoading = null; if (tour.active) renderTour(); });
    }
    loading = loading || tourLoading !== null;
    const el = $(st.target);
    if (el) {
      el.classList.add('tour-target');
      if (el.scrollIntoView) el.scrollIntoView({ block: 'center', inline: 'nearest' });
    }
    $('tour-count').textContent = `${tour.index + 1} / ${tour.steps.length}`;
    $('tour-text').textContent = st.text;
    $('tour-wait').hidden = !st.waitFor;
    $('tour-wait').textContent = tourStuck ? T().tourStuck : T().tourWaiting;
    $('tour-prev').disabled = tour.index === 0;
    $('tour-next').disabled = loading;
    $('tour-next').textContent = tour.index + 1 === tour.steps.length ? T().tourDone : T().tourNext;
  }
  let tourStuck = false;
  const tourEvent = (ev) => {
    if (tour.onEvent(ev)) { tourStuck = false; renderTour(); return; }
    const st = tour.step();
    // pasul așteaptă text pe coală, dar mașina s-a oprit fără să scrie (alt program, altă adresă)
    if (st && st.waitFor === 'typed' && ev.type === 'halted' && !tourStuck) { tourStuck = true; renderTour(); }
  };
  const startTour = () => { set3D(false); help.close(); tour.start(); tourStuck = false; renderTour(); $('tour-card').focus(); };
  const stopTour = () => { tour.stop(); renderTour(); $('tour-start').focus(); };
  $('tour-start').addEventListener('click', startTour);
  $('tour-next').addEventListener('click', () => { tour.next(); tourStuck = false; renderTour(); if (!tour.active) $('tour-start').focus(); });
  $('tour-prev').addEventListener('click', () => { tour.prev(); tourStuck = false; renderTour(); });
  $('tour-close').addEventListener('click', stopTour);
  langListeners.push(() => { tour.steps = HELP[lang].tour; if (tour.active) renderTour(); });
  const tourApi = {
    start: startTour, stop: stopTour,
    next: () => { tour.next(); renderTour(); }, step: () => tour.step(), get active() { return tour.active; },
  };

  const EXPLAINABLE = '[data-help], .switch, .lamp, .knob, .meter, .decor[id], #drum, #tape, #sheet, #provenance, .panel-slot';

  function press(id) {
    sound.control(id);
    if (id === 'switch-compute-0') { $(id).classList.remove('cue'); $('cue-arrow')?.setAttribute('display', 'none'); }
    const a = actionFor(id, switches);
    if (id.startsWith('switch-M-')) showSwitchWord('M', switches.M);
    else if (id.startsWith('switch-RAI-')) showSwitchWord('RAI', switches.RAI);
    else if (id === 'switch-pulses-0') setLever(id, !runner.pulsesOff);
    else if (isMomentary(id)) { setLever(id, true); setTimeout(() => setLever(id, false), 150); }
    if (a) runner.enqueue(a);
    if (a && a.ui === 'automat') lastHalt = null;
  }
  // În modul Explică, un click pe un element al Atelierului îl explică și nu-l acționează (faza de captură,
  // înaintea ascultătorilor butoanelor).
  document.addEventListener('click', (e) => {
    if (!explaining || !e.target.closest) return;
    const el = e.target.closest('#atelier [data-help], #provenance [data-help], #provenance, #sound[data-help], #view-3d[data-help]');
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    explain(el.dataset.help || el.id, el);   // eticheta programului → ajutorul programului încărcat
  }, true);
  document.addEventListener('click', (e) => {
    if (!e.target.closest || e.target.closest('#help-panel, header')) return;
    const el = e.target.closest(EXPLAINABLE);
    if (!el) return;
    if (el.dataset.help) {                       // elementele Atelierului: explicate doar în modul Explică
      if (explaining) { e.preventDefault(); e.stopPropagation(); explain(el.dataset.help, el); }
      return;
    }
    if (!el.id) return;
    if (explaining) { explain(el.id, el); return; }
    if (el.classList.contains('switch')) { press(el.id); tourEvent({ type: 'click', id: el.id }); }
    else if (!el.classList.contains('panel-slot')) explain(el.id, el);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (explaining) explainMode(false);
      else if (help.open) help.close();
      else if (tour.active) stopTour();
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
  // ---- Atelierul și vederile ----
  atelier = setupAtelier({
    machine, runner, tables, storage, catalog, getText,
    T, lang: () => lang,
    select, current: () => current,
    describe: () => describeProgram(),
    setForeign(on) { foreign = on; describeProgram(); },
    setStartRai(addr) {
      for (let i = 0; i < 10; i++) switches.RAI[i] = (addr >> (9 - i)) & 1;
      showSwitchWord('RAI', switches.RAI);
      runner.enqueue({ op: OP.SWITCHES_RAI, arg: addr });
    },
    onTapeLoaded() {
      tapeRows = machine.tape();
      smoothTape = 0;
      tapeSource = 'visitor';
      describeProgram();
    },
    pulses(on) {
      if (on === runner.pulsesOff) { runner.enqueue({ ui: 'toggle-pulses' }); setLever('switch-pulses-0', !on); }
    },
  });
  langListeners.push(() => atelier.setLang());
  const MODES = ['console', 'atelier', 'both'];
  let mode = (() => { try { const v = storage && storage.getItem('mecipt.view'); return MODES.includes(v) ? v : 'console'; } catch { return 'console'; } })();
  function setMode(m) {
    if (!MODES.includes(m)) return;
    mode = m;
    document.body.dataset.mode = m;
    for (const x of MODES) $(`mode-${x}`).setAttribute('aria-pressed', String(x === m));
    try { if (storage) storage.setItem('mecipt.view', m); } catch { /* nu se ține minte */ }
    if (m !== 'console') atelier.enter();
    atelier.markDirty();
  }
  for (const x of MODES) $(`mode-${x}`).addEventListener('click', () => setMode(x));
  document.body.dataset.mode = mode;
  for (const x of MODES) $(`mode-${x}`).setAttribute('aria-pressed', String(x === mode));

  // vederea 3D: modelul se încarcă la prima cerere; becurile urmează aceeași strălucire ca în 2D
  const label3d = () => {
    const b = $('view-3d'), V = T().view3d;
    b.textContent = show3d ? '2D' : '3D';
    b.setAttribute('aria-pressed', String(show3d));
    b.setAttribute('aria-label', show3d ? V.to2d : V.to3d);
    b.title = show3d ? V.to2d : V.to3d;
    $('desk-3d-msg').textContent = v3state === 'loading' ? V.loading : v3state === 'unavailable' ? V.unavailable : V.note;
    $('zones3d').hidden = v3state !== 'ready';
  };
  const set3D = (on) => {
    show3d = on && v3state !== 'unavailable';
    $('desk-3d').hidden = !show3d;
    document.querySelector('#desk .frame').hidden = show3d;
    if (show3d && v3state === 'off') {
      v3state = 'loading';
      // un clic pe o manetă a modelului face exact ce face clicul pe comutatorul desenat (și în modul Explică)
      const onPick = (id) => {
        if (explaining) explain(id, null);
        else { press(id); tourEvent({ type: 'click', id }); }
      };
      createView3D($('desk-3d'), { positions, colors, onPick, onZone: markZone })
        .then((v) => {
          view3d = v; v3state = 'ready';
          for (const el of document.querySelectorAll('.switch')) v.setLever(el.id, el.classList.contains('up'));
          label3d();
        })
        .catch((e) => {
          console.warn('vederea 3D:', e);
          v3state = 'unavailable'; set3D(false);
          $('status').textContent = T().view3d.unavailable;
        });
    }
    label3d();
  };
  $('view-3d').addEventListener('click', () => { if (!explaining) set3D(!show3d); });
  // zonele camerei: butoane deasupra modelului; în modul Explică, explică vederea 3D
  for (const z of ZONES3D) {
    const b = document.createElement('button');
    b.type = 'button'; b.id = `zone3d-${z.id}`; b.dataset.zone = z.id;
    b.setAttribute('aria-pressed', String(z.id === 'all'));
    $('zones3d').append(b);
  }
  const labelZones = () => {
    $('zones3d').setAttribute('aria-label', T().zones3d.label);
    for (const b of $('zones3d').children) b.textContent = T().zones3d[b.dataset.zone];
  };
  function markZone(id) { for (const b of $('zones3d').children) b.setAttribute('aria-pressed', String(b.dataset.zone === id)); }
  $('zones3d').addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('button[data-zone]');
    if (!b) return;
    if (explaining) { explain('view3d', b); return; }
    if (view3d && view3d.focus(b.dataset.zone, { instant: reducedMotion.matches })) markZone(b.dataset.zone);
  });
  langListeners.push(labelZones);
  labelZones();

  // pe telefon, filele de jos: o atingere duce la partea mașinii (Atelierul și Pupitrul schimbă și vederea);
  // fila părții de pe ecran e marcată, oriunde ar ajunge vizitatorul derulând
  const TABS = [...$('phone-tabs').querySelectorAll('button')];
  const labelTabs = () => {
    $('phone-tabs').setAttribute('aria-label', T().tabs.label);
    for (const b of TABS) b.textContent = T().tabs[b.id.slice(4)];
  };
  const markTab = () => {
    let cur = TABS[0];
    for (const b of TABS) {
      const el = $(b.dataset.target);
      if (el && el.offsetParent !== null && el.getBoundingClientRect().top <= innerHeight * 0.4) cur = b;
    }
    for (const b of TABS) b.setAttribute('aria-current', String(b === cur));
  };
  $('phone-tabs').addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('button[data-target]');
    if (!b) return;
    if (b.id === 'tab-atelier' && mode === 'console') setMode('atelier');
    if (b.id === 'tab-desk' && mode === 'atelier') setMode('console');
    $(b.dataset.target).scrollIntoView({ block: 'start' });   // salt direct, ca la file
  });
  let tabFrame = 0;
  addEventListener('scroll', () => { if (!tabFrame) tabFrame = setTimeout(() => { tabFrame = 0; markTab(); }, 80); }, { passive: true });
  langListeners.push(labelTabs);
  labelTabs();
  markTab();
  langListeners.push(label3d);
  label3d();

  const setView = (name) => {
    $('panels').dataset.view = name;
    $('view').value = name;
  };
  $('view').addEventListener('change', () => setView($('view').value));
  // pe telefon pupitrul întreg ar fi prea mic: se pornește cu panoul drept (comenzile), mărit și derulabil
  // rama se derulează cât butonul de pornire, marcat de îndrumare, să stea la mijloc
  if (globalThis.matchMedia && matchMedia('(max-width: 760px)').matches) {
    setView('right');
    const fr = document.querySelector('.frame'), b = $('switch-compute-0').getBoundingClientRect(), f = fr.getBoundingClientRect();
    fr.scrollLeft += (b.left + b.width / 2) - (f.left + f.width / 2);
  }
  $('program').addEventListener('change', () => select($('program').value));
  $('reload').addEventListener('click', () => select(current ? current.id : catalog[0].id));

  // Un cadru: acțiuni, mașină, becuri, bandă, coală. Bucla rAF îl cheamă la fiecare imagine;
  // testul de fum îl cheamă direct (în Chrome cu timp virtual rAF nu rulează).
  function advance(dt) {
    const snap = runner.frame(dt);
    lastSnap = snap;
    sound.onFrame(snap, dt);
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
    const ph = drumPhase(performance.now(), { reducedMotion: reducedMotion.matches });
    seams(ph).forEach((s, i) => {
      const el = drumSeams[i];
      el.setAttribute('x', s.x.toFixed(2)); el.setAttribute('width', s.w.toFixed(2)); el.setAttribute('opacity', s.op.toFixed(3));
    });
    drumMapAge += dt;
    if (drumMapAge >= 250) { drumMapAge = 0; refreshDrumMap(snap.state.RAI, runner.mode === 'automat'); }
    const st = runner.pulsesOff ? T().pulsesOff
      : runner.mode === 'automat' ? T().running
        : lastHalt !== null && lastHalt !== HALT.OK ? T().halt[lastHalt] : T().idle;
    if ($('status').textContent !== st) $('status').textContent = st;   // anunțat doar la schimbare
    const t = `${T().machineTime}: ${machine.seconds().toFixed(1)} s`;
    if ($('machine-time').textContent !== t) $('machine-time').textContent = t;
    if (help.open) help.setValue(valueOf(help.target));
    // eticheta din bară urmează proveniența în orice vedere (MEMORIE SCRIERE, banda vizitatorului, editorul)
    const pv = machine.provVersion();
    if (pv !== lastProvVersion) { lastProvVersion = pv; describeProgram(); atelier.markDirty(); }
    atelier.onFrame(snap, dt, mode !== 'console');
    if (show3d && view3d) { view3d.setLamps(lamps.map((l) => [l.id, l.b])); view3d.render(); }
  }
  let last = null;
  function frame(now) {
    advance(last === null ? 16 : now - last);
    last = now;
    requestAnimationFrame(frame);
  }

  await select(catalog[0].id);
  requestAnimationFrame(frame);
  return { runner, select, setSpeed, setView, setLang, sheet, advance, explain, explainMode, closeHelp: () => help.close(), tour: tourApi,
    setMode, atelier, sound, set3D, view3d: () => view3d, view3dState: () => v3state };
}

const api = {};
api.ready = main().then((o) => Object.assign(api, o)).catch((e) => {
  $('status').textContent = T().loadError + e.message;
  throw e;
});
window.__pupitru = api;
