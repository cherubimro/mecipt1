# The word

A machine word has **31 bits**, numbered **m0 … m30**, like the lamps of register M on the console (0 … 30). CERTAIN — lab sheet 7, p. 1.

## As a number
- **m0** is the sign (0 = plus, 1 = minus); **m30** is the least significant bit. CERTAIN.
- Numbers are **fractions** between −1 and 1 (fixed point, before m1).
- Negative numbers are in **ones’ complement**: −x is obtained by inverting all bits of x. So there are two zeros, +0 and −0; the emulator treats both as zero in jumps and displays “0”. CERTAIN (the complement), GUESSED (−0 in jumps).
- Examples: 0.5 = `04000000000` in octal; −0.5 = `13777777777`; 0.25 = `02000000000`.
- A result outside the range “exceeds the register capacity” and lights the DEPASIT CAPACITATEA REGISTRULUI lamp.

## As instructions
A word holds **two instructions** of 15 bits each: a 5-bit **operation code** and a 10-bit **address** (0 … 1023). CERTAIN — lab sheet 7, p. 1, and the console labels.

| Bits | Field | On the console |
|---|---|---|
| m0 | 0 | — |
| m1–m5 | code 2 | CODUL 2 |
| m6–m10 | code 1 | CODUL 1 |
| m11–m20 | address 2 | ADRESA 2 |
| m21–m30 | address 1 | ADRESA 1 |

## Octal and listings
Programmers wrote everything in **octal** (groups of three bits). A period listing line looks like this:

```
1477  27 0000  30 0000
```

that is, the word’s address (1477), then **code 1 and address 1**, then **code 2 and address 2**. That listings print pair 1 first is DEDUCED from the INEX-1 preloader; the format itself is CERTAIN — it is the very output of the original 1962 reprinting program, which the emulator runs (chapter 6).

Note: the codes in a listing are octal. `27` means 23 in decimal, the **UI** instruction; `33` is **CIT**. The full table is in chapter 3.
