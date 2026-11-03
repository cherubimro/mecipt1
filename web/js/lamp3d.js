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
