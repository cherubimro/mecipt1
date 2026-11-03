# The console

The console has three panels. The inscriptions are redrawn letter by letter from the 3D model textures (CERTAIN) and stay in Romanian; the lamp colours follow the 2011 photograph (CERTAIN). On the page, the **Explain** button followed by a click on any element gives its explanation, status and sources.

## Right panel — registers and controls
- **M** (memory register): 31 green lamps, 0–30, each with a switch below. Words travel to and from the drum through M.
- **RI** (instruction register): the code (16 8 4 2 1) and address (512 … 1) of the instruction being executed.
- **R I**: the micro-instruction register, 7 bits (64 … 1).
- **RA**: the address register, 10 bits.
- **RAI** (instruction address register): the address of the next word, with switches; next to it INSTRUCTIA 1 / INSTRUCTIA 2 (instruction 1 / 2) and MEMORIE TAMBUR / MEMORIE FERITE (drum / ferrite memory).
- **ANULEAZA** (clear) RAI / M / S; **INTRODUCE** (enter) 7 CATEG. DIN RA în RI, M în I, M în RI; ADUNARE 1 and M+S 2 (function unknown).
- **MEMORIE** SCRIERE / CITIRE (memory write / read); **IMPULSURI** INTRERUPE / RESTABILESTE (pulses interrupt / restore); **IN CAZ DE DEPASIREA CAPACITATII REGISTRULUI** SE OPRESTE / NU SE OPRESTE (on register overflow: stop / do not stop).
- Status lamps **DEPASIT CAPACITATEA REGISTRULUI** (overflow), **HIRTIA AGATATA** (paper jammed), **OPRIT** (stopped); **CALCULEAZA** AUTOMAT / INSTRUCTIE UNICA (compute: automatic / single instruction).

Each button’s effect is DEDUCED from its inscription, except those marked GUESSED in chapter 7.

## How it was operated
The procedure below is reconstructed from the inscriptions and from the INEX-1 preloader instructions (“put the tape in the reader … and start the computer from 0010”, facsimile 5):

1. **The start-up program was entered by hand**, word by word: the word on the M switches, the address on the RAI switches, then **MEMORIE SCRIERE**. This is how, for example, the INEX-1 preloader (8 words) was entered.
2. **The tape** with the rest of the program went into the reader.
3. **The start address** was set on the RAI switches (for example 0010).
4. **CALCULEAZA AUTOMAT** started the machine; **INSTRUCTIE UNICA** let it take a single step, to be followed on the lamps.
5. The machine stopped at the **O** instruction (the OPRIT lamp), at the end of the tape (**HIRTIA AGATATA**) or on an overflow.

**GUESSED, in tension with the sources:** in the emulator the M and RAI switches latch, and every move puts the whole word into the register; lever up = 1. The ANULEAZA M and ANULEAZA RAI buttons and “three-finger” (octal) entry suggest that the register might have been cleared first and the switches only added bits. Until a source turns up, the emulator keeps the simple version.

## Left panel — the micro-operations
MECIPT-1 was **microprogrammed** following the Wilkes scheme: only addition was hard-wired; the other instructions were built from elementary steps (CERTAIN, Romanian Wikipedia, lab sheet 7). The left-panel grid has one lamp per micro-operation: a large grid headed ⎍ (positive pulse, 16 × 3, 35 inscribed cells) and a small one headed ⊔ (negative pulse, 3 × 3, 4 cells). Texts marked [?] are not read with certainty.

{{uops}}

Registers **R I** (right panel) and **R II** (left panel) have 7 bits each; at every step the content of R I moves into R II (lab sheet 7, p. 3 — CERTAIN). Which micro-operations make up each instruction, and in what order, is DEDUCED: the pages that described them are lost.

Below the grid: **GENERATOR PRINCIPAL** (main generator: IMPULSURI, FRECVENȚĂ FIN, FRECVENȚĂ TREPTE, p, q) — the generator that set the machine’s rhythm; its switches do nothing in the emulator (GUESSED).

## Middle panel — the measuring instruments
Eleven voltmeters (one is missing today, only its bezel remains), a selector, a large rotary switch and small switches. They probably showed the supply voltages of the tubes; what each measured and the scales are GUESSED. The four top voltmeters are drawn with a 0–250 V scale (GUESSED).

## Sound
No recordings of MECIPT-1 exist, so the console sounds are **reconstructed** (GUESSED) and synthesised in the browser. They follow exactly what the emulated machine does:

- **the hum of the drum**, discreet and continuous while sound is on. It is at 50 Hz because the drum turns 50 times a second (DEDUCED: 1024 words per turn, 51,200 word times a second);
- **the clatter of the tape reader**, one click for each tape row read, roughly one every 0.1 s;
- **the typewriter**, one key strike for each character and the sound of the carriage at a new line;
- **the console controls**, discreet clicks on buttons and levers (the top bar and the Workshop make no sound: they are present-day controls).

At high speed the rows and characters come too often to be heard separately; the clicks then become a continuous, quieter buzz. A program that reads rarely still clatters at high speed.

The 🔊/🔇 button in the bar turns sound off and on, and the choice is remembered. Browsers only start sound after the visitor's first gesture (a click, a touch or a key).
