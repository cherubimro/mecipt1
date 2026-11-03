# Pupitrul

Pupitrul are trei panouri. Inscripțiile sunt redesenate literă cu literă după texturile modelului 3D (SIGUR); culorile becurilor după fotografia din 2011 (SIGUR). În pagină, butonul **Explică** și apoi un click pe orice element dau explicația lui, cu statutul și sursele.

## Panoul drept — registrele și comenzile
- **M** (registrul de memorie): 31 de becuri verzi, 0–30, cu câte un comutator dedesubt. Prin M trec cuvintele spre și dinspre tambur.
- **RI** (registrul de instrucțiuni): codul (16 8 4 2 1) și adresa (512 … 1) instrucțiunii în execuție.
- **R I**: registrul de microinstrucțiuni, 7 biți (64 … 1).
- **RA**: registrul de adresă, 10 biți.
- **RAI** (registrul de adresă al instrucțiunii): adresa cuvântului următor, cu comutatoare; lângă el INSTRUCTIA 1 / INSTRUCTIA 2 și MEMORIE TAMBUR / MEMORIE FERITE.
- **ANULEAZA** RAI / M / S; **INTRODUCE** 7 CATEG. DIN RA în RI, M în I, M în RI; ADUNARE 1 și M+S 2 (funcție necunoscută).
- **MEMORIE** SCRIERE / CITIRE; **IMPULSURI** INTRERUPE / RESTABILESTE; **IN CAZ DE DEPASIREA CAPACITATII REGISTRULUI** SE OPRESTE / NU SE OPRESTE.
- Becurile de stare **DEPASIT CAPACITATEA REGISTRULUI**, **HIRTIA AGATATA**, **OPRIT**; **CALCULEAZA** AUTOMAT / INSTRUCTIE UNICA.

Efectul fiecărui buton e DEDUS din inscripția lui, cu excepțiile marcate GHICIT în capitolul 7.

## Cum se lucra
Procedura de mai jos e reconstruită din inscripții și din instrucțiunile preîncărcătorului INEX-1 („se pune banda în cititor … și se pornește calculatorul de la 0010”, Facsimil 5):

1. **Programul de pornire se introducea de mână**, cuvânt cu cuvânt: cuvântul pe comutatoarele M, adresa pe comutatoarele RAI, apoi **MEMORIE SCRIERE**. Așa se scria, de exemplu, preîncărcătorul INEX-1 (8 cuvinte).
2. **Banda** cu restul programului se punea în cititor.
3. **Adresa de pornire** se punea pe comutatoarele RAI (de exemplu 0010).
4. **CALCULEAZA AUTOMAT** pornea mașina; **INSTRUCTIE UNICA** o lăsa să facă un singur pas, ca să se poată urmări pe becuri.
5. Mașina se oprea la instrucțiunea **O** (becul OPRIT), la sfârșitul benzii (**HIRTIA AGATATA**) sau la o depășire.

**GHICIT, în tensiune cu sursele:** în emulator, comutatoarele M și RAI țin poziția, iar fiecare mutare pune tot cuvântul în registru; pârghia sus = 1. Existența butoanelor ANULEAZA M și ANULEAZA RAI și introducerea „cu trei degete” (octal) sugerează că poate registrul se golea întâi și comutatoarele doar adăugau biți. Până la o sursă, emulatorul păstrează varianta simplă.

## Panoul stâng — microoperațiile
MECIPT-1 era **microprogramat** după schema Wilkes: doar adunarea era cablată, restul instrucțiunilor se făceau din pași elementari (SIGUR, Wikipedia RO, Lucrarea 7). Grila panoului stâng are câte un bec pentru fiecare microoperație: o grilă mare cu antetul ⎍ (impuls pozitiv, 16 × 3, 35 de celule cu inscripție) și una mică cu antetul ⊔ (impuls negativ, 3 × 3, 4 celule). Textele marcate [?] nu se citesc sigur.

{{uops}}

Registrele **R I** (panoul drept) și **R II** (panoul stâng) au câte 7 biți; la fiecare pas, conținutul lui R I trece în R II (Lucrarea 7, p. 3 — SIGUR). Ce microoperații alcătuiesc fiecare instrucțiune și în ce ordine e DEDUS: paginile care le descriau s-au pierdut.

Sub grilă: **GENERATOR PRINCIPAL** (IMPULSURI, FRECVENȚĂ FIN, FRECVENȚĂ TREPTE, p, q) — generatorul care dădea ritmul mașinii; comutatoarele lui nu fac nimic în emulator (GHICIT).

## Panoul din mijloc — aparatele de măsură
Unsprezece voltmetre (unul lipsește azi, se vede doar rama), un selector, un comutator rotativ mare și comutatoare mici. Arătau, probabil, tensiunile de alimentare ale tuburilor; ce măsura fiecare și scalele sunt GHICITE. Cele patru voltmetre de sus sunt desenate cu scala 0–250 V (GHICIT).

## Sunetul
Nu există înregistrări ale MECIPT-1, așa că sunetele pupitrului sunt **reconstruite** (GHICIT) și sintetizate în browser. Ele urmează exact ce face mașina emulată:

- **zumzetul tamburului**, discret și continuu, cât sunetul e pornit. Are 50 Hz pentru că tamburul face 50 de rotații pe secundă (DEDUS: 1024 de cuvinte pe rotație, 51 200 de timpi de cuvânt pe secundă);
- **țăcănitul cititorului**, câte un clic pentru fiecare rând de bandă citit, cam unul la 0,1 s;
- **mașina de scris**, o lovitură de clapă pentru fiecare caracter și sunetul carului la rând nou;
- **comenzile pupitrului**, clicuri discrete la butoane și pârghii (bara de sus și Atelierul nu fac sunet: sunt comenzi de azi).

La viteza rapidă rândurile și caracterele vin prea des ca să se audă separat; clicurile devin atunci un bâzâit continuu, mai încet. Un program care citește rar țăcăne și la viteza rapidă.

Butonul 🔊/🔇 din bară oprește și pornește sunetul, iar alegerea se ține minte. Browserele pornesc sunetul abia după primul gest al vizitatorului (clic, atingere sau tastă).
