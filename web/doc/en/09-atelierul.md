# The workshop

The workshop lets you do what MECIPT-1 programmers did: read a program in the notation of the time, change it, put it on the drum or on tape and run it. Open it from the bar under **Workshop** (or **Both**, to see the whole console too). It is the same machine: what you run in the workshop shows on the console.

## How a program was written in 1962
The programmer wrote on paper, in octal, with **absolute addresses** (there were no symbolic labels): for every word, its address on the drum and its two instructions — `1477  27 0000  30 0000`. The mnemonics (`UI`, `CU`, `CIT`…) come from A. Geier’s table (1961). The start-up program was entered from the console, word by word; the rest came on punched tape, prepared separately on a telex-type machine (Farcaș).

## The editor
- Each row is a word on the drum: the address, the instructions with mnemonics, the same in octal, the value as a fraction and the provenance. A word is just 31 bits: an instruction or a number, depending on how the program uses it — so the row shows both readings.
- Click a row, type (`UI 0000  CU 0000`, `27 0000  30 0000` or `= 0.5`) and press Enter: the word is written to the drum between two instructions, even while the machine runs. A mistake is shown under the row, and the drum stays unchanged.
- “New address” adds a word at an empty address; “Delete the word” empties the address. Rows also open with Enter, from the keyboard.
- “Download .mec” saves the program as a text file (the original program plus your changes); “Open .mec” loads it back. A file the core does not accept is refused whole, with the error message, and the drum stays unchanged.

## MODIFIED and “written by the program”
- Every word you put on the drum gets the provenance **MODIFIED** (MODIFICAT in Romanian): from the editor, with MEMORIE SCRIERE from the console, or from a tape you punched. No changed word stays ORIGINAL — not in the editor, not on the drum, not in the program label, not in the downloaded file.
- An opened file is not taken on trust: its words are compared with the catalogue program, and whatever differs becomes MODIFIED.
- A word the program writes while running (the reprinting program rewrites one of its own instructions) shows as **“written by the program”**: it is no longer the word in the document, but you did not change it either. It is not saved.
- The Console view and the guided tour always load the original program. In the Workshop (and Both), the program chosen in the bar comes with your saved changes, and the bar label shows MODIFIED, including deleted words.

## The drum
A 32 × 32 grid: each small square is a word (address = the row on the left, in octal, + the column). The colour and the letter give the provenance: **O** original, **D** deduced, **R** reconstruction, **G** guessed, **M** modified, **P** written by the program. While the program runs, the current address (RAI) is outlined. A click on a square takes you to its row in the editor.

## The tape and the INEX-1 preloader
1. In the punch, write words (one word per line) or 5-bit rows (the value the CIT instruction reads; the drawing shows the holes, i.e. the bits inverted) and press “Punch”.
2. “Put the tape in the reader”.
3. “Put the INEX-1 preloader on the drum” writes the preloader’s 8 original words (facsimile 5) over what is on the drum, without clearing it.
4. The preloader writes the tape’s words starting at the address of the ME instruction at **0014** (0002) and advances it after each word. To load elsewhere, change the address at 0014 in the editor — for example `25 1000  01 0001`. The facsimile does not say how the address was chosen: that the operator changed word 0014 is **GUESSED**. The punch warns you if the tape would write over the preloader itself (0000–0001 or 0010–0015; past 1777 the address wraps to 0000).
5. Set the start address to 0010 and press “Run”: the tape runs through the reader, and the machine stops with HIRTIA AGATATA when it ends.

Words the program writes after you put your own tape in the reader become MODIFIED — the emulator’s rule, **GUESSED**: we cannot follow every bit from the tape to the drum.

The sign bit m0 does not fit on the tape (6 × 5 = 30 bits); the punch tells you if a word would lose it.
