#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
# Referința pentru programs/src/romexpo.mec — calcul ILUSTRATIV, în spiritul celui efectuat în 1963 pentru cupola
# Romexpo; cifrele nu sunt cele reale. Aceiași pași, în aceeași ordine, cu aritmetica mașinii (mecarith).
#   (fără argumente)  scrie coala în tests/data/romexpo.txt
#   --plausible       compară fiecare coloană cu formula în virgulă mobilă
#
# Cupolă sferică: diametrul D = 93,5 m (public), săgeata f = 24 m (GHICIT), raza sferei R = (a² + f²)/(2f), a = D/2,
# 10 inele la φᵢ = i·φmax/10 (φmax = arcsin(a/R), calculat dinainte: GHICIT), 32 de meridiane (GHICIT).
# Un rând pe inel: i, φᵢ (radiani), rᵢ/100 = R·sin φᵢ/100, cᵢ/100 = 2·rᵢ·sin(π/32)/100 (lungimea elementului de inel).
# Sinusul: aceeași metodă ca tabelul din 1962 (tools/ref/sin_metoda.md), cu 6 termeni: y = sin(2w)/2.
import math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mecarith as A

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'tests/data/romexpo.txt')

A_M, F_M = 46.75, 24.0
R_M = (A_M ** 2 + F_M ** 2) / (2 * F_M)
PHIMAX = math.asin(A_M / R_M)

# Constantele programului (aceleași cuvinte ca în programs/src/romexpo.mec)
AS = A.from_frac(A_M / 100)
FS = A.from_frac(F_M / 100)
DW = A.from_frac(PHIMAX / 20)                   # Δφ/2 pe inel
PI64 = A.from_frac(math.pi / 64)                # (π/32)/2
RATIOS = [A.from_frac(2 / 3), int(1 / 5 * A.UNIT), int(2 / 21 * A.UNIT), int(1 / 18 * A.UNIT), int(2 / 55 * A.UNIT)]
BETA = 5


def sin_half(w):
    """sin(2w)/2, termen cu termen: w² rotunjit (INR), apoi tᵢ = tᵢ₋₁·(w²·rᵢ) trunchiat (IN)."""
    w2 = A.mulr(w, w)
    t = y = w
    for i, r in enumerate(RATIOS):
        q = A.mul(w2, r)[0]
        t = A.mul(t, q)[0]
        y = A.sub(y, t)[0] if i % 2 == 0 else A.add(y, t)[0]
    return y


def rows():
    num = A.add(A.mul(AS, AS)[0], A.mul(FS, FS)[0])[0]   # (a² + f²)/100²
    rs = A.div(num, A.add(FS, FS)[0])[1]                # R/100: D, câtul în I
    s2 = A.shift(19, sin_half(PI64), 0, 2)[0]           # 2·sin(π/32) = 4·y (DS 2)
    w = 0
    out = []
    for i in range(1, 11):
        w = A.add(w, DW)[0]
        y = sin_half(w)
        phi = A.add(w, w)[0]
        r = A.shift(19, A.mul(rs, y)[0], 0, 1)[0]       # r/100 = 2·(R/100)·y (DS 1)
        c = A.mul(r, s2)[0]                             # c/100 = (r/100)·2·sin(π/32)
        out.append((i, phi, r, c, rs))
    return out


def sheet():
    return ''.join(f'{A.fmt134(A.from_int(i), 2)}  {A.fmt135(p, BETA)}  {A.fmt135(r, BETA)}  {A.fmt135(c, BETA)}\n'
                   for i, p, r, c, _ in rows())


def plausible():
    bad = 0
    for i, p, r, c, rs in rows():
        phi = i * PHIMAX / 10
        rr = R_M * math.sin(phi)
        for name, got, want in (('φ', A.to_frac(p), phi), ('r/100', A.to_frac(r), rr / 100),
                                ('c/100', A.to_frac(c), 2 * rr * math.sin(math.pi / 32) / 100), ('R/100', A.to_frac(rs), R_M / 100)):
            if abs(got - want) / abs(want) > 1e-4:
                print(f'inelul {i}: {name} {got} față de {want}'); bad += 1
    print('plauzibil' if not bad else f'{bad} abateri')
    return 1 if bad else 0


if __name__ == '__main__':
    if '--plausible' in sys.argv:
        sys.exit(plausible())
    open(OUT, 'w', encoding='utf-8').write(sheet())
    print(sheet(), end='')
