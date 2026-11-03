// SPDX-License-Identifier: AGPL-3.0-or-later
// Atelierul: programul din catalog + modificările vizitatorului (nu o fotografie a tamburului viu).
// Modificările se scriu pe tambur cu proveniența MODIFICAT; fișierul descărcat le păstrează în forma scrisă de vizitator.
import { PROV_MODIFICAT } from '../mecipt.js';

const oct4 = (a) => a.toString(8).padStart(4, '0');
const KEY = (id) => `mecipt.atelier.${id}`;

// Rândurile cu cuvinte ale unui text .mec: [{addr, rest}] (rest = ce urmează după adresă, fără comentariu).
function wordLines(text) {
  const out = [];
  for (const raw of String(text).split('\n')) {
    const line = raw.replace(/;.*$/, '').trim();
    const m = /^([0-7]{1,4})\s+(.+)$/.exec(line);
    if (m) out.push({ addr: parseInt(m[1], 8), rest: m[2].trim() });
  }
  return out;
}

// Cuvintele unui text .mec, parsate de nucleu: Map addr → word (sau {error}).
function wordsOf(text, machine) {
  const r = machine.parseMec(text);
  return r.error ? new Map() : r.words;
}

export class Edits {
  constructor(programId, originalText) {
    this.programId = programId;
    this.original = originalText || '';
    this.map = new Map();        // addr → {addr, text, word} sau {addr, removed: true}
  }
  set(addr, text, word) { this.map.set(addr, { addr, text, word: word >>> 0 }); }
  remove(addr) {
    const inOriginal = wordLines(this.original).some((l) => l.addr === addr);
    if (inOriginal) this.map.set(addr, { addr, removed: true });
    else this.map.delete(addr);
  }
  forget(addr) { this.map.delete(addr); }
  get size() { return this.map.size; }
  entries() { return [...this.map.values()].sort((a, b) => a.addr - b.addr); }
  toJSON() { return Object.fromEntries(this.entries().map((e) => [e.addr, e.removed ? null : e.text])); }

  applyTo(machine) {
    for (const e of this.entries()) {
      if (e.removed) machine.clearWord(e.addr);
      else machine.poke(e.addr, e.word, PROV_MODIFICAT);
    }
  }

  // Fișierul .mec: originalul neatins, fără rândurile modificate, apoi modificările sub @prov MODIFICAT.
  toMec(date) {
    const edited = new Set(this.map.keys());
    const lines = [`; mecipt-origin: ${this.programId || 'vizitator'}`,
      `; modificat în Atelierul emulatorului MECIPT-1, ${date}`, ''];
    for (const raw of this.original.split('\n')) {
      const m = /^([0-7]{4})\s/.exec(raw.replace(/;.*$/, '').trim());
      if (m && edited.has(parseInt(m[1], 8))) continue;
      lines.push(raw);
    }
    const kept = this.entries().filter((e) => !e.removed);
    if (kept.length) {
      lines.push('', '@prov MODIFICAT vizitator');
      for (const e of kept) lines.push(`${oct4(e.addr)}  ${e.text}`);
    }
    return lines.join('\n').replace(/\n*$/, '\n');
  }

  // Un fișier deschis nu e crezut pe cuvânt: cuvintele se compară cu programul din catalog.
  // Un fișier pe care nucleul nu-l acceptă e refuzat întreg ({error}), ca să nu se încarce pe jumătate.
  static fromMec(text, catalogFor, machine) {
    const parsed = machine.parseMec(text);
    if (parsed.error) return { error: parsed.error };
    const m = /^;\s*mecipt-origin:\s*(\S+)/m.exec(text);
    const id = m ? m[1] : null;
    const original = id ? catalogFor(id) : null;
    const foreign = original === null || original === undefined;
    const edits = new Edits(foreign ? null : id, foreign ? '' : original);
    const orig = foreign ? new Map() : wordsOf(original, machine);
    const forms = new Map(wordLines(text).map((l) => [l.addr, l.rest]));   // forma scrisă, pentru fișierul următor
    for (const [addr, word] of parsed.words) {
      if (!orig.has(addr) || orig.get(addr) !== word) edits.set(addr, forms.get(addr) || `= o${word.toString(8).padStart(11, '0')}`, word);
    }
    for (const addr of orig.keys()) if (!parsed.words.has(addr)) edits.remove(addr);
    return { programId: edits.programId, edits, foreign };
  }

  static fromStored(programId, originalText, stored, machine) {
    const e = new Edits(programId, originalText);
    for (const [k, text] of Object.entries(stored || {})) {
      const addr = Number(k);
      if (!(addr >= 0 && addr < 1024)) continue;
      if (text === null) { e.remove(addr); continue; }
      const r = machine.assemble(text);
      if (!r.error) e.set(addr, text, r.word);
    }
    return e;
  }
}

export function loadEdits(storage, programId) {
  try {
    const v = storage ? storage.getItem(KEY(programId)) : null;
    return v ? JSON.parse(v) : null;
  } catch { return null; }
}

export function saveEdits(storage, programId, edits) {
  try {
    if (!storage) return;
    if (!edits || Object.keys(edits).length === 0) storage.removeItem(KEY(programId));
    else storage.setItem(KEY(programId), JSON.stringify(edits));
  } catch { /* stocare blocată: Atelierul merge, doar nu ține minte */ }
}
