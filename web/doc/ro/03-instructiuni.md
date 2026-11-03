# Setul de instrucțiuni

Tabelul instrucțiunilor vine de la **A. Geier** („Programarea calculatorului electronic cifric MECIPT I în regimul virgulă mobilă”, 1961), reprodus în Wikipedia RO: coduri 0–28, cu 5 variante pentru codul 26 (AC). SIGUR. Codurile 29–31 nu apar în tabel; emulatorul se oprește la ele cu OPRIT (GHICIT).

În tabel, **s** și **i** sunt conținuturile registrelor de calcul S (acumulatorul) și I, iar **y** e cuvântul de la adresa din instrucțiune.

{{ops}}

## Ordinea de execuție
Pentru fiecare cuvânt: întâi **instrucțiunea 1**, apoi **instrucțiunea 2**, apoi **RAI + 1** — adresa cuvântului următor. DEDUS din Lucrarea 7 (p. 6: „trece instrucția 2 în locul instrucției 1”, „RAI+1→RAI”) și confirmat de cele două programe originale, care merg corect doar așa. Un salt (T, TPO, TN, TO) pune adresa lui în RAI și reîncepe cu instrucțiunea 1 a cuvântului de acolo.

## Timpul
Fiecare acces la tambur așteaptă ca cuvântul căutat să treacă prin dreptul capetelor: 1024 de poziții, 50 de rotații pe secundă. De aceea mașina făcea în jur de **50 de instrucțiuni pe secundă**, iar programele așezate cu grijă pe tambur (adrese pare și impare pe jumătăți diferite) ajungeau la 70–80 (Baltac). Emulatorul socotește timpul la fel; durata exactă a unei operații e GHICITĂ.

## Codurile 14 și 15 (salturile după semn)
Tabelul spune 14 = TPO „salt dacă s ≥ 0” și 15 = TN „salt dacă s < 0”. Ambele programe originale (INEX-1 și retipărirea) merg doar dacă **14 sare pe s < 0 și 15 pe s ≥ 0** — invers. Emulatorul folosește varianta confirmată de programe (DEDUS) și păstrează mnemonicele din tabel. E o întrebare deschisă: fie rândurile tabelului sunt inversate în transcriere, fie convenția de semn diferă.

## Deplasările
Pentru DLS, DLD, DS, DD, câmpul de adresă dă numărul de poziții **n**. Wikipedia notează „32 − n”; programele originale merg doar cu **n = câmpul** (DEDUS). Biții care ies se pierd, intră zerouri (GHICIT pentru semn).

## Comanda perifericelor AC (codul 26)
Subcodul stă în câmpul de adresă:

{{ac}}

ICR („imprimare și citire repetată”) era un automat pentru tipărire și citire repetată; numele e SIGUR, funcționarea lui exactă GHICITĂ.

## Cum se citește o instrucțiune pe pupitru
Registrul **RI** arată instrucțiunea în execuție: 5 becuri pentru cod, 10 pentru adresă. Cu butonul „Explică” și un click pe RI, pagina traduce codul în mnemonică și adresa în zecimal.
