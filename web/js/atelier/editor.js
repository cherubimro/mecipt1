// SPDX-License-Identifier: AGPL-3.0-or-later
// Editorul Atelierului: cuvintele de pe tambur în notația listingurilor din 1962 (adresă, cod 1 adresă 1,
// cod 2 adresă 2, în octal), cu mnemonicele Geier, cu valoarea ca fracție și cu proveniența.
import { PROV } from '../mecipt.js';

const oct = (v, n) => (v >>> 0).toString(8).padStart(n, '0');

export function formatWord(word, tables, wordValue, lang) {
  const w = word >>> 0;
  const c2 = (w >>> 25) & 31, c1 = (w >>> 20) & 31, a2 = (w >>> 10) & 1023, a1 = w & 1023;
  const mn = (c) => (tables.ops[c] ? tables.ops[c].mnemonic : `${oct(c, 2)}?`);
  const v = wordValue(w);
  const frac = (v < 0 ? '−' : '') + Math.abs(v).toFixed(6).replace('.', lang === 'en' ? '.' : ',');
  return {
    ins: `${mn(c1)} ${oct(a1, 4)}  ${mn(c2)} ${oct(a2, 4)}`,
    oct: `${oct(c1, 2)} ${oct(a1, 4)}  ${oct(c2, 2)} ${oct(a2, 4)}`,
    frac,
  };
}

// Adresele cu proveniență sau scrise de program, crescător.
export function rowsFor(machine) {
  const rows = [];
  for (let a = 0; a < 1024; a++) {
    const p = machine.provenance(a);
    const written = machine.written(a);
    if (p.kind === 'NONE' && !written) continue;
    rows.push({ addr: a, word: machine.peek(a), prov: PROV.indexOf(p.kind), source: p.source, written });
  }
  return rows;
}

export function provLabel(row, S) {
  if (row.prov === 5) return S.prov.MODIFICAT;
  if (row.written) return S.writtenByProgram;
  const name = S.prov[PROV[row.prov]] || '';
  return row.source ? `${name} — ${row.source}` : name;
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export class Editor {
  // cb = {onEdit(addr, text, word), onRemove(addr), onRevert(), onDownload(), onOpen(text)}
  constructor(el, { machine, tables, S, lang, ...cb }) {
    Object.assign(this, { el, machine, tables, S, lang, cb });
    this.editing = null;
    el.innerHTML = `<h2 class="at-title"></h2>
<div class="ed-tools">
  <label><span class="ed-newaddr-label"></span> <input class="ed-newaddr" inputmode="numeric" size="5" maxlength="4" pattern="[0-7]{1,4}"></label>
  <button type="button" class="ed-add"></button>
  <button type="button" class="ed-revert"></button>
  <button type="button" class="ed-download"></button>
  <label class="ed-open-label"><span class="ed-open-text"></span><input type="file" class="ed-open" accept=".mec,text/plain" hidden></label>
</div>
<p class="ed-hint"></p>
<p class="ed-addr-error row-error" hidden></p>
<ol class="ed-rows" data-help="atelier-editor"></ol>`;
    this.q = (c) => el.querySelector(c);
    this.q('.ed-add').addEventListener('click', () => this.addFromField());
    this.q('.ed-newaddr').addEventListener('keydown', (e) => { if (e.key === 'Enter') this.addFromField(); });
    this.q('.ed-revert').addEventListener('click', () => cb.onRevert && cb.onRevert());
    this.q('.ed-download').addEventListener('click', () => cb.onDownload && cb.onDownload());
    this.q('.ed-open').addEventListener('change', async (e) => {
      const f = e.target.files && e.target.files[0];
      if (f && cb.onOpen) cb.onOpen(await f.text());
      e.target.value = '';
    });
    this.q('.ed-rows').addEventListener('click', (e) => {
      if (document.body.classList.contains('explaining')) return;   // modul Explică: doar explicația
      const li = e.target.closest('li[data-addr]');
      if (li && !e.target.closest('.ed-edit')) this.edit(Number(li.dataset.addr));
    });
    this.setLang(lang, S);
  }

  setLang(lang, S) {
    this.lang = lang; this.S = S;
    const t = S.ed;
    this.q('.at-title').textContent = t.title;
    this.q('.ed-newaddr-label').textContent = t.newAddr;
    this.q('.ed-add').textContent = t.add;
    this.q('.ed-revert').textContent = t.revert;
    this.q('.ed-download').textContent = t.download;
    this.q('.ed-open-text').textContent = t.open;
    this.q('.ed-hint').textContent = t.hint;
    this.render();
  }

  rowHtml(r) {
    const f = formatWord(r.word, this.tables, (w) => this.machine.wordValue(w), this.lang);
    const kind = r.prov === 5 ? 'MODIFICAT' : r.written ? 'WRITTEN' : PROV[r.prov];
    return `<li data-addr="${r.addr}" data-help="atelier-row" class="ed-row kind-${kind}" tabindex="0">`
      + `<span class="ed-a">${oct(r.addr, 4)}</span><span class="ed-ins">${esc(f.ins)}</span>`
      + `<span class="ed-oct">${f.oct}</span><span class="ed-frac">= ${f.frac}</span>`
      + `<span class="ed-prov">${esc(provLabel(r, this.S))}</span></li>`;
  }

  render() {
    if (this.editing !== null) return;            // nu stricăm rândul pe care îl scrie vizitatorul
    const rows = rowsFor(this.machine);
    const list = this.q('.ed-rows');
    list.innerHTML = rows.length ? rows.map((r) => this.rowHtml(r)).join('') : `<li class="ed-empty">${esc(this.S.ed.empty)}</li>`;
  }

  focusAddr(addr) {
    const li = this.q(`li[data-addr="${addr}"]`);
    if (!li) return;
    li.scrollIntoView({ block: 'nearest' });
    li.classList.add('ed-flash');
    setTimeout(() => li.classList.remove('ed-flash'), 900);
  }

  addFromField() {
    const v = this.q('.ed-newaddr').value.trim();
    const err = this.q('.ed-addr-error');
    if (!/^[0-7]{1,4}$/.test(v) || parseInt(v, 8) > 0o1777) { err.textContent = this.S.ed.badAddr; err.hidden = false; return; }
    err.hidden = true;
    const addr = parseInt(v, 8);
    if (!this.q(`li[data-addr="${addr}"]`)) {
      const list = this.q('.ed-rows');
      const empty = list.querySelector('.ed-empty');
      if (empty) empty.remove();
      const li = document.createElement('li');
      li.dataset.addr = String(addr);
      li.className = 'ed-row';
      const after = [...list.querySelectorAll('li[data-addr]')].find((x) => Number(x.dataset.addr) > addr);
      list.insertBefore(li, after || null);
    }
    this.edit(addr, '');
  }

  edit(addr, initial) {
    if (this.editing !== null) this.cancel();
    const li = this.q(`li[data-addr="${addr}"]`);
    if (!li) return;
    this.editing = addr;
    const has = this.machine.provenance(addr).kind !== 'NONE' || this.machine.written(addr);
    const start = initial ?? (has ? formatWord(this.machine.peek(addr), this.tables, (w) => this.machine.wordValue(w), this.lang).ins : '');
    const t = this.S.ed;
    li.innerHTML = `<div class="ed-edit"><span class="ed-a">${oct(addr, 4)}</span>`
      + `<input class="ed-input" value="${esc(start)}" spellcheck="false" autocomplete="off" aria-label="${oct(addr, 4)}">`
      + `<button type="button" class="ed-save">${esc(t.save)}</button><button type="button" class="ed-cancel">${esc(t.cancel)}</button>`
      + (has ? `<button type="button" class="ed-remove">${esc(t.remove)}</button>` : '')
      + '<p class="row-error" hidden></p></div>';
    const input = li.querySelector('.ed-input');
    input.focus();
    input.select();
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); this.commit(); }
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); this.cancel(); }
    });
    li.querySelector('.ed-save').addEventListener('click', () => this.commit());
    li.querySelector('.ed-cancel').addEventListener('click', () => this.cancel());
    const rm = li.querySelector('.ed-remove');
    if (rm) rm.addEventListener('click', () => { const a = this.editing; this.editing = null; this.cb.onRemove(a); this.render(); });
  }

  commit() {
    const addr = this.editing;
    const li = this.q(`li[data-addr="${addr}"]`);
    const text = li.querySelector('.ed-input').value.trim();
    const r = this.machine.assemble(text);
    const err = li.querySelector('.row-error');
    if (r.error) { err.textContent = r.error; err.hidden = false; return false; }   // tamburul nu se atinge
    this.editing = null;
    this.cb.onEdit(addr, text, r.word);
    return true;
  }

  cancel() { this.editing = null; this.render(); }
}
