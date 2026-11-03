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

## Tabelul de sinus (21 februarie 1962)
Facsimilul 3: „Tabel de sinus dela 1° la 45° calculat de MECIPT-1”, 45 de valori cu 9 zecimale, câte 5 pe rând. Mașina de scris bate „o” pentru zero și pune un semn după fiecare număr: `o,o174524o6_o,o34899496_…`. În emulator, semnul acesta e minusul, caracterul cel mai apropiat din setul ei.

- **ORIGINAL**: rezultatul. Programul care l-a calculat nu s-a păstrat.
- **RECONSTRUCȚIE**: programul, cu o metodă găsită prin căutare în modelul aritmeticii mașinii. Cum s-a ajuns la ea:
  - Toate cele 45 de valori tipărite corespund unor numere binare **impare**. Deci mașina calcula y ≈ sin x / 2 și tipărea 2y − 2⁻³⁰.
  - Erorile cresc cu −0,18·n unități: argumentul era n·π/360, cu π/360 **trunchiat** și adunat de n ori.
  - Erorile au un „zgomot” de câte o unitate, neatenuat. Asta înseamnă o serie Taylor luată **termen cu termen**, fiecare termen trunchiat (IN), unde doar w² și primul raport (2/3) sunt rotunjite.
- **Potrivirea**: 44 de valori ies cifră cu cifră ca în facsimil. **sin 32° iese `o,52991926o`**, în loc de `o,529919258` (valoarea adevărată: 0,5299192642). Cifrele din facsimil se citesc limpede. Toate variantele metodei care ating 44 greșesc exact această valoare. Diferența rămâne neexplicată și e lăsată la vedere.
- Pornit de la 0400, programul tipărește tabelul în aproximativ 2½ minute de timp al mașinii.

## Barajul Vidraru — calcul ilustrativ
**Calcul ilustrativ în spiritul celui efectuat pentru barajul Vidraru; cifrele nu sunt cele reale.** Nici programul, nici datele nu s-au păstrat. Metoda e cea a arcelor încastrate (Farcaș, 1964), mult simplificată: 11 arce orizontale, de la coronament la fundație.

- Dimensiunile publice: înălțimea de 166 m, grosimea de ~6 m la coronament și ~25 m la bază. **GHICITE**: cota coronamentului (834 m) și razele arcelor (160 m sus, 80 m jos).
- Pe fiecare rând (un arc), coloanele sunt:
  1. cota (m);
  2. adâncimea /1000, egală cu presiunea apei p /1000 (tf/m²);
  3. forța din arc N = p·R /10⁶ (tf/m);
  4. efortul din beton σ = N/t /10⁴ (tf/m²).
- Numerele sunt scalate ca să încapă în fracțiile mașinii.
- Pornit de la 0400, programul tipărește 11 rânduri în aproximativ 1½ minute.

## Cupola Romexpo — calcul ilustrativ
**Calcul ilustrativ în spiritul celui efectuat în 1963 pentru cupola Romexpo; cifrele nu sunt cele reale.** Calculul original (iulie 1963, programator V. Baltac, catedra acad. Mateescu) nu s-a păstrat.

- O cupolă sferică cu diametrul public de 93,5 m. **GHICITE**: săgeata (24 m), unghiul de la vârf la bază (~0,949 rad, calculat dinainte, ca din tabele) și cele 32 de meridiane.
- Raza sferei se calculează în program: R = (a² + f²)/(2f).
- Pe fiecare rând (un inel, de la vârf spre bază), coloanele sunt:
  1. numărul inelului;
  2. unghiul φ (radiani);
  3. raza inelului r = R·sin φ /100 (m);
  4. lungimea elementului de inel c = 2·r·sin(π/32) /100 (m).
- Sinusul se calculează cu metoda tabelului din 1962.
- Pornit de la 0400, programul tipărește 10 rânduri în aproximativ 1½ minute.

Vidraru și Romexpo sunt verificate față de un calcul independent (`tools/ref/`), făcut cu aceeași aritmetică a mașinii, pas cu pas.
