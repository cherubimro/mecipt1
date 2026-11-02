// SPDX-License-Identifier: AGPL-3.0-or-later
// Oracolul INEX-1, comun testului și uneltei mecvariants.
#ifndef MECIPT_INEX_ORACLE_H
#define MECIPT_INEX_ORACLE_H
#include <stdio.h>
#include <string.h>
#include "console.h"
#include "periph.h"
#include "isa.h"

static const char *INEX_PATHS[] = { "../programs/inex1-preincarcator.mec", "programs/inex1-preincarcator.mec" };

/* 0 = preîncărcătorul a încărcat corect cele 3 cuvinte la 0002–0004 și s-a oprit cu HÂRTIA AGĂȚATĂ. */
static int inex_oracle_run(mec_variants_t v, int verbose) {
    static char buf[8192]; FILE *f = NULL;
    for (unsigned i = 0; i < sizeof INEX_PATHS / sizeof *INEX_PATHS && !f; i++) f = fopen(INEX_PATHS[i], "rb");
    if (!f) { if (verbose) printf("  nu găsesc inex1-preincarcator.mec\n"); return -1; }
    size_t n = fread(buf, 1, sizeof buf - 1, f); buf[n] = 0; fclose(f);
    static mec_image img; static mecipt m; static mec_periph io;
    if (mec_program_parse(buf, &img)) { if (verbose) printf("  %s\n", img.error); return -1; }

    mword words[3] = { mec_from_double(0.5), mec_from_double(0.25) /* fără semn: m0 nu încape pe bandă */,
                       mec_pack((mec_pair){ 05, 01626, 025, 01512 }) };
    uint8_t tape[64];
    int len = mec_tape_encode_words(words, 3, tape, sizeof tape);

    mec_init(&m, v);
    mec_load_image(&m, &img);
    memset(&io, 0, sizeof io);
    io.tape = tape; io.tape_len = (size_t)len;
    m.io = &io;
    mec_c_set_switches_RAI(&m, 010);                       /* „se pornește calculatorul de la 0010” */
    mec_halt h = mec_c_calculeaza(&m, 1, 5000);

    int ok = (h == HALT_TAPE_JAM) && m.hirtie_agatata;
    for (int k = 0; k < 3; k++) ok = ok && (m.drum[02 + k] == words[k]);
    if (verbose && !ok) {
        printf("  oprire=%d hârtie=%d RAI=%04o S=%011o\n", h, m.hirtie_agatata, m.RAI, (unsigned)m.S);
        for (int k = 0; k < 6; k++) printf("  tambur[%04o]=%011o\n", 02 + k, (unsigned)m.drum[02 + k]);
        printf("  așteptat: %011o %011o %011o\n", (unsigned)words[0], (unsigned)words[1], (unsigned)words[2]);
    }
    return ok ? 0 : 1;
}

#endif
