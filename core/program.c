// SPDX-License-Identifier: AGPL-3.0-or-later
#include "program.h"
#include "isa.h"
#include <ctype.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static const char *PROV_NAMES[] = { "NIMIC", "ORIGINAL", "DEDUS", "RECONSTRUCTIE", "GHICIT" };

const char *mec_prov_name(mec_prov p) {
    return (p >= PROV_NONE && p <= PROV_GHICIT) ? PROV_NAMES[p] : "?";
}

static int is_octal_tok(const char *t) {
    if (!*t) return 0;
    for (; *t; t++) if (*t < '0' || *t > '7') return 0;
    return 1;
}

static int is_alpha_tok(const char *t) {
    if (!*t) return 0;
    for (; *t; t++) if (!isalpha((unsigned char)*t)) return 0;
    return 1;
}

#define FAIL(...) do { snprintf(img->error, sizeof img->error, "linia %d: ", lineno); \
    size_t _l = strlen(img->error); snprintf(img->error + _l, sizeof img->error - _l, __VA_ARGS__); \
    return -1; } while (0)

/* Citește o instrucțiune începând de la tok[*i]; întoarce 0 sau un mesaj de eroare. */
static const char *parse_instr(char **tok, int ntok, int *i, int *code, int *addr) {
    if (*i >= ntok) return "lipsește instrucțiunea";
    const char *t = tok[*i];
    int kind_none = 0;
    if (is_alpha_tok(t)) {
        const mec_opinfo *op = mec_op_by_mnemonic(t);
        if (!op) return "mnemonică necunoscută";
        *code = op->code;
        kind_none = (op->kind == ADDR_NONE);
    } else if (is_octal_tok(t)) {
        long c = strtol(t, NULL, 8);
        if (c > 037) return "cod peste 37 (octal)";
        *code = (int)c;
    } else return "cod invalid";
    (*i)++;
    if (*i < ntok && is_octal_tok(tok[*i])) {
        long a = strtol(tok[*i], NULL, 8);
        if (a > 01777) return "adresă peste 1777";
        *addr = (int)a;
        (*i)++;
    } else if (kind_none) {
        *addr = 0;
    } else return "lipsește adresa";
    return NULL;
}

static int parse_data(char **tok, int ntok, mword *w) {
    if (ntok == 4) {
        long v[4];
        for (int k = 0; k < 4; k++) { if (!is_octal_tok(tok[k])) return -1; v[k] = strtol(tok[k], NULL, 8); }
        if (v[0] > 037 || v[2] > 037 || v[1] > 01777 || v[3] > 01777) return -1;
        *w = mec_pack((mec_pair){ (int)v[0], (int)v[1], (int)v[2], (int)v[3] });
        return 0;
    }
    if (ntok != 1) return -1;
    const char *t = tok[0];
    if (t[0] == 'o') return mec_parse_octal(t + 1, w);
    char buf[64]; size_t n = strlen(t);
    if (n >= sizeof buf) return -1;
    memcpy(buf, t, n + 1);
    for (char *p = buf; *p; p++) if (*p == ',') *p = '.';
    char *end; double d = strtod(buf, &end);
    if (*end || d <= -1.0 || d >= 1.0) return -1;
    *w = mec_from_double(d);
    return 0;
}

int mec_program_parse(const char *text, mec_image *img) {
    memset(img, 0, sizeof *img);
    mec_prov cur = PROV_NONE; int cur_src = 0;
    int lineno = 0;
    const char *p = text;
    while (*p) {
        lineno++;
        const char *e = strchr(p, '\n');
        size_t len = e ? (size_t)(e - p) : strlen(p);
        char line[256];
        if (len >= sizeof line) FAIL("linie prea lungă");
        memcpy(line, p, len); line[len] = 0;
        p = e ? e + 1 : p + len;
        char *c = strchr(line, ';'); if (c) *c = 0;

        if (line[0] == '@') {
            char kind[32] = {0}; int off = 0;
            if (sscanf(line, "@prov %31s %n", kind, &off) < 1 || off == 0) FAIL("directivă invalidă");
            mec_prov pv = PROV_NONE;
            for (int k = 1; k <= PROV_GHICIT; k++) if (strcmp(kind, PROV_NAMES[k]) == 0) pv = (mec_prov)k;
            if (pv == PROV_NONE) FAIL("proveniență necunoscută „%s”", kind);
            char *s = line + off; size_t sl = strlen(s);
            while (sl && isspace((unsigned char)s[sl - 1])) s[--sl] = 0;
            int idx = -1;
            for (int k = 0; k < img->nsources; k++) if (strcmp(img->sources[k], s) == 0) idx = k;
            if (idx < 0) {
                if (img->nsources >= 32) FAIL("prea multe surse");
                idx = img->nsources++;
                snprintf(img->sources[idx], sizeof img->sources[idx], "%s", s);
            }
            cur = pv; cur_src = idx;
            continue;
        }

        char *tok[16]; int ntok = 0;
        for (char *t = strtok(line, " \t\r"); t && ntok < 16; t = strtok(NULL, " \t\r")) tok[ntok++] = t;
        if (ntok == 0) continue;
        if (cur == PROV_NONE) FAIL("lipsește @prov înaintea cuvântului");
        if (!is_octal_tok(tok[0])) FAIL("adresă invalidă");
        long a = strtol(tok[0], NULL, 8);
        if (a > 01777) FAIL("adresă peste 1777");
        if (img->prov[a] != PROV_NONE) FAIL("adresa %04lo apare de două ori", a);

        mword w;
        if (ntok >= 2 && strcmp(tok[1], "=") == 0) {
            if (parse_data(tok + 2, ntok - 2, &w)) FAIL("cuvânt de date invalid");
        } else {
            int i = 1, c1, a1, c2, a2;
            const char *err = parse_instr(tok, ntok, &i, &c1, &a1);
            if (!err) err = parse_instr(tok, ntok, &i, &c2, &a2);
            if (err) FAIL("%s", err);
            if (i != ntok) FAIL("text în plus după a doua instrucțiune");
            w = mec_pack((mec_pair){ c1, a1, c2, a2 });
        }
        img->word[a] = w; img->prov[a] = cur; img->src[a] = (unsigned short)cur_src;
    }
    return 0;
}

int mec_listing(const mec_image *img, int from, int to, char *out, size_t cap) {
    size_t n = 0; out[0] = 0;
    for (int a = from; a <= to && a < 1024; a++) {
        if (img->prov[a] == PROV_NONE) continue;
        mec_pair q = mec_unpack(img->word[a]);
        int k = snprintf(out + n, cap - n, "%04o  %02o %04o  %02o %04o\n", a, q.code1, q.addr1, q.code2, q.addr2);
        if (k < 0 || (size_t)k >= cap - n) return -1;
        n += (size_t)k;
    }
    return (int)n;
}
