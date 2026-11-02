# SPDX-License-Identifier: AGPL-3.0-or-later
CC      ?= gcc
CFLAGS  ?= -std=c11 -O2 -g -Wall -Wextra -Werror
CFLAGS  += -Icore
B       := build

CORE_SRC := $(wildcard core/*.c)
CORE_OBJ := $(CORE_SRC:core/%.c=$(B)/core/%.o)
TESTS    := $(patsubst tests/%.c,$(B)/tests/%,$(wildcard tests/test_*.c))
TOOLS    := $(patsubst tools/%.c,$(B)/%,$(wildcard tools/*.c))

.PHONY: all check clean e2e
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

clean:
	rm -rf $(B)
