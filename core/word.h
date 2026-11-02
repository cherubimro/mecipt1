// SPDX-License-Identifier: AGPL-3.0-or-later
// Cuvântul MECIPT-1: 31 de biți, numere subunitare în complement față de unu.
// Bitul de panou m_i (i = 0…30, m0 = semnul) ↔ (w >> (30 - i)) & 1.
#ifndef MECIPT_WORD_H
#define MECIPT_WORD_H
#include <stdint.h>

typedef uint32_t mword;
#define MEC_MASK31 0x7FFFFFFFu
#define MEC_MASK30 0x3FFFFFFFu

int   mec_bit(mword w, int i);
mword mec_set_bit(mword w, int i, int v);
int   mec_is_neg(mword w);
int   mec_is_zero(mword w);          /* adevărat pentru +0 și −0 */
mword mec_neg(mword w);
mword mec_abs(mword w);
mword mec_add(mword a, mword b, int *overflow);
mword mec_from_double(double x);     /* fracție în (−1, 1), unitatea 2^−30 */
double mec_to_double(mword w);
int   mec_fmt_octal(mword w, char out[12]);
int   mec_parse_octal(const char *s, mword *w);

#endif
