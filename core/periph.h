// SPDX-License-Identifier: AGPL-3.0-or-later
// Perifericele MECIPT-1: cititorul de bandă perforată (5 canale), mașina de scris, automatul ICR.
#ifndef MECIPT_PERIPH_H
#define MECIPT_PERIPH_H
#include <stddef.h>
#include <stdint.h>
#include "word.h"

typedef struct mec_periph {
    const uint8_t *tape;     /* rânduri de 5 biți așa cum sunt PERFORATE (1 = gaură) */
    size_t tape_len, tape_pos;
    char typed[65536];       /* ce a scris mașina de scris (UTF-8) */
    size_t typed_len;
    int icr_on;              /* automatul ICR (Imprimare și Citire Repetată) */
    mword icr;
} mec_periph;

/* GHICIT: timpul unui caracter la cititor / la mașina de scris (≈ 10 caractere pe secundă). */
#define MEC_TAPE_TICKS 5120u
#define MEC_TYPE_TICKS 5120u

int  mec_tape_read(mec_periph *p, int *value5);    /* 0 = ok (valoarea citită, gaura = 0); −1 = sfârșit */
void mec_type_digits(mec_periph *p, mword S);      /* AC 0136: cifra din s0 s1 s2 s3 */
void mec_type_letters(mec_periph *p, mword S);     /* AC 0133: caracterul din s0 … s4 */
/* Un cuvânt = 6 caractere de 5 biți (m1–m30), perforate cu gaura = 0 (Geier: 2 instrucțiuni = 6 caractere). */
int  mec_tape_encode_words(const mword *w, int n, uint8_t *out, size_t cap);

extern const char *const MEC_DIGIT_GLYPHS[16];    /* GHICIT până la găsirea tabelei reale */
extern const char *const MEC_LETTER_GLYPHS[32];   /* GHICIT; 30 de litere românești + spațiu + rând nou */

#endif
