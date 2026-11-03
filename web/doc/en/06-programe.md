# The programs

Every word of a program carries a **provenance**, shown on the page under the program choice:

- **ORIGINAL** — transcribed from a period document, with a reference to the facsimile;
- **DEDUCED** — follows from the documents but is not written in them;
- **RECONSTRUCTION** — written now, following the program’s logic, because it is missing from the document;
- **GUESSED** — needed for it to work, without a source.

The facsimile images are **not reproduced** here; they are in Vasile Baltac’s book *MECIPT – Mașina Electronică de Calcul a Institutului Politehnic din Timișoara – Evocări și Documente* (2011).

## Reprinting of programs (6 September 1962)
Facsimile 4: a program that prints its own listing, line by line, in the format `AAAA  c1 aaaa  c2 aaaa`.

- **ORIGINAL**: the 39 words from 1477 to 1545.
- **RECONSTRUCTION**: 7 constants the program reads from outside the listing (1551, 1556, 1557, 1600, 1625, 1626, 1675), deduced from its logic.
- Started at **1477**, the program prints in the emulator a listing **identical to the facsimile**, character for character, in about 114 seconds of machine time. This independently confirms several choices from chapters 3 and 5 (shifts, jumps 14/15, printing digits).

## The INEX-1 preloader and the INEX-1 tape
Facsimile 5: “Instructions for the INEX-1 program — entered by hand”, words 0000–0001 and 0010–0015, with the procedure “put the INEX-1 tape in the reader from the first punched character and start the computer from 0010”.

- **ORIGINAL**: the preloader, 7 words; **DEDUCED**: word 0001, whose last digit is corrected by hand in the facsimile (read as “0” — only then does the preloader advance the address correctly).
- **The INEX-1 tape has not been found.** The facsimile only gives the entry points. The tape on the page is a **RECONSTRUCTION**: routines written now, at those addresses, while the default format values are GUESSED.
- The tape has 190 words (0002–0277), that is 1140 rows. The original preloader reads it in the reader, word by word, in about 3 minutes of machine time, and stops with HIRTIA AGATATA (paper jammed) at the end of the tape.
- The preloader also writes over its own words (0010–0015). The tape holds identical copies of them there, and at 0014 the instruction “ME 0014”. After `MS 0014` it becomes “ME 0015”, so loading goes on.

| Entry point | What it does (facsimile 5) | How a program calls it (GUESSED) |
|---|---|---|
| 0040 (or 0026) | reading tapes from the console | started from the console; reads to the end of the tape, at the address in the ME instruction at 0045 |
| 0025 | reading a tape “as a program” | S = 00 A 00 n: n words to A, returns to V |
| 0133 | the format | S = c1 α c2 β: α digits for integers, β decimals |
| 0134 | integers from S | n·2⁻³⁰; leading zeros become spaces |
| 0135 | fractions from S | “o,” and β decimals (9 by default), then the mark after the number, as in facsimile 3 |
| 0136 / 0132 | n spaces / n lines | S = −n·2⁻⁵ |
| 0246 | print from A to B | S = 00 A 00 B, 5 numbers to a line |

A program calling a routine first puts the return instruction “T r” into cell **V** (0002) and the argument into S. The routine ends with `T 0002`. All the choices are in *Semantics*, section “INEX-1 reconstructed”.

## The sine table (21 February 1962)
Facsimile 3: “Sine table from 1° to 45° computed by MECIPT-1”, 45 values with 9 decimals, 5 to a line. The typewriter strikes “o” for zero and puts a mark after every number: `o,o174524o6_o,o34899496_…`. In the emulator that mark is the minus, the closest character in its set.

- **ORIGINAL**: the result. The program that computed it has not survived.
- **RECONSTRUCTION**: the program, with a method found by searching in the model of the machine’s arithmetic. How it was reached:
  - All 45 printed values correspond to **odd** binary numbers. So the machine computed y ≈ sin x / 2 and printed 2y − 2⁻³⁰.
  - The errors grow by −0.18·n units: the argument was n·π/360, with π/360 **truncated** and added n times.
  - The errors carry an undamped “noise” of about one unit. That means a Taylor series taken **term by term**, each term truncated (IN), with only w² and the first ratio (2/3) rounded.
- **The match**: 44 values come out digit for digit as in the facsimile. **sin 32° comes out `o,52991926o`** instead of `o,529919258` (true value: 0.5299192642). The digits in the facsimile read clearly. Every variant of the method that reaches 44 misses exactly this value. The difference remains unexplained and is left in plain view.
- Started from 0400, the program prints the table in about 2½ minutes of machine time.

## Vidraru dam — illustrative calculation
**Illustrative calculation in the spirit of the one made for the Vidraru dam; the figures are not the real ones.** Neither the program nor the data have survived. The method is that of fixed arches (Farcaș, 1964), much simplified: 11 horizontal arches, from the crest to the foundation.

- Public dimensions: height 166 m, thickness ~6 m at the crest and ~25 m at the base. **GUESSED**: the crest elevation (834 m) and the arch radii (160 m at the top, 80 m at the bottom).
- On each line (one arch), the columns are:
  1. elevation (m);
  2. depth /1000, equal to the water pressure p /1000 (tf/m²);
  3. arch force N = p·R /10⁶ (tf/m);
  4. concrete stress σ = N/t /10⁴ (tf/m²).
- The numbers are scaled to fit the machine’s fractions.
- Started from 0400, the program prints 11 lines in about 1½ minutes.

## Romexpo dome — illustrative calculation
**Illustrative calculation in the spirit of the one made in 1963 for the Romexpo dome; the figures are not the real ones.** The original calculation (July 1963, programmer V. Baltac, Acad. Mateescu’s department) has not survived.

- A spherical dome with the public diameter of 93.5 m. **GUESSED**: the rise (24 m), the angle from the top to the base (~0.949 rad, worked out beforehand, as from tables) and the 32 meridians.
- The sphere’s radius is computed in the program: R = (a² + f²)/(2f).
- On each line (one ring, from the top down), the columns are:
  1. ring number;
  2. the angle φ (radians);
  3. ring radius r = R·sin φ /100 (m);
  4. ring element length c = 2·r·sin(π/32) /100 (m).
- The sine is computed with the 1962 table’s method.
- Started from 0400, the program prints 10 lines in about 1½ minutes.

Vidraru and Romexpo are checked against an independent calculation (`tools/ref/`), done step by step with the same machine arithmetic.
