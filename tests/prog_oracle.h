// SPDX-License-Identifier: AGPL-3.0-or-later
// Rulează un program din programs/ de la `start` până la O și compară coala cu un fișier de referință.
#ifndef MECIPT_PROG_ORACLE_H
#define MECIPT_PROG_ORACLE_H
#include <stdio.h>
#include <string.h>
#include "console.h"
#include "periph.h"

static mecipt po_m; static mec_periph po_io;

static char *po_slurp(const char *path) {
    static char bufs[2][65536]; static int k;
    char *buf = bufs[k++ & 1];
    FILE *f = fopen(path, "rb");
    if (!f) { printf("  nu găsesc %s\n", path); return NULL; }
    size_t n = fread(buf, 1, sizeof bufs[0] - 1, f); buf[n] = 0; fclose(f);
    return buf;
}

/* 0 = coala identică cu referința, oprire cu O, timp simulat sub max_s; altfel tipărește diferența. */
static int po_run(const char *program, int start, const char *expected, double max_s) {
    static mec_image img;
    char *t = po_slurp(program);
    if (!t) return -1;
    if (mec_program_parse(t, &img)) { printf("  %s: %s\n", program, img.error); return -1; }
    char *want = po_slurp(expected);
    if (!want) return -1;
    mec_init(&po_m, mec_variants_default());
    mec_load_image(&po_m, &img);
    memset(&po_io, 0, sizeof po_io);
    po_m.io = &po_io;
    mec_c_set_switches_RAI(&po_m, start);
    mec_halt h = mec_c_calculeaza(&po_m, 1, 5000000);
    printf("  timp simulat: %.1f s\n", mec_seconds(&po_m));
    int bad = 0;
    if (h != HALT_STOP_INSTR) { printf("  oprire %d la RAI=%04o\n", h, po_m.RAI); bad = 1; }
    if (strcmp(po_io.typed, want) != 0) {
        size_t i = 0; while (po_io.typed[i] && po_io.typed[i] == want[i]) i++;
        printf("  diferă de la caracterul %zu:\n  tipărit:  %.120s\n  așteptat: %.120s\n", i, po_io.typed + (i > 20 ? i - 20 : 0),
               want + (i > 20 ? i - 20 : 0));
        bad = 1;
    }
    if (mec_seconds(&po_m) >= max_s) { printf("  prea lent\n"); bad = 1; }
    return bad;
}

#endif
