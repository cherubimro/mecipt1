# Semantica emulatorului — ce e sigur, dedus sau ghicit

Fiecare alegere fără sursă explicită e listată aici, cu motivul și, unde există, oracolul care o susține. În cod apare ca `// GHICIT:` sau `// DEDUS:`.

## Cuvântul și instrucțiunile
| Alegere | Statut | Justificare |
|---|---|---|
| m0 = semn, m30 = bitul cel mai puțin semnificativ | SIGUR | Lucrarea 7 p.1; panoul M numerotat 0–30 |
| Câmpuri: m1–m5 cod 2 · m6–m10 cod 1 · m11–m20 adresă 2 · m21–m30 adresă 1 | SIGUR | Lucrarea 7 p.1; etichetele panoului drept |
| Listingurile de epocă tipăresc întâi (cod 1, adresă 1) | DEDUS | Preîncărcătorul INEX-1: santinela −mem[1] = −1 funcționează doar dacă adresa tipărită prima este m21–m30 |
| Se execută întâi instrucțiunea 1, apoi 2, apoi RAI + 1 | DEDUS | Lucrarea 7 p.6: „trece instrucția 2 în locul instrucției 1”, „RAI+1→RAI”; logica INEX-1 |
| Cuvântul 0001 al INEX-1 = 00 0001 00 0000 | DEDUS | cifra corectată de mână; doar 0000 face ca MS 0014 să mărească corect adresa lui ME |

## Instrucțiuni
| Alegere | Statut | Justificare |
|---|---|---|
| `O y`: oprire, RAI ← y (repornirea continuă de la y) | SIGUR | tabelul Geier: „La repornire reluare de la y” |
| −0 contează drept zero la TPO, TN, TO | GHICIT | complementul față de unu are două zerouri; un vizitator care scade x − x trebuie să vadă „zero” |
| `MS y`: S ← s + y și y ← S | DEDUS — oracolul retipăririi | tabelul spune „Y ← s + y”; programul din 1962 testează S imediat după `MS 1625` |
| `UI y`: I ← biții m1–m30 ai lui y | GHICIT | I are 30 de biți |
| Codurile 29–31: oprire cu OPRIT | GHICIT | nu apar în tabel |
| Instrucțiunea se citește de pe tambur în momentul execuției (codul care se modifică singur funcționează) | DEDUS | INEX-1 folosește `MS 0014` pe propria instrucțiune |

## Timpul
| Alegere | Statut | Justificare |
|---|---|---|
| 1024 de timpi de cuvânt pe rotație, 50 rot/s | SIGUR | Wikipedia RO, Baltac |
| Fiecare acces așteaptă poziția cuvântului, apoi `exec_ticks` = 3 | GHICIT (valoarea 3) | — |
| Intercalare: adresele pare în sloturile 0–511, impare în 512–1023 | DEDUS | Baltac, Facsimil 8 („adresele pare pe jumătate de tambur și cele impare pe cealaltă”) |
| **Verificare:** un program tipic (însumarea unui tabel) rulează cu **50,6 instr/s** fără intercalare și **60,7** cu intercalare | — | sursele: 50, respectiv 70–80 (pentru programe așezate anume); modelul nu a fost reglat după aceste cifre |

## Deplasări, înmulțire, împărțire
| Alegere | Statut | Justificare |
|---|---|---|
| Deplasare logică: semnul participă, biții care ies se pierd, intră zerouri | GHICIT (tratamentul semnului) | tabelul: „deplasare logică” |
| DLS/DLD pe S & I ca un registru de 61 de biți (S sus, I jos) | DEDUS | tabelul: „S & I”; IN pune produsul dublu în S & I |
| Numărul de poziții = câmpul (nu 32 − câmpul) | DEDUS — oracol INEX-1 | vezi „Oracolul INEX-1” mai jos; nota „32-n” din Geier/Wikipedia rămâne neexplicată (poate notația în baza 32, poate doar DS/DD) |
| IN: semnul și partea de sus în S, partea de jos în I, ambele complementate pentru rezultat negativ | GHICIT | — |
| INR: rotunjire la jumătate în sus | GHICIT | — |
| D: I ← cât (30 de biți), S ← rest cu semnul lui s; \|s\| ≥ \|y\| → depășire (DCR) | GHICIT (forma restului) | tabelul: „I ← s : y, S ← rest” |

## Periferice
| Alegere | Statut | Justificare |
|---|---|---|
| CIT: un rând de bandă, inversat (perforație = 0), aliniat la dreapta, restul cuvântului 0 | SIGUR / DEDUS (restul 0) | Wikipedia RO (Baltac, L5); tabelul Geier |
| Sfârșitul benzii sau lipsa cititorului → HÂRTIA AGĂȚATĂ, oprire | DEDUS | becul „HÂRTIA AGĂȚATĂ” de pe pupitru |
| AC 0136 tipărește cifra din s0 s1 s2 s3; AC 0133 litera din s0 … s4 | SIGUR (biții) / GHICIT (glifele) | tabelul Geier |
| Seturile: cifre, spațiu, minus, punct, virgulă, întoarcerea carului (codul 14 nefolosit); spațiu + 26 de litere englezești + ă î ș ț (codul 31 nefolosit) | SIGUR | Baltac, lucrarea de laborator L6, prin Wikipedia RO |
| Codul 0 se tipărește „o” | DEDUS | Facsimilele 3 și 4: mașina de scris bate „o” pentru zero (o,o17452406; 15o1) |
| Glifele codurilor 10–15 (zecimal): spațiu , - rând-nou (nefolosit) . | GHICIT (așezarea) | retipărirea folosește două coduri din 10–15 (spațiu și rând nou); care cod e care nu se poate deduce; 14 rămâne nefolosit după L6 |
| Literele: A Ă B C D E F G H I Î J K L M N O P Q R S Ș T Ț U V W X Y Z, apoi spațiu; 31 nefolosit | GHICIT (ordinea) | setul e cel din L6; ordinea codurilor nu s-a păstrat |
| AC 0151: S ← I (pozitiv) | GHICIT (semnul) | tabelul: „S ← i” |
| Un caracter la cititor/mașina de scris ≈ 0,1 s | GHICIT | ordinul de mărime al unui teleimprimator |
| Banda pentru programe: un cuvânt = 6 caractere de 5 biți (m1–m30) | DEDUS | Geier: „două instrucțiuni de 15 biți … prin doar șase caractere” |

## Pupitrul
| Alegere | Statut | Justificare |
|---|---|---|
| Comutatoarele de sub M încarcă direct registrul M | DEDUS | becurile M sunt dublate de comutatoare (Farcaș; Wikipedia RO) |
| MEMORIE SCRIERE: tambur[RAI] ← M; CITIRE: M ← tambur[RAI]; imediat | DEDUS | inscripțiile grupului MEMORIE; RAI are comutatoare |
| „INTRODUCE 7 CATEG. DIN RA ÎN R I”: R I ← 7 biți din RA | DEDUS | „7 categorii” = 7 biți = lățimea lui R I |
| „INTRODUCE M ÎN RI”: RI ← instrucțiunea curentă din M | DEDUS | inscripție |
| CALCULEAZĂ AUTOMAT / INSTRUCȚIE UNICĂ | SIGUR (existența) / DEDUS (efectul) | inscripție; Lucrarea 7 p.6 |

## Microoperații (becurile panoului stâng)
| Alegere | Statut | Justificare |
|---|---|---|
| Cele 39 de microoperații și textele lor | SIGUR (unde nu e `[?]`) | inscripțiile panoului (texturile modelului 3D) |
| La fiecare microoperație: R I → R II, noua adresă în R I | DEDUS | Lucrarea 7 p.3: „impulsurile de ritm impar produc trecerea conținutului registrului R1 în R2” |
| Numărul afișat în R I / R II = numărul celulei din grila panoului stâng | GHICIT | adresele reale de microprogram (94 → 90 → 24, Lucrarea 7 p.6) nu se potrivesc cu grila; tabelul lor s-a pierdut |
| Secvențele de microoperații pe instrucțiune (`MEC_UOP_SEQ`) | DEDUS | compuse din microoperațiile panoului; ordinea reală nu s-a păstrat (Lucrarea 7 p.2–4 lipsă). Adunarea era cablată și nu are bec propriu |
| Microprogramele AC (94 → 90 → 24, 91 → 90 → 24) | SIGUR (Lucrarea 7 p.6) | sunt adrese de microprogram, nu celule ale grilei; nu sunt încă emise ca urmă |

## Oracolul INEX-1 (preîncărcătorul original, Facsimil 5)
`build/mecvariants inex` rulează preîncărcătorul original pe o bandă cu 3 cuvinte cunoscute, sub toate cele 8 combinații:

| deplasare | ordinea perechii | codul 14 | rezultat |
|---|---|---|---|
| **n = câmpul** | **1 întâi** | **sare pe s < 0** | **REUȘEȘTE** |
| celelalte 7 combinații | | | eșuează |

Concluzii (DEDUS, confirmate de codul original):
- numărul de poziții al deplasării este chiar câmpul de adresă;
- se execută întâi instrucțiunea 1 (cod 1 = m6–m10, adresă 1 = m21–m30, tipărită prima în listing);
- **codul 14 (octal 16) sare când S e negativ**, iar codul 15 (octal 17) când S ≥ 0 — invers față de tabelul Geier așa cum apare pe Wikipedia (14 = TPO „s ≥ 0”, 15 = TN „s < 0”). Fie rândurile tabelului sunt inversate în transcriere, fie convenția de semn diferă. **Problemă deschisă de verificat în Geier 1961 / lucrările de laborator.** Mnemonicele rămân cele din tabel; varianta `branch14_on_negative` controlează sensul.
- Mecanismul preîncărcătorului: S pornește cu −1 (santinelă), primește câte 5 biți pe caracter și se deplasează cu 5; după 6 caractere santinela (bitul 0) ajunge în poziția de semn și S devine pozitiv → bucla se oprește, cuvântul (m0 = 0, m1–m30 = cele 6 caractere) se memorează, iar `MS 0014` mărește adresa de memorare.

## Oracolul retipăririi (programul din 6.09.1962, Facsimil 4)
Programul original, cu 7 constante reconstruite (1551, 1556, 1557, 1600, 1625, 1626, 1675), pornit de la 1477, **își tipărește propriul listing (1477–1545, 39 de linii) caracter cu caracter identic cu facsimilul**, în ≈ 114 s de timp simulat (`tests/test_retiparire.c`).

Confirmă independent:
- deplasarea cu n = câmpul: fiecare cifră octală se scoate cu `DLD 1` / tipărește s0…s3 / `DLS 4`;
- **codul 15 (octal 17) sare pe s ≥ 0**: bucla `MS 1625` / `17 1477` continuă cât timp contorul e ≥ 0 — aceeași inversare 14/15 ca la INEX-1;
- AC 0136 tipărește cifra din s0…s3 (cu s0 = 0 pentru cifrele octale);
- formatul listingurilor de epocă `AAAA  c1 aaaa  c2 aaaa` era chiar ieșirea acestui program.

Aduce în plus:
- **MS lasă rezultatul și în S** (altfel bucla se oprește după primul rând).

Rămân ghicite: codurile exacte ale spațiului și rândului nou (10 și 13 aici) și masca 1600 (aleasă să golească adresa 1).

## După verificarea finală
- `mec_op_effect(cod, variante)` dă efectul **real** al codurilor 14/15 sub varianta activă; interfețele trebuie să-l folosească în locul textului din tabel.
- −0 se afișează „0” (`mec_to_double`).
- Becul „2(ra) trece în RAI” se aprinde doar când saltul chiar se face.
- Fracțiile din fișierele `.mec` se citesc cu un parser propriu (`0,5` sau `0.5`), independent de localizare; `nan`, `inf`, `0x…`, `1e…` sunt respinse.
- Cuvântul 0001 al INEX-1 are proveniența DEDUS (cifra corectată de mână).

## Pupitrul web
Alegerile făcute pentru pagina pupitrului (`web/js/bindings.js`, `web/js/glow.js`, `web/data/`), fiecare cu statutul ei.

| Alegere | Statut | Motiv / sursă |
|---|---|---|
| Pârghia sus = 1, jos = 0 (comutatoarele M și RAI) | GHICIT | Nicio sursă nu spune sensul; e convenția obișnuită. |
| Momentane (revin după 150 ms): ANULEAZA, INTRODUCE, INSTRUCTIA 1/2, MEMORIE SCRIERE/CITIRE, SE OPRESTE / NU SE OPRESTE, CALCULEAZA AUTOMAT / INSTRUCTIE UNICA. Cu reținere: comutatoarele M, RAI și IMPULSURI | GHICIT | Comenzile sunt acțiuni de un moment; M și RAI țin un cuvânt / o adresă. |
| ADUNARE 1, M+S 2, MEMORIE TAMBUR, MEMORIE FERITE, comutatoarele și butonul generatorului nu fac nimic | GHICIT | Funcția lor nu e documentată (FERITE: memoria cu ferite, neterminată în 1962–1963). |
| IMPULSURI — INTRERUPE oprește mașina și aprinde OPRIT; încă o apăsare (RESTABILESTE) o lasă să pornească din nou | GHICIT | Din inscripție. |
| Becurile MEMORIE (SCRIERE pătrat roșu, CITIRE pătrat albastru) clipesc la scrierea/citirea de la pupitru | GHICIT | Pe panou sunt lângă butoanele respective. |
| Becurile INSTRUCTIA 1/2 arată faza (prima / a doua instrucțiune din cuvânt); MEMORIE TAMBUR aprins, FERITE stins | DEDUS | Inscripțiile; mașina lucra doar cu tamburul. |
| Becurile generatorului: aprinse 1, 3, 5 (fix); cele trei becuri-martor din mijlocul panoului stâng: stinse | GHICIT | Nu se știe ce arătau. |
| SE OPRESTE / NU SE OPRESTE aprinde becul variantei alese pentru depășire | DEDUS | Inscripția „IN CAZ DE DEPASIREA CAPACITATII REGISTRULUI”. |
| Culorile becurilor (M verde; RI verde, verde, chihlimbar, roșu, roșu, apoi verde; R I alb, alb, apoi roșu; RA, RAI, R II roșu; microoperațiile albe; MEMORIE roșu/albastru pătrate; IMPULSURI și depășirea roșu/verde; CALCULEAZA verde) | SIGUR | Fotografia din 2011 (Turbojet, Wikimedia, CC BY-SA 4.0). |
| Culoarea feței: panourile laterale crem (#e2dcc2), cel din mijloc albastru (#4a7cad) | SIGUR (aproximat) | Fotografia din 2011; texturile modelului 3D sunt verzui din cauza luminii. |
| Inerția becurilor: aprindere τ = 25 ms, stingere τ = 70 ms | GHICIT | Un bec mic cu filament. |
| Aparatul de măsură al doilea din rândul 2 (lipsă azi) e desenat | DEDUS | Rama goală din 2011; fotografia din 1961 îl arată. Scalele și acele sunt GHICITE. |
| Voltmetrele din rândul de sus au scala 0–250 V | GHICIT | Pe fotografia din 2011 se văd 5–6 cifre, ultima de trei cifre, dar nu se pot citi; 250 V e amintirea utilizatorului și se potrivește cu tensiunile anodice ale tuburilor. Celelalte cadrane: doar gradații. |
| Un bec de microoperație se aprinde dacă microoperația a rulat cel puțin o dată de la cadrul precedent | GHICIT | Ochiul vede, la 50 instr/s, becurile pulsând; vezi și inerția. |
| Încărcarea unui program (și Reîncarcă) readuce impulsurile (IMPULSURI pe RESTABILESTE) | GHICIT | O pornire curată; altfel vizitatorul rămâne cu mașina oprită fără să știe de ce. |
| Comutatoarele M și RAI țin poziția și pun tot cuvântul în registru la fiecare mutare | GHICIT, în tensiune cu sursele | Existența butoanelor ANULEAZA M / RAI și introducerea „cu trei degete” sugerează că, poate, comutatoarele adăugau biți într-un registru golit înainte. De hotărât înainte ca turul ghidat (Planul 4) să predea procedura de lucru. |

## Atelierul
Alegerile Atelierului (`web/js/atelier/`, nucleul: `PROV_MODIFICAT`, `written`, `visitor_tape`).

| Alegere | Statut | Motiv / sursă |
|---|---|---|
| Orice cuvânt pus pe tambur de vizitator (editor, MEMORIE SCRIERE, banda lui prin INEX-1) are proveniența MODIFICAT | — (regula emulatorului) | Vizitatorul nu trebuie să creadă niciodată că rulează cod original când nu e așa (spec §2). |
| După ce o bandă perforată de vizitator e pusă în cititor, orice cuvânt scris de program pe tambur devine MODIFICAT, până la următoarea încărcare de program | GHICIT | Nu urmărim fiecare bit de pe bandă până pe tambur; regula acoperă cazul INEX-1. |
| Cuvintele scrise de program cât rulează apar „scris de program”, fără să-și schimbe proveniența, și nu se salvează | — (regula emulatorului) | Nu mai sunt cuvântul din document, dar nici nu le-a schimbat vizitatorul. |
| Preîncărcătorul INEX-1 încarcă de la adresa instrucțiunii ME de la 0014; operatorul o schimba ca să încarce în altă parte | GHICIT | Facsimilul 5 dă 0014 = ME 0002 și procedura de pornire, dar nu spune cum se alegea adresa. |
| În modul „rânduri”, vizitatorul scrie valoarea citită de CIT; pe bandă se perforează biții inversați | DEDUS | Perforația = 0 (Baltac, prin Wikipedia RO). |
| În vederea Pupitru și în tur se încarcă mereu programul original; în Atelier și Ambele, alegerea din bară aduce și modificările salvate ale vizitatorului, iar eticheta din bară arată MODIFICAT (și cuvintele șterse) | — (regula emulatorului) | Turul și vizitatorul nou trebuie să vadă originalul; în Atelier, vizitatorul își regăsește lucrul. |

## Sunetul
Alegerile sunetului (`web/js/sound/`). Nu există înregistrări ale MECIPT-1.

| Alegere | Statut | Motiv / sursă |
|---|---|---|
| Zumzetul tamburului are fundamentala de 50 Hz (cu armonice) | DEDUS | Tamburul face 50 de rotații pe secundă: 1024 de timpi de cuvânt pe rotație, 51 200 pe secundă (`core/machine.h`). |
| Timbrul zumzetului, al cititorului, al mașinii de scris și al comenzilor | GHICIT | Nu există înregistrări; sunetele sunt sintetizate să sune mecanic (spec §5). |
| Un clic pentru fiecare rând citit și o lovitură de clapă pentru fiecare caracter, ≈ 0,1 s | GHICIT | Ritmul din „Periferice” (un caracter ≈ 0,1 s). |
| La rând nou mașina de scris face sunetul carului | GHICIT | Mașinile de scris ale epocii întorceau carul la fiecare rând. |
| Peste 40 de evenimente pe secundă (măsurate în timp real) clicurile devin un bâzâit mai încet; sub 25 revin | — (regula emulatorului) | La viteza rapidă clicurile nu s-ar mai auzi separat. |
| Bara de sus și Atelierul nu fac sunet; în modul Explică comenzile nu fac clic | — (regula emulatorului) | Sunt comenzi de azi, nu ale mașinii; în Explică comenzile nu acționează. |
| Zumzetul se aude mereu cât sunetul e pornit, nu doar cât rulează un program | GHICIT | Tamburul se învârtea cât mașina era sub tensiune. |
