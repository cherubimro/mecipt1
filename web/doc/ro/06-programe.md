# Programele

Fiecare cuvânt al unui program poartă o **proveniență**, arătată în pagină sub alegerea programului:

- **ORIGINAL** — transcris dintr-un document de epocă, cu trimitere la facsimil;
- **DEDUS** — rezultă din documente, dar nu e scris în ele;
- **RECONSTRUCȚIE** — scris acum, după logica programului, pentru că lipsește din document;
- **GHICIT** — necesar ca să meargă, fără sursă.

Imaginile facsimilelor **nu sunt reproduse** aici; ele se găsesc în cartea lui Vasile Baltac, *MECIPT – Mașina Electronică de Calcul a Institutului Politehnic din Timișoara – Evocări și Documente* (2011).

## Retipărirea programelor (6 septembrie 1962)
Facsimilul 4: un program care își tipărește propriul listing, rând cu rând, în formatul `AAAA  c1 aaaa  c2 aaaa`.

- **ORIGINAL**: cele 39 de cuvinte de la 1477 la 1545.
- **RECONSTRUCȚIE**: 7 constante pe care programul le citește din afara listingului (1551, 1556, 1557, 1600, 1625, 1626, 1675), deduse din logica lui.
- Pornit de la **1477**, programul tipărește în emulator listingul **identic cu facsimilul**, caracter cu caracter, în aproximativ 114 secunde de timp al mașinii. Asta confirmă, independent, câteva alegeri din capitolele 3 și 5 (deplasările, salturile 14/15, tipărirea cifrelor).

## Preîncărcătorul INEX-1 și banda INEX-1
Facsimilul 5: „Instrucțiuni la programul INEX-1 — se introduce manual”, cuvintele 0000–0001 și 0010–0015, cu procedura „se pune banda INEX-1 în cititor de la primul caracter perforat și se pornește calculatorul de la 0010”.

- **ORIGINAL**: preîncărcătorul, 7 cuvinte; **DEDUS**: cuvântul 0001, a cărui ultimă cifră e corectată de mână în facsimil (citită „0” — doar așa preîncărcătorul mărește corect adresa).
- **Banda INEX-1 nu s-a găsit.** Facsimilul dă doar punctele de intrare. Banda din pagină e o **RECONSTRUCȚIE**: rutinele scrise acum, la aceste adrese, iar valorile implicite ale formatului sunt GHICITE.
- Banda are 190 de cuvinte (0002–0277), adică 1140 de rânduri. Preîncărcătorul original o citește în cititor, cuvânt cu cuvânt, în aproximativ 3 minute de timp al mașinii, și se oprește cu HIRTIA AGATATA la capătul benzii.
- Preîncărcătorul scrie și peste propriile cuvinte (0010–0015). Banda are acolo copii identice ale lor, iar la 0014 instrucțiunea „ME 0014”. După `MS 0014`, ea devine „ME 0015”, așa că încărcarea continuă.

| Punct de intrare | Ce face (după Facsimilul 5) | Cum îl cheamă un program (GHICIT) |
|---|---|---|
| 0040 (sau 0026) | citirea benzilor de la pupitru | pornit de la pupitru; citește până la capătul benzii, la adresa din instrucțiunea ME de la 0045 |
| 0025 | citirea unei benzi „ca program” | S = 00 A 00 n: n cuvinte la A, revine la V |
| 0133 | formatul | S = c1 α c2 β: α cifre pentru întregi, β zecimale |
| 0134 | numere întregi din S | n·2⁻³⁰; zerourile din față devin spații |
| 0135 | numere subunitare din S | „o,” și β zecimale (implicit 9), apoi semnul de după număr, ca în Facsimilul 3 |
| 0136 / 0132 | n spații / n rânduri | S = −n·2⁻⁵ |
| 0246 | tipărește de la A la B | S = 00 A 00 B, câte 5 numere pe rând |

Programul care cheamă o rutină pune întâi în celula **V** (0002) instrucțiunea de întoarcere, „T r”, iar argumentul în S. Rutina se termină cu `T 0002`. Toate alegerile sunt în *Semantica*, secțiunea „INEX-1 reconstruit”.

## Ce urmează
Reconstrucții marcate clar: tabelul de sinus din februarie 1962 (rezultatul original tipărit există, Facsimilul 3, și servește drept verificare) și calcule ilustrative în spiritul celor pentru barajul Vidraru și cupola Romexpo — cifrele nu vor fi cele reale.
