// SPDX-License-Identifier: AGPL-3.0-or-later
// Ceasul de tambur: timpul real al paginii → timpi de cuvânt ai mașinii (1024 × 50 pe secundă).
export const TICKS_PER_SECOND = 51200;
export const SPEEDS = { epoca: 1, rapid: 100 };
export const MAX_FRAME_MS = 250;        // un tab ascuns și reluat nu rulează minute de mașină dintr-odată
export const MAX_INSTR_PER_FRAME = 20000;

export class Clock {
  constructor(speed = 'epoca') {
    this.setSpeed(speed);
    this.t = 0;
  }
  setSpeed(name) {
    if (!(name in SPEEDS)) throw new Error(`viteză necunoscută: ${name}`);
    this.speed = name;
  }
  // Ținta crește cu timpul real (limitat); dacă mașina a trecut de ea, ținta nu scade.
  target(machineTicks, dtMs) {
    const dt = Math.min(Math.max(dtMs, 0), MAX_FRAME_MS);
    this.t += (dt * TICKS_PER_SECOND * SPEEDS[this.speed]) / 1000;
    return this.t;
  }
  // Aliniază ținta la mașină, ca să nu se adune „datorie” cât mașina stă.
  reset(machineTicks) { this.t = machineTicks; }
}
