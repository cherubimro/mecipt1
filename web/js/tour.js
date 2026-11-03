// SPDX-License-Identifier: AGPL-3.0-or-later
// Turul ghidat: mașina de stări (pură) și cardul lui (DOM).
// Pas: { id, target, view, text, waitFor: null | 'typed' | 'halted' | 'click:<id>', load?: '<id program>' }

export class Tour {
  constructor(steps) {
    this.steps = steps;
    this.index = 0;
    this.active = false;
  }
  start() { this.index = 0; this.active = true; }
  stop() { this.active = false; }
  step() { return this.active ? this.steps[this.index] : null; }
  waiting() { const s = this.step(); return !!(s && s.waitFor); }
  // Un pas care așteaptă (de exemplu textul pe coală) trece singur mai departe; „Înainte” îl poate sări.
  next() {
    if (!this.active) return;
    this.advance();
  }
  prev() { if (this.active && this.index > 0) this.index--; }
  advance() {
    if (this.index + 1 >= this.steps.length) this.stop();
    else this.index++;
  }
  // Întoarce true dacă evenimentul a încheiat pasul care îl aștepta (turul trece mai departe singur).
  onEvent(ev) {
    const s = this.step();
    if (!s || !s.waitFor) return false;
    const hit = s.waitFor === ev.type || (ev.type === 'click' && s.waitFor === `click:${ev.id}`);
    if (hit) this.advance();
    return hit;
  }
}
