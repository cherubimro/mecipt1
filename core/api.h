// SPDX-License-Identifier: AGPL-3.0-or-later
// Fațada fără structuri a nucleului: o singură mașină statică, doar întregi, double și
// pointeri în memoria ei. O folosește WebAssembly (web/js/mecipt.js); e testată nativ.
#ifndef MECIPT_API_H
#define MECIPT_API_H
#include <stdint.h>

#ifdef __wasm__
#define API __attribute__((visibility("default")))
#else
#define API
#endif

enum { API_REG_S, API_REG_I, API_REG_M, API_REG_RI, API_REG_RAI, API_REG_RA, API_REG_R1, API_REG_R2,
       API_REG_ALPHA, API_REG_BETA, API_REG_GAMMA, API_REG_PHASE, API_REG_DCR, API_REG_OPRIT,
       API_REG_HIRTIE, API_REG_STOP_ON_DCR };

enum { API_C_SWITCHES_M = 1, API_C_SWITCHES_RAI, API_C_ANULEAZA_RAI, API_C_ANULEAZA_M, API_C_ANULEAZA_S,
       API_C_RA_IN_RI, API_C_M_IN_I, API_C_M_IN_RI, API_C_MEM_SCRIERE, API_C_MEM_CITIRE,
       API_C_INSTRUCTIA, API_C_DEPASIRE, API_C_OPRESTE };

API int api_init(void);                 /* mașină nouă, tambur și bandă goale; 0 */
API char *api_buf(void);                /* tamponul de intrare (text terminat cu 0 sau rânduri de bandă) */
API int api_buf_size(void);             /* 65 536 */
API int api_load_program(void);         /* api_buf ca .mec; resetează tot; 0 sau −1 (api_error) */
API const char *api_error(void);
API int api_set_tape_words(void);       /* api_buf ca .mec → cuvintele pe bandă; rânduri sau −1 */
API int api_set_tape_rows(int n);       /* primii n octeți din api_buf = rânduri perforate; n sau −1 */
API int api_tape_len(void);
API int api_tape_pos(void);
API const uint8_t *api_tape(void);
API int api_run(double until_ticks, double max_instr); /* mec_halt; 0 = bugetul s-a terminat */
API int api_step(void);                 /* exact o instrucțiune */
API double api_ticks(void);
API double api_instructions(void);
API uint32_t api_reg(int r);
API const uint16_t *api_uops(void);     /* 39 de contoare (saturate) de la ultima golire */
API void api_uops_clear(void);
API int api_typed_take(void);           /* textul nou al mașinii de scris → api_out(); octeți */
API const char *api_out(void);
API int api_console(int op, int arg);   /* 0 sau −1 pentru op necunoscut */
API int api_prov(int addr);
API const char *api_prov_source(int addr);
API int api_uop_id(int grid, int row, int col);
API double api_word_value(uint32_t w);   /* fracția în complement față de unu (−0 → 0) */

#endif
