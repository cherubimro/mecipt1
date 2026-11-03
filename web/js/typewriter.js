// SPDX-License-Identifier: AGPL-3.0-or-later
// Coala mașinii de scris: modelul (pur) și desenul ei în elementul dat.

export class Sheet {
  constructor(cols = 72, keepLines = 200) {
    this.cols = cols;          // GHICIT: marginea mașinii de scris
    this.keep = keepLines;
    this.buf = [''];
    this.col = 0;
    this.version = 0;
  }
  add(text) {
    if (!text) return;
    for (const ch of Array.from(text)) {
      if (ch === '\n') { this.newline(); continue; }
      if (this.col >= this.cols) this.newline();
      this.buf[this.buf.length - 1] += ch;
      this.col++;
    }
    this.version++;
  }
  newline() {
    this.buf.push('');
    this.col = 0;
    if (this.buf.length > this.keep) this.buf.splice(0, this.buf.length - this.keep);
  }
  clear() { this.buf = ['']; this.col = 0; this.version++; }
  lines() { return this.buf.slice(); }
  cursor() { return { line: this.buf.length - 1, col: this.col }; }
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Hârtia iese din mașină: rândul curent jos, la carul mașinii; deasupra, rândurile tipărite.
export function renderSheet(el, sheet, visible = 16) {
  if (el.__ver === sheet.version) return;
  el.__ver = sheet.version;
  if (!el.__paper) {
    el.innerHTML = '<div class="sheet-paper"><pre class="sheet-text"></pre></div><div class="carriage"><span class="carriage-mark"></span></div>';
    el.__paper = el.querySelector('.sheet-text');
    el.__mark = el.querySelector('.carriage-mark');
  }
  const lines = sheet.lines().slice(-visible);
  while (lines.length < visible) lines.unshift('');
  el.__paper.innerHTML = lines.map(esc).join('\n');
  el.__mark.style.left = `calc(${sheet.cursor().col}ch + var(--sheet-pad, 1.5ch))`;
}
