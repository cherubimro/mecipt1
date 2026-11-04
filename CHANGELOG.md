# Jurnalul schimbărilor

Emulatorul MECIPT-1 n-are încă versiuni numerotate; schimbările sunt grupate pe zile și pe planurile din
`docs/superpowers/plans/`. Detaliile sunt în istoricul git.

## 2026-11-04

### Adăugat
- **Vederea 3D apăsabilă**: un clic scurt pe o manetă a modelului face exact ce face clicul pe comutatorul desenat;
  manetele se înclină în sus sau în jos după starea lor, ca în 2D; rotița apropie spre punctul arătat.
- **Zonele camerei** în 3D: CALCULEAZĂ, Comenzi, Registrul RAI, Registrul M, RI și RA, Generatorul, Voltmetrele,
  Tot pupitrul.
- **Harta tamburului**: cele 1024 de cuvinte pe un inel, colorate după proveniență ca în Atelier, umplute pe măsură
  ce se încarcă banda, cu instrucțiunea curentă marcată; adresele pare pe o jumătate, cele impare pe cealaltă (DEDUS).
- **Filele de jos pe telefon**: Pupitru, Mașina de scris, Bandă, Tambur, Atelier.
- `tools/model3d_deglare.py`: scoate reflexia blițului din textura panoului drept.
- `AUTHORS` și acest jurnal.

### Schimbat
- Tamburul desenat se vede rotindu-se: dungile trec pe cilindru în perspectivă.
- Vederea 3D, după fotografiile din muzeu: raftul și fața din jurul panourilor în albastrul mobilei (în model erau
  metal gri); comutatoarele, ramele și soclurile din metal lucios, cu reflexii la fel pe ambele panouri laterale;
  acele voltmetrelor de sus pornesc din butucul de sub centrul cadranului; voltmetrul care lipsește în muzeu de pe
  rândul al doilea e completat cu unul ca vecinii lui (GHICIT).
- Atribuirea modelului 3D (marius0198, CC BY 4.0) stă în documentație, la Surse, cu licența și lista modificărilor,
  nu peste model.
- Autorul, (C) 2026 Alin-Adrian Anton <alin.anton@upt.ro>, apare în subsolul paginii, în documentație, în README și
  în `LICENSE-CONTINUT.md`.
- Documentația se deschide într-un tab nou, ca pupitrul să rămână pe loc.
- README și documentația (capitolul 1) spun de unde vine ideea: codul original al calculatorului de ghidare Apollo
  (AGC), în domeniul public, digitizat de proiectul Virtual AGC.

### Reparat
- Lumina „de nicăieri” de pe panoul drept în 3D (era reflexia blițului din fotografia texturii).

## 2026-11-03

### Adăugat
- **Vederea 3D** (butonul 3D/2D): modelul „MECIPT-1” al lui marius0198, cu becurile aprinse după emulator;
  three.js inclus local; încărcare la prima cerere și mesaj când lipsește WebGL.
- **Planul 7 — telefonul și publicarea**: pe ecrane înguste un singur panou mărit, derulat la CALCULEAZĂ; fără
  derulare orizontală la nicio lățime; `tools/check_site.py`, `tools/site_base_url.py`, `make site BASE_URL=…`,
  `docs/publicare.md`; favicon, imagine și descriere pentru partajare.
- **Tamburul magnetic** desenat sub pupitru, apoi redesenat după fotografiile din 2015 (Muzeul Banatului).
- **Planul 6 — programele reconstruite**: banda INEX-1 reconstruită, încărcată de preîncărcătorul original; tabelul
  de sinusuri din 1962 (44 din 45 de valori identice cu facsimilul); Vidraru și Romexpo ca **calcule ilustrative**,
  cu cifre care nu sunt cele reale; referințe independente în `tools/ref/`.
- **Planul 5 — sunetul**: zumzetul de 50 Hz al tamburului, cititorul de bandă, clapele mașinii de scris, butonul 🔊/🔇.
- **Planul 3 — Atelierul**: editorul în notația listingurilor din 1962, tamburul colorat după proveniență,
  perforatorul, proveniența MODIFICAT, vederile Pupitru / Atelier / Ambele.
- **Planul 4 — ajutorul**: explicații la clic pe orice element, cu valoarea tradusă, surse și statut
  (SIGUR / DEDUS / GHICIT); turul ghidat; documentația pentru pasionați; română și engleză.
- **Planul 2 — pupitrul web**: nucleul compilat în WebAssembly; cele trei panouri redesenate vectorial după modelul
  3D și fotografia din 2011; becuri și comutatoare legate de mașină; cititorul de bandă, mașina de scris, viteza
  epocii sau rapidă.

### Schimbat
- Perspectiva pupitrului: panoul cu voltmetrele la mijloc, panourile laterale spre vizitator.
- Voltmetrele de sus cu scala 0–250 V (GHICIT).

## 2026-11-02

### Adăugat
- **Planul 1 — nucleul în C**: cuvântul de 31 de biți în complement față de unu; setul de instrucțiuni după
  tabelul Geier (1961) și perechea de instrucțiuni; deplasări, înmulțire, împărțire; timpul tamburului; banda
  perforată, mașina de scris, AC, CIT, TICR; comenzile pupitrului și cele 39 de microoperații.
- Formatul `.mec` cu proveniență pe cuvânt, `mecasm`, `mecrun`; preîncărcătorul INEX-1 transcris.
- Oracolele: preîncărcătorul INEX-1 original și retipărirea din 1962, care își tipărește listingul identic cu
  facsimilul.
- Documentul de proiect și planurile.
