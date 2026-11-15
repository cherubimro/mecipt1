// SPDX-License-Identifier: AGPL-3.0-or-later
// Camera scenei: zonele pupitrului și socoteala care aduce o bucată de panou în mijlocul scenei.
// Nu atinge DOM-ul, ca să poată fi testată în Node. Regiunile sunt în unitățile viewBox-ului
// fiecărui panou (pixelii texturii de 2048×2048 din MECIPT-1_V4.dae), nu în pixeli de ecran.

// viewBox-urile panourilor (data/art-*.json)
export const VIEWBOX = {
  left: [0, 372, 2048, 1340],
  middle: [0, 0, 2600, 1340],
  right: [0, 372, 2048, 1340],
};

// Placa unui panou în blocul pupitrului, în pixeli (aceeași măsură ca `--plate-h` din css/ui.css).
export const PLATE_H = 262;
export const plateWidth = (panel) => (PLATE_H * VIEWBOX[panel][2]) / VIEWBOX[panel][3];
// Câți pixeli de ecran are o unitate de viewBox, la camera oprită.
export const unitPx = (panel) => plateWidth(panel) / VIEWBOX[panel][2];

// Zonele de pe ecran lat. `view` e vederea clasică pe care o lasă în urmă (select-ul „Vedere”).
export const ZONES = [
  { id: 'all', view: 'all' },
  { id: 'micro', view: 'all', panel: 'left', pages: [[60, 590, 2020, 1520]] },
  { id: 'meters', view: 'all', panel: 'middle', pages: [[0, 0, 2600, 1340]] },
  { id: 'registers', view: 'all', panel: 'right', pages: [[40, 590, 2010, 1225]] },
  { id: 'controls', view: 'all', panel: 'right', pages: [[500, 1040, 1780, 1500]] },
];

// Opririle camerei pe telefon. Registrele late sunt împărțite pe pagini de biți, ca între
// comutatoare să rămână cel puțin 44 px.
export const CHIPS = [
  { id: 'compute', view: 'right', panel: 'right', pages: [[1290, 1280, 1570, 1500]] },
  { id: 'commands', view: 'right', panel: 'right', pages: [[1153, 1030, 1746, 1205]] },
  // Paginile sunt strânse în jurul manetelor, atât cât trebuie ca pe un ecran de 375 px să rămână
  // cel puțin 44 px între două manete vecine (secțiunea 8 din îndrumarul de design). Distanțele de
  // pe panou nu sunt egale (sunt luate din fotografie), așa că fiecare pagină are măsura ei.
  { id: 'rai', view: 'right', panel: 'right', pageNames: ['rai512', 'rai16'],
    pages: [[247, 1055, 542, 1225], [541, 1055, 853, 1225]] },
  { id: 'M', view: 'right', panel: 'right', pageNames: ['m0', 'm8', 'm16', 'm24'],
    pages: [[99, 585, 569, 745], [591, 585, 1060, 745], [1081, 585, 1541, 745], [1552, 585, 1974, 745]] },
  { id: 'registers', view: 'right', panel: 'right', pages: [[60, 760, 2010, 1010]] },
  { id: 'meters', view: 'middle', panel: 'middle', pages: [[0, 0, 2600, 1340]] },
  { id: 'all', view: 'all' },
];

export const zoneById = (list, id) => list.find((z) => z.id === id) || list[0];
export const pageCount = (zone) => (zone && zone.pages ? zone.pages.length : 1);

// Regiunea unui panou (unități viewBox) → dreptunghi în pixelii scenei nemișcate.
// slot = {left, top, width, height}: locul plăcii panoului în blocul pupitrului.
export function regionRect(slot, panel, region) {
  const [vx, vy, vw, vh] = VIEWBOX[panel] || VIEWBOX.right;
  const kx = slot.width / vw, ky = slot.height / vh;
  const [x0, y0, x1, y1] = region;
  return {
    x0: slot.left + (Math.min(x0, x1) - vx) * kx,
    y0: slot.top + (Math.min(y0, y1) - vy) * ky,
    x1: slot.left + (Math.max(x0, x1) - vx) * kx,
    y1: slot.top + (Math.max(y0, y1) - vy) * ky,
  };
}

// Camera stă la (originX, 0) în scenă, cu transform-origin 0 0; întoarce transformarea care aduce
// mijlocul dreptunghiului în mijlocul casetei și îl încape în ea.
// rect, box = {x0, y0, x1, y1}; box e în pixeli de scenă.
export function fitCamera(rect, box, { originX = 0, maxScale = 12, minScale = 0.05 } = {}) {
  const w = Math.max(1, rect.x1 - rect.x0), h = Math.max(1, rect.y1 - rect.y0);
  const bw = Math.max(1, box.x1 - box.x0), bh = Math.max(1, box.y1 - box.y0);
  const scale = Math.max(minScale, Math.min(maxScale, Math.min(bw / w, bh / h)));
  const cx = (rect.x0 + rect.x1) / 2, cy = (rect.y0 + rect.y1) / 2;
  return {
    scale,
    x: (box.x0 + box.x1) / 2 - originX - scale * cx,
    y: (box.y0 + box.y1) / 2 - scale * cy,
  };
}

export const cameraTransform = (c) => `translate(${c.x.toFixed(1)}px, ${c.y.toFixed(1)}px) scale(${c.scale.toFixed(4)})`;

// Harta mică: ce parte din lățimea pupitrului se vede acum, în procente [0, 100].
export function miniWindow(camera, box, consoleWidth, originX = 0) {
  const left = (box.x0 - originX - camera.x) / camera.scale;
  const width = (box.x1 - box.x0) / camera.scale;
  const pct = (v) => Math.max(0, Math.min(100, (v / Math.max(1, consoleWidth)) * 100));
  const a = pct(left), b = pct(left + width);
  return { left: a, width: Math.max(4, b - a) };
}
