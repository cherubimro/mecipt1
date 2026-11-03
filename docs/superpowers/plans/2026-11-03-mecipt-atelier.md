# MECIPT-1 — Planul 3: Atelierul — Plan de implementare

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O a doua vedere a paginii, Atelierul, cu editorul de program (notația din 1962), tamburul colorat după proveniență, perforatorul cu încărcare prin INEX-1 și proveniența nouă MODIFICAT — pe aceeași mașină care rulează și pe pupitru.

**Architecture:**
- Nucleul C câștigă trei lucruri: proveniența MODIFICAT, un semn „scris în timpul rulării” pe adresă și operațiile de pupitru pentru editare prin fațada `core/api`. Le folosește WASM-ul și le testăm nativ.
- În browser apar module noi sub `web/js/atelier/`:
  - modelul „original + modificări”, cu salvarea și fișierele `.mec`;
  - formatarea rândurilor;
  - tamburul;
  - perforatorul.
- Vederile Pupitru / Atelier / Ambele refolosesc DOM-ul existent: în Atelier, masa arată doar panoul drept, micșorat.
- Logica pură se testează în Node pe WASM-ul real, iar pagina în scenariul de fum din Chrome.

**Tech Stack:** C11 (gcc pentru teste, clang + wasi-sysroot pentru WASM), JavaScript ES2020 în module ES, fără biblioteci; teste: mini-cadrul C, `node --test`, Chrome headless.

**Spec:** `/home/bu/mecipt/docs/superpowers/specs/2026-11-03-atelier-design.md`. De citit și: `docs/2026-11-02-emulator-mecipt1-design.md` §3.2, §3.4, §4; `docs/semantica.md`; `web/js/app.js`, `runner.js`, `mecipt.js`, `tape.js`; `core/api.h`.

**Ramura:** `atelier`, din `main`.

## Global Constraints

- Ce rămâne din Planurile 2 și 4:
  - site static, nimic de pe internet la rulare;
  - fără npm, bundler sau CDN;
  - același nucleu, nicio logică de mașină în JavaScript;
  - identificatori în engleză;
  - textele interfeței în `web/js/strings.js` (`{ro, en}`, aceleași chei), ajutorul în `tools/help/gen_help.py` → `web/data/help/*.json`, documentația în `web/doc/{ro,en}/`;
  - SPDX în fiecare fișier de cod; conținut CC BY-SA 4.0;
  - `make check` și `make web-check` verzi la fiecare commit.
- **Proveniența** (spec §4.3):
  - a cincea valoare e `PROV_MODIFICAT = 5`, cu numele „MODIFICAT” (`@prov MODIFICAT …` în `.mec`); afișată „MODIFICAT” în română și „MODIFIED” în engleză;
  - un cuvânt schimbat de vizitator nu rămâne ORIGINAL nicăieri: editor, tambur, eticheta din bară, fișierul descărcat.
- **„Scris de program”:** un semn pe adresă, pus de orice scriere a programului (`mec_drum_write`). Proveniența nu se schimbă. Afișarea arată „scris de program” în locul etichetei ORIGINAL / DEDUS / RECONSTRUCȚIE / GHICIT, iar semnul nu se salvează.
- **Regula benzii vizitatorului** (spec §4.3, punctul despre INEX-1): după ce o bandă perforată în Atelier e pusă în cititor, orice cuvânt scris de program pe tambur primește proveniența MODIFICAT, până la următoarea încărcare de program. Regula e GHICITĂ și se trece în `docs/semantica.md`.
- **Notația:**
  - rândurile se scriu ca listingurile de epocă, `AAAA  c1 aaaa  c2 aaaa` în octal, cu mnemonicele din `core-tables.json`;
  - intrarea acceptă sintaxa `.mec`: instrucțiuni cu mnemonice sau octal, `= 0,5`, `= o…`; parsarea o face nucleul.
- **Modificările:**
  - se aplică între instrucțiuni, prin coada runner-ului (acțiunea `{poke: {addr, word, prov}}`);
  - se salvează în `localStorage` (cheia `mecipt.atelier.<id program>`, `try/catch`), ca listă `{addr: text}` peste programul din catalog.
- **Încărcarea implicită:**
  - pupitrul, bara și turul încarcă mereu originalul;
  - Atelierul oferă versiunea modificată, dacă există.
- **Vederea** (`all-console` / `atelier` / `both`) se ține minte în `localStorage` (`mecipt.view`), ca limba.
- Pe lățimi de la 1280 px în sus, uneltele Atelierului încap fără derulare orizontală.

## Review Focus

1. **Vizitatorul editează un cuvânt cât mașina rulează:** modificarea se aplică între instrucțiuni, o singură dată, iar programul continuă. → test `poke applies between instructions` (Task 2).
2. **Text greșit în editor** (`XX 9999`, `= 2,5`, adresă peste 1777): mesaj de eroare sub rând, tamburul neschimbat. → test `invalid input leaves the drum unchanged` (Task 3).
3. **Fișierul descărcat și redeschis**, inclusiv unul editat de mână cu eticheta ORIGINAL pe un cuvânt schimbat: cuvintele identice cu catalogul își păstrează proveniența, cele diferite devin MODIFICAT. → test `reopened files are checked against the catalog` (Task 2).
4. **Banda de încărcat cu INEX-1 e prea lungă pentru adresa din 0014** (ar scrie peste 0010–0015): avertisment înainte de rulare. → test `warns when the tape would overwrite the preloader` (Task 5).
5. **`localStorage` indisponibil:** Atelierul merge, doar nu ține minte. → test `storage that throws is ignored` (Task 2).

---

### Task 1: Nucleul — MODIFICAT, „scris de program” și editarea prin API

**Files:**
- Modify: `core/program.{h,c}`, `core/machine.{h,c}`, `core/console.c`, `core/periph.h`, `core/api.{h,c}`
- Test: `tests/test_program.c`, `tests/test_machine.c`, `tests/test_console.c`, `tests/test_api.c`

**Interfaces:**
- Produces (C):
  - În `program.h`: `PROV_MODIFICAT` (= 5) în `mec_prov`; `mec_prov_name(PROV_MODIFICAT)` = `"MODIFICAT"`; parserul acceptă `@prov MODIFICAT text`.
  - În `machine.h`:
    - `mecipt` primește `uint8_t written[1024]` (1 = scris în timpul rulării) și `int visitor_tape` (1 = în cititor e o bandă a vizitatorului);
    - `mec_drum_write` pune `written[a] = 1` și, dacă `visitor_tape`, `prov[a] = PROV_MODIFICAT`;
    - `mec_load_image` șterge `written`.
  - În `console.c`: `mec_c_memorie_scriere` pune și `prov[RAI] = PROV_MODIFICAT` (scrierea vine de la vizitator).
  - În `api.h`:
    - `API int api_prov(int addr)` citește acum proveniența vie, `m.prov[addr]`;
    - `API const char *api_prov_source(int addr)`: sursa din fișierul încărcat sau unit; `""` pentru NONE și MODIFICAT;
    - `API int api_written(int addr);`
    - `API uint32_t api_peek(int addr);`
    - `API int api_poke(int addr, uint32_t w, int prov);` scrie pe tambur cuvântul și proveniența (de obicei MODIFICAT) și șterge `written[addr]`; −1 dacă adresa sau proveniența e invalidă;
    - `API int api_clear_word(int addr);` cuvânt 0, proveniență NONE;
    - `API int api_assemble(void);` parsează textul din `api_buf` ca partea de după adresă a unui rând `.mec` (`UI 0000 CU 0000`, `27 0000 30 0000`, `= 0,5`, `= o04000000000`); 0 și rezultatul în `api_assembled()`, sau −1 și motivul în `api_error()` (fără prefixul „linia N:”);
    - `API uint32_t api_assembled(void);`
    - `API int api_merge_program(void);` parsează `api_buf` ca `.mec` și scrie cuvintele lui peste tamburul curent, cu proveniența și sursa lor, fără să reseteze nimic altceva; 0 sau −1;
    - `API void api_reset_cpu(void);` registrele la zero, `oprit = 1`, faza 1; tamburul, proveniența, `written` și banda rămân;
    - `API int api_set_visitor_tape(int on);` pune `m.visitor_tape`;
    - `api_load_program` pune `visitor_tape = 0`.
  - Sursele se țin în api.c, într-un tabel propriu (`src_of[1024]` → `srcs[64][96]`), completat la `load` și la `merge`.

- [ ] **Step 1: Teste care pică:**
  - `test_parse_modificat` (`test_program.c`): `@prov MODIFICAT vizitator` urmat de un cuvânt se parsează, cu `prov == PROV_MODIFICAT`; `mec_prov_name(5)` e `"MODIFICAT"`.
  - `test_program_writes_are_marked` (`test_machine.c`): programul `0000  U 0100  ME 0101` / `0001  O 0001  O 0001` / `0100 = 0,5`, rulat → `written[0101] == 1`, `written[0100] == 0`, `prov[0101]` neschimbat (NONE).
  - `test_visitor_tape_marks_modified` (`test_machine.c`): același program, cu `visitor_tape = 1` → `prov[0101] == PROV_MODIFICAT`.
  - `test_memorie_scriere_marks_modified` (`test_console.c`): `prov[RAI] == PROV_MODIFICAT` după `mec_c_memorie_scriere`.
  - `test_api_poke_peek_clear` (`test_api.c`):
    - `api_poke(01000, 0x20000000, PROV_MODIFICAT) == 0`;
    - `api_peek(01000) == 0x20000000`;
    - `api_prov(01000) == PROV_MODIFICAT`;
    - `api_poke(02000, 1, 5) == -1`;
    - `api_clear_word(01000)` → `api_prov(01000) == PROV_NONE`.
  - `test_api_assemble`:
    - `"UI 0000 CU 0000"` → `api_assembled() == ((030 << 25) | (027 << 20))`;
    - `"27 0000  30 0000"` → același cuvânt;
    - `"= 0,5"` → `0x20000000`;
    - `"XX 9999"` → −1, iar `api_error()` conține `"mnemonică"`.
  - `test_api_merge_keeps_drum`: după retipărire, unirea preîncărcătorului INEX-1 → `api_peek(01477)` neschimbat, `api_prov(010) == PROV_ORIGINAL`, `api_prov_source(010)` conține `"Facsimil 5"`, `api_ticks()` neschimbat.
  - `test_api_reset_cpu_keeps_drum`: după 200 de instrucțiuni din retipărire, `api_reset_cpu()` → `api_reg(API_REG_S) == 0`, `api_reg(API_REG_OPRIT) == 1`, `api_peek(01477)` neschimbat, `api_written(…)` păstrat.
- [ ] **Step 2: `make check`.** Așteptat: compilarea pică (funcțiile lipsesc).
- [ ] **Step 3: Implementează.** `api_assemble` construiește intern textul `"@prov GHICIT x\n0000 " + buf` și îl dă lui `mec_program_parse`; scoate „linia 2: ” din mesaj. `make tables` nu e afectat.
- [ ] **Step 4: `make check` și `make CC=gcc-12 clean check`.** Așteptat: verde.
- [ ] **Step 5: Commit:** `nucleu: proveniența MODIFICAT, semnul „scris de program” și editarea tamburului prin API`

---

### Task 2: Învelișul JS și modelul „original + modificări”

**Files:**
- Create: `web/js/atelier/model.js`, `tests/web/atelier-model.test.mjs`
- Modify: `web/js/mecipt.js` (`PROV` cu `'MODIFICAT'`, metode noi), `web/js/runner.js` (acțiunea `poke`), `tests/web/runner.test.mjs`

**Interfaces:**
- Produces:
  - `Machine`: `peek(a)`, `poke(a, w, prov = 5)`, `clearWord(a)`, `written(a)`, `assemble(text) → {word} | {error}`, `mergeProgram(text)` (aruncă la eroare), `resetCpu()`, `setVisitorTape(on)`; `PROV[5] === 'MODIFICAT'`.
  - `Runner`: acțiunea `{poke: {addr, word, prov}}` (sau `{clear: addr}`), aplicată între instrucțiuni ca celelalte.
  - `model.js`:
    - `export class Edits { constructor(programId, originalText); set(addr, text, word); remove(addr); entries() → [{addr, text, word}] ; applyTo(machine); toMec(machine, date) → string; static fromMec(text, catalogFor(id) → originalText|null, machine) → {programId|null, edits: Edits, foreign: bool} }`:
      - `set` păstrează textul exact scris de vizitator;
      - `remove(addr)` înseamnă „adresa ștearsă” (cuvânt 0, NONE) dacă adresa era în original; altfel scoate modificarea;
      - `toMec` scrie antetul `; mecipt-origin: <id>` și `; modificat în Atelierul emulatorului MECIPT-1, <date>`, apoi originalul neatins, cu cuvintele modificate scoase din blocurile lor și puse sub `@prov MODIFICAT vizitator` în forma scrisă de vizitator;
      - `fromMec` compară fiecare cuvânt cu originalul (prin `machine.assemble`/parsare) și face modificări din cuvintele diferite. Fără antet sau cu un id necunoscut: `foreign: true`, iar toate cuvintele devin modificări.
    - `export function loadEdits(storage, programId) → {addr: text} | null` și `saveEdits(storage, programId, edits)`: cheia `mecipt.atelier.<id>`, `try/catch`.

- [ ] **Step 1: Teste care pică:**
  - `tests/web/atelier-model.test.mjs`:
    - `edits apply over the original`: retipărirea + `set(0o1551, '= 0,25', w)` + `applyTo(m)` → `m.peek(0o1551) === 0x10000000`, `m.provenance(0o1551).kind === 'MODIFICAT'`, iar celelalte 45 de cuvinte au proveniența lor.
    - `the downloaded file round-trips`:
      - `toMec` → `mecasm` (prin `child_process` pe `build/mecasm`) îl acceptă;
      - `fromMec(toMec(...))` dă aceleași modificări și `programId === 'retiparire-1962'`;
      - `provenanceSummary` după aplicare are `ORIGINAL 39`, `RECONSTRUCTIE 6` și `MODIFICAT 1`.
    - `reopened files are checked against the catalog`: în fișierul descărcat, un cuvânt ORIGINAL (1500) se schimbă de mână, iar eticheta rămâne ORIGINAL → după `fromMec`, adresa 1500 e o modificare.
    - `files from elsewhere are the visitor's`: un `.mec` fără antet → `foreign === true`, toate cuvintele sunt modificări.
    - `storage that throws is ignored`: `saveEdits`/`loadEdits` cu stocare care aruncă → fără excepție, `loadEdits` întoarce `null`.
  - `tests/web/runner.test.mjs`:
    - `poke applies between instructions`: retipărirea în automat, 3 cadre; `enqueue({poke: {addr: 0o1551, word: 0x10000000, prov: 5}})` → după cadrul următor `peek(0o1551) === 0x10000000`, `instructions()` a crescut, iar mașina rulează în continuare (`mode === 'automat'`).
- [ ] **Step 2: `make web-check`.** Așteptat: FAIL.
- [ ] **Step 3: Implementează** metodele, acțiunea și `model.js`.
- [ ] **Step 4: `make web-check`.** Așteptat: `ok`, `SMOKE OK`.
- [ ] **Step 5: Commit:** `atelier: modelul „original + modificări”, fișierele .mec și editarea prin coada runner-ului`

---

### Task 3: Rândurile editorului

**Files:**
- Create: `web/js/atelier/editor.js`, `tests/web/atelier-editor.test.mjs`

**Interfaces:**
- Consumes: `core-tables.json`, `Machine` (Task 2), `S(lang)`.
- Produces:
  - `export function formatWord(word, tables, wordValue, lang) → {ins: 'UI 0000  CU 0000', oct: '27 0000  30 0000', frac: '0,773438'}`: mnemonicele perechii 1, apoi ale perechii 2, ca în listing; un cod necunoscut apare în octal, urmat de `?`; fracția are 6 zecimale, cu virgulă în română și punct în engleză.
  - `export function rowsFor(machine) → [{addr, word, prov, source, written}]`: adresele cu proveniență sau cu `written`, crescător.
  - `export function provLabel(row, S) → string`: `'scris de program'` când `written` și proveniența nu e MODIFICAT; `'MODIFICAT'` pentru MODIFICAT; altfel numele proveniențelor din `S().prov`, urmat de sursă.
  - `export class Editor { constructor(el, {machine, tables, lang, onEdit(addr, text, word), onRemove(addr), onAdd(addr, text, word)}); render(); setLang(lang); focusAddr(addr) }`:
    - rândurile sunt `<li data-addr>` cu adresa, `ins`, `oct`, `frac` și eticheta;
    - un click deschide câmpul (`<input>` cu forma `ins`); Enter validează prin `machine.assemble`;
    - la eroare, `<p class="row-error">` sub rând, iar tamburul nu se atinge;
    - deasupra listei: „adresă nouă” (octal) și comenzile „Revino la original”, „Descarcă .mec”, „Deschide .mec” (`<input type=file accept=".mec,text/plain">`).
- [ ] **Step 1: Teste care pică:**
  - `formats like the period listings`: cuvântul de la 1477 al retipăririi → `ins === 'UI 0000  CU 0000'`, `oct === '27 0000  30 0000'`.
  - `unknown codes are shown as such`: codul 35₈ → `ins` conține `35?`.
  - `fractions follow the language`: `0x20000000` → `frac` e `'0,500000'` în română și `'0.500000'` în engleză.
  - `rows list loaded and written words`: după retipărire și 200 de instrucțiuni, `rowsFor` include 1477 și orice adresă cu `written`, crescător; `provLabel` dă `'scris de program'` la o adresă `written` cu proveniență ORIGINAL.
  - `invalid input leaves the drum unchanged`: `machine.assemble('XX 9999')` dă `{error}`; `assemble('= 2,5')` dă `{error}`; `peek` neschimbat. (Partea de DOM se verifică în smoke, Task 6.)
- [ ] **Step 2: `make web-check`.** Așteptat: FAIL.
- [ ] **Step 3: Implementează** `editor.js`. Partea pură nu atinge `document` la import.
- [ ] **Step 4: `make web-check`.** Așteptat: `ok`.
- [ ] **Step 5: Commit:** `atelier: rândurile editorului în notația listingurilor din 1962`

---

### Task 4: Tamburul

**Files:**
- Create: `web/js/atelier/drum.js`, `tests/web/atelier-drum.test.mjs`

**Interfaces:**
- Produces:
  - `export function cellKind(prov, written) → 'ORIGINAL'|'DEDUS'|'RECONSTRUCTIE'|'GHICIT'|'MODIFICAT'|'WRITTEN'|'EMPTY'`, cu aceeași regulă ca `provLabel`.
  - `export const CELL_MARK = {ORIGINAL: 'O', DEDUS: 'D', RECONSTRUCTIE: 'R', GHICIT: 'G', MODIFICAT: 'M', WRITTEN: 'P', EMPTY: ''}`: litera din colțul celulei, ca statutul să nu stea doar în culoare.
  - `export class DrumView { constructor(el, {onPick(addr)}); render(machine); highlight(rai, dtMs) }`:
    - un SVG cu 32 × 32 de celule; rândurile sunt etichetate în octal (0000, 0040, …, 1740), cu legendă;
    - `highlight` aprinde celula RAI cu inerția din `glow.js`;
    - un click apelează `onPick(addr)`.
  - Celulele au `data-addr` și clasa `cell kind-<KIND>`.
- [ ] **Step 1: Teste care pică:**
  - `kinds follow provenance and writes`: `cellKind(1, 0) === 'ORIGINAL'`, `cellKind(1, 1) === 'WRITTEN'`, `cellKind(5, 1) === 'MODIFICAT'`, `cellKind(0, 0) === 'EMPTY'`, `cellKind(0, 1) === 'WRITTEN'`.
  - `every kind has a letter`: fiecare tip, mai puțin EMPTY, are o literă nevidă și unică.
- [ ] **Step 2: `make web-check`.** Așteptat: FAIL.
- [ ] **Step 3: Implementează.** `render` refolosește elementele (1024 de `<rect>` create o singură dată) și schimbă doar clasele modificate.
- [ ] **Step 4: `make web-check`.** Așteptat: `ok`.
- [ ] **Step 5: Commit:** `atelier: tamburul — 1024 de cuvinte colorate după proveniență, cu adresa curentă`

---

### Task 5: Perforatorul și încărcarea cu INEX-1

**Files:**
- Create: `web/js/atelier/punch.js`, `tests/web/atelier-punch.test.mjs`

**Interfaces:**
- Consumes: `Machine.assemble`, `Machine.mergeProgram`, `renderTape` (`tape.js`).
- Produces:
  - `export function punchWords(text, machine) → {rows: Uint8Array, words: number, signWarnings: [lineNo], error?: {line, message}}`:
    - un cuvânt pe rând, în sintaxa editorului; rândurile goale și `;` se ignoră;
    - fiecare cuvânt → 6 rânduri, m1–m5 primul, cu perforația = 0 (aceeași codare ca `mec_tape_encode_words`, prin nucleu: `machine.setTapeWords` pe un `.mec` construit, apoi `machine.tape()`);
    - un cuvânt cu m0 = 1 apare în `signWarnings`.
  - `export function punchRows(text) → {rows, error?}`: valori octale 00–37, câte una pe rând sau separate prin spații. Valoarea scrisă e **cea citită de CIT**, deci rândul perforat = `~v & 037`.
  - `export function punchRange(machine, from, to) → string`: textul cuvintelor de pe tambur între cele două adrese, pentru `punchWords`.
  - `export function inexPlan(machine, words) → {start, end, overwritesPreloader: bool}`: `start` = adresa din instrucțiunea ME de la 0014 (câmpul adresei 1, `peek(0o14) & 0o1777`), `end = start + words − 1`; `overwritesPreloader` dacă intervalul atinge 0010–0015.
  - `export const INEX_PRELOADER = 'programs/inex1-preincarcator.mec'`: pagina îl unește cu `mergeProgram`.
  - `export class Punch { constructor(el, {machine, onLoadTape(rows), onMergeInex()}); render(); setLang(lang) }`:
    - modul `cuvinte` / `rânduri`, câmpul de text, „Perforează”, desenul benzii (`renderTape` static), „Pune banda în cititor”, „Pune preîncărcătorul INEX-1 pe tambur”;
    - nota cu procedura din Facsimil 5 și adresa de încărcare din 0014 (GHICIT);
    - avertismentul `overwritesPreloader`.
- [ ] **Step 1: Teste care pică:**
  - `words are punched like the core encodes them`: `punchWords('05 1626  25 1512', m).rows` dă rândurile din exemplul documentației: `holes` (`~rows`) = `10101, 00101, 11010, 01010, 11100, 10110` citite de CIT.
  - `rows mode writes what CIT reads`: `punchRows('25 00').rows` = `[~0o25 & 31, 31]`.
  - `the sign bit cannot be punched`: `punchWords('= -0,5', m).signWarnings` are 1 element.
  - `bad lines are reported`: `punchWords('UI 0000\nXX 1', m).error.line === 2`.
  - `warns when the tape would overwrite the preloader`: după unirea INEX-1 (0014 = ME 0002), `inexPlan(m, 7).overwritesPreloader === true`, `inexPlan(m, 6)` dă `false`; după `poke(0o14, …ME 1477…)`, `inexPlan(m, 39).start === 0o1477` și `false`.
  - `the punched program loads through INEX-1`, cap-coadă pe WASM:
    - se încarcă un program gol;
    - se unește INEX-1 și se pune `ME 1000` în 0014;
    - `punchWords` pe 3 cuvinte, `setTapeRows` și `setVisitorTape(1)`;
    - se rulează de la 0010 până la HÂRTIA AGĂȚATĂ;
    - rezultat: cele 3 cuvinte sunt la 1000–1002, cu proveniența MODIFICAT.
- [ ] **Step 2: `make web-check`.** Așteptat: FAIL.
- [ ] **Step 3: Implementează.**
- [ ] **Step 4: `make web-check`.** Așteptat: `ok`.
- [ ] **Step 5: Commit:** `atelier: perforatorul (cuvinte și rânduri) și încărcarea cu preîncărcătorul INEX-1`

---

### Task 6: Vederile și pagina Atelierului

**Files:**
- Modify: `web/index.html`, `web/css/console.css`, `web/js/app.js`, `web/js/strings.js`, `tests/web/smoke.html`

**Interfaces:**
- Consumes: tot ce e mai sus.
- Produces:
  - **Bara:** comutatorul `<div id="mode" role="group">` cu butoanele `#mode-console`, `#mode-atelier`, `#mode-both` (`aria-pressed`); `document.body.dataset.mode` = `console | atelier | both`, ținut minte (`mecipt.view`).
  - **`atelier`:** masa arată doar panoul drept, la cel mult 34 % din înălțimea ecranului; perifericele (banda, coala) rămân. Dedesubt, `<section id="atelier">` cu patru coloane: editor, tambur, perforator, comenzi. Peste 1280 px nu e nevoie de derulare orizontală.
  - **`both`:** pupitrul întreg, apoi Atelierul.
  - **Comenzile:** `#at-reset` (`resetCpu`), `#at-step` (`{ui: 'unic'}`), `#at-run` (`{ui: 'automat'}`), `#at-stop` (`{ui: 'toggle-pulses'}` dacă impulsurile merg), `#at-start` (adresa octală → `SWITCHES_RAI`, sincronizată cu pârghiile).
  - **Programul în Atelier:** la intrare, sau când se alege un program din bară în Atelier, dacă există modificări salvate apare rândul `#at-modified` („Versiunea ta modificată — Revino la original”) și modificările se aplică. Pupitrul, bara în vederea Pupitru și turul încarcă originalul (spec §4.7).
  - **Eticheta de proveniență din bară:** arată și MODIFICAT („MODIFICAT de vizitator: N”), iar pentru un fișier străin, „fișier deschis de vizitator”.
  - Editorul, tamburul și perforatorul se reîmprospătează doar când tamburul s-a schimbat (o numărătoare de scrieri ținută de `app.js` din `poke`/rulare) sau cel mult de 4 ori pe secundă cât rulează.
  - `window.__pupitru`: `setMode(m)`, `atelier: {edits, editor, drum, punch}`.
- [ ] **Step 1: Adaugă în `smoke.html`** (pică):
  1. `setMode('atelier')` → `#atelier` vizibil, `#panel-left` ascuns, `#panel-right` vizibil; lățimea documentului ≤ lățimea ferestrei, adică fără derulare orizontală la 1600 px.
  2. În editor, un click pe rândul `1551`, apoi `= 0,25` și Enter → `machine.peek(0o1551) === 0x10000000`; rândul arată `MODIFICAT`; celula de tambur `[data-addr="873"]` (1551₈) are clasa `kind-MODIFICAT`; eticheta din bară conține `MODIFICAT`.
  3. `= 2,5` pe același rând → `.row-error` vizibil, iar `peek` neschimbat.
  4. „Revino la original” → 1551 are din nou proveniența RECONSTRUCTIE, iar `localStorage` nu mai are cheia.
  5. **INEX-1:**
     - în perforator, modul `cuvinte`, se scriu 3 cuvinte și se apasă „Perforează” și „Pune banda în cititor”;
     - se apasă „Pune preîncărcătorul INEX-1 pe tambur”, iar în editor se schimbă 0014 în `ME 1000` (fără avertisment);
     - adresa de pornire `0010`, apoi `#at-run`;
     - până la `HIRTIA AGATATA`, `peek(0o1000..0o1002)` sunt cele 3 cuvinte și au proveniența MODIFICAT.
  6. `setMode('console')` → `#atelier` ascuns. `P.select('retiparire-1962')` din vederea Pupitru → `provenanceSummary` nu are MODIFICAT.
- [ ] **Step 2: `make web-check`.** Așteptat: `SMOKE FAIL`.
- [ ] **Step 3: Implementează.**
- [ ] **Step 4: `make web-check`.** Așteptat: `SMOKE OK`. Capturi `build/atelier.png` (1600 × 1000) și `build/atelier-1280.png` (1280 × 900), verificate cu Read: nimic nu se suprapune, nu arată „de joc”.
- [ ] **Step 5: Commit:** `atelier: vederile Pupitru / Atelier / Ambele și pagina Atelierului`

---

### Task 7: Explicațiile, documentația și semantica

**Files:**
- Modify: `tools/help/gen_help.py` (→ `web/data/help/*.json`), `web/doc/{ro,en}/` (capitol nou `09-atelierul.md`), `web/js/doc.js` (`CHAPTERS`), `tests/web/content.test.mjs`, `tests/web/help.test.mjs`, `docs/semantica.md`, `docs/semantica.en.md`

**Interfaces:**
- Produces:
  - Intrări „Explică” noi, RO/EN, cu statut și surse: `atelier-editor`, `atelier-row`, `atelier-drum`, `atelier-cell`, `atelier-punch`, `atelier-controls`, `prov-modificat`.
    - `helpKey` le găsește: id-ul exact sau `data-help` pe element.
    - Celula de tambur adaugă la valoare adresa (zecimal și octal), cuvântul (cu `formatWord`) și proveniența.
  - Capitolul `09-atelierul.md` (RO/EN): cum se scria un program în 1962 (notația, adresele absolute, octalul), editorul, MODIFICAT și „scris de program”, banda și procedura INEX-1 (Facsimil 5), adresa de încărcare din 0014 (GHICIT), fișierele `.mec`.
  - În `semantica.md` și `semantica.en.md`, secțiunea nouă „Atelierul” (aceleași rânduri):
    - MODIFICAT la orice scriere a vizitatorului;
    - regula benzii vizitatorului (GHICIT);
    - „scris de program” fără schimbarea proveniența;
    - adresa de încărcare din 0014 (GHICIT);
    - în modul „rânduri” se scrie valoarea citită de CIT;
    - pupitrul și turul încarcă originalul.
- [ ] **Step 1: Teste care pică:**
  - `help.test`: cheile noi există în ambele limbi, cu surse; `helpFor('atelier-cell')` merge.
  - `content.test`: în ambele limbi există 9 capitole (cu `09-atelierul.md`); `semantica` are aceleași rânduri pe secțiune; capitolul 09 RO conține `MODIFICAT`, `0014` și `GHICIT`.
- [ ] **Step 2: `make web-check`.** Așteptat: FAIL.
- [ ] **Step 3: Scrie conținutul** și leagă „Explică” de elementele Atelierului: `.cell`, rândurile, perforatorul, comenzile.
- [ ] **Step 4: `make web-check`.** Așteptat: `ok`, `SMOKE OK`.
- [ ] **Step 5: Commit:** `atelier: explicațiile, capitolul din documentație și semantica`

---

### Task 8: Verificare și README

- [ ] **Step 1:**
  - Parcurge Atelierul pe capturi, în ambele limbi și în cele trei vederi;
  - verifică cu Read că eticheta MODIFICAT se vede peste tot unde trebuie și că nimic nu se suprapune;
  - corectează.
- [ ] **Step 2: `README.md`:** Planul 3 făcut; Atelierul, cu ce face; fișierele `.mec` descărcate.
- [ ] **Step 3: `make check && make web-check`** (și `make CC=gcc-12 clean check`). Așteptat: cod 0.
- [ ] **Step 4: Commit:** `atelier: verificare în ambele limbi și vederi, README`

---

## Ce nu intră în acest plan
- Etichete simbolice, depanare modernă, mai multe programe deschise, salvare pe server (non-ținte ale spec-ului).
- Turul propriu al Atelierului (spec §6).
- Telefonul (Planul 7), sunetul (Planul 5), programele reconstruite noi (Planul 6).
