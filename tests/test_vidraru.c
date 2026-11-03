// SPDX-License-Identifier: AGPL-3.0-or-later
// Vidraru (calcul ilustrativ; cifrele nu sunt cele reale): programul tipărește exact ce calculează referința
// independentă tools/ref/vidraru.py în modelul aritmeticii mașinii.
#include "test.h"
#include "prog_oracle.h"

TEST(test_vidraru_matches_reference) {
    CHECK_EQ_U(po_run("../programs/vidraru.mec", 0400, "data/vidraru.txt", 600), 0);
}

RUN_ALL()
