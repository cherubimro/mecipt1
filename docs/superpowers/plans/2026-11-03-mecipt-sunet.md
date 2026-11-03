# Sunetul (Planul 5) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sunet sintetizat în browser care urmează mașina emulată — zumzetul tamburului, țăcănitul cititorului, clapele și carul mașinii de scris, clicurile comenzilor pupitrului, bâzâit estompat la ritm mare — cu buton 🔊/🔇 ținut minte.

**Architecture:** Trei module noi sub `web/js/sound/`: `planner.js` (pur, testat în Node: din ce s-a întâmplat într-un cadru → evenimente sonore așezate în timp și starea bâzâitului), `engine.js` (Web Audio: sinteza fiecărui sunet, cu `AudioContext` injectabil), `page.js` (butonul, preferința, deblocarea la primul gest, legătura cu bucla de cadre și cu `press()`). Nucleul C nu se schimbă.

**Tech Stack:** JS modul ES (fără dependențe), Web Audio API, `node --test`, testul de fum din Chrome fără ecran.

**Spec:** `docs/superpowers/specs/2026-11-03-sunet-design.md` (pornește de la `docs/2026-11-02-emulator-mecipt1-design.md` §3.5).

## Global Constraints
- Fără dependențe noi, fără fișiere audio; codul AGPL-3.0-or-later (antet SPDX ca în celelalte module), comentariile în română.
- Nucleul C și WASM nu se schimbă.
- „Pornit implicit”: dacă vizitatorul n-a ales 🔇, sunetul începe la primul gest (regula browserelor). Cheia `localStorage`: `mecipt.sound`, valori `'on'`/`'off'`; stocarea blocată → pornit.
- Fără bipuri sau tonuri electronice; clicurile comenzilor mai încete decât sunetele mașinii; bâzâitul mai încet decât clicurile.
- Fără `AudioContext` (sau blocat): pagina merge identic, butonul e 🔇, `disabled`, cu explicația în `title`.
- Bara modernă și Atelierul nu fac clic; în modul Explică comenzile nu fac clic (`press()` nu e chemat acolo).
- `make check` și `make web-check` rămân verzi.

## Review Focus
- Tab ascuns minute întregi, apoi reluat: fără rafală de clicuri și fără zumzet cât e ascuns → planner-ul limitează `dtMs` la `MAX_FRAME_MS` și plafonează clicurile pe cadru; `page.js` coboară volumul la `visibilitychange` (test: `planner: un cadru uriaș nu dă rafală`).
- Bandă nouă sau program reîncărcat (`tapePos` scade): nu se aud clicuri „negative” și bâzâitul se oprește (test: `planner: tapePos care scade = reset`).
- Comutare 🔇 în timpul bâzâitului: liniște imediată, iar la 🔊 nu revine un bâzâit vechi dacă banda nu mai citește (test: `engine: dezactivat taie bâzâitul`).
- Program care citește rar la „rapid” (o citire la câteva secunde): rămâne țăcănit (test: `planner: rar la rapid rămâne clic`).
- Butonul de sunet apăsat ca prim gest: deblochează și aplică alegerea, fără să pornească sunetul când alegerea e 🔇 (test în fum: `sunet`).

---

### Task 1: Planificatorul (pur)

**Files:**
- Create: `web/js/sound/planner.js`
- Test: `tests/web/sound-planner.test.mjs`

**Interfaces:**
- Consumes: `MAX_FRAME_MS` din `web/js/clock.js`.
- Produces:
  - `export const BUZZ_ON = 40, BUZZ_OFF = 25` (evenimente pe secundă reală), `RATE_TAU_MS = 100`, `MAX_CLICKS_PER_FRAME = 8`, `LOOKAHEAD_S = 0.05`.
  - `export class Planner { constructor(); reset(); frame({ t, dtMs, tapePos, typed }) → { events: Array<{ t: number, kind: 'tape'|'key'|'carriage' }>, buzz: { tape: boolean, type: boolean } } }`. `t` = timpul audio curent în secunde (`ctx.currentTime`), `typed` = textul nou al cadrului (`snap.typed`, poate fi `''`/`null`).

Reguli (din spec §4.1 și §6):
- rânduri noi = `tapePos − ultimul tapePos`; prima chemare după `reset()`, sau un `tapePos` mai mic decât ultimul, doar reține poziția (0 rânduri) și oprește bâzâitul benzii.
- caractere: `'\n'` → `carriage`, orice alt caracter → `key`.
- ritmul fiecărei surse: `rate += (n / dt_s − rate) · (1 − exp(−dtMs / RATE_TAU_MS))`, cu `dtMs` limitat la `[1, MAX_FRAME_MS]`. Bâzâitul pornește când `rate > BUZZ_ON`, se oprește când `rate < BUZZ_OFF` (histerezis).
- cât bâzâie o sursă, ea nu dă evenimente individuale; altfel cele `n` evenimente (cel mult `MAX_CLICKS_PER_FRAME`, păstrându-le pe ultimele) se așază uniform: `t + LOOKAHEAD_S + (dtMs/1000) · i / n`.

- [ ] **Step 1: Write the failing tests** — `tests/web/sound-planner.test.mjs`, cu un ajutor `run(p, seconds, perSecond, kind, fps = 60)` care cheamă `frame` la 1000/fps ms, crescând `tapePos` (sau adăugând `'x'` la `typed`) cu ritmul dat (acumulator fracționar):
  - `planner: ca în 1962 (10 rânduri/s) dă câte un clic pe rând, fără bâzâit` — 3 s → 30 de evenimente `tape` (±1), `buzz.tape` niciodată adevărat.
  - `planner: rapid (1000 rânduri/s) bâzâie în 0,2 s și nu mai dă clicuri` — după 0,2 s `buzz.tape === true`; în cadrele de după, 0 evenimente `tape`.
  - `planner: bâzâitul se stinge în 0,5 s după ultima citire` — după 1 s la 1000/s, apoi cadre fără rânduri: `buzz.tape === false` înainte de 0,5 s.
  - `planner: rar la rapid rămâne clic` — câte un rând la 2 s, 10 s: 5 evenimente, niciun bâzâit.
  - `planner: evenimentele unui cadru se întind pe durata lui` — după un cadru de amorsare, un cadru de 100 ms cu 4 rânduri la `t = 10`: timpii `10.05, 10.075, 10.1, 10.125`.
  - `planner: un cadru uriaș nu dă rafală` — `dtMs = 600000`, 50 de rânduri: cel mult `MAX_CLICKS_PER_FRAME` evenimente, toate în `[t, t + LOOKAHEAD_S + MAX_FRAME_MS/1000]`.
  - `planner: tapePos care scade = reset` — după bâzâit, `tapePos` 0: 0 evenimente, `buzz.tape === false`.
  - `planner: rândul nou e carul` — `typed = 'AB\nC'` → kinds `key,key,carriage,key`.
  - `planner: reset() oprește ambele bâzâituri`.

- [ ] **Step 2: Run to verify they fail**
  Run: `node --test tests/web/sound-planner.test.mjs`
  Expected: FAIL — `Cannot find module .../web/js/sound/planner.js`

- [ ] **Step 3: Implement `Planner` in `web/js/sound/planner.js`** after the rules above.

- [ ] **Step 4: Run to verify they pass**
  Run: `node --test tests/web/sound-planner.test.mjs`
  Expected: PASS 9/9

- [ ] **Step 5: Commit**
  `git add web/js/sound/planner.js tests/web/sound-planner.test.mjs && git commit -m "sunet: planificatorul — evenimente din cadru, bâzâit după ritm"`

### Task 2: Motorul (Web Audio)

**Files:**
- Create: `web/js/sound/engine.js`
- Test: `tests/web/sound-engine.test.mjs` (cu un `FakeAudioContext` în fișierul de test: noduri care țin minte `connect`, `start(t)`, `stop(t)`, valorile `AudioParam` și programările `setValueAtTime`/`linearRampToValueAtTime`/`setTargetAtTime`/`cancelScheduledValues`)

**Interfaces:**
- Consumes: nimic din alte task-uri (kind-urile `tape|key|carriage` sunt cele din Task 1).
- Produces:
  - `export const LEVELS = { hum, tape, key, carriage, button, lever, buzzTape, buzzType }` (câștiguri 0–1), cu `button, lever < min(tape, key)`, `buzzTape < tape`, `buzzType < key`, `hum ≤ 0.06`.
  - `export const HUM_HZ = 50`.
  - `export class SoundEngine { constructor({ createContext = () => new (globalThis.AudioContext || globalThis.webkitAudioContext)() } = {}); get available(): boolean; get enabled(): boolean; unlock(): boolean /* creează/reia contextul; false dacă nu se poate */; setEnabled(on: boolean); setHidden(hidden: boolean); now(): number; play(kind: 'tape'|'key'|'carriage'|'button'|'lever', t?: number); buzz({ tape: boolean, type: boolean }, t?: number); stopAll() /* oprește sunetele programate și bâzâitul, nu zumzetul */ }`.

Hotărâri: un nod master cu câștigul 1 (pornit și vizibil) sau 0; oprirea → rampă de 30 ms la 0; pornirea și revenirea în tab → rampă de 1 s pentru zumzet. Zumzetul: oscilatoare la 50, 100, 150 Hz cu câștiguri descrescătoare plus zgomot filtrat trece-bandă jos (lagărul), pornite o singură dată la `unlock`. Clicurile: un tampon de zgomot scurt partajat, filtrat diferit pe kind (tape: avans + citire, două impulsuri la ~12 ms; key: impact ~6 ms; carriage: frecare ~120 ms + oprire; button: impuls scurt înalt; lever: două impulsuri apropiate, mai jos). Bâzâitul: zgomot în buclă, filtrat, cu câștig rampat la `LEVELS.buzz*` sau 0. Nodurile programate se țin într-o listă, curățată la `onended`, ca `stopAll()` să le poată opri. `play` și `buzz` nu fac nimic dacă nu e `available`, `enabled` sau dacă e ascuns.

- [ ] **Step 1: Write the failing tests** — `tests/web/sound-engine.test.mjs`:
  - `engine: fără AudioContext e indisponibil și nu aruncă` — `createContext` care aruncă → `unlock() === false`, `available === false`, `play('tape')` nu aruncă.
  - `engine: zumzetul are fundamentala de 50 Hz` — după `unlock()`, există un oscilator cu `frequency.value === 50` pornit.
  - `engine: nivelurile — comenzile și bâzâitul mai încete decât mașina` — inegalitățile din `LEVELS` de mai sus.
  - `engine: dezactivat nu cântă` — `setEnabled(false)`, `play('key')` → niciun nod nou pornit.
  - `engine: dezactivat taie bâzâitul` — `buzz({tape:true,type:false})`, `setEnabled(false)` → câștigul master programat la 0 în ≤ 0,03 s; `setEnabled(true)` după `buzz({tape:false,type:false})` → câștigul bâzâitului benzii 0.
  - `engine: stopAll oprește ce e programat` — trei `play('tape', now+1)`, `stopAll()` → toate trei au `stop` chemat.
  - `engine: ascuns coboară masterul la 0, vizibil îl readuce cu rampă de 1 s`.

- [ ] **Step 2: Run to verify they fail**
  Run: `node --test tests/web/sound-engine.test.mjs`
  Expected: FAIL — modulul lipsește

- [ ] **Step 3: Implement `SoundEngine` in `web/js/sound/engine.js`**

- [ ] **Step 4: Run to verify they pass**
  Run: `node --test tests/web/sound-engine.test.mjs`
  Expected: PASS 7/7

- [ ] **Step 5: Commit**
  `git add web/js/sound/engine.js tests/web/sound-engine.test.mjs && git commit -m "sunet: motorul Web Audio — zumzet 50 Hz, clicuri, bâzâit"`

### Task 3: Pagina — butonul, preferința, legăturile

**Files:**
- Create: `web/js/sound/page.js`
- Modify: `web/index.html` (butonul în `.bar-controls`, înaintea grupului `.lang`), `web/css/console.css` (stilul butonului, ca `#explain`), `web/js/strings.js` (cheia `sound`), `web/js/app.js` (setup, `advance`, `press`, `select`, `#at-reset`, `setTexts`, `__pupitru.sound`)
- Test: `tests/web/sound-page.test.mjs`, `tests/web/smoke.html` (etapa `sunet`)

**Interfaces:**
- Consumes: `Planner` (Task 1), `SoundEngine` (Task 2), `isMomentary(id)` din `web/js/bindings.js`.
- Produces:
  - `export function pickSound(storage) → boolean` (implicit `true`; `'off'` → `false`; stocare care aruncă → `true`), `export function saveSound(on, storage)` (nu aruncă).
  - `export function clickKind(switchId) → 'button'|'lever'` (`isMomentary` → `'button'`, altfel `'lever'`).
  - `export function setupSound({ button, storage, T, engine = new SoundEngine(), doc = document }) → { onFrame(snap, dtMs), control(switchId), reset(), setLang(), get on(): boolean, toggle() }`.
- Strings (`S(lang).sound`): RO `{ on: 'Sunetul e pornit — apasă ca să-l oprești', off: 'Sunetul e oprit — apasă ca să-l pornești', unavailable: 'Browserul nu poate reda sunet aici' }`; EN `{ on: 'Sound is on — press to turn it off', off: 'Sound is off — press to turn it on', unavailable: 'This browser cannot play sound here' }`. Butonul: text 🔊/🔇 (`aria-hidden` pe emoji), `aria-label` = textul de mai sus, `aria-pressed` = pornit, `data-help="sound"`.

Legături în `app.js`: `const sound = setupSound({ button: $('sound'), storage, T })`; în `advance`: `sound.onFrame(snap, dt)`; în `press(id)`: `sound.control(id)` (prima linie); în `select()` și pe `#at-reset` (`click`): `sound.reset()`; în `setTexts`: `sound.setLang()`. Selectorul ascultătorului de captură pentru Explică devine `'#atelier [data-help], #provenance [data-help], #sound[data-help]'`, iar clicul pe `#sound` în afara modului Explică comută sunetul. `setupSound` ascultă `pointerdown` și `keydown` pe `doc` (captură, o singură dată) → `engine.unlock()` și `engine.setEnabled(on)`; `visibilitychange` → `engine.setHidden(doc.hidden)`. `onFrame` cheamă `planner.frame({ t: engine.now(), dtMs, tapePos: snap.tapePos, typed: snap.typed })`, apoi `engine.play` pe fiecare eveniment și `engine.buzz(r.buzz)`. `reset()` = `planner.reset()` + `engine.stopAll()`.

- [ ] **Step 1: Write the failing tests** — `tests/web/sound-page.test.mjs` (fără DOM: `pickSound`/`saveSound` cu un `storage` fals, `clickKind`):
  - `sound: implicit pornit; 'off' îl oprește; stocarea blocată → pornit`.
  - `sound: saveSound scrie 'on'/'off' la mecipt.sound și nu aruncă pe stocare blocată`.
  - `sound: butoanele cu revenire sunt 'button', comutatoarele M/RAI/IMPULSURI sunt 'lever'` — `switch-compute-0`, `switch-commands-2` → `button`; `switch-M-4`, `switch-RAI-0`, `switch-pulses-0` → `lever`.
  Și în `tests/web/smoke.html`, o etapă `sunet` după `limba`: `#sound` există, are `aria-pressed="true"` și textul 🔊; un clic → `aria-pressed="false"`, 🔇, `localStorage['mecipt.sound'] === 'off'`; încă un clic → înapoi `on`; `P.sound.on === true`; niciun element din `errors`.

- [ ] **Step 2: Run to verify they fail**
  Run: `node --test tests/web/sound-page.test.mjs`
  Expected: FAIL — modulul lipsește

- [ ] **Step 3: Implement `web/js/sound/page.js`, the button, the strings and the wiring in `app.js`**

- [ ] **Step 4: Run to verify they pass**
  Run: `node --test tests/web/sound-page.test.mjs && make web-check`
  Expected: PASS; `SMOKE OK`

- [ ] **Step 5: Manual check in Chrome** — `tools/serve.py build/site 8000` deja rulează; pe `http://127.0.0.1:8000/`: primul clic pe CALCULEAZA AUTOMAT → zumzet care crește, țăcănit la retipărire, clape pe coală; „rapid” → bâzâit mai încet; 🔇 → liniște imediată; reîncărcarea paginii păstrează 🔇.

- [ ] **Step 6: Commit**
  `git add web/js/sound/page.js web/index.html web/css/console.css web/js/strings.js web/js/app.js tests/web/sound-page.test.mjs tests/web/smoke.html && git commit -m "sunet: butonul 🔊/🔇, preferința și legăturile cu pupitrul"`

### Task 4: Ajutorul, documentația, semantica

**Files:**
- Modify: `tools/help/gen_help.py` (intrarea `sound`), `web/data/help/{ro,en}.json` (regenerate), `web/doc/ro/04-pupitrul.md` și `web/doc/en/04-pupitrul.md` (secțiunea „Sunetul” / „Sound”, la final), `docs/semantica.md` și `docs/semantica.en.md` (secțiunea „Sunetul” / „Sound”), `README.md` (o frază în lista de funcții)
- Test: `tests/web/content.test.mjs` (dacă verifică intrările de ajutor față de `data-help`, noua intrare trebuie să treacă; altfel un test nou acolo: `help: are intrarea sound în ro și en`)

**Interfaces:**
- Consumes: `data-help="sound"` (Task 3).
- Produces: nimic pentru alte task-uri.

Conținut (fapte fixate de spec, formularea e a constructorului):
- Intrarea `sound`: statut `GHICIT`, surse `['semantica']`; spune că nu există înregistrări ale MECIPT-1, că sunetele sunt sintetizate în browser după ritmul mașinii emulate, că zumzetul are 50 Hz pentru că tamburul face 50 de rotații pe secundă (DEDUS), că la ritm mare clicurile devin bâzâit mai încet, că alegerea se ține minte și că pe telefon sunetul pornește la prima atingere.
- Rândurile din semantica (Alegere | Statut | Motiv / sursă): zumzetul la 50 Hz — DEDUS (1024 timpi de cuvânt, 51 200/s); timbrul zumzetului, al cititorului, al mașinii de scris și al comenzilor — GHICIT (nu există înregistrări); un clic pe rând citit și pe caracter, ≈ 0,1 s — GHICIT (ritmul deja din „Periferice”); bâzâitul la peste 40 de evenimente pe secundă — regula emulatorului; carul la rândul nou — GHICIT; fără sunete pentru bara modernă și Atelier — regula emulatorului.

- [ ] **Step 1: Write the failing test** — `help: are intrarea sound în ro și en` (citește `web/data/help/{ro,en}.json`, cere cheia `sound` cu statutul `GHICIT`), dacă `content.test.mjs` nu acoperă deja `data-help`.

- [ ] **Step 2: Run to verify it fails**
  Run: `node --test tests/web/content.test.mjs`
  Expected: FAIL pe intrarea `sound`

- [ ] **Step 3: Add the entry, regenerate (`python3 tools/help/gen_help.py`), write the doc sections and the semantica rows, the README sentence**

- [ ] **Step 4: Run to verify**
  Run: `make check && make web-check`
  Expected: 0; toate testele Node trec; `SMOKE OK`

- [ ] **Step 5: Commit**
  `git add tools/help/gen_help.py web/data/help web/doc docs/semantica.md docs/semantica.en.md README.md tests/web/content.test.mjs && git commit -m "sunet: ajutorul, documentația și semantica"`
