# SPDX-License-Identifier: AGPL-3.0-or-later
# Modelul aritmeticii MECIPT-1, întocmai ca în core/word.c și core/machine.c: cuvinte de 31 de biți,
# fracții în complement față de unu (m0 = semnul). Verificat contra nucleului de tests/test_arith_model.c.
import math

MASK31 = (1 << 31) - 1
MASK30 = (1 << 30) - 1
MASK61 = (1 << 61) - 1
UNIT = 1 << 30

def is_neg(w): return (w >> 30) & 1
def is_zero(w): w &= MASK31; return w == 0 or w == MASK31
def neg(w): return ~w & MASK31
def abs_(w): return neg(w) if is_neg(w) else w & MASK31

def add(a, b):
    a &= MASK31; b &= MASK31
    s = a + b
    if s & (1 << 31): s = (s & MASK31) + 1          # transport circular
    s &= MASK31
    ovf = int(is_neg(a) == is_neg(b) and is_neg(s) != is_neg(a))
    return s, ovf

def sub(a, b): return add(a, neg(b))

def mul(s, y):
    """IN: produsul dublu; semnul și partea de sus în S, partea de jos în I (complementate dacă e negativ)."""
    n = is_neg(s) != is_neg(y)
    p = abs_(s) * abs_(y)
    hi, lo = (p >> 30) & MASK30, p & MASK30
    return (neg(hi), ~lo & MASK30) if n else (hi, lo)

def mulr(s, y):
    """INR: rotunjire la jumătate în sus, pe modul."""
    n = is_neg(s) != is_neg(y)
    r = ((abs_(s) * abs_(y) + (1 << 29)) >> 30) & MASK30
    return neg(r) if n else r

def div(s, y, I=0):
    """D: I ← s:y, S ← restul cu semnul lui s; |s| ≥ |y| → depășire (S, I neschimbate)."""
    ms, my = abs_(s), abs_(y)
    if my == 0 or ms >= my: return s, I, 1
    q, r = (ms << 30) // my, (ms << 30) % my
    n = is_neg(s) != is_neg(y)
    I2 = (~q & MASK30) if n else (q & MASK30)
    S2 = neg(r) if is_neg(s) else r
    return S2, I2, 0

def shift(code, S, I, n):
    """17 DLS, 18 DLD (S & I, 61 de biți), 19 DS, 20 DD (doar S). Logic: intră zerouri, ies biți."""
    if n < 0: n = 0
    if code in (19, 20):
        s = S
        s = 0 if n >= 31 else (s << n if code == 19 else s >> n)
        return s & MASK31, I
    x = (S << 30) | (I & MASK30)
    x = 0 if n >= 61 else (x << n if code == 17 else x >> n)
    x &= MASK61
    return (x >> 30) & MASK31, x & MASK30

def land(s, y): return s & y & MASK31

def from_frac(x):
    """Ca mec_from_double: rotunjire la cel mai apropiat (jumătatea în sus pe modul), plafonat la 1 − 2⁻³⁰."""
    m = min(math.floor(abs(x) * UNIT + 0.5), MASK30)
    return neg(m) if x < 0 else m

def to_frac(w):
    m = abs_(w) / UNIT
    return -m if is_neg(w) and m != 0 else m

def from_int(n):
    return neg(-n) if n < 0 else n

def to_int(w):
    return -abs_(w) if is_neg(w) and not is_zero(w) else abs_(w)

def digits(w, beta=9, conv='trunc'):
    """Zecimalele lui |w| (fracție), cu „o” pentru zero. conv: 'trunc' (cifră cu cifră, exact) sau 'round'."""
    m = abs_(w)
    if conv == 'round':
        v = (m * 10**beta + (1 << 29)) >> 30
        v = min(v, 10**beta - 1)
    else:
        v = (m * 10**beta) >> 30
    return str(v).rjust(beta, '0').replace('0', 'o')

def fmt135(w, beta=9, conv='trunc'):
    sign = '-' if is_neg(w) and not is_zero(w) else ''
    return f'{sign}o,{digits(w, beta, conv)}-'

def fmt134(w, alpha=3):
    n = to_int(w)
    body = str(abs(n)).rjust(alpha).replace('0', 'o')
    return ('-' if n < 0 else '') + body
