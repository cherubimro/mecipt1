// SPDX-License-Identifier: AGPL-3.0-or-later
// Romexpo (calcul ilustrativ; cifrele nu sunt cele reale): programul tipărește exact ce calculează referința
// independentă tools/ref/romexpo.py în modelul aritmeticii mașinii.
#include "test.h"
#include "prog_oracle.h"

TEST(test_romexpo_matches_reference) {
    CHECK_EQ_U(po_run("../programs/romexpo.mec", 0400, "data/romexpo.txt", 600), 0);
}

RUN_ALL()
