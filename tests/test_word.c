// SPDX-License-Identifier: AGPL-3.0-or-later
#include "test.h"
#include "word.h"
#include <math.h>

TEST(test_bit_numbering) {
    CHECK_EQ_U(mec_bit(0x40000000u, 0), 1);
    CHECK_EQ_U(mec_bit(1u, 30), 1);
    CHECK_EQ_U(mec_bit(1u, 0), 0);
    CHECK_EQ_U(mec_set_bit(0, 0, 1), 0x40000000u);
}

TEST(test_add_end_around_carry) {
    int o = 9;
    mword r = mec_add(mec_from_double(0.5), mec_neg(mec_from_double(0.25)), &o);
    CHECK_EQ_U(r, mec_from_double(0.25));
    CHECK_EQ_U(o, 0);
}

TEST(test_add_overflow) {
    int o = 0;
    mec_add(mec_from_double(0.75), mec_from_double(0.5), &o);
    CHECK_EQ_U(o, 1);
    o = 0;
    mec_add(mec_from_double(-0.75), mec_from_double(-0.5), &o);
    CHECK_EQ_U(o, 1);
}

TEST(test_minus_zero_is_zero) {
    int o;
    CHECK(mec_is_zero(MEC_MASK31));
    CHECK(mec_is_zero(0));
    mword x = mec_from_double(0.3);
    CHECK(mec_is_zero(mec_add(x, mec_neg(x), &o)));
    CHECK(!mec_is_zero(x));
}

TEST(test_neg_abs_sign) {
    mword x = mec_from_double(0.3);
    CHECK(mec_is_neg(mec_neg(x)));
    CHECK(!mec_is_neg(x));
    CHECK_EQ_U(mec_abs(mec_neg(x)), x);
    CHECK_EQ_U(mec_neg(mec_neg(x)), x);
}

TEST(test_fraction_roundtrip) {
    double d = mec_to_double(mec_from_double(0.017452406)) - 0.017452406;
    CHECK(d < 1.0 / (1 << 29) && d > -1.0 / (1 << 29));
    double e = mec_to_double(mec_from_double(-0.5)) + 0.5;
    CHECK(e < 1.0 / (1 << 29) && e > -1.0 / (1 << 29));
}

TEST(test_octal_roundtrip) {
    char buf[12];
    mword w = 0x12345678u & MEC_MASK31, back = 0;
    mec_fmt_octal(w, buf);
    CHECK_EQ_U(strlen(buf), 11);
    CHECK_EQ_U(mec_parse_octal(buf, &back), 0);
    CHECK_EQ_U(back, w);
    CHECK_EQ_U(mec_parse_octal("17777777777", &back), 0);
    CHECK_EQ_U(back, MEC_MASK31);
    CHECK(mec_parse_octal("27777777777", &back) != 0); /* peste 31 biți */
    CHECK(mec_parse_octal("1238", &back) != 0);        /* cifră neoctală */
}

TEST(test_minus_zero_displays_as_zero) {
    CHECK(!signbit(mec_to_double(MEC_MASK31)));           /* −0 se afișează „0”, nu „−0” */
    CHECK(mec_to_double(MEC_MASK31) == 0.0);
}

RUN_ALL()
