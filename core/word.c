// SPDX-License-Identifier: AGPL-3.0-or-later
#include "word.h"
#include <math.h>
#include <stdio.h>

int mec_bit(mword w, int i) { return (int)((w >> (30 - i)) & 1u); }

mword mec_set_bit(mword w, int i, int v) {
    mword m = 1u << (30 - i);
    return v ? (w | m) : (w & ~m);
}

int mec_is_neg(mword w) { return mec_bit(w, 0); }

int mec_is_zero(mword w) {
    w &= MEC_MASK31;
    return w == 0 || w == MEC_MASK31;
}

mword mec_neg(mword w) { return ~w & MEC_MASK31; }

mword mec_abs(mword w) { return mec_is_neg(w) ? mec_neg(w) : (w & MEC_MASK31); }

mword mec_add(mword a, mword b, int *overflow) {
    a &= MEC_MASK31; b &= MEC_MASK31;
    uint32_t s = a + b;
    if (s & 0x80000000u) s = (s & MEC_MASK31) + 1u;   /* transport circular */
    s &= MEC_MASK31;
    if (overflow)
        *overflow = (mec_is_neg(a) == mec_is_neg(b)) && (mec_is_neg(s) != mec_is_neg(a));
    return s;
}

mword mec_from_double(double x) {
    double mag = fabs(x) * (double)(1u << 30);
    uint32_t m = (uint32_t)llround(mag);
    if (m > MEC_MASK30) m = MEC_MASK30;
    return x < 0 ? mec_neg(m) : m;
}

double mec_to_double(mword w) {
    double m = (double)mec_abs(w) / (double)(1u << 30);
    return (mec_is_neg(w) && m != 0.0) ? -m : m;   /* −0 se afișează 0 */
}

int mec_fmt_octal(mword w, char out[12]) {
    return snprintf(out, 12, "%011o", (unsigned)(w & MEC_MASK31));
}

int mec_parse_octal(const char *s, mword *w) {
    uint64_t v = 0;
    if (!*s) return -1;
    for (; *s; s++) {
        if (*s < '0' || *s > '7') return -1;
        v = v * 8 + (uint64_t)(*s - '0');
        if (v > MEC_MASK31) return -1;
    }
    *w = (mword)v;
    return 0;
}
