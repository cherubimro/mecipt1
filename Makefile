# SPDX-License-Identifier: AGPL-3.0-or-later
CC      ?= gcc
CFLAGS  ?= -std=c11 -O2 -g -Wall -Wextra -Werror
CFLAGS  += -Icore
B       := build

CORE_SRC := $(wildcard core/*.c)
CORE_OBJ := $(CORE_SRC:core/%.c=$(B)/core/%.o)
TESTS    := $(patsubst tests/%.c,$(B)/tests/%,$(wildcard tests/test_*.c))
TOOLS    := $(patsubst tools/%.c,$(B)/%,$(wildcard tools/*.c))

.PHONY: all check clean e2e wasm web-check site serve tables
all: $(B)/libmecipt.a $(TOOLS)

$(B)/core/%.o: core/%.c $(wildcard core/*.h)
	@mkdir -p $(dir $@)
	$(CC) $(CFLAGS) -c $< -o $@

$(B)/libmecipt.a: $(CORE_OBJ)
	ar rcs $@ $^

$(B)/tests/%: tests/%.c tests/test.h $(B)/libmecipt.a
	@mkdir -p $(dir $@)
	$(CC) $(CFLAGS) -Itests $< -o $@ $(B)/libmecipt.a -lm

$(B)/%: tools/%.c $(B)/libmecipt.a
	$(CC) $(CFLAGS) $< -o $@ $(B)/libmecipt.a -lm

check: $(TESTS) $(TOOLS)
	@fail=0; for t in $(TESTS); do (cd tests && ../$$t) || fail=1; done; \
	if [ -n "$(wildcard tests/e2e.sh)" ]; then sh tests/e2e.sh || fail=1; fi; \
	exit $$fail

# Tabelele nucleului pentru documentația web.
tables: $(B)/mecdoc
	$(B)/mecdoc > web/data/core-tables.json

# WebAssembly: același nucleu, compilat cu clang + wasi-sysroot 21 (fără Emscripten).
WASM_CC ?= clang-17
WASI    := third_party/wasi
wasm: $(B)/mecipt.wasm
$(B)/mecipt.wasm: $(CORE_SRC) $(wildcard core/*.h) tools/fetch-wasi.sh
	sh tools/fetch-wasi.sh
	@mkdir -p $(B)
	$(WASM_CC) --target=wasm32-wasi --sysroot=$(WASI)/wasi-sysroot -std=c11 -O2 -Wall -Wextra -Werror -Icore \
	  -nostartfiles -nodefaultlibs -Wl,--no-entry -Wl,--export-dynamic $(CORE_SRC) -lc \
	  $(WASI)/lib/wasi/libclang_rt.builtins-wasm32.a -o $@

web-check: site
	node --test tests/web/
	sh tests/web-smoke.sh

# Site-ul static: web/ fără package.json, plus nucleul WASM și programele.
site: $(B)/mecipt.wasm
	rm -rf $(B)/site
	cp -r web $(B)/site
	rm -f $(B)/site/package.json
	cp $(B)/mecipt.wasm $(B)/site/
	cp programs/*.mec tests/data/inex-banda-3-cuvinte.mec $(B)/site/programs/

serve: site
	cd $(B)/site && python3 -m http.server 8000 --bind 127.0.0.1

clean:
	rm -rf $(B)
