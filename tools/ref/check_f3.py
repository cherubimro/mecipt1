#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
# Verifică transcrierea Facsimilului 3 (tabelul de sinus din 21.02.1962): 9 rânduri × 5 numere „o,ddddddddd-”,
# fiecare la cel mult 1·10⁻⁸ de sin n°. O diferență mai mare înseamnă aproape sigur o cifră citită greșit.
import math, re, sys

def numbers(text):
    return re.findall(r'o,([o0-9]{9})-', text)

def main(path):
    text = open(path, encoding='utf-8').read()
    lines = text.split('\n')
    ok = len(lines) == 10 and lines[-1] == '' and all(len(numbers(l)) == 5 and len(l) == 60 for l in lines[:9])
    if not ok:
        print('forma greșită: trebuie 9 rânduri a câte 5 numere „o,ddddddddd-”')
        return 1
    bad = 0
    for n, d in enumerate(numbers(text), 1):
        x = int(d.replace('o', '0')) / 1e9
        if abs(x - math.sin(math.radians(n))) > 1e-8:
            print(f'sin {n}°: {d} diferă cu {x - math.sin(math.radians(n)):+.2e}')
            bad += 1
    return 1 if bad else 0

if __name__ == '__main__':
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else 'tests/data/facsimil3-sinus.txt'))
