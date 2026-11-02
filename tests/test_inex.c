// SPDX-License-Identifier: AGPL-3.0-or-later
// Oracolul INEX-1: preîncărcătorul ORIGINAL (Facsimil 5) trebuie să încarce o bandă
// de program la adrese consecutive începând cu 0002 și să se oprească la sfârșitul benzii.
#include "test.h"
#include "console.h"
#include "periph.h"
#include "isa.h"
#include "inex_oracle.h"

TEST(test_inex_loads_tape) {
    mec_variants_t v = mec_variants_default();
    int r = inex_oracle_run(v, 1);
    CHECK_EQ_U(r, 0);
}

RUN_ALL()
