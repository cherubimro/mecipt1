// SPDX-License-Identifier: AGPL-3.0-or-later
#include "microops.h"

/* Textele exact ca pe panou; „S.”/„M.”/„I.” = indice ilizibil (probabil bitul de semn). [?] = citire nesigură. */
const mec_uop_info MEC_UOPS[] = {
    /* grila ⎍, rândul 1 (id 0–15) */
    {0,1, 1,"s trece în M [?]"}, {0,1, 2,"s trece în I"}, {0,1, 3,"i trece în S"},
    {0,1, 4,"Înmulțire logică"},
    {0,1, 5,"Deplasare: Stânga în S · I. trece în S."}, {0,1, 6,"Deplasare: Dreapta în S · Zero trece în S."},
    {0,1, 7,"Deplasare: Stânga în I · Zero trece în I."}, {0,1, 8,"Deplasare: Dreapta în I · S. trece în I."},
    {0,1, 9,"Schimbă M."}, {0,1,10,"Dacă M. = 1 schimbă M în M̄"}, {0,1,11,"Schimbă M în M̄ afară de M. [?]"},
    {0,1,12,"Dacă S. = 1 schimbă S în S̄"}, {0,1,13,"Dacă α = 1 schimbă S în S̄"},
    {0,1,14,"Dacă β = 1 schimbă S în S̄"}, {0,1,15,"Mută RAI"}, {0,1,16,"2(ra) trece în RAI"},
    /* grila ⎍, rândul 2 (id 16–31) */
    {0,2, 1,"(ra)/2 trece în RA"}, {0,2, 2,"Pune numărătorul pe 2 și N = 0 [?]"}, {0,2, 3,"Mută numărătorul"},
    {0,2, 4,"(ra) trece în numărător N"}, {0,2, 5,"Instrucția 2 trece în locul 1"}, {0,2, 6,"ra trece în RI"},
    {0,2, 7,"S. trece în α"}, {0,2, 8,"Dacă S. = M., β = 0 · Dacă S. ≠ M., β = 1"},
    {0,2, 9,"Dacă s = 0 și i = 0 pune β = 0 [?]"}, {0,2,10,"Dacă i = 0 pune β = 0 [?]"},
    {0,2,11,"Dacă s = 0 pune α = 0"}, {0,2,12,"Dacă s = 0 și i = 0 pune S. = 1 [?]"},
    {0,2,13,"Dacă s = 0 pune I. = 1"}, {0,2,14,"S̄. trece în I."}, {0,2,15,"β trece în I."},
    {0,2,16,"S. trece în S."},
    /* grila ⎍, rândul 3 (id 32–34) */
    {0,3, 1,"Dacă β = 0 și S. ≠ α [?], DCR"}, {0,3, 2,"Dacă I. = 1 [?], DCR"}, {0,3, 3,"Dacă S. ≠ S. [?], DCR"},
    /* grila ⊔ (id 35–38) */
    {1,1, 1,"Zero trece în M."}, {1,1, 2,"Unu trece în M."}, {1,1, 3,"Zero trece în γ"}, {1,2, 1,"Unu trece în γ"},
};
const int MEC_NUOPS = (int)(sizeof MEC_UOPS / sizeof MEC_UOPS[0]);

int mec_uop_id(int grid, int row, int col) {
    for (int i = 0; i < MEC_NUOPS; i++)
        if (MEC_UOPS[i].grid == grid && MEC_UOPS[i].row == row && MEC_UOPS[i].col == col) return i;
    return -1;
}

/* DEDUS: compuse din microoperațiile panoului. Adunarea era cablată (fără bec propriu).
   16 = „(ra)/2 trece în RA” (adresa operandului), 5 = Dreapta în S · Zero în S (golește S),
   8 = Schimbă M (negare), 9 = Dacă M.=1 schimbă M (modul), 0 = s trece în M (memorare),
   4/5/6/7 = deplasări, 17/18/19 = numărătorul de pași, 22/11/12/13/23 = semne. */
#define E -1
const signed char MEC_UOP_SEQ[29][24] = {
    /*  0 O    */ {E},          /* „2(ra) trece în RAI” se emite din jump(), doar la salt efectiv */
    /*  1 U    */ {16, 5, E},
    /*  2 UN   */ {16, 5, 8, E},
    /*  3 UM   */ {16, 5, 9, E},
    /*  4 UMN  */ {16, 5, 9, 8, E},
    /*  5 A    */ {16, E},
    /*  6 SC   */ {16, 8, E},
    /*  7 AM   */ {16, 9, E},
    /*  8 SCM  */ {16, 9, 8, E},
    /*  9 IN   */ {16, 22, 11, 9, 17, 19, 7, 5, 18, 12, E},
    /* 10 INR  */ {16, 22, 11, 9, 17, 19, 7, 5, 18, 12, E},
    /* 11 D    */ {16, 22, 11, 9, 17, 19, 4, 6, 18, 23, 13, E},
    /* 12 MS   */ {16, 0, E},
    /* 13 T    */ {E},
    /* 14 TPO  */ {E},
    /* 15 TN   */ {E},
    /* 16 TO   */ {E},
    /* 17 DLS  */ {19, 4, 6, 18, E},
    /* 18 DLD  */ {19, 7, 5, 18, E},
    /* 19 DS   */ {19, 4, 18, E},
    /* 20 DD   */ {19, 5, 18, E},
    /* 21 ME   */ {16, 0, E},
    /* 22 ISME */ {16, E},
    /* 23 UI   */ {16, 1, E},
    /* 24 CU   */ {E},
    /* 25 IL   */ {16, 3, E},
    /* 26 AC   */ {E},
    /* 27 CIT  */ {16, E},
    /* 28 TICR */ {16, E},
};
