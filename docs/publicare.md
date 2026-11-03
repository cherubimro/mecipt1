# Publicarea pupitrului MECIPT-1

Pagina e un **site static**: HTML, CSS, JavaScript, nucleul compilat în WebAssembly (`mecipt.wasm`), programele `.mec` și datele JSON. Nu are nevoie de server de aplicații, bază de date sau cont. Orice găzduire de fișiere statice merge: un server web obișnuit, GitHub Pages, Netlify, serverul universității sau al muzeului.

## Construirea
```
make site                                    # build/site/
make site BASE_URL=https://exemplu.ro/mecipt/  # cu adresa publică pusă în etichetele de partajare
make web-check                               # verifică site-ul, testele Node și testul de fum în Chrome
```

`make web-check` rulează și `tools/check_site.py`, care verifică:
- fiecare fișier la care trimit paginile există;
- nu există căi absolute, deci site-ul merge și dintr-un subfolder;
- nu se încarcă nimic de pe alt server;
- programele din catalog sunt toate prezente.

## Publicarea
Se copiază **tot conținutul** lui `build/site/` în folderul public al găzduirii, de exemplu `…/mecipt/`. Nu trebuie configurat nimic:
- `mecipt.wasm` se citește ca fișier obișnuit, deci nu are nevoie de tipul MIME `application/wasm`;
- paginile folosesc numai căi relative;
- imaginile facsimilelor nu sunt în site, doar trimiterile la sursele lor (vezi `LICENSE-CONTINUT.md`).

Recomandat:
- **HTTPS.** Sunetul și restul merg și fără el, dar unele browsere limitează paginile nesigure.
- **`BASE_URL`.** Fără adresa publică, imaginea de partajare (`img/mecipt-1.png`) nu apare la linkurile trimise pe rețele sociale.
- După fiecare actualizare: `make web-check`, apoi copierea din nou a lui `build/site/`.

## Telefonul
Pe ecranele înguste (sub 760 px):
- pagina arată un singur panou, cel drept, cu comenzile, mărit și derulabil în rama lui, cu butonul CALCULEAZA AUTOMAT la mijloc;
- celelalte panouri se aleg la „Vedere”;
- mașina de scris vine prima, apoi cititorul și tamburul;
- rândurile lungi ale colii și editorul Atelierului se derulează lateral.

Testul de fum verifică pagina la 390 px și la 1280 px: pagina nu derulează orizontal, iar butonul de pornire se vede și se poate atinge.
