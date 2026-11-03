// SPDX-License-Identifier: AGPL-3.0-or-later
#include "api.h"
#include "console.h"
#include "periph.h"
#include "microops.h"
#include <string.h>

#define BUF_SIZE 65536
static mecipt m;
static mec_periph io;
static mec_image img, tape_img;
static mec_uop_trace tr;
static uint8_t tape[BUF_SIZE];
static char buf[BUF_SIZE], out[sizeof io.typed + 1], err[160];
static uint16_t uops[64];
static uint64_t ninstr;

static void reset_all(void) {
    mec_init(&m, mec_variants_default());
    memset(&io, 0, sizeof io);
    io.tape = tape;
    m.io = &io;
    memset(uops, 0, sizeof uops);
    ninstr = 0;
}

int api_init(void) {
    memset(&img, 0, sizeof img);
    err[0] = 0;
    reset_all();
    return 0;
}
char *api_buf(void) { return buf; }
int api_buf_size(void) { return BUF_SIZE; }
const char *api_error(void) { return err; }

int api_load_program(void) {
    buf[BUF_SIZE - 1] = 0;
    if (mec_program_parse(buf, &img)) {
        memcpy(err, img.error, sizeof err); err[sizeof err - 1] = 0;
        memset(&img, 0, sizeof img);
        return -1;
    }
    reset_all();
    mec_load_image(&m, &img);
    return 0;
}

int api_set_tape_words(void) {
    buf[BUF_SIZE - 1] = 0;
    if (mec_program_parse(buf, &tape_img)) {
        memcpy(err, tape_img.error, sizeof err); err[sizeof err - 1] = 0;
        return -1;
    }
    static mword words[1024]; int n = 0;
    for (int a = 0; a < 1024; a++) if (tape_img.prov[a] != PROV_NONE) words[n++] = tape_img.word[a];
    int rows = mec_tape_encode_words(words, n, tape, sizeof tape);
    if (rows < 0) return -1;
    io.tape_len = (size_t)rows; io.tape_pos = 0; m.hirtie_agatata = 0;
    return rows;
}

int api_set_tape_rows(int n) {
    if (n < 0 || n > BUF_SIZE) return -1;
    for (int i = 0; i < n; i++) tape[i] = (uint8_t)buf[i] & 037;
    io.tape_len = (size_t)n; io.tape_pos = 0; m.hirtie_agatata = 0;
    return n;
}
int api_tape_len(void) { return (int)io.tape_len; }
int api_tape_pos(void) { return (int)io.tape_pos; }
const uint8_t *api_tape(void) { return tape; }

static mec_halt one(void) {
    tr.n = 0; m.trace = &tr;
    mec_halt h = mec_step(&m);
    m.trace = NULL;
    for (int k = 0; k < tr.n; k++) {
        int id = tr.ids[k];
        if (id >= 0 && id < 64 && uops[id] < 65535) uops[id]++;
    }
    ninstr++;
    return h;
}

int api_run(double until_ticks, double max_instr) {
    m.hirtie_agatata = 0;
    for (double n = 0; n < max_instr && (double)m.ticks < until_ticks; n++) {
        mec_halt h = one();
        if (h != RUN_OK) return h;
    }
    return RUN_OK;
}
int api_step(void) { m.hirtie_agatata = 0; return one(); }
double api_ticks(void) { return (double)m.ticks; }
double api_instructions(void) { return (double)ninstr; }

uint32_t api_reg(int r) {
    switch (r) {
    case API_REG_S: return m.S;            case API_REG_I: return m.I;
    case API_REG_M: return m.M;            case API_REG_RI: return m.RI;
    case API_REG_RAI: return m.RAI;        case API_REG_RA: return m.RA;
    case API_REG_R1: return m.R1;          case API_REG_R2: return m.R2;
    case API_REG_ALPHA: return m.alpha;    case API_REG_BETA: return m.beta;
    case API_REG_GAMMA: return m.gamma;    case API_REG_PHASE: return (uint32_t)m.phase;
    case API_REG_DCR: return (uint32_t)m.dcr;
    case API_REG_OPRIT: return (uint32_t)m.oprit;
    case API_REG_HIRTIE: return (uint32_t)m.hirtie_agatata;
    case API_REG_STOP_ON_DCR: return (uint32_t)m.stop_on_dcr;
    default: return 0;
    }
}

const uint16_t *api_uops(void) { return uops; }
void api_uops_clear(void) { memset(uops, 0, sizeof uops); }

int api_typed_take(void) {
    int n = (int)io.typed_len;
    memcpy(out, io.typed, (size_t)n); out[n] = 0;
    io.typed_len = 0; io.typed[0] = 0;
    return n;
}
const char *api_out(void) { return out; }

int api_console(int op, int arg) {
    switch (op) {
    case API_C_SWITCHES_M:    mec_c_set_switches_M(&m, (mword)arg & MEC_MASK31); break;
    case API_C_SWITCHES_RAI:  mec_c_set_switches_RAI(&m, arg); break;
    case API_C_ANULEAZA_RAI:  mec_c_anuleaza_RAI(&m); break;
    case API_C_ANULEAZA_M:    mec_c_anuleaza_M(&m); break;
    case API_C_ANULEAZA_S:    mec_c_anuleaza_S(&m); break;
    case API_C_RA_IN_RI:      mec_c_introduce_RA_in_RI(&m); break;
    case API_C_M_IN_I:        mec_c_introduce_M_in_I(&m); break;
    case API_C_M_IN_RI:       mec_c_introduce_M_in_RI(&m); break;
    case API_C_MEM_SCRIERE:   mec_c_memorie_scriere(&m); break;
    case API_C_MEM_CITIRE:    mec_c_memorie_citire(&m); break;
    case API_C_INSTRUCTIA:    mec_c_select_instr(&m, arg); break;
    case API_C_DEPASIRE:      mec_c_depasire(&m, arg); break;
    case API_C_OPRESTE:       m.oprit = 1; break;   /* IMPULSURI — ÎNTRERUPE (GHICIT) */
    default: return -1;
    }
    return 0;
}

int api_prov(int addr) { return (addr < 0 || addr > 1023) ? PROV_NONE : (int)img.prov[addr]; }
const char *api_prov_source(int addr) {
    if (addr < 0 || addr > 1023 || img.prov[addr] == PROV_NONE) return "";
    return img.sources[img.src[addr]];
}
int api_uop_id(int grid, int row, int col) { return mec_uop_id(grid, row, col); }
