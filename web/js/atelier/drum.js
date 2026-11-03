// SPDX-License-Identifier: AGPL-3.0-or-later
// Tamburul în Atelier: 32 × 32 de celule (adresa = rând·32 + coloană), colorate după proveniență, cu o literă
// în colț (statutul nu stă doar în culoare) și cu adresa curentă (RAI) aprinsă cât rulează programul.
import { PROV } from '../mecipt.js';
import { glowStep } from '../glow.js';

export function cellKind(prov, written) {
  if (prov === 5) return 'MODIFICAT';
  if (written) return 'WRITTEN';
  return prov > 0 ? PROV[prov] : 'EMPTY';
}

export const CELL_MARK = { ORIGINAL: 'O', DEDUS: 'D', RECONSTRUCTIE: 'R', GHICIT: 'G', MODIFICAT: 'M', WRITTEN: 'P', EMPTY: '' };

const NS = 'http://www.w3.org/2000/svg';
const C = 18, L = 46, TOP = 6;           // latura celulei, coloana etichetelor, marginea de sus

export class DrumView {
  constructor(el, { S, onPick }) {
    this.el = el; this.S = S; this.onPick = onPick;
    this.kinds = new Array(1024).fill(null);
    this.glow = new Map();               // adresă → strălucire (inerția becului)
    el.innerHTML = `<h2 class="at-title"></h2><svg class="drum-svg" viewBox="0 0 ${L + 32 * C + 4} ${TOP + 32 * C + 4}" role="img"></svg><p class="drum-legend"></p>`;
    const svg = el.querySelector('svg');
    this.svg = svg;
    this.cells = [];
    this.marks = [];
    for (let r = 0; r < 32; r++) {
      const lab = document.createElementNS(NS, 'text');
      lab.setAttribute('x', L - 6); lab.setAttribute('y', TOP + r * C + C * 0.72);
      lab.setAttribute('class', 'drum-row'); lab.textContent = (r * 32).toString(8).padStart(4, '0');
      svg.append(lab);
    }
    for (let a = 0; a < 1024; a++) {
      const x = L + (a % 32) * C, y = TOP + Math.floor(a / 32) * C;
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'cell kind-EMPTY');
      g.dataset.addr = String(a);
      g.dataset.help = 'atelier-cell';
      g.innerHTML = `<rect x="${x + 1}" y="${y + 1}" width="${C - 2}" height="${C - 2}" rx="2"/><text x="${x + C / 2}" y="${y + C * 0.7}"></text>`;
      svg.append(g);
      this.cells.push(g);
      this.marks.push(g.querySelector('text'));
    }
    this.hl = [];
    for (let k = 0; k < 4; k++) {
      const r = document.createElementNS(NS, 'rect');
      r.setAttribute('class', 'cell-rai'); r.setAttribute('width', C); r.setAttribute('height', C); r.setAttribute('rx', 3);
      r.style.opacity = '0';
      svg.append(r);
      this.hl.push(r);
    }
    svg.addEventListener('click', (e) => {
      if (document.body.classList.contains('explaining')) return;
      const g = e.target.closest('.cell');
      if (g && this.onPick) this.onPick(Number(g.dataset.addr));
    });
    this.setLang(S);
  }

  setLang(S) {
    this.S = S;
    this.el.querySelector('.at-title').textContent = S.drum.title;
    this.el.querySelector('.drum-legend').textContent = S.drum.legend;
  }

  render(machine) {
    for (let a = 0; a < 1024; a++) {
      const k = cellKind(PROV.indexOf(machine.provenance(a).kind), machine.written(a));
      if (k === this.kinds[a]) continue;
      this.kinds[a] = k;
      this.cells[a].setAttribute('class', `cell kind-${k}`);
      this.marks[a].textContent = CELL_MARK[k];
    }
  }

  // Adresa curentă se aprinde ca un bec; cele de dinainte se sting treptat.
  highlight(rai, running, dtMs) {
    if (running) this.glow.set(rai, this.glow.get(rai) ?? 0);
    for (const [a, b] of this.glow) {
      const nb = glowStep(b, running && a === rai ? 1 : 0, Math.min(dtMs, 100));
      if (nb < 0.02 && a !== rai) this.glow.delete(a); else this.glow.set(a, nb);
    }
    const top = [...this.glow].sort((x, y) => y[1] - x[1]).slice(0, this.hl.length);
    this.hl.forEach((r, i) => {
      const t = top[i];
      if (!t) { r.style.opacity = '0'; return; }
      r.setAttribute('x', L + (t[0] % 32) * C); r.setAttribute('y', TOP + Math.floor(t[0] / 32) * C);
      r.style.opacity = String(Math.round(t[1] * 50) / 50);
    });
  }
}
