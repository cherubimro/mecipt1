#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
# Generatorul programelor din programs/src/: pune rutinele INEX-1 în fiecare program de calcul și face banda INEX-1.
#   python3 tools/mecjoin.py           regenerează toate fișierele din RECIPES
#   python3 tools/mecjoin.py --check   iese cu 1 dacă vreun fișier generat nu e la zi (rulat de tests/e2e.sh)
#   python3 tools/mecjoin.py --tape PREÎNCĂRCĂTOR RUTINE   banda pe ieșire, sau eroarea și codul 1
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PRE = 'programs/inex1-preincarcator.mec'
RUT = 'programs/src/inex1-rutine.mec'

# (fel, ieșire, intrări)
RECIPES = [
    ('tape', 'programs/inex1-banda.mec', [PRE, RUT]),
    ('join', 'programs/vidraru.mec', [PRE, RUT, 'programs/src/vidraru.mec']),
    ('join', 'programs/romexpo.mec', [PRE, RUT, 'programs/src/romexpo.mec']),
    ('join', 'programs/sinus-1962.mec', [PRE, RUT, 'programs/src/sinus-1962.mec']),
]

PRELOADER = {0o10, 0o11, 0o12, 0o13, 0o14, 0o15}
WORD = re.compile(r'^\s*([0-7]+)\s')


def read(rel):
    with open(os.path.join(ROOT, rel), encoding='utf-8') as f:
        return f.read()


def words(text):
    """(adresă, linie fără comentariu) pentru fiecare cuvânt din text."""
    out = []
    for line in text.split('\n'):
        code = line.split(';', 1)[0]
        if code.startswith('@') or not code.strip():
            continue
        m = WORD.match(code)
        if not m:
            raise ValueError(f'linie de neînțeles: {line!r}')
        out.append((int(m.group(1), 8), code.strip()))
    return out


def negative(code):
    """Un cuvânt de date cu bitul de semn (nu încape pe bandă: pe bandă intră doar m1–m30)."""
    toks = code.split()
    if len(toks) < 3 or toks[1] != '=':
        return False
    v = toks[2]
    if v.startswith('-'):
        return True
    return v.startswith('o') and len(v) == 12 and v[1] in '1'


def header(inputs):
    return ('; SPDX-License-Identifier: CC-BY-SA-4.0\n'
            f'; GENERAT de tools/mecjoin.py din {" + ".join(inputs)}; nu editați — modificați sursa.\n')


def join(inputs):
    parts = [header(inputs)]
    for rel in inputs:
        body = '\n'.join(l for l in read(rel).split('\n') if not l.startswith('; SPDX-License-Identifier'))
        parts.append(f'\n; ======== {rel} ========\n{body.rstrip()}\n')
    return ''.join(parts)


def tape(pre, rut):
    """Banda INEX-1: cuvintele 0002…N ale rutinelor, cu copiile preîncărcătorului la 0010–0015.
    0014 se perforează „25 0014  01 0001”: preîncărcătorul scrie cuvântul peste propria instrucțiune ME,
    iar MS 0014 îl duce la ME 0015, deci încărcarea continuă fără să se strice."""
    rw = words(read(rut))
    addrs = [a for a, _ in rw]
    bad = [a for a in addrs if a in PRELOADER or a < 2]
    if bad:
        raise ValueError(f'rutinele calcă peste preîncărcător: {", ".join(f"{a:04o}" for a in bad)}')
    neg = [f'{a:04o}' for a, c in rw if negative(c)]
    if neg:
        raise ValueError(f'cuvinte cu semn negativ pe bandă: {", ".join(neg)}')
    have = set(addrs) | PRELOADER
    top = max(have)
    holes = [f'{a:04o}' for a in range(2, top + 1) if a not in have]
    if holes:
        raise ValueError(f'goluri pe bandă: {", ".join(holes)}')
    copies = []
    for a, c in words(read(pre)):
        if a in PRELOADER:
            copies.append('0014  25 0014  01 0001' if a == 0o14 else c)
    return (header([pre, rut]) +
            f'; Banda INEX-1: cuvintele 0002–{top:04o}, în ordinea adreselor, câte 6 rânduri pe cuvânt.\n'
            f'; Se încarcă cu preîncărcătorul original pornit de la 0010 (ME 0002 la 0014).\n\n'
            + '\n'.join(l for l in read(rut).split('\n') if not l.startswith('; SPDX-License-Identifier')).rstrip()
            + '\n\n; Copiile preîncărcătorului (0014 perforat ca ME 0014, vezi mai sus)\n'
            + '@prov ORIGINAL Facsimil 5, Baltac\n' + '\n'.join(copies) + '\n')


def build(kind, inputs):
    return tape(*inputs) if kind == 'tape' else join(inputs)


def main(argv):
    if argv[:1] == ['--tape']:
        try:
            sys.stdout.write(tape(argv[1], argv[2]))
            return 0
        except (ValueError, OSError) as e:
            print(e, file=sys.stderr)
            return 1
    check = '--check' in argv
    stale = []
    for kind, out, inputs in RECIPES:
        text = build(kind, inputs)
        path = os.path.join(ROOT, out)
        if check:
            try:
                cur = read(out)
            except FileNotFoundError:
                cur = None
            if cur != text:
                stale.append(out)
        else:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(text)
    if stale:
        print('nu sunt la zi (rulați python3 tools/mecjoin.py):', ' '.join(stale))
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
