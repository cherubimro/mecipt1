#!/bin/sh
# SPDX-License-Identifier: AGPL-3.0-or-later
# Teste end-to-end pentru mecrun (rulate de `make check` din directorul proiectului).
fail=0
err=$(build/mecrun programs/inex1-preincarcator.mec --tape-words tests/data/inex-banda-3-cuvinte.mec --start 0010 2>&1 >/dev/null)
echo "$err" | grep -q "oprit: HÂRTIA AGĂȚATĂ" && echo "OK   e2e_inex_halts_on_tape_end" || { echo "FAIL e2e_inex_halts_on_tape_end: $err"; fail=1; }

out=$(build/mecrun programs/retiparire-1962.mec --start 1477 2>/dev/null | head -1)
[ "$out" = "1477  27 0000  30 0000" ] && echo "OK   e2e_retiparire_first_line" || { echo "FAIL e2e_retiparire_first_line: '$out'"; fail=1; }

lines=$(build/mecrun programs/retiparire-1962.mec --start 1477 2>/dev/null | wc -l)
[ "$lines" -eq 39 ] && echo "OK   e2e_retiparire_39_lines" || { echo "FAIL e2e_retiparire_39_lines: $lines"; fail=1; }

tr=$(build/mecrun programs/retiparire-1962.mec --start 1477 --max 3 --trace 2>&1 >/dev/null | head -1)
echo "$tr" | grep -q "^1477 1 27 0000" && echo "OK   e2e_trace_format" || { echo "FAIL e2e_trace_format: '$tr'"; fail=1; }

build/mecrun programs/retiparire-1962.mec --variants shift=32-field,pair=1,interleave=0 --start 1477 --max 10 >/dev/null 2>&1 \
  && echo "OK   e2e_variants_parse" || { echo "FAIL e2e_variants_parse"; fail=1; }

build/mecrun programs >/dev/null 2>&1; rc=$?
[ $rc -ne 0 ] && echo "OK   e2e_mecrun_rejects_directory" || { echo "FAIL e2e_mecrun_rejects_directory: exit $rc"; fail=1; }

: > build/gol.mec; build/mecasm build/gol.mec --listing 0 1777 >/dev/null 2>&1; rc=$?
[ $rc -ne 0 ] && echo "OK   e2e_mecasm_rejects_empty" || { echo "FAIL e2e_mecasm_rejects_empty: exit $rc"; fail=1; }

printf '@prov GHICIT t\n0000  U 0100  A 0100\n0001  O 0001  O 0001\n0100 = 0,75\n' > build/dcr.mec
build/mecrun build/dcr.mec >/dev/null 2>&1; rc=$?
[ $rc -eq 3 ] && echo "OK   e2e_mecrun_exit_on_dcr" || { echo "FAIL e2e_mecrun_exit_on_dcr: exit $rc"; fail=1; }

echo "tests/e2e.sh: gata"
exit $fail
