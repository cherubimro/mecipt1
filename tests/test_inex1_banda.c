// SPDX-License-Identifier: AGPL-3.0-or-later
// Banda INEX-1 reconstruită (programs/inex1-banda.mec), încărcată de preîncărcătorul ORIGINAL (Facsimil 5)
// pornit de la 0010, ca în procedura din 1962; apoi rutinele de pe bandă lucrează.
#include "test.h"
#include "console.h"
#include "periph.h"
#include "isa.h"

static char *slurp(const char *path) {
    static char bufs[4][65536]; static int k;
    char *buf = bufs[k++ & 3];
    FILE *f = fopen(path, "rb");
    if (!f) { printf("  nu găsesc %s\n", path); return NULL; }
    size_t n = fread(buf, 1, sizeof bufs[0] - 1, f); buf[n] = 0; fclose(f);
    return buf;
}

static mecipt m; static mec_periph io;
static mec_image pre, rut, ban, ape;
static uint8_t tape[8192];

static int parse(const char *path, mec_image *img) {
    char *t = slurp(path);
    if (!t) return -1;
    if (mec_program_parse(t, img)) { printf("  %s: %s\n", path, img->error); return -1; }
    return 0;
}

/* Cuvintele unei imagini, în ordinea adreselor, perforate ca în api_set_tape_words. */
static int encode(const mec_image *img) {
    static mword w[1024]; int n = 0;
    for (int a = 0; a < 1024; a++) if (img->prov[a] != PROV_NONE) w[n++] = img->word[a];
    return mec_tape_encode_words(w, n, tape, sizeof tape);
}

static mec_halt load_inex(void) {
    int ok = !parse("../programs/inex1-preincarcator.mec", &pre) && !parse("../programs/src/inex1-rutine.mec", &rut)
          && !parse("../programs/inex1-banda.mec", &ban) && !parse("data/inex-apeluri.mec", &ape);
    if (!ok) return RUN_OK;
    int len = encode(&ban);
    mec_init(&m, mec_variants_default());
    mec_load_image(&m, &pre);
    memset(&io, 0, sizeof io);
    io.tape = tape; io.tape_len = (size_t)len;
    m.io = &io;
    mec_c_set_switches_RAI(&m, 010);                  /* „se pornește calculatorul de la 0010” */
    return mec_c_calculeaza(&m, 1, 2000000);
}

TEST(test_inex1_banda_loads_and_matches) {
    mec_halt h = load_inex();
    CHECK_EQ_U(h, HALT_TAPE_JAM);
    int top = 0, bad = 0;
    for (int a = 2; a < 1024; a++) if (rut.prov[a] != PROV_NONE) top = a;
    for (int a = 2; a <= top; a++) {
        if (a == 014 || a == 044) continue;
        mword want = (a >= 010 && a <= 015) ? pre.word[a] : rut.word[a];
        if (m.drum[a] != want && bad++ < 5) printf("  tambur[%04o]=%011o, așteptat %011o\n", a, (unsigned)m.drum[a], (unsigned)want);
    }
    CHECK_EQ_U(bad, 0);
    CHECK_EQ_U(m.drum[014], mec_pack((mec_pair){ 21, top + 1, 1, 1 }));   /* ME (N+1), U 0001 */
    printf("  0002–%04o încărcate în %.1f s de timp simulat\n", top, mec_seconds(&m));
    CHECK(mec_seconds(&m) < 300);
}

TEST(test_inex1_after_load_prints) {
    load_inex();
    mec_load_image(&m, &ape);                           /* doar scenariile; rutinele sunt cele de pe bandă */
    io.typed_len = 0; io.typed[0] = 0;
    mec_c_set_switches_RAI(&m, 0400);
    CHECK_EQ_U(mec_c_calculeaza(&m, 1, 200000), HALT_STOP_INSTR);
    CHECK_EQ_S(io.typed, "o,5oooooooo-");
}

static void two_words_tape(void) {
    mword w[2] = { mec_from_double(0.25), mec_pack((mec_pair){ 05, 01626, 025, 01512 }) };
    int len = mec_tape_encode_words(w, 2, tape, sizeof tape);
    memset(&io, 0, sizeof io);
    io.tape = tape; io.tape_len = (size_t)len;
    m.io = &io;
}

TEST(test_inex1_0025_reads_words) {
    mec_init(&m, mec_variants_default());
    parse("../programs/inex1-preincarcator.mec", &pre); parse("../programs/src/inex1-rutine.mec", &rut);
    parse("data/inex-apeluri.mec", &ape);
    mec_load_image(&m, &pre); mec_load_image(&m, &rut); mec_load_image(&m, &ape);
    two_words_tape();
    mec_c_set_switches_RAI(&m, 0470);
    CHECK_EQ_U(mec_c_calculeaza(&m, 1, 200000), HALT_STOP_INSTR);
    CHECK_EQ_U(m.drum[0500], mec_from_double(0.25));
    CHECK_EQ_U(m.drum[0501], mec_pack((mec_pair){ 05, 01626, 025, 01512 }));
    CHECK_EQ_S(io.typed, "7");                           /* a revenit prin V */
}

TEST(test_inex1_0040_console) {
    mec_init(&m, mec_variants_default());
    parse("../programs/inex1-preincarcator.mec", &pre); parse("../programs/src/inex1-rutine.mec", &rut);
    mec_load_image(&m, &pre); mec_load_image(&m, &rut);
    two_words_tape();
    mec_c_set_switches_RAI(&m, 0040);
    CHECK_EQ_U(mec_c_calculeaza(&m, 1, 200000), HALT_TAPE_JAM);
    CHECK_EQ_U(m.drum[0400], mec_from_double(0.25));
    CHECK_EQ_U(m.drum[0401], mec_pack((mec_pair){ 05, 01626, 025, 01512 }));
}

RUN_ALL()
