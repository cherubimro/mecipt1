// SPDX-License-Identifier: AGPL-3.0-or-later
// Legătura dintre becurile emulatorului și obiectele lor din modelul 3D (Sketchfab „MECIPT-1”, marius0198, CC BY 4.0).
// web/data/positions.json păstrează, pentru fiecare bec, numele obiectului din model (de ex. „M.lamps.0” → „LED”),
// așa cum l-a găsit tools/dae_layout.py; modelul glTF din web/model3d/ are aceleași nume. Pur: testat în Node.
import { LAMP_COLORS } from './panel.js';

// Map: id-ul becului din pagină („lamp-M-0”) → numele obiectului din model.
export function lampNodeMap(positions) {
  const map = new Map();
  for (const [key, node] of Object.entries(positions.objects || {})) {
    const m = /^(.+)\.lamps\.(\d+)$/.exec(key);
    if (m) map.set(`lamp-${m[1]}-${m[2]}`, node);
  }
  return map;
}

// Culoarea în care strălucește becul aprins: aceeași ca pe panourile desenate (alb, dacă nu e trecută).
export function lampEmissive(lampId, colors) {
  const m = /^lamp-(.+)-(\d+)$/.exec(lampId);
  const name = (m && colors[m[1]] && colors[m[1]][Number(m[2])]) || 'white';
  return (LAMP_COLORS[name] || LAMP_COLORS.white).on[1];
}

// Map: id-ul comutatorului din pagină („switch-compute-0”) → numele obiectului din model.
export function switchNodeMap(positions) {
  const map = new Map();
  for (const [key, node] of Object.entries(positions.objects || {})) {
    const m = /^(.+)\.switches\.(\d+)$/.exec(key);
    if (m) map.set(`switch-${m[1]}-${m[2]}`, node);
  }
  return map;
}

// Înclinarea manetei (radiani, în jurul axei x proprii, de-a lungul rândului). Un unghi pozitiv duce capătul
// manetei spre −y propriu. Pe panoul drept axa y proprie urcă pe panou (yUp), la generatorul din stânga coboară:
// semnul se alege după orientarea fiecărui obiect. Unghiul e ales după ochi.
export const LEVER_ANGLE = 0.38;
export const leverTilt = (up, yUp = true) => (up === yUp ? -LEVER_ANGLE : LEVER_ANGLE);

// Zonele camerei în 3D: grupurile de becuri și comutatoare spre care se apropie camera (după ideea unei colege:
// manetele sunt mici, iar o zonă le aduce aproape). panel = obiectul panoului, a cărui față dă direcția privirii.
export const ZONES3D = [
  { id: 'all' },
  { id: 'compute', panel: 'Right', groups: ['compute', 'overflow', 'memory', 'pulses', 'indicators'] },
  { id: 'commands', panel: 'Right', groups: ['commands', 'instr'] },
  { id: 'RAI', panel: 'Right', groups: ['RAI'] },
  { id: 'M', panel: 'Right', groups: ['M'] },
  { id: 'registers', panel: 'Right', groups: ['RI', 'R1', 'RA'] },
  { id: 'left', panel: 'Left', groups: ['uop', 'pilot', 'generator', 'R2'] },
  { id: 'meters', panel: 'Center', nodes: ['Center'] },
];

// Numele obiectelor din model care alcătuiesc zona (gol pentru „tot pupitrul” sau o zonă necunoscută).
export function zoneNodes(positions, zoneId) {
  const z = ZONES3D.find((x) => x.id === zoneId);
  if (!z || !(z.nodes || z.groups)) return [];
  if (z.nodes) return [...z.nodes];
  const out = [];
  for (const [key, node] of Object.entries(positions.objects || {})) {
    const m = /^(.+)\.(lamps|switches)\.\d+$/.exec(key);
    if (m && z.groups.includes(m[1])) out.push(node);
  }
  return out;
}

// Rama pupitrului e în model un singur obiect metalic („Metal_part”): ramele înguste de aluminiu, dar și raftul și
// fața din jurul panourilor, care pe pupitrul adevărat sunt vopsite în albastrul mobilei (fotografiile din muzeu).
// Le despărțim după lățimea fiecărui triunghi (înălțimea pe latura cea mai lungă, în coordonatele scenei):
// pos = vârfurile (x, y, z, …), idx = triunghiurile; întoarce 1 pentru fețele late, 0 pentru fâșii.
export function wideTriangles(pos, idx, minWidth) {
  const out = new Uint8Array(idx.length / 3);
  const v = (i, k) => pos[3 * idx[i] + k];
  for (let t = 0; t < out.length; t++) {
    const a = 3 * t, ab = [], bc = [], ca = [];
    for (let k = 0; k < 3; k++) { ab.push(v(a + 1, k) - v(a, k)); bc.push(v(a + 2, k) - v(a + 1, k)); ca.push(v(a, k) - v(a + 2, k)); }
    const cx = ab[1] * -ca[2] - ab[2] * -ca[1], cy = ab[2] * -ca[0] - ab[0] * -ca[2], cz = ab[0] * -ca[1] - ab[1] * -ca[0];
    const area2 = Math.hypot(cx, cy, cz);
    const longest = Math.max(Math.hypot(...ab), Math.hypot(...bc), Math.hypot(...ca));
    out[t] = longest > 0 && area2 / longest >= minWidth ? 1 : 0;
  }
  return out;
}

// Voltmetrele din mijloc. În model, acele celor patru voltmetre de sus pornesc de lângă marginea de jos a cadranului
// și ies peste el; în fotografia din muzeu (2020) fiecare ac pornește din butucul negru de sub centrul cadranului
// și arată în sus, spre stânga (al doilea, spre dreapta). angle = grade față de verticala cadranului (− = stânga).
export const NEEDLES = [
  { arrow: 'Arrow', dial: 'Afisaj', angle: -42 },
  { arrow: 'Arrow2', dial: 'Afisaj.001', angle: 32 },
  { arrow: 'Arrow3', dial: 'Afisaj.002', angle: -40 },
  { arrow: 'Arrow4', dial: 'Afisaj.003', angle: -36 },
];
// Al doilea voltmetru de pe rândul din mijloc lipsește în muzeu (a rămas doar inelul, Cadran.004); îl completăm
// cu fața vecinului de pe același rând (GHICIT: un voltmetru la fel ca vecinii lui).
export const MISSING_DIAL = { copy: 'Afisaj.005', from: 'Cadran.005', to: 'Cadran.004' };
