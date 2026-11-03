// SPDX-License-Identifier: AGPL-3.0-or-later
// Sunetul în pagină: butonul 🔊/🔇, alegerea ținută minte, deblocarea la primul gest,
// legătura cu bucla de cadre (bandă, mașina de scris) și cu comenzile pupitrului.
import { Planner } from './planner.js';
import { SoundEngine } from './engine.js';
import { isMomentary } from '../bindings.js';

const KEY = 'mecipt.sound';

export function pickSound(storage) {
  try { return !(storage && storage.getItem(KEY) === 'off'); } catch { return true; }   // stocare blocată: pornit
}
export function saveSound(on, storage) {
  try { if (storage) storage.setItem(KEY, on ? 'on' : 'off'); } catch { /* nu se poate ține minte: nu e grav */ }
}

// Butoanele cu revenire fac clicul lor; comutatoarele care rămân (M, RAI, IMPULSURI) — al pârghiei.
export const clickKind = (switchId) => (isMomentary(switchId) ? 'button' : 'lever');

export function setupSound({ button, storage, T, engine = new SoundEngine(), doc = document,
  supported = !!(globalThis.AudioContext || globalThis.webkitAudioContext) }) {
  const planner = new Planner();
  let on = pickSound(storage);
  let unlocked = false;

  const render = () => {
    const S = T().sound;
    const usable = supported && !(unlocked && !engine.available);
    const shownOn = on && usable;
    button.disabled = !usable;
    button.setAttribute('aria-pressed', String(shownOn));
    button.innerHTML = `<span aria-hidden="true">${shownOn ? '🔊' : '🔇'}</span>`;
    const label = usable ? (on ? S.on : S.off) : S.unavailable;
    button.setAttribute('aria-label', label);
    button.title = label;
  };

  const unlock = () => {
    if (unlocked) return;
    unlocked = true;
    engine.setEnabled(on);
    engine.setHidden(!!doc.hidden);
    engine.unlock();
    render();
  };
  // Regula browserelor: contextul audio pornește doar dintr-un gest. Faza de captură: înaintea oricărui clic.
  for (const ev of ['pointerdown', 'keydown']) doc.addEventListener(ev, unlock, { capture: true, once: true });
  doc.addEventListener('visibilitychange', () => engine.setHidden(!!doc.hidden));

  const toggle = () => {
    unlock();
    on = !on;
    saveSound(on, storage);
    engine.setEnabled(on);
    if (!on) engine.buzz({ tape: false, type: false });   // la repornire nu revine un bâzâit vechi
    render();
  };

  render();
  return {
    onFrame(snap, dtMs) {
      const r = planner.frame({ t: engine.now(), dtMs, tapePos: snap.tapePos, typed: snap.typed });
      if (!engine.available || !on) return;
      for (const e of r.events) engine.play(e.kind, e.t);
      engine.buzz(r.buzz);
    },
    control(switchId) { if (on) engine.play(clickKind(switchId)); },
    reset() { planner.reset(); engine.stopAll(); },
    setLang: render,
    toggle,
    get on() { return on; },
  };
}
