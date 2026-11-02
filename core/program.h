// SPDX-License-Identifier: AGPL-3.0-or-later
// Formatul text .mec și imaginea de tambur, cu proveniență pe fiecare cuvânt.
#ifndef MECIPT_PROGRAM_H
#define MECIPT_PROGRAM_H
#include <stddef.h>
#include "word.h"

typedef enum { PROV_NONE = 0, PROV_ORIGINAL, PROV_DEDUS, PROV_RECONSTRUCTIE, PROV_GHICIT } mec_prov;

typedef struct {
    mword word[1024];
    mec_prov prov[1024];
    unsigned short src[1024];        /* index în sources[] */
    char sources[32][96];
    int nsources;
    char error[160];
} mec_image;

/* 0 = succes; altfel img->error conține „linia N: motiv”. */
int mec_program_parse(const char *text, mec_image *img);
/* Liniile „AAAA  c1 aaaa  c2 aaaa” pentru adresele încărcate din [from, to]. */
int mec_listing(const mec_image *img, int from, int to, char *out, size_t cap);
const char *mec_prov_name(mec_prov p);

#endif
