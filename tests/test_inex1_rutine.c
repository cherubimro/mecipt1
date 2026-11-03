// SPDX-License-Identifier: AGPL-3.0-or-later
// Rutinele INEX-1 reconstruite (programs/src/inex1-rutine.mec), chemate cu convenția V din docs/semantica.md
// de scenariile din tests/data/inex-apeluri.mec. Fiecare scenariu: tamburul proaspăt, pornire, coala comparată.
#include "test.h"
#include "console.h"
#include "periph.h"

static char *slurp(const char *path) {
    static char bufs[4][32768]; static int k;
    char *buf = bufs[k++ & 3];
    FILE *f = fopen(path, "rb");
    if (!f) { printf("  nu găsesc %s\n", path); return NULL; }
    size_t n = fread(buf, 1, sizeof bufs[0] - 1, f); buf[n] = 0; fclose(f);
    return buf;
}

static mecipt m; static mec_periph io;

/* Preîncărcătorul + rutinele + scenariile, pornit de la `start`; întoarce coala. */
static const char *scenario(int start) {
    static mec_image img;
    const char *files[] = { "../programs/inex1-preincarcator.mec", "../programs/src/inex1-rutine.mec",
                            "data/inex-apeluri.mec" };
    mec_init(&m, mec_variants_default());
    for (int i = 0; i < 3; i++) {
        char *t = slurp(files[i]);
        if (!t || mec_program_parse(t, &img)) { printf("  %s: %s\n", files[i], t ? img.error : "lipsă"); return "?"; }
        mec_load_image(&m, &img);
    }
    memset(&io, 0, sizeof io);
    m.io = &io;
    mec_c_set_switches_RAI(&m, start);
    mec_halt h = mec_c_calculeaza(&m, 1, 200000);
    if (h != HALT_STOP_INSTR) printf("  oprire %d la RAI=%04o\n", h, m.RAI);
    return io.typed;
}

TEST(inex_0135_half)     { CHECK_EQ_S(scenario(0400), "o,5oooooooo-"); }
TEST(inex_0135_sin1)     { CHECK_EQ_S(scenario(0404), "o,o174524o6-"); }
TEST(inex_0135_negative) { CHECK_EQ_S(scenario(0410), "-o,25ooooooo-"); }
TEST(inex_0135_zero)     { CHECK_EQ_S(scenario(0414), "o,ooooooooo-o,ooooooooo-"); }
TEST(inex_0133_beta4)    { CHECK_EQ_S(scenario(0423), "o,5ooo-"); }
TEST(inex_0134_values)   { CHECK_EQ_S(scenario(0432), "834  7  o- 12"); }
TEST(inex_0136_three)    { CHECK_EQ_S(scenario(0447), "   "); }
TEST(inex_0132_two)      { CHECK_EQ_S(scenario(0453), "\n\n"); }
TEST(inex_0246_range)    { CHECK_EQ_S(scenario(0457), "o,5oooooooo-o,25ooooooo-o,125oooooo-\n"); }
TEST(inex_returns_via_V) { CHECK_EQ_S(scenario(0463), "o,5oooooooo-7"); }

RUN_ALL()
