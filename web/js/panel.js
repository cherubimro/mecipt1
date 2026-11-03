// SPDX-License-Identifier: AGPL-3.0-or-later
// Desenul unui panou al pupitrului: date (art-*.json, positions.json, lamp-colors.json) → șir SVG.
// Nu atinge DOM-ul, ca să poată fi testat în Node.

const INK = '#27313a';
const RED = '#7a2b33';
const FONT = "'Barlow Semi Condensed', 'Arial Narrow', sans-serif";
const LAMP_R = 17;
const SWITCH_R = 15;

// Sticla becului: stinsă (sticlă colorată, neluminată) și aprinsă (filament).
const GLASS = {
  green: { off: ['#3f7a4c', '#1c3d25'], on: ['#e9ffd8', '#7de05a', '#2a9a32'] },
  red: { off: ['#8a3a30', '#401512'], on: ['#fff0dc', '#ff6a4a', '#d0261a'] },
  white: { off: ['#c9c5b8', '#7d796e'], on: ['#ffffff', '#fff6dc', '#e8d7a8'] },
  amber: { off: ['#94702a', '#4a330c'], on: ['#fffbe0', '#ffc840', '#e08a10'] },
  blue: { off: ['#3a5a9a', '#152448'], on: ['#eef6ff', '#6aa8ff', '#2050c8'] },
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const n = (v) => Math.round(v * 10) / 10;

export function lampIds(positions) {
  const out = [];
  for (const side of ['right', 'left']) {
    for (const [g, grp] of Object.entries(positions[side] || {})) {
      (grp.lamps || []).forEach((_, i) => out.push(`lamp-${g}-${i}`));
    }
  }
  return out;
}

export function switchIds(positions) {
  const out = [];
  for (const side of ['right', 'left']) {
    for (const [g, grp] of Object.entries(positions[side] || {})) {
      (grp.switches || []).forEach((_, i) => out.push(`switch-${g}-${i}`));
    }
  }
  return out;
}

function defs(p) {
  let s = `<defs>
<filter id="${p}-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="7"/><feColorMatrix type="saturate" values="0"/></filter>
<radialGradient id="${p}-chrome" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#f4f4f0"/><stop offset="0.45" stop-color="#b9bab6"/><stop offset="0.8" stop-color="#6f716e"/><stop offset="1" stop-color="#3e403e"/></radialGradient>
<linearGradient id="${p}-lever" x1="0" x2="1"><stop offset="0" stop-color="#8d8f8c"/><stop offset="0.35" stop-color="#f5f5f2"/><stop offset="0.7" stop-color="#a9aba7"/><stop offset="1" stop-color="#5d5f5c"/></linearGradient>
<radialGradient id="${p}-screw" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#e6e6e0"/><stop offset="1" stop-color="#77786f"/></radialGradient>
<radialGradient id="${p}-bakelite" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#4a4a48"/><stop offset="1" stop-color="#0c0c0c"/></radialGradient>`;
  for (const [c, g] of Object.entries(GLASS)) {
    s += `<radialGradient id="${p}-off-${c}" cx="42%" cy="38%" r="65%"><stop offset="0" stop-color="${g.off[0]}"/><stop offset="1" stop-color="${g.off[1]}"/></radialGradient>`;
    s += `<radialGradient id="${p}-on-${c}" cx="45%" cy="42%" r="62%"><stop offset="0" stop-color="${g.on[0]}"/><stop offset="0.45" stop-color="${g.on[1]}"/><stop offset="1" stop-color="${g.on[2]}"/></radialGradient>`;
    s += `<radialGradient id="${p}-halo-${c}"><stop offset="0.45" stop-color="${g.on[1]}" stop-opacity="0.55"/><stop offset="1" stop-color="${g.on[1]}" stop-opacity="0"/></radialGradient>`;
  }
  return s + '</defs>';
}

function lamp(p, id, x, y, color, square) {
  const r = LAMP_R;
  const shape = (fill, k = 1) => square
    ? `<rect x="${n(-r * k)}" y="${n(-r * k)}" width="${n(2 * r * k)}" height="${n(2 * r * k)}" rx="3" fill="${fill}"/>`
    : `<circle r="${n(r * k)}" fill="${fill}"/>`;
  return `<g class="lamp" id="${id}" data-color="${color}" transform="translate(${n(x)} ${n(y)})">`
    + (square ? `<rect x="${-r - 4}" y="${-r - 4}" width="${2 * r + 8}" height="${2 * r + 8}" rx="4" fill="url(#${p}-chrome)"/>`
      : `<circle r="${r + 4}" fill="url(#${p}-chrome)"/>`)
    + shape(`url(#${p}-off-${color})`)
    + `<g class="glow" opacity="0"><circle r="${r * 2.1}" fill="url(#${p}-halo-${color})"/>${shape(`url(#${p}-on-${color})`)}</g>`
    + `<ellipse cx="${-r * 0.3}" cy="${-r * 0.38}" rx="${r * 0.42}" ry="${r * 0.24}" fill="#fff" opacity="0.28"/>`
    + '</g>';
}

function toggle(p, id, x, y) {
  const r = SWITCH_R;
  return `<g class="switch down" id="${id}" tabindex="0" role="button" transform="translate(${n(x)} ${n(y)})">`
    + `<circle r="${r + 6}" fill="none" class="focus-ring"/>`
    + `<polygon points="${hex(r)}" fill="url(#${p}-chrome)" stroke="#555" stroke-width="1"/>`
    + `<circle r="${r * 0.62}" fill="#2b2c2b"/><circle r="${r * 0.5}" fill="url(#${p}-chrome)"/>`
    + `<g class="lever"><path d="M -4 0 L -6 -25 Q 0 -30 6 -25 L 4 0 Z" fill="url(#${p}-lever)" stroke="#4a4b49" stroke-width="0.8"/>`
    + `<ellipse cx="0" cy="-26" rx="6.5" ry="4" fill="url(#${p}-chrome)"/></g>`
    + '</g>';
}

function hex(r) {
  const pts = [];
  for (let k = 0; k < 6; k++) {
    const a = Math.PI / 6 + (k * Math.PI) / 3;
    pts.push(`${n(r * Math.cos(a))},${n(r * Math.sin(a))}`);
  }
  return pts.join(' ');
}

function knob(p, id, x, y, cls = 'knob') {
  return `<g class="${cls}" id="${id}" transform="translate(${n(x)} ${n(y)})">`
    + `<circle r="30" fill="url(#${p}-bakelite)"/><circle r="22" fill="none" stroke="#000" stroke-width="2" opacity="0.6"/>`
    + '<line x1="0" y1="-6" x2="0" y2="-27" stroke="#d8d4c4" stroke-width="3" stroke-linecap="round"/></g>';
}

function meter(p, it) {
  const { x, y, r } = it;
  const a = ((it.needle ?? -40) * Math.PI) / 180;
  let ticks = '';
  const arcStart = -50, arcEnd = 50;
  for (let k = 0; k <= 10; k++) {
    const t = ((arcStart + (k * (arcEnd - arcStart)) / 10) * Math.PI) / 180;
    const r0 = r * (k % 5 === 0 ? 0.62 : 0.68);
    ticks += `<line x1="${n(r0 * Math.sin(t))}" y1="${n(r * 0.25 - r0 * Math.cos(t))}" x2="${n(r * 0.76 * Math.sin(t))}" y2="${n(r * 0.25 - r * 0.76 * Math.cos(t))}" stroke="#222" stroke-width="${k % 5 === 0 ? 2.5 : 1.5}"/>`;
  }
  const body = it.style === 'arc'
    ? `<rect x="${-r}" y="${-r * 0.8}" width="${2 * r}" height="${1.6 * r}" rx="${r * 0.12}" fill="#1b1b1a"/><path d="M ${-r * 0.88} ${r * 0.55} L ${-r * 0.88} ${-r * 0.6} Q 0 ${-r * 0.95} ${r * 0.88} ${-r * 0.6} L ${r * 0.88} ${r * 0.55} Z" fill="#f2efe4"/>`
    : `<circle r="${r}" fill="#1b1b1a"/><circle r="${r * 0.86}" fill="#f2efe4"/>`;
  return `<g class="meter" id="${esc(it.id)}" data-style="${esc(it.style)}" transform="translate(${n(x)} ${n(y)})">`
    + body + ticks
    + `<text x="0" y="${n(r * 0.5)}" font-family="${FONT}" font-size="${n(r * 0.28)}" text-anchor="middle" fill="#222">V</text>`
    + `<line class="needle" x1="0" y1="${n(r * 0.25)}" x2="${n(r * 0.74 * Math.sin(a))}" y2="${n(r * 0.25 - r * 0.74 * Math.cos(a))}" stroke="#111" stroke-width="2"/>`
    + `<circle cx="0" cy="${n(r * 0.25)}" r="${n(r * 0.06)}" fill="#111"/>`
    + `<circle r="${r}" fill="none" stroke="#fff" stroke-opacity="0.12" stroke-width="2"/>`
    + '</g>';
}

function item(p, it) {
  const col = it.color === 'red' ? RED : INK;
  switch (it.t) {
    case 'line':
      return `<line x1="${n(it.x1)}" y1="${n(it.y1)}" x2="${n(it.x2)}" y2="${n(it.y2)}" stroke="${col}" stroke-width="${it.w ?? 3}" stroke-linecap="round"/>`;
    case 'rect':
      return `<rect x="${n(it.x)}" y="${n(it.y)}" width="${n(it.w)}" height="${n(it.h)}" fill="none" stroke="${col}" stroke-width="${it.sw ?? 3}"/>`;
    case 'text': {
      const fit = it.w ? ` textLength="${n(it.w)}" lengthAdjust="spacing"` : '';
      const unc = it.uncertain ? ' data-uncertain="1"' : '';
      return `<text x="${n(it.x)}" y="${n(it.y)}" font-size="${n(it.s)}" text-anchor="${it.anchor ?? 'start'}" fill="${col}"${fit}${unc}>${esc(it.text)}</text>`;
    }
    case 'screw':
      return `<g transform="translate(${n(it.x)} ${n(it.y)})"><circle r="11" fill="url(#${p}-screw)" stroke="#555" stroke-width="1"/><line x1="-8" y1="-3" x2="8" y2="3" stroke="#555" stroke-width="2.5"/></g>`;
    case 'dot':
      return `<circle cx="${n(it.x)}" cy="${n(it.y)}" r="${n(it.r ?? 8)}" fill="#141414"/>`;
    case 'meter':
      return meter(p, it);
    case 'knob':
      return knob(p, it.id, it.x, it.y, 'decor knob');
    case 'rotary':
      return `<g class="decor rotary" id="${esc(it.id)}" transform="translate(${n(it.x)} ${n(it.y)})"><circle r="${n(it.r ?? 34)}" fill="url(#${p}-bakelite)"/><rect x="-6" y="${n(-(it.r ?? 34))}" width="12" height="${n(2 * (it.r ?? 34))}" rx="5" fill="#2a2a29"/></g>`;
    case 'toggle':
      return toggle(p, it.id, it.x, it.y).replace('class="switch down"', 'class="decor down"').replace(' tabindex="0" role="button"', '');
    case 'fuse':
      return `<g class="decor" transform="translate(${n(it.x)} ${n(it.y)})"><circle r="16" fill="url(#${p}-bakelite)"/><circle r="9" fill="#3a3a38"/></g>`;
    case 'socket':
      return `<g class="decor" transform="translate(${n(it.x)} ${n(it.y)})"><circle r="15" fill="url(#${p}-chrome)"/><circle r="7" fill="#111"/></g>`;
    default:
      return '';
  }
}

export function renderPanel(side, art, positions, colors) {
  const p = `p${side}`;
  const [vx, vy, vw, vh] = art.viewBox;
  const parts = [`<svg xmlns="http://www.w3.org/2000/svg" class="panel panel-${side}" viewBox="${vx} ${vy} ${vw} ${vh}" preserveAspectRatio="xMidYMid meet">`,
    defs(p),
    `<rect x="${vx}" y="${vy}" width="${vw}" height="${vh}" fill="${art.face}"/>`,
    `<rect x="${vx}" y="${vy}" width="${vw}" height="${vh}" filter="url(#${p}-grain)" opacity="0.05"/>`,
    `<g class="art" font-family="${FONT}">`];
  for (const it of art.items) parts.push(item(p, it));
  parts.push('</g>');
  const pos = positions[side] || {};
  const shape = colors.shape || {};
  for (const [g, grp] of Object.entries(pos)) {
    (grp.lamps || []).forEach(([x, y], i) => {
      const color = (colors[g] && colors[g][i]) || 'red';
      parts.push(lamp(p, `lamp-${g}-${i}`, x, y, color, shape[g] === 'square'));
    });
    (grp.switches || []).forEach(([x, y], i) => parts.push(toggle(p, `switch-${g}-${i}`, x, y)));
    if (grp.knob) parts.push(knob(p, 'knob', grp.knob[0], grp.knob[1]));
  }
  // umbra și luciul discret al emailului, ca în fotografie
  parts.push(`<rect x="${vx}" y="${vy}" width="${vw}" height="${vh}" fill="none" stroke="#000" stroke-opacity="0.25" stroke-width="6"/>`);
  parts.push('</svg>');
  return parts.join('\n');
}
