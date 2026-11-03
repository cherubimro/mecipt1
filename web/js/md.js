// SPDX-License-Identifier: AGPL-3.0-or-later
// Markdown (un subset mic) → HTML sigur, pentru documentație și pentru „Mai multe detalii”.
// Acceptă: # … ###, paragrafe, liste - și 1., tabele |…|, **bold**, *italic*, `cod`, blocuri ```, linkuri
// relative sau https:. Orice HTML din text se escapează. Macro-urile {{…}} se extind înainte, în Markdown.

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function slug(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// Doar https:, ancore și adrese relative simple; orice altceva (alte scheme, caractere de control) e refuzat.
function safeUrl(u) {
  if (/^https:\/\/[\w.-]+(\/[\w./#?=&%~:+-]*)?$/i.test(u)) return u;
  if (/^[\w./#?=&%-]+$/.test(u) && !u.startsWith('//') && !/^[a-z][a-z0-9+.-]*:/i.test(u)) return u;
  return null;
}

// Literele cu bară (M̄, S̄): accentul combinat U+0304 abia se vede în Barlow, deci bara se desenează ca linie.
export function overlineHtml(text) {
  return String(text).split(/([^\u0304]\u0304)/u).map((p, i) => (i % 2
    ? `<span class="ovl">${esc(p[0])}</span>` : esc(p))).join('');
}

function inline(text) {
  return text.split(/(`[^`]*`)/).map((part) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 1) return `<code>${overlineHtml(part.slice(1, -1))}</code>`;
    let h = overlineHtml(part);
    h = h.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) => {
      const url = safeUrl(u.replace(/&amp;/g, '&'));
      return url ? `<a href="${esc(url)}">${t}</a>` : t;
    });
    h = h.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    h = h.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
    return h;
  }).join('');
}

const cells = (line) => line.trim().replace(/^\|/, '').replace(/(?<!\\)\|$/, '').split(/(?<!\\)\|/)
  .map((c) => c.trim().replace(/\\\|/g, '|'));
const isSep = (line) => /^\|[\s:|-]+\|?$/.test(line.trim()) && line.includes('-');

export function renderMarkdown(src) {
  const lines = String(src).replace(/\r/g, '').split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    if (line.startsWith('```')) {
      const body = [];
      for (i++; i < lines.length && !lines[i].startsWith('```'); i++) body.push(lines[i]);
      i++;
      out.push(`<pre><code>${overlineHtml(body.join('\n'))}</code></pre>`);
      continue;
    }
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      out.push(`<h${h[1].length} id="${slug(h[2])}">${inline(h[2])}</h${h[1].length}>`);
      i++;
      continue;
    }
    if (line.trim().startsWith('|')) {
      const rows = [];
      for (; i < lines.length && lines[i].trim().startsWith('|'); i++) rows.push(lines[i]);
      const head = rows.length > 1 && isSep(rows[1]) ? cells(rows[0]) : null;
      const body = rows.slice(head ? 2 : 0).filter((r) => !isSep(r));
      out.push('<table>' + (head ? `<thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead>` : '')
        + `<tbody>${body.map((r) => `<tr>${cells(r).map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`);
      continue;
    }
    const li = /^(\s*)([-*]|\d+\.)\s+(.*)$/.exec(line);
    if (li) {
      const ordered = /\d/.test(li[2]);
      const items = [];
      while (i < lines.length) {
        const m = /^(\s*)([-*]|\d+\.)\s+(.*)$/.exec(lines[i]);
        if (m && /\d/.test(m[2]) === ordered) { items.push(m[3]); i++; continue; }
        if (lines[i].trim() && /^\s{2,}/.test(lines[i]) && items.length) { items[items.length - 1] += ' ' + lines[i].trim(); i++; continue; }
        break;
      }
      const tag = ordered ? 'ol' : 'ul';
      out.push(`<${tag}>${items.map((t) => `<li>${inline(t)}</li>`).join('')}</${tag}>`);
      continue;
    }
    const para = [];
    for (; i < lines.length && lines[i].trim() && !/^(#{1,3}\s|```|\s*\||\s*([-*]|\d+\.)\s)/.test(lines[i]); i++) para.push(lines[i].trim());
    out.push(`<p>${inline(para.join(' '))}</p>`);
  }
  return out.join('\n');
}

// ---- macro-urile documentației: tabele generate din nucleu (web/data/core-tables.json) ----
const L = {
  ro: {
    ops: ['Cod (octal)', 'Mnemonica', 'Adresa', 'Efectul (tabelul Geier)'],
    addr: { y: 'y — adresă', shift: 'n — poziții', none: '—', sub: 'subcod' },
    ac: ['Subcod (octal)', 'Efectul'],
    uops: ['Grila', 'Rândul', 'Coloana', 'Microoperația'],
    grid: ['⎍', '⊔'],
    glyph: ['Cod', 'Caracter'],
    space: '(spațiu)', newline: '(rând nou)', unused: '(nefolosit — Baltac, L6)',
    tape: ['Rândul', 'Canalele 1 2 | 3 4 5', 'Biții citiți', 'Câmpul'],
    fields: ['m1–m5: codul 2', 'm6–m10: codul 1', 'm11–m15: adresa 2 (sus)', 'm16–m20: adresa 2 (jos)', 'm21–m25: adresa 1 (sus)', 'm26–m30: adresa 1 (jos)'],
    legend: '● = gaură = 0; · = fără gaură = 1; | = canalul de ghidaj.',
    intro: 'Cuvântul `05 1626  25 1512` (scris ca în listingurile de epocă: codul 1, adresa 1, codul 2, adresa 2) pe 6 rânduri de bandă:',
    fieldHead: ['Câmpul', 'Biții', 'Valoarea (octal)'],
    fieldNames: ['codul 2 (m1–m5)', 'codul 1 (m6–m10)', 'adresa 2 (m11–m20)', 'adresa 1 (m21–m30)'],
  },
  en: {
    ops: ['Code (octal)', 'Mnemonic', 'Address', 'Effect (Geier’s table)'],
    addr: { y: 'y — address', shift: 'n — places', none: '—', sub: 'sub-code' },
    ac: ['Sub-code (octal)', 'Effect'],
    uops: ['Grid', 'Row', 'Column', 'Micro-operation'],
    grid: ['⎍', '⊔'],
    glyph: ['Code', 'Character'],
    space: '(space)', newline: '(new line)', unused: '(not used — Baltac, L6)',
    tape: ['Row', 'Channels 1 2 | 3 4 5', 'Bits read', 'Field'],
    fields: ['m1–m5: code 2', 'm6–m10: code 1', 'm11–m15: address 2 (high)', 'm16–m20: address 2 (low)', 'm21–m25: address 1 (high)', 'm26–m30: address 1 (low)'],
    legend: '● = hole = 0; · = no hole = 1; | = feed track.',
    intro: 'The word `05 1626  25 1512` (written as in the period listings: code 1, address 1, code 2, address 2) on 6 rows of tape:',
    fieldHead: ['Field', 'Bits', 'Value (octal)'],
    fieldNames: ['code 2 (m1–m5)', 'code 1 (m6–m10)', 'address 2 (m11–m20)', 'address 1 (m21–m30)'],
  },
};
const AC_EN = { '0111': 'starts the ICR automaton', '0133': 'prints a letter according to s0…s4', '0134': 'stops the ICR automaton',
  '0136': 'prints a digit according to s0…s3', '0151': 'S ← i' };
const cellEsc = (s) => String(s).replace(/\|/g, '\\|');
const table = (head, rows) => [`| ${head.map(cellEsc).join(' | ')} |`, `|${head.map(() => '---').join('|')}|`,
  ...rows.map((r) => `| ${r.map(cellEsc).join(' | ')} |`)].join('\n');
const oct = (v, n) => v.toString(8).padStart(n, '0');
const glyph = (g, t) => (g === ' ' ? t.space : g === '\n' ? t.newline : g === '' ? t.unused : g);

const MACRO_FNS = {
  ops: ({ tables, help, lang }, t) => table(t.ops, tables.ops.map((o) => [oct(o.code, 2), `**${o.mnemonic}**`, t.addr[o.addr],
    lang === 'en' && help.ops ? help.ops[String(o.code)] : o.effect_ro])),
  ac: ({ tables, lang }, t) => table(t.ac, tables.ac.map((a) => [a.sub, lang === 'en' ? AC_EN[a.sub] || a.effect_ro : a.effect_ro])),
  uops: ({ tables, help, lang }, t) => table(t.uops, tables.uops.map((u) => [t.grid[u.grid], u.row, u.col,
    lang === 'en' && help.uops ? help.uops[String(u.id)] : u.label_ro])),
  digits: ({ tables }, t) => table(t.glyph, tables.digits.map((g, i) => [oct(i, 2), glyph(g, t)])),
  letters: ({ tables }, t) => table(t.glyph, tables.letters.map((g, i) => [oct(i, 2), glyph(g, t)])),
  'tape-example': (ctx, t) => {
    // cuvântul „05 1626  25 1512”: cod 1 = 05, adresa 1 = 1626, cod 2 = 25, adresa 2 = 1512
    const c1 = 0o05, a1 = 0o1626, c2 = 0o25, a2 = 0o1512;
    const w = ((c2 << 25) | (c1 << 20) | (a2 << 10) | a1) >>> 0;
    const rows = [];
    for (let k = 0; k < 6; k++) {
      const v = (w >>> (25 - 5 * k)) & 31;
      const bits = v.toString(2).padStart(5, '0');
      const holes = [...bits].map((b) => (b === '0' ? '●' : '·'));
      rows.push([k + 1, `${holes[0]} ${holes[1]} | ${holes[2]} ${holes[3]} ${holes[4]}`, `\`${bits}\``, t.fields[k]]);
    }
    const b = (v, n) => `\`${v.toString(2).padStart(n, '0')}\``;
    const fields = table(t.fieldHead, [
      [t.fieldNames[0], b(c2, 5), oct(c2, 2)], [t.fieldNames[1], b(c1, 5), oct(c1, 2)],
      [t.fieldNames[2], b(a2, 10), oct(a2, 4)], [t.fieldNames[3], b(a1, 10), oct(a1, 4)]]);
    return `${t.intro}\n\n${table(t.tape, rows)}\n\n${t.legend}\n\n${fields}`;
  },
};
export const MACROS = Object.keys(MACRO_FNS);

export function expandMacros(src, ctx) {
  const t = L[ctx.lang] || L.ro;
  return String(src).replace(/\{\{([a-z-]+)\}\}/g, (m, name) => (MACRO_FNS[name] ? MACRO_FNS[name](ctx, t) : m));
}
