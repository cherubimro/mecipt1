// SPDX-License-Identifier: AGPL-3.0-or-later
// Fațada fără structuri (core/api.h), folosită de WebAssembly: testată nativ.
#include "test.h"
#include "api.h"
#include "machine.h"
#include "program.h"

static int load_file_into_buf(const char *path) {
    FILE *f = fopen(path, "rb");
    if (!f) return -1;
    size_t n = fread(api_buf(), 1, (size_t)api_buf_size() - 1, f);
    api_buf()[n] = 0; fclose(f);
    return (int)n;
}
static int load_text(const char *t) {
    snprintf(api_buf(), (size_t)api_buf_size(), "%s", t);
    return api_load_program();
}
static int count_lines(const char *s, int n) {
    int k = 0;
    for (int i = 0; i < n; i++) k += s[i] == '\n';
    return k;
}

TEST(test_api_load_and_run_retiparire) {
    api_init();
    CHECK(load_file_into_buf("../programs/retiparire-1962.mec") > 0);
    CHECK_EQ_U(api_load_program(), 0);
    CHECK_EQ_U(api_console(API_C_SWITCHES_RAI, 01477), 0);
    CHECK_EQ_U(api_run(1e12, 1e6), HALT_STOP_INSTR);
    int n = api_typed_take();
    CHECK(strncmp(api_out(), "1477  27 0000  30 0000\n", 23) == 0);
    CHECK_EQ_U(count_lines(api_out(), n), 39);
}

TEST(test_api_load_error) {
    api_init();
    CHECK(load_text("@prov GHICIT test\n0000  99 0000  00 0000") == -1);
    CHECK(strstr(api_error(), "linia 2") != NULL);
}

TEST(test_api_load_resets) {
    api_init();
    load_file_into_buf("../tests/data/inex-banda-3-cuvinte.mec");
    CHECK_EQ_U(api_set_tape_words(), 18);
    load_file_into_buf("../programs/retiparire-1962.mec");
    CHECK_EQ_U(api_load_program(), 0);
    api_console(API_C_SWITCHES_RAI, 01477);
    api_run(1e12, 200);
    CHECK(api_ticks() > 0);
    load_file_into_buf("../programs/retiparire-1962.mec");
    CHECK_EQ_U(api_load_program(), 0);
    CHECK(api_ticks() == 0);
    CHECK(api_instructions() == 0);
    CHECK_EQ_U(api_typed_take(), 0);
    CHECK_EQ_U(api_tape_len(), 0);
    int nz = 0;
    for (int k = 0; k < 39; k++) nz += api_uops()[k] != 0;
    CHECK_EQ_U(nz, 0);
}

TEST(test_api_run_respects_tick_budget) {
    api_init();
    load_file_into_buf("../programs/retiparire-1962.mec");
    CHECK_EQ_U(api_load_program(), 0);
    api_console(API_C_SWITCHES_RAI, 01477);
    double t0 = api_ticks();
    CHECK_EQ_U(api_run(t0 + 1024, 1e6), RUN_OK);
    CHECK(api_ticks() >= t0 + 1024);
    CHECK(api_ticks() < t0 + 1024 + 2 * 5120);
}

TEST(test_api_max_instr_cap) {
    api_init();
    CHECK_EQ_U(load_text("@prov GHICIT test\n0000  T 0000  T 0000\n"), 0);
    CHECK_EQ_U(api_run(1e12, 1000), RUN_OK);
    CHECK(api_instructions() == 1000);
}

TEST(test_api_typed_take_drains_past_64k) {
    api_init();
    CHECK_EQ_U(load_text("@prov GHICIT test\n0000  AC 0136  T 0000\n"), 0);
    long total = 0;
    for (int i = 0; i < 140; i++) {
        api_run(1e12, 1000);
        total += api_typed_take();
    }
    CHECK_EQ_U(api_instructions(), 140000);
    CHECK_EQ_U(total, 70000);
    CHECK(total > 65536);
}

TEST(test_api_uops_accumulate) {
    api_init();
    CHECK_EQ_U(load_text("@prov GHICIT test\n0000  U 0002  O 0000\n0002 = 0,5\n"), 0);
    CHECK_EQ_U(api_step(), RUN_OK);
    CHECK_EQ_U(api_uops()[16], 1);
    api_uops_clear();
    int nz = 0;
    for (int k = 0; k < 39; k++) nz += api_uops()[k] != 0;
    CHECK_EQ_U(nz, 0);
}

TEST(test_api_console_ops) {
    api_init();
    CHECK_EQ_U(api_console(API_C_SWITCHES_M, 0x2AAAAAAA), 0);
    CHECK_EQ_U(api_reg(API_REG_M), 0x2AAAAAAA);
    api_console(API_C_SWITCHES_RAI, 0100);
    CHECK_EQ_U(api_reg(API_REG_RAI), 0100);
    api_console(API_C_MEM_SCRIERE, 0);
    api_console(API_C_ANULEAZA_M, 0);
    CHECK_EQ_U(api_reg(API_REG_M), 0);
    api_console(API_C_MEM_CITIRE, 0);
    CHECK_EQ_U(api_reg(API_REG_M), 0x2AAAAAAA);
    CHECK_EQ_U(api_reg(API_REG_OPRIT), 0);
    CHECK_EQ_U(api_console(API_C_OPRESTE, 0), 0);
    CHECK_EQ_U(api_reg(API_REG_OPRIT), 1);
    CHECK(api_console(99, 0) == -1);
}

TEST(test_api_tape_words_inex) {
    api_init();
    load_file_into_buf("../programs/inex1-preincarcator.mec");
    CHECK_EQ_U(api_load_program(), 0);
    load_file_into_buf("../tests/data/inex-banda-3-cuvinte.mec");
    CHECK_EQ_U(api_set_tape_words(), 18);
    CHECK_EQ_U(api_tape_len(), 18);
    api_console(API_C_SWITCHES_RAI, 010);
    CHECK_EQ_U(api_run(1e12, 5000), HALT_TAPE_JAM);
    CHECK_EQ_U(api_tape_pos(), 18);
    CHECK_EQ_U(api_reg(API_REG_HIRTIE), 1);
}

TEST(test_api_provenance) {
    api_init();
    load_file_into_buf("../programs/retiparire-1962.mec");
    CHECK_EQ_U(api_load_program(), 0);
    CHECK_EQ_U(api_prov(01477), PROV_ORIGINAL);
    CHECK_EQ_U(api_prov(01556), PROV_RECONSTRUCTIE);
    CHECK_EQ_U(api_prov(0), PROV_NONE);
    CHECK(strstr(api_prov_source(01477), "Facsimil 4") != NULL);
    CHECK_EQ_S(api_prov_source(0), "");
}

TEST(test_api_op_effect_is_the_real_one) {
    api_init();
    CHECK(strstr(api_op_effect(14), "s < 0") != NULL);
    CHECK(strstr(api_op_effect(15), "s ≥ 0") != NULL);
    CHECK(strstr(api_op_effect(13), "salt") != NULL);
    CHECK_EQ_S(api_op_effect(30), "");
}

TEST(test_api_word_value) {
    CHECK(api_word_value(0x20000000u) == 0.5);
    CHECK(api_word_value(0x10000000u) == 0.25);
    CHECK(api_word_value(0x5FFFFFFFu) == -0.5);
    CHECK(api_word_value(0x7FFFFFFFu) == 0.0);
}

static int put(const char *t) { snprintf(api_buf(), (size_t)api_buf_size(), "%s", t); return 0; }

TEST(test_api_poke_peek_clear) {
    api_init();
    CHECK_EQ_U(api_poke(01000, 0x20000000u, PROV_MODIFICAT), 0);
    CHECK_EQ_U(api_peek(01000), 0x20000000u);
    CHECK_EQ_U(api_prov(01000), PROV_MODIFICAT);
    CHECK_EQ_S(api_prov_source(01000), "");
    CHECK(api_poke(02000, 1, 5) == -1);
    CHECK(api_poke(0, 1, 9) == -1);
    CHECK_EQ_U(api_clear_word(01000), 0);
    CHECK_EQ_U(api_peek(01000), 0);
    CHECK_EQ_U(api_prov(01000), PROV_NONE);
}

TEST(test_api_assemble) {
    api_init();
    put("UI 0000 CU 0000");
    CHECK_EQ_U(api_assemble(), 0);
    CHECK_EQ_U(api_assembled(), (030u << 25) | (027u << 20));
    put("27 0000  30 0000");
    CHECK_EQ_U(api_assemble(), 0);
    CHECK_EQ_U(api_assembled(), (030u << 25) | (027u << 20));
    put("= 0,5");
    CHECK_EQ_U(api_assemble(), 0);
    CHECK_EQ_U(api_assembled(), 0x20000000u);
    put("XX 9999");
    CHECK(api_assemble() == -1);
    CHECK(strstr(api_error(), "mnemonic") != NULL);
    CHECK(strstr(api_error(), "linia") == NULL);
}

TEST(test_api_merge_keeps_drum) {
    api_init();
    load_file_into_buf("../programs/retiparire-1962.mec");
    CHECK_EQ_U(api_load_program(), 0);
    api_console(API_C_SWITCHES_RAI, 01477);
    api_run(1e12, 50);
    uint32_t w = api_peek(01477); double t = api_ticks();
    load_file_into_buf("../programs/inex1-preincarcator.mec");
    CHECK_EQ_U(api_merge_program(), 0);
    CHECK_EQ_U(api_peek(01477), w);
    CHECK(api_ticks() == t);
    CHECK_EQ_U(api_prov(010), PROV_ORIGINAL);
    CHECK(strstr(api_prov_source(010), "Facsimil 5") != NULL);
    CHECK(strstr(api_prov_source(01477), "Facsimil 4") != NULL);
}

TEST(test_api_reset_cpu_keeps_drum) {
    api_init();
    load_file_into_buf("../programs/retiparire-1962.mec");
    CHECK_EQ_U(api_load_program(), 0);
    api_console(API_C_SWITCHES_RAI, 01477);
    api_run(1e12, 200);
    uint32_t w = api_peek(01477);
    int any = 0; for (int a = 0; a < 1024; a++) any |= api_written(a);
    CHECK(any);
    api_reset_cpu();
    CHECK_EQ_U(api_reg(API_REG_S), 0);
    CHECK_EQ_U(api_reg(API_REG_OPRIT), 1);
    CHECK_EQ_U(api_peek(01477), w);
    int still = 0; for (int a = 0; a < 1024; a++) still |= api_written(a);
    CHECK(still);
}

TEST(test_api_visitor_tape_flag) {
    api_init();
    put("@prov GHICIT t\n0000  U 0100  ME 0101\n0001  O 0001  O 0001\n0100 = 0,5\n");
    CHECK_EQ_U(api_load_program(), 0);
    CHECK_EQ_U(api_set_visitor_tape(1), 0);
    api_run(1e12, 10);
    CHECK_EQ_U(api_prov(0101), PROV_MODIFICAT);
    put("@prov GHICIT t\n0000  U 0100  ME 0101\n0001  O 0001  O 0001\n0100 = 0,5\n");
    api_load_program();
    api_run(1e12, 10);
    CHECK_EQ_U(api_prov(0101), PROV_NONE);
}

TEST(test_api_prov_version_counts_changes) {
    api_init();
    put("@prov GHICIT t\n0000  U 0100  ME 0101\n0001  O 0001  O 0001\n0100 = 0,5\n");
    api_load_program();
    unsigned v0 = api_prov_version();
    api_console(API_C_SWITCHES_RAI, 0200);
    api_console(API_C_MEM_SCRIERE, 0);
    CHECK(api_prov_version() != v0);
    unsigned v1 = api_prov_version();
    api_run(1e12, 10);                      /* scriere de program fără bandă de vizitator: proveniența nu se schimbă */
    CHECK_EQ_U(api_prov_version(), v1);
    api_set_visitor_tape(1);
    api_console(API_C_SWITCHES_RAI, 0);
    api_run(1e12, 10);
    CHECK(api_prov_version() != v1);
    unsigned v2 = api_prov_version();
    api_poke(0300, 1, PROV_MODIFICAT);
    CHECK(api_prov_version() != v2);
}

TEST(test_api_parse_only) {
    api_init();
    put("@prov ORIGINAL x\n100  O 0000  O 0000\n0101 = 0,5\n");
    CHECK_EQ_U(api_parse_only(), 0);
    CHECK_EQ_U(api_parsed_prov(0100), PROV_ORIGINAL);
    CHECK_EQ_U(api_parsed_word(0101), 0x20000000u);
    CHECK_EQ_U(api_parsed_prov(0102), PROV_NONE);
    put("@prov ORIGINAL x\n1500  UI 000O  CU 0000\n");
    CHECK(api_parse_only() == -1);
    CHECK(strstr(api_error(), "linia 2") != NULL);
    put("@prov ORIGINAL x\n2000  O 0000  O 0000\n");
    CHECK(api_parse_only() == -1);
}

RUN_ALL()
