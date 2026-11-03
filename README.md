# MECIPT-1 — emulator pentru muzeu

Emulatorul primului calculator universitar din România, **MECIPT-1** (Institutul Politehnic din
Timișoara, 1961), pentru vizitatorii unui muzeu: pupitrul de comandă așa cum arată azi, viu, cu
programele originale din 1962.

## Starea proiectului
- **Nucleul** (Planul 1): mașina în C — tamburul de 1024 de cuvinte, registrele, setul de
  instrucțiuni, microoperațiile panoului stâng, cititorul de bandă și mașina de scris. Rulează
  programul original de retipărire din 6.09.1962 și preîncărcătorul INEX-1.
- **Pupitrul web** (Planul 2): pagina statică cu cele trei panouri redesenate vectorial, becurile
  legate de nucleu (compilat în WebAssembly), comutatoarele și butoanele funcționale, cititorul de
  bandă și mașina de scris, la viteza din 1962 sau „rapid”.
- **Ajutorul** (Planul 4): turul ghidat, butonul „Explică” (explicația oricărui element, cu valoarea
  tradusă, statutul SIGUR/DEDUS/GHICIT și sursele) și documentația pentru pasionați (`doc.html`):
  cuvântul, setul de instrucțiuni, pupitrul, banda și mașina de scris, programele, sursele.
  Totul în **română și engleză** (RO | EN în bară; inscripțiile pupitrului rămân în română).
- Urmează: atelierul (editor, tambur, perforator), sunetul, reconstrucțiile, telefonul,
  interfețele wx și ncurses (`docs/superpowers/plans/`).

Ce e sigur, ce e dedus și ce e ghicit: `docs/semantica.md` (în engleză: `docs/semantica.en.md`).
Textele ajutorului se scriu în `tools/help/gen_help.py`, iar capitolele documentației în `web/doc/{ro,en}/`. Fiecare cuvânt de program își poartă
proveniența (ORIGINAL / DEDUS / RECONSTRUCȚIE / GHICIT), iar pagina o arată.

## Construire și rulare
Cerințe: `gcc` (C11), `make`; pentru pagină `clang` ≥ 17 cu ținta wasm32 (`clang-17`) și `curl`;
pentru teste Node 20 și, opțional, Google Chrome/Chromium.

```sh
make check        # nucleul: testele unitare și cele end-to-end
make wasm         # build/mecipt.wasm (descarcă o dată wasi-sysroot 21, ≈ 5 MB, verificat cu sha256)
make site         # build/site/: pagina statică completă
make serve        # o servește pe http://127.0.0.1:8000/ (documentația: /doc.html)
make tables       # regenerează web/data/core-tables.json din nucleu (verificat de make check)
make web-check    # testele Node pe WASM-ul real + scenariul din Chrome fără ecran
```

Unelte în linia de comandă: `build/mecasm` (program `.mec` → imagine de tambur, listing),
`build/mecrun` (rulează un program; ieșirea mașinii de scris pe ecran).

Site-ul nu folosește nimic de pe internet la rulare: fonturile, nucleul și datele sunt locale, cu
adrese relative, deci merge din orice găzduire statică.

## Licențe
- Codul: **AGPL-3.0-or-later** (`LICENSE`).
- Conținutul (programele transcrise, desenul pupitrului, datele, textele): **CC BY-SA 4.0**, cu
  atribuirile din `LICENSE-CONTINUT.md`.
- Fonturile din `web/fonts/`: **SIL Open Font License 1.1**.
