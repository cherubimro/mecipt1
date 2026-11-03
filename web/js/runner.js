// SPDX-License-Identifier: AGPL-3.0-or-later
// Bucla de cadre: aplică acțiunile pupitrului între instrucțiuni, rulează mașina cât îi dă ceasul
// și întoarce un instantaneu pentru becuri, bandă și mașina de scris.
import { HALT, OP } from './mecipt.js';
import { MAX_INSTR_PER_FRAME } from './clock.js';

export class Runner {
  constructor(machine, clock, { maxInstrPerFrame = MAX_INSTR_PER_FRAME } = {}) {
    this.machine = machine;
    this.clock = clock;
    this.maxInstrPerFrame = maxInstrPerFrame;
    this.queue = [];
    this.mode = 'idle';         // 'idle' | 'automat' | 'unic'
    this.pulsesOff = false;
  }

  enqueue(action) { this.queue.push(action); }

  load(programText, tapeText, startRai) {
    this.mode = 'idle';
    this.pulsesOff = false;
    this.queue = [];
    this.machine.loadProgram(programText);
    if (tapeText) this.machine.setTapeWords(tapeText);
    this.machine.console(OP.SWITCHES_RAI, startRai);
    this.clock.reset(this.machine.ticks());
  }

  frame(dtMs) {
    const m = this.machine;
    const memFlash = { write: false, read: false };
    let halted = null;
    const note = (h) => { if (h !== HALT.OK) { halted = h; this.mode = 'idle'; } };
    for (const a of this.queue.splice(0)) {
      if ('op' in a) {
        m.console(a.op, a.arg ?? 0);
        if (a.op === OP.MEM_SCRIERE) memFlash.write = true;
        if (a.op === OP.MEM_CITIRE) memFlash.read = true;
      } else if (a.ui === 'automat') {
        this.mode = 'automat';
        this.clock.reset(m.ticks());
      } else if (a.ui === 'unic') {
        this.mode = 'unic';
        if (!this.pulsesOff) {
          const h = m.step();
          if (h !== HALT.OK) halted = h;
        }
      } else if (a.ui === 'toggle-pulses') {
        this.pulsesOff = !this.pulsesOff;
        if (this.pulsesOff) {
          m.console(OP.OPRESTE);
          this.mode = 'idle';
        }
      }
    }
    if (this.mode === 'automat' && !this.pulsesOff) {
      note(m.run(this.clock.target(m.ticks(), dtMs), this.maxInstrPerFrame));
    }
    return {
      state: m.state(),
      uops: m.takeMicroops(),
      typed: m.takeTyped(),
      tapePos: m.tapePos(),
      halted,
      memFlash,
    };
  }
}
