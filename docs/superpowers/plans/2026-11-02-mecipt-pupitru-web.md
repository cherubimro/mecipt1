# MECIPT-1 — Planul 2: Pupitrul web (nucleul C → WebAssembly) — Plan de implementare

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O pagină web statică în care vizitatorul vede pupitrul MECIPT-1 (cele trei panouri, redesenate vectorial) lucrând în timp real, cu becurile legate de nucleul C compilat în WebAssembly, cu comutatoarele și butoanele funcționale, cu cititorul de bandă și mașina de scris animate, la viteza din 1962 sau „rapid”.

**Architecture:** Nucleul din Planul 1 primește o fațadă C fără structuri (`core/api.{h,c}`, testată nativ), compilată cu `clang-17 --target=wasm32-wasi` și biblioteca `wasi-sysroot` 21 (descărcată, sha256 fixat; **fără Emscripten**: discul are 3 GB liberi). În browser, module ES fără dependențe: un înveliș al mașinii (`mecipt.js`), un „runner” care împarte timpul real în timpi de tambur, legăturile pupitru ↔ stare, desenul panourilor generat din date JSON (pozițiile becurilor extrase din modelul 3D, liniile și inscripțiile trasate după texturi) și vederile banda/mașina de scris. Tot ce nu atinge DOM-ul se testează în Node 20 pe același `.wasm`; pagina întreagă se verifică în Chrome fără ecran (`--headless --dump-dom`).

**Tech Stack:** C11 (gcc pentru teste, clang 17 + wasi-sysroot 21 pentru WASM), JavaScript ES2020 în module ES fără bibliotecă și fără bundler, SVG, CSS; teste: mini-cadrul C existent, `node --test` (Node 20), Chrome headless; unelte: Python 3.6 (+ numpy, Pillow, deja instalate), ImageMagick.

**Spec:** `/home/bu/mecipt/docs/2026-11-02-emulator-mecipt1-design.md` (§3.2 vederea Pupitru, §3.1 viteza, §4 proveniența, §5–§6 deciziile). Citește și `surse/3d/inscriptii-pupitru.md`, `docs/semantica.md`, foaia de drum de la finalul `docs/superpowers/plans/2026-11-02-mecipt-nucleu.md`.

**Ramura:** `pupitru`, din `main` (`faaca76`).

## Global Constraints

- **Nimic de pe internet la rulare:** site static, toate fișierele găzduite local (fonturi, `.wasm`, date), doar adrese relative; merge din orice găzduire statică. Fără npm, fără bundler, fără CDN.
- **Același nucleu:** WASM-ul se compilează din `core/*.c` neschimbate (plus `core/api.c`); nicio logică de mașină nu se rescrie în JavaScript.
- Toolchain WASM: `clang-17` (sau `clang` ≥ 17) cu `--target=wasm32-wasi`, `wasi-sysroot-21.0.tar.gz` (sha256 `6aac42fc29474f052ac8fb92f45658a9fedf196857eba2493e14216667fff524`) și `libclang_rt.builtins-wasm32-wasi-21.0.tar.gz` (sha256 `4cb93ca6cea41f9883656ee2c58e0e4529a317774b12f76d13058dcb4c84014d`), de la `https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-21/`, în `third_party/wasi/` (ignorat de git). Aceleași `-Wall -Wextra -Werror` ca la build-ul nativ.
- Importurile WASI (`fd_write`, `fd_seek`, `fd_close`) primesc în JS funcții care întorc 52 (ENOSYS); nucleul nu scrie pe ecran.
- După **orice** apel în WASM, memoria se citește prin `new Uint8Array(exports.memory.buffer)` creat din nou (memoria poate crește și invalida vederile vechi).
- Identificatorii din cod în engleză; **textele afișate în română**, toate în `web/js/strings.js` (engleza vine în Planul 4).
- **Inscripțiile panourilor se scriu literă cu literă cum apar pe texturi**, cu ortografia de atunci și fără diacritice acolo unde nu se văd (ex. `CALCULEAZA`, `HIRTIA`, `DEPASIT`, `INSTRUCTIE UNICA`, `ANULEAZA`, `M în I`). Textul modernizat din `inscriptii-pupitru.md` e doar un ghid de citire.
- Coordonatele panourilor stâng și drept sunt în **pixeli de textură** (2048 × 2048, imaginile din `surse/3d/panouri-indreptate/`). Pozițiile becurilor și comutatoarelor provin din modelul 3D (Task 3) și nu se ajustează de mână.
- **Culorile becurilor** sunt luate din fotografia din 2011 (`surse/foto/…Turbojet…jpg`), nu din materialele modelului 3D (modelul le face aproape pe toate roșii):

  | Grup | Culori, în ordinea becurilor |
  |---|---|
  | M (31) | verde × 31 |
  | RI (15) | verde, verde, chihlimbar, roșu, roșu, apoi verde × 10 |
  | R1 (7) | alb, alb, roșu × 5 |
  | RA (10), RAI (10), instr (4), indicators (3), R2 (7), pilot (3) | roșu |
  | memory (2) | roșu pătrat, albastru pătrat |
  | pulses (2), overflow (2) | roșu, verde |
  | compute (2) | verde, verde |
  | uop (57), generator (6) | alb |
- Timpul: **51 200 timpi de cuvânt pe secundă** (1024 × 50). „Ca în 1962” = factorul 1; „rapid” = factorul **100**. Un cadru de animație nu avansează mai mult de **250 ms** reali și nu execută mai mult de **20 000** de instrucțiuni.
- Licențe: `// SPDX-License-Identifier: AGPL-3.0-or-later` în fiecare fișier C/JS/CSS și `<!-- SPDX… -->` în HTML; datele JSON (`web/data/*.json`, `web/programs/catalog.json`) sunt conținut **CC BY-SA 4.0**, cu atribuirile în `LICENSE-CONTINUT.md` (JSON nu are comentarii). Fonturile sunt sub **SIL OFL 1.1**, cu `OFL.txt` alături.
- Orice comportament de pupitru ales fără sursă se trece în `docs/semantica.md`, secțiunea nouă „Pupitrul web”, cu statutul GHICIT/DEDUS.
- `make check` rămâne verde pe gcc 7 și gcc 12 la fiecare commit.

## Review Focus

1. **Tab ascuns și apoi reluat** (Chrome oprește animația; primul cadru vine cu dt de minute): pagina nu trebuie să ruleze minute de mașină într-un cadru și să înghețe. → test `clamps a long frame` în Task 7.
2. **„Rapid” pe un program care nu se oprește niciodată** (bucla `T 0000`): pagina rămâne receptivă. → testele `api_max_instr_cap` (Task 1) și `caps instructions per frame` (Task 7).
3. **Vizitatorul apasă butoane în timp ce mașina rulează** (ANULEAZĂ RAI la mijlocul unei bucle): efectul se aplică între instrucțiuni, o singură dată, determinist. → test `applies queued actions between frames` în Task 7.
4. **Alt program încărcat peste unul care rulează**: rularea se oprește; mașina de scris, banda și becurile pornesc de la zero. → testele `api_load_resets` (Task 1) și `loading stops the run` (Task 7).
5. **Rulări lungi care tipăresc mult** (peste 64 KB): mașina de scris nu are voie să se oprească tăcut. → test `api_typed_take_drains_past_64k` în Task 1.

---

## Structura fișierelor

```
/home/bu/mecipt/
  Makefile                      # + ținte: wasm, site, serve, web-check
  .gitignore                    # + third_party/
  README.md                     # nou: ce e, cum se construiește și se rulează local
  core/api.h core/api.c         # fațada fără structuri pentru WASM (și pentru Planul 8)
  tools/fetch-wasi.sh           # descarcă și verifică wasi-sysroot 21 în third_party/wasi
  tools/dae_layout.py           # .dae → web/data/positions.json (Python 3.6)
  tools/check_art.py            # verifică liniile desenului pe textură + imagine suprapusă
  tests/test_api.c              # testele native ale fațadei
  tests/web/*.test.mjs          # teste Node pe module și pe .wasm-ul real
  tests/web/smoke.html          # scenariul din browser (rulat de tests/web-smoke.sh)
  tests/web-smoke.sh            # server local + Chrome headless; „SMOKE OK”
  web/
    package.json                # {"type":"module","private":true} — doar pentru Node
    index.html                  # pagina
    css/console.css             # pupitrul, perifericele, bara de comenzi moderne
    fonts/                      # BarlowSemiCondensed-Medium.ttf, CourierPrime-Regular.ttf, OFL-*.txt
    data/positions.json         # generat de dae_layout.py (comis)
    data/art-right.json art-left.json art-middle.json   # liniile, chenarele, inscripțiile
    data/lamp-colors.json       # tabelul de culori de mai sus
    programs/catalog.json       # programele oferite vizitatorului
    js/mecipt.js                # învelișul WASM (Node + browser)
    js/clock.js                 # timp real → timpi de tambur
    js/runner.js                # bucla de cadre: acțiuni, rulare, instantaneu
    js/bindings.js              # stare → becuri; control → acțiune
    js/glow.js                  # inerția filamentului (aprindere/stingere)
    js/panel.js                 # date de desen → SVG (șir)
    js/tape.js js/typewriter.js # modelele perifericelor (pure) + desenarea lor în DOM
    js/strings.js               # textele afișate (ro)
    js/app.js                   # leagă totul în pagină
```

`make site` asamblează `build/site/` (= `web/` fără `package.json`, plus `mecipt.wasm` și programele `.mec` copiate din `programs/` și `tests/data/`). `make serve` îl servește pe `http://127.0.0.1:8000/` cu `python3 -m http.server`. Codul încarcă `.wasm` cu `WebAssembly.instantiate(arrayBuffer)`, nu cu `instantiateStreaming`, ca să nu depindă de tipul MIME dat de server (Python 3.6 nu știe `application/wasm`).

---

### Task 1: Lanțul WASM și fațada `core/api`

**Files:**
- Create: `tools/fetch-wasi.sh`, `core/api.h`, `core/api.c`, `tests/test_api.c`
- Modify: `Makefile` (ținta `wasm`), `.gitignore` (`third_party/`)

**Interfaces:**
- Consumes: tot nucleul din Planul 1 (`mec_init`, `mec_load_image`, `mec_step`, `mec_program_parse`, `mec_tape_encode_words`, `mec_c_*`, `mec_uop_id`, `mec_variants_default`).
- Produces (`core/api.h`). `API` = `__attribute__((visibility("default")))` sub `__wasm__`, gol altfel. O singură mașină statică.
  - `API int api_init(void);` mașină nouă, variante implicite, tambur gol, bandă goală; 0.
  - `API char *api_buf(void); API int api_buf_size(void);` tampon de intrare de 65 536 octeți (text terminat cu 0, sau rânduri de bandă).
  - `API int api_load_program(void);` parsează `api_buf` ca `.mec`; **resetează** mașina, perifericele, contoarele de microoperații și de instrucțiuni; 0 sau −1 (motivul în `api_error()`).
  - `API const char *api_error(void);`
  - `API int api_set_tape_words(void);` parsează `api_buf` ca `.mec` și pune cuvintele, în ordinea adreselor, pe bandă (6 rânduri pe cuvânt); întoarce numărul de rânduri sau −1. `API int api_set_tape_rows(int n);` primii n octeți din `api_buf` = rânduri perforate (1 = gaură); n sau −1. Banda pornește de la poziția 0.
  - `API int api_tape_len(void); API int api_tape_pos(void); API const uint8_t *api_tape(void);`
  - `API int api_run(double until_ticks, double max_instr);` execută instrucțiuni cât timp `ticks < until_ticks` și numărul lor < `max_instr`; întoarce `mec_halt` (0 = `RUN_OK` când s-a terminat bugetul).
  - `API int api_step(void);` exact o instrucțiune (INSTRUCȚIE UNICĂ).
  - `API double api_ticks(void); API double api_instructions(void);`
  - `API uint32_t api_reg(int r);` cu `enum { API_REG_S, API_REG_I, API_REG_M, API_REG_RI, API_REG_RAI, API_REG_RA, API_REG_R1, API_REG_R2, API_REG_ALPHA, API_REG_BETA, API_REG_GAMMA, API_REG_PHASE, API_REG_DCR, API_REG_OPRIT, API_REG_HIRTIE, API_REG_STOP_ON_DCR }` (valorile 0…15, în această ordine).
  - `API const uint16_t *api_uops(void); API void api_uops_clear(void);` de câte ori s-a executat fiecare din cele 39 de microoperații de la ultima golire (saturat la 65 535).
  - `API int api_typed_take(void); API const char *api_out(void);` copiază în `api_out()` textul tipărit de la ultimul apel, golește tamponul mașinii de scris, întoarce numărul de octeți.
  - `API int api_console(int op, int arg);` 0 sau −1 pentru op necunoscut, cu `enum { API_C_SWITCHES_M = 1, API_C_SWITCHES_RAI, API_C_ANULEAZA_RAI, API_C_ANULEAZA_M, API_C_ANULEAZA_S, API_C_RA_IN_RI, API_C_M_IN_I, API_C_M_IN_RI, API_C_MEM_SCRIERE, API_C_MEM_CITIRE, API_C_INSTRUCTIA, API_C_DEPASIRE, API_C_OPRESTE }` (1…13). `API_C_OPRESTE` pune `oprit = 1` (comutatorul IMPULSURI — ÎNTRERUPE; GHICIT).
  - `API int api_prov(int addr); API const char *api_prov_source(int addr);` proveniența cuvântului (`mec_prov`) și textul-sursă ("" pentru `PROV_NONE`).
  - `API int api_uop_id(int grid, int row, int col);`

- [ ] **Step 1: `tools/fetch-wasi.sh`** descarcă cele două arhive din Global Constraints în `third_party/wasi/`, verifică sha256 (`sha256sum -c`), le dezarhivează, scrie `third_party/wasi/.ok`; nu face nimic dacă `.ok` există; iese ≠ 0 la sumă greșită. Adaugă `third_party/` în `.gitignore`.
- [ ] **Step 2: Scrie testele care pică** în `tests/test_api.c` (citește fișierele din `../programs/` și `../tests/data/`, ca testele existente):
  - `test_api_load_and_run_retiparire`: încarcă `retiparire-1962.mec`, `api_console(API_C_SWITCHES_RAI, 01477)`, `api_run(1e12, 1e6)` întoarce `HALT_STOP_INSTR`; `api_typed_take()` urmat de `api_out()` începe cu `"1477  27 0000  30 0000\n"` și are 39 de rânduri.
  - `test_api_load_error`: `"0000  99 0000  00 0000"` → `api_load_program() == -1`, iar `api_error()` conține `"linia 1"`.
  - `test_api_load_resets`: după o rulare parțială, o nouă încărcare dă `api_ticks() == 0`, `api_instructions() == 0`, `api_typed_take() == 0`, `api_tape_len() == 0`, toate `api_uops()[k] == 0`.
  - `test_api_run_respects_tick_budget`: cu retipărirea, `t0 = api_ticks()`; `api_run(t0 + 1024, 1e6)` întoarce `RUN_OK`, iar `t0 + 1024 <= api_ticks() < t0 + 1024 + 2 * 5120`.
  - `test_api_max_instr_cap`: programul `0000  T 0000  T 0000` (buclă); `api_run(1e12, 1000)` întoarce `RUN_OK` și `api_instructions() == 1000`.
  - `test_api_typed_take_drains_past_64k`: programul `0000  AC 0136  T 0000`; 140 de apeluri `api_run(1e12, 1000)`, fiecare urmat de `api_typed_take()`; suma octeților luați == numărul de instrucțiuni AC executate (70 000) > 65 536.
  - `test_api_uops_accumulate`: programul `0000  U 0002  O 0000` + `0002 = 0,5`; un `api_step()` → `api_uops()[16] == 1` („(ra)/2 trece în RA”); `api_uops_clear()` → toate 0.
  - `test_api_console_ops`: `API_C_SWITCHES_M` cu `0x2AAAAAAA` → `api_reg(API_REG_M) == 0x2AAAAAAA`; `API_C_SWITCHES_RAI` 0100 apoi `API_C_MEM_SCRIERE` → tamburul are M la 0100 (verificat cu `API_C_ANULEAZA_M` + `API_C_MEM_CITIRE`); `API_C_OPRESTE` → `api_reg(API_REG_OPRIT) == 1`; `api_console(99, 0) == -1`.
  - `test_api_tape_words_inex`: încarcă `inex1-preincarcator.mec`; `api_buf` ← `tests/data/inex-banda-3-cuvinte.mec`; `api_set_tape_words() == 18`; RAI ← 0010; `api_run(1e12, 5000)` întoarce `HALT_TAPE_JAM`, `api_tape_pos() == 18`, `api_reg(API_REG_HIRTIE) == 1`.
  - `test_api_provenance`: după retipărire, `api_prov(01477) == PROV_ORIGINAL`, `api_prov(01556) == PROV_RECONSTRUCTIE`, `api_prov(0) == PROV_NONE`, `api_prov_source(01477)` conține `"Facsimil 4"`.
- [ ] **Step 3: `make check`** — așteptat: eroare de compilare (`api.h` lipsește).
- [ ] **Step 4: Implementează `core/api.c`.** `api_run` și `api_step` instalează o urmă `mec_uop_trace` pentru fiecare pas, adună `ids` în contoare și golesc urma. `api_typed_take` copiază `io.typed[0..typed_len)` în `api_out` și pune `typed_len = 0`.
- [ ] **Step 5: `make check`** — așteptat: toate testele vechi plus cele 10 noi `OK`, pe gcc 7 și pe `make CC=gcc-12 clean check`.
- [ ] **Step 6: Ținta `make wasm`** → `build/mecipt.wasm`: rulează întâi `tools/fetch-wasi.sh`, apoi `$(WASM_CC) --target=wasm32-wasi --sysroot=third_party/wasi/wasi-sysroot -std=c11 -O2 -Wall -Wextra -Werror -Icore -nostartfiles -nodefaultlibs -Wl,--no-entry -Wl,--export-dynamic core/*.c -lc third_party/wasi/lib/wasi/libclang_rt.builtins-wasm32.a`, cu `WASM_CC ?= clang-17`. Așteptat: fără avertismente; `node -e` care listează exporturile arată toate funcțiile `api_*` și `memory`, iar importurile sunt doar `wasi_snapshot_preview1.{fd_close,fd_seek,fd_write}`.
- [ ] **Step 7: Commit** — `git add -A && git commit -m "api: fațada fără structuri + compilarea nucleului în WebAssembly (clang + wasi-sysroot)"`

---

### Task 2: Învelișul JavaScript `web/js/mecipt.js`

**Files:**
- Create: `web/package.json`, `web/js/mecipt.js`, `tests/web/mecipt.test.mjs`
- Modify: `Makefile` (ținta `web-check` rulează `node --test tests/web/` după `wasm`)

**Interfaces:**
- Consumes: exporturile `api_*` din Task 1.
- Produces:
  - `export async function loadMecipt(wasmBytes: ArrayBuffer|Uint8Array): Promise<Machine>` (apelează `api_init`).
  - `export const HALT = { OK: 0, STOP: 1, DCR: 2, TAPE_JAM: 3, UNKNOWN: 4, MANUAL: 5 }`; `export const OP = { SWITCHES_M: 1, SWITCHES_RAI: 2, ANULEAZA_RAI: 3, ANULEAZA_M: 4, ANULEAZA_S: 5, RA_IN_RI: 6, M_IN_I: 7, M_IN_RI: 8, MEM_SCRIERE: 9, MEM_CITIRE: 10, INSTRUCTIA: 11, DEPASIRE: 12, OPRESTE: 13 }`; `export const PROV = ['NONE', 'ORIGINAL', 'DEDUS', 'RECONSTRUCTIE', 'GHICIT']`.
  - `class Machine`, cu metodele:
    - `loadProgram(text)`: aruncă `Error(api_error())`.
    - `setTapeWords(text) → rows` și `setTapeRows(u8) → rows`; `tape() → Uint8Array` (copie); `tapePos()`.
    - `run(untilTicks, maxInstr) → halt` și `step() → halt`; `ticks()`, `instructions()`, `seconds()` (= ticks / 51 200).
    - `state() → {S, I, M, RI, RAI, RA, R1, R2, alpha, beta, gamma, phase, dcr, oprit, hirtie, stopOnDcr}`.
    - `takeMicroops() → Uint16Array(39)` (copie, apoi golire).
    - `takeTyped() → string` (UTF-8 decodat cu `TextDecoder` în modul `stream`).
    - `console(op, arg = 0)`: aruncă la −1.
    - `provenance(addr) → {kind, source}` și `provenanceSummary() → [{kind, source, words}]`: grupat după (kind, source), fără `NONE`, sortat descrescător după `words`.
    - `uopId(grid, row, col)`.

- [ ] **Step 1: Scrie testele care pică** în `tests/web/mecipt.test.mjs` (`node:test`, `node:assert/strict`; citește `build/mecipt.wasm` și programele din `programs/`):
  - `retipărirea își tipărește prima linie`: `takeTyped()` după `run(1e12, 1e6) === HALT.STOP` începe cu `"1477  27 0000  30 0000\n"`; `seconds()` între 110 și 120.
  - `eroarea de încărcare ajunge ca excepție`: `loadProgram("0000  99 0000  00 0000")` aruncă un mesaj care conține `"linia 1"`.
  - `state() citește registrele`: după `console(OP.SWITCHES_RAI, 0o1477)`, `state().RAI === 0o1477` și `state().phase === 1`.
  - `textul cu diacritice trece întreg`: programul `0000  U 0002  AC 0133` / `0001  O 0001  O 0001` / `0002 = o01400000000` (s0…s4 = 00011 → litera 3, „C”) dă `takeTyped() === "C"`. Același program cu `0002 = o00400000000` (litera 1, „Ă”) dă `"Ă"`, ceea ce verifică decodarea UTF-8 pe mai mulți octeți.
  - `rezumatul provenienței retipăririi`: `provenanceSummary()` conține `{kind: 'ORIGINAL', words: 39}` și o intrare `RECONSTRUCTIE` cu `words === 7`.
  - `takeMicroops golește`: după un pas, suma > 0; al doilea apel dă sumă 0.
  - `memoria crescută nu strică citirile`: după `exports.memory.grow(1)`, `takeTyped()` și `state()` încă merg (învelișul își reface vederile).
- [ ] **Step 2: `make web-check`** — așteptat: FAIL (`mecipt.js` lipsește).
- [ ] **Step 3: Implementează `web/js/mecipt.js`.** Șirurile intră prin `api_buf` (UTF-8, terminat cu 0, verificat față de `api_buf_size`, altfel aruncă). Șirurile C se citesc până la 0. Fără `fetch`: primește octeții, ca să meargă identic în Node și în browser.
- [ ] **Step 4: `make web-check`** — așteptat: toate `ok`.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "web: învelișul JavaScript al mașinii, testat în Node pe WASM-ul real"`

---

### Task 3: Pozițiile becurilor și comutatoarelor din modelul 3D

**Files:**
- Create: `tools/dae_layout.py`, `web/data/positions.json` (generat, comis), `tests/web/positions.test.mjs`
- Modify: `LICENSE-CONTINUT.md` (pozițiile derivă din modelul CC BY 4.0)

**Interfaces:**
- Consumes: `surse/3d/original-dae/source/extras/MECIPT-1_V4.dae` (nu e în git; unealta e reproductibilă pentru cine are modelul).
- Produces: `web/data/positions.json`:
  ```
  { "source": "...", "space": "texture px 2048x2048",
    "right": { "<group>": { "lamps": [[x,y],...], "switches": [[x,y],...] }, ... },
    "left":  { ... },
    "objects": { "<group>.lamps.<i>": "LED.034", ... } }
  ```
  Coordonatele sunt rotunjite la 0,1 px. Grupurile și ordinea lor sunt fixate de tabelul de mai jos.

**Proiecția** (nu rezultă din semnătură): toate nodurile sunt la rădăcină, cu matrice-lume. Pentru panoul `Right` sau `Left`, poziția obiectului (coloana de translație) se aduce în coordonatele locale ale planului (inversa matricei afine). Se alege triunghiul planului (`<triangles>` cu VERTEX și TEXCOORD) în care coordonatele baricentrice ale punctului (x, y) sunt cele mai puțin negative. UV-ul se interpolează, apoi `px = (u·2048, (1−v)·2048)`. Se păstrează obiectele cu |z local| < 0,3 și px în [−50, 2100]. Tipul obiectului = numele până la primul punct (`LED`, `Switch`, `Input_BIG`, …).

**Grupurile** (tip, regiune în px de textură, număr așteptat, ordine). Pe panoul drept, regiunea grupurilor de jos e `y 1320–1460`.

| Panou | Grup | `lamps` = LED | `switches` = Switch | Regiune | Ordine |
|---|---|---|---|---|---|
| right | M | 31 | 31 | becuri y 610–670, comutatoare y 675–725 | x ↑ |
| right | RI | 15 | — | y 840–890 | x ↑ |
| right | R1 | 7 | — | y 900–950, x < 1000 | x ↑ |
| right | RA | 10 | — | y 900–950, x ≥ 1000 | x ↑ |
| right | RAI | 10 | 10 | becuri y 1060–1120, comutatoare y 1125–1175; x < 850 | x ↑ |
| right | instr | 4 | 4 | aceleași y; 850 ≤ x < 1120 | x ↑ (INSTR. 1, INSTR. 2, TAMBUR, FERITE) |
| right | commands | — | 8 | y 1060–1120, x ≥ 1120 | x ↑ (ANULEAZA RAI … M+S 2) |
| right | memory | 2 | 2 | 500 ≤ x < 680 | x ↑ (SCRIERE, CITIRE) |
| right | pulses | 2 | 1 | 680 ≤ x < 860 | becurile după y ↑ |
| right | overflow | 2 | 2 | 860 ≤ x < 1080 | x ↑ (SE OPRESTE, NU SE OPRESTE) |
| right | indicators | 3 | — | 1080 ≤ x < 1370 | x ↑ (DCR, HIRTIA, OPRIT) |
| right | compute | 2 | 2 | x ≥ 1370 | x ↑ (AUTOMAT, INSTRUCTIE UNICA) |
| left | uop | 57 | — | y 600–860 | rândul (după y, 3 rânduri) apoi x ↑; indicele = rând·19 + coloană; coloanele 0–15 = grila ⎍, 16–18 = grila ⊔ |
| left | pilot | 3 | — | y 1090–1140 | x ↑ |
| left | generator | 6 | 3 | becuri y 1190–1240; comutatoare: cele 2 de la y 1050–1100, apoi cel de la y 1190–1240 | x ↑; plus `"knob": [x,y]` din `Input_BIG` |
| left | R2 | 7 | — | y 1320–1380 | x ↑ |

- [ ] **Step 1: Scrie testul care pică** `tests/web/positions.test.mjs`:
  - `fiecare grup are numărul de elemente al pupitrului`: numerele din tabel; total becuri dreapta 88, stânga 73; comutatoare dreapta 60, stânga 3.
  - `rândurile sunt ordonate`: x strict crescător în fiecare `lamps`/`switches` (în afară de `pulses.lamps`, ordonat după y).
  - `grila de microoperații are 3 rânduri de câte 19`: y-ul elementelor 0–18 < y-ul elementelor 19–37 < y-ul elementelor 38–56.
  - `becul M 0 e în stânga panoului și M 30 în dreapta`: `M.lamps[0][0] < 200` și `M.lamps[30][0] > 1850` (cifrele 0 și 30 de pe textură).
- [ ] **Step 2: `make web-check`** — așteptat: FAIL (fișierul lipsește).
- [ ] **Step 3: Implementează `tools/dae_layout.py`** (Python 3.6, doar biblioteca standard). La orice număr diferit de tabel se oprește cu cod 1 și listează ce a găsit. Generează `web/data/positions.json`.
- [ ] **Step 4: Verificare vizuală:** `python3 tools/dae_layout.py --overlay build/` desenează cercuri peste cele două texturi (`build/overlay-pozitii-{right,left}.png`, reduse la 1000 px). Așteptat: fiecare cerc stă pe un bec sau comutator din textură (verificat de cel care execută, cu Read pe imagine).
- [ ] **Step 5: `make web-check`** — așteptat: `ok`.
- [ ] **Step 6: Commit** — `git add -A && git commit -m "date: pozițiile becurilor și comutatoarelor proiectate din modelul 3D pe texturi"`

---

### Task 4: Desenul panoului drept și randarea SVG

**Files:**
- Create: `web/fonts/` (Barlow Semi Condensed Medium și Courier Prime, din `https://github.com/google/fonts/raw/main/ofl/barlowsemicondensed/BarlowSemiCondensed-Medium.ttf` și `…/ofl/courierprime/CourierPrime-Regular.ttf`, cu `OFL.txt` corespunzătoare), `web/data/art-right.json`, `web/data/lamp-colors.json`, `web/js/panel.js`, `tools/check_art.py`, `tests/web/panel.test.mjs`
- Modify: `LICENSE-CONTINUT.md` (fonturile OFL)

**Interfaces:**
- Consumes: `positions.json` (Task 3).
- Produces:
  - Formatul desenului `art-*.json`:
    ```
    { "viewBox": [x, y, w, h], "face": "#rrggbb",
      "items": [ {"t":"line","x1":..,"y1":..,"x2":..,"y2":..,"w":3},
                 {"t":"rect","x":..,"y":..,"w":..,"h":..,"sw":3},
                 {"t":"text","x":..,"y":..,"s":<px>,"text":"...","anchor":"start|middle|end","color":"ink|red"},
                 {"t":"screw","x":..,"y":..} ] }
    ```
    `viewBox` = partea vizibilă a panoului în textură. Pentru dreapta, aproximativ `[0, 370, 2048, 1340]`; se măsoară marginile reale.
  - `lamp-colors.json`: `{ "<group>": ["green"|"red"|"white"|"amber"|"blue", ...] }`, după tabelul din Global Constraints, plus `"shape": {"memory": "square"}`.
  - `export function renderPanel(side, art, positions, colors) → string` (un `<svg>` complet, `viewBox` din art). Fiecare bec e un `<g class="lamp" id="lamp-<group>-<i>" data-color="…">`, cu calota în gradient radial și un strat de lumină a cărui opacitate o setează pagina. Fiecare comutator e un `<g class="switch" id="switch-<group>-<i>" tabindex="0" role="button">`: bază cromată și pârghie, cu clasa `up`/`down`. Butonul rotativ e `id="knob"`. Fața panoului are o granulație discretă (`feTurbulence`, opacitate ≤ 0,06), ca emailul îmbătrânit din fotografie, fără să pară desen animat.
  - `export function lampIds(positions) → string[]` și `switchIds(positions) → string[]`.

- [ ] **Step 1: Scrie testele care pică** `tests/web/panel.test.mjs`:
  - `fiecare bec și comutator din pozițiile panoului drept apare o dată în SVG`: pentru fiecare id din `lampIds`/`switchIds` filtrate pe `right`, `svg.split('id="'+id+'"').length === 2`.
  - `culorile vin din tabelul fotografiei`: `lamp-M-0` are `data-color="green"`, `lamp-RI-2` are `amber`, `lamp-R1-0` are `white`, `lamp-RAI-0` are `red`; `lamp-memory-1` e `blue` și pătrat (`<rect`).
  - `inscripțiile lizibile sunt toate prezente`: textele din `art-right.json`, unite, conțin fiecare dintre `CODUL 2, CODUL 1, ADRESA 2, ADRESA 1, RA, RAI, ANULEAZA, INTRODUCE, ADUNARE, MEMORIE, SCRIERE, CITIRE, DEPASIT, CAPACITATEA, REGISTRULUI, HIRTIA, OPRIT, CALCULEAZA, AUTOMAT, INSTRUCTIE, UNICA`, plus numerele de la 0 la 30 ca texte separate.
  - `SVG-ul e bine format`: `<svg` deschis o dată, `</svg>` la final, fără `undefined`/`NaN` în șir.
- [ ] **Step 2: `make web-check`** — așteptat: FAIL.
- [ ] **Step 3: Trasează `art-right.json`** după `surse/3d/panouri-indreptate/panou-drept.png`: toate chenarele, liniile și inscripțiile, citite din decupaje mărite (`magick … -crop … -resize 200%`). Numerotările (0–30, 512…1, 64…1, 16…1) se pot genera cu un mic script din pozițiile becurilor, cu y-ul măsurat. Culoarea feței se ia ca mediana unei zone curate a texturii. Inscripțiile roșii (ADRESA 2, ponderile ei) au `"color":"red"`.
- [ ] **Step 4: Implementează `tools/check_art.py PANOU.png art.json [--overlay out.png]`**. Pentru fiecare `line` și pentru laturile fiecărui `rect` ia un punct la 4 px. Un punct „lovește” dacă în raza de 3 px există un pixel cu luminanța < mediana panoului − 40. Scorul unei linii = puncte lovite / puncte; iese cu cod 1 dacă vreo linie are scorul < 0,8 și le listează. `--overlay` desenează liniile (roșu) și textele (cu fontul Barlow, albastru) peste textura estompată, redusă la 1000 px.
- [ ] **Step 5: Rulează** `python3 tools/check_art.py surse/3d/panouri-indreptate/panou-drept.png web/data/art-right.json --overlay build/overlay-art-right.png`. Așteptat: cod 0. Imaginea suprapusă arată liniile și textele peste cele de pe textură; cel care execută o verifică cu Read.
- [ ] **Step 6: Implementează `web/js/panel.js`** (doar construiește șiruri, fără DOM, ca să meargă în Node).
- [ ] **Step 7: `make web-check`** — așteptat: `ok`.
- [ ] **Step 8: Commit** — `git add -A && git commit -m "pupitru: panoul drept redesenat vectorial după textură, cu becurile și comutatoarele la pozițiile din model"`

---

### Task 5: Panoul stâng și panoul din mijloc

**Files:**
- Create: `web/data/art-left.json`, `web/data/art-middle.json`
- Modify: `web/js/panel.js` (aparatele de măsură ale panoului din mijloc), `tests/web/panel.test.mjs`

**Interfaces:**
- Consumes: `renderPanel`, `positions.json`, `lamp-colors.json` (Task 4).
- Produces:
  - `art-left.json`, în formatul din Task 4. Celulele grilei ⎍/⊔ poartă inscripțiile din `inscriptii-pupitru.md` exact cum se văd pe textură. Celulele marcate `[?]` în transcriere rămân cu textul cel mai probabil și primesc `"uncertain": true`, randat ca `data-uncertain="1"` (folosit de ajutorul din Planul 4).
  - `art-middle.json`, cu `"viewBox": [0, 0, 2600, 1340]` și `"face": "#5b8fc9"` (albastrul din fotografia din 2011, măsurat; poate fi corectat după măsurătoare). Item-uri noi:
    - `{"t":"meter","id":"meter-<i>","x","y","r","style":"round-large|round|arc|small","needle":<grade>}`: 11 aparate. Rândul 1: 1 mare + 3 rotunde. Rândul 2: 4 cu scală în arc, inclusiv cel care lipsește azi, prezent în fotografia din 1961. Rândul 3: 3 mici.
    - `{"t":"knob","id":"selector"}`; `{"t":"rotary","id":"power"}`; `{"t":"toggle","id":"toggle-<i>"}` (2); `{"t":"fuse"}`; `{"t":"socket"}`.
    - Pozițiile se măsoară din fotografia din 2011 (panoul din mijloc ≈ x 1000–1830, y 390–800 din 2800 × 2200) și se scalează la viewBox. Cadranele au „V” și gradații fără cifre: scalele reale sunt necunoscute (GHICIT).
  - `renderPanel('middle', …)` randează aceste item-uri. Acele stau la unghiul fix din date.

- [ ] **Step 1: Scrie testele care pică** în `tests/web/panel.test.mjs`:
  - `panoul stâng: 57 de becuri de microoperații, R2, generatorul`: toate id-urile din `positions.left` apar o dată; `lamp-uop-0` e `white`, `lamp-R2-0` e `red`.
  - `grila stângă are inscripțiile panoului`: textele din `art-left.json` conțin `Muta RAI` sau `Mută RAI` (cum apare pe textură), `GENERATOR PRINCIPAL`, `IMPULSURI`, `FRECVENTA` sau `FRECVENȚĂ`, iar celula col. 16 rândul 1 conține `RAI`.
  - `panoul din mijloc are 11 aparate`: exact 11 `id="meter-`, cu `id="selector"` și `id="power"` prezente.
- [ ] **Step 2: `make web-check`** — așteptat: FAIL.
- [ ] **Step 3: Trasează `art-left.json`** după `panou-stang.png` și verifică cu `python3 tools/check_art.py surse/3d/panouri-indreptate/panou-stang.png web/data/art-left.json --overlay build/overlay-art-left.png` — așteptat: cod 0, imaginea verificată cu Read.
- [ ] **Step 4: Măsoară și scrie `art-middle.json`; extinde `panel.js`.** Verificare: `inkscape --export-type=png` (sau Chrome headless) pe SVG-ul randat (scris de un mic script Node în `build/middle.svg`), pus alături de decupajul fotografiei. Cel care execută compară cele două cu Read.
- [ ] **Step 5: `make web-check`** — așteptat: `ok`.
- [ ] **Step 6: Commit** — `git add -A && git commit -m "pupitru: panoul stâng (microoperații, R II, generator) și panoul din mijloc (aparatele de măsură)"`

---

### Task 6: Legăturile pupitru ↔ mașină și inerția becurilor

**Files:**
- Create: `web/js/bindings.js`, `web/js/glow.js`, `tests/web/bindings.test.mjs`
- Modify: `docs/semantica.md` (secțiunea nouă „Pupitrul web”)

**Interfaces:**
- Consumes: `Machine.state()`, `OP` (Task 2); id-urile `lamp-<group>-<i>` / `switch-<group>-<i>` (Task 4); `uopId` (Task 2).
- Produces:
  - `export function lampTargets(snap, ui, uopIndex) → Map<string, number>`: ținta 0/1 pentru fiecare bec.
    - `snap` = `{state, uops, memFlash: {write: bool, read: bool}}` (un `Snapshot` din Task 7). `ui` = `{mode: 'idle'|'automat'|'unic', pulsesOff: bool}`.
    - `uopIndex` = tabloul de 57 de elemente din `uopIndexForGrid(machine)`.
  - Regulile `lampTargets`:
    - `M[i] = (M >>> (30 − i)) & 1`.
    - `RI[0..4]` = biții 4…0 ai codului (`RI >> 10`). `RI[5..14]` = biții 9…0 ai adresei.
    - `R1`/`R2` = biții 6…0. `RA`/`RAI` = biții 9…0.
    - `instr` = `[phase == 1, phase == 2, 1, 0]`.
    - `indicators` = `[dcr, hirtie, oprit]`.
    - `overflow` = `[stopOnDcr, !stopOnDcr]`.
    - `compute` = `[mode == 'automat', mode == 'unic']`.
    - `pulses` = `[pulsesOff, !pulsesOff]`.
    - `memory` = `[snap.memFlash.write, snap.memFlash.read]`.
    - `uop[k] = uops[uopIndex[k]] > 0` (celulele fără inscripție, `uopIndex[k] = −1`, rămân 0).
    - `generator` = `[1, 0, 1, 0, 1, 0]`. `pilot` = `[0, 0, 0]`.
  - `export function uopIndexForGrid(machine) → Int8Array(57)`: k = rând·19 + col; `col < 16` → `uopId(0, rând+1, col+1)`, altfel `uopId(1, rând+1, col−15)`.
  - `export function actionFor(switchId, switches) → {op, arg} | {ui: '…'} | null`.
    - `switches` = starea pârghiilor persistente: `{M: Uint8Array(31), RAI: Uint8Array(10)}`.
    - `switch-M-i`: comută bitul și întoarce `{op: SWITCHES_M, arg: cuvântul}`.
    - `switch-RAI-i`: analog, `{op: SWITCHES_RAI, arg}`.
    - `switch-commands-0…5` → `ANULEAZA_RAI`, `ANULEAZA_M`, `ANULEAZA_S`, `RA_IN_RI`, `M_IN_I`, `M_IN_RI`.
    - `switch-commands-6/7` (ADUNARE 1, M+S 2) → `null` (funcție necunoscută).
    - `switch-instr-0/1` → `{op: INSTRUCTIA, arg: 1|2}`. `switch-instr-2/3` → `null`.
    - `switch-memory-0/1` → `MEM_SCRIERE` / `MEM_CITIRE`.
    - `switch-overflow-0/1` → `{op: DEPASIRE, arg: 1|0}`.
    - `switch-pulses-0` → `{ui: 'toggle-pulses'}`.
    - `switch-compute-0/1` → `{ui: 'automat'}` / `{ui: 'unic'}`.
    - `switch-generator-*` și `knob` → `null`.
  - `export function isMomentary(switchId) → bool`: adevărat pentru `commands`, `instr`, `memory`, `overflow`, `compute` (pârghia revine după 150 ms); fals pentru `M`, `RAI`, `pulses`.
  - `export function glowStep(b, target, dtMs) → number`: `b + (target − b)·(1 − e^(−dt/τ))`, cu τ = 25 ms la aprindere și 70 ms la stingere (GHICIT: inerția unui filament mic).

- [ ] **Step 1: Scrie testele care pică** `tests/web/bindings.test.mjs` (pe WASM-ul real pentru `uopIndexForGrid`):
  - `M 0 e semnul`: `state.M = 0x40000000` → `lamp-M-0` = 1, `lamp-M-1` = 0. `state.M = 1` → `lamp-M-30` = 1.
  - `RI desparte codul de adresă`: `RI = (0o27 << 10) | 0o1477` → becurile RI pentru codul 10111₂ și adresa 1100111111₂.
  - `INSTRUCTIA 1/2 urmează faza`: `phase = 2` → `lamp-instr-1` = 1 și `lamp-instr-0` = 0.
  - `becul de microoperație se aprinde la folosire`: `uopIndex` din mașină; `uops[16] = 1` → becul cu `uopIndex[k] === 16` e 1, iar ceilalți 0. Celula fără inscripție (`uopIndex[k] === -1`) rămâne 0.
  - `comutatorul RAI 0 e ponderea 512`: `actionFor('switch-RAI-0', sw)` → `{op: OP.SWITCHES_RAI, arg: 512}`; încă o dată → `arg: 0`.
  - `comutatoarele M pun cuvântul întreg`: după `switch-M-30` și `switch-M-0` → `arg === 0x40000001`.
  - `butoanele cu funcție necunoscută nu fac nimic`: `actionFor('switch-commands-6', sw) === null`.
  - `inerția`: `glowStep(0, 1, 25) ≈ 0.632` (±0,01); `glowStep(1, 0, 70) ≈ 0.368`; `glowStep(0.5, 0.5, 100) === 0.5`.
- [ ] **Step 2: `make web-check`** — așteptat: FAIL.
- [ ] **Step 3: Implementează `bindings.js` și `glow.js`.**
- [ ] **Step 4: Scrie în `docs/semantica.md` secțiunea „Pupitrul web”**, un tabel cu statutul fiecărei alegeri:
  - pârghia sus = 1 (GHICIT);
  - care comutatoare sunt momentane (GHICIT);
  - ADUNARE 1, M+S 2, MEMORIE FERITE și generatorul nu au efect (GHICIT; funcție necunoscută);
  - IMPULSURI ÎNTRERUPE = oprire, cu OPRIT aprins (GHICIT);
  - becurile MEMORIE clipesc la scriere/citire (GHICIT);
  - becurile generatorului sunt fixe, iar cele trei becuri-martor stinse (GHICIT);
  - culorile becurilor (SIGUR, fotografia din 2011);
  - inerția (GHICIT).
- [ ] **Step 5: `make web-check`** — așteptat: `ok`.
- [ ] **Step 6: Commit** — `git add -A && git commit -m "pupitru: legăturile becuri/comutatoare ↔ mașină și inerția filamentelor"`

---

### Task 7: Ceasul și bucla de cadre

**Files:**
- Create: `web/js/clock.js`, `web/js/runner.js`, `tests/web/runner.test.mjs`

**Interfaces:**
- Consumes: `Machine` (Task 2).
- Produces:
  - `export const TICKS_PER_SECOND = 51200; export const SPEEDS = { epoca: 1, rapid: 100 }; export const MAX_FRAME_MS = 250; export const MAX_INSTR_PER_FRAME = 20000;`
  - `export class Clock { constructor(speed = 'epoca'); setSpeed(name); target(machineTicks, dtMs) → untilTicks; reset(machineTicks) }`. Ținta crește cu `min(dt, 250) · 51,2 · factor`. Dacă mașina a depășit ținta (o instrucțiune lungă), ținta nu scade. `reset` aliniază ținta la mașină, ca să nu se adune „datorie” cât mașina stă.
  - `export class Runner { constructor(machine, clock); machine; clock; enqueue(action); frame(dtMs) → Snapshot; load(programText, tapeText|null, startRai); mode; pulsesOff }`.
    - `Snapshot` = `{state, uops: Uint16Array(39), typed: string, tapePos, halted: HALT|null, memFlash: {write, read}}`.
    - `frame` aplică întâi acțiunile din coadă, în ordine:
      - `{op, arg}` → `machine.console`; `MEM_SCRIERE`/`MEM_CITIRE` aprind și `memFlash`;
      - `{ui: 'automat'}` → `mode = 'automat'` și `clock.reset`;
      - `{ui: 'unic'}` → un `machine.step()` și `mode = 'unic'`;
      - `{ui: 'toggle-pulses'}` → `pulsesOff = !pulsesOff`; la oprire, `console(OP.OPRESTE)` și `mode = 'idle'`.
    - Apoi, dacă `mode === 'automat'` și impulsurile nu sunt oprite: `machine.run(clock.target(…), MAX_INSTR_PER_FRAME)`. La orice oprire ≠ `OK`, `mode = 'idle'` și `halted` = codul.
    - La final strânge `takeMicroops()` și `takeTyped()`.
    - `load` oprește rularea (`mode = 'idle'`), încarcă programul și banda și pune comutatoarele RAI pe `startRai` (`console(SWITCHES_RAI)`).

- [ ] **Step 1: Scrie testele care pică** `tests/web/runner.test.mjs` (WASM real, retipărirea de la 1477):
  - `ca în 1962: o secundă de cadre = o secundă de mașină`: o mașină separată face `run(51200, 1e9)` → n₀ instrucțiuni. Runner-ul, după `enqueue({ui: 'automat'})` și 60 de cadre a câte 1000/60 ms, are `|instructions() − n₀| ≤ 2`.
  - `rapid termină retipărirea în cel mult 200 de cadre`: viteza `rapid`, cadre de 16 ms până la `halted === HALT.STOP`; textul strâns din `typed` are 39 de rânduri.
  - `clamps a long frame`: un cadru de 600 000 ms la viteza epocii avansează mașina cu cel mult 250 ms (`seconds()` ≤ 0,25 + 0,2).
  - `caps instructions per frame`: bucla `0000  T 0000  T 0000` la `rapid`, un cadru de 250 ms → `instructions() <= 20000`.
  - `applies queued actions between frames`: programul `0000  O 0000  O 0000` / `0100  T 0100  T 0100`, pornit în automat de la 0100. Bucla rulează 5 cadre fără oprire. Apoi `enqueue({op: OP.ANULEAZA_RAI})`, iar următorul cadru întoarce `halted === HALT.STOP` cu `state().RAI === 0`.
  - `INSTRUCȚIE UNICĂ execută exact una`: `enqueue({ui: 'unic'})`, un cadru → `instructions() === 1`, `mode === 'unic'`.
  - `IMPULSURI ÎNTRERUPE oprește și aprinde OPRIT`: în automat, `enqueue({ui: 'toggle-pulses'})` → `state().oprit === 1`, iar cadrele următoare nu mai cresc `instructions()`.
  - `loading stops the run`: în automat, `load(inex, banda, 0o10)` → `mode === 'idle'`, `typed === ''` la cadrul următor, `tapePos === 0`.
- [ ] **Step 2: `make web-check`** — așteptat: FAIL.
- [ ] **Step 3: Implementează `clock.js` și `runner.js`.**
- [ ] **Step 4: `make web-check`** — așteptat: `ok`.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "web: ceasul de tambur și bucla de cadre (viteza epocii / rapid, acțiuni între instrucțiuni)"`

---

### Task 8: Cititorul de bandă și mașina de scris

**Files:**
- Create: `web/js/tape.js`, `web/js/typewriter.js`, `tests/web/periph.test.mjs`

**Interfaces:**
- Consumes: `Snapshot.tapePos`, `Snapshot.typed`, `Machine.tape()`.
- Produces:
  - `export function tapeWindow(rows: Uint8Array, pos, before = 8, after = 24) → [{index, holes: [5 bool], read: bool}]`. Rândurile `pos−before … pos+after−1` (capetele lipsă = `null`). `holes[c]` = bitul `4−c` (canalul 1 = bitul cel mai semnificativ; GHICIT). `read` = `index < pos`.
  - `export function renderTape(el, rows, pos, smoothPos)`: SVG cu banda de hârtie gălbuie. Canalele sunt așezate 1 · 2 · ghidaj · 3 · 4 · 5 (DEDUS din banda telex: ghidajul are 2 canale pe o parte și 3 pe cealaltă). Fereastra cititorului e fixă, iar banda alunecă spre stânga cu `smoothPos` interpolat.
  - `export class Sheet { constructor(cols = 72, keepLines = 200); add(text); lines() → string[]; cursor() → {line, col} }`.
    - Un caracter înseamnă un punct de cod (`Array.from`). `\n` mută rândul. La coloana 72 se trece pe rândul următor (GHICIT: marginea mașinii de scris).
    - Se păstrează ultimele 200 de rânduri.
  - `export function renderSheet(el, sheet)`: coala albă cu Courier Prime, rândul curent cu caruciorul (un marcaj la `cursor`), derulată ca hârtia ieșind din mașină.

- [ ] **Step 1: Scrie testele care pică** `tests/web/periph.test.mjs`:
  - `fereastra benzii marchează ce s-a citit`: rândurile `[0b10000, 0b00001, 0b11111]`, `pos = 1`, `before = 1`, `after = 2` → `[{index: 0, holes: [true, false, false, false, false], read: true}, {index: 1, holes: [false, false, false, false, true], read: false}]`.
  - `capetele benzii sunt goale`: `pos = 0`, `before = 2` → primele două elemente `null`.
  - `coala trece la rând nou`: `add("ab\ncd")` → `lines() == ["ab", "cd"]`, `cursor() == {line: 1, col: 2}`.
  - `diacriticele ocupă o coloană`: `add("ȘȚ")` → `cursor().col === 2`.
  - `marginea`: 73 de caractere `x` → două rânduri, de 72 și de 1 caracter.
  - `coala păstrează 200 de rânduri`: 250 de `\n` → `lines().length === 200`.
- [ ] **Step 2: `make web-check`** — așteptat: FAIL.
- [ ] **Step 3: Implementează** modelele pure; funcțiile `render*` doar construiesc și actualizează DOM-ul dat. La import nu ating `document`, ca testele Node să le poată importa.
- [ ] **Step 4: `make web-check`** — așteptat: `ok`.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "web: cititorul de bandă și coala mașinii de scris (modele + desen)"`

---

### Task 9: Pagina, site-ul și verificarea în browser

**Files:**
- Create:
  - `web/index.html`, `web/css/console.css`, `web/js/strings.js`, `web/js/app.js`
  - `web/programs/catalog.json`
  - `tests/web/smoke.html`, `tests/web-smoke.sh`
  - `README.md`
- Modify:
  - `Makefile` (ținte `site`, `serve`; `web-check` rulează și `tests/web-smoke.sh`)
  - `LICENSE-CONTINUT.md`

**Interfaces:**
- Consumes: tot ce e mai sus.
- Produces:
  - **`catalog.json`:**
    ```
    [ {"id": "retiparire-1962", "file": "retiparire-1962.mec", "tape": null, "start": "1477",
       "title": "Retipărirea programelor (6 septembrie 1962)"},
      {"id": "inex1", "file": "inex1-preincarcator.mec", "tape": "inex-banda-3-cuvinte.mec", "start": "0010",
       "title": "Preîncărcătorul INEX-1 (cu o bandă de test de 3 cuvinte)"} ]
    ```
    Prima intrare e programul implicit.
  - **Pagina:** o bară îngustă de comenzi moderne deasupra pupitrului, clar separată de replica lui:
    - titlul „MECIPT-1 — pupitrul de comandă”;
    - alegerea programului;
    - eticheta de proveniență din `provenanceSummary()`, de forma „ORIGINAL — Facsimil 4, Baltac: 39 de cuvinte · RECONSTRUCȚIE — …: 7”, plus „bandă de test (GHICIT)” când e cazul;
    - viteza „ca în 1962 / rapid”;
    - „Reîncarcă”;
    - un rând de îndrumare: „Apăsați CALCULEAZA — AUTOMAT pe panoul din dreapta”.
  - **Pupitrul:** cele trei SVG-uri în rând, cu proporțiile lățimilor stâng : mijloc : drept = 2048 : 2600 : 2048, într-un cadru de aluminiu (gradient cenușiu) pe corpul albastru al mesei. Dedesubt, cititorul de bandă (stânga) și mașina de scris (dreapta), ca aparate separate. Pe ecrane înguste, pagina se derulează pe orizontală (aranjarea pentru telefon vine în Planul 7).
  - **Interacțiune:** click sau Enter/Space pe un comutator → `actionFor` → `runner.enqueue`; pârghia se mișcă (`up`/`down`), iar cele momentane revin după 150 ms. Comutatoarele RAI pornesc în poziția adresei de start a programului.
  - **Bucla:** `requestAnimationFrame` → `runner.frame(dt)` → `lampTargets` → `glowStep` → opacitatea stratului de lumină al fiecărui bec; banda și coala se actualizează la fiecare cadru.
  - `window.__pupitru = { runner, ready: Promise, select(programId), setSpeed(name) }`, ca smoke-testul să poată conduce pagina.
  - Comenzile panoului din mijloc (selector, alimentare, comutatoarele mici) au clasa `decor`, nu `switch`, și nu fac nimic.
  - **`make site`:** `build/site/` = `web/` fără `package.json`, cu `build/mecipt.wasm`, `programs/*.mec` și `tests/data/inex-banda-3-cuvinte.mec` în `build/site/programs/`.
  - **`make serve`:** `cd build/site && python3 -m http.server 8000 --bind 127.0.0.1`.
  - **`tests/web-smoke.sh`:**
    - copiază `tests/web/smoke.html` în `build/site/test/`;
    - pornește serverul pe un port liber, rulează `google-chrome --headless=new --no-sandbox --disable-gpu --virtual-time-budget=30000 --dump-dom …/test/smoke.html` și caută `SMOKE OK`;
    - face o captură `--screenshot=build/pupitru.png --window-size=1600,1000` a `index.html`;
    - oprește serverul (după PID, nu cu `pkill -f`);
    - fără Chrome, scrie `SKIP smoke (fără Chrome)` și iese cu 0.

- [ ] **Step 1: Scrie `tests/web/smoke.html` (testul care pică).** Încarcă `../index.html` într-un iframe de 1600 × 1000, așteaptă `__pupitru.ready` și verifică:
  1. sunt 161 de elemente `.lamp` și 63 de elemente `.switch` (60 + 3);
  2. eticheta de proveniență conține `ORIGINAL` și `39`;
  3. cu viteza `rapid`, un click sintetic pe `#switch-compute-0` duce, în ≤ 20 s virtuale, la o coală al cărei prim rând e `1477  27 0000  30 0000` și la becul `lamp-indicators-2` (OPRIT) aprins (opacitate > 0,5);
  4. după `__pupitru.select('inex1')` și CALCULEAZA AUTOMAT, becul `lamp-indicators-1` (HIRTIA AGATATA) e aprins și `__pupitru.runner.machine.tapePos() === 18`;
  5. `window.onerror` din iframe nu a prins nimic.

  Rezultatul se scrie în `<p id="result">` ca `SMOKE OK` sau `SMOKE FAIL: <care>`.
- [ ] **Step 2: `make web-check`** — așteptat: `SMOKE FAIL` (pagina lipsește).
- [ ] **Step 3: Implementează** `index.html`, `console.css`, `strings.js` și `app.js`, apoi țintele `site`/`serve`. `catalog.json` se comite. Fonturile se declară cu `@font-face` din `fonts/`.
- [ ] **Step 4: `make web-check`** — așteptat: testele Node `ok` și `SMOKE OK`. Captura `build/pupitru.png` e verificată cu Read și comparată cu fotografia din 2011: trei panouri pe masa albastră, becurile și comutatoarele la locul lor, banda și coala dedesubt. Dacă ceva arată „de joc” (culori saturate, forme rotunjite de jucărie, umbre exagerate), se corectează în `console.css`/`panel.js` înainte de commit.
- [ ] **Step 5: `README.md`:**
  - ce e proiectul și starea lui (Planul 1 nucleu, Planul 2 pupitru);
  - cum se construiește (`make check`, `make site`, `make serve`), cerințele (gcc, clang ≥ 17, Node 20 pentru teste, Chrome pentru smoke) și faptul că `make wasm` descarcă wasi-sysroot (≈ 5 MB);
  - licențele.

  În `LICENSE-CONTINUT.md` se trec datele JSON și programele din catalog.
- [ ] **Step 6: `make check && make web-check`** — așteptat: ambele cu cod 0.
- [ ] **Step 7: Commit** — `git add -A && git commit -m "web: pagina pupitrului — panourile vii, banda, mașina de scris, programele originale, verificată în Chrome"`

---

## Ce nu intră în acest plan (rămâne în foaia de drum)
Atelierul (Planul 3), ajutorul și engleza (4), sunetul (5), programele reconstruite (6), aranjarea pentru telefon, modul offline și publicarea (7), interfețele wx/ncurses (8), vederea 3D (9). Pagina din acest plan e completă pentru vederea Pupitru pe un ecran de calculator.
