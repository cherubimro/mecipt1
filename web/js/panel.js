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
  const st = it.style;
  const a = ((it.needle ?? -35) * Math.PI) / 180;
  // pivotul acului și raza scalei, după stil
  const pivot = st === 'arc' || st === 'small' ? r * 0.12 : r * 0.38;
  const R = st === 'arc' || st === 'small' ? r * 0.62 : r * 0.62;
  let face;
  if (st === 'arc' || st === 'small') {
    // corp negru rotund cu fereastră în arc (scala sus)
    const w = r * 0.72, top = -r * 0.62;
    face = `<circle r="${r}" fill="url(#${p}-bakelite)"/><circle r="${n(r * 0.93)}" fill="none" stroke="#000" stroke-width="2"/>`
      + `<path d="M ${n(-w)} ${n(pivot)} L ${n(-w)} ${n(top * 0.35)} Q 0 ${n(top * 1.25)} ${n(w)} ${n(top * 0.35)} L ${n(w)} ${n(pivot)} Z" fill="#efeadc"/>`;
  } else {
    face = `<circle r="${r}" fill="url(#${p}-bakelite)"/><circle r="${n(r * 0.86)}" fill="#f1eee2"/>`
      + `<circle cy="${n(pivot)}" r="${n(r * 0.17)}" fill="#1a1a1a"/>`;
  }
  let ticks = '';
  // scala: [min, max, pas între cifre]; fără scală, doar gradații (scalele reale nu se citesc — GHICIT)
  const [lo, hi, step] = it.scale || [0, 4, 1];
  const nTicks = Math.round(((hi - lo) / step) * 5);
  for (let k = 0; k <= nTicks; k++) {
    const t = ((-50 + (k * 100) / nTicks) * Math.PI) / 180;
    const big = k % 5 === 0;
    const r0 = R * (big ? 0.84 : 0.9);
    ticks += `<line x1="${n(r0 * Math.sin(t))}" y1="${n(pivot - r0 * Math.cos(t))}" x2="${n(R * Math.sin(t))}" y2="${n(pivot - R * Math.cos(t))}" stroke="#222" stroke-width="${big ? 2 : 1}"/>`;
    if (big && it.scale) {
      const rl = R * 1.16;
      ticks += `<text x="${n(rl * Math.sin(t))}" y="${n(pivot - rl * Math.cos(t) + r * 0.04)}" font-family="${FONT}" font-size="${n(r * 0.11)}" text-anchor="middle" fill="#222">${lo + (k / 5) * step}</text>`;
    }
  }
  const L = R * 0.98;
  return `<g class="meter" id="${esc(it.id)}" data-style="${esc(st)}" transform="translate(${n(x)} ${n(y)})">`
    + face + ticks
    + `<text x="0" y="${n(pivot - R * 0.38)}" font-family="${FONT}" font-size="${n(r * 0.22)}" text-anchor="middle" fill="#222">V</text>`
    + `<line class="needle" x1="0" y1="${n(pivot)}" x2="${n(L * Math.sin(a))}" y2="${n(pivot - L * Math.cos(a))}" stroke="#111" stroke-width="${n(Math.max(1.5, r * 0.02))}"/>`
    + `<ellipse cx="${n(-r * 0.3)}" cy="${n(-r * 0.45)}" rx="${n(r * 0.45)}" ry="${n(r * 0.22)}" fill="#fff" opacity="0.10"/>`
    + '</g>';
}

// Comenzile panoului din mijloc: decor (funcția lor nu e cunoscută), desenate la (0,0), raza ~30.
function decor(p, it) {
  const id = it.id ? ` id="${esc(it.id)}"` : '';
  switch (it.t) {
    case 'knob':
      return `<g class="decor knob"${id}><circle r="30" fill="url(#${p}-bakelite)"/><rect x="-26" y="-5" width="52" height="10" rx="5" fill="#2a2a29" stroke="#c9c4b4" stroke-width="1.5" transform="rotate(-10)"/></g>`;
    case 'rotary':
      return `<g class="decor rotary"${id}><circle r="30" fill="#efece1" stroke="#111" stroke-width="3"/>`
        + `<path d="M -6 -24 Q 0 -27 6 -24 L 9 18 Q 0 24 -9 18 Z" fill="url(#${p}-bakelite)" transform="rotate(-20)"/><circle r="9" fill="#111" transform="rotate(-20)"/></g>`;
    case 'toggle':
      return `<g class="decor down"${id}><rect x="-9" y="-22" width="18" height="44" rx="3" fill="#2e5f9a" stroke="#1a2c48" stroke-width="1.5"/>`
        + `<rect x="-5" y="-12" width="10" height="24" rx="2" fill="#141414"/><rect class="lever" x="-3.5" y="0" width="7" height="12" rx="2" fill="#d9d9d4"/></g>`;
    case 'fuse':
      return `<g class="decor"${id}><rect x="-12" y="-26" width="24" height="52" rx="12" fill="url(#${p}-bakelite)"/><rect x="-6" y="-16" width="12" height="32" rx="6" fill="#2c2c2b"/></g>`;
    case 'socket':
      return `<g class="decor"${id}><rect x="-12" y="-26" width="24" height="52" rx="2" fill="#151515"/><circle cy="-10" r="4" fill="#444"/><circle cy="10" r="4" fill="#444"/></g>`;
    default:
      return '';
  }
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
      const cell = it.cell ? ` data-cell="${esc(it.cell.join('-'))}"` : '';
      const lines = String(it.text).split('\n');
      const lh = it.lh ?? it.s * 1.6;
      const body = lines.length === 1 ? esc(it.text)
        : lines.map((l, k) => `<tspan x="${n(it.x)}" dy="${k ? n(lh) : 0}">${esc(l)}</tspan>`).join('');
      return `<text x="${n(it.x)}" y="${n(it.y)}" font-size="${n(it.s)}" text-anchor="${it.anchor ?? 'start'}" fill="${col}"${fit}${unc}${cell}>${body}</text>`;
    }
    case 'pulse': {
      const f = it.foot ?? 8;
      const pts = [[it.x0 - f, it.y0], [it.x0, it.y0], [it.x0, it.y1], [it.x1, it.y1], [it.x1, it.y0], [it.x1 + f, it.y0]];
      return `<polyline points="${pts.map(([x, y]) => `${n(x)},${n(y)}`).join(' ')}" fill="none" stroke="${col}" stroke-width="${it.w ?? 3}"/>`;
    }
    case 'screw':
      return `<g transform="translate(${n(it.x)} ${n(it.y)})"><circle r="11" fill="url(#${p}-screw)" stroke="#555" stroke-width="1"/><line x1="-8" y1="-3" x2="8" y2="3" stroke="#555" stroke-width="2.5"/></g>`;
    case 'dot':
      return `<circle cx="${n(it.x)}" cy="${n(it.y)}" r="${n(it.r ?? 8)}" fill="#141414"/>`;
    case 'meter':
      return meter(p, it);
    case 'knob': case 'rotary': case 'toggle': case 'fuse': case 'socket':
      return `<g transform="translate(${n(it.x)} ${n(it.y)}) scale(${n(it.k ?? 1)})">${decor(p, it)}</g>`;
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
