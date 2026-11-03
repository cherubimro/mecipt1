# SPDX-License-Identifier: AGPL-3.0-or-later
# Generează web/data/art-right.json (rulat din rădăcina proiectului: python3 tools/art/gen_art_right.py web/data/art-right.json).
import json, sys, numpy as np
from PIL import Image

T = 'surse/3d/panouri-indreptate/panou-drept.png'
im = np.asarray(Image.open(T).convert('L')).astype(float)
items = []

def snap_y(x, y, r=9):
    best, by = 1e9, y
    for yy in range(int(y) - r, int(y) + r + 1):
        v = im[yy, int(x) - 3:int(x) + 4].mean()
        if v < best: best, by = v, yy
    return by

def snap_x(x, y, r=9):
    best, bx = 1e9, x
    for xx in range(int(x) - r, int(x) + r + 1):
        v = im[int(y) - 3:int(y) + 4, xx].mean()
        if v < best: best, bx = v, xx
    return bx

def hline(x0, x1, y, color='ink', step=200):
    xs = list(range(int(x0), int(x1), step)) + [x1]
    pts = [(x, snap_y(min(max(x, x0 + 4), x1 - 4), y)) for x in xs]
    for (a, ya), (b, yb) in zip(pts, pts[1:]):
        it = {'t': 'line', 'x1': a, 'y1': ya, 'x2': b, 'y2': yb, 'w': 3}
        if color != 'ink': it['color'] = color
        items.append(it)

def vline(x, y0, y1, color='ink', step=200):
    ys = list(range(int(y0), int(y1), step)) + [y1]
    pts = [(snap_x(x, min(max(y, y0 + 4), y1 - 4)), y) for y in ys]
    for (xa, a), (xb, b) in zip(pts, pts[1:]):
        it = {'t': 'line', 'x1': xa, 'y1': a, 'x2': xb, 'y2': b, 'w': 3}
        if color != 'ink': it['color'] = color
        items.append(it)

def rect(x0, y0, x1, y1):
    items.append({'t': 'rect', 'x': x0, 'y': y0, 'w': x1 - x0, 'h': y1 - y0, 'sw': 3})

def text(x, y, s, t, anchor='middle', color='ink', w=None, uncertain=False):
    it = {'t': 'text', 'x': round(x, 1), 'y': round(y, 1), 's': s, 'text': t, 'anchor': anchor, 'color': color}
    if w: it['w'] = w
    if uncertain: it['uncertain'] = True
    items.append(it)

# ---- registrul M și RI/RA ----
hline(86, 1955, 612)
hline(86, 1955, 736)
vline(86, 612, 736)
vline(1955, 612, 958)
vline(145, 736, 900, 'red')
vline(445, 736, 900)
vline(748, 736, 962)
vline(1358, 736, 958)
hline(145, 445, 841, 'red')
hline(748, 1358, 837, 'red')
hline(145, 1955, 900)
hline(325, 748, 962)
vline(325, 900, 962)
hline(1358, 1955, 957)

def bow(x):  # linia de bază a cifrelor 0–30 urmează curbura texturii
    return np.interp(x, [118, 1024, 1922], [599, 592, 600])
for i in range(31):
    x = 118 + 60.13 * i
    text(x, bow(x), 28, str(i))
text(932, 564, 27, '1')
text(57, 640, 12, 'REGISTRUL')
text(57, 661, 12, 'MEMORIE')
text(57, 727, 34, 'M')
text(86, 877, 20, 'REGISTRUL')
text(86, 905, 20, 'INSTRUCȚII')
text(86, 966, 34, 'RI')
text(292, 947, 34, 'RI')
text(225, 794, 30, 'CODUL 2', 'start', 'red', 144)
text(524, 791, 29, 'CODUL 1', 'start', 'ink', 139)
text(947, 789, 28, 'ADRESA 2', 'start', 'red', 224)
text(1550, 790, 29, 'ADRESA 1', 'start', 'ink', 214)
text(1661, 867, 36, 'RA')
for x, n in zip([174, 233, 292, 353, 414], [16, 8, 4, 2, 1]):
    text(x, 831, 22, str(n), color='red')
for x, n in zip([779, 840, 902, 963, 1024, 1087, 1146, 1208, 1268, 1329], [512, 256, 128, 64, 32, 16, 8, 4, 2, 1]):
    text(x, 827, 22, str(n), color='red')
for x, n in zip([353, 414, 474, 534, 595, 656, 716], [64, 32, 16, 8, 4, 2, 1]):
    text(x, 987, 23, str(n))
for x, n in zip([1390, 1450, 1510, 1571, 1630, 1691, 1749, 1808, 1867, 1925], [512, 256, 128, 64, 32, 16, 8, 4, 2, 1]):
    text(x, 982, 22, str(n))

# ---- RAI, instrucțiile, comenzile ----
hline(234, 842, 1068)
hline(234, 842, 1190)
vline(234, 1068, 1190)
hline(842, 1086, 1066)
hline(842, 1086, 1252)
vline(842, 1066, 1252)
vline(903, 1138, 1252)
vline(963, 1066, 1252)
vline(1026, 1138, 1252)
vline(1085, 1066, 1252)
text(67, 1096, 22, 'REG DE ADRESA', 'start', w=151)
text(67, 1140, 22, 'A', 'start')
text(105, 1140, 22, 'INSTRUCTIEI', 'start', w=113)
text(158, 1190, 38, 'RAI')
for x, n in zip([266, 326, 384, 444, 506, 567, 627, 688, 749, 809], [512, 256, 128, 64, 32, 16, 8, 4, 2, 1]):
    text(x, 1215, 22, str(n))
for x, lab, n in ((872, 'INSTRUCTIA', '1'), (933, 'INSTRUCTIA', '2')):
    text(x, 1213, 12, lab, w=55)
    text(x, 1241, 26, n)
for x, lab in ((994, 'TAMBUR'), (1055, 'FERITE')):
    text(x, 1213, 12, 'MEMORIE')
    text(x, 1231, 12, lab)

rect(1132, 1065, 1739, 1189)
for x in (1208, 1284, 1360, 1435, 1511, 1586, 1661):
    vline(x, 1142 if x == 1661 else 1118, 1189)
cells = [1170, 1246, 1322, 1397.5, 1473, 1548.5, 1623.5, 1700]
for c, big in zip(cells[:3], ('RAI', 'M', 'S')):
    text(c, 1135, 15, 'ANULEAZA')
    text(c, 1168, 28, big)
text(cells[3], 1135, 15, 'INTRODUCE')
text(cells[3], 1147, 13, '7CATEG.DIN')
text(cells[3], 1172, 17, 'RA în RI')
text(cells[4], 1135, 15, 'INTRODUCE')
text(cells[4], 1168, 25, 'M în I')
text(cells[5], 1135, 15, 'INTRODUCE')
text(cells[5], 1168, 25, 'M în RI')
text(cells[6], 1135, 15, 'ADUNARE')
text(cells[6], 1168, 28, '1')
text(cells[7], 1135, 15, 'M+S')
text(cells[7], 1168, 28, '2')
for x in (1170, 1247, 1323, 1399, 1474, 1549, 1623, 1698):
    items.append({'t': 'dot', 'x': x, 'y': 1050, 'r': 8})

# ---- grupurile de jos ----
rect(507, 1298, 661, 1483)
vline(584, 1389, 1483)
text(583, 1333, 33, 'MEMORIE')
text(545, 1461, 18, 'SCRIERE')
text(622, 1461, 18, 'CITIRE')
rect(689, 1298, 844, 1483)
text(758, 1331, 31, 'IMPULSURI')
text(834, 1331, 24, 'p')
text(725, 1418, 14, 'INTRERUPE', uncertain=True)
text(800, 1418, 14, 'RESTABILESTE')
items.append({'t': 'dot', 'x': 812, 'y': 1388, 'r': 20})
rect(872, 1298, 1028, 1483)
vline(950, 1390, 1483)
text(950, 1311, 12, 'IN CAZ DE DEPASIREA')
text(950, 1328, 12, 'CAPACITATII REGISTRULUI')
text(912, 1452, 16, 'SE')
text(988, 1452, 16, 'NU SE')
text(911, 1472, 16, 'OPRESTE')
text(988, 1472, 16, 'OPRESTE')
rect(1086, 1297, 1544, 1481)
for x in (1178, 1270, 1361):
    vline(x, 1297, 1481)
vline(1452, 1384, 1481)
text(1134, 1338, 15, 'DEPASIT')
text(1134, 1443, 15, 'CAPACITATEA')
text(1134, 1468, 15, 'REGISTRULUI')
text(1224, 1443, 15, 'HIRTIA')
text(1224, 1468, 15, 'AGATATA')
text(1316, 1461, 36, 'OPRIT')
text(1450, 1323, 26, 'CALCULEAZA')
text(1407, 1464, 15, 'AUTOMAT')
text(1492, 1452, 15, 'INSTRUCTIE')
text(1492, 1469, 15, 'UNICA')

for x, y in ((1024, 537), (1018, 1038), (33, 1044), (2003, 1038), (1020, 1542)):
    items.append({'t': 'screw', 'x': x, 'y': y})

art = {'viewBox': [0, 372, 2048, 1340], 'face': '#e2dcc2',
       'source': 'trasat după textura panoului drept (surse/3d/panouri-indreptate/panou-drept.png)',
       'items': items}
json.dump(art, open(sys.argv[1], 'w'), ensure_ascii=False, indent=0)
print(len(items), 'items')
