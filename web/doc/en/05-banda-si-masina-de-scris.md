# Punched tape and the typewriter

## The tape
Programs and data came in on **telex tape**, read mechanically. Each coding rule, with its status:

| Rule | Status | Source |
|---|---|---|
| The tape has **5 data channels** and a feed-hole track | CERTAIN | Farcaș; Romanian Wikipedia |
| **A punched hole = “0”**: a hole means bit 0, no hole means bit 1 | CERTAIN | Romanian Wikipedia (Baltac) |
| The **CIT** instruction reads **one row** (5 bits) and stores it right-aligned, the rest of the word 0 | CERTAIN (rest 0: DEDUCED) | Geier’s table |
| A program word = **6 rows** of 5 bits, the first row = m1–m5; the sign m0 is not on the tape | DEDUCED | Geier: “two 15-bit instructions … by just six characters” |
| **Channel 1** = the most significant bit of the row | GUESSED | — |
| Channel layout on the paper: **1 · 2 · feed · 3 · 4 · 5** | DEDUCED | telex tape has the feed track with 2 channels on one side and 3 on the other |
| When the tape ends, the machine stops with **HIRTIA AGATATA** (paper jammed) | DEDUCED | the console lamp |
| One character is read in ≈ 0.1 s | GUESSED | the order of magnitude of a teleprinter |

### Example: one word on the tape

{{tape-example}}

The bits are read off the tape exactly as the machine uses them; what might differ from a real tape is only the mirroring of the drawing (which channel is “1”) — GUESSED until a photograph of a MECIPT tape or a reader diagram turns up.

### How the INEX-1 preloader read a word
The original preloader (facsimile 5) puts −1 into S as a “sentinel”, then for every row read it shifts S by 5 places and adds the 5 bits. After 6 rows the sentinel reaches the sign position, S turns positive, the loop stops and the word is stored; `MS 0014` then advances the store address. The emulator runs exactly this code. The original INEX-1 tape has not survived; the page uses a 3-word test tape (GUESSED).

## The typewriter
Results were printed on an **ordinary electric typewriter**, with electromagnets placed above the keys, on A4 or A3 paper (CERTAIN, Farcaș).

- **AC 0136** prints a **digit** from bits s0 s1 s2 s3 of S; **AC 0133** a **letter** from s0 … s4. CERTAIN (Geier’s table).
- **The character sets** — CERTAIN (Baltac, lab sheet L6, via the Romanian Wikipedia): the numeric set has the digits, space, minus, point, comma and carriage return — **code 14 (octal 16) was not used**; the letter set has space, the 26 letters of the English alphabet and ă, î, ș, ț — **code 31 (octal 37) was not used**.
- **Which code stands for which character** has not survived: the layout of the tables below is GUESSED. The reprinting program uses two codes of the numeric set, octal 12 and 15, for space and new line; which is which cannot be deduced, and the emulator chose 12 = space, 15 = new line.
- The codes in the tables are in **octal**, as in the period listings.
- The speed, about 10 characters a second, is GUESSED.

### Digits (AC 0136)

{{digits}}

### Letters (AC 0133)

{{letters}}

## The ICR automaton
“Imprimare și Citire Repetată” (repeated printing and reading) — started with AC 0111, stopped with AC 0134, fed with TICR (code 28). The name and the instructions are CERTAIN; what it did exactly is GUESSED.
