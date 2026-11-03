# MECIPT-1 — Programele reconstruite (Planul 6): document de proiect

Data: 2026-11-03 · Stare: pentru aprobare · Pornește de la `docs/2026-11-02-emulator-mecipt1-design.md` (§2 „Onestitate istorică”, §3.3 programele, §4 tabelul surselor, §6 „Proveniența pe rutină”) și de la răspunsurile utilizatorului din conversația din 2026-11-03.

## 1. Intenția
Până acum vizitatorul are două programe: retipărirea din 1962 (original) și preîncărcătorul INEX-1 cu o bandă de test de 3 cuvinte. Planul 6 aduce programele care fac din MECIPT-1 un calculator care **calculează**:
- **banda INEX-1**, sistemul de rutine pe care îl încărca preîncărcătorul;
- **tabelul de sinus** din februarie 1962;
- calculele **ilustrative** pentru **barajul Vidraru** și pentru **cupola Romexpo**.

Toate sunt cod scris acum, deci **RECONSTRUCȚIE** sau **GHICIT**, marcate clar.

**Reușita:**
- Tabelul de sinus tipărit de emulator e **identic, cifră cu cifră, cu Facsimilul 3**, inclusiv greșelile de rotunjire ale mașinii (sin 30° = 0,499999995; sin 45° = 0,707106779).
- Vidraru și Romexpo tipăresc pe coală tabele de numere plauzibile, „ca în listingurile de epocă”, iar vizitatorul știe tot timpul că cifrele nu sunt cele reale.

## 2. Ținte, non-ținte, anti-ținte
**Ținte**
- **Banda INEX-1 reconstruită.**
  - Rutinele stau la punctele de intrare documentate în Facsimilul 5, „Instrucțiuni la programul INEX-1”:
    - citirea benzilor de la pupitru, 0040 (sau 0026), și „ca program”, 0025 (revine la V);
    - formatul de tipărire, 0133;
    - numere întregi din S, 0134;
    - numere subunitare din S, 0135 (146 VF);
    - trecerea peste n rânduri, 0132, și peste n spații, 0136 (−n·2⁻⁵ în S);
    - tipărirea de la A la B, 0246 (în S cu 00-A 00-B).
  - Banda se încarcă cu preîncărcătorul **original** (Facsimil 5), de pe banda perforată, în cititor.
- **Tabelul de sinus 1°–45°:**
  - folosește rutinele INEX-1;
  - tipărește în formatul Facsimilului 3: „o” în loc de cifra zero, virgula zecimală, 9 zecimale, semnul de după fiecare număr și 5 numere pe rând, pe 9 rânduri;
  - **reproduce cifră cu cifră** cele 45 de valori din facsimil (cerința utilizatorului).
- **Vidraru (ilustrativ):**
  - pornește de la dimensiunile publice ale barajului (înălțimea de 166 m, grosimile de ~6 m la coronament și ~25 m la bază);
  - urmează metoda arcelor încastrate, simplificată;
  - pentru fiecare arc orizontal, de la coronament la fundație, tipărește un rând: cota, presiunea apei, forța din arc și efortul din beton.
- **Romexpo (ilustrativ):**
  - pornește de la dimensiunile publice ale cupolei (diametrul de ~93,5 m), ca cupolă cu inele și meridiane;
  - inel cu inel, tipărește unghiul, raza inelului și lungimea elementelor.
- Fiecare program apare în catalog (bara de sus), cu titlul în română și engleză și cu eticheta de proveniență.
  - Se poate rula la pupitru, citi și schimba în Atelier.
  - Are pagină de ajutor și secțiune în documentație.

**Non-ținte**
- Cifrele reale ale calculelor pentru Vidraru și Romexpo: nu avem nici codul, nici datele. Nu pretindem că le avem.
- Alte rutine INEX-1 decât cele din Facsimilul 5.
- Turul ghidat nu se schimbă. Eventual primește doar o mențiune a noilor programe în documentație.

**Anti-ținte**
- Un vizitator nu trebuie să creadă vreodată că Vidraru sau Romexpo sunt calculele originale. Eticheta spune explicit: **„calcul ilustrativ în spiritul celui efectuat în 1963 / pentru Vidraru; cifrele nu sunt cele reale”** (spec §4).
- Un sinus „corect”, care nu seamănă cu facsimilul, nu e o reușită. Tabelul din 1962 e oracolul.
- Nu se cosmetizează rezultatele: dacă o valoare nu se poate reproduce, diferența se arată, nu se ascunde.

## 3. Constrângeri
- Programele sunt fișiere `.mec`, în formatul existent (`@prov`, adrese octale, mnemonice), licențiate CC BY-SA 4.0, cu antet care explică ce e reconstruit și după ce sursă.
- Ele rulează pe nucleul existent, cu semantica deja stabilită în `docs/semantica.md`:
  - inversarea 14/15;
  - deplasarea cu n egal cu câmpul;
  - MS lasă rezultatul și în S;
  - AC 0136 tipărește cifra din s0…s3.
- Unde un program are nevoie de un comportament al mașinii încă neghicit, alegerea se trece în `docs/semantica.md` cu statutul ei.
- **Proveniența pe bloc de cuvinte** (spec §6):
  - preîncărcătorul rămâne ORIGINAL;
  - rutinele INEX-1, sinusul, Vidraru și Romexpo sunt RECONSTRUCȚIE;
  - constantele ghicite sunt GHICIT.
  Eticheta din bară și Atelierul le arată deja pe bloc.
- **Testele C** (`make check`) rulează fiecare program în nucleu și compară coala tipărită:
  - sinusul, cu transcrierea exactă a Facsimilului 3;
  - Vidraru și Romexpo, cu un rezultat de referință calculat independent, în Python sau în C cu aritmetica de 30 de biți a mașinii.
- Timpul de rulare la viteza „ca în 1962” trebuie să fie suportabil pentru un vizitator: de ordinul minutelor, nu al orelor. La viteza „rapid” trebuie să ia câteva secunde.

## 4. Ce s-a hotărât
### 4.1 Sinusul: reproducere cifră cu cifră
- Sursa de adevăr e Facsimilul 3, transcris într-un fișier de test (45 de valori, în ordinea și așezarea din facsimil).
- Constructorul caută metoda de calcul pe 30 de biți care dă exact aceste cifre. Candidații de epocă:
  - seria Taylor cu un număr fix de termeni;
  - recurența sin((n+1)x) = 2·cos x·sin nx − sin((n−1)x), cu erori care se adună (forma erorilor din facsimil o sugerează);
  - polinoame aproximante.
  Contează și conversia zecimală, prin înmulțiri repetate cu 10 și trunchiere.
- Căutarea se face întâi într-un model rapid al aritmeticii mașinii, în afara emulatorului. Metoda găsită se scrie apoi în cod mașină MECIPT-1 și se verifică în nucleu.
- **Dacă nu se găsește nicio metodă care să reproducă toate cele 45 de valori:**
  - se alege candidatul cu cele mai multe potriviri;
  - valorile care diferă se listează în documentație și în ajutor;
  - testul fixează exact lista de diferențe acceptate;
  - utilizatorul primește lista înainte de unire.
- Cum se ajunge la reproducere (metoda, termenii, conversia) e o RECONSTRUCȚIE. Faptul că cifrele se potrivesc cu facsimilul e o verificare SIGURĂ.

### 4.2 Banda INEX-1
- Rutinele ocupă zona joasă a tamburului, în jurul punctelor de intrare documentate. Convenția de chemare și de revenire („revine la V”) e GHICIT și se trece în semantica.
- **Banda** e codificată ca orice bandă din emulator. Preîncărcătorul original o citește în cititor, cuvânt cu cuvânt, cu țăcănitul de rigoare.
- **Catalogul:** intrarea „INEX-1” existentă trece de la banda de test de 3 cuvinte la banda reconstruită. Banda de test rămâne în teste.
- **Programele de calcul** (sinus, Vidraru, Romexpo) se încarcă direct pe tambur, cu rutinele INEX-1 deja puse, ca retipărirea. Vizitatorul apasă CALCULEAZA AUTOMAT și vede tipărirea fără să aștepte citirea benzii INEX-1.

### 4.3 Vidraru și Romexpo
- Datele de intrare sunt constante pe tambur, marcate GHICIT: dimensiunile publice și o metodă simplificată, ca numerele să fie plauzibile ca ordin de mărime.
- **Tipărirea:**
  - numai numere, în coloane, în formatul rutinelor INEX-1 (0134/0135);
  - fără titluri moderne și fără unități scrise (mașina de scris nu avea litere în acest mod);
  - ce înseamnă fiecare coloană se explică în ajutor și în documentație.
- Etichetele de proveniență și textul din ajutor poartă fraza „calcul ilustrativ… cifrele nu sunt cele reale”.

### 4.4 Ajutorul și documentația
- Capitolul „Programele” din documentație, RO și EN, primește câte o secțiune pentru fiecare program:
  - ce face programul;
  - ce e original și ce e reconstruit;
  - după ce sursă;
  - ce înseamnă coloanele tipărite;
  - la sinus, cum se compară cu Facsimilul 3 (și diferențele, dacă rămân).
- `docs/semantica{,.en}.md` primește alegerile noi, fiecare cu gradul ei.

## 5. Lăsat constructorului
- Algoritmii exacți pentru Vidraru și Romexpo, numărul de arce și de inele, numărul de zecimale tipărite.
- Așezarea rutinelor INEX-1 pe tambur între punctele de intrare și convenția de chemare.
- Unde stă fiecare program pe tambur.
- Unelte de lucru: modelul aritmeticii pentru căutarea metodei de sinus, generatorul rezultatelor de referință.
- Împărțirea pe task-uri.

## 6. Hotărâri luate de mine (pot fi schimbate)
- **Toate programele de calcul folosesc rutinele INEX-1 de tipărire.** Așa le-ar fi scris programatorii din 1962, iar rutinele capătă un rost vizibil.
- **Programele de calcul se încarcă direct pe tambur**, cu INEX-1 deja pus. Citirea benzii INEX-1 se vede separat, în intrarea „INEX-1” din catalog.
- **Pentru Vidraru și Romexpo pornim de la dimensiunile reale** (barajul de 166 m, cupola de ~93,5 m), cu metode simplificate. Utilizatorul a spus că așa e cinstit, cu condiția etichetei.
- **Semnul tipărit după fiecare număr** în facsimil e reprodus cu caracterul cel mai apropiat din setul mașinii de scris; alegerea se trece în semantica.
- După verificarea constructorului:
  - **Aritmetica ghicită a nucleului se poate corecta după Facsimilul 3:**
    - Facsimilul e și o dovadă despre felul în care mașina înmulțea, rotunjea și trunchia. Căutarea metodei de sinus poate deci varia și alegerile GHICIT ale nucleului (IN, INR, D, deplasările, conversia).
    - Nu poate atinge alegerile SIGUR sau DEDUS. Toate oracolele existente (retipărirea identică cu Facsimilul 4, preîncărcătorul INEX-1, testele nucleului) trebuie să treacă mai departe.
    - O alegere schimbată astfel urcă în `docs/semantica.md` la DEDUS (din Facsimilul 3), cu motivul scris.
  - **Transcrierea Facsimilului 3 se verifică înainte de căutare:**
    - Fiecare valoare transcrisă se compară cu sinusul adevărat. Orice valoare care diferă cu mai mult de 1·10⁻⁸ e aproape sigur o cifră citită greșit.
    - Cifrele îndoielnice (3/8, 5/6, 0/o, 1/7) se listează și se arată utilizatorului, cu decupajul din facsimil, ca să le confirme. Abia apoi transcrierea devine testul.
  - **Oprirea căutării:**
    - Căutarea are un timp limitat, de ordinul unei zile de lucru, în modelul rapid.
    - Dacă nu se ajunge la 45 din 45, ne oprim **înainte** de a scrie codul mașină. Utilizatorul primește cel mai bun candidat și lista diferențelor și hotărăște dacă mergem mai departe cu el.
    - Restul planului (INEX-1, Vidraru, Romexpo) nu așteaptă după sinus.
  - **Formatele rutinelor INEX-1** (argumente, revenire, numărul de zecimale) sunt GHICIT, inventate în spiritul Facsimilului 5 și trecute în semantica.
    - Rutina numerelor subunitare (0135) tipărește implicit 9 zecimale, ca în Facsimilul 3.
    - Nota „146 (VF)” se explică doar dacă reiese din lucru; altfel se trece ca necunoscută.
  - **Testul sinusului compară coala cu transcrierea.** Semnul de după număr se transcrie cu caracterul ales pentru el. „o” vine din tabelul de caractere existent al mașinii de scris, dacă cifra zero se tipărește acolo ca „o”; altfel alegerea se trece în semantica.
  - **Banda INEX-1 e o bandă perforată adevărată**, în formatul existent al emulatorului, încărcată de preîncărcătorul original de la adresa din 0014. Așezarea rutinelor nu trebuie să suprascrie preîncărcătorul (0000–0001, 0010–0015) cât acesta încă rulează.
  - **Rezultatele de referință pentru Vidraru și Romexpo** se pot calcula într-un model Python al aritmeticii mașinii.
