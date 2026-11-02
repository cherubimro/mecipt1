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
| `MS y`: y ← s + y, S neschimbat | GHICIT (efectul asupra lui S) | tabelul spune doar „Y ← s + y” |
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
| AC 0136 tipărește cifra din s0 s1 s2 s3; AC 0133 litera din s0 … s4 | SIGUR (biții) / GHICIT (glifele) | tabelul Geier; 16 caractere numerice, 30 alfabetice cu ă î ș ț |
| Glifele cifrelor 10–15: spațiu , - rând-nou . + | GHICIT | Task 10 (retipărirea) le poate fixa |
| Literele: A Ă B C D E F G H I Î J K L M N O P Q R S Ș T Ț U V W X Y Z, apoi spațiu, rând nou | GHICIT | 30 de litere = alfabetul românesc fără Â |
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
