// SPDX-License-Identifier: AGPL-3.0-or-later
#include "test.h"
#include "console.h"
#include "isa.h"
#include <stdlib.h>

static mecipt m;
static mec_image img;

TEST(test_key_in_word) {
    mec_init(&m, mec_variants_default());
    mword w = mec_pack((mec_pair){ 027, 0, 02, 01 });
    mec_c_set_switches_M(&m, w);
    mec_c_set_switches_RAI(&m, 010);
    mec_c_memorie_scriere(&m);
    CHECK_EQ_U(m.drum[010], w);
    mec_c_anuleaza_M(&m);
    mec_c_memorie_citire(&m);
    CHECK_EQ_U(m.M, w);
}

TEST(test_key_in_inex_preloader) {
    FILE *f = fopen("../programs/inex1-preincarcator.mec", "rb");
    CHECK(f != NULL); if (!f) return;
    static char buf[8192]; size_t n = fread(buf, 1, sizeof buf - 1, f); buf[n] = 0; fclose(f);
    CHECK_EQ_U(mec_program_parse(buf, &img), 0);
    mec_init(&m, mec_variants_default());
    for (int a = 0; a < 1024; a++) {            /* operatorul tastează fiecare cuvânt la comutatoare */
        if (img.prov[a] == PROV_NONE) continue;
        mec_c_set_switches_RAI(&m, a);
        mec_c_set_switches_M(&m, img.word[a]);
        mec_c_memorie_scriere(&m);
    }
    for (int a = 0; a < 1024; a++)
        if (img.prov[a] != PROV_NONE) CHECK_EQ_U(m.drum[a], img.word[a]);
}

TEST(test_instructie_unica) {
    mec_program_parse("@prov GHICIT t\n0000  U 0100  A 0100\n0001  O 0001  O 0001\n0100 = 0,25\n", &img);
    mec_init(&m, mec_variants_default());
    mec_load_image(&m, &img);
    CHECK_EQ_U(mec_c_calculeaza(&m, 0, 100), RUN_OK);
    CHECK_EQ_U(m.S, mec_from_double(0.25));         /* doar U s-a executat */
    CHECK_EQ_U(m.phase, 2);
    CHECK_EQ_U(mec_c_calculeaza(&m, 1, 100), HALT_STOP_INSTR);
    CHECK_EQ_U(m.S, mec_from_double(0.5));
}

TEST(test_anuleaza) {
    mec_init(&m, mec_variants_default());
    m.RAI = 0123; m.M = 5; m.S = 7;
    mec_c_anuleaza_RAI(&m); CHECK_EQ_U(m.RAI, 0);
    mec_c_anuleaza_M(&m);   CHECK_EQ_U(m.M, 0);
    mec_c_anuleaza_S(&m);   CHECK_EQ_U(m.S, 0);
}

TEST(test_introduce) {
    mec_init(&m, mec_variants_default());
    m.M = mec_from_double(0.5);
    mec_c_introduce_M_in_I(&m);
    CHECK_EQ_U(m.I, mec_from_double(0.5));
    m.M = mec_pack((mec_pair){ 05, 0100, 025, 0101 });
    mec_c_introduce_M_in_RI(&m);
    CHECK_EQ_U(m.RI, (05 << 10) | 0100);            /* instrucțiunea 1 din M */
    /* „INTRODUCE 7 CATEG. DIN RA ÎN R I”: 7 biți din RA în registrul de microinstrucțiuni R I */
    m.RA = 0321;
    mec_c_introduce_RA_in_RI(&m);
    CHECK_EQ_U(m.R1, 0321 & 0177);
}

TEST(test_select_instr_and_dcr_switch) {
    mec_init(&m, mec_variants_default());
    mec_c_select_instr(&m, 2);
    CHECK_EQ_U(m.phase, 2);
    mec_c_depasire(&m, 0);
    CHECK_EQ_U(m.stop_on_dcr, 0);
}

RUN_ALL()
