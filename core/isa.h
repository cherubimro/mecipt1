// SPDX-License-Identifier: AGPL-3.0-or-later
// Setul de instrucțiuni MECIPT-1 (A. Geier, 1961) și cuvântul-instrucțiune.
// Câmpuri (Lucrarea de laborator 7, p.1): m0 = 0 · m1–m5 cod 2 · m6–m10 cod 1
//                                          · m11–m20 adresă 2 · m21–m30 adresă 1.
#ifndef MECIPT_ISA_H
#define MECIPT_ISA_H
#include "word.h"
#include "variants.h"

typedef enum { ADDR_Y, ADDR_SHIFT, ADDR_NONE, ADDR_SUB } mec_addr_kind;

typedef struct {
    int code;
    const char *mnemonic;
    mec_addr_kind kind;
    const char *effect_ro;
} mec_opinfo;

const mec_opinfo *mec_op_by_code(int code);           /* NULL pentru 29–31 */
const mec_opinfo *mec_op_by_mnemonic(const char *m);
/* Efectul real al codului sub variantele date (diferă de tabel la 14/15). NULL pentru coduri necunoscute. */
const char *mec_op_effect(int code, const mec_variants_t *v);

typedef struct { int code1, addr1, code2, addr2; } mec_pair;
mec_pair mec_unpack(mword w);
mword    mec_pack(mec_pair p);

/* Subcodurile instrucțiunii AC (26), date zecimal în tabelul Geier. */
enum {
    AC_ICR_START     = 0111,   /* 73: pornește automatul ICR */
    AC_PRINT_LETTERS = 0133,   /* 91: imprimă litere conform s0…s4 */
    AC_ICR_STOP      = 0134,   /* 92: oprește automatul ICR */
    AC_PRINT_DIGITS  = 0136,   /* 94: imprimă cifre conform s0…s3 */
    AC_S_FROM_I      = 0151    /* 105: S ← i */
};

#endif
