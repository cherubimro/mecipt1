# MECIPT-1 — Atelierul (Planul 3): document de proiect

Data: 2026-11-03 · Stare: pentru aprobare · Pornește de la `docs/2026-11-02-emulator-mecipt1-design.md` (§3.2 „Atelier”, §3.4, §4) și de la propunerea acceptată de utilizator în conversația din 2026-11-03 („e ok”).

## 1. Intenția
Pupitrul (Planul 2) și ajutorul (Planul 4) îi arată vizitatorului mașina lucrând. **Atelierul** îl lasă să facă ce făceau programatorii din 1962: să citească un program în notația vremii, să-l schimbe, să-l pună pe tambur sau pe bandă perforată și să-l ruleze, văzând pe pupitru și pe coală ce s-a schimbat.

**Pentru cine:** vizitatorul curios sau pasionatul care a trecut prin tur și vrea să încerce singur; profesorul care arată la o oră cum arăta programarea în cod mașină.

**Reușita:** vizitatorul deschide retipărirea, schimbă o instrucțiune sau o constantă, o rulează și vede listingul tipărit altfel. Sau perforează câteva cuvinte pe bandă și le încarcă cu preîncărcătorul original INEX-1, ca în 1962. În tot acest timp știe ce e original și ce a schimbat el.

## 2. Ținte, non-ținte, anti-ținte
**Ținte**
- O a doua vedere a aceleiași pagini, **Atelier**, comutabilă oricând cu **Pupitru** și **Ambele** (spec §3.2). E aceeași mașină: rularea continuă când se schimbă vederea.
- **Editorul de program**: cuvintele de pe tambur în notația listingurilor de epocă, cu mnemonicele Geier și octalul alături; editare cuvânt cu cuvânt.
- **Tamburul**: cele 1024 de cuvinte într-o grilă de 32 × 32, colorate după proveniență, cu adresa curentă (RAI) evidențiată în timpul rulării.
- **Perforatorul**: cuvinte sau rânduri scrise de vizitator → bandă perforată desenată → pusă în cititor.
- **Coala mașinii de scris** și **comenzile** Reset, Pas, Rulează, Oprește și viteza.
- **Eticheta MODIFICAT** pe orice cuvânt schimbat de vizitator, vizibilă peste tot unde apare proveniența.
- Programul schimbat se păstrează în browserul vizitatorului; se poate **descărca** și **deschide** ca fișier `.mec`.
- Totul în **română și engleză**, cu explicații „Explică” pentru elementele noi și un capitol nou în documentație.

**Non-ținte**
- Asamblor cu etichete simbolice, macro-uri sau adrese relative. Programatorii MECIPT-1 scriau adrese absolute în octal; Atelierul face la fel.
- Depanare modernă: puncte de oprire, pas înapoi, istoric. (Pasul înainte cu INSTRUCȚIE UNICĂ există deja.)
- Mai multe programe deschise deodată; salvare pe server; conturi.
- Aranjarea pe telefon (Planul 7) și sunetul (Planul 5).
- Programele reconstruite noi (Planul 6). Atelierul le va primi automat, fiindcă vin din catalog.

**Anti-ținte (eșec chiar dacă merge)**
- Să arate ca un mediu de programare modern sau ca un joc: fără colorare-curcubeu a sintaxei, fără completare automată, fără animații decorative. Sobru, ca bara și panoul de explicații din Planurile 2 și 4.
- Să se piardă proveniența: un cuvânt schimbat nu are voie să rămână etichetat ORIGINAL nicăieri (editor, tambur, eticheta programului, fișierul descărcat).
- Să inventeze notație: scrierea rămâne cea din listingurile de epocă (`AAAA  c1 aaaa  c2 aaaa`) și din fișierele `.mec` ale proiectului.

## 3. Constrângeri
- Aceleași ca în Planurile 2 și 4:
  - site static, fără nimic de pe internet la rulare;
  - fără npm, bundler sau CDN;
  - același nucleu C compilat în WebAssembly, fără logică de mașină în JavaScript;
  - texte în `strings.js` și în fișierele de ajutor, RO/EN;
  - SPDX și licențele (cod AGPL, conținut CC BY-SA);
  - `make check` și `make web-check` verzi.
- Parsarea și formatarea cuvintelor trec prin nucleu (`mec_program_parse`, `mec_listing`, tabelul de instrucțiuni), ca editorul, unealta `mecasm` și fișierele `.mec` să fie identice.
- Ce face mașina când un cuvânt e schimbat în timpul rulării: modificarea se aplică **între instrucțiuni**, ca orice acțiune de la pupitru (coada runner-ului din Planul 2). Codul care se modifică singur (INEX-1) continuă să funcționeze.
- Pe ecranele de calculator de la 1280 px în sus, cele patru unelte încap fără derulare orizontală.

## 4. Ce s-a hotărât
### 4.1 Vederile
- În bară apare un comutator **Pupitru | Atelier | Ambele**. *Pupitru* e pagina de acum. *Atelier* arată sus o **fâșie compactă a pupitrului** (panoul drept, micșorat, viu și acționabil), iar dedesubt uneltele. *Ambele* pune pupitrul întreg deasupra uneltelor.
- Vederea aleasă se ține minte, ca limba.

### 4.2 Editorul
- Un rând pentru fiecare adresă care are ceva pe tambur, în ordinea adreselor:
  ```
  1477  UI 0000  CU 0000      27 0000  30 0000      ORIGINAL — Facsimil 4
  ```
  adică adresa, cele două instrucțiuni cu mnemonice, aceleași în octal și proveniența.
- Nucleul nu știe dacă un cuvânt e instrucțiune sau număr: e doar 31 de biți, ca în memoria reală. De aceea **fiecare rând arată ambele citiri**:
  - forma de instrucțiuni (mnemonice și octal), ca mai sus;
  - valoarea ca fracție, mai mică, alături: `1551  00 0000  00 0000 …   = 0,500000`.
  Vizitatorul poate edita în oricare formă. Forma în care a scris el se păstrează doar în modificările lui, ca fișierul descărcat să-i redea scrierea.
- Editarea: un click pe rând deschide câmpul. Vizitatorul scrie în aceeași sintaxă ca fișierele `.mec`: `UI 0000 CU 0000`, `27 0000 30 0000`, `= 0,5` sau `= o04000000000`. Celelalte forme se completează singure. O greșeală se arată sub rând, cu mesajul nucleului; cuvântul de pe tambur rămâne neschimbat până la o formă validă.
- Se pot adăuga cuvinte la adrese goale (un câmp „adresă nouă”) și se pot șterge cuvinte (adresa devine goală).
- **Modelul datelor: originalul plus modificările vizitatorului**, nu o fotografie a tamburului viu. Modificările se țin ca listă „adresă → cuvânt, în forma scrisă”, peste programul din catalog. Tamburul viu se schimbă și în timpul rulării, iar acele schimbări nu se salvează.
- Comenzile **Revino la original** (programul din catalog, fără modificări), **Descarcă .mec** și **Deschide .mec**.

### 4.3 Proveniența MODIFICAT
- Nucleul primește a cincea proveniență, **MODIFICAT** (`@prov MODIFICAT …` în `.mec`). O primește orice cuvânt pus pe tambur de vizitator, pe orice cale:
  - din editor;
  - de la pupitru, cu MEMORIE SCRIERE;
  - prin INEX-1, de pe o bandă perforată de el.
  Proveniența se ține pe adresă, în nucleu, și se actualizează la fiecare scriere pe tambur.
- Eticheta de proveniență din bară, rândurile editorului, culorile tamburului și fișierul descărcat o arată. Eticheta programului spune, de exemplu, „ORIGINAL — Facsimil 4: 38 de cuvinte · MODIFICAT de vizitator: 1”.
- **Cuvintele scrise de programul însuși** în timpul rulării (de exemplu cu ME, sau retipărirea care își rescrie instrucțiunea de la 1512):
  - păstrează proveniența de dinainte în fișier;
  - pe tambur și în editor sunt marcate **„scris de program”**, nu ORIGINAL, pentru că nu mai sunt cuvântul din document;
  - marcajul dispare la „Revino la original”.
  Nucleul ține pentru fiecare adresă un semn „scris în timpul rulării”.
- **Ce rânduri arată editorul:** fiecare adresă cu o proveniență, plus orice adresă scrisă în timpul rulării.

### 4.4 Tamburul
- Grilă de 32 × 32 celule; celula k = adresa k (octal 0000–1777), cu rândurile etichetate în octal.
- Culori după proveniență: ORIGINAL, DEDUS, RECONSTRUCȚIE, GHICIT, MODIFICAT, gol. Culorile sunt sobre și au legendă; statutul nu se transmite doar prin culoare, ci și printr-un model sau o literă pentru cine nu deosebește culorile.
- Cât rulează, celula de la adresa RAI se aprinde, ca becurile pupitrului, cu inerție.
- Un click pe celulă duce la rândul ei din editor; „Explică” pe celulă dă adresa, conținutul și proveniența.

### 4.5 Perforatorul și încărcarea cu INEX-1
- Două moduri:
  - **cuvinte**: un câmp în care vizitatorul scrie cuvinte, în aceeași sintaxă ca editorul;
  - **rânduri**: valori de 5 biți, câte una pe rând, în octal 00–37, pentru date citite cu CIT.
- Butonul „Perforează” desenează banda rezultată, cu desenul cititorului din Planul 2 (canalele 1 · 2 · ghidaj · 3 · 4 · 5, perforația = 0). Butonul „Pune banda în cititor” o încarcă în mașină.
- O scurtătură „Perforează cuvintele AAAA–BBBB de pe tambur” pregătește o bandă din programul din editor.
- **Încărcarea cu INEX-1** se face pe tamburul curent, fără să-l golească: butonul „Pune preîncărcătorul INEX-1 pe tambur” scrie cele 8 cuvinte ale lui (0000–0001, 0010–0015) peste ce e acolo, cu proveniența lor (ORIGINAL / DEDUS), iar banda din cititor rămâne.
- **Unde ajung cuvintele:** preîncărcătorul le memorează începând de la adresa scrisă în instrucțiunea lui de la 0014 (`ME 0002`, deci de la 0002) și mărește adresa după fiecare cuvânt. Ca să încarce un program la alt loc, de exemplu retipărirea la 1477, vizitatorul schimbă adresa din 0014 în editor. Atelierul explică asta lângă perforator și avertizează dacă banda ar suprascrie chiar preîncărcătorul (0010–0015).
  - Facsimilul nu spune cum se alegea adresa de încărcare; că operatorul schimba cuvântul 0014 e GHICIT și se marchează așa.
- Atelierul arată procedura din 1962 (Facsimil 5): „puneți banda în cititor, porniți de la 0010”.
- **Modul „rânduri”:** vizitatorul scrie **valoarea pe care o citește CIT** (bitul 1 = fără gaură). Desenul benzii arată găurile corespunzătoare, adică perforația = 0. Lângă câmp, o notă explică inversarea.
- Bitul de semn m0 nu încape pe bandă (6 × 5 = 30 de biți). Un cuvânt cu m0 = 1 primește un avertisment la perforare.

### 4.6 Comenzile
- **Reset** golește registrele și oprește mașina; tamburul rămâne.
- **Pas** = INSTRUCȚIE UNICĂ. **Rulează** = CALCULEAZA AUTOMAT. **Oprește** = IMPULSURI — INTRERUPE.
- **Viteza**: ca în 1962 sau rapid, comună cu pupitrul.
- **Adresa de pornire**: un câmp octal legat de comutatoarele RAI.
- Comenzile trimit aceleași acțiuni ca butoanele pupitrului; becurile din fâșia de sus se mișcă la fel.

### 4.7 Păstrarea, fișierele și ce se încarcă implicit
- Modificările (§4.2) se țin în `localStorage`, pe program din catalog, cu `try/catch`. În fereastră privată merge tot, dar nu se ține minte.
- **Fișierul descărcat** e `.mec` valid, citibil de `mecasm` și de pagină:
  - programul din catalog, cu cuvintele lui originale și `@prov`-urile lor;
  - modificările vizitatorului, sub `@prov MODIFICAT …`;
  - un antet citibil de pagină: `; mecipt-origin: <id din catalog>` și data.
- **Fișierul deschis:** dacă antetul numește un program din catalog, pagina compară fiecare cuvânt cu catalogul. Orice cuvânt diferit devine MODIFICAT, indiferent ce scrie în fișier. Altfel, programul e tratat ca „program al vizitatorului”: toate cuvintele lui sunt MODIFICAT, iar eticheta spune „fișier deschis de vizitator”. Pagina nu crede pe cuvânt eticheta ORIGINAL dintr-un fișier.
- **Ce se încarcă implicit:**
  - pupitrul, bara de programe și turul ghidat încarcă întotdeauna **originalul**;
  - Atelierul oferă versiunea modificată a vizitatorului, dacă există, cu un rând „Versiunea ta modificată — Revino la original”.
  Fiind aceeași mașină, un program modificat pornit din Atelier se vede și pe pupitru, iar eticheta de proveniență din bară arată MODIFICAT.

### 4.8 Ajutorul și documentația
- Intrări „Explică” noi, RO/EN, pentru: editor, rândul de editor, celula de tambur, perforator, comenzile Atelierului, eticheta MODIFICAT.
- Un capitol nou, „Atelierul”: cum se scria un program în 1962, notația, procedura cu banda și INEX-1, ce înseamnă MODIFICAT.
- Turul ghidat nu se schimbă; Atelierul nu are tur propriu în această versiune (§6).

## 5. Lăsat constructorului
- Structura codului (module noi pentru editor, tambur, perforator, vederi), formatul exact al cheilor din `localStorage`, numele funcțiilor noi din API.
- Dimensiunile, fonturile și culorile exacte, în spiritul paginii existente.
- Cum se desenează „scris de program” pe tambur și cum arată modelul pentru daltoniști.
- Ordinea pașilor de implementare și împărțirea pe task-uri.

## 6. Hotărâri luate de mine (pot fi schimbate)
- Atelierul e o vedere în aceeași pagină, nu o pagină separată, ca mașina să continue să ruleze la schimbarea vederii (spec §3.2).
- Editarea se face direct pe tamburul mașinii, nu pe un text separat. Ce vezi în editor e ce e în memorie, ca la pupitrul real.
- MODIFICAT devine a cincea proveniență în nucleu, nu doar o etichetă în pagină, ca fișierele `.mec` descărcate s-o păstreze.
- Cuvintele scrise de program în timpul rulării nu schimbă proveniența.
- Fâșia compactă din Atelier e chiar panoul drept, micșorat, nu un desen nou.
- Fără tur separat pentru Atelier în această versiune; explicațiile „Explică” și capitolul din documentație ajung.
- După verificarea recenzentului:
  - proveniența se ține pe adresă și se actualizează la orice scriere a vizitatorului (editor, MEMORIE SCRIERE, bandă proprie prin INEX-1);
  - scrierile programului se marchează separat, „scris de program”, fără să se salveze;
  - modelul datelor e „original + modificări”;
  - fiecare rând arată și instrucțiunile, și fracția;
  - un fișier deschis e comparat cu catalogul și nu e crezut pe cuvânt;
  - pupitrul și turul încarcă mereu originalul;
  - INEX-1 se pune peste tamburul curent, iar adresa de încărcare se schimbă din cuvântul 0014 (GHICIT, marcat);
  - în modul „rânduri” se scrie valoarea citită de CIT.
