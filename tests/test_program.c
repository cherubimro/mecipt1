// SPDX-License-Identifier: AGPL-3.0-or-later
#include "test.h"
#include "program.h"
#include "isa.h"
#include <stdlib.h>
#include <locale.h>

static char *slurp(const char *path) {
    FILE *f = fopen(path, "rb");
    if (!f) return NULL;
    fseek(f, 0, SEEK_END); long n = ftell(f); fseek(f, 0, SEEK_SET);
    char *b = malloc((size_t)n + 1);
    size_t r = fread(b, 1, (size_t)n, f); b[r] = 0; fclose(f);
    return b;
}

static mec_image img;

TEST(test_parse_inex) {
    char *t = slurp("../programs/inex1-preincarcator.mec");
    CHECK(t != NULL);
    if (!t) return;
    int rc = mec_program_parse(t, &img);
    if (rc) printf("  eroare: %s\n", img.error);
    CHECK_EQ_U(rc, 0);
    mec_pair p = mec_unpack(img.word[010]);
    CHECK_EQ_U(p.code1, 027); CHECK_EQ_U(p.addr1, 0);
    CHECK_EQ_U(p.code2, 02);  CHECK_EQ_U(p.addr2, 01);
    CHECK_EQ_U(img.prov[010], PROV_ORIGINAL);
    CHECK_EQ_U(img.prov[02], PROV_NONE);
    CHECK(strstr(img.sources[img.src[010]], "Facsimil 5") != NULL);
    free(t);
}

TEST(test_listing_matches_facsimile) {
    char *t = slurp("../programs/inex1-preincarcator.mec");
    if (!t) { CHECK(0); return; }
    CHECK_EQ_U(mec_program_parse(t, &img), 0);
    char out[1024];
    mec_listing(&img, 010, 015, out, sizeof out);
    CHECK_EQ_S(out,
        "0010  27 0000  02 0001\n"
        "0011  21 0005  33 0044\n"
        "0012  05 0044  16 0011\n"
        "0013  15 0014  00 0000\n"
        "0014  25 0002  01 0001\n"
        "0015  14 0014  15 0010\n");
    free(t);
}

TEST(test_reject_without_prov) {
    CHECK(mec_program_parse("0010 27 0000 02 0001\n", &img) != 0);
    CHECK(strstr(img.error, "linia 1") != NULL);
}

TEST(test_reject_duplicate_and_range) {
    CHECK(mec_program_parse("@prov GHICIT t\n2000 00 0000 00 0000\n", &img) != 0);
    CHECK(strstr(img.error, "linia 2") != NULL);
    CHECK(mec_program_parse("@prov GHICIT t\n0010 00 0000 00 0000\n0010 01 0000 00 0000\n", &img) != 0);
    CHECK(strstr(img.error, "linia 3") != NULL);
    CHECK(mec_program_parse("@prov GHICIT t\n0010 40 0000 00 0000\n", &img) != 0);
    CHECK(mec_program_parse("@prov GHICIT t\n0010 00 2000 00 0000\n", &img) != 0);
    CHECK(mec_program_parse("@prov NIMIC t\n0010 00 0000 00 0000\n", &img) != 0);
}

TEST(test_mnemonic_equals_octal) {
    mec_image a, b;
    CHECK_EQ_U(mec_program_parse("@prov GHICIT t\n0010 UI 0000 UN 0001\n", &a), 0);
    CHECK_EQ_U(mec_program_parse("@prov GHICIT t\n0010 27 0000 02 0001\n", &b), 0);
    CHECK_EQ_U(a.word[010], b.word[010]);
    CHECK_EQ_U(mec_program_parse("@prov GHICIT t\n0010 CU UI 0000\n", &a), 0); /* CU fără adresă */
    CHECK_EQ_U(mec_unpack(a.word[010]).code1, 030);
    CHECK_EQ_U(mec_unpack(a.word[010]).code2, 027);
}

TEST(test_data_words) {
    mec_image a;
    CHECK_EQ_U(mec_program_parse(
        "@prov RECONSTRUCTIE t\n"
        "0001 = 00 0001 00 0000\n"
        "0004 = 0,5\n"
        "0005 = -0,25\n"
        "0006 = o17777777777\n", &a), 0);
    CHECK_EQ_U(a.word[1], 1);
    CHECK_EQ_U(a.word[4], mec_from_double(0.5));
    CHECK_EQ_U(a.word[5], mec_from_double(-0.25));
    CHECK_EQ_U(a.word[6], MEC_MASK31);
    CHECK_EQ_U(a.prov[4], PROV_RECONSTRUCTIE);
}

TEST(test_fraction_parser_locale_and_rejects) {
    mec_image a;
    int have = setlocale(LC_NUMERIC, "de_DE.utf8") != NULL;   /* virgula zecimală, ca wxWidgets sub ro_RO */
    if (!have) printf("  (fără localizarea de_DE; se testează doar respingerile)\n");
    CHECK_EQ_U(mec_program_parse("@prov GHICIT t\n0001 = 0,5\n0002 = -0.25\n0003 = 0,017452406\n", &a), 0);
    CHECK_EQ_U(a.word[1], mec_from_double(0.5));
    CHECK_EQ_U(a.word[2], mec_from_double(-0.25));
    CHECK_EQ_U(a.word[3], mec_from_double(0.017452406));
    setlocale(LC_NUMERIC, "C");
    const char *bad[] = { "nan", "inf", "0x1p-3", "1e-3", "1,0", "-1", ",5", "0,", "0,5x", "+-0,5" };
    for (unsigned i = 0; i < sizeof bad / sizeof *bad; i++) {
        char src[64]; snprintf(src, sizeof src, "@prov GHICIT t\n0001 = %s\n", bad[i]);
        if (mec_program_parse(src, &a) == 0) { printf("  acceptat greșit: %s\n", bad[i]); CHECK(0); }
    }
}

TEST(test_inex_word1_is_dedus) {
    char *t = slurp("../programs/inex1-preincarcator.mec");
    if (!t) { CHECK(0); return; }
    CHECK_EQ_U(mec_program_parse(t, &img), 0);
    CHECK_EQ_U(img.prov[01], PROV_DEDUS);                 /* cifra corectată de mână e o citire dedusă */
    CHECK_EQ_U(img.prov[00], PROV_ORIGINAL);
    CHECK_EQ_U(img.prov[010], PROV_ORIGINAL);
    free(t);
}

RUN_ALL()
