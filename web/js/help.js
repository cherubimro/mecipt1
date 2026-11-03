// SPDX-License-Identifier: AGPL-3.0-or-later
// Ajutorul: id-ul unui element al pupitrului → intrarea lui din web/data/help/<limbă>.json.

// Ordinea căutării: id-ul exact, apoi grupul (lamp-<grup>, switch-<grup>), apoi familia (meter, toggle).
export function helpKey(targetId, help) {
  const e = help.entries;
  if (targetId in e) return targetId;
  const g = /^(lamp|switch)-([A-Za-z0-9]+)-\d+$/.exec(targetId);
  if (g && `${g[1]}-${g[2]}` in e) return `${g[1]}-${g[2]}`;
  const f = /^(meter|toggle)-\d+$/.exec(targetId);
  if (f && f[1] in e) return f[1];
  return null;
}

export function helpFor(targetId, help) {
  const k = helpKey(targetId, help);
  if (!k) throw new Error(`fără explicație pentru ${targetId}`);
  return { key: k, ...help.entries[k] };
}

// ---- Panoul de explicații (DOM). Nu atinge `document` la import, ca modulul să meargă și în Node. ----
import { overlineHtml } from './md.js';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export class HelpPanel {
  // els = {panel, title, status, short, value, moreBtn, more, close}; render(md) → HTML pentru „Mai multe detalii”
  constructor(els, { render = (md) => `<p class="plain">${esc(md)}</p>`, onClose = () => {} } = {}) {
    this.els = els;
    this.render = render;
    this.onClose = onClose;
    this.target = null;
    this.returnFocus = null;
    els.close.addEventListener('click', () => this.close());
    els.moreBtn.addEventListener('click', () => this.toggleMore());
  }
  get open() { return this.target !== null; }
  show(targetId, help, strings, value, focusFrom = null) {
    const e = helpFor(targetId, help);
    const { els } = this;
    this.target = targetId;
    if (focusFrom) this.returnFocus = focusFrom;
    els.title.innerHTML = overlineHtml(e.title);
    els.status.textContent = strings.statusNames[e.status] || e.status;
    els.status.className = `help-status status-${e.status}`;
    els.short.innerHTML = overlineHtml(e.short);
    this.shownValue = null;
    this.setValue(value);
    els.moreBtn.textContent = strings.moreDetails;
    els.close.textContent = strings.closeHelp;
    const src = e.sources.map((id) => {
      const s = help.sources[id];
      const link = s.url ? ` <a href="${esc(s.url)}"${/^https:/.test(s.url) ? ' rel="noopener" target="_blank"' : ''}>${esc(s.url.replace(/^https:\/\//, ''))}</a>` : '';
      return `<li>${esc(s.cite)} — ${esc(s.where)}${link}</li>`;
    }).join('');
    els.more.innerHTML = `${this.render(e.more)}<h3>${esc(strings.sourcesTitle)}</h3><ul class="help-sources">${src}</ul>`;
    els.panel.hidden = false;
    if (focusFrom && els.title.focus) els.title.focus({ preventScroll: true });   // focusul intră în panou
  }
  setValue(value) {
    const v = value || '';
    if (this.shownValue !== v) { this.els.value.innerHTML = overlineHtml(v); this.shownValue = v; }
    this.els.value.hidden = !v;
  }
  toggleMore(force) {
    const open = force ?? this.els.more.hidden;
    this.els.more.hidden = !open;
    this.els.moreBtn.setAttribute('aria-expanded', String(open));
  }
  close() {
    if (!this.open) return;
    this.target = null;
    this.els.panel.hidden = true;
    this.toggleMore(false);
    if (this.returnFocus && this.returnFocus.focus) this.returnFocus.focus();
    this.returnFocus = null;
    this.onClose();
  }
}
