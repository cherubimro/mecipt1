# MECIPT-1 — Sunetul (Planul 5): document de proiect

Data: 2026-11-03 · Stare: pentru aprobare · Pornește de la `docs/2026-11-02-emulator-mecipt1-design.md` (§3.5 „Limbi, sunet, dispozitive”, §4, §5) și de la răspunsurile utilizatorului din conversația din 2026-11-03.

## 1. Intenția
Pupitrul arată mașina lucrând; sunetul o face **prezentă**. Vizitatorul aude tamburul învârtindu-se, cititorul trăgând banda rând cu rând, mașina de scris bătând listingul, și clicul comenzilor pe care le atinge. Sunetul trebuie să sune **mecanic și realist** (spec §5) și să urmeze exact ce face mașina emulată, nu o buclă decorativă.

**Reușita:** cine închide ochii la viteza „ca în 1962” poate spune când se citește banda și când se tipărește; sunetul nu obosește în zece minute de stat la pupitru; oricine îl poate opri dintr-un buton și pagina ține minte alegerea.

## 2. Ținte, non-ținte, anti-ținte
**Ținte** (cuvintele utilizatorului între ghilimele)
- **Tamburul**: „zumzet discret” — un fundal continuu, jos, cât timp pagina e deschisă și sunetul pornit (mașina e mereu sub tensiune în emulator; tamburul se învârte mereu).
- **Cititorul de bandă**: „țăcănit realist”, câte un clic mecanic pentru fiecare rând citit, în ritmul real al citirii.
- **Mașina de scris**: o lovitură de clapă pentru fiecare caracter tipărit (spec §3.5).
- **Comenzile pupitrului**: „clicuri discrete la butoane și pârghii” — la fiecare buton apăsat și la fiecare pârghie mutată pe replica pupitrului.
- **La viteza rapidă (×100)**: cititorul nu mai țăcăne, ci face „un bâzâit continuu, mai încet” cât timp citește. Mașina de scris face la fel: un ropot estompat, mai încet, cât timp tipărește des.
- **Butonul 🔊/🔇** în bara de sus, vizibil; alegerea se ține minte între vizite. Sunetul e **pornit implicit** (spec §3.5, §4).
- Ajutor „Explică” pentru buton, o secțiune în documentație (RO/EN) și rânduri noi în `docs/semantica{,.en}.md`.

**Non-ținte**
- Glisor de volum, mixer pe canale, sunete alese de vizitator. Un singur buton.
- Sunete pentru bara modernă și pentru Atelier (butoanele de pagină, editorul, perforatorul). Acolo sunt comenzi de azi, nu ale mașinii. Ce *face* mașina pornită din Atelier (citire, tipărire) se aude, ca oriunde.
- Sunetul semnalelor electronice (difuzor pe acumulator etc.): nu avem nicio sursă că MECIPT-1 avea așa ceva.

**Anti-ținte**
- **Să nu sune a joc**: fără bipuri, fără tonuri electronice, fără „recompense” sonore, fără muzică.
- **Să nu pară înregistrarea mașinii**: nu există înregistrări ale MECIPT-1. Sunetul e o reconstrucție și se spune asta (GHICIT), în ajutor și în documentație.
- Să nu obosească: zumzetul nu e strident și nu pulsează; clicurile comenzilor sunt mai încete decât mașina.

## 3. Constrângeri
- Pagina statică existentă, fără Emscripten și fără dependențe noi; fișierele noi sub `web/js/`. Codul AGPL, sunetele proprii CC BY-SA 4.0 (spec §4).
- Regula browserelor: un `AudioContext` pornește abia după un gest al vizitatorului (atingere, clic, tastă). „Pornit implicit” înseamnă: dacă vizitatorul n-a ales 🔇, sunetul începe la primul gest, pe calculator și pe telefon.
- Sunetul urmează **timpul mașinii**: evenimentele dintr-un cadru (rânduri citite, caractere tipărite) se așază în timp după ritmul lor real, nu toate grămadă la începutul cadrului.
- Tab ascuns: liniște (mașina e oricum limitată la `MAX_FRAME_MS`); la revenire sunetul reia fără rafale de evenimente adunate.
- Pagina trebuie să meargă identic când `AudioContext` lipsește sau e blocat (browser vechi, mod de test): butonul arată atunci 🔇 dezactivat, cu explicația în `title`.
- Testele existente (`make check`, `make web-check`) rămân verzi; testul fum din Chrome rulează fără sunet.

## 4. Ce s-a hotărât
### 4.1 Ritmurile
- **Tamburul**: 50 de rotații pe secundă (1024 de timpi de cuvânt, 51 200 pe secundă — `core/machine.h`) → fundamentala zumzetului **50 Hz**, cu armonice și un zgomot de lagăr ușor. DEDUS din ceasul emulatorului; timbrul e GHICIT.
- **Cititorul și mașina de scris**: un caracter ≈ 0,1 s (`docs/semantica.md`, GHICIT, deja în nucleu prin `MEC_TAPE_TICKS`). La „ca în 1962” fiecare rând și fiecare caracter are clicul lui.
- **Pragul de bâzâit**: când evenimentele vin mai des decât pot fi auzite distinct (în practică la „rapid”), clicurile individuale se înlocuiesc cu un sunet continuu, **mai încet** decât clicurile, care ține cât timp evenimentele continuă și se stinge scurt după ultimul.

### 4.2 Sunetele
| Sursa | Când | Caracter |
|---|---|---|
| Tamburul | mereu, cât sunetul e pornit | zumzet jos, 50 Hz și armonice, discret |
| Cititorul | un rând citit de CIT | țăcănit mecanic scurt (avans al benzii + citire) |
| Cititorul, rapid | rânduri citite des | bâzâit continuu, mai încet |
| Mașina de scris | un caracter tipărit | lovitură de clapă; trecerea la rând nou are sunetul carului |
| Mașina de scris, rapid | caractere dese | ropot estompat, mai încet |
| Buton al pupitrului | apăsare | clic discret |
| Pârghie a pupitrului | mutare | clic discret, alt timbru decât butonul |

Sunetele se **sintetizează în browser** (Web Audio), fără fișiere înregistrate (spec §5 permite „înregistrări libere de drepturi sau sinteză”).

### 4.3 Butonul și păstrarea
- În bara de sus, lângă limbă: 🔊 când e pornit, 🔇 când e oprit; `aria-pressed`, etichetă RO/EN.
- Alegerea în `localStorage` (cheia `mecipt.sound`); stocarea blocată nu strică nimic — se pornește implicit, ca la limbă.
- Oprirea taie imediat tot sunetul (inclusiv zumzetul); pornirea reia zumzetul și evenimentele de acum încolo.

### 4.4 Ajutorul și documentația
- Intrare „Explică” pentru butonul de sunet; secțiune „Sunetul” în documentație (capitolul despre pupitru sau un capitol nou — alegerea constructorului), RO și EN, care spune clar: nu există înregistrări, sunetele sunt reconstruite (GHICIT), zumzetul are 50 Hz pentru că tamburul face 50 de rotații pe secundă (DEDUS).
- Rânduri noi în `docs/semantica{,.en}.md`, cu gradul fiecărei alegeri.

## 5. Lăsat constructorului
- Rețetele de sinteză (zgomot filtrat, anvelope, armonice), nivelurile exacte, latența de planificare.
- Pragul exact de trecere la bâzâit și cât se stinge după ultimul eveniment.
- Cum se află din pagină clicul pe butoane și pârghii (evenimentele existente din `panel.js`/`app.js`).
- Structura modulelor și testele: logica (ce evenimente, când, cu ce volum) se poate testa în Node fără `AudioContext`.

## 6. Hotărâri luate de mine (pot fi schimbate)
- Sinteză în browser, nu înregistrări: fără probleme de licență, pagină mică, sunetul urmărește exact mașina.
- Zumzetul tamburului se aude mereu cât sunetul e pornit (nu doar cât rulează un program), pentru că tamburul real se învârtea cât mașina era sub tensiune.
- Mașina de scris trece și ea la ropot estompat la rapid, ca cititorul.
- Rândul nou la mașina de scris are sunetul carului.
- În modul „Explică” (care oprește acțiunea comenzilor) nu se aude clicul comenzilor.
- Comenzile Atelierului și ale barei nu fac clic.
- După verificarea constructorului:
  - **Totul în JS, nucleul nu se schimbă.** Momentele se deduc din cadru: rândurile citite (`tapePos`), caracterele tipărite (`typed`) și timpii de mașină de dinainte și de după cadru. Evenimentele se întind uniform peste fereastra audio a cadrului. E o aproximare, dar la 0,1 s pe eveniment ritmul se aude corect.
  - **Bâzâitul depinde de ritmul măsurat al evenimentelor**, în timp real, nu de viteza aleasă. Are histerezis, ca să nu comute înainte și înapoi. Un program care citește rar rămâne cu țăcănit chiar și la „rapid”.
  - **Sunetele urmează evenimentele în orice mod**: automat, instrucțiune unică, cu pulsuri oprite. Reîncărcarea programului sau Reset taie clicurile planificate și bâzâitul.
  - **Clicul comenzii se aude în momentul gestului**, câte unul pentru fiecare acțiune a vizitatorului, inclusiv de la tastatură, nu atunci când runner-ul aplică acțiunea:
    - o „pârghie” e un comutator (`.switch` din `panel.js`), iar un „buton” e orice buton de apăsat de pe pupitru;
    - un buton cu ținere face un singur clic.
  - **Primul gest al vizitatorului face și el sunet**, dacă e un clic pe pupitru. Zumzetul apare treptat, în aproximativ o secundă.
  - **Zumzetul se aude în toate vederile** (Pupitru, Atelier, Ambele), chiar și cu ajutorul, turul sau documentația deschise, pentru că mașina e tot sub tensiune.
  - **Testul din Chrome nu face niciun gest**, deci `AudioContext` nu se creează. Testul verifică butonul și păstrarea alegerii, iar logica sunetelor se testează în Node.
