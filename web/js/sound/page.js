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
  let pending = null;        // clicul comenzii apăsate cât contextul încă pornea

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

  // Regula browserelor: contextul audio pornește doar dintr-un gest. Pe telefon gestul valid e la ridicarea
  // degetului (pointerup / touchend / click), nu la apăsare; de aceea ascultăm toate și reîncercăm la fiecare gest
  // până când contextul rulează (și din nou dacă e întrerupt, de pildă de un apel). Faza de captură: înaintea clicului.
  const unlock = () => {
    if (!unlocked) {
      unlocked = true;
      engine.setEnabled(on);
      engine.setHidden(!!doc.hidden);
      engine.unlock();
      render();
    } else if (!engine.running) {
      engine.unlock();
    }
  };
  for (const ev of ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown']) doc.addEventListener(ev, unlock, { capture: true });
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
      if (!engine.running || !on) return;   // context suspendat: nimic nu se adună pentru mai târziu
      for (const e of r.events) engine.play(e.kind, e.t);
      engine.buzz(r.buzz);
    },
    control(switchId) {
      if (!on) return;
      const kind = clickKind(switchId);
      if (engine.running) { engine.play(kind); return; }
      if (!engine.available) return;
      // primul gest se aude și el, după ce contextul pornește; se păstrează doar ultimul clic, nu o coadă
      const first = pending === null;
      pending = kind;
      if (first) engine.whenRunning().then(() => { if (on && pending) engine.play(pending); pending = null; });
    },
    reset() { planner.reset(); engine.stopAll(); },
    setLang: render,
    toggle,
    get on() { return on; },
  };
}
