#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
# Vectori de test pentru tests/test_arith_model.c: modelul Python contra nucleului C.
import random, sys, os
sys.path.insert(0, os.path.dirname(__file__))
import mecarith as A

EDGE = [0, A.MASK31, 1, A.neg(1), A.MASK30, A.neg(A.MASK30), 1 << 29, A.neg(1 << 29), 3 << 28, A.neg(3 << 28)]

def word(r):
    return r.choice(EDGE) if r.random() < 0.15 else r.getrandbits(31)

def vec(code, y, n, S, I):
    if code in (5, 6):
        S2, o = (A.add if code == 5 else A.sub)(S, y); I2 = I
    elif code == 9: (S2, I2), o = A.mul(S, y), 0
    elif code == 10: S2, I2, o = A.mulr(S, y), I, 0
    elif code == 11: S2, I2, o = A.div(S, y, I)
    elif code in (17, 18, 19, 20): (S2, I2), o = A.shift(code, S, I, n), 0
    elif code == 25: S2, I2, o = A.land(S, y), I, 0
    return f'{code} {y:o} {n:o} {S:o} {I:o} -> {S2:o} {I2:o} {o}'

def main():
    r = random.Random(1962)
    out = []
    for code in (5, 6, 9, 10, 11, 17, 18, 19, 20, 25):
        for _ in range(250):
            y, S, I = word(r), word(r), r.getrandbits(30)
            n = r.choice([0, 1, 3, 4, 5, 30, 31, 32, 60, 61, 62]) if r.random() < 0.3 else r.randrange(0, 64)
            if code == 11 and r.random() < 0.7:            # mai multe împărțiri fără depășire
                S = (A.abs_(S) >> r.randrange(1, 8)) | (S & (1 << 30))
            out.append(vec(code, y, n if code in (17, 18, 19, 20) else 0, S, I))
    print('\n'.join(out))

if __name__ == '__main__':
    main()
