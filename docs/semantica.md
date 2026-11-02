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
