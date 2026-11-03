// SPDX-License-Identifier: AGPL-3.0-or-later
#include "test.h"
#include "machine.h"
#include "isa.h"

static mecipt m;
static mec_image img;

static void load(const char *src, mec_variants_t v) {
    if (mec_program_parse(src, &img)) printf("  eroare program: %s\n", img.error);
    mec_init(&m, v);
    mec_load_image(&m, &img);
}

TEST(test_add_store) {
    load("@prov GHICIT test\n"
         "0000  U 0100  A 0101\n"
         "0001  ME 0102  O 0000\n"
         "0100 = 0,25\n"
         "0101 = 0,5\n", mec_variants_default());
    mec_halt h = mec_run(&m, 100);
    CHECK_EQ_U(h, HALT_STOP_INSTR);
    CHECK_EQ_U(m.drum[0102], mec_from_double(0.75));
    CHECK_EQ_U(m.oprit, 1);
}

TEST(test_pair_order) {
    /* U se execută înaintea lui ME: la 0101 ajunge valoarea de la 0100 */
    load("@prov GHICIT test\n"
         "0000  U 0100  ME 0101\n"
         "0001  O 0000  O 0000\n"
         "0100 = 0,5\n", mec_variants_default());
    mec_run(&m, 100);
    CHECK_EQ_U(m.drum[0101], mec_from_double(0.5));
}

/* Variantele „ca în tabelul Geier” (14 = TPO sare pe s ≥ 0). */
static mec_variants_t table_v(void) {
    mec_variants_t v = mec_variants_default();
    v.branch14_on_negative = 0;
    return v;
}

static int branch_taken(int op, double s) {
    char src[256];
    snprintf(src, sizeof src,
             "@prov GHICIT test\n"
             "0000  U 0100  %s 0003\n"
             "0001  O 0001  O 0001\n"
             "0003  O 0003  O 0003\n"
             "0100 = %s%s\n", op == 14 ? "TPO" : op == 15 ? "TN" : "TO",
             s < 0 ? "-" : "", s == 0.5 || s == -0.5 ? "0,5" : "0");
    load(src, table_v());
    mec_run(&m, 100);
    return m.RAI == 03;
}

TEST(test_branches) {
    CHECK(branch_taken(14, 0.5));  CHECK(!branch_taken(14, -0.5));
    CHECK(!branch_taken(15, 0.5)); CHECK(branch_taken(15, -0.5));
    CHECK(branch_taken(16, 0.5));  CHECK(branch_taken(16, -0.5));
    CHECK(!branch_taken(16, 0.0));
}

TEST(test_default_code14_jumps_on_negative) {
    /* Oracolul INEX-1: implicit, codul 14 (octal 16) sare pe s < 0, codul 15 (octal 17) pe s ≥ 0. */
    mec_variants_t v = mec_variants_default();
    char src[256];
    snprintf(src, sizeof src, "@prov GHICIT test\n0000  U 0100  16 0003\n0001  O 0001  O 0001\n"
             "0003  O 0003  O 0003\n0100 = -0,5\n");
    load(src, v); mec_run(&m, 100); CHECK_EQ_U(m.RAI, 03);
    snprintf(src, sizeof src, "@prov GHICIT test\n0000  U 0100  17 0003\n0001  O 0001  O 0001\n"
             "0003  O 0003  O 0003\n0100 = 0,5\n");
    load(src, v); mec_run(&m, 100); CHECK_EQ_U(m.RAI, 03);
}

TEST(test_minus_zero_branches) {
    load("@prov GHICIT test\n"
         "0000  U 0100  SC 0100\n"        /* S = x − x = −0 în complement față de unu */
         "0001  TO 0005  TN 0005\n"
         "0002  TPO 0004  O 0002\n"
         "0004  O 0004  O 0004\n"
         "0005  O 0005  O 0005\n"
         "0100 = 0,3\n", table_v());
    mec_run(&m, 100);
    CHECK_EQ_U(m.RAI, 04);
}

TEST(test_self_modifying_fetch) {
    /* MS 0002 adună 1 la adresa 1 a cuvântului 0002: U 0100 devine U 0101 */
    load("@prov GHICIT test\n"
         "0000  U 0110  MS 0002\n"
         "0001  CU  CU\n"
         "0002  U 0100  ME 0102\n"
         "0003  O 0000  O 0000\n"
         "0100 = 0,25\n"
         "0101 = 0,5\n"
         "0110 = 00 0001 00 0000\n", mec_variants_default());
    mec_run(&m, 100);
    CHECK_EQ_U(m.drum[0102], mec_from_double(0.5));
}

TEST(test_unknown_opcode_halts) {
    load("@prov GHICIT test\n0000  35 0000  O 0000\n", mec_variants_default());
    CHECK_EQ_U(mec_run(&m, 10), HALT_UNKNOWN_OPCODE);
    CHECK_EQ_U(m.oprit, 1);
    CHECK_EQ_U(m.unknown_code, 035);
}

TEST(test_rai_wraps) {
    load("@prov GHICIT test\n1777  CU  CU\n0000  O 0000  O 0000\n", mec_variants_default());
    m.RAI = 01777;
    mec_run(&m, 10);
    CHECK_EQ_U(m.RAI, 0);
}

static const char *OVF =
    "@prov GHICIT test\n"
    "0000  U 0100  A 0101\n"
    "0001  O 0001  O 0001\n"
    "0100 = 0,75\n"
    "0101 = 0,5\n";

TEST(test_overflow_stop) {
    load(OVF, mec_variants_default());
    m.stop_on_dcr = 1;
    CHECK_EQ_U(mec_run(&m, 10), HALT_DCR);
    CHECK_EQ_U(m.dcr, 1);
}

TEST(test_overflow_no_stop_continues) {
    load(OVF, mec_variants_default());
    m.stop_on_dcr = 0;
    CHECK_EQ_U(mec_run(&m, 10), HALT_STOP_INSTR);
    CHECK_EQ_U(m.dcr, 1);
    CHECK_EQ_U(m.RAI, 01);
}

/* Program tipic: însumarea unui tabel de 20 de numere, cu adresa mărită prin MS
   (stilul programelor MECIPT-1). 9 instrucțiuni pe iterație (TO sare peste O),
   plus O la final: 181 de instrucțiuni. */
static double speed(int interleave) {
    char src[4096]; size_t n = 0;
    n += (size_t)snprintf(src + n, sizeof src - n,
        "@prov GHICIT test\n"
        "0000  U 0100  A 0200\n"
        "0001  ME 0100  U 0101\n"
        "0002  MS 0000  U 0102\n"
        "0003  SC 0103  ME 0102\n"
        "0004  TO 0000  O 0004\n"
        "0100 = 0\n"
        "0101 = 00 0000 00 0001\n"
        "0102 = o00000000024\n"
        "0103 = o00000000001\n");
    for (int k = 0; k < 20; k++)
        n += (size_t)snprintf(src + n, sizeof src - n, "%04o = 0,01\n", 0200 + k);
    mec_variants_t v = mec_variants_default();
    v.interleave_even_odd = interleave;
    load(src, v);
    uint64_t steps = 0;
    while (mec_step(&m) == RUN_OK) steps++;
    CHECK_EQ_U(steps, 180);   /* a 181-a instrucțiune e O */
    CHECK(mec_to_double(m.drum[0100]) > 0.199 && mec_to_double(m.drum[0100]) < 0.201);
    return 181.0 / mec_seconds(&m);
}

TEST(test_speed_real_time) {
    double s0 = speed(0), s1 = speed(1);
    printf("  viteză: %.1f instr/s simplu, %.1f instr/s intercalat\n", s0, s1);
    CHECK(s0 >= 45 && s0 <= 60);    /* sursele: 50 instr/s */
    CHECK(s1 >= 1.15 * s0);         /* sursele: 70–80 cu intercalare, pentru programe așezate anume */
}

TEST(test_program_writes_are_marked) {
    load("@prov GHICIT test\n0000  U 0100  ME 0101\n0001  O 0001  O 0001\n0100 = 0,5\n", mec_variants_default());
    mec_run(&m, 100);
    CHECK_EQ_U(m.written[0101], 1);
    CHECK_EQ_U(m.written[0100], 0);
    CHECK_EQ_U(m.prov[0101], PROV_NONE);
}

TEST(test_visitor_tape_marks_modified) {
    load("@prov GHICIT test\n0000  U 0100  ME 0101\n0001  O 0001  O 0001\n0100 = 0,5\n", mec_variants_default());
    m.visitor_tape = 1;
    mec_run(&m, 100);
    CHECK_EQ_U(m.prov[0101], PROV_MODIFICAT);
}

TEST(test_load_clears_written) {
    load("@prov GHICIT test\n0000  U 0100  ME 0101\n0001  O 0001  O 0001\n0100 = 0,5\n", mec_variants_default());
    mec_run(&m, 100);
    mec_load_image(&m, &img);
    CHECK_EQ_U(m.written[0101], 0);
}

RUN_ALL()
