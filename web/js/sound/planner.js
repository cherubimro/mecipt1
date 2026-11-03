// SPDX-License-Identifier: AGPL-3.0-or-later
// Planificatorul sunetului: din ce a făcut mașina într-un cadru (rânduri citite, caractere tipărite)
// → evenimente sonore așezate în timp și starea bâzâitului. Pur: nu atinge Web Audio.
import { MAX_FRAME_MS } from '../clock.js';

export const BUZZ_ON = 40;              // evenimente pe secundă reală peste care clicurile devin bâzâit
export const BUZZ_OFF = 25;             // sub care bâzâitul se oprește (histerezis)
export const RATE_TAU_MS = 100;         // constanta de timp a ritmului măsurat
export const MAX_CLICKS_PER_FRAME = 8;  // un cadru lung (tab reluat) nu dă rafală
export const LOOKAHEAD_S = 0.05;        // evenimentele se programează puțin în viitor

class Source {
  constructor() { this.rate = 0; this.buzz = false; }
  reset() { this.rate = 0; this.buzz = false; }
  update(n, dtMs) {
    this.rate += (n / (dtMs / 1000) - this.rate) * (1 - Math.exp(-dtMs / RATE_TAU_MS));
    if (!this.buzz && this.rate > BUZZ_ON) this.buzz = true;
    else if (this.buzz && this.rate < BUZZ_OFF) this.buzz = false;
  }
}

export class Planner {
  constructor() {
    this.tape = new Source();
    this.type = new Source();
    this.lastPos = null;
  }

  reset() {
    this.tape.reset();
    this.type.reset();
    this.lastPos = null;
  }

  frame({ t, dtMs, tapePos, typed }) {
    const dt = Math.min(Math.max(dtMs, 1), MAX_FRAME_MS);
    let rows = 0;
    if (this.lastPos === null || tapePos < this.lastPos) this.tape.reset();   // bandă nouă / program reîncărcat
    else rows = tapePos - this.lastPos;
    this.lastPos = tapePos;

    const chars = typed ? Array.from(typed) : [];
    this.tape.update(rows, dt);
    this.type.update(chars.length, dt);

    // fiecare sursă își întinde evenimentele uniform peste durata cadrului
    const spread = (kinds) => {
      const keep = kinds.slice(-MAX_CLICKS_PER_FRAME);
      return keep.map((kind, i) => ({ t: t + LOOKAHEAD_S + (dt / 1000) * (i / keep.length), kind }));
    };
    const events = [
      ...(this.tape.buzz ? [] : spread(Array(rows).fill('tape'))),
      ...(this.type.buzz ? [] : spread(chars.map((ch) => (ch === '\n' ? 'carriage' : 'key')))),
    ];
    return { events, buzz: { tape: this.tape.buzz, type: this.type.buzz } };
  }
}
