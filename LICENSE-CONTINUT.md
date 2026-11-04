# Licența conținutului

(C) 2026 Alin-Adrian Anton <alin.anton@upt.ro>

Codul sursă al proiectului este sub **AGPL-3.0-or-later** (vezi `LICENSE`).

Conținutul (texte, programe MECIPT-1 transcrise, grafică, sunete proprii) este sub
**Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)** —
https://creativecommons.org/licenses/by-sa/4.0/

## Atribuiri

- **Pupitrul MECIPT-1 (fotografie, 2011)** — Turbojet, Wikimedia Commons, „MECIPT-1 Control desk.jpg”, CC BY-SA 4.0.
- **Modelul 3D „MECIPT-1” (2020)** — marius0198, https://sketchfab.com/3d-models/mecipt-1-62ddfc49f1c54967967d76abab5f3d2d, CC BY 4.0. Inscripțiile pupitrului au fost transcrise din texturile acestui model.
- **Programele originale** — transcrise din facsimilele publicate de Vasile Baltac în *MECIPT – Mașină Electronică de Calcul a Institutului Politehnic din Timișoara – Evocări și Documente* (2011): preîncărcătorul INEX-1 (Facsimil 5), programul de retipărire a programelor din 6.09.1962 (Facsimil 4). Imaginile facsimilelor nu sunt reproduse aici.
- **Lucrările de laborator** (Baltac, 1965–1966) — citate pentru formatul cuvântului și microprogramare.
- **Setul de instrucțiuni** — A. Geier, *Programarea calculatorului electronic cifric MECIPT I în regimul virgulă mobilă*, Buletinul Științific și Tehnic al IPT, 1961 (via Wikipedia RO, articolul „MECIPT”).
- **Descrieri** — Dan D. Farcaș, *MECIPT, o istorie subiectivă* (2005); Ștefan Mărușter, *Povestea unei lucrări*.
- **Pozițiile becurilor și comutatoarelor** (`web/data/positions.json`) — proiectate de `tools/dae_layout.py` din modelul 3D de mai sus (MECIPT-1_V4.dae), deci derivate din opera lui marius0198 (CC BY 4.0); publicate aici sub CC BY-SA 4.0.
- **Desenul panourilor** (`web/data/art-*.json`, `web/data/lamp-colors.json`) — trasat după texturile modelului 3D de mai sus (CC BY 4.0), cu culorile becurilor și ale feței luate din fotografia din 2011 (CC BY-SA 4.0); publicat sub CC BY-SA 4.0.
- **Fonturi** (`web/fonts/`) — Barlow Semi Condensed (The Barlow Project Authors) și Courier Prime (The Courier Prime Project Authors), ambele sub **SIL Open Font License 1.1**; textul licenței e alături, în `OFL-*.txt`.
- **Datele paginii** (`web/data/*.json`, `web/programs/catalog.json`) — CC BY-SA 4.0. Programele oferite în pagină (`programs/*.mec`), cu proveniența fiecărui cuvânt: retipărirea (`retiparire-1962.mec`, Facsimil 4) și preîncărcătorul INEX-1 (`inex1-preincarcator.mec`, Facsimil 5) sunt transcrieri ale documentelor de epocă; banda INEX-1 (`inex1-banda.mec`), tabelul de sinus (`sinus-1962.mec`, rezultatul din Facsimil 3) și calculele ilustrative Vidraru (`vidraru.mec`) și Romexpo (`romexpo.mec`) sunt RECONSTRUCȚII scrise pentru acest proiect, CC BY-SA 4.0 (sursele în `programs/src/`). Banda de test de 3 cuvinte (`tests/data/inex-banda-3-cuvinte.mec`) e GHICITĂ și rămâne doar în teste.
- **Panoul din mijloc** (`web/data/art-middle.json`) — măsurat pe fotografia din 2011 (Turbojet, CC BY-SA 4.0).
- **Tamburul magnetic** (desenul din `web/js/drum.js`) — trasat după fotografiile „MECIPT-1 Drum memory” și „MECIPT-1 Drum memory 2” (Turbojet, Wikimedia Commons, 2015, CC BY-SA 4.0); publicat sub CC BY-SA 4.0.
- **Modelul 3D** (`web/model3d/`: `scene.gltf`, `scene.bin`, `textures/`) — „MECIPT-1” de marius0198, Sketchfab, 2020, **CC BY 4.0** (https://sketchfab.com/3d-models/mecipt-1-62ddfc49f1c54967967d76abab5f3d2d); texturile panourilor laterale sunt convertite din PNG în JPEG; din textura panoului drept s-a scos reflexia blițului din fotografie (`tools/model3d_deglare.py`). La afișare (`web/js/view3d.js`) raftul și fața ramei primesc vopseaua albastră a modelului, metalul devine lucios, acele voltmetrelor de sus sunt reașezate și cadranul gol de pe rândul al doilea primește fața vecinului; fișierele modelului rămân altfel neschimbate. Atribuirea originală e în `web/model3d/license.txt`.
- **three.js** r160 (`web/vendor/three/`) — © three.js authors, licență **MIT** (`web/vendor/three/LICENSE`); importurile sunt adaptate ca să meargă fără internet.
- **Iconița și imaginea de partajare** (`web/favicon.svg`, `web/img/mecipt-1.png`, o captură a paginii) — făcute pentru acest proiect după desenele de mai sus, CC BY-SA 4.0.
- **Textele ajutorului** (`web/data/help/*.json`, generate de `tools/help/gen_help.py`) — scrise pentru acest proiect după sursele de mai sus, CC BY-SA 4.0.
- **Documentația** (`web/doc/`, `docs/semantica.en.md`) — scrisă pentru acest proiect după sursele de mai sus, CC BY-SA 4.0.
- **Atelierul** (`web/doc/{ro,en}/09-atelierul.md`, explicațiile din `tools/help/gen_help.py`) — scrise pentru acest proiect, CC BY-SA 4.0. Fișierele `.mec` descărcate din Atelier conțin programele de mai sus, cu atribuirea lor, plus modificările vizitatorului.
