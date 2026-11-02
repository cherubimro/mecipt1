// SPDX-License-Identifier: AGPL-3.0-or-later
#include "test.h"
#include "microops.h"
#include "machine.h"

static mecipt m;
static mec_image img;
static mec_uop_trace tr;

static void run(const char *src) {
    if (mec_program_parse(src, &img)) printf("  eroare program: %s\n", img.error);
    mec_init(&m, mec_variants_default());
    mec_load_image(&m, &img);
    memset(&tr, 0, sizeof tr);
    m.trace = &tr;
}

static int contains(int id) {
    for (int i = 0; i < tr.n; i++) if (tr.ids[i] == id) return 1;
    return 0;
}

TEST(test_uop_table) {
    CHECK_EQ_U(MEC_NUOPS, 39);
    CHECK(strstr(MEC_UOPS[mec_uop_id(0, 1, 15)].label_ro, "Mută RAI") != NULL);
    CHECK(strstr(MEC_UOPS[mec_uop_id(0, 1, 16)].label_ro, "2(ra) trece în RAI") != NULL);
    CHECK(strstr(MEC_UOPS[mec_uop_id(0, 2, 5)].label_ro, "Instrucția 2 trece în locul 1") != NULL);
    CHECK(strstr(MEC_UOPS[mec_uop_id(1, 1, 1)].label_ro, "Zero trece în M") != NULL);
    CHECK(mec_uop_id(0, 3, 4) == -1);
    CHECK(mec_uop_id(1, 3, 1) == -1);
    for (int i = 0; i < MEC_NUOPS; i++)            /* fiecare intrare se găsește înapoi după poziție */
        CHECK_EQ_U(mec_uop_id(MEC_UOPS[i].grid, MEC_UOPS[i].row, MEC_UOPS[i].col), i);
}

TEST(test_trace_add) {
    run("@prov GHICIT t\n0000  A 0100  O 0000\n0100 = 0,25\n");
    mec_step(&m);
    int k = 0;
    for (int i = 0; MEC_UOP_SEQ[5][i] >= 0; i++, k++) CHECK_EQ_U(tr.ids[i], MEC_UOP_SEQ[5][i]);
    CHECK(k > 0);
    CHECK_EQ_U(tr.ids[k], mec_uop_id(0, 2, 5));    /* apoi „Instrucția 2 trece în locul 1” */
    CHECK(tr.n == k + 1);
}

TEST(test_trace_jump_uses_mut_rai) {
    run("@prov GHICIT t\n0000  T 0005  O 0000\n0005  O 0005  O 0005\n");
    mec_step(&m);
    CHECK(contains(mec_uop_id(0, 1, 16)) || contains(mec_uop_id(0, 1, 15)));
}

TEST(test_trace_word_end_moves_rai) {
    run("@prov GHICIT t\n0000  CU  CU\n0001  O 0001  O 0001\n");
    mec_step(&m); mec_step(&m);
    CHECK(contains(mec_uop_id(0, 1, 15)));          /* „Mută RAI” la sfârșitul cuvântului */
}

TEST(test_trace_records_R1_R2) {
    run("@prov GHICIT t\n0000  A 0100  O 0000\n0100 = 0,25\n");
    mec_step(&m);
    CHECK(tr.n >= 2);
    CHECK_EQ_U(tr.r2[1], tr.r1[0]);                 /* R I trece în R II la impulsul următor */
    CHECK_EQ_U(m.R1, tr.r1[tr.n - 1]);
}

RUN_ALL()
