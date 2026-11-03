// SPDX-License-Identifier: AGPL-3.0-or-later
#include "machine.h"
#include "isa.h"
#include "periph.h"
#include "microops.h"
#include <string.h>

void mec_init(mecipt *m, mec_variants_t v) {
    memset(m, 0, sizeof *m);
    m->v = v;
    m->phase = 1;
    m->stop_on_dcr = 1;
}

void mec_load_image(mecipt *m, const mec_image *img) {
    memset(m->written, 0, sizeof m->written);
    for (int a = 0; a < 1024; a++) {
        if (img->prov[a] == PROV_NONE) continue;
        m->drum[a] = img->word[a] & MEC_MASK31;
        m->prov[a] = img->prov[a];
    }
}

double mec_seconds(const mecipt *m) {
    return (double)m->ticks / (double)(MEC_TICKS_PER_REV * MEC_REV_PER_SEC);
}

/* DEDUS (Baltac, Facsimil 8): adresele pare pe o jumătate de tambur, impare pe cealaltă. */
int mec_drum_slot(const mecipt *m, int addr) {
    addr &= 01777;
    if (!m->v.interleave_even_odd) return addr;
    return (addr & 1) ? 512 + (addr >> 1) : (addr >> 1);
}

/* Așteaptă până când cuvântul ajunge sub capete, apoi timpul de execuție. GHICIT: exec_ticks. */
static void drum_wait(mecipt *m, int addr) {
    uint64_t pos = m->ticks % MEC_TICKS_PER_REV;
    uint64_t slot = (uint64_t)mec_drum_slot(m, addr);
    m->ticks += (slot + MEC_TICKS_PER_REV - pos) % MEC_TICKS_PER_REV;
    m->ticks += (uint64_t)(m->v.exec_ticks > 0 ? m->v.exec_ticks : 1);
}

mword mec_drum_read(mecipt *m, int addr) {
    drum_wait(m, addr);
    return m->drum[addr & 01777];
}

void mec_drum_write(mecipt *m, int addr, mword w) {
    drum_wait(m, addr);
    m->drum[addr & 01777] = w & MEC_MASK31;
    m->written[addr & 01777] = 1;
    if (m->visitor_tape) m->prov[addr & 01777] = PROV_MODIFICAT;
}

static mec_halt overflow(mecipt *m, int ovf) {
    if (!ovf) return RUN_OK;
    m->dcr = 1;
    if (m->stop_on_dcr) { m->oprit = 1; return HALT_DCR; }
    return RUN_OK;
}

int mec_shift_count(const mecipt *m, int field) {
    return m->v.shift_field == SHIFT_N_IS_FIELD ? field : 32 - field;
}

#define MASK61 ((1ull << 61) - 1)

/* GHICIT: deplasare logică — semnul participă, biții care ies se pierd, intră zerouri. */
static void shift(mecipt *m, int code, int field) {
    int n = mec_shift_count(m, field);
    if (n < 0) n = 0;
    if (code == 19 || code == 20) {                 /* DS / DD: doar S (31 de biți) */
        uint64_t s = m->S;
        s = (n >= 31) ? 0 : (code == 19 ? (s << n) : (s >> n));
        m->S = (mword)(s & MEC_MASK31);
        return;
    }
    uint64_t x = ((uint64_t)m->S << 30) | (m->I & MEC_MASK30);   /* S & I: 61 de biți */
    x = (n >= 61) ? 0 : (code == 17 ? (x << n) : (x >> n));
    x &= MASK61;
    m->S = (mword)(x >> 30) & MEC_MASK31;
    m->I = (uint32_t)(x & MEC_MASK30);
}

/* GHICIT: produsul dublu pune semnul și partea de sus în S, partea de jos în I,
   ambele complementate pentru rezultat negativ. */
static void multiply(mecipt *m, mword y, int rounded) {
    int neg = mec_is_neg(m->S) != mec_is_neg(y);
    uint64_t p = (uint64_t)mec_abs(m->S) * (uint64_t)mec_abs(y);
    if (rounded) {
        mword r = (mword)((p + (1ull << 29)) >> 30) & MEC_MASK30;
        m->S = neg ? mec_neg(r) : r;
        return;
    }
    mword hi = (mword)(p >> 30) & MEC_MASK30;
    uint32_t lo = (uint32_t)(p & MEC_MASK30);
    m->S = neg ? mec_neg(hi) : hi;
    m->I = neg ? (~lo & MEC_MASK30) : lo;
}

/* I ← s : y (30 de biți), S ← restul cu semnul lui s. |s| ≥ |y| → depășire. GHICIT: forma restului. */
static int divide(mecipt *m, mword y) {
    uint64_t ms = mec_abs(m->S), my = mec_abs(y);
    if (my == 0 || ms >= my) return 1;
    uint64_t q = (ms << 30) / my, r = (ms << 30) % my;
    int neg = mec_is_neg(m->S) != mec_is_neg(y);
    m->I = neg ? (uint32_t)(~q & MEC_MASK30) : (uint32_t)(q & MEC_MASK30);
    m->S = mec_is_neg(m->S) ? mec_neg((mword)r) : (mword)r;
    return 0;
}

/* AC: subcodul e în câmpul de adresă (tabelul Geier, valori zecimale 73/91/92/94/105). */
static mec_halt ac(mecipt *m, int sub) {
    switch (sub) {
    case AC_PRINT_DIGITS:  if (m->io) mec_type_digits(m->io, m->S);  m->ticks += MEC_TYPE_TICKS; return RUN_OK;
    case AC_PRINT_LETTERS: if (m->io) mec_type_letters(m->io, m->S); m->ticks += MEC_TYPE_TICKS; return RUN_OK;
    case AC_S_FROM_I:      m->S = m->I & MEC_MASK30; return RUN_OK;   /* GHICIT: I pozitiv, fără semn */
    case AC_ICR_START:     if (m->io) m->io->icr_on = 1; return RUN_OK;
    case AC_ICR_STOP:      if (m->io) m->io->icr_on = 0; return RUN_OK;
    default: m->oprit = 1; m->unknown_code = 26; return HALT_UNKNOWN_OPCODE;
    }
}

/* Fiecare microoperație: R I trece în R II, noua adresă intră în R I (Lucrarea 7 p.3). */
static void uop(mecipt *m, int id) {
    m->R2 = m->R1;
    m->R1 = (uint8_t)(id & 0177);
    mec_uop_trace *t = m->trace;
    if (t && t->n < MEC_TRACE_MAX) { t->ids[t->n] = id; t->r1[t->n] = m->R1; t->r2[t->n] = m->R2; t->n++; }
}

static void jump(mecipt *m, int y) { m->RAI = (uint16_t)(y & 01777); m->phase = 1; uop(m, UOP_RA_TO_RAI); }

/* Execută instrucțiunea (cod, adresă). Întoarce RUN_OK sau motivul opririi; *jumped = 1 la salt. */
static mec_halt exec(mecipt *m, int code, int y, int *jumped) {
    int ovf = 0;
    mword s = m->S, val;
    switch (code) {
    case 0:  /* O: oprire; la repornire se reia de la y */
        m->oprit = 1; jump(m, y); *jumped = 1; return HALT_STOP_INSTR;
    case 1:  m->S = mec_drum_read(m, y); break;
    case 2:  m->S = mec_neg(mec_drum_read(m, y)); break;
    case 3:  m->S = mec_abs(mec_drum_read(m, y)); break;
    case 4:  m->S = mec_neg(mec_abs(mec_drum_read(m, y))); break;
    case 5:  m->S = mec_add(s, mec_drum_read(m, y), &ovf); return overflow(m, ovf);
    case 6:  m->S = mec_add(s, mec_neg(mec_drum_read(m, y)), &ovf); return overflow(m, ovf);
    case 7:  m->S = mec_add(s, mec_abs(mec_drum_read(m, y)), &ovf); return overflow(m, ovf);
    case 8:  m->S = mec_add(s, mec_neg(mec_abs(mec_drum_read(m, y))), &ovf); return overflow(m, ovf);
    case 9:  multiply(m, mec_drum_read(m, y), 0); break;
    case 10: multiply(m, mec_drum_read(m, y), 1); break;
    case 11: return overflow(m, divide(m, mec_drum_read(m, y)));
    case 17: case 18: case 19: case 20: shift(m, code, y); break;
    case 12: /* MS: S ← s + y și y ← S. DEDUS (oracolul retipăririi 1962): saltul de după
                MS 1625 testează contorul abia scăzut, deci rezultatul rămâne și în S. */
        val = mec_add(s, mec_drum_read(m, y), &ovf);
        m->S = val;
        mec_drum_write(m, y, val);
        return overflow(m, ovf);
    case 13: jump(m, y); *jumped = 1; break;
    /* GHICIT: −0 contează drept zero la toate salturile condiționate. */
    case 14: case 15: {
        int nonneg = !mec_is_neg(s) || mec_is_zero(s);
        int jump_on_nonneg = (code == 14) != (m->v.branch14_on_negative != 0);
        if (jump_on_nonneg ? nonneg : !nonneg) { jump(m, y); *jumped = 1; }
        break;
    }
    case 16: if (!mec_is_zero(s)) { jump(m, y); *jumped = 1; } break;
    case 21: mec_drum_write(m, y, m->S); break;
    case 22: mec_drum_write(m, y, m->I & MEC_MASK30); break;
    case 23: m->I = mec_drum_read(m, y) & MEC_MASK30; break; /* GHICIT: biții m1–m30 ai lui y */
    case 24: break;                                           /* CU */
    case 26: return ac(m, y);
    case 27: {                                                /* CIT */
        int v;
        if (mec_tape_read(m->io, &v)) { m->hirtie_agatata = 1; m->oprit = 1; return HALT_TAPE_JAM; }
        m->ticks += MEC_TAPE_TICKS;
        mec_drum_write(m, y, (mword)v);
        break;
    }
    case 28: { mword w = mec_drum_read(m, y); if (m->io) m->io->icr = w; break; }  /* TICR */
    case 25: m->S = s & mec_drum_read(m, y); break;
    default:
        m->oprit = 1; m->unknown_code = code; return HALT_UNKNOWN_OPCODE;
    }
    return RUN_OK;
}

mec_halt mec_step(mecipt *m) {
    m->oprit = 0;
    if (m->phase == 1) m->M = mec_drum_read(m, m->RAI);   /* cuvântul se citește de pe tambur ACUM */
    mec_pair p = mec_unpack(m->M);
    int first_is_1 = (m->v.pair_order == PAIR_FIRST_IS_1);
    int use1 = (m->phase == 1) == first_is_1;
    int code = use1 ? p.code1 : p.code2, y = use1 ? p.addr1 : p.addr2;
    m->RI = (uint16_t)((code << 10) | y);
    m->RA = (uint16_t)y;
    int jumped = 0;
    uint16_t rai = m->RAI;
    int phase = m->phase;
    mec_halt h = exec(m, code, y, &jumped);
    if (h == HALT_UNKNOWN_OPCODE) return h;
    for (int i = 0; MEC_UOP_SEQ[code][i] >= 0; i++) uop(m, MEC_UOP_SEQ[code][i]);
    if (!jumped) {
        if (phase == 1) { m->phase = 2; uop(m, UOP_INSTR2_IN_LOC1); }   /* „Instrucția 2 trece în locul 1” */
        else { m->phase = 1; m->RAI = (uint16_t)((rai + 1) & 01777); uop(m, UOP_MUTA_RAI); }
    }
    return h;
}

mec_halt mec_run(mecipt *m, uint64_t max_instr) {
    for (uint64_t i = 0; i < max_instr; i++) {
        mec_halt h = mec_step(m);
        if (h != RUN_OK) return h;
    }
    return RUN_OK;
}
