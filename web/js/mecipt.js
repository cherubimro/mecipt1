// SPDX-License-Identifier: AGPL-3.0-or-later
// Învelișul JavaScript al nucleului C compilat în WebAssembly (core/api.h).
// Primește octeții .wasm (fără fetch), ca să meargă identic în Node și în browser.

export const HALT = { OK: 0, STOP: 1, DCR: 2, TAPE_JAM: 3, UNKNOWN: 4, MANUAL: 5 };
export const OP = {
  SWITCHES_M: 1, SWITCHES_RAI: 2, ANULEAZA_RAI: 3, ANULEAZA_M: 4, ANULEAZA_S: 5, RA_IN_RI: 6,
  M_IN_I: 7, M_IN_RI: 8, MEM_SCRIERE: 9, MEM_CITIRE: 10, INSTRUCTIA: 11, DEPASIRE: 12, OPRESTE: 13,
};
export const PROV = ['NONE', 'ORIGINAL', 'DEDUS', 'RECONSTRUCTIE', 'GHICIT', 'MODIFICAT'];
export const PROV_MODIFICAT = 5;
export const TICKS_PER_SECOND = 51200;
const NUOPS = 39;
const REGS = ['S', 'I', 'M', 'RI', 'RAI', 'RA', 'R1', 'R2', 'alpha', 'beta', 'gamma', 'phase',
  'dcr', 'oprit', 'hirtie', 'stopOnDcr'];
const ENOSYS = 52;

export async function loadMecipt(wasmBytes) {
  const bytes = wasmBytes instanceof Uint8Array ? wasmBytes : new Uint8Array(wasmBytes);
  const nosys = () => ENOSYS;
  const { instance } = await WebAssembly.instantiate(bytes, {
    wasi_snapshot_preview1: { fd_write: nosys, fd_seek: nosys, fd_close: nosys },
  });
  return new Machine(instance.exports);
}

export class Machine {
  constructor(exports) {
    this.exports = exports;
    this.encoder = new TextEncoder();
    this.decoder = new TextDecoder('utf-8');
    exports.api_init();
  }
  // Vederile se refac după fiecare apel: memoria WASM poate crește și le invalidează.
  u8() { return new Uint8Array(this.exports.memory.buffer); }
  cstr(ptr) {
    const mem = this.u8();
    let end = ptr;
    while (mem[end] !== 0) end++;
    return new TextDecoder('utf-8').decode(mem.subarray(ptr, end));
  }
  putBuf(bytes) {
    const size = this.exports.api_buf_size();
    if (bytes.length > size) throw new Error(`text prea lung (${bytes.length} > ${size} octeți)`);
    this.u8().set(bytes, this.exports.api_buf());
  }
  putText(text) {
    const b = this.encoder.encode(text);
    if (b.length + 1 > this.exports.api_buf_size()) throw new Error('text prea lung');
    const z = new Uint8Array(b.length + 1);
    z.set(b);
    this.putBuf(z);
  }
  loadProgram(text) {
    this.putText(text);
    if (this.exports.api_load_program() < 0) throw new Error(this.cstr(this.exports.api_error()));
    this.decoder = new TextDecoder('utf-8');
  }
  setTapeWords(text) {
    this.putText(text);
    const n = this.exports.api_set_tape_words();
    if (n < 0) throw new Error(this.cstr(this.exports.api_error()));
    return n;
  }
  setTapeRows(rows) {
    this.putBuf(rows);
    const n = this.exports.api_set_tape_rows(rows.length);
    if (n < 0) throw new Error('bandă invalidă');
    return n;
  }
  tape() {
    const n = this.exports.api_tape_len();
    const p = this.exports.api_tape();
    return this.u8().slice(p, p + n);
  }
  tapePos() { return this.exports.api_tape_pos(); }
  run(untilTicks, maxInstr) { return this.exports.api_run(untilTicks, maxInstr); }
  step() { return this.exports.api_step(); }
  ticks() { return this.exports.api_ticks(); }
  instructions() { return this.exports.api_instructions(); }
  seconds() { return this.ticks() / TICKS_PER_SECOND; }
  state() {
    const s = {};
    REGS.forEach((name, r) => { s[name] = this.exports.api_reg(r) >>> 0; });
    return s;
  }
  takeMicroops() {
    const p = this.exports.api_uops();
    const out = new Uint16Array(this.exports.memory.buffer.slice(p, p + 2 * NUOPS));
    this.exports.api_uops_clear();
    return out;
  }
  takeTyped() {
    const n = this.exports.api_typed_take();
    if (n === 0) return '';
    const p = this.exports.api_out();
    return this.decoder.decode(this.u8().slice(p, p + n), { stream: true });
  }
  console(op, arg = 0) {
    if (this.exports.api_console(op, arg | 0) < 0) throw new Error(`operație de pupitru necunoscută: ${op}`);
  }
  provenance(addr) {
    return { kind: PROV[this.exports.api_prov(addr)] ?? 'NONE', source: this.cstr(this.exports.api_prov_source(addr)) };
  }
  provenanceSummary() {
    const groups = new Map();
    for (let a = 0; a < 1024; a++) {
      const p = this.provenance(a);
      if (p.kind === 'NONE') continue;
      const key = p.kind + '\u0000' + p.source;
      const g = groups.get(key) ?? { kind: p.kind, source: p.source, words: 0 };
      g.words++;
      groups.set(key, g);
    }
    return [...groups.values()].sort((x, y) => y.words - x.words);
  }
  uopId(grid, row, col) { return this.exports.api_uop_id(grid, row, col); }
  wordValue(w) { return this.exports.api_word_value(w >>> 0); }
  opEffect(code) { return this.cstr(this.exports.api_op_effect(code)); }
  // ---- Atelierul: tamburul cuvânt cu cuvânt ----
  peek(addr) { return this.exports.api_peek(addr) >>> 0; }
  poke(addr, word, prov = PROV_MODIFICAT) { return this.exports.api_poke(addr, word >>> 0, prov) === 0; }
  clearWord(addr) { return this.exports.api_clear_word(addr) === 0; }
  written(addr) { return this.exports.api_written(addr) === 1; }
  // Partea de după adresă a unui rând .mec (`UI 0000 CU 0000`, `27 0000 30 0000`, `= 0,5`) → cuvântul, prin nucleu.
  assemble(text) {
    this.putText(String(text));
    if (this.exports.api_assemble() < 0) return { error: this.cstr(this.exports.api_error()) };
    return { word: this.exports.api_assembled() >>> 0 };
  }
  mergeProgram(text) {
    this.putText(text);
    if (this.exports.api_merge_program() < 0) throw new Error(this.cstr(this.exports.api_error()));
  }
  resetCpu() { this.exports.api_reset_cpu(); }
  provVersion() { return this.exports.api_prov_version() >>> 0; }
  // Un text .mec parsat de nucleu, fără să atingă mașina: {error} sau {words: Map(adresă → cuvânt)}.
  parseMec(text) {
    this.putText(text);
    if (this.exports.api_parse_only() < 0) return { error: this.cstr(this.exports.api_error()) };
    const words = new Map();
    for (let a = 0; a < 1024; a++) if (this.exports.api_parsed_prov(a) !== 0) words.set(a, this.exports.api_parsed_word(a) >>> 0);
    return { words };
  }
  setVisitorTape(on) { this.exports.api_set_visitor_tape(on ? 1 : 0); }
}
