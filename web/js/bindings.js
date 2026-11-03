// SPDX-License-Identifier: AGPL-3.0-or-later
// Legăturile pupitrului: starea mașinii → becuri; comutator → acțiune.
// Alegerile fără sursă sunt trecute în docs/semantica.md, secțiunea „Pupitrul web”.
import { OP } from './mecipt.js';

const bit = (v, k) => (v >>> k) & 1;

// k = rând·19 + coloană; coloanele 0–15 = grila ⎍, 16–18 = grila ⊔.
export function uopIndexForGrid(machine) {
  const idx = new Int8Array(57);
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 19; col++) {
      idx[row * 19 + col] = col < 16 ? machine.uopId(0, row + 1, col + 1) : machine.uopId(1, row + 1, col - 15);
    }
  }
  return idx;
}

export function lampTargets(snap, ui, uopIndex) {
  const s = snap.state;
  const t = new Map();
  const set = (g, arr) => arr.forEach((v, i) => t.set(`lamp-${g}-${i}`, v ? 1 : 0));
  const bitsMsbFirst = (v, n) => Array.from({ length: n }, (_, i) => bit(v, n - 1 - i));
  set('M', Array.from({ length: 31 }, (_, i) => bit(s.M, 30 - i)));
  set('RI', [...bitsMsbFirst(s.RI >>> 10, 5), ...bitsMsbFirst(s.RI & 0o1777, 10)]);
  set('R1', bitsMsbFirst(s.R1, 7));
  set('R2', bitsMsbFirst(s.R2, 7));
  set('RA', bitsMsbFirst(s.RA, 10));
  set('RAI', bitsMsbFirst(s.RAI, 10));
  set('instr', [s.phase === 1, s.phase === 2, 1, 0]);
  set('indicators', [s.dcr, s.hirtie, s.oprit]);
  set('overflow', [s.stopOnDcr, !s.stopOnDcr]);
  set('compute', [ui.mode === 'automat', ui.mode === 'unic']);
  set('pulses', [ui.pulsesOff, !ui.pulsesOff]);
  set('memory', [snap.memFlash.write, snap.memFlash.read]);
  set('uop', Array.from(uopIndex, (u) => u >= 0 && snap.uops[u] > 0));
  set('generator', [1, 0, 1, 0, 1, 0]);
  set('pilot', [0, 0, 0]);
  return t;
}

const COMMANDS = [OP.ANULEAZA_RAI, OP.ANULEAZA_M, OP.ANULEAZA_S, OP.RA_IN_RI, OP.M_IN_I, OP.M_IN_RI];

function word(bits) {
  let w = 0;
  for (let i = 0; i < bits.length; i++) w = w * 2 + bits[i];
  return w;
}

// switches = pârghiile persistente {M: Uint8Array(31), RAI: Uint8Array(10)}; pârghia sus = 1 (GHICIT).
export function actionFor(switchId, switches) {
  const m = /^switch-([A-Za-z0-9]+)-(\d+)$/.exec(switchId);
  if (!m) return null;
  const [, g, k] = m;
  const i = Number(k);
  switch (g) {
    case 'M':
      switches.M[i] ^= 1;
      return { op: OP.SWITCHES_M, arg: word(switches.M) };
    case 'RAI':
      switches.RAI[i] ^= 1;
      return { op: OP.SWITCHES_RAI, arg: word(switches.RAI) };
    case 'commands':
      return i < COMMANDS.length ? { op: COMMANDS[i], arg: 0 } : null;
    case 'instr':
      return i < 2 ? { op: OP.INSTRUCTIA, arg: i + 1 } : null;
    case 'memory':
      return { op: i === 0 ? OP.MEM_SCRIERE : OP.MEM_CITIRE, arg: 0 };
    case 'overflow':
      return { op: OP.DEPASIRE, arg: i === 0 ? 1 : 0 };
    case 'pulses':
      return { ui: 'toggle-pulses' };
    case 'compute':
      return { ui: i === 0 ? 'automat' : 'unic' };
    default:
      return null;
  }
}

const MOMENTARY = new Set(['commands', 'instr', 'memory', 'overflow', 'compute']);
export function isMomentary(switchId) {
  const m = /^switch-([A-Za-z0-9]+)-\d+$/.exec(switchId);
  return !!m && MOMENTARY.has(m[1]);
}
