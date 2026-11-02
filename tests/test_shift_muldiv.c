// SPDX-License-Identifier: AGPL-3.0-or-later
#include "test.h"
#include "machine.h"

static mecipt m;
static mec_image img;

static void run(const char *src, mec_variants_t v) {
    if (mec_program_parse(src, &img)) printf("  eroare program: %s\n", img.error);
    mec_init(&m, v);
    mec_load_image(&m, &img);
    mec_run(&m, 100);
}

static mec_variants_t field_n(void) {
    mec_variants_t v = mec_variants_default();
    v.shift_field = SHIFT_N_IS_FIELD;
    return v;
}

TEST(test_shift_count_variants) {
    mec_init(&m, mec_variants_default());       /* SHIFT_N_IS_32_MINUS_FIELD */
    CHECK_EQ_U(mec_shift_count(&m, 033), 5);    /* exemplul din Wikipedia: DS 0033 = 5 poziții */
    m.v.shift_field = SHIFT_N_IS_FIELD;
    CHECK_EQ_U(mec_shift_count(&m, 033), 27);
}

TEST(test_ds_dd) {
    run("@prov GHICIT t\n"
        "0000  U 0100  DS 0003\n"
        "0001  ME 0101  DD 0003\n"
        "0002  ME 0102  O 0002\n"
        "0100 = o00000000017\n", field_n());
    CHECK_EQ_U(m.drum[0101], 0170u);
    CHECK_EQ_U(m.drum[0102], 017u);
}

TEST(test_ds_drops_bits) {
    run("@prov GHICIT t\n"
        "0000  U 0100  DS 0001\n"
        "0001  O 0001  O 0001\n"
        "0100 = o17777777777\n", field_n());
    CHECK_EQ_U(m.S, 0x7FFFFFFEu);               /* bitul de semn iese, intră 0 în m30 */
}

TEST(test_dld_moves_S_m30_into_I) {
    run("@prov GHICIT t\n"
        "0000  U 0100  DLD 0001\n"
        "0001  O 0001  O 0001\n"
        "0100 = o00000000001\n", field_n());
    CHECK_EQ_U(m.S, 0);
    CHECK_EQ_U(m.I, 1u << 29);                  /* primul bit (cel mai semnificativ) al lui I */
}

TEST(test_dls_moves_I_top_into_S_m30) {
    run("@prov GHICIT t\n"
        "0000  UI 0101  U 0102\n"
        "0001  DLS 0001  O 0001\n"
        "0101 = o04000000000\n"                 /* m1 = 1 → bitul de sus al lui I */
        "0102 = 0\n", field_n());
    CHECK_EQ_U(m.S, 1u);
    CHECK_EQ_U(m.I, 0);
}

TEST(test_multiply) {
    run("@prov GHICIT t\n"
        "0000  U 0100  IN 0100\n"
        "0001  O 0001  O 0001\n"
        "0100 = 0,5\n", mec_variants_default());
    CHECK_EQ_U(m.S, mec_from_double(0.25));
    run("@prov GHICIT t\n"
        "0000  U 0100  INR 0101\n"
        "0001  O 0001  O 0001\n"
        "0100 = -0,5\n"
        "0101 = 0,5\n", mec_variants_default());
    CHECK_EQ_U(m.S, mec_from_double(-0.25));
}

TEST(test_multiply_rounding) {
    /* 2^-30 × 0,5 = 2^-31: IN dă 0 în S (restul în I), INR rotunjește la 2^-30 */
    run("@prov GHICIT t\n"
        "0000  U 0100  IN 0101\n"
        "0001  ME 0102  U 0100\n"
        "0002  INR 0101  O 0002\n"
        "0100 = o00000000001\n"
        "0101 = 0,5\n", mec_variants_default());
    CHECK_EQ_U(m.drum[0102], 0);
    CHECK_EQ_U(m.S, 1);
}

TEST(test_divide) {
    run("@prov GHICIT t\n"
        "0000  U 0100  D 0101\n"
        "0001  O 0001  O 0001\n"
        "0100 = 0,25\n"
        "0101 = 0,5\n", mec_variants_default());
    CHECK_EQ_U(m.I, mec_from_double(0.5));
    CHECK(mec_is_zero(m.S));
    run("@prov GHICIT t\n"
        "0000  U 0100  D 0101\n"
        "0001  O 0001  O 0001\n"
        "0100 = 0,75\n"
        "0101 = 0,5\n", mec_variants_default());
    CHECK_EQ_U(m.dcr, 1);
}

RUN_ALL()
