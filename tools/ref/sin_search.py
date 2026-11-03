#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
# Căutarea metodei de sinus care reproduce Facsimilul 3 (tabelul din 21.02.1962), în modelul aritmeticii mașinii.
#   --selftest  sinusul exact (rotunjit) nu reproduce facsimilul; tabelul erorilor în unități 2⁻³⁰
#   --best      metoda aleasă (tools/ref/sin_metoda.md) și scorul ei
#   --export    scrie coala metodei alese în tests/data/sinus-model.txt
#   --search    reface căutarea exhaustivă în familia aleasă (durează câteva minute)
import math, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mecarith as A

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FACS = os.path.join(ROOT, 'tests/data/facsimil3-sinus.txt')
U = A.UNIT

# Metoda aleasă (vezi sin_metoda.md): w = n·HW (π/360 trunchiat), y ≈ sin(2w)/2 = sin(n°)/2 termen cu termen.
HW = int(math.pi / 360 * U)                      # 9370165 = o43575465
RATIOS = [4 / ((2 * i) * (2 * i + 1)) for i in range(1, 6)]   # 2/3, 1/5, 2/21, 1/18, 2/55
BEST = dict(nterms=5, w2='INR', ratio_round=(True, False, False, False), q='IN', t='IN', final=-1)


def facsimile():
    return re.findall(r'o,[o0-9]{9}-', open(FACS, encoding='utf-8').read())


def ratio_words(rr):
    return [A.from_frac(r) if rnd else int(r * U) for r, rnd in zip(RATIOS, rr)]


def mul(kind, a, b):
    return A.mulr(a, b) if kind == 'INR' else A.mul(a, b)[0]


def sin_word(n, p=BEST):
    """Cuvântul tipărit pentru sin n°, calculat exact ca programul: k = 2y + final."""
    w = n * HW                                    # adunări repetate, exacte
    w2 = mul(p['w2'], w, w)
    r = ratio_words(p['ratio_round'])
    t, y = w, w
    for i in range(p['nterms'] - 1):
        q = mul(p['q'], w2, r[i])
        t = mul(p['t'], t, q)
        y = A.sub(y, t)[0] if i % 2 == 0 else A.add(y, t)[0]
    k = A.shift(19, y, 0, 1)[0]                   # DS 1: 2y
    return A.add(k, A.from_int(p['final']))[0]   # 2y − 1


def sin_candidate(p=BEST):
    return [A.fmt135(sin_word(n, p), 9) for n in range(1, 46)]


def sheet(nums):
    return ''.join(''.join(nums[i:i + 5]) + '\n' for i in range(0, 45, 5))


def score(nums):
    return sum(a == b for a, b in zip(nums, facsimile()))


def diffs(nums):
    return [(n, f, c) for n, (f, c) in enumerate(zip(facsimile(), nums), 1) if f != c]


def selftest():
    exact = [A.fmt135(A.from_frac(math.sin(math.radians(n))), 9) for n in range(1, 46)]
    print(f'sinusul exact, rotunjit la 2⁻³⁰: {score(exact)}/45 (facsimilul nu e sinusul exact)')
    print(' n   facsimil     eroare (2⁻³⁰)')
    for n, f in enumerate(facsimile(), 1):
        d = int(f[2:11].replace('o', '0'))
        print(f'{n:2d}  {f}  {d / 1e9 * U - math.sin(math.radians(n)) * U:+6.2f}')
    return 0 if score(exact) < 45 else 1


def search():
    """Familia termen-cu-termen: fiecare înmulțire IN sau INR, fiecare raport trunchiat sau rotunjit, 5–7 termeni."""
    fac = facsimile()
    best = (0, None)
    for nt in (5, 6, 7):
        global RATIOS
        RATIOS = [4 / ((2 * i) * (2 * i + 1)) for i in range(1, nt)]
        for rmask in range(2 ** (nt - 1)):
            rr = tuple(bool((rmask >> i) & 1) for i in range(nt - 1))
            for w2 in ('IN', 'INR'):
                for q in ('IN', 'INR'):
                    for t in ('IN', 'INR'):
                        for final in (-1, 0, 1):
                            p = dict(nterms=nt, w2=w2, ratio_round=rr, q=q, t=t, final=final)
                            s = sum(a == b for a, b in zip(sin_candidate(p), fac))
                            if s > best[0]:
                                best = (s, p)
    print(best)
    return 0


def main(argv):
    if '--selftest' in argv:
        return selftest()
    if '--search' in argv:
        return search()
    nums = sin_candidate()
    if '--export' in argv:
        with open(os.path.join(ROOT, 'tests/data/sinus-model.txt'), 'w', encoding='utf-8') as f:
            f.write(sheet(nums))
    print(f'metoda: {BEST}')
    print(f'scor: {score(nums)}/45')
    for n, f, c in diffs(nums):
        print(f'  sin {n}°: facsimil {f}  metoda {c}  (adevărat {math.sin(math.radians(n)):.10f})')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
