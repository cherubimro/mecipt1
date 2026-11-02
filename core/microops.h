// SPDX-License-Identifier: AGPL-3.0-or-later
// Microoperațiile inscripționate pe panoul stâng al pupitrului (grila ⎍ 16×3 și grila ⊔ 3×3),
// transcrise din surse/3d/inscriptii-pupitru.md. Fiecare are un bec pe pupitru.
#ifndef MECIPT_MICROOPS_H
#define MECIPT_MICROOPS_H
#include <stdint.h>

typedef struct { int grid; int row; int col; const char *label_ro; } mec_uop_info; /* grid 0 = ⎍, 1 = ⊔; row/col de la 1 */
extern const mec_uop_info MEC_UOPS[];
extern const int MEC_NUOPS;                       /* 39 */

#define MEC_TRACE_MAX 4096
typedef struct mec_uop_trace { int ids[MEC_TRACE_MAX]; uint8_t r1[MEC_TRACE_MAX], r2[MEC_TRACE_MAX]; int n; } mec_uop_trace;

int mec_uop_id(int grid, int row, int col);       /* −1 dacă celula n-are inscripție */

/* Secvența de microoperații pentru fiecare cod (0–28); −1 = sfârșit. DEDUS din grila panoului. */
extern const signed char MEC_UOP_SEQ[29][24];

/* Identificatori folosiți de mașină (pozițiile de pe panou). */
#define UOP_INSTR2_IN_LOC1  20   /* ⎍ r2 c5 „Instrucția 2 trece în locul 1” */
#define UOP_MUTA_RAI        14   /* ⎍ r1 c15 „Mută RAI” */
#define UOP_RA_TO_RAI       15   /* ⎍ r1 c16 „2(ra) trece în RAI” */

#endif
