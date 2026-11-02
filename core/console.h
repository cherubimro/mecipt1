// SPDX-License-Identifier: AGPL-3.0-or-later
// Operațiile pupitrului MECIPT-1 — câte o funcție pentru fiecare comandă inscripționată
// pe panoul drept (surse/3d/inscriptii-pupitru.md). Sensul exact e DEDUS din inscripții
// și din Lucrarea de laborator 7 p.6; vezi docs/semantica.md.
#ifndef MECIPT_CONSOLE_H
#define MECIPT_CONSOLE_H
#include "machine.h"

void mec_c_set_switches_M(mecipt *m, mword sw);    /* cele 31 de comutatoare de sub M */
void mec_c_set_switches_RAI(mecipt *m, int sw);    /* comutatoarele RAI */
void mec_c_anuleaza_RAI(mecipt *m);
void mec_c_anuleaza_M(mecipt *m);
void mec_c_anuleaza_S(mecipt *m);
void mec_c_introduce_RA_in_RI(mecipt *m);          /* „7 CATEG. DIN RA în R I”: R I ← 7 biți din RA */
void mec_c_introduce_M_in_I(mecipt *m);
void mec_c_introduce_M_in_RI(mecipt *m);           /* RI ← instrucțiunea curentă din M */
void mec_c_memorie_scriere(mecipt *m);             /* drum[RAI] ← M */
void mec_c_memorie_citire(mecipt *m);              /* M ← drum[RAI] */
void mec_c_select_instr(mecipt *m, int which);     /* INSTRUCȚIA 1 / 2 */
void mec_c_depasire(mecipt *m, int se_opreste);    /* „ÎN CAZ DE DEPĂȘIREA CAPACITĂȚII REGISTRULUI” */
mec_halt mec_c_calculeaza(mecipt *m, int automat, uint64_t max_instr); /* AUTOMAT / INSTRUCȚIE UNICĂ */

#endif
