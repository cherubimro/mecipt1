# Programele reconstruite (Planul 6) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Banda INEX-1 reconstruită (încărcată de preîncărcătorul original), tabelul de sinus din 21.02.1962 reprodus cifră cu cifră după Facsimilul 3 și calculele ilustrative Vidraru și Romexpo, toate în catalog, etichetate, cu ajutor și documentație.

**Architecture:** Programele noi sunt cod mașină MECIPT-1 scris de mână în `.mec`. Rutinele INEX-1 stau într-un singur fragment-sursă (`programs/src/inex1-rutine.mec`); un generator Python (`tools/mecjoin.py`) face din el banda perforabilă și îl pune în fiecare program de calcul, iar `make check` verifică că fișierele generate sunt la zi. Un model Python al aritmeticii mașinii (`tools/ref/mecarith.py`), verificat contra nucleului C prin vectori de test, servește la căutarea metodei de sinus și la rezultatele de referință pentru Vidraru și Romexpo. Testele C rulează fiecare program în nucleu și compară coala tipărită caracter cu caracter.

**Tech Stack:** C11 (nucleu, teste `make check`), Python 3 fără dependențe (generator, model, referințe), JS modul ES (catalog, etichete), `node --test`, testul de fum din Chrome.

**Spec:** `docs/superpowers/specs/2026-11-03-programe-reconstruite-design.md` (pornește de la `docs/2026-11-02-emulator-mecipt1-design.md` §2–§6).

## Global Constraints
- Programele: fișiere `.mec`, antet `; SPDX-License-Identifier: CC-BY-SA-4.0`, apoi ce e reconstruit și după ce sursă; proveniența pe bloc (`@prov`): preîncărcătorul ORIGINAL (cuvântul 0001 DEDUS), rutinele INEX-1, sinusul, Vidraru, Romexpo RECONSTRUCTIE, constantele/datele ghicite GHICIT. Codul (Python, C, JS) AGPL-3.0-or-later, comentariile în română.
- Semantica nucleului e cea din `docs/semantica.md` (inversarea 14/15, deplasarea cu n = câmpul, MS lasă rezultatul în S, AC 0136 = cifra din s0…s3). Orice alegere nouă se trece acolo (RO și EN) cu statutul ei.
- Alegerile GHICIT ale nucleului (IN, INR, D, deplasările, conversia) se pot schimba **doar** dacă toate oracolele rămân verzi (retipărirea = Facsimilul 4, preîncărcătorul INEX-1, testele nucleului); alegerea schimbată urcă la DEDUS (din Facsimilul 3), cu motivul. SIGUR/DEDUS nu se ating.
- Pe bandă intră doar m1–m30: niciun cuvânt al benzii INEX-1 nu are bitul de semn. Rutinele nu suprascriu preîncărcătorul (0000–0001, 0010–0015) cât rulează.
- Eticheta Vidraru: „calcul ilustrativ în spiritul celui efectuat pentru barajul Vidraru; cifrele nu sunt cele reale” / „illustrative calculation in the spirit of the one made for the Vidraru dam; the figures are not the real ones”. Eticheta Romexpo: „calcul ilustrativ în spiritul celui efectuat în 1963 pentru cupola Romexpo; cifrele nu sunt cele reale” / „illustrative calculation in the spirit of the one made in 1963 for the Romexpo dome; the figures are not the real ones”.
- Fără titluri și unități pe coală: doar numere, prin rutinele INEX-1. Imaginile facsimilelor nu intră în depozit.
- Timp de rulare: „ca în 1962” — minute, nu ore; „rapid” — câteva secunde.
- Opriri obligatorii (spec §4.1, §6): dacă căutarea sinusului nu dă 45/45, **înainte de Task 8** se arată utilizatorului cel mai bun candidat și lista diferențelor; Task-urile 4–7 nu așteaptă.
- `make check` și `make web-check` rămân verzi după fiecare task.

## Hotărâri fixate aici (interfața INEX-1, GHICIT, trecute în semantica la Task 4)
- **Cifra zero** se tipărește „o” (Facsimilele 3 și 4 o arată așa) — DEDUS. **Semnul de după număr** din Facsimilul 3 se tipărește cu minusul (codul 12, „-”), caracterul cel mai apropiat din set (spec §6).
- **Așezarea:** 0002 = V (celula de revenire), 0003–0007 = celule de lucru, 0010–0015 = preîncărcătorul, 0044 = celula CIT (folosită și de preîncărcător, deci fără cod), punctele de intrare 0025, 0026, 0040, 0132, 0133, 0134, 0135, 0136, 0246 (câte un salt spre corpul rutinei acolo unde punctele sunt vecine). Rutinele ocupă 0002…N contiguu (N ≤ 0377); celulele nefolosite = `O 0000  O 0000`, GHICIT („umplutură”).
- **Chemarea:** programul pune în V (0002) un cuvânt cu instrucțiunea 1 `T r` (r = unde continuă) și instrucțiunea 2 `CU`, pune argumentul în S și sare la punctul de intrare; rutina se termină cu `T 0002`. Rutinele strică S, I, 0003–0007 și 0044.
- **0133 format:** S = `c1 α c2 β` (adresa 1 = α cifre pentru întregi, adresa 2 = β zecimale pentru subunitare, 1–9); după încărcare α = 3, β = 9.
- **0134 întreg:** S = n·2⁻³⁰, |n| < 10^α; tipărește „-” dacă n < 0, apoi α cifre, zerourile din față ca spații (n = 0 → ultima cifră „o”); fără semn după.
- **0135 subunitar:** tipărește „-” dacă S < 0, apoi „o,” și β zecimale, apoi semnul de după număr „-”. Conversia zecimală e cea găsită la Task 3 (până atunci: trunchiere exactă cifră cu cifră).
- **0136 / 0132:** S = −n·2⁻⁵ (n în m1–m5); tipăresc n spații / n rânduri noi.
- **0246:** S = `00 A 00 B`; tipărește cuvintele de la A la B cu formatul 0135, câte 5 pe rând, rând nou la fiecare 5 și la sfârșit.
- **0040 (și 0026):** pornite de la pupitru, citesc cuvinte de pe bandă la adrese consecutive (ca preîncărcătorul: 6 rânduri pe cuvânt, CIT în 0044) de la adresa din instrucțiunea ME a rutinei, până la sfârșitul benzii (HÂRTIA AGĂȚATĂ). **0025** („ca program”): S = `00 A 00 n`, citește n cuvinte la A, revine prin V.
- „146 (VF)” rămâne necunoscută, trecută ca atare, dacă nu reiese din lucru.

## Review Focus
- O bandă INEX-1 care calcă peste 0010–0015 sau 0044 cu altceva decât copia identică: preîncărcătorul se strică la jumătatea încărcării → testul `test_inex1_banda_loads_and_matches` compară tot tamburul după încărcare și `mecjoin.py tape` refuză o bandă cu goluri, cu bit de semn sau cu alt cuvânt în 0010–0015.
- Fișierele generate (`programs/inex1-banda.mec`, `sinus-1962.mec`, `vidraru.mec`, `romexpo.mec`) uitate nesincronizate cu `programs/src/` după o modificare: pagina ar rula alt cod decât sursa → `python3 tools/mecjoin.py --check` în `tests/e2e.sh`.
- Vizitatorul rulează Vidraru/Romexpo din Atelier sau în modul Pupitru și nu vede nicăieri că cifrele nu sunt reale → testul web `catalog: programele ilustrative poartă eticheta` + verificarea în fum că `#provenance` conține fraza.
- Un număr negativ sau zero la 0134/0135 (o coloană Vidraru la coronament e 0; o diferență poate fi negativă) → testele de rutină `inex_0134_*`/`inex_0135_*` cu 0, negativ, ultimul format.
- Schimbarea glifei „0” → „o” lasă în urmă teste, ajutor sau tur care citează „1477  27 0000  30 0000” ca text tipărit → Task 1 caută și actualizează toate citările tipăriturii (nu și pe cele ale formatului de listing din documentație).

---

### Task 1: Cifra zero tipărită „o”

**Files:**
- Modify: `core/periph.c` (`MEC_DIGIT_GLYPHS[0]`), `tests/test_retiparire.c`, `tests/test_periph.c`, `tests/e2e.sh`, `tests/web/smoke.html:178`, `docs/semantica{,.en}.md` (rândul glifelor), `tools/help/gen_help.py` (`sheet`), `web/data/help/{ro,en}.json` (regenerate)

**Interfaces:**
- Produces: `MEC_DIGIT_GLYPHS[0] == "o"`; funcția de test `listing_as_typed(char *s)` în `tests/test_retiparire.c` (înlocuiește `'0'` cu `'o'` în textul așteptat).

- [ ] **Step 1: Write the failing tests** — în `tests/test_periph.c`: `test_type_digit_zero_is_o` (`mec_type_digits` cu S = 0 → `typed == "o"`; cu cifra 1 → `"1"`). În `tests/test_retiparire.c` textul așteptat trece prin `listing_as_typed` (prima linie devine `1477  27 oooo  3o oooo`). În `tests/e2e.sh`, `e2e_retiparire_first_line` așteaptă `1477  27 oooo  3o oooo`.
- [ ] **Step 2: Run** `make check 2>&1 | tail -20` — Expected: FAIL la `test_type_digit_zero_is_o`, la retipărire și la `e2e_retiparire_first_line`.
- [ ] **Step 3: Implement** — `MEC_DIGIT_GLYPHS[0] = "o"`; comentariul: DEDUS, Facsimilele 3 și 4. `smoke.html:178` așteaptă `1477  27 oooo  3o oooo`. `grep -rn "27 0000  30 0000\|o,o\b" tests web tools` și actualizează doar citările *tipăriturii* (nu exemplele de format de listing din `web/doc/*/02-cuvantul.md`, `09-atelierul.md`, `values.test.mjs`). Semantica: rândul „Glifele codurilor 10–15” primește în față „Codul 0 se tipărește „o” | DEDUS | Facsimilele 3 și 4: mașina de scris bate „o” pentru zero”. Ajutorul `sheet`: aceeași propoziție; `python3 tools/help/gen_help.py web/data/help`.
- [ ] **Step 4: Run** `make check 2>&1 | tail -5 && make web-check 2>&1 | tail -5` — Expected: totul verde, `SMOKE OK`.
- [ ] **Step 5: Commit** — `git commit -am "tipărire: cifra zero se bate „o”, ca în facsimile"`

### Task 2: Modelul aritmeticii și transcrierea Facsimilului 3

**Files:**
- Create: `tools/ref/mecarith.py`, `tools/ref/gen_vectors.py`, `tests/data/arith-vectors.txt` (generat), `tests/test_arith_model.c`, `tests/data/facsimil3-sinus.txt`, `tools/ref/check_f3.py`
- Modify: `tests/e2e.sh` (rulează `check_f3.py`)

**Interfaces:**
- Produces (`tools/ref/mecarith.py`, întregi Python pe 31 de biți ca în `core/word.c`): `MASK31, MASK30`, `neg(w)`, `abs_(w)`, `is_neg(w)`, `is_zero(w)`, `add(a, b) -> (w, ovf)`, `sub(a, b) -> (w, ovf)`, `mul(s, y) -> (S, I)` (IN), `mulr(s, y) -> S` (INR), `div(s, y) -> (S, I, ovf)` (D), `shift(code, S, I, n) -> (S, I)` (17–20), `land(s, y)` (IL), `from_frac(x: float) -> w` (ca `mec_from_double`), `to_frac(w) -> float`, `from_int(n) -> w` (n·2⁻³⁰), `digits(w, beta, conv='trunc') -> str` (zecimalele tipărite de 0135, cu „o” pentru zero), `fmt135(w, beta) -> str`, `fmt134(w, alpha) -> str` (formatele din „Hotărâri fixate aici”).
- Produces: `tests/data/facsimil3-sinus.txt` — exact coala așteptată: 9 rânduri a câte 5 numere `o,ddddddddd-` lipite, fiecare rând terminat cu `\n`:

```
o,o17452406-o,o34899496-o,o52335954-o,o69756471-o,o87155741-
o,1o4528461-o,121869341-o,139173o98-o,156434462-o,173648175-
o,19o8o8991-o,2o7911689-o,224951o52-o,241921893-o,258819o44-
o,275637353-o,2923717o2-o,3o9o16992-o,325568151-o,342o2o14o-
o,358367946-o,3746o6589-o,39o731125-o,4o6736639-o,422618255-
o,438371141-o,45399o495-o,469471557-o,4848o9615-o,499999995-
o,515o38o7o-o,529919258-o,544639o31-o,559192896-o,57357643o-
o,587785246-o,6o1815o17-o,615661469-o,62932o387-o,642787606-
o,656o59o23-o,66913o6o1-o,681998356-o,694658366-o,7o71o6779-
```

- [ ] **Step 1: Write the failing tests** — `tests/test_arith_model.c`: `test_model_matches_core` citește `tests/data/arith-vectors.txt` (linii `op a b S_in I_in -> S I ovf`, octal) și, pentru fiecare, pune registrele, execută operația prin nucleu (un cuvânt `op 0100 O 0000` cu y la 0100, `mec_step`) și compară S, I, `dcr`. `tools/ref/check_f3.py`: citește transcrierea și iese cu cod ≠ 0 dacă vreo valoare diferă de sin n° cu mai mult de 1·10⁻⁸ sau dacă forma nu e 9 × 5; adăugat în `tests/e2e.sh` ca `e2e_f3_transcription`.
- [ ] **Step 2: Run** `make check 2>&1 | tail -5` — Expected: FAIL (fișierele lipsesc).
- [ ] **Step 3: Implement** `mecarith.py` după `core/word.c` și `core/machine.c` (aceleași ramuri: transport circular, −0, produsul complementat, INR jumătate în sus pe modul, D cu restul cu semnul lui s, deplasarea pe 61 de biți). `gen_vectors.py` scrie ≥ 2000 de vectori deterministici (sămânță fixă) pentru A, SC, IN, INR, D, DLS, DLD, DS, DD, IL, cu cazurile de margine ±0, ±(1−2⁻³⁰), depășire. Transcrierea de mai sus (deja verificată la scriere: toate diferențele sunt între −0,4 și −7,5·10⁻⁹).
- [ ] **Step 4: Run** `python3 tools/ref/gen_vectors.py > tests/data/arith-vectors.txt && make check 2>&1 | tail -5` — Expected: `test_model_matches_core` OK, `e2e_f3_transcription` OK, restul verde.
- [ ] **Step 5: Commit** — `git add tools/ref tests && git commit -m "referințe: modelul aritmeticii (verificat contra nucleului) și transcrierea Facsimilului 3"`

### Task 3: Căutarea metodei de sinus (cu limită de timp)

**Files:**
- Create: `tools/ref/sin_search.py`, `tools/ref/sin_metoda.md` (rezultatul: metoda, scorul, diferențele)

**Interfaces:**
- Consumes: `mecarith` (Task 2), `tests/data/facsimil3-sinus.txt`.
- Produces: în `sin_metoda.md` — metoda aleasă, exprimată în operații ale mașinii (ordinea, constantele în octal, IN/INR, conversia), scorul `k/45` și lista diferențelor `n: facsimil → candidat`; funcția `sin_candidate(params) -> list[str]` (cele 45 de numere formatate ca în facsimil) și `python3 tools/ref/sin_search.py --export` (scrie coala metodei alese în `tests/data/sinus-model.txt`), reutilizate la Task 8.

- [ ] **Step 1: Harness** — `sin_search.py` calculează, pentru fiecare valoare din facsimil, intervalul de cuvinte binare k compatibile cu fiecare conversie candidat și notează scorul fiecărei metode = numărul de potriviri exacte ale textului. Rulează: `python3 tools/ref/sin_search.py --selftest` — Expected: metoda „sinusul exact rotunjit + trunchiere” dă < 45 (facsimilul nu e sinusul exact), harness-ul tipărește tabelul erorilor în unități 2⁻³⁰.
- [ ] **Step 2: Familii de căutat, în ordine** (fiecare cu variantele IN/INR, constante trunchiate/rotunjite):
  - argumentul: x = n·h cu h = π/180 (trunchiat/rotunjit), prin înmulțire sau prin adunări repetate; sau x în altă scară (n/180 cu π în coeficienți);
  - Taylor de 3–6 termeni, Horner sau termen cu termen (cu D sau cu inverse ca constante);
  - recurența sin(n+1) = 2cos1·sin n − sin(n−1) (și forma cu 2(1−cos1)), rotația (sin, cos) cu sin1, cos1;
  - conversia: trunchiere exactă (IN cu 0,625 și DLS), rotunjire la ultima cifră, conversie cu înmulțire repetată prin 10 trunchiată pe 30 de biți;
  - **numai după epuizarea celor de mai sus:** variante ale alegerilor GHICIT ale nucleului (rotunjirea INR, forma produsului negativ) — o variantă e admisă doar dacă vectorii Task 2 regenerați și toate oracolele trec.
- [ ] **Step 3: Oprirea** — se oprește la primul 45/45 sau după epuizarea familiilor (limita: echivalentul unei zile de lucru). Scrie `sin_metoda.md` cu cel mai bun candidat și diferențele. **Dacă scorul < 45**: în ledger `Task 3: CHECKPOINT sinus k/45`, se continuă cu Task 4–7, iar Task 8 începe doar după răspunsul utilizatorului.
- [ ] **Step 4: Run** `python3 tools/ref/sin_search.py --best` — Expected: tipărește metoda din `sin_metoda.md` și scorul ei.
- [ ] **Step 5: Commit** — `git add tools/ref && git commit -m "sinus: căutarea metodei care reproduce Facsimilul 3 — <k>/45"`

### Task 4: Generatorul și rutinele de tipărire INEX-1

**Files:**
- Create: `tools/mecjoin.py`, `programs/src/inex1-rutine.mec`, `tests/data/inex-apeluri.mec`, `tests/test_inex1_rutine.c`
- Modify: `Makefile` (ținta `programs`), `tests/e2e.sh` (`mecjoin.py --check`), `docs/semantica{,.en}.md` (secțiunea nouă „INEX-1 reconstruit” cu toate „Hotărârile fixate aici”)

**Interfaces:**
- Consumes: `fmt134`, `fmt135`, conversia din `sin_metoda.md` (Task 3).
- Produces:
  - `python3 tools/mecjoin.py` regenerează toate țintele din tabelul `RECIPES`; `--check` le regenerează în memorie și iese cu 1 dacă vreun fișier din `programs/` diferă. Rețete: `('join', out, [fragmente…])` — concatenează, cu antetul `; GENERAT de tools/mecjoin.py din …; nu editați — modificați sursa`; `('tape', out, preincarcator, rutine)` — banda: cuvintele 0002…N din rutine, plus copiile 0010–0015 din preîncărcător cu 0014 înlocuit de `25 0014  01 0001` (așa, după `MS 0014`, încărcarea continuă la 0015); refuză goluri, cuvinte de date negative și cuvinte ale rutinelor în 0000–0001/0010–0015.
  - Punctele de intrare și convenția din „Hotărâri fixate aici”.
- [ ] **Step 1: Write the failing tests** — `tests/data/inex-apeluri.mec` (GHICIT test) are scenarii care pornesc de la 0400, 0420, 0440, … și se termină cu `O`. `tests/test_inex1_rutine.c` încarcă preîncărcătorul + `programs/src/inex1-rutine.mec` + scenariile și verifică `io.typed` pentru fiecare:
  - `inex_0135_half`: 0,5 → `o,5oooooooo-`
  - `inex_0135_sin1`: cuvântul 0,0174524064 → aceeași formă ca primul număr din facsimil
  - `inex_0135_negative`: −0,25 → `-o,25ooooooo-`
  - `inex_0135_zero`: +0 și −0 → `o,ooooooooo-`
  - `inex_0133_beta4`: format β = 4, apoi 0,5 → `o,5ooo-`
  - `inex_0134_values`: α = 3: 834 → `834`, 7 → `  7`, 0 → `  o`, −12 → `- 12`
  - `inex_0136_three`: n = 3 → `   `; `inex_0132_two`: n = 2 → `\n\n`
  - `inex_0246_range`: 3 cuvinte 0,5 / 0,25 / 0,125 → `o,5oooooooo-o,25ooooooo-o,125oooooo-\n`
  - `inex_returns_via_V`: după fiecare rutină programul continuă la r (scenariul tipărește apoi o cifră-martor).
- [ ] **Step 2: Run** `make check 2>&1 | tail -15` — Expected: FAIL (lipsesc rutinele).
- [ ] **Step 3: Implement** rutinele în `programs/src/inex1-rutine.mec` (antet: reconstruit după Facsimilul 5, numai punctele de intrare sunt documentate), `mecjoin.py` cu rețeta benzii (Task 5 o folosește) și ținta `programs:` în `Makefile` (`python3 tools/mecjoin.py`). Semantica: secțiunea „INEX-1 reconstruit (Planul 6)” cu fiecare hotărâre și statutul ei (cifra „o”: DEDUS; restul: GHICIT; „146 (VF)”: necunoscută).
- [ ] **Step 4: Run** `make check 2>&1 | tail -15` — Expected: toate `inex_*` OK, restul verde.
- [ ] **Step 5: Commit** — `git commit -m "INEX-1: rutinele de tipărire reconstruite (0132–0136, 0246) și generatorul de programe"`

### Task 5: Citirea benzilor și banda INEX-1 în catalog

**Files:**
- Modify: `programs/src/inex1-rutine.mec` (0025, 0026, 0040), `tools/mecjoin.py` (rețeta `programs/inex1-banda.mec`), `web/programs/catalog.json`, `web/js/app.js` (`describeProgram`, `provenanceLabel`), `web/js/strings.js`, `Makefile` (`site` nu mai copiază `tests/data/inex-banda-3-cuvinte.mec`), `tests/web/smoke.html:183`, `tools/help/gen_help.py` (`tape`), docs `web/doc/{ro,en}/06-programe.md` (secțiunea INEX-1)
- Create: `programs/inex1-banda.mec` (generat), `tests/test_inex1_banda.c`, `tests/web/catalog.test.mjs`

**Interfaces:**
- Consumes: rețeta `tape` (Task 4).
- Produces: intrarea de catalog `{"id":"inex1","file":"inex1-preincarcator.mec","tape":"inex1-banda.mec","start":"0010","title":"Preîncărcătorul INEX-1 cu banda INEX-1 (reconstruită)","title_en":"The INEX-1 preloader with the INEX-1 tape (reconstructed)","tape_note":"banda INEX-1 reconstruită (RECONSTRUCȚIE)","tape_note_en":"reconstructed INEX-1 tape (RECONSTRUCTION)"}`; câmpuri opționale noi de catalog `note`/`note_en` (afișate în `#provenance` după blocuri) și `tape_note`/`tape_note_en` (în locul lui `T().tapeTest`, care rămâne rezerva).
- [ ] **Step 1: Write the failing tests**
  - `tests/test_inex1_banda.c` `test_inex1_banda_loads_and_matches`: preîncărcătorul + banda `programs/inex1-banda.mec` (codificată ca în `api_set_tape_words`), pornire 0010 → `HALT_TAPE_JAM`; tamburul 0002…N = imaginea `programs/src/inex1-rutine.mec` (afară de 0014 și 0044); 0010–0013, 0015 neschimbate; 0014 = `25 (N+1)  01 0001`; timpul simulat < 300 s (tipărit).
  - `test_inex1_after_load_prints`: după încărcare, scenariul `inex_0135_half` din `tests/data/inex-apeluri.mec`, încărcat peste, tipărește `o,5oooooooo-` (rutinele vin de pe bandă, nu din fișier).
  - `test_inex1_0025_reads_words`: scenariu care cheamă 0025 cu S = `00 0500 00 0002` și o bandă de 2 cuvinte → tamburul 0500–0501 le conține, programul continuă prin V.
  - `test_inex1_0040_console`: pornit de la 0040 cu o bandă de 2 cuvinte → `HALT_TAPE_JAM`, cuvintele la adresa din ME-ul rutinei.
  - `tests/web/catalog.test.mjs`: `catalog: fiecare program se încarcă` (fiecare `file`/`tape` există în `programs/` sau e generat, se parsează cu `loadMecipt` fără eroare); `catalog: intrarea inex1 folosește banda reconstruită` (`tape === 'inex1-banda.mec'`, `tape_note` RO și EN).
  - `smoke.html:183`: după pornirea INEX-1 din catalog, `tapePos()` crește (nu mai e 18 fix) și `#tape-info` conține „reconstruită”.
- [ ] **Step 2: Run** `make check 2>&1 | tail -10; node --test tests/web/ 2>&1 | tail -5` — Expected: FAIL.
- [ ] **Step 3: Implement** rutinele de citire, rețeta benzii, regenerarea (`python3 tools/mecjoin.py`), catalogul, `tape_note`/`note` în `app.js` (în limba curentă), ajutorul `tape` (fără „bandă de test”; banda e reconstruită, preîncărcătorul original), docs 06 (RO/EN): ce e original, ce e reconstruit, punctele de intrare, cum se pornește. `make site` copiază doar `programs/*.mec`.
- [ ] **Step 4: Run** `make check 2>&1 | tail -10 && make web-check 2>&1 | tail -5` — Expected: verde, `SMOKE OK`.
- [ ] **Step 5: Commit** — `git commit -m "INEX-1: citirea benzilor și banda reconstruită, încărcată de preîncărcătorul original"`

### Task 6: Vidraru (ilustrativ)

**Files:**
- Create: `tools/ref/vidraru.py`, `tests/data/vidraru.txt` (generat), `programs/src/vidraru.mec`, `programs/vidraru.mec` (generat), `tests/test_vidraru.c`
- Modify: `tools/mecjoin.py` (rețeta `join`: preîncărcător + rutine + `programs/src/vidraru.mec`)

**Interfaces:**
- Consumes: `mecarith`, rutinele 0132–0136 (Task 4).
- Produces: programul pornește de la **0400** și se oprește cu `O`.

Metoda (simplificată; constantele GHICIT pe tambur, marcate): H = 166 m, coronamentul la cota 834, grosimea t = 6 + 19·z m, raza arcului R = 160 − 80·z m, z = k/10, k = 0…10 (11 arce, de la coronament la fundație), adâncimea h = 166·z, presiunea p = h tf/m² (γ = 1 tf/m³), forța inelară N = p·R tf/m, efortul σ = N/t tf/m². Un rând pe arc: cota (0134, α = 3) = 834 − ⌊h⌋, apoi 2 spații, p/1000, 2 spații, N/100000, 2 spații, σ/1000 (0135, β = 5), rând nou.

- [ ] **Step 1: Write the failing test** — `tests/test_vidraru.c` `test_vidraru_matches_reference`: rulează `programs/vidraru.mec` de la 0400 → `HALT_STOP_INSTR`, `io.typed` identic cu `tests/data/vidraru.txt` (11 rânduri); timpul simulat tipărit și < 600 s.
- [ ] **Step 2: Run** `make check` — Expected: FAIL (lipsesc fișierele).
- [ ] **Step 3: Implement** `vidraru.py`: același algoritm, pas cu pas, în `mecarith` (aceeași ordine a operațiilor ca programul), scrie coala; plus `--plausible`: compară fiecare coloană cu formula în virgulă mobilă (întregi ±1, subunitare relativ 1·10⁻³; iese ≠ 0 altfel). Apoi `programs/src/vidraru.mec` (antet: metoda arcelor încastrate simplificată, după Farcaș 1964 ca idee, dimensiunile publice, eticheta „calcul ilustrativ…”) și regenerarea.
- [ ] **Step 4: Run** `python3 tools/ref/vidraru.py --plausible && make check 2>&1 | tail -5` — Expected: verde.
- [ ] **Step 5: Commit** — `git commit -m "Vidraru: calcul ilustrativ cu arce încastrate, verificat contra referinței"`

### Task 7: Romexpo (ilustrativ)

**Files:**
- Create: `tools/ref/romexpo.py`, `tests/data/romexpo.txt` (generat), `programs/src/romexpo.mec`, `programs/romexpo.mec` (generat), `tests/test_romexpo.c`
- Modify: `tools/mecjoin.py` (rețeta)

**Interfaces:**
- Consumes: `mecarith`, rutinele INEX-1.
- Produces: programul pornește de la **0400** și se oprește cu `O`.

Metoda (constantele GHICIT, marcate): cupolă sferică, diametrul D = 93,5 m (public), săgeata f = 24 m, raza sferei R = (a² + f²)/(2f) cu a = D/2, unghiul maxim φmax = arcsin(a/R), 10 inele la φᵢ = i·φmax/10, 32 de meridiane. Un rând pe inel: i (0134, α = 2), 2 spații, φᵢ în radiani (0135, β = 5), 2 spații, rᵢ/100 cu rᵢ = R·sin φᵢ, 2 spații, lungimea elementului de inel cᵢ/10 cu cᵢ = 2·rᵢ·sin(π/32), rând nou. R, φmax și sin(π/32) se calculează în program (sin printr-o rutină Taylor proprie; dacă metoda de la Task 3 e o rutină chemabilă, se refolosește).

- [ ] **Step 1: Write the failing test** — `tests/test_romexpo.c` `test_romexpo_matches_reference`: rulare de la 0400 → coala identică cu `tests/data/romexpo.txt` (10 rânduri), timp < 600 s.
- [ ] **Step 2: Run** `make check` — Expected: FAIL.
- [ ] **Step 3: Implement** `romexpo.py` (cu `--plausible`, ca la Task 6), `programs/src/romexpo.mec` (antet: Baltac, iulie 1963, catedra Mateescu — ca idee; dimensiunea publică; eticheta), regenerarea.
- [ ] **Step 4: Run** `python3 tools/ref/romexpo.py --plausible && make check 2>&1 | tail -5` — Expected: verde.
- [ ] **Step 5: Commit** — `git commit -m "Romexpo: calcul ilustrativ al inelelor cupolei, verificat contra referinței"`

### Task 8: Tabelul de sinus în cod mașină

> Dacă Task 3 s-a încheiat sub 45/45: **oprire** — utilizatorul primește `tools/ref/sin_metoda.md` (candidatul și diferențele) și hotărăște. Se continuă doar cu acordul lui; atunci diferențele acceptate intră în test ca listă fixă.

**Files:**
- Create: `programs/src/sinus-1962.mec`, `programs/sinus-1962.mec` (generat), `tests/test_sinus.c`
- Modify: `tools/mecjoin.py` (rețeta), eventual `core/machine.c` + `docs/semantica{,.en}.md` + `tests/data/arith-vectors.txt` (doar dacă metoda cere o alegere GHICIT schimbată — vezi Global Constraints)

**Interfaces:**
- Consumes: metoda din `sin_metoda.md`, `sin_candidate` (Task 3), rutina 0135 (β = 9).
- Produces: programul pornește de la **0400**, tipărește 45 de valori cu 0135, câte 5 pe rând (rând nou cu 0132 după fiecare al 5-lea), și se oprește cu `O`.

- [ ] **Step 1: Write the failing test** — `tests/test_sinus.c`:
  - `test_sinus_matches_facsimile`: coala = `tests/data/facsimil3-sinus.txt`, caracter cu caracter (sau, după acordul utilizatorului, identică în afara listei fixe `ACCEPTED_DIFFS[] = { {n, "facsimil", "emulator"}, … }`, iar lista e exact cea a diferențelor).
  - `test_sinus_matches_model`: coala = `sin_candidate` exportată ca `tests/data/sinus-model.txt` de `sin_search.py --export`.
  - `test_sinus_runtime`: timpul simulat tipărit și < 600 s.
- [ ] **Step 2: Run** `make check` — Expected: FAIL.
- [ ] **Step 3: Implement** programul (antet: rezultatul ORIGINAL e Facsimilul 3, 21.02.1962; metoda e RECONSTRUCȚIE găsită prin căutare; potrivirea cu facsimilul e verificarea SIGURĂ), constantele în octal cu proveniența lor, regenerarea. Dacă s-a schimbat o alegere GHICIT a nucleului: `machine.c`, vectorii regenerați, rândul din semantica urcat la DEDUS (din Facsimilul 3), cu motivul.
- [ ] **Step 4: Run** `make check 2>&1 | tail -10` — Expected: verde, inclusiv retipărirea și INEX-1.
- [ ] **Step 5: Commit** — `git commit -m "sinus: tabelul din 21.02.1962 reprodus <k>/45 după Facsimilul 3"`

### Task 9: Catalogul, etichetele, ajutorul și documentația

**Files:**
- Modify: `web/programs/catalog.json`, `web/js/app.js` (`data-help` al lui `#provenance` = `program-<id>` când există intrarea, altfel `provenance`), `tools/help/gen_help.py` (intrările `program-inex1`, `program-sinus-1962`, `program-vidraru`, `program-romexpo`), `web/data/help/{ro,en}.json`, `web/doc/{ro,en}/06-programe.md`, `docs/semantica{,.en}.md`, `README.md`, `tests/web/catalog.test.mjs`, `tests/web/help.test.mjs`, `tests/web/smoke.html`
- Test: cele de mai sus

**Interfaces:**
- Consumes: câmpurile `note`/`note_en` (Task 5), programele din Task 6–8.
- Produces: intrările de catalog (`start` `"0400"`):
  - `sinus-1962` — „Tabelul de sinus 1°–45° (21 februarie 1962, metodă reconstruită)” / „Sine table 1°–45° (21 February 1962, reconstructed method)”; `note`: „metoda e reconstruită; rezultatul se compară cu Facsimilul 3” (+ „diferă în k valori”, dacă e cazul) / EN.
  - `vidraru` — „Barajul Vidraru — calcul ilustrativ” / „Vidraru dam — illustrative calculation”; `note` = eticheta din Global Constraints.
  - `romexpo` — „Cupola Romexpo — calcul ilustrativ” / „Romexpo dome — illustrative calculation”; `note` = eticheta.
- [ ] **Step 1: Write the failing tests** — `catalog.test.mjs`: `catalog: programele ilustrative poartă eticheta` (vidraru/romexpo: `note` conține „cifrele nu sunt cele reale”, `note_en` „not the real ones”); `catalog: titluri în ambele limbi`. `help.test.mjs`: `fiecare program din catalog are ajutor` (`program-<id>` în RO și EN pentru inex1, sinus-1962, vidraru, romexpo; textul Vidraru/Romexpo conține fraza etichetei). Fum: etapa `programe` — alege `vidraru`, `#provenance` conține „cifrele nu sunt cele reale”; pornește la „rapid”, prima linie a colii începe cu `834`; alege `sinus-1962`, după rulare prima linie a colii = primul rând din facsimil.
- [ ] **Step 2: Run** `node --test tests/web/ 2>&1 | tail -5` — Expected: FAIL.
- [ ] **Step 3: Implement** catalogul, `data-help` dinamic, intrările de ajutor (ce face programul; ce e original/reconstruit/ghicit; după ce sursă; ce înseamnă coloanele; la sinus: comparația cu Facsimilul 3 și diferențele, dacă rămân), regenerarea ajutorului, docs 06 RO/EN (o secțiune pe program, „Ce urmează” scos), semantica (alegerile noi rămase), README (rândul Planului 6).
- [ ] **Step 4: Run** `make check 2>&1 | tail -5 && make web-check 2>&1 | tail -5` — Expected: verde, `SMOKE OK`.
- [ ] **Step 5: Commit** — `git commit -m "programe: sinusul, Vidraru și Romexpo în catalog, cu etichete, ajutor și documentație"`
