// SPDX-License-Identifier: AGPL-3.0-or-later
// Tamburul magnetic: faptele din surse și desenul lui (SVG). Pur: pagina pune desenul și îl mișcă la fiecare cadru.
// SIGUR (Farcaș 2005; Baltac 2011): 1024 de cuvinte de 31 de biți jur-împrejurul tamburului, 50 de rotații pe secundă;
// tamburul a venit din Ungaria (licența calculatorului sovietic M-3), o instalație „cât un dulăpaș”.
// Desenul: după fotografiile lui Turbojet (Muzeul Banatului, 2015, CC BY-SA 4.0) — tamburul vertical deasupra unui
// dulăpaș auriu, cu blocurile capetelor jur-împrejur, butucul și conul sus, ungătoarea de alamă, panoul crem cu
// becurile FŰTÉS (încălzire) și TÖRLÉS (ștergere), becul verde și comutatorul rotativ.

export const DRUM = {
  words: 1024,
  bits: 31,
  revPerSec: 50,          // 1024 de timpi de cuvânt pe rotație (core/machine.h)
  drawnCycleMs: 1600,     // în desen rotația e încetinită: la 50 rot/s ochiul n-ar vedea decât o pată
};

const W = 420, H = 470;
const CX = 210;                     // axa tamburului
const DX0 = 132, DX1 = 288;         // cilindrul de oțel
const DY0 = 108, DY1 = 196;
export const STREAK_PERIOD = 26;    // pasul zgârieturilor de pe oțel: lucirea care trece arată rotația
const HEAD_BLOCKS = [[104, 128], [146, 178], [190, 216], [232, 264], [292, 316]];   // blocurile capetelor, din față

function headBlock([x0, x1], i) {
  const w = x1 - x0, y0 = 118 + (i === 0 || i === 4 ? 8 : 0), y1 = 200;
  let s = `<g class="head-block"><rect x="${x0}" y="${y0}" width="${w}" height="${y1 - y0}" fill="#1d1e1e" stroke="#0e0f0f"/>`;
  for (let r = y0 + 8; r < y1 - 4; r += 9) {                     // bornele
    s += `<circle cx="${x0 + 5}" cy="${r}" r="1.6" fill="#9a9c98"/><circle cx="${x1 - 5}" cy="${r}" r="1.6" fill="#9a9c98"/>`;
  }
  for (let k = 0; k < 4; k++) {                                   // firele (galbene și albastre, ca în fotografie)
    const y = y0 + 14 + k * 16, c = k % 2 ? '#4d7f9a' : '#c79a3e';
    s += `<path d="M${x0 + 4} ${y} q${w / 2} ${10 + (k % 3) * 3} ${w - 8} 0" fill="none" stroke="${c}" stroke-width="1.6"/>`;
  }
  return `${s}<rect x="${x0 + 2}" y="${y0 - 6}" width="${w - 4}" height="7" fill="#2b2b2a"/></g>`;
}

// Desenul, o singură dată. Clasele: surface/streaks (oțelul care se rotește), head-block (capetele), lamp-green
// (becul verde, aprins cât mașina e sub tensiune — GHICIT), lamp-futes / lamp-torles (stinse: nu se știe când se aprindeau).
export function drumSvg() {
  let streaks = '';
  for (let x = DX0 - STREAK_PERIOD; x <= DX1 + STREAK_PERIOD; x += STREAK_PERIOD) {
    for (const [dx, wd, op] of [[0, 1.5, 0.35], [7, 3, 0.18], [15, 1.5, 0.28]]) {
      streaks += `<rect x="${x + dx}" y="${DY0}" width="${wd}" height="${DY1 - DY0}" fill="#fff" opacity="${op}"/>`;
    }
  }
  const t = (x, y, s) => `<text x="${x}" y="${y}" font-size="7.5" text-anchor="middle" fill="#222" font-family="sans-serif">${s}</text>`;
  return `<svg class="mag-drum-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img">
<defs>
<linearGradient id="dr-gold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7a5418"/>
<stop offset="0.3" stop-color="#c48f2f"/><stop offset="0.55" stop-color="#e2b252"/><stop offset="1" stop-color="#6e4a14"/></linearGradient>
<linearGradient id="dr-steel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3c3e3c"/>
<stop offset="0.45" stop-color="#b9bab3"/><stop offset="0.6" stop-color="#e3e3dc"/><stop offset="1" stop-color="#3a3b39"/></linearGradient>
<linearGradient id="dr-bronze" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6b4e45"/>
<stop offset="0.5" stop-color="#b9958a"/><stop offset="1" stop-color="#5d4239"/></linearGradient>
<linearGradient id="dr-brass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7d6a3c"/>
<stop offset="0.5" stop-color="#d6c48c"/><stop offset="1" stop-color="#6f5d33"/></linearGradient>
<radialGradient id="dr-green"><stop offset="0" stop-color="#b8ffc9"/><stop offset="0.5" stop-color="#2fd36a"/>
<stop offset="1" stop-color="#0d5a28"/></radialGradient>
<clipPath id="dr-clip"><rect x="${DX0}" y="${DY0}" width="${DX1 - DX0}" height="${DY1 - DY0}"/></clipPath>
</defs>
<rect x="0" y="0" width="${W}" height="${H}" fill="#353a3c"/>
<path d="M58 238 L58 470 L362 470 L362 238 Z" fill="url(#dr-gold)"/>
<path d="M44 222 Q44 206 70 204 L350 204 Q376 206 376 222 L362 244 L58 244 Z" fill="url(#dr-gold)" stroke="#5a3d10"/>
<ellipse cx="${CX}" cy="206" rx="132" ry="14" fill="#8a6222" stroke="#5a3d10"/>
<ellipse cx="${CX}" cy="203" rx="118" ry="11" fill="#4a4a40"/>
<rect x="${DX0}" y="${DY0}" width="${DX1 - DX0}" height="${DY1 - DY0}" fill="url(#dr-steel)"/>
<g class="surface" clip-path="url(#dr-clip)"><g class="streaks">${streaks}</g></g>
<ellipse cx="${CX}" cy="${DY0}" rx="${(DX1 - DX0) / 2}" ry="13" fill="#6d5650" stroke="#c9c6bd" stroke-width="3"/>
<rect x="176" y="62" width="68" height="46" fill="url(#dr-bronze)"/>
<ellipse cx="${CX}" cy="108" rx="34" ry="6" fill="#8e7068"/>
<rect x="166" y="50" width="88" height="14" rx="3" fill="url(#dr-steel)"/>
<ellipse cx="${CX}" cy="50" rx="44" ry="7" fill="#b7b8b1"/>
<path d="M200 50 L200 34 Q210 16 220 34 L220 50 Z" fill="url(#dr-steel)"/>
${HEAD_BLOCKS.map(headBlock).join('\n')}
<rect x="340" y="166" width="24" height="40" rx="3" fill="url(#dr-brass)"/>
<rect x="348" y="152" width="8" height="15" fill="#9c8a55"/><rect x="342" y="148" width="20" height="5" rx="2" fill="#b5a46c"/>
<rect x="104" y="264" width="212" height="134" fill="#e6d88f" stroke="#8a7a3c"/>
<circle cx="140" cy="285" r="7" fill="#1a1a1a" stroke="#555"/><circle class="lamp-futes" cx="140" cy="285" r="4" fill="#2a2a24"/>
<rect x="124" y="302" width="32" height="11" fill="#d8d5c8" stroke="#6d6a5e"/>${t(140, 310.5, 'FŰTÉS')}
<rect x="134" y="330" width="12" height="22" fill="#2a2a2a"/><rect x="138" y="333" width="4" height="9" fill="#bbb"/>
<rect x="196" y="272" width="28" height="28" fill="#2c2c2a" stroke="#111"/><circle class="lamp-green" cx="210" cy="286" r="9" fill="url(#dr-green)"/>
<circle cx="280" cy="285" r="7" fill="#1a1a1a" stroke="#555"/><circle class="lamp-torles" cx="280" cy="285" r="4" fill="#cfcabb"/>
<rect x="262" y="302" width="36" height="11" fill="#d8d5c8" stroke="#6d6a5e"/>${t(280, 310.5, 'TÖRLÉS')}
<rect x="274" y="330" width="12" height="22" fill="#2a2a2a"/><rect x="278" y="340" width="4" height="9" fill="#bbb"/>
<circle cx="210" cy="345" r="22" fill="#1f1f1d" stroke="#0b0b0b"/><circle cx="210" cy="345" r="13" fill="#2e2e2b"/>
<path d="M210 345 L200 336" stroke="#d9d9d0" stroke-width="3" stroke-linecap="round"/>
<circle cx="110" cy="270" r="2" fill="#7a6b33"/><circle cx="310" cy="270" r="2" fill="#7a6b33"/>
<circle cx="110" cy="392" r="2" fill="#7a6b33"/><circle cx="310" cy="392" r="2" fill="#7a6b33"/>
<rect x="112" y="420" width="196" height="60" fill="none" stroke="#5a3d10" stroke-width="2"/>
<circle cx="138" cy="440" r="8" fill="#c8c8c2"/><circle cx="282" cy="440" r="8" fill="#c8c8c2"/>
</svg>`;
}

// Faza rotației desenate, în [0, 1): continuă în timp real (tamburul se învârte cât mașina e sub tensiune).
export function drumPhase(nowMs, { reducedMotion = false } = {}) {
  if (reducedMotion) return 0;
  return (((nowMs % DRUM.drawnCycleMs) + DRUM.drawnCycleMs) % DRUM.drawnCycleMs) / DRUM.drawnCycleMs;
}

// Deplasarea lucirii (spre dreapta) pentru o fază: o perioadă întreagă a modelului, deci fără salt.
export const streaksOffset = (phase) => phase * STREAK_PERIOD;
