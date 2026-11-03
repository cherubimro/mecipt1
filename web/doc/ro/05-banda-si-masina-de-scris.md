# Banda perforată și mașina de scris

## Banda
Programele și datele intrau pe **bandă de telex**, citită mecanic; perforația însemna 0. Fiecare regulă de codare, cu statutul ei:

| Regula | Statut | Sursa |
|---|---|---|
| Banda are **5 canale** de date și un canal de ghidaj | SIGUR | Farcaș; Wikipedia RO |
| **Perforația = „0”**: o gaură înseamnă bitul 0, lipsa găurii bitul 1 | SIGUR | Wikipedia RO (Baltac) |
| Instrucțiunea **CIT** citește **un rând** (5 biți) și îl pune aliniat la dreapta, restul cuvântului 0 | SIGUR (restul 0: DEDUS) | tabelul Geier |
| Un cuvânt de program = **6 rânduri** de câte 5 biți, primul rând = m1–m5; semnul m0 nu e pe bandă | DEDUS | Geier: „două instrucțiuni de 15 biți … prin doar șase caractere” |
| **Canalul 1** = bitul cel mai semnificativ al rândului | GHICIT | — |
| Așezarea canalelor pe hârtie: **1 · 2 · ghidaj · 3 · 4 · 5** | DEDUS | banda de telex are ghidajul cu 2 canale de o parte și 3 de cealaltă |
| Când banda se termină, mașina se oprește cu **HIRTIA AGATATA** | DEDUS | becul de pe pupitru |
| Un caracter se citește în ≈ 0,1 s | GHICIT | ordinul de mărime al unui teleimprimator |

### Exemplu: un cuvânt pe bandă

{{tape-example}}

Biții se citesc de pe bandă exact cum îi folosește mașina; ce ar putea diferi față de banda reală e doar oglindirea desenului (care canal e „1”) — GHICIT până la o fotografie a unei benzi MECIPT sau o schemă a cititorului.

### Cum citea preîncărcătorul INEX-1 un cuvânt
Preîncărcătorul original (Facsimil 5) pune în S valoarea −1 ca „santinelă”, apoi pentru fiecare rând citit deplasează S cu 5 poziții și adaugă cei 5 biți. După 6 rânduri santinela ajunge în poziția semnului, S devine pozitiv, bucla se oprește și cuvântul se memorează; `MS 0014` mărește apoi adresa de memorare. Emulatorul rulează exact acest cod. Banda INEX-1 originală nu s-a păstrat; în pagină e o bandă de test de 3 cuvinte (GHICIT).

## Mașina de scris
Rezultatele se tipăreau pe o **mașină de scris electrică obișnuită**, cu electromagneți puși deasupra clapelor, pe hârtie A4 sau A3 (SIGUR, Farcaș).

- **AC 0136** tipărește o **cifră** după biții s0 s1 s2 s3 ai lui S; **AC 0133** o **literă** după s0 … s4. SIGUR (tabelul Geier): 16 caractere numerice și 30 de litere, cu ă, î, ș, ț.
- **Ce cod corespunde cărui caracter** nu s-a păstrat: tabelele de mai jos sunt GHICITE. Programul de retipărire folosește două coduri din 10–15, pentru spațiu și rând nou; care e care nu se poate deduce.
- Viteza, cam 10 caractere pe secundă, e GHICITĂ.

### Cifrele (AC 0136)

{{digits}}

### Literele (AC 0133)

{{letters}}

## Automatul ICR
„Imprimare și Citire Repetată” — pornit cu AC 0111, oprit cu AC 0134, alimentat cu TICR (codul 28). Numele și instrucțiunile sunt SIGURE; ce făcea exact e GHICIT.
