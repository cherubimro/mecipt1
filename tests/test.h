// SPDX-License-Identifier: AGPL-3.0-or-later
// Mini-cadru de teste: fiecare fișier tests/test_*.c devine un executabil.
#ifndef MECIPT_TEST_H
#define MECIPT_TEST_H
#include <stdio.h>
#include <string.h>

typedef void (*test_fn)(void);
static int t_fail_count, t_cur_failed;
static struct { const char *name; test_fn fn; } t_tests[256];
static int t_ntests;

#define TEST(tname)                                                       \
    static void tname(void);                                              \
    __attribute__((constructor)) static void reg_##tname(void) {          \
        t_tests[t_ntests].name = #tname; t_tests[t_ntests++].fn = tname;  \
    }                                                                     \
    static void tname(void)

#define CHECK(cond) do { if (!(cond)) {                                   \
    printf("  %s:%d: CHECK(%s) a eșuat\n", __FILE__, __LINE__, #cond);    \
    t_cur_failed = 1; } } while (0)

#define CHECK_EQ_U(a, b) do { unsigned long long _a = (unsigned long long)(a), \
    _b = (unsigned long long)(b); if (_a != _b) {                         \
    printf("  %s:%d: %s == %s: %llu (0%llo) != %llu (0%llo)\n", __FILE__, \
           __LINE__, #a, #b, _a, _a, _b, _b); t_cur_failed = 1; } } while (0)

#define CHECK_EQ_S(a, b) do { const char *_a = (a), *_b = (b);            \
    if (strcmp(_a, _b) != 0) { printf("  %s:%d: \"%s\" != \"%s\"\n",      \
    __FILE__, __LINE__, _a, _b); t_cur_failed = 1; } } while (0)

#define SKIP(reason) do { printf("  SKIP: %s\n", reason); return; } while (0)

#define RUN_ALL() int main(void) {                                        \
    for (int i = 0; i < t_ntests; i++) {                                  \
        t_cur_failed = 0; t_tests[i].fn();                                \
        printf("%s %s\n", t_cur_failed ? "FAIL" : "OK  ", t_tests[i].name); \
        t_fail_count += t_cur_failed; }                                   \
    printf("%s: %d/%d trecute\n", __FILE__, t_ntests - t_fail_count, t_ntests); \
    return t_fail_count ? 1 : 0; }

#endif
