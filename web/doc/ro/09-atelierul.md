# Atelierul

Atelierul vă lasă să faceți ce făceau programatorii MECIPT-1: să citiți un program în notația vremii, să-l schimbați, să-l puneți pe tambur sau pe bandă și să-l rulați. Îl deschideți din bară, la **Atelier** (sau **Ambele**, ca să vedeți și pupitrul întreg). E aceeași mașină: ce rulați în Atelier se vede pe pupitru.

## Cum se scria un program în 1962
Programatorul scria pe hârtie, în octal, cu **adrese absolute** (nu existau etichete simbolice): pentru fiecare cuvânt, adresa lui pe tambur și cele două instrucțiuni — `1477  27 0000  30 0000`. Mnemonicele (`UI`, `CU`, `CIT`…) vin din tabelul lui A. Geier (1961). Programul de pornire se introducea de la pupitru, cuvânt cu cuvânt; restul venea pe bandă perforată, pregătită separat, la un aparat de tip telex (Farcaș).

## Editorul
- Fiecare rând e un cuvânt de pe tambur: adresa, instrucțiunile cu mnemonice, aceleași în octal, valoarea ca fracție și proveniența. Un cuvânt e doar 31 de biți: instrucțiune sau număr, după cum îl folosește programul — de aceea rândul arată ambele citiri.
- Click pe rând, scrieți (`UI 0000  CU 0000`, `27 0000  30 0000` sau `= 0,5`) și apăsați Enter: cuvântul se scrie pe tambur între două instrucțiuni, chiar dacă mașina rulează. O greșeală se arată sub rând, iar tamburul rămâne neschimbat.
- „Adresă nouă” adaugă un cuvânt la o adresă goală; „Șterge cuvântul” golește adresa. Rândurile se deschid și cu Enter, de la tastatură.
- „Descarcă .mec” salvează programul ca fișier text (programul original plus schimbările dumneavoastră); „Deschide .mec” îl încarcă înapoi. Un fișier pe care nucleul nu-l acceptă e refuzat întreg, cu mesajul de eroare, iar tamburul rămâne neschimbat.

## MODIFICAT și „scris de program”
- Orice cuvânt pus de dumneavoastră pe tambur primește proveniența **MODIFICAT**: din editor, cu MEMORIE SCRIERE de la pupitru sau de pe banda perforată de dumneavoastră. Niciun cuvânt schimbat nu rămâne ORIGINAL — nici în editor, nici pe tambur, nici în eticheta programului, nici în fișierul descărcat.
- Un fișier deschis nu e crezut pe cuvânt: cuvintele lui sunt comparate cu programul din catalog, iar ce diferă devine MODIFICAT.
- Un cuvânt scris de program cât rulează (de exemplu retipărirea își rescrie o instrucțiune) apare **„scris de program”**: nu mai e cuvântul din document, dar nici nu l-ați schimbat dumneavoastră. Nu se salvează.
- Vederea Pupitru și turul ghidat încarcă mereu programul original. În Atelier (și în Ambele), programul ales din bară vine cu modificările dumneavoastră salvate, iar eticheta din bară arată MODIFICAT, inclusiv cuvintele șterse.

## Tamburul
O grilă de 32 × 32: fiecare pătrățel e un cuvânt (adresa = rândul din stânga, în octal, + coloana). Culoarea și litera spun proveniența: **O** original, **D** dedus, **R** reconstrucție, **G** ghicit, **M** modificat, **P** scris de program. Cât rulează programul, adresa curentă (RAI) e conturată. Click pe un pătrățel duce la rândul lui din editor.

## Banda și preîncărcătorul INEX-1
1. În perforator scrieți cuvintele (un cuvânt pe rând) sau rânduri de 5 biți (valoarea pe care o citește instrucțiunea CIT; desenul arată găurile, adică biții inversați) și apăsați „Perforează”.
2. „Pune banda în cititor”.
3. „Pune preîncărcătorul INEX-1 pe tambur” scrie cele 8 cuvinte originale ale preîncărcătorului (Facsimil 5) peste ce e pe tambur, fără să-l golească.
4. Preîncărcătorul scrie cuvintele benzii începând de la adresa instrucțiunii ME de la **0014** (0002) și o mărește după fiecare cuvânt. Ca să încărcați în altă parte, schimbați în editor adresa din 0014 — de exemplu `25 1000  01 0001`. Facsimilul nu spune cum se alegea adresa: că operatorul schimba cuvântul 0014 e **GHICIT**. Perforatorul vă avertizează dacă banda ar scrie peste preîncărcătorul însuși (0000–0001 sau 0010–0015; după 1777 adresa trece la 0000).
5. Puneți adresa de pornire 0010 și apăsați „Rulează”: banda trece prin cititor, iar mașina se oprește cu HIRTIA AGATATA când se termină.

Cuvintele scrise de program după ce ați pus banda dumneavoastră în cititor devin MODIFICAT — regula emulatorului, **GHICITĂ**: nu avem cum să urmărim fiecare bit de pe bandă până pe tambur.

Bitul de semn m0 nu încape pe bandă (6 × 5 = 30 de biți); perforatorul vă spune dacă un cuvânt l-ar pierde.
