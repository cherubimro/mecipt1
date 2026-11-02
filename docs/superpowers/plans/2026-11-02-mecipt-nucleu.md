# MECIPT-1 — Planul 1: nucleul de emulare (C) — Plan de implementare

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un nucleu C fără dependențe care emulează MECIPT-1 la nivel de instrucțiune (cu urma microoperațiilor pentru becurile pupitrului), încarcă programe dintr-un format text cu proveniență pe cuvânt și rulează cele două programe originale găsite (preîncărcătorul INEX-1 și programul de retipărire din 1962), folosite drept „oracol” pentru semantica incertă.

**Architecture:** Bibliotecă C11 `libmecipt` (cuvânt de 31 biți în complement față de unu, tabelul instrucțiunilor, mașina, perifericele, operațiile de pupitru, urma microoperațiilor), plus două unelte în linie de comandă: `mecasm` (text ↔ imagine de tambur) și `mecrun` (rulează și tipărește ce scrie mașina de scris). Toate alegerile nesigure din surse sunt variante explicite într-o structură `mec_variants_t`, ca să poată fi testate pe codul original și schimbate fără a rescrie mașina. Acest nucleu va fi compilat ulterior în WebAssembly (Planul 2) și legat la wx/ncurses (Planul 8).

**Tech Stack:** C11, GNU make, gcc (7.5 sau 12 pe stația de lucru), fără biblioteci externe; teste cu un mini-cadru propriu (`tests/test.h`).

**Spec:** `/home/bu/mecipt/docs/2026-11-02-emulator-mecipt1-design.md` (citește și `surse/3d/inscriptii-pupitru.md`, `surse/wikipedia-ro-MECIPT.wiki` — tabelul instrucțiunilor —, `surse/facsimile-baltac/p14-*.png` și `p15-*.png`).

## Global Constraints

- Limbaj: **C11**, fără dependențe externe în `core/` (doar libc); trebuie să compileze fără avertismente cu `gcc -std=c11 -Wall -Wextra -Werror` atât cu gcc 7 cât și cu gcc 12.
- Licență cod: **AGPL-3.0-or-later** — fiecare fișier sursă începe cu `// SPDX-License-Identifier: AGPL-3.0-or-later`. Conținut (texte, programe transcrise, grafică): **CC BY-SA 4.0**, cu atribuire către sursă.
- Identificatorii din cod în engleză; etichetele afișabile (microoperații, mnemonice) **exact ca pe pupitru / în Geier 1961**, în română.
- Adresele și codurile în listinguri și în formatul de program sunt **în octal**, ca la operatorii de atunci (cod pe 2 cifre, adresă pe 4 cifre).
- **Fiecare cuvânt încărcat pe tambur are proveniență**: `ORIGINAL`, `DEDUS`, `RECONSTRUCTIE` sau `GHICIT`, plus un text-sursă (ex. „Facsimil 5, Baltac”). Nicio funcție de încărcare nu acceptă cuvinte fără proveniență.
- Orice comportament ales fără sursă se marchează în cod cu comentariul `// GHICIT:` sau `// DEDUS:` și o frază de justificare, și se listează în `docs/semantica.md`.
- Fapte fixate de surse (nu se schimbă):
  - Tambur **1024 de cuvinte × 31 biți**; adrese 0000–1777 (octal); **50 rot/s**.
  - Bitul de panou m_i (i = 0…30, m0 = semnul) ↔ `(w >> (30 - i)) & 1`.
  - Câmpuri (Lucrarea 7 p.1): m0 = 0 · m1–m5 **cod 2** · m6–m10 **cod 1** · m11–m20 **adresă 2** · m21–m30 **adresă 1**.
  - Listingurile de epocă scriu un cuvânt-instrucțiune ca `AAAA  c1 a1  c2 a2` (ex. `0010  27 0000  02 0001`).
  - Codurile 0–28 cu mnemonicele Geier: O U UN UM UMN A SC AM SCM IN INR D MS T TPO TN TO DLS DLD DS DD ME ISME UI CU IL AC CIT TICR. Deplasările (17–20) au în câmpul de adresă un număr de poziții (vezi varianta `shift_field`).
  - Subcodurile AC (26), în **zecimal** cum apar în tabel: 73, 91, 92, 94, 105 = octal **0111, 0133, 0134, 0136, 0151**.
  - Registre: S 31 biți, I 30 biți, M 31 biți, RI 15 biți (cod 5 + adresă 10), RAI 10, RA 10, R I și R II câte 7 biți; bistabili α, β, γ; indicatorul DCR.
  - Numere în **complement față de unu**; depășirea (operanzi de același semn, rezultat de semn opus) aprinde DCR și, dacă comutatorul „ÎN CAZ DE DEPĂȘIRE” e pe **SE OPREȘTE**, oprește mașina.
  - Banda: 5 canale; **perforație = „0”**, lipsă = „1”.

## Review Focus

1. **Zero negativ** (toți biții 1): `TPO`/`TN`/`TO` și afișarea trebuie să-l trateze consecvent cu +0 — un vizitator care scade un număr din el însuși trebuie să vadă „0”, nu un salt greșit. → test în Task 4 (`test_minus_zero_branches`).
2. **Cod mașină care se modifică singur** (INEX-1 face `MS 0014` pe propria instrucțiune): instrucțiunea următoare trebuie citită de pe tambur *după* scriere, nu dintr-o copie. → test în Task 4 (`test_self_modifying_fetch`).
3. **Banda se termină sau „se agață”** în timpul unui `CIT`: mașina trebuie să se oprească cu becul HÂRTIA AGĂȚATĂ, nu să citească zerouri la nesfârșit. → test în Task 6 (`test_tape_end_jams`).
4. **Coduri 29–31** (necunoscute) și adrese care trec peste 1777: oprire curată cu OPRIT și motiv, nu comportament nedefinit în C. → teste în Task 4 (`test_unknown_opcode_halts`, `test_rai_wraps`).
5. **Depășire cu comutatorul pe NU SE OPREȘTE**: DCR rămâne aprins, programul continuă, iar rezultatul trunchiat e determinist. → test în Task 4 (`test_overflow_no_stop_continues`).

---

## Structura fișierelor

```
/home/bu/mecipt/
  Makefile                      # build lib + unelte + teste; `make check`
  LICENSE                       # AGPL-3.0 (text complet)
  LICENSE-CONTINUT.md           # CC BY-SA 4.0 + atribuiri (Turbojet, marius0198, Baltac, Farcaș, Geier)
  core/
    word.h  word.c              # cuvânt 31 biți: aritmetică complement față de unu, câmpuri, octal, fracții
    isa.h   isa.c               # tabelul instrucțiunilor, subcoduri AC, împachetare pereche
    variants.h                  # mec_variants_t + valori implicite
    machine.h machine.c         # starea mașinii, timpul tamburului, execuția instrucțiunilor
    periph.h  periph.c          # cititor de bandă, mașina de scris, automatul ICR
    console.h console.c         # operațiile de pupitru (butoanele și comutatoarele reale)
    microops.h microops.c       # cele 39 de microoperații inscripționate + urma lor
    program.h program.c         # format text .mec ↔ imagine de tambur cu proveniență
  tools/
    mecasm.c                    # .mec → .drum și listing în stil facsimil
    mecrun.c                    # rulează: încarcă .mec/.drum + bandă, tipărește ieșirea, opțional urmă
    mecvariants.c               # rulează un oracol sub toate combinațiile de variante
  programs/
    inex1-preincarcator.mec     # ORIGINAL — Facsimil 5
    retiparire-1962.mec         # ORIGINAL 1477–1545 — Facsimil 4; constante RECONSTRUCTIE
  tests/
    test.h                      # mini-cadru: TEST(nume), CHECK(cond), CHECK_EQ_U(a,b), RUN_ALL
    test_word.c test_isa.c test_program.c test_machine.c test_shift_muldiv.c
    test_periph.c test_console.c test_microops.c test_inex.c test_retiparire.c
  docs/semantica.md             # fiecare alegere GHICIT/DEDUS, cu sursa și oracolul care o susține
```

---

### Task 1: Depozit, build, mini-cadru de teste și cuvântul de 31 de biți

**Files:**
- Create: `Makefile`, `LICENSE`, `LICENSE-CONTINUT.md`, `.gitignore`, `tests/test.h`, `core/word.h`, `core/word.c`, `tests/test_word.c`

**Interfaces:**
- Produces (`core/word.h`):
  - `typedef uint32_t mword;` `#define MEC_MASK31 0x7FFFFFFFu` `#define MEC_MASK30 0x3FFFFFFFu`
  - `int mec_bit(mword w, int i);` (bitul de panou m_i)  · `mword mec_set_bit(mword w, int i, int v);`
  - `int mec_is_neg(mword w);` · `int mec_is_zero(mword w);` (adevărat pentru +0 și −0)
  - `mword mec_neg(mword w);` · `mword mec_abs(mword w);`
  - `mword mec_add(mword a, mword b, int *overflow);` (transport circular; `*overflow` = 1 la depășire)
  - `mword mec_from_double(double x);` · `double mec_to_double(mword w);` (fracție în (−1, 1), unitatea 2⁻³⁰)
  - `int mec_fmt_octal(mword w, char out[12]);` (11 cifre octale, cu zerouri) · `int mec_parse_octal(const char *s, mword *w);`
- `tests/test.h`: macro-urile `TEST(name)`, `CHECK(cond)`, `CHECK_EQ_U(a,b)`, `CHECK_EQ_S(a,b)` (șiruri), `RUN_ALL()` care tipărește `OK n` / `FAIL n` și întoarce cod de ieșire ≠ 0 la eșec. Fiecare `tests/test_*.c` devine un executabil; `make check` le rulează pe toate.

- [ ] **Step 1: `git init` în `/home/bu/mecipt`, `.gitignore` (`build/`, `*.o`, `*.drum`), `LICENSE` (textul AGPL-3.0), `LICENSE-CONTINUT.md` cu atribuirile din spec §4.3 și §6.**
- [ ] **Step 2: Scrie testele care pică** în `tests/test_word.c`:
  - `test_bit_numbering`: `mec_bit(0x40000000u, 0) == 1`, `mec_bit(1u, 30) == 1`.
  - `test_add_end_around_carry`: `mec_add(mec_from_double(0.5), mec_neg(mec_from_double(0.25)), &o)` dă `mec_from_double(0.25)` și `o == 0`.
  - `test_add_overflow`: `mec_add(mec_from_double(0.75), mec_from_double(0.5), &o)` → `o == 1`.
  - `test_minus_zero_is_zero`: `mec_is_zero(MEC_MASK31) == 1` și `mec_is_zero(0) == 1`; `mec_add(x, mec_neg(x), &o)` este zero pentru `x = mec_from_double(0.3)`.
  - `test_fraction_roundtrip`: `mec_to_double(mec_from_double(0.017452406))` diferă de intrare cu < 2⁻²⁹.
  - `test_octal_roundtrip`: `mec_fmt_octal(0x12345678u & MEC_MASK31, buf)` urmat de `mec_parse_octal` dă aceeași valoare; `"17777777777"` se parsează ca `MEC_MASK31`.
- [ ] **Step 3: Rulează `make check`** — așteptat: eroare de compilare / FAIL (funcțiile nu există).
- [ ] **Step 4: Implementează `core/word.c`.** Negativul = complementul celor 31 de biți; adunarea în complement față de unu cu transport circular (bitul 31 al sumei se adună înapoi).
- [ ] **Step 5: `make check`** — așteptat: `OK` pentru toate testele din `test_word`.
- [ ] **Step 6: Commit** — `git add -A && git commit -m "core: cuvânt de 31 biți în complement față de unu + build și teste"`

---

### Task 2: Tabelul instrucțiunilor și împachetarea perechii

**Files:**
- Create: `core/isa.h`, `core/isa.c`, `core/variants.h`, `tests/test_isa.c`

**Interfaces:**
- Consumes: `mword` (Task 1).
- Produces (`core/isa.h`):
  - `typedef enum { ADDR_Y, ADDR_SHIFT, ADDR_NONE, ADDR_SUB } mec_addr_kind;`
  - `typedef struct { int code; const char *mnemonic; mec_addr_kind kind; const char *effect_ro; } mec_opinfo;`
  - `const mec_opinfo *mec_op_by_code(int code);` (NULL pentru 29–31) · `const mec_opinfo *mec_op_by_mnemonic(const char *m);`
  - `typedef struct { int code1, addr1, code2, addr2; } mec_pair;`
  - `mec_pair mec_unpack(mword w);` · `mword mec_pack(mec_pair p);`
  - `enum { AC_ICR_START = 0111, AC_PRINT_LETTERS = 0133, AC_ICR_STOP = 0134, AC_PRINT_DIGITS = 0136, AC_S_FROM_I = 0151 };`
- Produces (`core/variants.h`):
  ```c
  typedef struct {
    enum { SHIFT_N_IS_FIELD, SHIFT_N_IS_32_MINUS_FIELD } shift_field;
    enum { PAIR_FIRST_IS_1, PAIR_FIRST_IS_2 } pair_order;
    int interleave_even_odd;   /* 0 = adresare simplă; 1 = pare/impare pe jumătăți de tambur (Baltac) */
    int exec_ticks;            /* timp de execuție după un acces la tambur, în „timpi de cuvânt” */
  } mec_variants_t;
  mec_variants_t mec_variants_default(void);
  ```
  Valorile implicite inițiale: `SHIFT_N_IS_32_MINUS_FIELD` (Geier 1961, nota din Wikipedia), `PAIR_FIRST_IS_1` (DEDUS din Lucrarea 7 p.6), `interleave_even_odd = 1`, `exec_ticks = 3`. Task 9 le poate schimba pe baza oracolului.

- [ ] **Step 1: Scrie testele care pică** în `tests/test_isa.c`:
  - `test_opcode_table`: 29 de coduri (0–28) au intrare; `mec_op_by_code(29) == NULL`; `mec_op_by_mnemonic("CIT")->code == 27`; `mec_op_by_mnemonic("DS")->code == 19`; `mec_op_by_code(24)->kind == ADDR_NONE`; `mec_op_by_code(26)->kind == ADDR_SUB`.
  - `test_pack_inex_word`: `mec_pack((mec_pair){ .code1 = 027, .addr1 = 0, .code2 = 02, .addr2 = 01 })` are `mec_bit` corespunzător: câmpul m6–m10 = 027 și m11–m20 = 1; `mec_unpack` pe rezultat dă înapoi aceeași pereche.
  - `test_ac_subcodes_octal`: `AC_PRINT_DIGITS == 94` și `AC_ICR_START == 73`.
- [ ] **Step 2: `make check`** — așteptat FAIL.
- [ ] **Step 3: Implementează `core/isa.c`** cu tabelul din `surse/wikipedia-ro-MECIPT.wiki` (coloana „Efect” în `effect_ro`, textual) și `mec_variants_default()`.
- [ ] **Step 4: `make check`** — așteptat OK.
- [ ] **Step 5: Commit** — `git commit -am "core: tabelul instrucțiunilor Geier 1961, perechea de instrucțiuni, variante"`

---

### Task 3: Formatul de program `.mec`, încărcarea cu proveniență, `mecasm`

**Files:**
- Create: `core/program.h`, `core/program.c`, `tools/mecasm.c`, `programs/inex1-preincarcator.mec`, `tests/test_program.c`

**Interfaces:**
- Consumes: `mec_pack`, `mec_op_by_mnemonic`, `mec_parse_octal`.
- Produces (`core/program.h`):
  - `typedef enum { PROV_NONE = 0, PROV_ORIGINAL, PROV_DEDUS, PROV_RECONSTRUCTIE, PROV_GHICIT } mec_prov;`
  - `typedef struct { mword word[1024]; mec_prov prov[1024]; unsigned short src[1024]; char sources[32][96]; int nsources; char error[160]; } mec_image;` (`src[a]` = indexul în `sources`)
  - `int mec_program_parse(const char *text, mec_image *img);` (0 = succes; altfel `img->error` conține `linia N: motiv`)
  - `int mec_listing(const mec_image *img, int from, int to, char *out, size_t cap);` — scrie linii `AAAA  c1 aaaa  c2 aaaa` exact ca în facsimile.
- Formatul `.mec` (o linie = un cuvânt; `;` începe un comentariu):
  - `@prov ORIGINAL Facsimil 5, Baltac` — se aplică liniilor următoare până la alt `@prov`.
  - `0010  27 0000  02 0001` — adresă + două instrucțiuni în octal; sau cu mnemonice: `0010  UI 0000  UN 0001`.
  - `0001  = 00 0001 00 0004` — cuvânt de date dat ca pereche octală; `0004  = 0,017452406` — fracție zecimală; `0005  = o17777777777` — 11 cifre octale.
  - Erori: adresă > 1777, cod > 37 octal, adresă de instrucțiune > 1777, linie fără `@prov` activ, aceeași adresă de două ori.
- `mecasm program.mec [-o program.drum] [--listing DE LA]`: `.drum` = 1024 de linii „11 cifre octale + proveniență”.

- [ ] **Step 1: Transcrie `programs/inex1-preincarcator.mec`** din Facsimilul 5 (`surse/facsimile-baltac/p15-facs5-INEX1-preincarcator.png`): cuvintele 0000, 0001 și 0010–0015, cu `@prov ORIGINAL Facsimil 5, Baltac, „Instrucțiuni la programul INEX-1”`. În antet, ca comentariu, procedura: „se pune banda INEX-1 în cititor de la primul caracter perforat și se pornește calculatorul de la 0010”.
- [ ] **Step 2: Scrie testele care pică** în `tests/test_program.c`:
  - `test_parse_inex`: încărcarea fișierului de mai sus reușește; `mec_unpack(img.word[010])` = `{027,0,02,01}`; `img.prov[010] == PROV_ORIGINAL`; `img.prov[02] == PROV_NONE`.
  - `test_listing_matches_facsimile`: `mec_listing(&img, 010, 015, …)` produce exact liniile `0010  27 0000  02 0001` … `0015  14 0014  15 0010`.
  - `test_reject_without_prov`: textul `"0010 27 0000 02 0001\n"` dă eroare care conține `linia 1`.
  - `test_reject_duplicate_and_range`: adresa 2000 sau aceeași adresă de două ori dau eroare.
  - `test_mnemonic_equals_octal`: `0010 UI 0000 UN 0001` produce același cuvânt ca `0010 27 0000 02 0001`.
- [ ] **Step 3: `make check`** — FAIL.
- [ ] **Step 4: Implementează `core/program.c` și `tools/mecasm.c`.**
- [ ] **Step 5: `make check`** și `build/mecasm programs/inex1-preincarcator.mec --listing 0010 0015` — listingul arată ca în facsimil.
- [ ] **Step 6: Commit** — `git commit -am "program: format .mec cu proveniență pe cuvânt, mecasm, preîncărcătorul INEX-1 transcris"`

---

### Task 4: Mașina — stare, timpul tamburului și instrucțiunile de bază

**Files:**
- Create: `core/machine.h`, `core/machine.c`, `tests/test_machine.c`

**Interfaces:**
- Consumes: Tasks 1–3.
- Produces (`core/machine.h`):
  ```c
  typedef enum { RUN_OK, HALT_STOP_INSTR, HALT_DCR, HALT_TAPE_JAM, HALT_UNKNOWN_OPCODE, HALT_MANUAL } mec_halt;
  typedef struct mecipt {
    mword drum[1024]; mec_prov prov[1024];
    mword S, M; uint32_t I;            /* I: 30 biți */
    uint16_t RAI, RA, RI;              /* RI: cod<<10 | adresă */
    uint8_t R1, R2, alpha, beta, gamma;
    int phase;                         /* 1 sau 2: ce instrucțiune din pereche urmează */
    int dcr, oprit, hirtie_agatata, stop_on_dcr, unknown_code;
    uint64_t ticks;                    /* timpi de cuvânt; 1024 pe rotație; 50 rot/s */
    mec_variants_t v;
    struct mec_periph *io;             /* Task 6 */
    struct mec_uop_trace *trace;       /* Task 8; poate fi NULL */
  } mecipt;
  void mec_init(mecipt *m, mec_variants_t v);
  void mec_load_image(mecipt *m, const mec_image *img);
  mec_halt mec_step(mecipt *m);                 /* execută O instrucțiune (jumătate de cuvânt) */
  mec_halt mec_run(mecipt *m, uint64_t max_instr);
  double mec_seconds(const mecipt *m);          /* ticks / (1024*50) */
  int mec_drum_slot(const mecipt *m, int addr); /* poziția fizică pe tambur (cu/fără intercalare) */
  ```
- Semantica (din tabelul Geier; ce nu e scris în sursă poartă `// GHICIT:` / `// DEDUS:`):
  - Extragerea instrucțiunii: când `phase == 1`, cuvântul de la `RAI` se citește **de pe tambur în acel moment** în M și se execută instrucțiunea 1. Urmează instrucțiunea 2 din același M („Instrucția 2 trece în locul 1”), apoi `RAI = (RAI + 1) & 01777` și `phase = 1`. Ordinea se ia din `v.pair_order`.
  - Salturile (T, TPO, TN, TO) pun `RAI = y` și `phase = 1`. `TPO`: semnul lui S e 0 sau S este zero; `TN`: S negativ și nenul; `TO`: S nenul. `// GHICIT:` −0 contează drept zero la toate trei.
  - `O y`: oprire (`HALT_STOP_INSTR`, `oprit = 1`); repornirea continuă de la y.
  - U, UN, UM, UMN, A, SC, AM, SCM, ME, ISME, UI, CU, IL, MS: ca în tabel. `// GHICIT:` MS scrie `y ← s + y` și lasă S neschimbat; UI pune în I biții m1–m30 ai lui y.
  - Depășirea pune `dcr = 1`; dacă `stop_on_dcr`, întoarce `HALT_DCR`.
  - Codurile 29–31 întorc `HALT_UNKNOWN_OPCODE`, cu `oprit = 1` și `unknown_code` = codul.
  - Timpul: fiecare acces la adresa a așteaptă până când `ticks % 1024 == mec_drum_slot(a)`, apoi adaugă `v.exec_ticks`. Cu `interleave_even_odd`, slotul e `a/2` pentru a pară și `512 + a/2` pentru a impară.

- [ ] **Step 1: Scrie testele care pică** în `tests/test_machine.c` (programele de test se scriu inline în format `.mec`, cu `@prov GHICIT test`):
  - `test_add_store`: `U 0100 / A 0101 / ME 0102 / O 0000`, cu 0,25 și 0,5 → la adresa 0102 se găsește 0,75.
  - `test_pair_order`: în cuvântul `0000  U 0100  ME 0101` instrucțiunea U se execută înaintea lui ME.
  - `test_branches`: TPO, TN și TO pe +0,5, −0,5 și 0.
  - `test_minus_zero_branches`: S = −0 → TPO sare, TN nu sare, TO nu sare.
  - `test_self_modifying_fetch`: un `MS` care mărește adresa instrucțiunii următoare de pe tambur schimbă efectul ei la execuție.
  - `test_unknown_opcode_halts`: un cuvânt cu codul 035 (octal) → `HALT_UNKNOWN_OPCODE`, `oprit == 1`.
  - `test_rai_wraps`: execuția de la 1777 continuă la 0000.
  - `test_overflow_stop` și `test_overflow_no_stop_continues`: 0,75 + 0,5 → `HALT_DCR` cu `stop_on_dcr = 1`; cu `stop_on_dcr = 0`, `dcr == 1` și se ajunge la instrucțiunea `O`.
  - `test_speed_real_time`: o buclă de 200 de instrucțiuni executate în linie dreaptă rulează între 40 și 60 instr/s (`mec_seconds`) cu `interleave_even_odd = 0`, și între 70 și 110 instr/s cu intercalare. Cifrele de referință: 50 instr/s, respectiv 70–80 (Wikipedia RO, Baltac).
- [ ] **Step 2: `make check`** — FAIL.
- [ ] **Step 3: Implementează `core/machine.c`.** Codurile 9–11 și 17–20 întorc deocamdată `HALT_UNKNOWN_OPCODE`; 26–28 sunt în Task 6.
- [ ] **Step 4: `make check`** — OK.
- [ ] **Step 5: Notează în `docs/semantica.md`** fiecare `GHICIT`/`DEDUS` introdus aici, cu sursa.
- [ ] **Step 6: Commit** — `git commit -am "machine: execuția instrucțiunilor de bază, timpul tamburului, oprirea pe DCR"`

---

### Task 5: Deplasări, înmulțire și împărțire

**Files:**
- Modify: `core/machine.c`
- Create: `tests/test_shift_muldiv.c`

**Interfaces:**
- Consumes: `mec_variants_t.shift_field`, perechea S & I (S = partea de sus cu semn, I = cei 30 de biți de jos).
- Produces: execuția codurilor 9 (IN), 10 (INR), 11 (D), 17 (DLS), 18 (DLD), 19 (DS), 20 (DD); funcția ajutătoare `int mec_shift_count(const mecipt *m, int field);`, care întoarce `field` sau `32 - field` după variantă.
- Semantica: DLS/DLD deplasează logic perechea S & I (61 de biți: S cu semn + I); DS/DD deplasează doar S (31 de biți). Biții care ies se pierd; intră zerouri. `// GHICIT:` semnul participă la deplasare (deplasare logică, conform tabelului). IN: S & I ← s × y în produs dublu, cu semnul în S. INR: S ← s × y rotunjit. D: I ← câtul s : y, S ← restul; dacă |s| ≥ |y|, depășire (DCR).

- [ ] **Step 1: Scrie testele care pică:**
  - `test_shift_count_variants`: cu `SHIFT_N_IS_32_MINUS_FIELD`, `mec_shift_count(m, 033)` dă 5 (exemplul din Wikipedia: `DS 0033` = deplasare cu 5); cu `SHIFT_N_IS_FIELD` dă 27.
  - `test_ds_dd`: deplasarea lui S cu 3 la stânga, apoi cu 3 la dreapta, pe un model de biți cunoscut.
  - `test_dls_crosses_into_I`: un bit din m30 al lui S trece, la DLS cu 1, în primul bit al lui I.
  - `test_multiply`: 0,5 × 0,5 = 0,25 (IN și INR); −0,5 × 0,5 = −0,25.
  - `test_divide`: 0,25 : 0,5 dă I = 0,5 și restul 0; 0,75 : 0,5 dă depășire.
- [ ] **Step 2: `make check`** — FAIL.
- [ ] **Step 3: Implementează** în `core/machine.c` (folosește aritmetică pe 64 de biți pentru produs și împărțire).
- [ ] **Step 4: `make check`** — OK.
- [ ] **Step 5: Commit** — `git commit -am "machine: deplasări, înmulțire, împărțire"`

---

### Task 6: Periferice — cititorul de bandă, mașina de scris, AC, CIT, TICR

**Files:**
- Create: `core/periph.h`, `core/periph.c`, `tests/test_periph.c`
- Modify: `core/machine.c`

**Interfaces:**
- Produces (`core/periph.h`):
  ```c
  typedef struct mec_periph {
    const uint8_t *tape; size_t tape_len, tape_pos;   /* rânduri de 5 biți, așa cum sunt PERFORATE (1 = gaură) */
    char typed[65536]; size_t typed_len;              /* ce a scris mașina de scris */
    int icr_on; mword icr;                            /* automatul ICR */
  } mec_periph;
  int mec_tape_read(mec_periph *p, int *value5);   /* 0 = ok; −1 = sfârșitul benzii */
  void mec_type_digits(mec_periph *p, mword S);     /* AC 0136: cifra din s0 s1 s2 s3 */
  void mec_type_letters(mec_periph *p, mword S);    /* AC 0133: caracterul din s0 … s4 */
  extern const char *const MEC_DIGIT_GLYPHS[16];   /* GHICIT până la găsirea tabelei reale */
  extern const char *const MEC_LETTER_GLYPHS[32];  /* GHICIT; include ă î ș ț */
  ```
- Semantica:
  - CIT y: citește un rând de pe bandă; valoarea = rândul **inversat** (perforație = 0); `y ← valoare` aliniată la dreapta, restul cuvântului 0. La sfârșitul benzii: `hirtie_agatata = 1` și `HALT_TAPE_JAM`.
  - AC cu subcodurile din Task 2. 0151: S ← i. 0111 / 0134: pornește / oprește ICR. TICR y: `icr ← y`. Celelalte subcoduri: `HALT_UNKNOWN_OPCODE`.
  - `// GHICIT:` glifele. Cifrele 0–9 pentru codurile 0–9; pentru codurile 10–15, spațiu, virgulă și semne. Le alege Task 10 astfel încât retipărirea să reproducă facsimilul.

- [ ] **Step 1: Scrie testele care pică:**
  - `test_tape_hole_is_zero`: banda `{0x1F}` (toate cele 5 găuri) → `CIT 0100` pune 0 la 0100; banda `{0x00}` pune 037.
  - `test_tape_end_jams`: un `CIT` după ultimul rând → `HALT_TAPE_JAM`, `hirtie_agatata == 1`.
  - `test_print_digits`: S cu s0..s3 = 0101 → `AC 0136` adaugă `MEC_DIGIT_GLYPHS[5]` în `typed`.
  - `test_ac_s_from_i`: `AC 0151` copiază I în S.
- [ ] **Step 2: `make check`** — FAIL.
- [ ] **Step 3: Implementează.**
- [ ] **Step 4: `make check`** — OK.
- [ ] **Step 5: Commit** — `git commit -am "periph: banda perforată, mașina de scris, AC, CIT, TICR"`

---

### Task 7: Operațiile de pupitru

**Files:**
- Create: `core/console.h`, `core/console.c`, `tests/test_console.c`

**Interfaces:**
- Produces (`core/console.h`). Câte o funcție pentru fiecare comandă inscripționată pe panoul drept (`surse/3d/inscriptii-pupitru.md`):
  ```c
  void mec_c_set_switches_M(mecipt *m, mword sw);   /* cele 31 de comutatoare de sub M */
  void mec_c_set_switches_RAI(mecipt *m, int sw);   /* comutatoarele RAI */
  void mec_c_anuleaza_RAI(mecipt *m); void mec_c_anuleaza_M(mecipt *m); void mec_c_anuleaza_S(mecipt *m);
  void mec_c_introduce_RA_in_RI(mecipt *m); void mec_c_introduce_M_in_I(mecipt *m); void mec_c_introduce_M_in_RI(mecipt *m);
  void mec_c_memorie_scriere(mecipt *m);            /* drum[RAI] ← M */
  void mec_c_memorie_citire(mecipt *m);             /* M ← drum[RAI] */
  void mec_c_select_instr(mecipt *m, int which);    /* INSTRUCȚIA 1 / 2 */
  void mec_c_depasire(mecipt *m, int se_opreste);   /* comutatorul „ÎN CAZ DE DEPĂȘIRE” */
  mec_halt mec_c_calculeaza(mecipt *m, int automat, uint64_t max_instr); /* AUTOMAT sau INSTRUCȚIE UNICĂ */
  ```
- `// DEDUS:` sensul butoanelor e dedus din inscripții și din Lucrarea 7 p.6; justificarea merge în `docs/semantica.md`.

- [ ] **Step 1: Scrie testele care pică:**
  - `test_key_in_word`: după `set_switches_M(w)`, `set_switches_RAI(010)` și `memorie_scriere`, `drum[010] == w`.
  - `test_key_in_inex_preloader`: introducând de la comutatoare cele 8 cuvinte ale preîncărcătorului (luate din imaginea `.mec`), tamburul are la adresele lor exact aceleași cuvinte ca imaginea.
  - `test_instructie_unica`: `calculeaza(automat = 0)` execută exact o instrucțiune.
  - `test_anuleaza`: fiecare ANULEAZĂ pune registrul respectiv la 0.
- [ ] **Step 2: `make check`** — FAIL.
- [ ] **Step 3: Implementează.**
- [ ] **Step 4: `make check`** — OK.
- [ ] **Step 5: Commit** — `git commit -am "console: comenzile pupitrului MECIPT-1"`

---

### Task 8: Microoperațiile și urma lor (becurile panoului stâng)

**Files:**
- Create: `core/microops.h`, `core/microops.c`, `tests/test_microops.c`
- Modify: `core/machine.c` (emite evenimente)

**Interfaces:**
- Produces (`core/microops.h`):
  ```c
  typedef struct { int grid; int row; int col; const char *label_ro; } mec_uop_info; /* grid: 0 = ⎍, 1 = ⊔ */
  extern const mec_uop_info MEC_UOPS[];      /* exact cele 39 de celule inscripționate */
  extern const int MEC_NUOPS;                /* == 39 */
  typedef struct mec_uop_trace { int ids[4096]; uint8_t r1[4096], r2[4096]; int n; } mec_uop_trace;
  int mec_uop_id(int grid, int row, int col);   /* −1 dacă celula n-are inscripție */
  /* tabel de date: secvența de microoperații pentru fiecare cod de instrucțiune */
  extern const signed char MEC_UOP_SEQ[29][24]; /* −1 = sfârșitul secvenței */
  ```
- Etichetele se copiază literal din `surse/3d/inscriptii-pupitru.md`, inclusiv marcajul `[?]`, care rămâne în text.
- Secvențele sunt `// DEDUS:` și se compun din microoperațiile panoului. Excepție: AC 94 → 90 → 24 și AC 91 → 90 → 24, care vin din nota de mână din Lucrarea 7 p.6. Acolo 94, 90, 24 sunt adrese de microprogram, nu celule; păstrează-le ca atare în `R1`/`R2` și documentează în `docs/semantica.md`.

- [ ] **Step 1: Scrie testele care pică:**
  - `test_uop_table`: `MEC_NUOPS == 39`; `MEC_UOPS[mec_uop_id(0, 1, 15)].label_ro` conține „Mută RAI”; `mec_uop_id(0, 3, 4) == -1`.
  - `test_trace_add`: executând `A 0100` cu urma activă apar, în ordine, cel puțin o microoperație de citire din memorie și una de adunare. Testul verifică secvența din `MEC_UOP_SEQ[5]`, oricare ar fi ea, ca să rămână valabil când tabelul se rafinează.
  - `test_trace_jump_uses_mut_rai`: un salt `T` emite microoperația „2(ra) trece în RAI” sau „Mută RAI”.
- [ ] **Step 2: `make check`** — FAIL.
- [ ] **Step 3: Implementează și emite evenimentele din `mec_step`.**
- [ ] **Step 4: `make check`** — OK.
- [ ] **Step 5: Commit** — `git commit -am "microops: cele 39 de microoperații ale pupitrului și urma lor"`

---

### Task 9: Oracolul INEX-1 — preîncărcătorul original încarcă o bandă

**Files:**
- Create: `tests/test_inex.c`, `tools/mecvariants.c`, `docs/semantica.md` (completare)
- Modify (după caz): `core/variants.h` (valorile implicite)

**Interfaces:**
- Consumes: Tasks 3–7.
- Produces: `int mec_tape_encode_words(const mword *w, int n, uint8_t *out, size_t cap);` în `core/periph.c`. Formatul benzii e cel dedus din Geier: un cuvânt = 6 caractere de câte 5 biți (m1–m30), perforate cu gaura = 0. Plus `mecvariants`, care rulează testul INEX sub toate combinațiile `shift_field × pair_order` și tipărește care reușesc.

- [ ] **Step 1: Scrie testul care pică** `test_inex_loads_tape`: imaginea `inex1-preincarcator.mec` + o bandă cu 3 cuvinte cunoscute (0,5; −0,25; perechea `05 1626  25 1512`), pornit de la 0010 cu `mec_c_calculeaza(automat = 1, 2000)`. Așteptat: cuvintele ajung la adrese consecutive, începând cu prima adresă de memorare a preîncărcătorului (0002 conform instrucțiunii `ME 0002`), iar mașina se oprește cu `HALT_TAPE_JAM` la sfârșitul benzii, adică HÂRTIA AGĂȚATĂ.
- [ ] **Step 2: Rulează `build/mecvariants inex`.** Notează în `docs/semantica.md` ce combinații reușesc. Dacă reușește exact una, devine valoarea implicită și e marcată `DEDUS (oracol: preîncărcătorul INEX-1 original)`.
- [ ] **Step 3: Dacă nu reușește nicio combinație,** caută cauza cu `mecrun --trace` (Task 11 poate fi făcut înainte, dacă e nevoie). Candidați: semnificația lui `MS`, formatul benzii, ordinea perechii. Fiecare ipoteză se testează ca variantă nouă în `mec_variants_t`. Limită: dacă după 3 ipoteze tot nu merge, testul se marchează `SKIP` cu motivul scris, iar constatările intră în `docs/semantica.md` ca problemă deschisă. Nu se „repară” preîncărcătorul original.
- [ ] **Step 4: `make check`** — OK sau SKIP documentat.
- [ ] **Step 5: Commit** — `git commit -am "oracol INEX-1: semantica deplasărilor și a perechii stabilită pe codul original"`

---

### Task 10: Oracolul retipăririi — programul din 1962 își reproduce propriul listing

**Files:**
- Create: `programs/retiparire-1962.mec`, `tests/test_retiparire.c`
- Modify: `core/periph.c` (glifele, dacă oracolul le fixează), `docs/semantica.md`

**Interfaces:**
- Consumes: totul de mai sus.
- Produces: programul transcris, cu proveniența pe cuvânt: 1477–1545 `ORIGINAL Facsimil 4, Baltac, 6.09.1962`; constantele citite din afara listingului (1551, 1556, 1557, 1600, 1625, 1626, 1675) `RECONSTRUCTIE`, cu justificarea în comentariu.

- [ ] **Step 1: Transcrie Facsimilul 4** (`surse/facsimile-baltac/p14-facs4-retiparire-programe-1962.png`) în `programs/retiparire-1962.mec`. Verifică transcrierea cu `mecasm --listing 1477 1545` față de imagine, linie cu linie.
- [ ] **Step 2: Scrie testul** `test_retiparire_reproduces_facsimile`: rulat pe propria zonă 1477–1545, programul tipărește în `typed` liniile din facsimil (`1477  27 0000  30 0000` …), modulo spații. Parametrii de rulare (unde se pun limitele zonei, de unde pornește) se deduc din cod și se documentează.
- [ ] **Step 3: Reconstruiește constantele și glifele** cu care testul trece. Fiecare valoare aleasă e marcată `RECONSTRUCTIE` și explicată.
- [ ] **Step 4: Dacă nu se poate reproduce,** aceeași regulă ca la Task 9: maximum 3 ipoteze, apoi `SKIP` documentat, fără modificarea codului original.
- [ ] **Step 5: `make check`**, apoi commit — `git commit -am "oracol retipărire 1962: programul original își tipărește listingul"`

---

### Task 11: `mecrun` — rularea din linia de comandă

**Files:**
- Create: `tools/mecrun.c`
- Modify: `Makefile` (ținta `e2e` intră în `make check`)

**Interfaces:**
- `mecrun PROGRAM.mec [--tape FIȘIER.bin | --tape-words FIȘIER.mec] [--start AAAA] [--max N] [--trace] [--variants shift=field|32-field,pair=1|2,interleave=0|1]`
- Ieșire: textul mașinii de scris pe stdout. Pe stderr, la final: `oprit: <motiv> RAI=AAAA S=<octal> timp=<secunde> s (<instr/s> instr/s)`. `--trace` scrie o linie pe instrucțiune: `RAI faza cod adresă S I microops…`.

- [ ] **Step 1: Scrie testul end-to-end** în `Makefile`, ținta `e2e`: rulează `mecrun programs/inex1-preincarcator.mec --tape-words <3 cuvinte> --start 0010` și verifică (cu `grep`) că stderr conține `oprit: HÂRTIA AGĂȚATĂ`.
- [ ] **Step 2: Implementează `tools/mecrun.c`.**
- [ ] **Step 3: `make check`** — OK, inclusiv `e2e`.
- [ ] **Step 4: Commit** — `git commit -am "mecrun: rularea programelor din linia de comandă"`

---

## Planurile următoare (foaie de drum; fiecare primește propriul plan după ce acesta e gata)

2. **Pagina web — Pupitrul**: compilare WebAssembly (Emscripten nu e instalat acum), panourile SVG desenate după texturile modelului 3D cu pozițiile extrase din `.dae`, becurile legate de starea nucleului, comutatoarele și butoanele funcționale, cititorul de bandă și mașina de scris animate, viteza de epocă / rapid.
3. **Atelierul**: editorul cu mnemonice ↔ octal, vederea tamburului cu proveniența colorată, perforatorul de bandă, rescrierea programelor (marcate „modificat”).
4. **Ajutorul**: turul ghidat și explicațiile la click, în **RO/EN** (comutator de limbă, inscripțiile pupitrului rămân în română).
5. **Sunetul** (tambur, cititor, mașina de scris), oprit din 🔊/🔇, cu alegerea ținută minte.
6. **Programele reconstruite**: banda INEX-1, tabelul de sinus din feb. 1962 (verificat față de Facsimilul 3), calculele ilustrative Vidraru și Romexpo, toate etichetate.
7. **Telefon și publicare**: aranjarea pe ecrane mici, funcționarea offline, găzduirea statică.
8. **Interfețele locale**: wxWidgets și ncurses peste același nucleu.
9. *(opțional)* **Vederea 3D** cu modelul articulat.
