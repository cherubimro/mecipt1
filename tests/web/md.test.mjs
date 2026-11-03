// SPDX-License-Identifier: AGPL-3.0-or-later
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdown, expandMacros, MACROS } from '../../web/js/md.js';
import { readJson } from './helpers.mjs';

const tables = readJson('web/data/core-tables.json');
const ctx = (lang) => ({ tables, help: readJson(`web/data/help/${lang}.json`), lang });

test('headings, lists, tables', () => {
  const h = renderMarkdown('# Titlu\n\nUn *paragraf* cu **bold** și `cod`.\n\n- a\n- b\n\n1. unu\n2. doi\n\n| x | y |\n|---|---|\n| 1 | 2 |\n');
  assert.match(h, /<h1 id="titlu">Titlu<\/h1>/);
  assert.match(h, /<em>paragraf<\/em>/);
  assert.match(h, /<strong>bold<\/strong>/);
  assert.match(h, /<code>cod<\/code>/);
  assert.match(h, /<ul><li>a<\/li><li>b<\/li><\/ul>/);
  assert.match(h, /<ol><li>unu<\/li><li>doi<\/li><\/ol>/);
  assert.match(h, /<table><thead><tr><th>x<\/th><th>y<\/th><\/tr><\/thead><tbody><tr><td>1<\/td><td>2<\/td><\/tr><\/tbody><\/table>/);
  assert.match(renderMarkdown('```\na < b\n```'), /<pre><code>a &lt; b\n?<\/code><\/pre>/);
});

test('escapes html', () => {
  const h = renderMarkdown('<script>alert(1)</script> și <b>x</b>');
  assert.ok(!h.includes('<script>') && h.includes('&lt;script&gt;'), h);
});

test('links are restricted', () => {
  assert.ok(!renderMarkdown('[x](javascript:alert(1))').includes('href'));
  assert.match(renderMarkdown('[doc](doc.html#05)'), /<a href="doc.html#05">doc<\/a>/);
  assert.match(renderMarkdown('[w](https://ro.wikipedia.org/wiki/MECIPT)'), /href="https:\/\/ro.wikipedia.org\/wiki\/MECIPT"/);
});

test('macros expand', () => {
  const ops = renderMarkdown(expandMacros('{{ops}}', ctx('ro')));
  assert.equal((ops.match(/<tr>/g) || []).length, 30);   // antet + 29
  assert.ok(ops.includes('CIT') && ops.includes('33'));
  const en = renderMarkdown(expandMacros('{{ops}}', ctx('en')));
  assert.ok(en.includes('read one tape character'));
  const tape = expandMacros('{{tape-example}}', ctx('ro'));
  assert.ok(tape.includes('10101') && tape.includes('1512'), tape);
  for (const m of MACROS) assert.ok(expandMacros(`{{${m}}}`, ctx('ro')).length > 20, m);
  assert.equal((renderMarkdown(expandMacros('{{uops}}', ctx('ro'))).match(/<tr>/g) || []).length, 40);
  assert.ok(expandMacros('{{letters}}', ctx('ro')).includes('Ș'));
});
