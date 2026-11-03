// SPDX-License-Identifier: AGPL-3.0-or-later
// Modelul Python al aritmeticii (tools/ref/mecarith.py) trebuie să dea exact ce dă nucleul.
// Vectorii: tests/data/arith-vectors.txt, generați de tools/ref/gen_vectors.py.
// Linie: „cod a b S I -> S' I' dcr” (cod zecimal, restul octal); b = y pentru operațiile cu memorie, n pentru deplasări.
#include "test.h"
#include "machine.h"
#include "isa.h"

TEST(test_model_matches_core) {
    FILE *f = fopen("data/arith-vectors.txt", "r");
    CHECK(f != NULL); if (!f) return;
    static mecipt m;
    int n = 0, bad = 0, code;
    unsigned a, b, s, i, es, ei, edcr;
    while (fscanf(f, "%d %o %o %o %o -> %o %o %o", &code, &a, &b, &s, &i, &es, &ei, &edcr) == 8) {
        mec_init(&m, mec_variants_default());
        int shift = code >= 17 && code <= 20;
        m.drum[0] = mec_pack((mec_pair){ code, shift ? (int)b : 0100, 0, 0 });
        m.drum[0100] = a;   /* operandul y */
        m.S = s; m.I = i;
        mec_step(&m);
        if (m.S != es || m.I != ei || (unsigned)m.dcr != edcr) {
            if (bad++ < 5) printf("  cod %d y=%011o n=%o S=%011o I=%010o: nucleu %011o %010o %d, model %011o %010o %u\n",
                                  code, a, b, s, i, (unsigned)m.S, (unsigned)m.I, m.dcr, es, ei, edcr);
        }
        n++;
    }
    fclose(f);
    printf("  %d vectori, %d diferențe\n", n, bad);
    CHECK(n >= 2000);
    CHECK_EQ_U(bad, 0);
}

RUN_ALL()
