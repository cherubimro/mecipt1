// SPDX-License-Identifier: AGPL-3.0-or-later
// Tamburul magnetic: faptele din surse și desenul lui (SVG). Pur: pagina pune desenul și îl mișcă la fiecare cadru.
// SIGUR (Farcaș 2005; Baltac 2011): 1024 de cuvinte de 31 de biți jur-împrejurul tamburului, 50 de rotații pe secundă;
// tamburul a venit din Ungaria (licența calculatorului sovietic M-3), o instalație „cât un dulăpaș”.
// GHICIT: cum arăta — nu s-a găsit nicio fotografie a lui. Desenul e un tambur de epocă, culcat, cu capetele pe o rampă.

export const DRUM = {
  words: 1024,
  bits: 31,
  revPerSec: 50,          // 1024 de timpi de cuvânt pe rotație (core/machine.h)
  drawnCycleMs: 1600,     // în desen rotația e încetinită: la 50 rot/s ochiul n-ar vedea decât o pată
};

export const TRACKS = DRUM.bits;   // câte o pistă (și un cap) pentru fiecare bit al cuvântului

const W = 1200, H = 170;
const X0 = 230, X1 = 950;          // corpul cilindrului
const Y0 = 52, Y1 = 150;
const RX = 16;                     // capacele (elipse)
const ROW = 12;                    // pasul celulelor magnetice pe circumferință (în desen)
const PERIOD = 5 * ROW;           // modelul celulelor se repetă după 5 rânduri: rotația desenată nu sare
const trackX = (i) => X0 + 34 + (i * (X1 - X0 - 68)) / (TRACKS - 1);

// Desenul, o singură dată. Clasele: surface (suprafața care se rotește), cells (celulele, deplasate cu faza),
// track (pistele), head (capetele), heads-glow (lumina capetelor când mașina citește sau scrie).
export function drumSvg() {
  let tracks = '', heads = '', cells = '';
  for (let i = 0; i < TRACKS; i++) {
    const x = trackX(i).toFixed(1);
    tracks += `<line class="track" x1="${x}" y1="${Y0}" x2="${x}" y2="${Y1}"/>`;
    heads += `<rect class="head" x="${(trackX(i) - 4).toFixed(1)}" y="30" width="8" height="14" rx="1"/>`;
    // celulele unei piste: semne scurte, într-un model care se repetă (bitii unor cuvinte oarecare)
    for (let r = 0; r <= Math.ceil((Y1 - Y0 + PERIOD) / ROW); r++) {
      if (((i * 7 + r * 3) % 5) < 2) continue;
      cells += `<rect x="${(trackX(i) - 3).toFixed(1)}" y="${Y0 - PERIOD + r * ROW}" width="6" height="3"/>`;
    }
  }
  return `<svg class="mag-drum-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img">
<defs>
<linearGradient id="drum-metal" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#3b3f42"/><stop offset="0.35" stop-color="#9aa0a3"/><stop offset="0.55" stop-color="#c8ccce"/>
<stop offset="1" stop-color="#2e3133"/></linearGradient>
<linearGradient id="drum-shade" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#000" stop-opacity="0.55"/><stop offset="0.45" stop-color="#000" stop-opacity="0"/>
<stop offset="1" stop-color="#000" stop-opacity="0.6"/></linearGradient>
<clipPath id="drum-clip"><rect x="${X0}" y="${Y0}" width="${X1 - X0}" height="${Y1 - Y0}"/></clipPath>
</defs>
<rect x="0" y="0" width="${W}" height="${H}" fill="#353a3c"/>
<rect x="150" y="${(Y0 + Y1) / 2 - 5}" width="${W - 300}" height="10" fill="#575d60"/>
<rect x="${X1 + 40}" y="${Y0 + 8}" width="70" height="${Y1 - Y0 - 16}" rx="4" fill="#4b5155" stroke="#262a2c"/>
<rect x="${X0}" y="${Y0}" width="${X1 - X0}" height="${Y1 - Y0}" fill="url(#drum-metal)"/>
<g class="surface" clip-path="url(#drum-clip)"><g class="cells" fill="#5a4a33" opacity="0.55">${cells}</g></g>
<g stroke="#2b2e30" stroke-width="1" opacity="0.5">${tracks}</g>
<rect x="${X0}" y="${Y0}" width="${X1 - X0}" height="${Y1 - Y0}" fill="url(#drum-shade)"/>
<ellipse cx="${X0}" cy="${(Y0 + Y1) / 2}" rx="${RX}" ry="${(Y1 - Y0) / 2}" fill="#6f7579" stroke="#25282a"/>
<ellipse cx="${X1}" cy="${(Y0 + Y1) / 2}" rx="${RX}" ry="${(Y1 - Y0) / 2}" fill="#7d8387" stroke="#25282a"/>
<rect x="${X0 + 10}" y="20" width="${X1 - X0 - 20}" height="12" rx="2" fill="#2a2d2f"/>
<g fill="#8b8f86" stroke="#1f2122">${heads}</g>
<g class="heads-glow" fill="#ffc35a" opacity="0">${heads.replaceAll('class="head"', 'class="head-light"')}</g>
</svg>`;
}

// Capetele lucrează când mașina a făcut ceva în cadru (orice instrucțiune sau comandă citește tamburul).
export function drumActive(snap) {
  return !!(snap && snap.uops && snap.uops.length > 0);
}

// Faza rotației desenate, în [0, 1): continuă în timp real (tamburul se învârte cât mașina e sub tensiune).
export function drumPhase(nowMs, { reducedMotion = false } = {}) {
  if (reducedMotion) return 0;
  return (((nowMs % DRUM.drawnCycleMs) + DRUM.drawnCycleMs) % DRUM.drawnCycleMs) / DRUM.drawnCycleMs;
}

// Deplasarea celulelor (în jos, ca suprafața văzută din față a unui tambur care se rotește) pentru o fază.
export const cellsOffset = (phase) => phase * PERIOD;
