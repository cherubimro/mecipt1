// SPDX-License-Identifier: AGPL-3.0-or-later
#include "test.h"
#include "isa.h"
#include "word.h"

TEST(test_opcode_table) {
    for (int c = 0; c <= 28; c++) CHECK(mec_op_by_code(c) != NULL);
    CHECK(mec_op_by_code(29) == NULL);
    CHECK(mec_op_by_code(31) == NULL);
    CHECK(mec_op_by_code(-1) == NULL);
    CHECK_EQ_U(mec_op_by_mnemonic("CIT")->code, 27);
    CHECK_EQ_U(mec_op_by_mnemonic("DS")->code, 19);
    CHECK_EQ_U(mec_op_by_mnemonic("O")->code, 0);
    CHECK_EQ_U(mec_op_by_mnemonic("TICR")->code, 28);
    CHECK(mec_op_by_mnemonic("XYZ") == NULL);
    CHECK_EQ_U(mec_op_by_code(24)->kind, ADDR_NONE);
    CHECK_EQ_U(mec_op_by_code(26)->kind, ADDR_SUB);
    CHECK_EQ_U(mec_op_by_code(17)->kind, ADDR_SHIFT);
    CHECK_EQ_U(mec_op_by_code(5)->kind, ADDR_Y);
}

TEST(test_pack_inex_word) {
    /* 0010  27 0000  02 0001 (Facsimil 5) */
    mec_pair p = { .code1 = 027, .addr1 = 0, .code2 = 02, .addr2 = 01 };
    mword w = mec_pack(p);
    CHECK_EQ_U(mec_bit(w, 0), 0);
    CHECK_EQ_U((w >> 20) & 037, 027);      /* m6–m10: cod 1 */
    CHECK_EQ_U((w >> 25) & 037, 02);       /* m1–m5: cod 2 */
    CHECK_EQ_U((w >> 10) & 01777, 01);     /* m11–m20: adresă 2 */
    CHECK_EQ_U(w & 01777, 0);              /* m21–m30: adresă 1 */
    mec_pair q = mec_unpack(w);
    CHECK_EQ_U(q.code1, 027); CHECK_EQ_U(q.addr1, 0);
    CHECK_EQ_U(q.code2, 02);  CHECK_EQ_U(q.addr2, 01);
}

TEST(test_ac_subcodes_octal) {
    CHECK_EQ_U(AC_PRINT_DIGITS, 94);
    CHECK_EQ_U(AC_ICR_START, 73);
    CHECK_EQ_U(AC_PRINT_LETTERS, 91);
    CHECK_EQ_U(AC_ICR_STOP, 92);
    CHECK_EQ_U(AC_S_FROM_I, 105);
}

TEST(test_variants_default) {
    mec_variants_t v = mec_variants_default();
    CHECK_EQ_U(v.shift_field, SHIFT_N_IS_FIELD);          /* oracolul INEX-1 */
    CHECK_EQ_U(v.branch14_on_negative, 1);                /* oracolul INEX-1 */
    CHECK_EQ_U(v.pair_order, PAIR_FIRST_IS_1);
    CHECK_EQ_U(v.interleave_even_odd, 1);
    CHECK_EQ_U(v.exec_ticks, 3);
}

RUN_ALL()
