# Metoda de sinus care reproduce Facsimilul 3

Rezultatul căutării din `tools/ref/sin_search.py`, în modelul aritmeticii mașinii (`tools/ref/mecarith.py`, verificat contra nucleului).

**Scor: 44 din 45.** Diferă doar sin 32°: facsimilul are `o,529919258`, metoda dă `o,52991926o` (adevărat: 0,5299192642). Cifrele lui 32° din facsimil se citesc limpede („258”), deci nu e o greșeală de transcriere.

## Cum am ajuns aici
1. **Toate cele 45 de valori tipărite sunt impare în ultima cifră binară.** Dacă tipărirea trunchiază exact, fiecare număr de 9 zecimale corespunde unui singur cuvânt de 30 de biți (rareori două); la toate 45 acel cuvânt e impar. Întâmplător, șansa ar fi de 1 la 2⁴¹. Explicația: programul calcula **y ≈ sin(n°)/2** și tipărea **2y − 2⁻³⁰**.
2. **Eroarea are o tendință −0,18·n·cos x (unități 2⁻³⁰)**: argumentul e n·h cu h = π/180 trunchiat, adică w = x/2 = n·HW cu **HW = π/360 trunchiat = 9 370 165 = o43575065**, adunat de n ori (exact).
3. **Zgomotul (±1 unitate a lui y) nu e atenuat**, ca într-o sumă de termeni trunchiați fiecare: seria Taylor **termen cu termen**, nu Horner (Horner dă cel mult 30/45; argumentul în fracții de grad, cel mult 28/45).

## Metoda (în operații ale mașinii)
sin(n°)/2 = sin(2w)/2 = w − (2/3)w³ + (2/15)w⁵ − (4/315)w⁷ + (2/2835)w⁹, cu w = n·HW:

| pas | operație | constantă |
|---|---|---|
| w | `A HW` la fiecare n (adunări repetate) | HW = o43575065 |
| w² | `INR` w·w (rotunjit) | — |
| qᵢ = w²·rᵢ | `IN` (trunchiat), i = 1…4 | r₁ = 2/3 **rotunjit** = o5252525253; r₂ = 1/5 = o1463146314; r₃ = 2/21 = o606060606; r₄ = 1/18 = o343434343 (trunchiate) |
| tᵢ = tᵢ₋₁·qᵢ | `IN` (trunchiat), t₀ = w | — |
| y | w − t₁ + t₂ − t₃ + t₄ (adunări exacte) | — |
| tipărit | `DS 1` (2y), `SC` 2⁻³⁰, rutina 0135 cu trunchiere exactă, 9 zecimale | — |

Toate cele 2304 variante ale familiei care ating 44/45 (cu 5–7 termeni, IN/INR pe fiecare pas, rapoarte trunchiate/rotunjite) greșesc **aceeași** valoare, sin 32°, cu exact o unitate a lui y (2·2⁻³⁰). Am ales varianta cea mai scurtă (5 termeni). Cu 6 sau 7 termeni rezultatul e același.

## Statut
- Metoda: **RECONSTRUCȚIE** (găsită prin căutare; codul original nu s-a păstrat).
- Potrivirea cu facsimilul: **verificare SIGURĂ** pentru 44 de valori; sin 32° e o diferență **neexplicată** (poate o abatere a mașinii din 1962, poate o metodă puțin diferită).
- Nicio alegere GHICIT a nucleului n-a trebuit schimbată (IN trunchiază, INR rotunjește la jumătate în sus, ca până acum).
