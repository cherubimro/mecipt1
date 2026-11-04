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
