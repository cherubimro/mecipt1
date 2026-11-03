#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
# Referința pentru programs/src/vidraru.mec — calcul ILUSTRATIV, în spiritul celui efectuat pentru barajul Vidraru;
# cifrele nu sunt cele reale. Aceiași pași, în aceeași ordine, cu aritmetica mașinii (mecarith).
#   (fără argumente)  scrie coala în tests/data/vidraru.txt
#   --plausible       compară fiecare coloană cu formula în virgulă mobilă
#
# Metoda arcelor încastrate, simplificată: 11 arce orizontale, k = 0…10, z = k/10, adâncimea h = 166·z m,
# presiunea apei p = h tf/m² (γ = 1 tf/m³), raza arcului R = 160 − 80·z m, grosimea t = 6 + 19·z m,
# forța inelară N = p·R tf/m, efortul σ = N/t tf/m². Dimensiunile publice: înălțimea 166 m, grosimea 6 m la
# coronament și 25 m la bază; cota coronamentului (834 m) și razele sunt GHICITE.
# Coloanele (scalate ca să încapă în fracțiile mașinii): cota (întreg), h/1000 = p/1000, N/10⁶, σ/10⁴.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mecarith as A

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'tests/data/vidraru.txt')

# Constantele programului (aceleași cuvinte ca în programs/src/vidraru.mec)
COTA = A.from_int(834)
DH = -(-166 * A.UNIT // 10000)  # Δh/1000 pe arc (16,6 m), rotunjit în sus: altfel ⌊h⌋ pierde o unitate la h întreg
R0 = A.from_frac(0.160)       # R/1000 la coronament
DR = A.from_frac(0.008)       # ΔR/1000 pe arc
T0 = A.from_frac(0.06)        # t/100 la coronament
DT = A.from_frac(0.019)       # Δt/100 pe arc
MIE = A.from_int(1000)
BETA = 6


def rows():
    hs, rs, ts = 0, R0, T0
    out = []
    for k in range(11):
        h = A.mul(hs, MIE)[0]                 # ⌊h⌋ ca întreg: IN cu 1000·2⁻³⁰
        cota = A.sub(COTA, h)[0]
        ns = A.mul(hs, rs)[0]                 # N/10⁶ = (h/1000)·(R/1000)
        sig = A.div(ns, ts)[1]                # σ/10⁴ = (N/10⁶)/(t/100): D, câtul în I
        out.append((k, cota, hs, ns, sig))
        hs = A.add(hs, DH)[0]
        rs = A.sub(rs, DR)[0]
        ts = A.add(ts, DT)[0]
    return out


def sheet():
    return ''.join(f'{A.fmt134(c, 3)}  {A.fmt135(h, BETA)}  {A.fmt135(n, BETA)}  {A.fmt135(s, BETA)}\n'
                   for _, c, h, n, s in rows())


def plausible():
    bad = 0
    for k, c, h, n, s in rows():
        z = k / 10
        hh, R, t = 166 * z, 160 - 80 * z, 6 + 19 * z
        checks = [('cota', A.to_int(c), 834 - hh, 1.0), ('p/1000', A.to_frac(h), hh / 1000, 1e-3),
                  ('N/1e6', A.to_frac(n), hh * R / 1e6, 1e-3), ('σ/1e4', A.to_frac(s), hh * R / t / 1e4, 1e-3)]
        for name, got, want, tol in checks:
            err = abs(got - want) if name == 'cota' else abs(got - want) / max(abs(want), 1e-12)
            if err > tol and not (want == 0 and abs(got) < 1e-6):
                print(f'arcul {k}: {name} {got} față de {want}'); bad += 1
    print('plauzibil' if not bad else f'{bad} abateri')
    return 1 if bad else 0


if __name__ == '__main__':
    if '--plausible' in sys.argv:
        sys.exit(plausible())
    open(OUT, 'w', encoding='utf-8').write(sheet())
    print(sheet(), end='')
