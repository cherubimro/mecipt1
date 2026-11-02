// SPDX-License-Identifier: AGPL-3.0-or-later
// Oracolul retipăririi: programul ORIGINAL din 6.09.1962 (Facsimil 4), pornit de la 1477,
// trebuie să-și tipărească propriul listing exact cum apare în facsimil.
#include "test.h"
#include "console.h"
#include "periph.h"

static char *slurp(const char *path) {
    static char buf[16384];
    FILE *f = fopen(path, "rb");
    if (!f) return NULL;
    size_t n = fread(buf, 1, sizeof buf - 1, f); buf[n] = 0; fclose(f);
    return buf;
}

TEST(test_retiparire_reproduces_facsimile) {
    static mec_image img; static mecipt m; static mec_periph io;
    char *t = slurp("../programs/retiparire-1962.mec");
    CHECK(t != NULL); if (!t) return;
    int rc = mec_program_parse(t, &img);
    if (rc) printf("  %s\n", img.error);
    CHECK_EQ_U(rc, 0);

    /* textul așteptat = listingul facsimilului, generat din transcriere */
    static char expected[8192];
    mec_listing(&img, 01477, 01545, expected, sizeof expected);

    mec_init(&m, mec_variants_default());
    mec_load_image(&m, &img);
    memset(&io, 0, sizeof io);
    m.io = &io;
    mec_c_set_switches_RAI(&m, 01477);
    mec_halt h = mec_c_calculeaza(&m, 1, 200000);
    CHECK_EQ_U(h, HALT_STOP_INSTR);
    if (strcmp(io.typed, expected) != 0) {
        printf("  tipărit:\n%.400s\n  așteptat:\n%.400s\n", io.typed, expected);
        CHECK(0);
    }
    printf("  timp de tipărire simulat: %.1f s\n", mec_seconds(&m));
}

RUN_ALL()
