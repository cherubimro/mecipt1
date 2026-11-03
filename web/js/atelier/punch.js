// SPDX-License-Identifier: AGPL-3.0-or-later
// Perforatorul Atelierului: cuvinte (6 rânduri de 5 biți, m1–m5 primul) sau rânduri (valoarea citită de CIT),
// perforate cu gaura = 0, ca nucleul (mec_tape_encode_words). Încărcarea se face cu preîncărcătorul INEX-1.
import { renderTape } from '../tape.js';

const oct4 = (a) => a.toString(8).padStart(4, '0');
const meaningful = (line) => line.replace(/;.*$/, '').trim();

export function punchWords(text, machine) {
  const words = [];
  const signWarnings = [];
  const lines = String(text).split('\n');
  for (let i = 0; i < lines.length; i++) {
    const t = meaningful(lines[i]);
    if (!t) continue;
    const r = machine.assemble(t);
    if (r.error) return { rows: new Uint8Array(0), words: 0, signWarnings, error: { line: i + 1, message: r.error } };
    if (r.word >>> 30) signWarnings.push(i + 1);
    words.push(r.word);
  }
  // același format ca nucleul: 6 caractere de câte 5 biți (m1–m5 primul), perforate inversat
  const rows = new Uint8Array(words.length * 6);
  words.forEach((w, k) => { for (let c = 0; c < 6; c++) rows[k * 6 + c] = ~(w >>> (25 - 5 * c)) & 31; });
  return { rows, words: words.length, signWarnings };
}

export function punchRows(text) {
  const vals = String(text).split('\n').map(meaningful).join(' ').split(/\s+/).filter(Boolean);
  const rows = new Uint8Array(vals.length);
  for (let i = 0; i < vals.length; i++) {
    if (!/^[0-7]{1,2}$/.test(vals[i]) || parseInt(vals[i], 8) > 31) return { rows: new Uint8Array(0), error: { line: i + 1, message: vals[i] } };
    rows[i] = ~parseInt(vals[i], 8) & 31;      // vizitatorul scrie ce citește CIT; pe bandă, gaura = 0
  }
  return { rows };
}

export function punchRange(machine, from, to) {
  const out = [];
  for (let a = from; a <= to && a < 1024; a++) {
    const w = machine.peek(a);
    const c2 = (w >>> 25) & 31, c1 = (w >>> 20) & 31, a2 = (w >>> 10) & 1023, a1 = w & 1023;
    out.push(`${c1.toString(8).padStart(2, '0')} ${oct4(a1)}  ${c2.toString(8).padStart(2, '0')} ${oct4(a2)}`);
  }
  return out.join('\n');
}

// Unde scrie preîncărcătorul cuvintele: de la adresa instrucțiunii ME de la 0014 (adresa 1, m21–m30), crescător.
export function inexPlan(machine, words) {
  const start = machine.peek(0o14) & 0o1777;
  const end = start + Math.max(words, 1) - 1;
  return { start, end, overwritesPreloader: start <= 0o15 && end >= 0o10 };
}

export const INEX_PRELOADER = 'programs/inex1-preincarcator.mec';

export class Punch {
  // cb = {onLoadTape(rows), onMergeInex()}
  constructor(el, { machine, S, ...cb }) {
    Object.assign(this, { el, machine, S, cb });
    this.mode = 'words';
    this.result = null;
    el.innerHTML = `<h2 class="at-title"></h2>
<div class="pu-mode" role="group"><button type="button" data-mode="words" aria-pressed="true"></button><button type="button" data-mode="rows" aria-pressed="false"></button></div>
<p class="pu-hint"></p>
<textarea class="pu-text" rows="7" spellcheck="false"></textarea>
<div class="pu-range"><span class="pu-fromdrum"></span> <label><span class="pu-from-l"></span> <input class="pu-from" size="5" maxlength="4"></label> <label><span class="pu-to-l"></span> <input class="pu-to" size="5" maxlength="4"></label> <button type="button" class="pu-take">↓</button></div>
<div class="pu-buttons"><button type="button" class="pu-punch"></button><button type="button" class="pu-load" disabled></button></div>
<p class="pu-msg row-error" hidden></p>
<p class="pu-warn" hidden></p>
<div class="pu-tape tape" data-help="atelier-punch"></div>
<p class="pu-info"></p>
<hr>
<button type="button" class="pu-inex"></button>
<p class="pu-procedure"></p>
<p class="pu-where"></p>`;
    this.q = (c) => el.querySelector(c);
    for (const b of el.querySelectorAll('.pu-mode button')) b.addEventListener('click', () => this.setMode(b.dataset.mode));
    this.q('.pu-punch').addEventListener('click', () => this.punch());
    this.q('.pu-load').addEventListener('click', () => { if (this.result) { this.cb.onLoadTape(this.result.rows); this.q('.pu-info').textContent = `${this.S.punch.rows(this.result.rows.length)} · ${this.S.punch.loaded}`; } });
    this.q('.pu-inex').addEventListener('click', () => { this.cb.onMergeInex(); this.refreshPlan(); });
    this.q('.pu-take').addEventListener('click', () => {
      const f = parseInt(this.q('.pu-from').value, 8), t = parseInt(this.q('.pu-to').value, 8);
      if (f >= 0 && t >= f && t < 1024) { this.setMode('words'); this.q('.pu-text').value = punchRange(this.machine, f, t); }
    });
    this.setLang(S);
  }

  setLang(S) {
    this.S = S;
    const t = S.punch;
    this.q('.at-title').textContent = t.title;
    const [bw, br] = this.el.querySelectorAll('.pu-mode button');
    bw.textContent = t.modeWords; br.textContent = t.modeRows;
    this.q('.pu-hint').textContent = this.mode === 'words' ? t.wordsHint : t.rowsHint;
    this.q('.pu-fromdrum').textContent = t.fromDrum;
    this.q('.pu-from-l').textContent = t.from;
    this.q('.pu-to-l').textContent = t.to;
    this.q('.pu-punch').textContent = t.punch;
    this.q('.pu-load').textContent = t.load;
    this.q('.pu-inex').textContent = t.inex;
    this.q('.pu-procedure').textContent = t.procedure;
    this.refreshPlan();
  }

  setMode(mode) {
    this.mode = mode;
    for (const b of this.el.querySelectorAll('.pu-mode button')) b.setAttribute('aria-pressed', String(b.dataset.mode === mode));
    this.setLang(this.S);
  }

  punch() {
    const t = this.S.punch;
    const text = this.q('.pu-text').value;
    const r = this.mode === 'words' ? punchWords(text, this.machine) : punchRows(text);
    const msg = this.q('.pu-msg');
    if (r.error) {
      msg.textContent = t.error(r.error.line, r.error.message);
      msg.hidden = false;
      this.result = null;
      this.q('.pu-load').disabled = true;
      return r;
    }
    msg.hidden = true;
    this.result = r;
    const warn = this.q('.pu-warn');
    warn.hidden = !(r.signWarnings && r.signWarnings.length);
    if (!warn.hidden) warn.textContent = t.sign(r.signWarnings);
    renderTape(this.q('.pu-tape'), r.rows, 0, 0);
    this.q('.pu-info').textContent = t.rows(r.rows.length);
    this.q('.pu-load').disabled = r.rows.length === 0;
    this.refreshPlan();
    return r;
  }

  // Unde ar ajunge cuvintele benzii, după adresa din 0014 (doar dacă preîncărcătorul e pe tambur).
  refreshPlan() {
    const where = this.q('.pu-where');
    const hasInex = this.machine.provenance(0o10).kind !== 'NONE' && this.machine.provenance(0o14).kind !== 'NONE';
    if (!hasInex || !this.result || this.mode !== 'words' || !this.result.words) { where.textContent = ''; where.classList.remove('pu-danger'); return; }
    const p = inexPlan(this.machine, this.result.words);
    where.textContent = p.overwritesPreloader ? this.S.punch.overwrite : this.S.punch.inexWhere(oct4(p.start), oct4(p.end));
    where.classList.toggle('pu-danger', p.overwritesPreloader);
  }
}
