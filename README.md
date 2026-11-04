# MECIPT-1 — emulator pentru muzeu

Emulatorul primului calculator universitar din România, **MECIPT-1** (Institutul Politehnic din
Timișoara, 1961), pentru vizitatorii unui muzeu: pupitrul de comandă așa cum arată azi, viu, cu
programele originale din 1962.

Inspirat de publicarea codului sursă original al calculatorului de ghidare Apollo (AGC) — Comanche055 și
Luminary099, zborul Apollo 11 — în domeniul public, digitizat după listingurile de la MIT Museum de proiectul
Virtual AGC (https://github.com/chrislgarry/Apollo-11, https://github.com/virtualagc/virtualagc): o mașină istorică
pe care o poți rula și citi azi, cu programele ei adevărate.

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
- **Atelierul** (Planul 3): vederea Atelier (sau Ambele) din bară. Editorul arată programul de pe tambur
  în notația listingurilor din 1962 și îl lasă pe vizitator să-l schimbe; orice cuvânt schimbat devine
  **MODIFICAT**. Tamburul e o grilă de 1024 de cuvinte colorate după proveniență, cu adresa curentă aprinsă.
  Perforatorul pregătește o bandă, care se încarcă apoi cu preîncărcătorul original INEX-1. Programul
  modificat se ține minte în browser și se poate descărca sau deschide ca fișier `.mec` (citibil de `mecasm`).
- **Sunetul** (Planul 5): zumzetul tamburului, țăcănitul cititorului, clapele mașinii de scris și clicurile
  comenzilor, sintetizate în browser după ritmul mașinii (reconstruite: nu există înregistrări). Butonul 🔊/🔇
  din bară; alegerea se ține minte.
- **Programele reconstruite** (Planul 6): banda INEX-1 (rutinele scrise acum la punctele de intrare din
  Facsimilul 5), încărcată de preîncărcătorul original; tabelul de sinus din 21.02.1962, reprodus după Facsimilul 3
  (44 din 45 de valori cifră cu cifră; diferă sin 32°); calculele ilustrative Vidraru și Romexpo, cu eticheta
  „cifrele nu sunt cele reale”. Sursele în `programs/src/`, generate cu `make programs`; referințele în `tools/ref/`.
- **Telefonul și publicarea** (Planul 7): pe ecrane înguste un singur panou mărit, derulabil, cu butonul de pornire
  la vedere și file jos (Pupitru, Mașina de scris, Bandă, Tambur, Atelier); fără derulare orizontală la nicio lățime. Site-ul static se verifică (`tools/check_site.py`) și se
  publică copiind `build/site/` — vezi `docs/publicare.md`.
- **Tamburul magnetic**, desenat după fotografiile din 2015 (Muzeul Banatului), cu harta celor 1024 de cuvinte, care se umple la încărcarea benzii.
- **Vederea 3D**: butonul 3D/2D arată modelul lui marius0198 (CC BY 4.0) cu becurile aprinse după emulator, comutatoarele apăsabile cu un clic și zonele camerei; three.js (MIT) e inclus local.
- Urmează: interfețele desktop (wx și ncurses, poate regândite ca o interfață Qt).

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
make serve        # o servește pe http://127.0.0.1:8000/ (documentația: /doc.html), fără cache în browser
make tables       # regenerează web/data/core-tables.json din nucleu (verificat de make check)
make web-check    # testele Node pe WASM-ul real + scenariul din Chrome fără ecran
```

Unelte în linia de comandă: `build/mecasm` (program `.mec` → imagine de tambur, listing),
`build/mecrun` (rulează un program; ieșirea mașinii de scris pe ecran).

Site-ul nu folosește nimic de pe internet la rulare: fonturile, nucleul și datele sunt locale, cu
adrese relative, deci merge din orice găzduire statică.

## Autor și licențe
Autor: Alin-Adrian Anton <alin.anton@upt.ro> (vezi `AUTHORS`).

- Codul: (C) 2026 Alin-Adrian Anton <alin.anton@upt.ro>, sub **AGPL-3.0-or-later** (`LICENSE`).
- Conținutul propriu (desenul pupitrului, programele reconstruite, adnotările programelor, datele, textele):
  (C) 2026 Alin-Adrian Anton <alin.anton@upt.ro>, sub **CC BY-SA 4.0**, cu atribuirile pentru materialele preluate
  din `LICENSE-CONTINUT.md`.
- Programele originale din 1962 (cuvintele marcate ORIGINAL: retipărirea și preîncărcătorul INEX-1) **nu sunt ale
  proiectului**: sunt ale colectivului MECIPT (Institutul Politehnic din Timișoara), transcrise din facsimilele
  publicate de Vasile Baltac și arătate ca documente istorice, cu sursa numită.
- Fonturile din `web/fonts/`: **SIL Open Font License 1.1**.
