// SPDX-License-Identifier: AGPL-3.0-or-later
#include "isa.h"
#include <string.h>

/* Tabelul din A. Geier, „Programarea calculatorului electronic cifric MECIPT I
   în regimul virgulă mobilă”, Buletinul IPT, 1961 (via Wikipedia RO „MECIPT”). */
static const mec_opinfo OPS[29] = {
    {  0, "O",    ADDR_Y,     "Oprire. La repornire reluare de la y" },
    {  1, "U",    ADDR_Y,     "S ← y" },
    {  2, "UN",   ADDR_Y,     "S ← –y" },
    {  3, "UM",   ADDR_Y,     "S ← |y|" },
    {  4, "UMN",  ADDR_Y,     "S ← –|y|" },
    {  5, "A",    ADDR_Y,     "S ← s + y" },
    {  6, "SC",   ADDR_Y,     "S ← s – y" },
    {  7, "AM",   ADDR_Y,     "S ← s + |y|" },
    {  8, "SCM",  ADDR_Y,     "S ← s – |y|" },
    {  9, "IN",   ADDR_Y,     "S & I ← s × y" },
    { 10, "INR",  ADDR_Y,     "S ← s × y, rotunjit" },
    { 11, "D",    ADDR_Y,     "I ← s : y, S ← rest" },
    { 12, "MS",   ADDR_Y,     "Y ← s + y" },
    { 13, "T",    ADDR_Y,     "salt (transfer) la y" },
    { 14, "TPO",  ADDR_Y,     "salt la y dacă s ≥ 0" },
    { 15, "TN",   ADDR_Y,     "salt la y dacă s < 0" },
    { 16, "TO",   ADDR_Y,     "salt la y dacă s ≠ 0" },
    { 17, "DLS",  ADDR_SHIFT, "deplasare logică stânga S & I cu „n” poziții" },
    { 18, "DLD",  ADDR_SHIFT, "deplasare logică dreapta S & I cu „n” poziții" },
    { 19, "DS",   ADDR_SHIFT, "deplasare logică stânga S cu „n” poziții" },
    { 20, "DD",   ADDR_SHIFT, "deplasare logică dreapta S cu „n” poziții" },
    { 21, "ME",   ADDR_Y,     "memorare s la y" },
    { 22, "ISME", ADDR_Y,     "memorare i la y" },
    { 23, "UI",   ADDR_Y,     "I ← y" },
    { 24, "CU",   ADDR_NONE,  "comanda următoare (NOP)" },
    { 25, "IL",   ADDR_Y,     "S ← s ∙ y (produs logic)" },
    { 26, "AC",   ADDR_SUB,   "comandă periferice (subcod în câmpul de adresă)" },
    { 27, "CIT",  ADDR_Y,     "citește un caracter de pe bandă și memorează aliniat la dreapta la y" },
    { 28, "TICR", ADDR_Y,     "transfer y la ICR" },
};

const mec_opinfo *mec_op_by_code(int code) {
    return (code >= 0 && code <= 28) ? &OPS[code] : NULL;
}

const mec_opinfo *mec_op_by_mnemonic(const char *m) {
    for (int i = 0; i < 29; i++)
        if (strcmp(OPS[i].mnemonic, m) == 0) return &OPS[i];
    return NULL;
}

mec_pair mec_unpack(mword w) {
    mec_pair p;
    p.code2 = (int)((w >> 25) & 037);
    p.code1 = (int)((w >> 20) & 037);
    p.addr2 = (int)((w >> 10) & 01777);
    p.addr1 = (int)(w & 01777);
    return p;
}

mword mec_pack(mec_pair p) {
    return ((mword)(p.code2 & 037) << 25) | ((mword)(p.code1 & 037) << 20) |
           ((mword)(p.addr2 & 01777) << 10) | (mword)(p.addr1 & 01777);
}

mec_variants_t mec_variants_default(void) {
    mec_variants_t v;
    v.shift_field = SHIFT_N_IS_FIELD;          /* DEDUS: oracolul INEX-1 (docs/semantica.md) */
    v.pair_order = PAIR_FIRST_IS_1;
    v.interleave_even_odd = 1;
    v.exec_ticks = 3;
    v.branch14_on_negative = 1;                /* DEDUS: oracolul INEX-1 */
    return v;
}
