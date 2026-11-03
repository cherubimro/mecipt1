# The instruction set

The instruction table comes from **A. Geier** (“Programarea calculatorului electronic cifric MECIPT I în regimul virgulă mobilă”, 1961), reproduced in the Romanian Wikipedia: codes 0–28, with 5 variants of code 26 (AC). CERTAIN. Codes 29–31 are not in the table; the emulator stops on them with OPRIT (GUESSED).

In the table, **s** and **i** are the contents of the arithmetic registers S (the accumulator) and I, and **y** is the word at the instruction’s address. The mnemonics are the original Romanian ones.

{{ops}}

## Order of execution
For each word: first **instruction 1**, then **instruction 2**, then **RAI + 1** — the address of the next word. DEDUCED from lab sheet 7 (p. 6: “instruction 2 moves into the place of instruction 1”, “RAI+1→RAI”) and confirmed by both original programs, which only work this way. A jump (T, TPO, TN, TO) puts its address into RAI and starts again with instruction 1 of the word there.

## Timing
Every drum access waits for the wanted word to pass under the heads: 1024 positions, 50 revolutions a second. So the machine did around **50 instructions a second**, and programs carefully laid out on the drum (even and odd addresses on different halves) reached 70–80 (Baltac). The emulator counts time the same way; the exact duration of an operation is GUESSED.

## Codes 14 and 15 (jumps on the sign)
The table says 14 = TPO “jump if s ≥ 0” and 15 = TN “jump if s < 0”. Both original programs (INEX-1 and the reprinting program) only work if **14 jumps on s < 0 and 15 on s ≥ 0** — the other way round. The emulator uses the behaviour confirmed by the programs (DEDUCED) and keeps the table’s mnemonics. This is an open question: either the table rows are swapped in the transcription, or the sign convention differs.

## Shifts
For DLS, DLD, DS, DD the address field gives the number of places **n**. Wikipedia notes “32 − n”; the original programs only work with **n = the field** (DEDUCED). Bits shifted out are lost and zeros come in (GUESSED for the sign).

## Peripheral command AC (code 26)
The sub-code sits in the address field:

{{ac}}

ICR (“imprimare și citire repetată”, repeated printing and reading) was an automaton for repeated printing and reading; the name is CERTAIN, how it worked exactly is GUESSED.

## Reading an instruction on the console
Register **RI** shows the instruction being executed: 5 lamps for the code, 10 for the address. With the “Explain” button and a click on RI, the page translates the code into its mnemonic and the address into decimal.
