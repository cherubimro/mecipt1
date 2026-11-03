// SPDX-License-Identifier: AGPL-3.0-or-later
// Pagina Atelierului: leagă editorul, tamburul, perforatorul și comenzile de mașina comună cu pupitrul.
// Modificările vizitatorului trec prin coada runner-ului (se aplică între instrucțiuni) și se țin minte pe program.
import { Edits, loadEdits, saveEdits } from './model.js';
import { Editor } from './editor.js';
import { DrumView } from './drum.js';
import { Punch, INEX_PRELOADER } from './punch.js';
import { PROV_MODIFICAT } from '../mecipt.js';

const $ = (id) => document.getElementById(id);
const oct4 = (a) => a.toString(8).padStart(4, '0');

// app = {machine, runner, tables, storage, T(), lang(), getText(url), select(id, opts), current(),
//        setStartRai(addr), setForeign(on), onTapeLoaded(), pulses(on)}
export function setupAtelier(app) {
  const { machine, runner, tables, storage } = app;
  let edits = new Edits(null, '');
  let dirty = true, sinceRefresh = 0;

  const persist = () => { if (edits.programId) saveEdits(storage, edits.programId, edits.toJSON()); };
  const showModified = () => { $('at-modified').hidden = !(edits.size > 0 && edits.programId && applied); };

  const editor = new Editor($('at-editor'), {
    machine, tables, S: app.T(), lang: app.lang(),
    onEdit(addr, text, word) {
      enter();                             // modificările salvate ajung pe tambur înaintea celei noi
      edits.set(addr, text, word);
      persist();
      runner.enqueue({ poke: { addr, word, prov: PROV_MODIFICAT } });
      dirty = true; showModified();
    },
    onRemove(addr) {
      enter();
      edits.remove(addr);
      persist();
      runner.enqueue({ clear: addr });
      dirty = true; showModified();
    },
    async onRevert() {
      const id = edits.programId || (app.current() && app.current().id);
      if (edits.programId) saveEdits(storage, edits.programId, {});
      edits = new Edits(edits.programId, edits.original);
      app.setForeign(false);
      await app.select(id && id !== 'vizitator' ? id : null, { original: true });
    },
    onDownload() {
      const date = new Date().toISOString().slice(0, 10);
      const blob = new Blob([edits.toMec(date)], { type: 'text/plain;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${edits.programId || 'program'}-modificat.mec`;
      document.body.append(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    },
    async onOpen(text) {
      const texts = new Map();
      for (const p of app.catalog) texts.set(p.id, await app.getText(`programs/${p.file}`));
      const r = Edits.fromMec(text, (id) => texts.get(id) ?? null, machine);
      if (r.error) { editor.notice(app.T().openError(r.error)); return; }
      editor.notice('');
      if (r.foreign) {
        await app.select(null, { original: true, empty: true });
        app.setForeign(true);
      } else {
        await app.select(r.programId, { original: true });
      }
      edits = r.edits;
      edits.applyTo(machine);
      applied = true;
      persist();
      dirty = true; showModified();
      app.describe();
    },
  });

  const drum = new DrumView($('at-drum'), {
    S: app.T(),
    onPick(addr) {
      if (document.querySelector(`#at-editor li[data-addr="${addr}"]`)) editor.focusAddr(addr);
      else { document.querySelector('#at-editor .ed-newaddr').value = oct4(addr); editor.addFromField(); }
    },
  });

  const punch = new Punch($('at-punch'), {
    machine, S: app.T(),
    onLoadTape(rows) {
      machine.setTapeRows(rows);
      machine.setVisitorTape(true);        // GHICIT: ce scrie programul de pe banda vizitatorului e MODIFICAT
      app.onTapeLoaded();
    },
    async onMergeInex() {
      machine.mergeProgram(await app.getText(INEX_PRELOADER));
      dirty = true;
      punch.refreshPlan();
      app.describe();
    },
  });

  // ---- comenzile ----
  $('at-reset').addEventListener('click', () => { runner.mode = 'idle'; machine.resetCpu(); dirty = true; });
  $('at-step').addEventListener('click', () => { app.pulses(true); runner.enqueue({ ui: 'unic' }); });
  $('at-run').addEventListener('click', () => { app.pulses(true); runner.enqueue({ ui: 'automat' }); });
  $('at-stop').addEventListener('click', () => app.pulses(false));
  $('at-start').addEventListener('change', () => {
    const v = $('at-start').value.trim();
    if (/^[0-7]{1,4}$/.test(v) && parseInt(v, 8) <= 0o1777) app.setStartRai(parseInt(v, 8));
  });
  $('at-revert-link').addEventListener('click', () => editor.cb.onRevert());

  function setLang() {
    const T = app.T();
    editor.setLang(app.lang(), T);
    drum.setLang(T);
    punch.setLang(T);
    for (const [id, key] of [['at-reset', 'reset'], ['at-step', 'step'], ['at-run', 'run'], ['at-stop', 'stop'], ['at-start-label', 'start'], ['at-modified-text', 'modified'], ['at-revert-link', 'revert']]) {
      $(id).textContent = T.at[key];
    }
  }

  // Modificările salvate ale programului curent stau în `edits`; `applied` spune dacă sunt și pe tambur.
  // Pupitrul încarcă originalul; Atelierul (și „Ambele”) pune modificările pe tambur.
  let applied = false;
  function afterLoad(program, programText, { original, inAtelier }) {
    const stored = program ? loadEdits(storage, program.id) : null;
    edits = stored ? Edits.fromStored(program.id, programText, stored, machine) : new Edits(program ? program.id : null, programText);
    applied = false;
    if (!original && inAtelier) enter();
    $('at-start').value = program ? program.start : '0000';
    dirty = true; showModified();
  }
  function enter() {
    if (applied) return;
    applied = true;
    for (const e of edits.entries()) {
      runner.enqueue(e.removed ? { clear: e.addr } : { poke: { addr: e.addr, word: e.word, prov: PROV_MODIFICAT } });
    }
    dirty = true; showModified();
  }

  function onFrame(snap, dt, visible) {
    if (!visible) return;
    const running = runner.mode === 'automat' && !runner.pulsesOff;
    drum.highlight(snap.state.RAI, running, dt);
    sinceRefresh += dt;
    if (dirty || (running && sinceRefresh >= 250)) {
      if (dirty) app.describe();          // eticheta de proveniență din bară
      drum.render(machine);
      editor.render();
      punch.refreshPlan();
      dirty = false; sinceRefresh = 0;
    }
  }

  setLang();
  return {
    editor, drum, punch, setLang, afterLoad, enter, onFrame,
    markDirty() { dirty = true; },
    removedCount() { return applied ? edits.entries().filter((e) => e.removed).length : 0; },
    get edits() { return edits; },
  };
}
