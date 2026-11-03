// SPDX-License-Identifier: AGPL-3.0-or-later
#include "test.h"
#include "machine.h"
#include "periph.h"
#include "isa.h"

static mecipt m;
static mec_image img;
static mec_periph io;

static mec_halt run(const char *src, const uint8_t *tape, size_t n) {
    if (mec_program_parse(src, &img)) printf("  eroare program: %s\n", img.error);
    mec_init(&m, mec_variants_default());
    mec_load_image(&m, &img);
    memset(&io, 0, sizeof io);
    io.tape = tape; io.tape_len = n;
    m.io = &io;
    return mec_run(&m, 100);
}

TEST(test_tape_hole_is_zero) {
    static const uint8_t all_holes[] = { 0x1F }, no_holes[] = { 0x00 }, mixed[] = { 0x15 };
    run("@prov GHICIT t\n0000  CIT 0100  O 0000\n", all_holes, 1);
    CHECK_EQ_U(m.drum[0100], 0);
    run("@prov GHICIT t\n0000  CIT 0100  O 0000\n", no_holes, 1);
    CHECK_EQ_U(m.drum[0100], 037);
    run("@prov GHICIT t\n0000  CIT 0100  O 0000\n", mixed, 1);
    CHECK_EQ_U(m.drum[0100], 012);                 /* 10101 perforat → 01010 */
    CHECK_EQ_U(io.tape_pos, 1);
}

TEST(test_tape_end_jams) {
    static const uint8_t one[] = { 0x00 };
    mec_halt h = run("@prov GHICIT t\n0000  CIT 0100  CIT 0101\n0001  O 0001  O 0001\n", one, 1);
    CHECK_EQ_U(h, HALT_TAPE_JAM);
    CHECK_EQ_U(m.hirtie_agatata, 1);
    CHECK_EQ_U(m.oprit, 1);
    CHECK_EQ_U(m.drum[0100], 037);
}

TEST(test_no_reader_jams) {
    mec_init(&m, mec_variants_default());
    mec_program_parse("@prov GHICIT t\n0000  CIT 0100  O 0000\n", &img);
    mec_load_image(&m, &img);
    CHECK_EQ_U(mec_run(&m, 10), HALT_TAPE_JAM);        /* fără periferice: banda lipsește */
}

TEST(test_print_digits) {
    /* s0 s1 s2 s3 = 0101 → cifra 5 */
    run("@prov GHICIT t\n0000  U 0100  AC 0136\n0001  O 0001  O 0001\n0100 = o05000000000\n", NULL, 0);
    CHECK_EQ_S(io.typed, MEC_DIGIT_GLYPHS[5]);
}

TEST(test_print_letters) {
    /* s0…s4 = 00001 → a doua literă (Ă) */
    run("@prov GHICIT t\n0000  U 0100  AC 0133\n0001  O 0001  O 0001\n0100 = o00400000000\n", NULL, 0);
    CHECK_EQ_S(io.typed, MEC_LETTER_GLYPHS[1]);
}

TEST(test_ac_s_from_i) {
    run("@prov GHICIT t\n0000  UI 0100  AC 0151\n0001  O 0001  O 0001\n0100 = 0,25\n", NULL, 0);
    CHECK_EQ_U(m.S, mec_from_double(0.25));
}

TEST(test_icr_and_ticr) {
    run("@prov GHICIT t\n0000  AC 0111  TICR 0100\n0001  O 0001  O 0001\n0100 = 0,5\n", NULL, 0);
    CHECK_EQ_U(io.icr_on, 1);
    CHECK_EQ_U(io.icr, mec_from_double(0.5));
    run("@prov GHICIT t\n0000  AC 0111  AC 0134\n0001  O 0001  O 0001\n", NULL, 0);
    CHECK_EQ_U(io.icr_on, 0);
}

TEST(test_unknown_ac_subcode_halts) {
    CHECK_EQ_U(run("@prov GHICIT t\n0000  AC 0001  O 0000\n", NULL, 0), HALT_UNKNOWN_OPCODE);
}

TEST(test_tape_encode_words) {
    mword w[1] = { mec_pack((mec_pair){ 05, 01626, 025, 01512 }) };
    uint8_t out[8];
    CHECK_EQ_U(mec_tape_encode_words(w, 1, out, sizeof out), 6);
    /* primul caracter = m1–m5, perforat cu gaura = 0 */
    CHECK_EQ_U(out[0], (~((w[0] >> 25) & 037)) & 037);
    CHECK_EQ_U(out[5], (~(w[0] & 037)) & 037);
}

TEST(test_glyph_sets_follow_baltac_l6) {
    /* Wikipedia RO după Baltac, L6: setul numeric — codul 14 nefolosit, fără „+”; setul de litere — codul 31 nefolosit */
    CHECK_EQ_S(MEC_DIGIT_GLYPHS[14], "");
    CHECK_EQ_S(MEC_DIGIT_GLYPHS[15], ".");
    CHECK_EQ_S(MEC_LETTER_GLYPHS[31], "");
    for (int i = 0; i < 16; i++) CHECK(strcmp(MEC_DIGIT_GLYPHS[i], "+") != 0);
}

RUN_ALL()
