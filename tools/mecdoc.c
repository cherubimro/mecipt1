// SPDX-License-Identifier: AGPL-3.0-or-later
// mecdoc — tabelele nucleului pentru documentația web (web/data/core-tables.json), pe stdout:
// instrucțiunile (Geier 1961), subcodurile AC, microoperațiile panoului stâng, glifele mașinii de scris.
#include "isa.h"
#include "microops.h"
#include "periph.h"
#include <stdio.h>

static void str(const char *s) {
    putchar('"');
    for (const unsigned char *p = (const unsigned char *)s; *p; p++) {
        if (*p == '"' || *p == '\\') printf("\\%c", *p);
        else if (*p == '\n') fputs("\\n", stdout);
        else if (*p < 0x20) printf("\\u%04x", *p);
        else putchar(*p);
    }
    putchar('"');
}

int main(void) {
    static const char *const KIND[] = { "y", "shift", "none", "sub" };
    static const struct { int sub; const char *effect_ro; } AC[] = {
        { AC_ICR_START,     "pornește automatul ICR" },
        { AC_PRINT_LETTERS, "imprimă litere conform s0…s4" },
        { AC_ICR_STOP,      "oprește automatul ICR" },
        { AC_PRINT_DIGITS,  "imprimă cifre conform s0…s3" },
        { AC_S_FROM_I,      "S ← i" },
    };
    printf("{\n  \"generated_by\": \"mecdoc\",\n  \"ops\": [\n");
    for (int c = 0; c <= 28; c++) {
        const mec_opinfo *o = mec_op_by_code(c);
        printf("    {\"code\": %d, \"mnemonic\": ", o->code); str(o->mnemonic);
        printf(", \"addr\": \"%s\", \"effect_ro\": ", KIND[o->kind]); str(o->effect_ro);
        printf("}%s\n", c < 28 ? "," : "");
    }
    printf("  ],\n  \"ac\": [\n");
    int nac = (int)(sizeof AC / sizeof AC[0]);
    for (int i = 0; i < nac; i++) {
        printf("    {\"sub\": \"%04o\", \"effect_ro\": ", AC[i].sub); str(AC[i].effect_ro);
        printf("}%s\n", i < nac - 1 ? "," : "");
    }
    printf("  ],\n  \"uops\": [\n");
    for (int i = 0; i < MEC_NUOPS; i++) {
        const mec_uop_info *u = &MEC_UOPS[i];
        printf("    {\"id\": %d, \"grid\": %d, \"row\": %d, \"col\": %d, \"label_ro\": ", i, u->grid, u->row, u->col);
        str(u->label_ro);
        printf("}%s\n", i < MEC_NUOPS - 1 ? "," : "");
    }
    printf("  ],\n  \"digits\": [");
    for (int i = 0; i < 16; i++) { if (i) fputs(", ", stdout); str(MEC_DIGIT_GLYPHS[i]); }
    printf("],\n  \"letters\": [");
    for (int i = 0; i < 32; i++) { if (i) fputs(", ", stdout); str(MEC_LETTER_GLYPHS[i]); }
    printf("]\n}\n");
    return 0;
}
