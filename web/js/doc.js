// SPDX-License-Identifier: AGPL-3.0-or-later
// Pagina de documentație: capitolele din doc/<limbă>/*.md, redate cu md.js, plus semantica proiectului.
import { renderMarkdown, expandMacros } from './md.js';
import { pickLang, saveLang } from './lang.js';
import { S } from './strings.js';

export const CHAPTERS = ['01-masina', '02-cuvantul', '03-instructiuni', '04-pupitrul', '05-banda-si-masina-de-scris',
  '06-programe', '07-ce-e-sigur', '08-surse', '09-atelierul', 'semantica'];

const $ = (id) => document.getElementById(id);
const storage = (() => { try { return window.localStorage; } catch { return null; } })();
const lang = pickLang(location.search, storage);
saveLang(lang, storage);
const T = S(lang);

async function text(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  return r.text();
}

async function main() {
  document.documentElement.lang = lang;
  document.title = T.docTitle;
  $('doc-title').textContent = T.docTitle;
  $('back').textContent = T.backToConsole;
  $('back').href = `index.html?lang=${lang}`;
  $('toc-title').textContent = T.contents;
  for (const l of ['ro', 'en']) {
    const a = $(`doc-lang-${l}`);
    a.setAttribute('aria-current', String(l === lang));
  }
  const [tables, help, ...docs] = await Promise.all([
    fetch('data/core-tables.json').then((r) => r.json()), fetch(`data/help/${lang}.json`).then((r) => r.json()),
    ...CHAPTERS.map((c) => text(`doc/${lang}/${c}.md`)),
  ]);
  const ctx = { tables, help, lang };
  const html = Object.fromEntries(CHAPTERS.map((c, i) => [c, renderMarkdown(expandMacros(docs[i], ctx))]));
  const titleOf = (i) => (/^#\s+(.*)$/m.exec(docs[i]) || [, CHAPTERS[i]])[1];
  $('toc').innerHTML = CHAPTERS.map((c, i) => `<li><a href="#${c}" data-ch="${c}">${titleOf(i).replace(/[<&]/g, '')}</a></li>`).join('');

  function show() {
    const want = decodeURIComponent(location.hash.slice(1));
    const ch = CHAPTERS.includes(want) ? want : CHAPTERS[0];
    $('doc-content').innerHTML = html[ch];
    for (const a of document.querySelectorAll('#toc a')) a.toggleAttribute('aria-current', a.dataset.ch === ch);
    for (const l of ['ro', 'en']) $(`doc-lang-${l}`).href = `doc.html?lang=${l}#${ch}`;
    $('doc-content').focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', show);
  show();
}

main().catch((e) => { $('doc-content').textContent = `${T.loadError}${e.message}`; });
