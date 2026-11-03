// SPDX-License-Identifier: AGPL-3.0-or-later
// Tabelul de sinus din 21.02.1962: programul reconstruit tipărește coala Facsimilului 3, cu o singură diferență
// acceptată de utilizator (sin 32°), și exact ce dă metoda găsită în modelul aritmeticii (tools/ref/sin_search.py).
#include "test.h"
#include "prog_oracle.h"

/* Diferențele acceptate: n, ce scrie în facsimil, ce tipărește emulatorul. Lista e exact cea a diferențelor. */
static const struct { int n; const char *facs, *emu; } ACCEPTED_DIFFS[] = {
    { 32, "o,529919258-", "o,52991926o-" },
};

TEST(test_sinus_matches_facsimile) {
    static char want[4096];
    char *f = po_slurp("data/facsimil3-sinus.txt");
    CHECK(f != NULL); if (!f) return;
    snprintf(want, sizeof want, "%s", f);
    for (unsigned i = 0; i < sizeof ACCEPTED_DIFFS / sizeof *ACCEPTED_DIFFS; i++) {
        int n = ACCEPTED_DIFFS[i].n;
        char *at = want + ((n - 1) / 5) * 61 + ((n - 1) % 5) * 12;     /* 5 numere de 12 caractere + rând nou */
        CHECK(strncmp(at, ACCEPTED_DIFFS[i].facs, 12) == 0);
        CHECK(strcmp(ACCEPTED_DIFFS[i].facs, ACCEPTED_DIFFS[i].emu) != 0);
        memcpy(at, ACCEPTED_DIFFS[i].emu, 12);
    }
    FILE *g = fopen("../build/sinus-asteptat.txt", "w");
    if (g) { fputs(want, g); fclose(g); }
    CHECK_EQ_U(po_run("../programs/sinus-1962.mec", 0400, "../build/sinus-asteptat.txt", 600), 0);
}

TEST(test_sinus_matches_model) {
    CHECK_EQ_U(po_run("../programs/sinus-1962.mec", 0400, "data/sinus-model.txt", 600), 0);
}

TEST(test_sinus_runtime) {
    po_run("../programs/sinus-1962.mec", 0400, "data/sinus-model.txt", 600);
    CHECK(mec_seconds(&po_m) > 1 && mec_seconds(&po_m) < 600);
}

RUN_ALL()
