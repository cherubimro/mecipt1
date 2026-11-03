# Cuvântul

Un cuvânt al mașinii are **31 de biți**, numerotați **m0 … m30**, la fel ca becurile registrului M de pe pupitru (0 … 30). SIGUR — Lucrarea de laborator 7, p. 1.

## Ca număr
- **m0** e semnul (0 = plus, 1 = minus); **m30** e bitul cel mai puțin semnificativ. SIGUR.
- Numerele sunt **fracții** între −1 și 1 (virgulă fixă, înaintea lui m1).
- Numerele negative sunt în **complement față de unu**: −x se obține inversând toți biții lui x. De aceea există două zerouri, +0 și −0; emulatorul le tratează pe amândouă drept zero la salturi și afișează „0”. SIGUR (complementul), GHICIT (−0 la salturi).
- Exemple: 0,5 = `04000000000` în octal; −0,5 = `13777777777`; 0,25 = `02000000000`.
- Un rezultat care iese din interval „depășește capacitatea registrului” și aprinde becul DEPASIT CAPACITATEA REGISTRULUI.

## Ca instrucțiuni
Un cuvânt ține **două instrucțiuni** de câte 15 biți: un **cod de operație** de 5 biți și o **adresă** de 10 biți (0 … 1023). SIGUR — Lucrarea 7, p. 1, și etichetele pupitrului.

| Biții | Câmpul | Pe pupitru |
|---|---|---|
| m0 | 0 | — |
| m1–m5 | codul 2 | CODUL 2 |
| m6–m10 | codul 1 | CODUL 1 |
| m11–m20 | adresa 2 | ADRESA 2 |
| m21–m30 | adresa 1 | ADRESA 1 |

## Octalul și listingurile
Programatorii scriau totul în **octal** (grupe de câte trei biți). Un rând de listing de epocă arată așa:

```
1477  27 0000  30 0000
```

Pe coală, mașina de scris bate „o” în loc de zero, ca în facsimile: `1477  27 oooo  3o oooo`.

Rândul înseamnă adresa cuvântului (1477), apoi **codul 1 și adresa 1**, apoi **codul 2 și adresa 2**. Că listingurile tipăresc întâi perechea 1 e DEDUS din preîncărcătorul INEX-1; formatul însuși e SIGUR — e chiar ieșirea programului original de retipărire din 1962, pe care emulatorul îl rulează (capitolul 6).

Atenție: codurile din listing sunt în octal. `27` înseamnă 23 în zecimal, adică instrucțiunea **UI**; `33` e **CIT**. Tabelul complet e în capitolul 3.
