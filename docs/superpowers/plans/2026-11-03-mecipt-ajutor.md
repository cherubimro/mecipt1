# MECIPT-1 — Planul 4: Ajutorul (tur ghidat, explicații, documentație, RO/EN) — Plan de implementare

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vizitatorul pupitrului web înțelege ce vede și cum se folosea mașina:
- un tur ghidat care îl conduce până la rularea unui program;
- o explicație la click pe orice bec, comutator sau aparat, cu valoarea tradusă;
- o pagină de documentație pentru pasionați (cuvântul, instrucțiunile, banda, pupitrul, ce e SIGUR/DEDUS/GHICIT și de ce, sursele);
- toate acestea în română și engleză.

**Architecture:**
- Totul rămâne în pagina statică din Planul 2, cu module ES fără biblioteci.
- Textele stau în date:
  - `web/data/help/{ro,en}.json`: explicațiile, turul și sursele;
  - `web/doc/{ro,en}/*.md`: capitolele documentației.
- Tabelele nucleului (instrucțiunile, microoperațiile, glifele mașinii de scris) se generează din C cu o unealtă nouă, `mecdoc`, ca să nu existe a doua sursă de adevăr.
- Logica pură se testează în Node:
  - limba (`lang.js`);
  - valorile traduse (`values.js`);
  - găsirea explicației (`help.js`);
  - mașina de stări a turului (`tour.js`);
  - redarea Markdown (`md.js`).
- Pagina întreagă se verifică în scenariul de fum din Chrome.

**Tech Stack:** C11 (unealta `mecdoc`; o funcție nouă în `core/api`), JavaScript ES2020 fără bibliotecă, HTML/CSS, JSON, Markdown; teste: mini-cadrul C, `node --test`, Chrome headless (ca în Planul 2).

**Spec:**
- `/home/bu/mecipt/docs/2026-11-02-emulator-mecipt1-design.md`:
  - §3.3 Ajutor pentru vizitatori;
  - §3.5 Limbi;
  - §4 Fidelitate și surse;
  - §5 „Ajutor: tur ghidat + explicații la click pe orice element”, „Română și engleză”, „vizitatorul să înțeleagă cum se folosea”;
  - §6 „Inscripțiile pupitrului rămân în română și în varianta engleză”.
- Cererea utilizatorului din 2026-11-03: ajutorul trebuie să explice **toate** detaliile — setul de instrucțiuni, codarea benzii (perforația = 0, 6 caractere pe cuvânt, ordinea canalelor), statutul fiecărei alegeri (SIGUR/DEDUS/GHICIT) cu motivul, sursele. E documentație pentru pasionați, nu doar un tur.
- De citit și: `docs/semantica.md` (statutul fiecărei alegeri), `surse/3d/inscriptii-pupitru.md`, `web/js/app.js` (pagina din Planul 2).

**Ramura:** `ajutor`, din `main`.

## Global Constraints

- Toate constrângerile din Planul 2 rămân valabile:
  - nimic de pe internet la rulare, doar adrese relative;
  - fără npm, bundler sau CDN;
  - nicio logică de mașină în JavaScript;
  - identificatori în engleză;
  - SPDX în fiecare fișier de cod, iar datele JSON/Markdown sub CC BY-SA 4.0 în `LICENSE-CONTINUT.md`;
  - `make check` și `make web-check` verzi la fiecare commit.
- **Limbile:** `ro` (implicit) și `en`. Limba se alege din bara de sus. Prioritatea alegerii: parametrul `?lang=` din adresă, apoi `localStorage` (cheia `mecipt.lang`, citită și scrisă în `try/catch`), apoi `ro`.
- **Inscripțiile panourilor rămân în română** în ambele limbi, desenate ca acum. În engleză, explicația unui element dă inscripția exact cum e pe panou și traducerea ei, de forma „CALCULEAZA AUTOMAT (compute: automatic)”.
- **Proveniența și statutul se văd peste tot:**
  - fiecare explicație și fiecare capitol al documentației poartă eticheta SIGUR / DEDUS / GHICIT acolo unde afirmă ceva despre mașină;
  - fiecare afirmație are sursa ei, din lista de surse din `help/*.json` (id-uri stabile).
- **Facsimilele lui Baltac nu se reproduc** (spec §6). Se citează cu trimitere la carte și la PDF-ul publicat.
- **Semantica comutatoarelor M/RAI:** rămâne cea de acum (pârghia ține poziția și pune tot cuvântul în registru). Turul și documentația spun explicit că e GHICIT și că butoanele ANULEAZA sugerează altă procedură posibilă (vezi `docs/semantica.md`).
- **Ton:** pentru publicul larg, propoziții scurte, fără jargon. Detaliile tehnice merg sub „Mai multe detalii”. Un explicație scurtă are cel mult 2 propoziții (≤ 220 de caractere). Nimic „de joc”: fără emoji, mascote sau punctaje.
- Textele afișate ale interfeței sunt în `web/js/strings.js` (acum `{ro, en}`). Conținutul ajutorului și al documentației e în fișierele de date de mai sus, nu în cod.

## Review Focus

1. **„Explică” rămas pornit:** vizitatorul apasă comutatoare și nu se întâmplă nimic. Modul trebuie să fie evident: butonul apăsat, cursorul „?” și un rând „Mod explicații: apăsați Esc sau Explică pentru a ieși”. Tasta Esc îl închide. → smoke, Task 5.
2. **Turul pornit cu mașina în mers sau cu alt program ales în timpul lui:** turul nu se blochează, iar pasul „acum rulăm un program” se încheie când apare text pe coală. → test `tour survives program change` (Task 6) și smoke.
3. **Limba schimbată cu panoul de explicații deschis sau în mijlocul turului:** conținutul se redesenează în noua limbă, pe același element sau pas. → smoke, Task 5/6.
4. **`localStorage` indisponibil** (fereastră privată, date blocate): pagina pornește în română, fără erori. → test `lang falls back when storage throws` (Task 2).
5. **Valoarea din explicație e veche:** valoarea tradusă se actualizează la fiecare cadru cât panoul e deschis, de exemplu RAI după o mutare de comutator. → smoke, Task 5.

---

## Structura fișierelor

```
core/api.h core/api.c          # + api_word_value(w) → double (valoarea fracției, prin nucleu)
tools/mecdoc.c                 # tabelele nucleului → JSON (instrucțiuni, microoperații, glife)
web/data/core-tables.json      # generat de mecdoc, comis; make check verifică să fie la zi
web/data/help/ro.json en.json  # explicațiile, turul, sursele
web/doc.html                   # pagina de documentație
web/doc/ro/*.md web/doc/en/*.md  # capitolele
docs/semantica.en.md           # traducerea lui semantica.md (aceleași rânduri)
web/js/lang.js                 # alegerea limbii
web/js/values.js               # valoarea tradusă a fiecărui element
web/js/help.js                 # id element → intrarea de ajutor; panoul de explicații
web/js/tour.js                 # mașina de stări a turului + desenul lui
web/js/md.js                   # Markdown (subset) → HTML
web/js/doc.js                  # pagina de documentație
web/js/strings.js app.js       # modificate: {ro, en}, comutatorul de limbă, Explică, Tur
web/css/console.css            # + panoul de explicații, turul, pagina de documentație
tests/web/*.test.mjs           # lang, values, help, tour, md, content
```

---

### Task 1: Tabelele nucleului pentru documentație și valoarea unui cuvânt

**Files:**
- Create: `tools/mecdoc.c`, `web/data/core-tables.json`
- Modify: `core/api.{h,c}`, `tests/test_api.c`, `tests/e2e.sh`, `Makefile`

**Interfaces:**
- Produces:
  - `API double api_word_value(uint32_t w);` = `mec_to_double(w & MEC_MASK31)` (fracția în complement față de unu, −0 → 0).
  - `web/data/core-tables.json`:
    ```
    { "generated_by": "mecdoc",
      "ops":    [ {"code": 0, "mnemonic": "O", "addr": "y|shift|none|sub", "effect_ro": "..."}, ... 29 ],
      "ac":     [ {"sub": "0133", "effect_ro": "imprimă litere conform s0…s4"}, ... 5 ],
      "uops":   [ {"id": 0, "grid": 0, "row": 1, "col": 1, "label_ro": "..."}, ... 39 ],
      "digits": [16 glife], "letters": [32 glife] }
    ```
    `mecdoc` scrie JSON pe stdout, în ordinea de mai sus, cu două spații de indentare și UTF-8 ca atare.
  - `make tables` regenerează fișierul. `tests/e2e.sh` primește `e2e_core_tables_up_to_date`: `build/mecdoc | cmp - web/data/core-tables.json`.
  - În JS: `Machine.wordValue(w)` în `web/js/mecipt.js`.

- [ ] **Step 1: Teste care pică:**
  - `test_api_word_value` în `tests/test_api.c`: `api_word_value(0x20000000) == 0.5`, `api_word_value(0x10000000) == 0.25`, `api_word_value(0x5FFFFFFF) == -0.5` (complement față de unu al lui 0,5), `api_word_value(0x7FFFFFFF) == 0` (−0).
  - `e2e_core_tables_up_to_date` în `tests/e2e.sh`.
  - În `tests/web/mecipt.test.mjs`: `wordValue(0x20000000) === 0.5`.
- [ ] **Step 2: `make check`.** Așteptat: compilarea pică (`api_word_value` lipsește).
- [ ] **Step 3: Implementează** `api_word_value`, `Machine.wordValue` și `tools/mecdoc.c`. Unealta citește `mec_op_by_code`, subcodurile AC din `isa.h`, `MEC_UOPS`, `MEC_DIGIT_GLYPHS` și `MEC_LETTER_GLYPHS`. Șirurile se scriu cu escape JSON (`"`, `\`, controale). Apoi `make tables`.
- [ ] **Step 4: `make check && make web-check`.** Așteptat: verde. Se verifică de mână că `core-tables.json` are 29 de `ops` și 39 de `uops`.
- [ ] **Step 5: Commit:** `nucleu: tabelele pentru documentație (mecdoc) și valoarea unui cuvânt`

---

### Task 2: Limbile

**Files:**
- Create: `web/js/lang.js`, `tests/web/lang.test.mjs`
- Modify: `web/js/strings.js`, `web/js/app.js`, `web/index.html`, `web/css/console.css`

**Interfaces:**
- Produces:
  - `lang.js`:
    - `export const LANGS = ['ro', 'en'];`
    - `export function pickLang(search: string, storage: Storage|null) → 'ro'|'en'`: `?lang=` valid, apoi `storage.getItem('mecipt.lang')`, apoi `'ro'`; orice excepție → următoarea sursă.
    - `export function saveLang(lang, storage)`: `setItem` în `try/catch`.
  - `strings.js`: `export const STRINGS = { ro: {...}, en: {...} }` (aceleași chei) și `export function S(lang)`.
    - `switchLabel(id)` există în ambele limbi.
    - În `en`, eticheta e inscripția românească urmată de traducere, de forma `CALCULEAZA AUTOMAT (compute: automatic)`.
  - În pagină: comutatorul „RO | EN” în bară (`<button id="lang-ro">`, `<button id="lang-en">`, cu `aria-pressed`). Schimbarea limbii reface toate textele fără reîncărcare.
  - `document.documentElement.lang` urmează limba.
  - `window.__pupitru.setLang(lang)`.
- [ ] **Step 1: Teste care pică** (`tests/web/lang.test.mjs`):
  - `?lang=en wins`: `pickLang('?lang=en', store({ 'mecipt.lang': 'ro' })) === 'en'`.
  - `storage is remembered`: `pickLang('', store({ 'mecipt.lang': 'en' })) === 'en'`.
  - `lang falls back when storage throws`: un `storage` ale cărui metode aruncă → `'ro'`, iar `saveLang('en', thrower)` nu aruncă.
  - `invalid values are ignored`: `?lang=fr` → `'ro'`.
  - `both languages have the same keys`: cheile (recursiv) din `STRINGS.ro` și `STRINGS.en` sunt egale; `S('en').switchLabel('switch-compute-0')` începe cu `CALCULEAZA AUTOMAT`.
- [ ] **Step 2: `make web-check`.** Așteptat: FAIL.
- [ ] **Step 3: Implementează.** `strings.js` se mută în forma `{ro, en}`, iar `app.js` folosește `S(lang)`. Textele în engleză se scriu acum pentru toată interfața existentă.
- [ ] **Step 4: Adaugă în `tests/web/smoke.html`:** după `P.setLang('en')`, `#hint` e în engleză, `document.documentElement.lang === 'en'`, iar `#switch-compute-0` are `aria-label` care începe cu `CALCULEAZA AUTOMAT`. Apoi `P.setLang('ro')`.
- [ ] **Step 5: `make web-check`.** Așteptat: Node `ok`, `SMOKE OK`.
- [ ] **Step 6: Commit:** `web: limba română / engleză, aleasă din bară și ținută minte`

---

### Task 3: Valoarea tradusă a fiecărui element

**Files:**
- Create: `web/js/values.js`, `tests/web/values.test.mjs`

**Interfaces:**
- Consumes: `Machine.state()`, `Machine.wordValue()`, `core-tables.json`, `S(lang)`.
- Produces: `export function describeValue(targetId, state, ctx) → string | null`.
  - `ctx` = `{tables, wordValue, uopIndex, uops, lang}`.
  - Întoarce `null` pentru elementele fără valoare (decor, aparate, comutatoare de funcție necunoscută).
  - Regulile (`ro`; `en` analog):

    | Element | Text |
    |---|---|
    | `lamp-M-*` / `switch-M-*` | `Cuvântul din M: <11 cifre octale> = <fracție cu 6 zecimale, virgulă> sau ca instrucțiuni: <c1 a1  c2 a2> (<mnemonica1> <a1>, <mnemonica2> <a2>)`; pentru bitul i se adaugă `Becul <i>: <0/1>` |
    | `lamp-RI-*` | `Instrucțiunea în execuție: <cod octal> = <mnemonica> — <effect_ro>, adresa <aaaa octal> (<zecimal>)` |
    | `lamp-RAI-*` / `switch-RAI-*` | `Adresa instrucțiunii următoare: <zecimal>, în octal <aaaa>` (exemplul din spec) |
    | `lamp-RA-*` | `Registrul de adresă: <zecimal>, în octal <aaaa>` |
    | `lamp-R1-*` / `lamp-R2-*` | `Ultima microoperație: nr. <n>` și numele ei din `uops` dacă n < 39 |
    | `lamp-uop-<k>` | numele microoperației (`label_ro`; în `en`, traducerea din `help/en.json` → `uops[id]`) și `executată în acest moment` / `nu acum` |
    | `lamp-indicators-*`, `lamp-instr-*`, `lamp-overflow-*`, `lamp-compute-*`, `lamp-pulses-*` | starea în cuvinte (`aprins: mașina e oprită` etc.) |

- [ ] **Step 1: Teste care pică** (`tests/web/values.test.mjs`, pe WASM-ul real pentru `wordValue`):
  - `RAI in decimal and octal`: `RAI = 8` → textul conține `8` și `0010`.
  - `M as fraction and instructions`: `M = 0x20000000` → conține `0,500000` și `04000000000`. `M` = cuvântul `27 0000  30 0000` → conține `CIT` și `(30 → necunoscut)`, pentru că codul 30 nu e în tabel.
  - `negative zero is zero`: `M = 0x7FFFFFFF` → conține `0,000000`.
  - `RI names the instruction`: `RI = (0o27 << 10) | 0o1477` → conține `CIT` și `1477`.
  - `uop lamp names the micro-operation`: pentru k cu `uopIndex[k] === 16`, textul conține `label_ro` al lui 16; în `en`, traducerea.
  - `decor has no value`: `describeValue('meter-0', …) === null`.
- [ ] **Step 2: `make web-check`.** Așteptat: FAIL.
- [ ] **Step 3: Implementează `values.js`.** Fără logică de mașină: fracția vine din `wordValue`, iar câmpurile instrucțiunii din biți, după formatul din `isa.h` (m1–m5 cod 2, m6–m10 cod 1, m11–m20 adresă 2, m21–m30 adresă 1). Ordinea afișată e „c1 a1  c2 a2”, ca la listing.
- [ ] **Step 4: `make web-check`.** Așteptat: `ok`.
- [ ] **Step 5: Commit:** `web: valoarea fiecărui bec și registru, tradusă pentru vizitator`

---

### Task 4: Conținutul explicațiilor și găsirea lor

**Files:**
- Create: `web/data/help/ro.json`, `web/data/help/en.json`, `web/js/help.js` (partea pură), `tests/web/help.test.mjs`
- Modify: `LICENSE-CONTINUT.md`

**Interfaces:**
- Produces:
  - `help/<lang>.json`:
    ```
    { "entries": { "<key>": { "title": "...", "short": "...", "more": "Markdown", "status": "SIGUR|DEDUS|GHICIT|MIXT", "sources": ["baltac2011", ...] } },
      "uops": { "<id>": "traducerea (doar în en.json)" },
      "ops":  { "<code>": "traducerea efectului (doar în en.json)" },
      "tour": [ ... Task 6 ... ],
      "sources": { "<id>": { "cite": "autor, titlu, an", "where": "pagina / facsimilul", "url": "opțional" } } }
    ```
  - `export function helpKey(targetId) → string`: ordinea de căutare e id-ul exact, apoi `lamp-<grup>`, `switch-<grup>`, apoi `meter`, `panel-<side>`, `tape`, `sheet`, `provenance`. `lamp-M-12` → `lamp-M`; `meter-5` → `meter-5` (are intrare proprie); `meter-3` → `meter`.
  - `export function helpFor(targetId, help) → entry` (aruncă dacă lipsește; testul de mai jos garantează că nu lipsește).
  - **Cheile obligatorii:**
    - câte una pentru fiecare grup de becuri și comutatoare din `positions.json`;
    - `knob`, `meter`, `meter-5`, `selector`, `power`, `toggle`, `panel-left`, `panel-middle`, `panel-right`, `tape`, `sheet`, `provenance`;
    - pentru butoanele cu funcții diferite, intrări pe id: `switch-commands-0` … `switch-commands-7`, `switch-instr-0` … `switch-instr-3`, `switch-memory-0/1`, `switch-overflow-0/1`, `switch-compute-0/1`, `switch-pulses-0`.
  - **Sursele obligatorii** (id-uri):
    - `baltac2011`: Baltac, *MECIPT – Evocări și Documente*, 2011, facsimilele 4, 5;
    - `baltacLab`: lucrările de laborator, 1965–1966;
    - `geier1961`: setul de instrucțiuni, prin Wikipedia RO;
    - `wikiRO`: articolul „MECIPT”;
    - `farcas2005`;
    - `maruster`;
    - `baltacKey`: *Key Aspects…*;
    - `model3d`: marius0198, 2020, CC BY 4.0;
    - `photo2011`: Turbojet, CC BY-SA 4.0;
    - `semantica`: documentul proiectului.
  - **Conținutul cerut:**
    - `short` spune ce e elementul și la ce folosea, pentru publicul larg.
    - `more` dă detaliile tehnice:
      - biți și ponderi;
      - legătura cu alte registre;
      - ce face butonul în emulator;
      - de ce are statutul pe care îl are, cu trimitere la rândul din `docs/semantica.md`.
    - Elementele fără funcție cunoscută (ADUNARE 1, M+S 2, FERITE, generatorul, aparatele) spun deschis că funcția nu se cunoaște și ce s-ar putea crede.

- [ ] **Step 1: Teste care pică** (`tests/web/help.test.mjs`):
  - `every element on the console has help`: pentru fiecare id din `lampIds`/`switchIds`(positions) + `knob` + `meter-0…10` + `selector`, `power`, `toggle-0/1` + cele 3 panouri + `tape`, `sheet`, `provenance`, `helpFor(id, ro)` și `helpFor(id, en)` merg.
  - `languages match`: aceleași chei `entries` și aceleași id-uri `sources` în `ro` și `en`; `en.uops` are 39 de chei, iar `en.ops` are 29.
  - `entries are well formed`: `title`, `short` nevide; `short.length <= 220`; `status` în listă; fiecare sursă citată există în `sources`.
  - `english keeps the inscription`: `en.entries['switch-compute-0'].title` începe cu `CALCULEAZA AUTOMAT`.
  - `no facsimile images`: niciun `more` nu conține `![`.
- [ ] **Step 2: `make web-check`.** Așteptat: FAIL.
- [ ] **Step 3: Scrie conținutul și `help.js`.** Faptele se iau din `docs/semantica.md`, `surse/3d/inscriptii-pupitru.md`, spec §4.1 și sursele din `surse/`. Nu se adaugă afirmații istorice fără sursă; cele deduse sau ghicite se marchează. În `LICENSE-CONTINUT.md` se trec textele ajutorului (CC BY-SA 4.0).
- [ ] **Step 4: `make web-check`.** Așteptat: `ok`.
- [ ] **Step 5: Commit:** `ajutor: explicațiile pentru fiecare element al pupitrului, RO/EN, cu surse și statut`

---

### Task 5: Panoul de explicații și modul „Explică”

**Files:**
- Modify: `web/js/help.js` (partea DOM), `web/js/app.js`, `web/index.html`, `web/css/console.css`, `tests/web/smoke.html`

**Interfaces:**
- Consumes: `helpFor`, `describeValue`, `S(lang)`, `md.js` → `renderMarkdown` (Task 7; până atunci `more` se afișează ca text simplu, iar Task 7 îl trece prin `renderMarkdown`).
- Produces:
  - **Butonul „Explică”** (`#explain`, `aria-pressed`) în bară. Cât e apăsat:
    - un click pe orice `.lamp`, `.switch`, `.knob`, `.meter`, `.decor`, pe fundalul unui panou, pe `#tape`, `#sheet` sau `#provenance` deschide explicația și **nu** acționează comutatorul;
    - cursorul e `help`;
    - sub bară apare rândul `S.explainOn`;
    - `Esc` sau încă un click pe buton ies din mod.
  - **Fără modul Explică:** un click pe bec, aparat, decor, bandă, coală sau proveniență deschide tot explicația (nu acționează nimic). Comutatoarele își fac treaba. Cu tastatura, tasta `?` pe un comutator focalizat îi deschide explicația.
  - **Panoul de explicații** `<aside id="help-panel" role="dialog" aria-labelledby="help-title">` stă în dreapta, peste pagină, și conține:
    - `#help-title`;
    - eticheta de statut (`.status-SIGUR/DEDUS/GHICIT/MIXT`, cu textul statutului, nu doar culoarea);
    - `#help-short`;
    - `#help-value`, actualizat la fiecare cadru prin `describeValue`;
    - butonul „Mai multe detalii”, care deschide `#help-more` și sursele;
    - butonul „Închide”.
    - Focusul intră în panou la deschidere și revine la element la închidere.
  - `window.__pupitru.explain(targetId)` și `__pupitru.explainMode(on)`.
- [ ] **Step 1: Adaugă în `smoke.html`** (pică):
  1. `explainMode(true)` + click pe `#switch-RAI-9` → `#help-panel` vizibil, titlul conține `RAI`, iar pârghia **nu** s-a mutat (`aria-pressed` neschimbat).
  2. `explainMode(false)` + click pe `#switch-RAI-9` (bitul de pondere 1, care e 1 la 1477) + `explain('switch-RAI-9')` + un cadru → `#help-value` conține `1476` (octal) și `830` (zecimal).
  3. click pe `#lamp-uop-<k>` cu `uopIndex[k] === 16` → titlul panoului e intrarea `lamp-uop`, iar `#help-value` conține numele microoperației 16.
  4. `setLang('en')` cu panoul deschis → `#help-title` e textul din `en.json`.
  5. `Esc` → modul Explică se închide (`#explain` are `aria-pressed="false"`).
- [ ] **Step 2: `make web-check`.** Așteptat: `SMOKE FAIL`.
- [ ] **Step 3: Implementează.** Panoul nu acoperă panoul drept pe ecrane ≥ 1400 px (lățime ≤ 380 px). Stilul e la fel de sobru ca bara: aluminiu deschis, fără umbre mari.
- [ ] **Step 4: `make web-check`.** Așteptat: `SMOKE OK`. Captură `build/explica.png` cu panoul deschis pe RAI, verificată cu Read.
- [ ] **Step 5: Commit:** `pupitru: explicații la click pe orice element, cu valoarea tradusă și detalii cu surse`

---

### Task 6: Turul ghidat

**Files:**
- Create: `web/js/tour.js`, `tests/web/tour.test.mjs`
- Modify: `web/data/help/{ro,en}.json` (cheia `tour`), `web/js/app.js`, `web/index.html`, `web/css/console.css`, `tests/web/smoke.html`

**Interfaces:**
- Produces:
  - Pas de tur: `{ "id": "...", "target": "<id element sau panou>", "view": "all|left|middle|right", "text": "Markdown scurt", "waitFor": null | "typed" | "halted" | "click:<id>" }`.
  - `export class Tour { constructor(steps); start(); next(); prev(); stop(); step() → step|null; index; active; onEvent(ev) → bool }`:
    - un pas cu `waitFor` nu trece mai departe cu `next()` până nu vine evenimentul (`{type:'typed'}`, `{type:'halted'}`, `{type:'click', id}`);
    - `onEvent` întoarce `true` când evenimentul a încheiat pasul, iar turul avansează singur;
    - `prev()` e permis oricând.
  - **Pașii** (aceleași `id`-uri în `ro` și `en`, în ordinea aceasta):
    1. `welcome` (`panel-*` → toată masa): ce e MECIPT-1, 1961, Timișoara; ce e pupitrul.
    2. `memory-drum` (`lamp-M-0`): tamburul de 1024 de cuvinte; registrul M arată un cuvânt de 31 de biți; becul 0 e semnul.
    3. `words` (`lamp-RI-0`): un cuvânt = două instrucțiuni; RI arată instrucțiunea în execuție, cu codul și adresa.
    4. `rai` (`switch-RAI-0`): RAI e adresa următoarei instrucțiuni; comutatoarele de sub ea dau adresa de pornire. Spune deschis că sensul pârghiilor e GHICIT.
    5. `start-address` (`switch-RAI-0`, view `right`): programul ales pornește de la adresa deja pusă pe comutatoare (de exemplu 1477).
    6. `run` (`switch-compute-0`, view `right`, `waitFor: "typed"`): „Apăsați CALCULEAZA AUTOMAT”.
    7. `typewriter` (`sheet`): mașina de scris tipărește; viteza din 1962, cam 50 de instrucțiuni pe secundă.
    8. `microops` (`lamp-uop-0`, view `left`): fiecare instrucțiune e făcută din microoperații, iar becul fiecăreia clipește.
    9. `tape` (`tape`): banda perforată, perforația = 0, 6 caractere pe cuvânt; „alegeți INEX-1 ca s-o vedeți trecând”.
    10. `provenance` (`provenance`): ce înseamnă ORIGINAL / RECONSTRUCȚIE / GHICIT.
    11. `more` (`#doc-link`): documentația completă; „Explică” pentru orice element.
  - **În pagină:**
    - butonul „Tur ghidat” (`#tour-start`);
    - cardul turului (`#tour-card`, `role="dialog"`) cu textul, „Înapoi”, „Înainte” (dezactivat cât un pas așteaptă), „Închide” și numărul pasului („3 / 11”);
    - ținta e evidențiată prin clasa `tour-target` (inel galben, ca indiciul din Planul 2), iar restul mesei e ușor estompat;
    - `view` comută vederea pupitrului;
    - turul trimite evenimente din bucla de cadre (`typed` când `snap.typed` nu e gol, `halted`) și din click-uri.
  - `window.__pupitru.tour`.
- [ ] **Step 1: Teste care pică** (`tests/web/tour.test.mjs`):
  - `steps come in order`: `start()` → `step().id === 'welcome'`; `next()` de 5 ori → `run`.
  - `waiting step blocks next`: la `run`, `next()` nu schimbă pasul; `onEvent({type: 'typed'})` întoarce `true` și trece la `typewriter`.
  - `wrong click does not advance`: `click:switch-compute-0` așteptat, `onEvent({type: 'click', id: 'switch-M-0'})` → `false`.
  - `prev and stop`: `prev()` de la pasul 2 → pasul 1; `stop()` → `active === false`, `step() === null`.
  - `tour survives program change`: un `onEvent({type: 'load'})` nu oprește turul și nu schimbă pasul.
  - `content`: `ro.tour` și `en.tour` au aceleași `id`-uri, în ordinea de mai sus; fiecare `target` e un id din pupitru sau unul dintre `panel-*`, `tape`, `sheet`, `provenance`, `doc-link`.
- [ ] **Step 2: `make web-check`.** Așteptat: FAIL.
- [ ] **Step 3: Implementează** `tour.js`, pașii în ambele limbi și integrarea în pagină.
- [ ] **Step 4: Adaugă în `smoke.html`:**
  - `__pupitru.tour.start()` → `#tour-card` vizibil, iar ținta are clasa `tour-target`;
  - `next()` până la `run`;
  - `P.select('retiparire-1962')` în mijloc → turul e tot activ, la același pas;
  - click pe `#switch-compute-0` și cadre avansate până apare text → pasul devine `typewriter`;
  - `setLang('en')` → textul cardului e cel din `en.json`;
  - `stop()`.
- [ ] **Step 5: `make web-check`.** Așteptat: Node `ok`, `SMOKE OK`. Captură `build/tur.png` la pasul `run`, verificată cu Read.
- [ ] **Step 6: Commit:** `ajutor: turul ghidat, de la pupitru la primul program rulat`

---

### Task 7: Documentația pentru pasionați

**Files:**
- Create:
  - `web/js/md.js`, `tests/web/md.test.mjs`
  - `web/doc.html`, `web/js/doc.js`
  - `web/doc/{ro,en}/*.md`
  - `docs/semantica.en.md`
- Modify:
  - `Makefile` (`site` copiază `docs/semantica.md` în `build/site/doc/ro/semantica.md` și `docs/semantica.en.md` în `build/site/doc/en/semantica.md`)
  - `web/index.html` (`#doc-link` către `doc.html?lang=…`)
  - `web/js/help.js` (`more` trece prin `renderMarkdown`)
  - `tests/web/smoke.html`, `LICENSE-CONTINUT.md`

**Interfaces:**
- Produces:
  - `export function renderMarkdown(src) → string` (HTML sigur):
    - se acceptă titluri `#`–`###`, paragrafe, liste `-` și `1.`, tabele `|…|` cu rândul `|---|`, `**bold**`, `*italic*`, `` `cod` ``, blocuri ```` ``` ````, linkuri `[text](url)` (doar relative sau `https:`) și `{{macro}}`;
    - orice alt HTML se escapează.
  - `export function expandMacros(src, ctx) → string`, cu macro-urile:
    - `{{ops}}`: tabelul instrucțiunilor din `core-tables.json`, cu coloanele cod octal, mnemonica, adresare și efect (RO sau traducerea din `help/en.json`);
    - `{{ac}}`: subcodurile AC;
    - `{{uops}}`: grila microoperațiilor 16 × 3 + 3 × 3, cu numele;
    - `{{digits}}` și `{{letters}}`: glifele mașinii de scris, cu codul fiecăreia;
    - `{{tape-example}}`: cuvântul `05 1626  25 1512` desenat pe 6 rânduri de bandă (● gaură / · fără), cu biții și câmpurile, exact ca în explicația dată utilizatorului pe 2026-11-03.
  - **Capitolele**, aceleași fișiere în `ro/` și `en/`, în ordinea:
    1. `01-masina.md`: MECIPT-1 pe scurt, cu ani și oameni din surse;
    2. `02-cuvantul.md`: cuvântul de 31 de biți, complementul față de unu, −0, fracțiile, formatul instrucțiunii (m1–m5 cod 2 …);
    3. `03-instructiuni.md`: `{{ops}}` + `{{ac}}`, ordinea de execuție (instrucțiunea 1, apoi 2, apoi RAI + 1), timpul pe tambur, codurile 14/15 și variantele;
    4. `04-pupitrul.md`: fiecare grup de pe cele trei panouri, procedura de lucru (cu tensiunea M/RAI marcată GHICIT), `{{uops}}`;
    5. `05-banda-si-masina-de-scris.md`:
       - perforația = 0 (SIGUR);
       - 6 caractere pe cuvânt, m1–m5 primul (DEDUS);
       - canalul 1 = bitul cel mai semnificativ (GHICIT);
       - așezarea 1 · 2 · ghidaj · 3 · 4 · 5 (DEDUS din telex);
       - `{{tape-example}}`, `{{digits}}`, `{{letters}}`, ICR;
    6. `06-programe.md`: programele din pagină, cu proveniența pe cuvinte și facsimilele citate, nu reproduse;
    7. `07-ce-e-sigur.md`: cum se citesc etichetele SIGUR/DEDUS/GHICIT, cu link la `semantica.md`;
    8. `08-surse.md`: sursele (din `help/*.json` → `sources`) și licențele.
  - **`doc.html`:** cuprinsul în stânga, capitolul în dreapta, `?lang=` și `#capitol`. Încarcă `doc/<lang>/<fișier>.md` cu `fetch`, iar `semantica.md` e redată ca orice capitol. Stilul e ca bara: sobru, lizibil, cu linia ≤ 80 de caractere.
  - **`docs/semantica.en.md`:** traducerea integrală, cu aceleași titluri de secțiune (traduse) și același număr de rânduri de tabel în fiecare secțiune.
- [ ] **Step 1: Teste care pică:**
  - `tests/web/md.test.mjs`:
    - `headings, lists, tables` dau elementele așteptate;
    - `escapes html`: `<script>` → `&lt;script&gt;`;
    - `links are restricted`: `[x](javascript:alert(1))` nu produce `href`;
    - `macros expand`: `{{ops}}` → un `<table>` cu 29 de rânduri de date, iar `{{tape-example}}` conține `10101` și `1512`.
  - `tests/web/content.test.mjs`:
    - `chapters exist in both languages` (aceleași 8 fișiere);
    - `semantica.en.md has the same table rows per section as semantica.md`;
    - `every {{macro}} used is known`;
    - `the tape chapter states each rule with its status`: capitolul 05 conține, în `ro`, `SIGUR`, `DEDUS` și `GHICIT`.
- [ ] **Step 2: `make web-check`.** Așteptat: FAIL.
- [ ] **Step 3: Implementează** `md.js`, `doc.js`, `doc.html`, capitolele și traducerea lui `semantica.md`.
- [ ] **Step 4: Adaugă în `smoke.html`** (al doilea iframe, `../doc.html?lang=ro#05-banda-si-masina-de-scris`):
  - capitolul încărcat conține un `<table>` și textul `perforația`;
  - în `?lang=en`, capitolul conține `punched`;
  - linkul `#doc-link` din pagina pupitrului duce la `doc.html`.
- [ ] **Step 5: `make web-check`.** Așteptat: `ok`, `SMOKE OK`. Captură a capitolului 05, verificată cu Read.
- [ ] **Step 6: Commit:** `ajutor: documentația pentru pasionați — instrucțiunile, banda, pupitrul, ce e sigur și sursele, RO/EN`

---

### Task 8: Finisare și verificare

**Files:**
- Modify: `README.md`, `LICENSE-CONTINUT.md`, `tests/web/smoke.html` (dacă e nevoie), `web/css/console.css`

- [ ] **Step 1:**
  - Parcurge turul complet în ambele limbi pe capturi (`build/tur-*.png`, câte una pe pas, produse de o pagină de test ca `shot.html` din Planul 2).
  - Verifică fiecare captură cu Read: textul se vede, ținta e marcată corect, nimic nu acoperă ținta.
  - Corectează CSS-ul sau pozițiile cardului unde e nevoie.
- [ ] **Step 2: `README.md`:** Planul 4 făcut; cum se deschide documentația; limbile.
- [ ] **Step 3: `make check && make web-check`.** Așteptat: ambele cu cod 0.
- [ ] **Step 4: Commit:** `ajutor: verificarea turului în ambele limbi, README`

---

## Ce nu intră în acest plan
- Atelierul (Planul 3), cu editorul și vederea tamburului. Documentația lui vine odată cu el.
- Sunetul (5), reconstrucțiile (6), telefonul și publicarea (7).
- Hotărârea despre semantica comutatoarelor M/RAI: rămâne GHICIT până la o sursă și e prezentată ca atare.
