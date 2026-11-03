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

## What comes next
Clearly marked reconstructions: the sine table of February 1962 (the original printed result exists, facsimile 3, and serves as a check) and illustrative calculations in the spirit of those for the Vidraru dam and the Romexpo dome — the figures will not be the real ones.
