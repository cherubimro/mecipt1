// SPDX-License-Identifier: AGPL-3.0-or-later
// Mașina MECIPT-1: registre, tamburul cu timpul lui, execuția instrucțiunilor.
#ifndef MECIPT_MACHINE_H
#define MECIPT_MACHINE_H
#include <stdint.h>
#include "word.h"
#include "variants.h"
#include "program.h"

typedef enum {
    RUN_OK, HALT_STOP_INSTR, HALT_DCR, HALT_TAPE_JAM, HALT_UNKNOWN_OPCODE, HALT_MANUAL
} mec_halt;

struct mec_periph;
struct mec_uop_trace;

#define MEC_TICKS_PER_REV 1024u
#define MEC_REV_PER_SEC   50u

typedef struct mecipt {
    mword drum[1024];
    mec_prov prov[1024];
    mword S, M;
    uint32_t I;                 /* 30 biți */
    uint16_t RAI, RA, RI;       /* RI: cod << 10 | adresă */
    uint8_t R1, R2, alpha, beta, gamma;
    int phase;                  /* 1: urmează prima instrucțiune din cuvânt; 2: a doua */
    int dcr, oprit, hirtie_agatata, stop_on_dcr, unknown_code;
    uint64_t ticks;             /* timpi de cuvânt; 1024 pe rotație; 50 rot/s */
    mec_variants_t v;
    struct mec_periph *io;      /* poate fi NULL */
    struct mec_uop_trace *trace;/* poate fi NULL */
} mecipt;

void     mec_init(mecipt *m, mec_variants_t v);
void     mec_load_image(mecipt *m, const mec_image *img);
mec_halt mec_step(mecipt *m);                    /* O instrucțiune (jumătate de cuvânt) */
mec_halt mec_run(mecipt *m, uint64_t max_instr);
double   mec_seconds(const mecipt *m);
int      mec_drum_slot(const mecipt *m, int addr);
/* Citire/scriere pe tambur cu așteptarea poziției (folosite și de periferice). */
mword    mec_drum_read(mecipt *m, int addr);
void     mec_drum_write(mecipt *m, int addr, mword w);

#endif
