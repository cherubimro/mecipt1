# Emulator MECIPT-1 pentru muzeu — document de proiect

Data: 2026-11-02 · Stare: pentru aprobare (după verificarea unui recenzent independent și răspunsurile utilizatorului)

## 1. Intenția

MECIPT-1 (Politehnica Timișoara, în funcțiune din 1961) a fost primul calculator electronic construit într-o universitate din România. Nu există un emulator al lui. Vrem o **pagină web publică**, pentru **vizitatorii unui muzeu**, în care oricine (de acasă, de pe telefon, din muzeu) vede MECIPT-1 lucrând: pupitrul cu becurile registrelor, banda perforată citită caracter cu caracter, mașina de scris care tipărește rezultatele. Vizitatorul trebuie să poată **rula programe** și chiar să le **rescrie**, inclusiv programe autentice din 1962 și reconstrucții ale calculelor care au făcut istorie (barajul Vidraru, cupola Romexpo).

Modelul este proiectul Virtual AGC (emulatorul calculatorului Apollo), pe care l-am rulat pe stația de lucru: un nucleu de emulare plus interfețe care arată consola reală.

## 2. Pentru cine și cum arată reușita

- **Public:** vizitatori ai unui muzeu, fără pregătire tehnică, intrând pe un link, pe calculator sau telefon.
- **Reușita (în cuvintele utilizatorului):** după câteva minute, vizitatorul a **rulat un program și a văzut becurile cum lucrează**, a văzut **banda perforată citită** și **mașina de scris tipărind**, și a **înțeles cum se folosea** mașina.
- **Anti-țintă (ce ar fi un eșec chiar dacă merge):** să **arate ca un joc** în loc de mașina reală. Totul trebuie să fie **fidel** aparatului și modului de lucru din epocă.
- **Onestitate istorică:** o reconstrucție e acceptabilă **doar dacă e marcată clar** ca reconstrucție. Vizitatorul nu trebuie să creadă niciodată că rulează cod original când nu e așa.

## 3. Ce se construiește

### 3.1 Nucleul de emulare
- Emulează MECIPT-1 la nivel de instrucțiune, cu stare vizibilă la nivel de **microinstrucțiune** acolo unde sursele permit (pupitrul avea execuție „pas cu pas, inclusiv pașii microprogramați”).
- Memorie pe tambur 1024 × 31 biți, nevolatilă; registre S (31), I (30), M (31), RI, RAI (10), RA, R1/R2 (registrele de microinstrucțiuni, 7 biți fiecare); indicatorul de depășire DCR care oprește mașina.
- Periferice: **cititor de bandă perforată** (5 canale + canal de ghidaj; perforație = „0”), **mașina de scris** electrică acționată de electromagneți (cifre, litere inclusiv ă î ș ț), automatul **ICR** (imprimare și citire repetată).
- **Perforatorul nu era legat de calculator** (după Farcaș, benzile se pregăteau la un aparat de tip telex). În emulator el există ca unealtă separată în care vizitatorul își pregătește banda.
- Viteză: implicit **„ca în 1962”** (cadența tamburului, ~50 instr/s, respectiv 70–80 cu adresarea intercalată par/impar), cu buton **„rapid”** pentru programe lungi.

### 3.2 Pagina web — un singur emulator, trei vederi comutabile oricând
Emulatorul continuă să ruleze când se schimbă vederea; e aceeași mașină văzută altfel.
1. **Pupitru** — reproducerea fidelă a pupitrului restaurat (fotografia din 2011 de pe Wikimedia, „MECIPT-1 Control desk”, CC BY-SA 4.0): albastru cu ramă de aluminiu, trei panouri:
   - *stânga* (crem): 3 rânduri de becuri albe (probabil R1/R2 — de verificat), cutia „GENERATOR PRINCIPAL” cu cheie, rând de becuri roșii, comenzile pas cu pas / micropas;
   - *mijloc* (albastru): 10 aparate de măsură (unul lipsă în fotografie), comutatoare, selector rotativ — voltmetre ale tensiunilor de alimentare;
   - *dreapta* (crem): rândul **M** de 31 becuri verzi numerotate 0–30 cu comutator sub fiecare, grupat ±/CODUL 2/CODUL 1/ADRESA 2/ADRESA 1; rândurile RI și RAI (512…1); grupurile de butoane MEMORIE, IMPULSURI, OPRIT, CALCULEAZĂ etc.
   - dedesubt: cititorul de bandă (banda se vede trecând) și coala mașinii de scris.
   - Interacțiune ca la original: introducerea unui cuvânt bit cu bit la comutatoare (octal, „cu trei degete”), pornire de la o adresă, pas cu pas.
2. **Atelier** — pupitru compact sus + unelte: editor de program cu mnemonicele din 1961 (Geier) ↔ octal, vederea tamburului (1024 de cuvinte, adresa curentă evidențiată), perforatorul de bandă, coala mașinii de scris, Reset/Pas/Rulează/viteză.
3. **Ambele** — cele două una sub alta.

Schițele de lucru (vizualizate în sesiunea de brainstorming) sunt la `docs/schite/` (vezi §8).

### 3.3 Ajutor pentru vizitatori
- Buton **„?”** care pornește un **tur ghidat** („acesta e pupitrul… aici e memoria… acum rulăm un program”).
- **Click/atingere pe orice element** (bec, rând de becuri, cadran, comutator, buton) → explicație scurtă pe înțelesul publicului larg, cu valoarea tradusă când are sens (ex. RAI: „adresa curentă: 8, în octal 0010”), plus **„mai multe detalii”** pentru pasionați, cu sursa.

### 3.4 Programe
Fiecare program poartă o etichetă vizibilă de proveniență:
- **Original** (cod din document de epocă, cu trimitere la facsimil): preîncărcătorul **INEX-1** (Facsimil 5, Baltac), **programul de retipărire a programelor** din 6.09.1962 (Facsimil 4).
- **Reconstrucție** (cod scris acum, după o metodă/descriere de epocă, cu explicație ce e reconstruit și după ce): **tabelul de sinus** 1°–45° (rezultatul original tipărit din februarie 1962 există — Facsimil 3 — și servește drept verificare); **calculul pentru barajul Vidraru** (după metoda „dimensionării arcelor încastrate”, Farcaș, *Buletinul științific și tehnic al IPT*, 1964); **calculul elementelor cupolei Romexpo** (iulie 1963, programator Baltac, catedra acad. Mateescu).
- Vizitatorul poate modifica oricare program în Atelier și îl poate rula; versiunea modificată e marcată ca atare.

### 3.5 Limbi, sunet, dispozitive
- **Română și engleză**, comutator vizibil. Inscripțiile de pe pupitru rămân cum erau (română), cu traducere la hover/atingere în engleză.
- **Sunet** pornit implicit (zumzetul tamburului, țăcănitul cititorului, clapele mașinii de scris), cu buton vizibil 🔊/🔇; alegerea se ține minte. Pe telefon sunetul pornește la prima atingere (regula browserelor).
- **Telefon:** pupitrul se vede panou cu panou (stânga/mijloc/dreapta) cu zoom; Atelierul se așază pe verticală.

### 3.6 Ulterior (aceeași mașină, alte interfețe)
- Interfață desktop cu ferestre (wxWidgets) și interfață în terminal (ncurses), ca la Virtual AGC, **folosind același nucleu** ca pagina web, ca să se comporte identic.

## 4. Fidelitate și surse

Regula: fiecare detaliu al emulatorului și al pupitrului are o **proveniență** în una din trei categorii, vizibilă în „mai multe detalii”:
- **Sigur** — scris explicit într-o sursă de epocă sau văzut în fotografie;
- **Dedus** — rezultă logic din surse, dar nu e scris (ex. codurile de operație în octal citite din facsimile);
- **Ghicit** — necesar ca să meargă, fără sursă; trebuie înlocuit când apare documentul potrivit.

### 4.1 Ce știm sigur
| Fapt | Sursă |
|---|---|
| Cuvânt 31 biți; instrucțiune 15 biți = cod 5 biți + adresă 10 biți; 2 instrucțiuni/cuvânt | Lucrarea de laborator 7 (Baltac 1965–66), Farcaș |
| Structura cuvântului-instrucțiune: m0 = 0, m1–m5 cod 2, m6–m10 cod 1, m11–m20 adresă 2, m21–m30 adresă 1 | Lucrarea de laborator 7, p.1; confirmat de etichetele de pe pupitru |
| Instrucțiuni cu o adresă: un operand din memorie, celălalt din registru | Lucrarea 7, p.1 |
| Tabelul instrucțiunilor: coduri 0–28, cu 5 variante pentru 26 (AC) → 33 de operații distincte | Geier 1961, via Wikipedia RO |
| Coduri scrise în octal în listinguri (ex. CIT = 33₈, DS = 23₈) | Wikipedia RO (Farcaș & Mărușter), Facsimilele 4 și 5 |
| Deplasările au în câmpul de adresă 32 − n | Geier 1961 |
| Complement față de unu; doar adunarea cablată, restul microprogramat (schema Wilkes) | Wikipedia RO, Lucrarea 7 p.3 |
| Registre de microinstrucțiuni R1 și R2 cu câte 7 biți; impulsurile de ritm impar trec R1→R2 | Lucrarea 7, p.3 |
| La pupitru: „trece instrucția 2 în locul instrucției 1”, „RAI+1→RAI”, execuție cu frecvență redusă | Lucrarea 7, p.6 |
| Microprograme AC: 94 → 90 → 24 (cifre), 91 → 90 → 24 (litere); 42 = RA→R1; 38 = extrage după s0s1s2s3; 39 = după s0…s4 | Lucrarea 7, p.6 (notă de mână, Fig. 2) |
| Tambur 1024 adrese, 50 rot/s; ulterior adrese pare/impare pe jumătăți de tambur | Wikipedia RO, Baltac (Facsimil 8) |
| Bandă de telex cu 5 canale + ghidaj; perforație = „0”; citire mecanică cu gheare | Farcaș; Wikipedia RO |
| Mașină de scris electrică obișnuită cu electromagneți deasupra clapelor; hârtie A4/A3 | Farcaș |
| Preîncărcător INEX-1 (cuvintele 0000–0001, 0010–0015) și procedura „pornește de la 0010” | Facsimil 5 |
| Program de retipărire (1477–1545), 6.09.1962 | Facsimil 4 |
| Formatul tipăririi numerelor: „o,o17452406” | Facsimil 3 (tabel de sinus, feb. 1962) |
| Aspectul pupitrului restaurat | Foto Wikimedia 2011 (Turbojet, CC BY-SA 4.0) |
| **Toate inscripțiile panourilor** (registre M, RI, R I, RA, RAI cu ponderi; comenzile ANULEAZĂ RAI/M/S, INTRODUCE…, INSTRUCȚIA 1/2, MEMORIE TAMBUR/FERITE; MEMORIE scriere/citire; IMPULSURI; ÎN CAZ DE DEPĂȘIRE se oprește/nu se oprește; DEPĂȘIT CAPACITATEA REGISTRULUI; HÂRTIA AGĂȚATĂ; OPRIT; CALCULEAZĂ automat/instrucție unică; GENERATOR PRINCIPAL; R II; grila de microoperații) | texturile modelului 3D (CC BY 4.0) → `surse/3d/inscriptii-pupitru.md` |
| Panoul drept, citit pe o fotografie 4032×3024 (sursă wixstatic, licență necunoscută → doar referință): rândul **M** = 31 becuri roșii 0–30 cu comutator sub fiecare; zonele CODUL 2 / CODUL 1 / ADRESA 2 / ADRESA 1; **„REGISTRU INSTRUCȚ[IUNI]”**: 5 becuri cod (16 8 4 2 1, plus un bec verde) + 10 becuri adresă (512…1) → RI = 15 biți; **„R I”** = 7 becuri (64…1, plus 2 albe); **„REG. DE ADRESĂ INSTRUCȚ[IUNI]” RAI** = 10 becuri (512…1) cu comutatoare; **RA** = 10 becuri (512…1); selector cu comutatoare etichetate RAI · M · S · (RA în RI?) · M în I? · M în R? · 1 · 2; grupuri MEMORIE (buton roșu + albastru), IMPULSURI, BLOCAJ…, un grup cu becuri incluzând depășirea, OPRIT, CALCULEAZĂ (AUTOMAT · …) | foto utilizator, 2026 |
| Panoul stâng: grilă de becuri cu antetele **„Λ”** (3 rânduri × ~16) și **„V”** (3 × 4), fiecare cu o etichetă mică (ilizibilă); cutia GENERATOR PRINCIPAL; **„R II”** = 7 becuri (64…1) → panoul drept are R I, cel stâng R II = registrele de microinstrucțiuni R1/R2 (7 biți, Lucrarea 7) | foto utilizator, 2026 |

### 4.2 Ce lipsește (de căutat; până atunci „ghicit” și marcat)
- **Lucrările de laborator 1–6** și paginile lipsă din 7–8 (Baltac le-a publicat online; arhiva web a păstrat doar 5 pagini). Ar conține: semantica exactă a deplasărilor și a înmulțirii/împărțirii, codurile de caractere pentru bandă și mașina de scris, automatul ICR, temporizarea, etichetele butoanelor.
- **Ordinea de execuție a celor două instrucțiuni dintr-un cuvânt** — din Lucrarea 7 p.6 reiese că se execută întâi instrucțiunea 1, apoi 2, apoi RAI+1 (*dedus*).
- **Ce măsura fiecare voltmetru** și scalele lor.
- ~~Ce reprezintă becurile din panoul stâng~~ — **rezolvat**: grila „Λ/V” = microoperații cu nume; R II = registrul de microinstrucțiuni R2 (R I e pe panoul drept). Rămân nesigure câteva inscripții marcate `[?]` în transcriere.
- **Secvențele de microprogram** pentru fiecare instrucțiune (ce microoperații, în ce ordine) — doar fragmente (Lucrarea 7, p.6). Lucrarea 7 p.2–4 (lipsă) le descria probabil.
- **Codul programelor Vidraru și Romexpo** — negăsit online. Piste: arhiva UPT, prof. Vasile Baltac (a scris programul pentru cupolă), articolul Farcaș 1964 din *Buletinul IPT* (metoda arcelor încastrate).

### 4.3 Surse disponibile local (`/home/bu/mecipt/surse/`)
- `Baltac-MECIPT-Evocari-si-Documente.pdf` (34 p., 25 de facsimile) — și extrase `facsimile-baltac/`
- `Farcas-MECIPT-o-istorie-subiectiva.pdf` (2005)
- `Maruster-Povestea-unei-lucrari.pdf`
- `Baltac-Key-Aspects-History-Computing-Romania.pdf`
- `wikipedia-ro-MECIPT.wiki` (textul brut al articolului, cu tabelul instrucțiunilor)
- `lucrari-laborator/` — paginile recuperate din Lucrările 7 și 8
- `foto/MECIPT-1_Control_desk_2011_Turbojet_CC-BY-SA-4.0.jpg`
- Model 3D: https://sketchfab.com/3d-models/mecipt-1-62ddfc49f1c54967967d76abab5f3d2d (marius0198, 2020, CC BY 4.0, descărcabil cu cont Sketchfab). În textura panoului stâng: un rând de 7 becuri roșii marcat 64 32 16 8 4 2 1, sub cutia „GENERATOR PRINCIPAL” — concordă cu registrele de microinstrucțiuni R1/R2 de câte 7 biți (Lucrarea 7) → ipoteza „panoul stâng arată R1/R2” devine **Dedus**.

## 5. Decizii luate de utilizator
- Pagină web publică (link; acasă, telefon, muzeu), pentru vizitatori ai unui muzeu.
- Vederi Pupitru și Atelier, comutabile liber (plus vederea Ambele).
- Pupitrul după fotografia pupitrului albastru restaurat.
- Programe autentice unde există; reconstrucții acceptate dacă sunt **marcate clar**.
- Ajutor: tur ghidat + explicații la click pe orice element.
- Română și engleză.
- Cititor de bandă și mașină de scris vizibile în funcțiune.
- Sunet, cu posibilitate de oprire.
- Să nu arate ca un joc; fidel; vizitatorul să înțeleagă cum se folosea.
- Ulterior: și interfețe desktop (widgets) și terminal (ncurses).
- **Vidraru și Romexpo: calcule ilustrative**, marcate clar ca atare (nu există cod, articol sau date reale la îndemână). Eticheta spune explicit: „calcul ilustrativ în spiritul celui efectuat în 1963 / pentru Vidraru; cifrele nu sunt cele reale”.
- **Fotografii mai bune ale pupitrului:** utilizatorul caută alte poze; până atunci etichetele care nu se citesc rămân „ghicit”.
- **Licențe:** conținutul (grafică, texte, sunete proprii) **CC BY-SA 4.0**; codul **AGPL** (versiunea 3 sau ulterioară).
- **Fără termen fix.**

## 6. Decizii luate de mine (pot fi schimbate)
- **Facsimilele lui Baltac** (imaginile programelor din 1962) nu se reproduc pe site până nu există permisiunea autorului/UPT; până atunci se citează cu trimitere la PDF-ul publicat. Codul transcris din ele (octal) se folosește, cu atribuire.
- **Modelul 3D** (Sketchfab „MECIPT-1”, marius0198, 2020, CC BY 4.0; descărcat în `surse/3d/`) e **sursa principală pentru pupitru**: texturile lui sunt fotografii frontale ale panourilor, din care se citesc aproape toate inscripțiile (transcriere în `surse/3d/inscriptii-pupitru.md`). Panourile din pagină se desenează vectorial după aceste texturi; licența CC BY e compatibilă cu CC BY-SA, cu atribuire. O vedere 3D de introducere (cu modelul însuși) e posibilă ulterior, nu în prima versiune. Există și sursa originală Blender/Collada (`surse/3d/original-dae/`, MECIPT-1_V4.dae, Blender 2.90, oct. 2020): modelul e **articulat** — 161 de becuri (LED), 67 de comutatoare, 164 de socluri de butoane, 11 cadrane, 4 ace indicatoare, 10 afișaje, ca obiecte separate. Pozițiile lor se pot extrage ca să așezăm exact elementele în desenul 2D, iar o eventuală vedere 3D le poate aprinde/mișca individual. Texturile din .dae sunt identice cu cele de pe Sketchfab (doar neîntoarse).
- **Grila de microoperații din panoul stâng** (grilă ⎍ de 16 × 3 cu 35 de celule inscripționate + grilă ⊔ de 3 × 3 cu 4; nume ca „S trece în I”, „Zero trece în S”, „Dacă S₀ = 1 schimbă S în S̄”, „Mută RAI”, „2(ra) trece în RAI”, „Instrucția 2 trece în locul 1”) devine baza modelului microprogramat: fiecare microinstrucțiune executată aprinde becul cu numele ei. Unde secvența exactă a microprogramului unei instrucțiuni nu e documentată, ea se compune din aceste microoperații și se marchează „dedus”.
- **Nucleul în C**, compilat în **WebAssembly** pentru pagină și nativ pentru wx/ncurses — un singur cod, comportament identic peste tot. (Alternativa: JavaScript pentru web, cu riscul ca interfețele locale să difere.)
- **Site static**, fără server; rulează integral în browser, funcționează și offline după prima încărcare; găzduire oriunde (site UPT, GitHub Pages).
- Pupitrul **redesenat vectorial** după fotografie (nu fotografia însăși), ca becurile și comutatoarele să fie vii și clare la orice mărime; fotografia apare în ajutor, cu atribuire.
- Implicit viteza de epocă; sunet pornit implicit.
- Inscripțiile pupitrului rămân în română și în varianta engleză.
- Ordinea priorităților de construcție: nucleu + Pupitru + INEX-1/retipărire → Atelier → ajutor/tur → reconstrucții (sinus, apoi Vidraru/Romexpo) → telefon → wx/ncurses.
- **Proveniența se ține pe rutină / pe bloc de cuvinte, nu pe program întreg.** Motiv: din INEX-1 avem doar preîncărcătorul (8 cuvinte, Facsimil 5) și tabelul punctelor de intrare (0025, 0040, 0133–0136, 0246); conținutul benzii INEX-1 nu s-a găsit. Deci: preîncărcătorul = **Original**; banda INEX-1 = **Reconstrucție** care respectă punctele de intrare documentate; programul de retipărire = **Original** pentru 1477–1545, iar constantele pe care le citește din afara listingului (1551, 1556, 1557, 1600, 1625, 1626, 1675) = **Reconstrucție**. Interfața arată eticheta fiecărei porțiuni (ex. culoare/marcaj în vederea tamburului și în editor).
- **Fără mod de chioșc în prima versiune** (utilizatorul a descris accesul ca link de pe dispozitivul propriu). Se poate adăuga ulterior (demo automat, resetare după inactivitate).

## 7. Lăsat constructorului
- Structura internă a codului, testele, uneltele de build.
- Grafica exactă (dimensiuni, umbre), cu condiția fidelității față de fotografie.
- Sunetele (înregistrări libere de drepturi sau sinteză), cu condiția să sune mecanic/realist.
- Formatul fișierelor de bandă și de program.
- Detaliile tururilor ghidate și textele explicațiilor (validate apoi de utilizator pentru acuratețe istorică).

## 8. Anexă: schițe
Schițele discutate (taburi Pupitru / Atelier / Ambele, pupitrul albastru) se copiază în `docs/schite/`.
