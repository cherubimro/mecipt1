// SPDX-License-Identifier: AGPL-3.0-or-later
#include "console.h"
#include "isa.h"

/* DEDUS: comutatoarele de sub M încarcă direct registrul M (becurile arată M). */
void mec_c_set_switches_M(mecipt *m, mword sw) { m->M = sw & MEC_MASK31; }
void mec_c_set_switches_RAI(mecipt *m, int sw) { m->RAI = (uint16_t)(sw & 01777); m->phase = 1; }

void mec_c_anuleaza_RAI(mecipt *m) { m->RAI = 0; m->phase = 1; }
void mec_c_anuleaza_M(mecipt *m)   { m->M = 0; }
void mec_c_anuleaza_S(mecipt *m)   { m->S = 0; }

void mec_c_introduce_RA_in_RI(mecipt *m) { m->R1 = (uint8_t)(m->RA & 0177); }
void mec_c_introduce_M_in_I(mecipt *m)   { m->I = m->M & MEC_MASK30; }

void mec_c_introduce_M_in_RI(mecipt *m) {
    mec_pair p = mec_unpack(m->M);
    int use1 = (m->phase == 1) == (m->v.pair_order == PAIR_FIRST_IS_1);
    int code = use1 ? p.code1 : p.code2, y = use1 ? p.addr1 : p.addr2;
    m->RI = (uint16_t)((code << 10) | y);
}

/* Operații manuale: se fac imediat (operatorul ține butonul până trece cuvântul). */
void mec_c_memorie_scriere(mecipt *m) {
    m->drum[m->RAI & 01777] = m->M & MEC_MASK31;
    m->prov[m->RAI & 01777] = PROV_MODIFICAT;   /* scrierea vine de la vizitator, de la pupitru */
    m->prov_version++;
}
void mec_c_memorie_citire(mecipt *m)  { m->M = m->drum[m->RAI & 01777]; }

void mec_c_select_instr(mecipt *m, int which) { m->phase = (which == 2) ? 2 : 1; }
void mec_c_depasire(mecipt *m, int se_opreste) { m->stop_on_dcr = se_opreste ? 1 : 0; }

mec_halt mec_c_calculeaza(mecipt *m, int automat, uint64_t max_instr) {
    m->hirtie_agatata = 0;
    return automat ? mec_run(m, max_instr) : mec_step(m);
}
