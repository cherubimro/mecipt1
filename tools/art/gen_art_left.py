# SPDX-License-Identifier: AGPL-3.0-or-later
# Generează web/data/art-left.json (rulat din rădăcina proiectului: python3 tools/art/gen_art_left.py web/data/art-left.json).
import json, sys, numpy as np
from PIL import Image

T = 'surse/3d/panouri-indreptate/panou-stang.png'
im = np.asarray(Image.open(T).convert('L')).astype(float)
items = []

def snap_y(x, y, r=7):
    best, by = 1e9, y
    for yy in range(int(y) - r, int(y) + r + 1):
        v = im[yy, int(x) - 3:int(x) + 4].mean()
        if v < best: best, by = v, yy
    return by

def snap_x(x, y, r=7):
    best, bx = 1e9, x
    for xx in range(int(x) - r, int(x) + r + 1):
        v = im[int(y) - 3:int(y) + 4, xx].mean()
        if v < best: best, bx = v, xx
    return bx

def hline(x0, x1, y, step=180, w=3):
    xs = list(range(int(x0), int(x1), step)) + [x1]
    pts = [(x, snap_y(min(max(x, x0 + 4), x1 - 4), y)) for x in xs]
    for (a, ya), (b, yb) in zip(pts, pts[1:]):
        items.append({'t': 'line', 'x1': a, 'y1': ya, 'x2': b, 'y2': yb, 'w': w})

def vline(x, y0, y1, step=180, w=3):
    ys = list(range(int(y0), int(y1), step)) + [y1]
    pts = [(snap_x(x, min(max(y, y0 + 4), y1 - 4)), y) for y in ys]
    for (xa, a), (xb, b) in zip(pts, pts[1:]):
        items.append({'t': 'line', 'x1': xa, 'y1': a, 'x2': xb, 'y2': b, 'w': w})

def text(x, y, s, t, anchor='middle', w=None, uncertain=False, cell=None, color='ink'):
    it = {'t': 'text', 'x': round(x, 1), 'y': round(y, 1), 's': s, 'text': t, 'anchor': anchor, 'color': color}
    if w: it['w'] = w
    if uncertain: it['uncertain'] = True
    if cell: it['cell'] = cell
    items.append(it)

def pulse(x0, x1, ybase, ytop, up=True, w=3, foot=8):
    # simbolul ⎍ (impuls pozitiv) sau ⊔ (negativ): glifă, nu linie de chenar
    items.append({'t': 'pulse', 'x0': x0, 'x1': x1, 'y0': ybase if up else ytop, 'y1': ytop if up else ybase,
                  'foot': foot, 'w': w})

# ---- grila mare ⎍ (16 × 3) ----
COLS = [134, 222, 311, 401, 490, 580, 669, 760, 849, 939, 1029, 1119, 1209, 1299, 1390, 1481, 1573]
ROWS = [612, 702, 792, 882]
hline(127, 1578, 563); hline(127, 1578, 888)
vline(127, 563, 888); vline(1578, 563, 888)
hline(134, 1573, 568); hline(134, 1573, 612); hline(134, 1573, 702); hline(134, 1573, 792); hline(134, 1573, 882)
vline(134, 568, 882); vline(1573, 568, 882)
WORN = {760: [(612, 852), (852, 882)], 1029: [(612, 739), (739, 781), (781, 882)]}
for x in COLS[1:-1]:
    if x in WORN:
        for k, (a, b) in enumerate(WORN[x]):
            n0 = len(items); vline(x, a, b, step=100)
            if k % 2: [it.__setitem__('worn', True) for it in items[n0:]]
    else:
        vline(x, 612, 882, step=100)
pulse(845.5, 855.5, 604, 578, up=True)

# ---- grila mică ⊔ (3 × 3) ----
SC = [1632, 1724, 1816, 1907]
hline(1628, 1912, 562); hline(1628, 1912, 888)
vline(1628, 562, 888); vline(1912, 562, 888)
hline(1632, 1907, 567); hline(1632, 1907, 612); hline(1632, 1907, 702); hline(1632, 1907, 792); hline(1632, 1907, 883)
vline(1632, 567, 883); vline(1907, 567, 883)
n0 = len(items); vline(1816, 612, 738); [it.__setitem__('worn', True) for it in items[n0:]]
vline(1816, 738, 883)
vline(1724, 612, 883, step=100)
pulse(1763, 1773, 603, 578, up=False)

def cx(col):
    if col <= 16:
        return (COLS[col - 1] + COLS[col]) / 2
    c = col - 16
    return (SC[c - 1] + SC[c]) / 2

S = 11.5
def cell(row, col, lines, head=None, uncertain=False):
    x = cx(col)
    if head:
        text(x, 627, S, head, cell=[row, col, 'head'])
    n = lines.count('\n') + 1
    if row == 1:
        y = 691 - 18 * (n - 1)
    elif row == 2:
        y = 758 if n > 1 else 763
    else:
        y = 846
    text(x, y, S, lines, cell=[row, col], uncertain=uncertain)

cell(1, 1, 's trece in M', uncertain=True)
cell(1, 2, 's trece in I')
cell(1, 3, 'i trece in S')
cell(1, 4, 'Inmulțire\nlogică')
cell(1, 5, 'Stinga in S\nI. trece in S.', head='Deplasare')
cell(1, 6, 'Dreapta in S\nZero trece in S.', head='Deplasare')
cell(1, 7, 'Stinga in I\nZero trece in I.', head='Deplasare')
cell(1, 8, 'Dreapta in I\nS. trece in I.', head='Deplasare')
cell(1, 9, 'Schimbă M.')
cell(1, 10, 'Dacă M. = 1\nschimbă M in M̄')
cell(1, 11, 'in M̄ afară\nde M.', head='Schimbă M', uncertain=True)
cell(1, 12, 'Dacă S. = 1\nschimbă S in S̄')
cell(1, 13, 'Dacă α = 1\nschimbă S in S̄')
cell(1, 14, 'Dacă β = 1\nschimbă S in S̄')
cell(1, 15, 'Mută RAI')
cell(1, 16, '2(ra) trece\nin RAI')
cell(2, 1, '(ra)/2 trece in RA')
cell(2, 2, 'Pune numărăto-\nrul pe 2 și N=0', uncertain=True)
cell(2, 3, 'Mută numă-\nrătorul')
cell(2, 4, '(ra) trece in\nnumărător N')
cell(2, 5, 'Instrucția 2\ntrece in locul 1')
cell(2, 6, 'ra trece in RI')
cell(2, 7, 'S. trece in α')
cell(2, 8, 'Dacă S. = M., β = 0\nDacă S. ≠ M., β = 1')
cell(2, 9, 'Dacă s = 0 și i = 0\npune β = 0', uncertain=True)
cell(2, 10, 'Dacă i = 0\npune β = 0', uncertain=True)
cell(2, 11, 'Dacă s = 0\npune α = 0')
cell(2, 12, 'Dacă s = 0 și i = 0\npune S. = 1', uncertain=True)
cell(2, 13, 'Dacă s = 0\npune I. = 1')
cell(2, 14, 'S̄. trece in I.')
cell(2, 15, 'β trece in I.')
cell(2, 16, 'S. trece in S.')
cell(3, 1, 'Dacă β = 0 și\nS. ≠ α , DCR', uncertain=True)
cell(3, 2, 'Dacă I. = 1\nDCR', uncertain=True)
cell(3, 3, 'Dacă S. ≠ S.\nDCR', uncertain=True)
text(cx(17), 691, S, 'Zero trece in M.', cell=[1, 17])
text(cx(18), 691, S, 'Unu trece in M.', cell=[1, 18])
text(cx(19), 691, S, 'Zero trece in γ', cell=[1, 19])
text(cx(17), 779, S, 'Unu trece in γ', cell=[2, 17])

# ---- GENERATOR PRINCIPAL ----
hline(125, 721, 942); hline(119, 721, 1255)
vline(122, 942, 1255, step=100); vline(720, 942, 1255, step=100)
hline(152, 406, 1181); hline(435, 557, 1181); hline(571, 693, 1181)
for x in (152, 241, 405, 435, 556, 571, 692):
    vline(x, 1181, 1255)
text(248, 982, 34, 'GENERATOR PRINCIPAL', 'start', w=357)
text(305, 1017, 9, 'NUMAI p', uncertain=True)
text(195, 1017, 9, 'INCI p INCI q', uncertain=True)
text(539, 997, 9, 'DECLANSARE\nMANUALA SAU\nDE LA GENER.\nEXTERN', uncertain=True)
items[-1]['lh'] = 9.5
text(587, 990, 22, '1'); text(627, 992, 22, '2'); text(663, 1010, 22, '3')
text(249, 1147, 19, 'IMPULSURI')
text(426, 1148, 20, 'FRECVENȚĂ'); text(426, 1161, 11, 'FIN')
text(605, 1148, 20, 'FRECVENȚĂ'); text(605, 1162, 11, 'TREPTE')
text(498, 1210, 22, 'p'); text(633, 1210, 22, 'q')
text(361, 1241, 9, 'GENERATOR EXTERN', uncertain=True)
pulse(461, 467, 1245, 1231, up=False, w=2, foot=4); pulse(524, 530, 1245, 1231, up=True, w=2, foot=4)
pulse(601, 607, 1245, 1231, up=False, w=2, foot=4); pulse(662, 668, 1245, 1231, up=True, w=2, foot=4)

# ---- R II ----
items.append({'t': 'rect', 'x': 211, 'y': 1316, 'w': 422, 'h': 62, 'sw': 3})
text(177, 1360, 36, 'RII')
for x, n in zip([240, 303, 362, 421, 481, 543, 602], [64, 32, 16, 8, 4, 2, 1]):
    text(x, 1300, 22, str(n))

for x, y in ((72, 997), (1010, 997), (1962, 997), (1010, 537), (1010, 1458)):
    items.append({'t': 'screw', 'x': x, 'y': y})

art = {'viewBox': [0, 372, 2048, 1340], 'face': '#e2dcc2',
       'source': 'trasat după textura panoului stâng (surse/3d/panouri-indreptate/panou-stang.png)',
       'items': items}
json.dump(art, open(sys.argv[1], 'w'), ensure_ascii=False, indent=0)
print(len(items), 'items')
