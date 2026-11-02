// SPDX-License-Identifier: AGPL-3.0-or-later
// Alegerile pe care sursele nu le fixează clar. Fiecare are o valoare implicită
// justificată în docs/semantica.md; oracolele (programele originale) le pot confirma.
#ifndef MECIPT_VARIANTS_H
#define MECIPT_VARIANTS_H

typedef struct {
    /* Câmpul de adresă al deplasărilor (coduri 17–20): numărul de poziții n
       este chiar câmpul, sau 32 − câmpul (Geier 1961: „Adresă 32-n”). */
    enum { SHIFT_N_IS_FIELD, SHIFT_N_IS_32_MINUS_FIELD } shift_field;
    /* Care instrucțiune din cuvânt se execută întâi: (cod 1, adresă 1) sau (cod 2, adresă 2).
       DEDUS din Lucrarea 7 p.6: „trece instrucția 2 în locul instrucției 1”. */
    enum { PAIR_FIRST_IS_1, PAIR_FIRST_IS_2 } pair_order;
    /* 0 = adresare simplă; 1 = adrese pare pe o jumătate de tambur, impare pe cealaltă (Baltac). */
    int interleave_even_odd;
    /* Ipoteză din oracolul INEX-1: codurile 14 (TPO) și 15 (TN) au sensurile inversate față de
       tabelul Geier (14 sare pe s < 0, 15 pe s ≥ 0). 0 = ca în tabel. */
    int branch14_on_negative;
    /* timp de execuție după un acces la tambur, în „timpi de cuvânt” (1024 pe rotație). GHICIT. */
    int exec_ticks;
} mec_variants_t;

mec_variants_t mec_variants_default(void);

#endif
