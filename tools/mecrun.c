// SPDX-License-Identifier: AGPL-3.0-or-later
// mecrun PROGRAM.mec [--tape FIȘIER.bin | --tape-words FIȘIER.mec] [--start AAAA] [--max N]
//        [--trace] [--variants shift=field|32-field,pair=1|2,interleave=0|1,cod14=neg|poz]
// Ieșirea mașinii de scris pe stdout; motivul opririi pe stderr.
// Cod de ieșire: 0 = oprire normală (O, limită, sfârșitul benzii); 1 = eroare la citire; 2 = utilizare; 3 = DCR / cod necunoscut.
#include "console.h"
#include "periph.h"
#include "microops.h"
#include "isa.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static char *slurp(const char *path, size_t *len) {
    FILE *f = fopen(path, "rb");
    if (!f) return NULL;
    long n = -1;
    if (fseek(f, 0, SEEK_END) == 0) n = ftell(f);
    if (n <= 0 || n > (1L << 24) || fseek(f, 0, SEEK_SET) != 0) { fclose(f); return NULL; }
    char *b = malloc((size_t)n + 1);
    if (!b) { fclose(f); return NULL; }
    size_t r = fread(b, 1, (size_t)n, f); b[r] = 0; fclose(f);
    if (r == 0) { free(b); return NULL; }
    if (len) *len = r;
    return b;
}
static int parse_variants(const char *s, mec_variants_t *v) {
    char buf[256]; snprintf(buf, sizeof buf, "%s", s);
    for (char *t = strtok(buf, ","); t; t = strtok(NULL, ",")) {
        if      (!strcmp(t, "shift=field"))    v->shift_field = SHIFT_N_IS_FIELD;
        else if (!strcmp(t, "shift=32-field")) v->shift_field = SHIFT_N_IS_32_MINUS_FIELD;
        else if (!strcmp(t, "pair=1"))         v->pair_order = PAIR_FIRST_IS_1;
        else if (!strcmp(t, "pair=2"))         v->pair_order = PAIR_FIRST_IS_2;
        else if (!strcmp(t, "interleave=0"))   v->interleave_even_odd = 0;
        else if (!strcmp(t, "interleave=1"))   v->interleave_even_odd = 1;
        else if (!strcmp(t, "cod14=neg"))      v->branch14_on_negative = 1;
        else if (!strcmp(t, "cod14=poz"))      v->branch14_on_negative = 0;
        else return -1;
    }
    return 0;
}

static const char *reason(mec_halt h, const mecipt *m) {
    static char buf[64];
    switch (h) {
    case HALT_STOP_INSTR:     return "OPRIRE (instrucțiunea O)";
    case HALT_DCR:            return "DEPĂȘIT CAPACITATEA REGISTRULUI";
    case HALT_TAPE_JAM:       return "HÂRTIA AGĂȚATĂ";
    case HALT_UNKNOWN_OPCODE: snprintf(buf, sizeof buf, "COD NECUNOSCUT %02o", m->unknown_code); return buf;
    case HALT_MANUAL:         return "OPRIRE MANUALĂ";
    default:                  return "LIMITA DE INSTRUCȚIUNI";
    }
}

int main(int argc, char **argv) {
    const char *prog = NULL, *tape_bin = NULL, *tape_words = NULL;
    long start = 0, max = 10000000; int trace = 0;
    mec_variants_t v = mec_variants_default();
    for (int i = 1; i < argc; i++) {
        if      (!strcmp(argv[i], "--tape") && i + 1 < argc)       tape_bin = argv[++i];
        else if (!strcmp(argv[i], "--tape-words") && i + 1 < argc) tape_words = argv[++i];
        else if (!strcmp(argv[i], "--start") && i + 1 < argc)      start = strtol(argv[++i], NULL, 8);
        else if (!strcmp(argv[i], "--max") && i + 1 < argc)        max = strtol(argv[++i], NULL, 10);
        else if (!strcmp(argv[i], "--trace"))                      trace = 1;
        else if (!strcmp(argv[i], "--variants") && i + 1 < argc) {
            if (parse_variants(argv[++i], &v)) { fprintf(stderr, "mecrun: variantă necunoscută\n"); return 2; }
        } else if (argv[i][0] != '-') prog = argv[i];
        else { fprintf(stderr, "mecrun: opțiune necunoscută %s\n", argv[i]); return 2; }
    }
    if (!prog) {
        fprintf(stderr, "utilizare: mecrun PROGRAM.mec [--tape X.bin | --tape-words X.mec] [--start AAAA] "
                        "[--max N] [--trace] [--variants ...]\n");
        return 2;
    }
    static mec_image img, timg; static mecipt m; static mec_periph io; static mec_uop_trace tr;
    char *src = slurp(prog, NULL);
    if (!src) { fprintf(stderr, "mecrun: nu pot citi %s (lipsă, gol sau nu e un fișier)\n", prog); return 1; }
    if (mec_program_parse(src, &img)) { fprintf(stderr, "mecrun: %s: %s\n", prog, img.error); return 1; }

    static uint8_t tape[65536]; size_t tlen = 0;
    if (tape_bin) {
        char *b = slurp(tape_bin, &tlen);
        if (!b || tlen > sizeof tape) { fprintf(stderr, "mecrun: bandă invalidă %s\n", tape_bin); return 1; }
        memcpy(tape, b, tlen); free(b);
    } else if (tape_words) {
        char *t = slurp(tape_words, NULL);
        if (!t || mec_program_parse(t, &timg)) { fprintf(stderr, "mecrun: %s: %s\n", tape_words, t ? timg.error : "nu pot citi"); return 1; }
        static mword words[1024]; int n = 0;
        for (int a = 0; a < 1024; a++) if (timg.prov[a] != PROV_NONE) words[n++] = timg.word[a];
        tlen = (size_t)mec_tape_encode_words(words, n, tape, sizeof tape);
        free(t);
    }

    mec_init(&m, v);
    mec_load_image(&m, &img);
    io.tape = tape; io.tape_len = tlen;
    m.io = &io;
    mec_c_set_switches_RAI(&m, (int)start);

    mec_halt h = RUN_OK; long done = 0; size_t printed = 0;
    for (; done < max; done++) {
        uint16_t rai = m.RAI; int phase = m.phase;
        if (trace) { tr.n = 0; m.trace = &tr; }
        h = mec_step(&m);
        if (trace) {
            int code = m.RI >> 10, y = m.RI & 01777;
            fprintf(stderr, "%04o %d %02o %04o S=%011o I=%010o", rai, phase, code, y, (unsigned)m.S, (unsigned)m.I);
            for (int k = 0; k < tr.n; k++) fprintf(stderr, " [%s]", MEC_UOPS[tr.ids[k]].label_ro);
            fputc('\n', stderr);
        }
        if (io.typed_len > printed) { fwrite(io.typed + printed, 1, io.typed_len - printed, stdout); printed = io.typed_len; }
        if (h != RUN_OK) { done++; break; }
    }
    fflush(stdout);
    double s = mec_seconds(&m);
    fprintf(stderr, "oprit: %s RAI=%04o S=%011o timp=%.1f s (%.1f instr/s)\n",
            reason(h, &m), m.RAI, (unsigned)m.S, s, s > 0 ? (double)done / s : 0.0);
    free(src);
    /* 0 = oprire normală (O, limită, sfârșitul benzii); 3 = depășire sau cod necunoscut */
    return (h == HALT_DCR || h == HALT_UNKNOWN_OPCODE) ? 3 : 0;
}
