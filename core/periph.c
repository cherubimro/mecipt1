// SPDX-License-Identifier: AGPL-3.0-or-later
#include "periph.h"
#include <string.h>

/* GHICIT: 16 caractere numerice (Wikipedia RO); tabela reală nu s-a găsit. */
const char *const MEC_DIGIT_GLYPHS[16] = {
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", " ", ",", "-", "\n", ".", "+"
};

/* GHICIT: 30 de caractere alfabetice inclusiv ă, î, ș, ț (Wikipedia RO) = A–Z + Ă Î Ș Ț,
   în ordine alfabetică românească; 30 = spațiu, 31 = rând nou. */
const char *const MEC_LETTER_GLYPHS[32] = {
    "A", "Ă", "B", "C", "D", "E", "F", "G", "H", "I", "Î", "J", "K", "L", "M", "N",
    "O", "P", "Q", "R", "S", "Ș", "T", "Ț", "U", "V", "W", "X", "Y", "Z", " ", "\n"
};

int mec_tape_read(mec_periph *p, int *value5) {
    if (!p || !p->tape || p->tape_pos >= p->tape_len) return -1;
    *value5 = (~p->tape[p->tape_pos++]) & 037;      /* perforație = 0 */
    return 0;
}

static void type(mec_periph *p, const char *g) {
    size_t n = strlen(g);
    if (p->typed_len + n >= sizeof p->typed) return;
    memcpy(p->typed + p->typed_len, g, n);
    p->typed_len += n;
    p->typed[p->typed_len] = 0;
}

void mec_type_digits(mec_periph *p, mword S)  { type(p, MEC_DIGIT_GLYPHS[(S >> 27) & 017]); }
void mec_type_letters(mec_periph *p, mword S) { type(p, MEC_LETTER_GLYPHS[(S >> 26) & 037]); }

int mec_tape_encode_words(const mword *w, int n, uint8_t *out, size_t cap) {
    size_t k = 0;
    for (int i = 0; i < n; i++)
        for (int c = 5; c >= 0; c--) {
            if (k >= cap) return -1;
            out[k++] = (uint8_t)((~(w[i] >> (5 * c))) & 037);
        }
    return (int)k;
}
