# Emulator semantics — what is certain, deduced or guessed

*English translation of `docs/semantica.md`; the Romanian file is the reference. Keep both in step: every section has the same table rows.*

Every choice without an explicit source is listed here, with its reason and, where there is one, the oracle that supports it. In the code it appears as `// GHICIT:` (guessed) or `// DEDUS:` (deduced).

## The word and the instructions
| Choice | Status | Justification |
|---|---|---|
| m0 = sign, m30 = least significant bit | CERTAIN | Lab sheet 7 p.1; the M panel numbered 0–30 |
| Fields: m1–m5 code 2 · m6–m10 code 1 · m11–m20 address 2 · m21–m30 address 1 | CERTAIN | Lab sheet 7 p.1; the right-panel labels |
| Period listings print (code 1, address 1) first | DEDUCED | The INEX-1 preloader: the sentinel −mem[1] = −1 only works if the address printed first is m21–m30 |
| Instruction 1 runs first, then 2, then RAI + 1 | DEDUCED | Lab sheet 7 p.6: “instruction 2 moves into the place of instruction 1”, “RAI+1→RAI”; the logic of INEX-1 |
| Word 0001 of INEX-1 = 00 0001 00 0000 | DEDUCED | a digit corrected by hand; only 0000 makes MS 0014 advance the ME address correctly |

## Instructions
| Choice | Status | Justification |
|---|---|---|
| `O y`: halt, RAI ← y (a restart continues from y) | CERTAIN | Geier’s table: “on restart, continue from y” |
| −0 counts as zero for TPO, TN, TO | GUESSED | ones’ complement has two zeros; a visitor computing x − x must see “zero” |
| `MS y`: S ← s + y and y ← S | DEDUCED — reprinting oracle | the table says “Y ← s + y”; the 1962 program tests S right after `MS 1625` |
| `UI y`: I ← bits m1–m30 of y | GUESSED | I has 30 bits |
| Codes 29–31: halt with OPRIT | GUESSED | they are not in the table |
| The instruction is read from the drum when it executes (self-modifying code works) | DEDUCED | INEX-1 uses `MS 0014` on its own instruction |

## Timing
| Choice | Status | Justification |
|---|---|---|
| 1024 word times per revolution, 50 rev/s | CERTAIN | Romanian Wikipedia, Baltac |
| Every access waits for the word’s position, then `exec_ticks` = 3 | GUESSED (the value 3) | — |
| Interleaving: even addresses in slots 0–511, odd in 512–1023 | DEDUCED | Baltac, facsimile 8 (“even addresses on one half of the drum and odd ones on the other”) |
| **Check:** a typical program (summing a table) runs at **50.6 instr/s** without interleaving and **60.7** with it | — | the sources: 50, and 70–80 (for programs laid out on purpose); the model was not tuned to these figures |

## Shifts, multiplication, division
| Choice | Status | Justification |
|---|---|---|
| Logical shift: the sign takes part, bits shifted out are lost, zeros come in | GUESSED (sign handling) | the table: “logical shift” |
| DLS/DLD on S & I as one 61-bit register (S high, I low) | DEDUCED | the table: “S & I”; IN puts the double product in S & I |
| Number of places = the field (not 32 − the field) | DEDUCED — INEX-1 oracle | see “The INEX-1 oracle” below; the “32−n” note in Geier/Wikipedia remains unexplained (perhaps base-32 notation, perhaps only DS/DD) |
| IN: sign and high part in S, low part in I, both complemented for a negative result | GUESSED | — |
| INR: round half up | GUESSED | — |
| D: I ← quotient (30 bits), S ← remainder with the sign of s; \|s\| ≥ \|y\| → overflow (DCR) | GUESSED (the form of the remainder) | the table: “I ← s : y, S ← remainder” |

## Peripherals
| Choice | Status | Justification |
|---|---|---|
| CIT: one tape row, inverted (hole = 0), right-aligned, the rest of the word 0 | CERTAIN / DEDUCED (rest = 0) | Romanian Wikipedia (Baltac, L5); Geier’s table |
| End of tape or no reader → HÂRTIA AGĂȚATĂ (paper jammed), halt | DEDUCED | the “HÂRTIA AGĂȚATĂ” lamp on the console |
| AC 0136 prints the digit in s0 s1 s2 s3; AC 0133 the letter in s0 … s4 | CERTAIN (the bits) / GUESSED (the glyphs) | Geier’s table |
| The sets: digits, space, minus, point, comma, carriage return (code 14 unused); space + 26 English letters + ă î ș ț (code 31 unused) | CERTAIN | Baltac, lab sheet L6, via the Romanian Wikipedia |
| Code 0 is printed as “o” | DEDUCED | Facsimiles 3 and 4: the typewriter strikes “o” for zero (o,o174524o6; 15o1) |
| Glyphs of codes 10–15 (decimal): space , - newline (unused) . | GUESSED (the layout) | the reprinting program uses two codes from 10–15 (space and newline); which code is which cannot be deduced; 14 stays unused per L6 |
| Letters: A Ă B C D E F G H I Î J K L M N O P Q R S Ș T Ț U V W X Y Z, then space; 31 unused | GUESSED (the order) | the set is the L6 one; the order of the codes has not survived |
| AC 0151: S ← I (positive) | GUESSED (the sign) | the table: “S ← i” |
| One character at the reader/typewriter ≈ 0.1 s | GUESSED | the order of magnitude of a teleprinter |
| Program tape: one word = 6 characters of 5 bits (m1–m30) | DEDUCED | Geier: “two 15-bit instructions … by just six characters” |

## The console
| Choice | Status | Justification |
|---|---|---|
| The switches under M load register M directly | DEDUCED | the M lamps are paired with switches (Farcaș; Romanian Wikipedia) |
| MEMORIE SCRIERE (write): drum[RAI] ← M; CITIRE (read): M ← drum[RAI]; immediately | DEDUCED | the inscriptions of the MEMORIE group; RAI has switches |
| “INTRODUCE 7 CATEG. DIN RA ÎN R I” (enter 7 bits of RA into R I): R I ← 7 bits of RA | DEDUCED | “7 categories” = 7 bits = the width of R I |
| “INTRODUCE M ÎN RI” (enter M into RI): RI ← the current instruction in M | DEDUCED | inscription |
| CALCULEAZĂ AUTOMAT / INSTRUCȚIE UNICĂ (compute: automatic / single instruction) | CERTAIN (existence) / DEDUCED (effect) | inscription; lab sheet 7 p.6 |

## Micro-operations (the left-panel lamps)
| Choice | Status | Justification |
|---|---|---|
| The 39 micro-operations and their texts | CERTAIN (where not `[?]`) | the panel inscriptions (3D model textures) |
| At every micro-operation: R I → R II, the new address into R I | DEDUCED | Lab sheet 7 p.3: “the odd-rhythm pulses move the content of register R1 into R2” |
| The number shown in R I / R II = the number of the grid cell on the left panel | GUESSED | the real microprogram addresses (94 → 90 → 24, lab sheet 7 p.6) do not match the grid; their table is lost |
| The micro-operation sequences per instruction (`MEC_UOP_SEQ`) | DEDUCED | composed from the panel’s micro-operations; the real order has not survived (lab sheet 7 pp.2–4 missing). Addition was hard-wired and has no lamp of its own |
| The AC microprograms (94 → 90 → 24, 91 → 90 → 24) | CERTAIN (lab sheet 7 p.6) | they are microprogram addresses, not grid cells; not yet emitted in the trace |

## The INEX-1 oracle (the original preloader, facsimile 5)
`build/mecvariants inex` runs the original preloader on a tape of 3 known words, under all 8 combinations:

| shift | pair order | code 14 | result |
|---|---|---|---|
| **n = the field** | **1 first** | **jumps on s < 0** | **SUCCEEDS** |
| the other 7 combinations | | | fail |

Conclusions (DEDUCED, confirmed by the original code):
- the number of shift places is the address field itself;
- instruction 1 runs first (code 1 = m6–m10, address 1 = m21–m30, printed first in the listing);
- **code 14 (octal 16) jumps when S is negative**, and code 15 (octal 17) when S ≥ 0 — the opposite of Geier’s table as it appears on Wikipedia (14 = TPO “s ≥ 0”, 15 = TN “s < 0”). Either the table rows are swapped in the transcription, or the sign convention differs. **An open question, to be checked in Geier 1961 / the lab sheets.** The mnemonics stay as in the table; the `branch14_on_negative` variant controls the direction.
- How the preloader works: S starts at −1 (a sentinel), receives 5 bits per character and shifts by 5; after 6 characters the sentinel (bit 0) reaches the sign position and S becomes positive → the loop stops, the word (m0 = 0, m1–m30 = the 6 characters) is stored, and `MS 0014` advances the store address.

## The reprinting oracle (the program of 6 Sept 1962, facsimile 4)
The original program, with 7 reconstructed constants (1551, 1556, 1557, 1600, 1625, 1626, 1675), started at 1477, **prints its own listing (1477–1545, 39 lines) character for character identical to the facsimile**, in ≈ 114 s of simulated time (`tests/test_retiparire.c`).

It independently confirms:
- the shift by n = the field: each octal digit is extracted with `DLD 1` / print s0…s3 / `DLS 4`;
- **code 15 (octal 17) jumps on s ≥ 0**: the loop `MS 1625` / `17 1477` continues while the counter is ≥ 0 — the same 14/15 swap as in INEX-1;
- AC 0136 prints the digit in s0…s3 (with s0 = 0 for octal digits);
- the period listing format `AAAA  c1 aaaa  c2 aaaa` was the output of this very program.

It also shows:
- **MS also leaves the result in S** (otherwise the loop would stop after the first line).

Still guessed: the exact codes for space and newline (10 and 13 here) and the mask 1600 (chosen to clear address 1).

## After the final review
- `mec_op_effect(code, variants)` gives the **real** effect of codes 14/15 under the active variant; interfaces must use it instead of the table text.
- −0 is displayed as “0” (`mec_to_double`).
- The “2(ra) goes into RAI” lamp lights only when the jump is actually taken.
- Fractions in `.mec` files are read with our own parser (`0,5` or `0.5`), independent of locale; `nan`, `inf`, `0x…`, `1e…` are rejected.
- Word 0001 of INEX-1 has the provenance DEDUCED (the digit corrected by hand).

## The web console
The choices made for the console page (`web/js/bindings.js`, `web/js/glow.js`, `web/data/`), each with its status.

| Choice | Status | Reason / source |
|---|---|---|
| Lever up = 1, down = 0 (the M and RAI switches) | GUESSED | No source gives the direction; it is the usual convention. |
| Momentary (spring back after 150 ms): ANULEAZA, INTRODUCE, INSTRUCTIA 1/2, MEMORIE SCRIERE/CITIRE, SE OPRESTE / NU SE OPRESTE, CALCULEAZA AUTOMAT / INSTRUCTIE UNICA. Latching: the M, RAI and IMPULSURI switches | GUESSED | The commands are momentary actions; M and RAI hold a word / an address. |
| ADUNARE 1, M+S 2, MEMORIE TAMBUR, MEMORIE FERITE, the generator switches and knob do nothing | GUESSED | Their function is undocumented (FERITE: the ferrite memory, unfinished in 1962–1963). |
| IMPULSURI — INTRERUPE (interrupt) stops the machine and lights OPRIT; pressing again (RESTABILESTE, restore) lets it start again | GUESSED | From the inscription. |
| The MEMORIE lamps (SCRIERE red square, CITIRE blue square) flash on writing/reading from the console | GUESSED | On the panel they sit next to those buttons. |
| The INSTRUCTIA 1/2 lamps show the phase (first / second instruction of the word); MEMORIE TAMBUR lit, FERITE off | DEDUCED | The inscriptions; the machine worked only with the drum. |
| The generator lamps: 1, 3, 5 lit (fixed); the three pilot lamps in the middle of the left panel: off | GUESSED | What they showed is unknown. |
| SE OPRESTE / NU SE OPRESTE lights the lamp of the chosen overflow behaviour | DEDUCED | The inscription “IN CAZ DE DEPASIREA CAPACITATII REGISTRULUI” (on register overflow). |
| Lamp colours (M green; RI green, green, amber, red, red, then green; R I white, white, then red; RA, RAI, R II red; micro-operations white; MEMORIE red/blue squares; IMPULSURI and overflow red/green; CALCULEAZA green) | CERTAIN | The 2011 photograph (Turbojet, Wikimedia, CC BY-SA 4.0). |
| Face colour: side panels cream (#e2dcc2), middle panel blue (#4a7cad) | CERTAIN (approximated) | The 2011 photograph; the 3D model textures look greenish because of the lighting. |
| Lamp inertia: lighting τ = 25 ms, going out τ = 70 ms | GUESSED | A small filament lamp. |
| The second meter of row 2 (missing today) is drawn | DEDUCED | The empty bezel in 2011; the 1961 photograph shows it. The scales and needles are GUESSED. |
| The top-row voltmeters have a 0–250 V scale | GUESSED | The 2011 photograph shows 5–6 figures, the last with three digits, but they cannot be read; 250 V is the user’s recollection and matches tube anode voltages. The other dials: graduations only. |
| A micro-operation lamp lights if the micro-operation ran at least once since the previous frame | GUESSED | At 50 instr/s the eye sees the lamps pulsing; see also the inertia. |
| Loading a program (and Reload) restores the pulses (IMPULSURI on RESTABILESTE) | GUESSED | A clean start; otherwise the visitor is left with a stopped machine without knowing why. |
| The M and RAI switches latch and put the whole word into the register at every move | GUESSED, in tension with the sources | The ANULEAZA M / RAI (clear) buttons and “three-finger” entry suggest that the switches may have added bits into a register cleared beforehand. To be decided before the guided tour (Plan 4) teaches the operating procedure. |

## The workshop
The workshop’s choices (`web/js/atelier/`, the core: `PROV_MODIFICAT`, `written`, `visitor_tape`).

| Choice | Status | Reason / source |
|---|---|---|
| Every word the visitor puts on the drum (editor, MEMORIE SCRIERE, their own tape through INEX-1) gets the provenance MODIFIED | — (emulator rule) | A visitor must never believe they are running original code when they are not (spec §2). |
| After a tape punched by the visitor is put in the reader, every word the program writes to the drum becomes MODIFIED, until the next program load | GUESSED | We do not follow every bit from the tape to the drum; the rule covers the INEX-1 case. |
| Words the program writes while running show as “written by the program”, keep their provenance, and are not saved | — (emulator rule) | They are no longer the word in the document, but the visitor did not change them either. |
| The INEX-1 preloader loads from the address of the ME instruction at 0014; the operator changed it to load elsewhere | GUESSED | Facsimile 5 gives 0014 = ME 0002 and the start procedure, but does not say how the address was chosen. |
| In “rows” mode the visitor writes the value CIT reads; the tape is punched with the bits inverted | DEDUCED | A hole = 0 (Baltac, via the Romanian Wikipedia). |
| The Console view and the tour always load the original program; in the Workshop and Both views, choosing a program in the bar also brings the visitor’s saved changes, and the bar label shows MODIFIED (and deleted words) | — (emulator rule) | The tour and a new visitor must see the original; in the workshop, visitors find their work again. |

## Sound
The sound choices (`web/js/sound/`). No recordings of MECIPT-1 exist.

| Choice | Status | Reason / source |
|---|---|---|
| 3D view: marius0198’s model with lamps lit from the emulator; the switch levers are pressed with a click and tilt with their state (angle chosen by eye) | — (emulator rule) | the model is an artistic reconstruction (Sketchfab, CC BY 4.0); the lamp/switch–object link comes from `positions.json` (tools/dae_layout.py) |
| 3D view, corrections after the museum photographs: blue shelf and frame face, polished metal, voltmeter needles from the hub below the centre | DEDUCED | photographs of the console at the Museum of Banat; the model had grey metal here and the needles near the edge |
| 3D view: the missing voltmeter on the second row, completed with one like its neighbours | GUESSED | only the ring remains in the museum; the working machine had the voltmeter |
| The drum drawn below the console: upright, on the gold cabinet, with the head blocks around it and the FŰTÉS / TÖRLÉS panel | CERTAIN (the look) | Turbojet’s photographs, Museum of Banat, 2015 (Wikimedia Commons, CC BY-SA 4.0); capacity and speed: Farcaș, Baltac |
| Drum map: even addresses on one half of the ring, odd ones on the other | DEDUCED | Baltac, facsimile 8 (even and odd addresses on different halves of the drum); the map itself is an emulator tool |
| The stripes passing over the drawn cylinder | GUESSED | they only show the rotation (slowed down); the real steel is not documented in detail |
| The drum’s green lamp lit while the machine is powered; FŰTÉS and TÖRLÉS off; its switches do nothing | GUESSED | their function is not documented |
| In the drawing the rotation is slowed down (one turn every 1.6 s) and goes on while the page is open | — (emulator rule) | at 50 rev/s the eye would see only a blur; the drum spun while the machine was powered |
| The drum hum has a 50 Hz fundamental (with harmonics) | DEDUCED | The drum turns 50 times a second: 1024 word times per turn, 51,200 a second (`core/machine.h`). |
| The timbre of the hum, the tape reader, the typewriter and the controls | GUESSED | No recordings exist; the sounds are synthesised to sound mechanical (spec §5). |
| One click per tape row read and one key strike per character, ≈ 0.1 s | GUESSED | The rate from “Peripherals” (one character ≈ 0.1 s). |
| A new line on the typewriter sounds the carriage | GUESSED | Typewriters of the period returned the carriage at every line. |
| Above 40 events a second (measured in real time) the clicks become a quieter buzz; below 25 they return | — (emulator rule) | At high speed the clicks could no longer be heard separately. |
| The top bar and the Workshop make no sound; in Explain mode the controls do not click | — (emulator rule) | They are present-day controls, not the machine's; in Explain mode the controls do not act. |
| The hum is heard whenever sound is on, not only while a program runs | GUESSED | The drum turned whenever the machine was powered. |

## INEX-1 reconstructed (Plan 6)
The INEX-1 routines (`programs/src/inex1-rutine.mec`) are written now. From facsimile 5 only the preloader and the entry points are known.

| Choice | Status | Reason / source |
|---|---|---|
| Entry points 0025, 0026, 0040, 0132–0136, 0246 and what each does | CERTAIN (addresses, role) | Facsimile 5 |
| Calling: the program puts the word “T r” into V (0002), the argument into S, and jumps to the entry; the routine returns with T 0002 | GUESSED | “returns to V” (facsimile 5); there is no return register |
| The routines clobber S, I and cells 0003–0007; 0044 is the reader’s cell | GUESSED | the original preloader uses 0044 for CIT |
| 0133: S = c1 α c2 β (α digits for integers, β decimals); by default α = 3, β = 9 | GUESSED | Facsimile 5: “in S with t−α 00−β”; 9 decimals as in facsimile 3 |
| 0134: the integer n·2⁻³⁰, “-” in front if negative, α digits, leading zeros as spaces | GUESSED | — |
| 0135: “-” in front if negative, “o,” and β truncated decimals, then the mark after the number | GUESSED (form) / DEDUCED (truncation) | Facsimile 3; exact truncation reproduces 44 of the 45 sine values |
| The mark after each number in facsimile 3 is printed as the minus (code 12) | GUESSED | the closest character in the typewriter’s set; in the facsimile it sits a little lower |
| 0136 / 0132: S = −n·2⁻⁵, n spaces / n new lines | DEDUCED (the argument) / GUESSED (0132) | Facsimile 5 gives “−n·2⁻⁵ in S” next to 0136 |
| 0246: S = 00 A 00 B, the words from A to B with 0135, 5 to a line | GUESSED | “5 to a line” as in facsimile 3 |
| 0040 (0026): reads 6-row words from the console into the address of the ME at 0045, until the tape ends; 0025: S = 00 A 00 n, n words to A, returns via V | GUESSED | the same technique (sentinel) as the original preloader |
| Signed constants (character codes ≥ 8) are kept shifted by one bit and restored with DS 1 | — (emulator rule) | only m1–m30 go on tape (Geier) |
| The INEX-1 tape: words 0002–0277, with identical copies of the preloader at 0010–0015 and 0014 punched as “ME 0014” | DEDUCED | the preloader writes over itself; only this way does loading go on |
| “146 (VF)” next to 0135 in facsimile 5 | unknown | does not follow from the work |

## The computing programs (Plan 6)
| Choice | Status | Reason / source |
|---|---|---|
| Sine table: the machine computed y ≈ sin x / 2 and printed 2y − 2⁻³⁰ | DEDUCED | all 45 values of facsimile 3 correspond to odd binary words (by chance: 1 in 2⁴¹) |
| The argument: n·π/360, with π/360 truncated (o43575065), added n times | DEDUCED | the trend of the facsimile’s errors, −0.18·n·cos x units |
| The Taylor series term by term, 5 terms; w² rounded (INR), terms truncated (IN), the ratio 2/3 rounded | RECONSTRUCTION | found by exhaustive search (`tools/ref/sin_search.py`, `sin_metoda.md`); reproduces 44 of the 45 values |
| sin 32° comes out o,52991926o, not o,529919258 as in the facsimile | — (unexplained difference, accepted) | every variant reaching 44 misses it; the facsimile’s digits read clearly |
| IN truncates and INR rounds half up | GUESSED, confirmed by facsimile 3 | the method found needs no change to the core |
| Vidraru: crest at 834 m, radii 160 / 80 m, scaled columns (h/1000, N/10⁶, σ/10⁴) | GUESSED | illustrative calculation; height and thicknesses are public |
| Romexpo: rise 24 m, φmax worked out beforehand, 32 meridians, scaled columns (r/100, c/100) | GUESSED | illustrative calculation; the diameter is public |
| The computing programs start from 0400 with the INEX-1 routines already on the drum | — (emulator rule) | the visitor does not wait for the INEX-1 tape to be read (spec §4.2) |
