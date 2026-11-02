// SPDX-License-Identifier: AGPL-3.0-or-later
// mecasm PROGRAM.mec [-o PROGRAM.drum] [--listing DE_LA PÂNĂ_LA]
// .drum = 1024 linii „11 cifre octale  PROVENIENȚĂ  sursă”.
#include "program.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static char *slurp(const char *path) {
    FILE *f = fopen(path, "rb");
    if (!f) return NULL;
    fseek(f, 0, SEEK_END); long n = ftell(f); fseek(f, 0, SEEK_SET);
    char *b = malloc((size_t)n + 1);
    size_t r = fread(b, 1, (size_t)n, f); b[r] = 0; fclose(f);
    return b;
}

int main(int argc, char **argv) {
    const char *in = NULL, *out = NULL; long from = -1, to = -1;
    for (int i = 1; i < argc; i++) {
        if (!strcmp(argv[i], "-o") && i + 1 < argc) out = argv[++i];
        else if (!strcmp(argv[i], "--listing") && i + 2 < argc) {
            from = strtol(argv[++i], NULL, 8); to = strtol(argv[++i], NULL, 8);
        } else in = argv[i];
    }
    if (!in) { fprintf(stderr, "utilizare: mecasm PROGRAM.mec [-o X.drum] [--listing DE_LA PÂNĂ_LA]\n"); return 2; }
    char *t = slurp(in);
    if (!t) { fprintf(stderr, "mecasm: nu pot citi %s\n", in); return 1; }
    static mec_image img;
    if (mec_program_parse(t, &img)) { fprintf(stderr, "mecasm: %s: %s\n", in, img.error); return 1; }
    if (from >= 0) {
        static char buf[1 << 16];
        mec_listing(&img, (int)from, (int)to, buf, sizeof buf);
        fputs(buf, stdout);
    }
    if (out) {
        FILE *f = fopen(out, "w");
        if (!f) { fprintf(stderr, "mecasm: nu pot scrie %s\n", out); return 1; }
        for (int a = 0; a < 1024; a++) {
            char o[12]; mec_fmt_octal(img.word[a], o);
            fprintf(f, "%s  %s  %s\n", o, mec_prov_name(img.prov[a]),
                    img.prov[a] ? img.sources[img.src[a]] : "");
        }
        fclose(f);
    }
    free(t);
    return 0;
}
