// SPDX-License-Identifier: AGPL-3.0-or-later
// mecvariants inex — rulează oracolul INEX-1 sub toate combinațiile de variante.
#include "../tests/inex_oracle.h"

int main(int argc, char **argv) {
    if (argc < 2 || strcmp(argv[1], "inex") != 0) { fprintf(stderr, "utilizare: mecvariants inex\n"); return 2; }
    int any = 0;
    for (int sf = 0; sf < 2; sf++)
        for (int po = 0; po < 2; po++)
            for (int br = 0; br < 2; br++) {
                mec_variants_t v = mec_variants_default();
                v.shift_field = sf ? SHIFT_N_IS_32_MINUS_FIELD : SHIFT_N_IS_FIELD;
                v.pair_order = po ? PAIR_FIRST_IS_2 : PAIR_FIRST_IS_1;
                v.branch14_on_negative = br;
                int r = inex_oracle_run(v, 0);
                printf("shift=%s pair=%s cod14=%s → %s\n", sf ? "32-câmp" : "câmp", po ? "2-întâi" : "1-întâi",
                       br ? "salt-pe-negativ" : "salt-pe-pozitiv(tabel)", r == 0 ? "REUȘEȘTE" : "eșuează");
                any |= (r == 0);
            }
    return any ? 0 : 1;
}
