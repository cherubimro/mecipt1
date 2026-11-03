// SPDX-License-Identifier: AGPL-3.0-or-later
// Cititorul de bandă perforată: modelul ferestrei (pur) și desenul ei (SVG în elementul dat).
// Canalul 1 = bitul cel mai semnificativ al rândului (GHICIT). Așezarea canalelor pe bandă:
// 1 · 2 · ghidaj · 3 · 4 · 5 (DEDUS din banda telex: ghidajul are 2 canale pe o parte și 3 pe cealaltă).

export function tapeWindow(rows, pos, before = 8, after = 24) {
  const out = [];
  for (let i = pos - before; i < pos + after; i++) {
    if (i < 0 || i >= rows.length) { out.push(null); continue; }
    const v = rows[i];
    out.push({ index: i, holes: [4, 3, 2, 1, 0].map((b) => ((v >> b) & 1) === 1), read: i < pos });
  }
  return out;
}

const PITCH = 22;          // distanța dintre rânduri (px de desen)
const BEFORE = 14, AFTER = 26;
const W = (BEFORE + AFTER) * PITCH;
const HEAD_X = BEFORE * PITCH;
const LANES = [22, 44, null, 82, 104, 126];   // y-ul canalelor 1, 2, ghidaj, 3, 4, 5
const GUIDE_Y = 63;

// smoothPos: poziția interpolată (fracționară) pentru alunecarea continuă a benzii.
export function renderTape(el, rows, pos, smoothPos = pos) {
  if (!el.__tape) {
    el.innerHTML = `<svg class="tape-svg" viewBox="0 0 ${W} 150" preserveAspectRatio="xMidYMid meet" role="img">
<rect x="0" y="0" width="${W}" height="150" fill="#3b3d3c"/>
<rect x="0" y="6" width="${W}" height="138" fill="#2a2b2a"/>
<g class="strip"></g>
<rect class="reader-window" x="${HEAD_X - 16}" y="0" width="32" height="150" fill="none" stroke="#c9cbc6" stroke-width="3"/>
<line x1="${HEAD_X}" y1="2" x2="${HEAD_X}" y2="148" stroke="#e8d36a" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.8"/>
</svg>`;
    el.__tape = el.querySelector('.strip');
  }
  const base = Math.floor(smoothPos);
  const frac = smoothPos - base;
  const win = tapeWindow(rows, base, BEFORE, AFTER + 1);
  let s = '';
  const first = win.findIndex((r) => r);
  let last = -1;
  win.forEach((r, k) => { if (r) last = k; });
  if (first >= 0) {
    const x0 = (first - frac) * PITCH, x1 = (last + 1 - frac) * PITCH;
    s += `<rect x="${x0}" y="8" width="${x1 - x0}" height="134" fill="#eee5c6"/>`;
  }
  win.forEach((r, k) => {
    if (!r) return;
    const x = (k - frac) * PITCH + PITCH / 2;
    s += `<circle cx="${x}" cy="${GUIDE_Y}" r="3.5" fill="#2a2b2a"/>`;
    r.holes.forEach((h, c) => {
      const y = LANES[c < 2 ? c : c + 1];
      if (h) s += `<circle cx="${x}" cy="${y}" r="7" fill="#2a2b2a"/>`;
    });
  });
  el.__tape.innerHTML = s;
}
