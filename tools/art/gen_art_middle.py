# SPDX-License-Identifier: AGPL-3.0-or-later
# Generează web/data/art-middle.json (rulat din rădăcina proiectului: python3 tools/art/gen_art_middle.py web/data/art-middle.json).
import json, sys
# Coordonatele din fotografia din 2011 (2800 × 2200), decupaj cu originea (880, 350):
# fața albastră e x 55–950, y 45–480 în decupaj. Se scalează la viewBox 2600 × 1340.
SX, SY = 2600 / 895, 1340 / 435
K = (SX + SY) / 2
X = lambda cx: round((cx - 55) * SX, 1)
Y = lambda cy: round((cy - 45) * SY, 1)
items = []
M = [((157, 137), 85, 'round-large', -50), ((338, 148), 58, 'round', 35), ((493, 148), 58, 'round', -40),
     ((647, 148), 58, 'round', -35),
     ((162, 297), 60, 'arc', -10), ((345, 298), 62, 'arc', -15), ((501, 298), 59, 'arc', -5),
     ((657, 297), 59, 'arc', 0),
     ((354, 425), 38, 'small', -10), ((512, 424), 38, 'small', 5), ((667, 423), 37, 'small', 0)]
for i, ((cx, cy), r, st, nd) in enumerate(M):
    it = {'t': 'meter', 'id': 'meter-%d' % i, 'x': X(cx), 'y': Y(cy), 'r': round(r * K, 1), 'style': st, 'needle': nd}
    if i == 5:
        it['note'] = 'lipsește în fotografia din 2011 (rama goală); prezent în fotografia din 1961'
    items.append(it)
items.append({'t': 'knob', 'id': 'selector', 'x': X(162), 'y': Y(425), 'k': round(28 * K / 30, 2)})
items.append({'t': 'rotary', 'id': 'power', 'x': X(803), 'y': Y(260), 'k': round(40 * K / 30, 2)})
items.append({'t': 'fuse', 'x': X(790), 'y': Y(115), 'k': round(K * 0.62, 2)})
items.append({'t': 'toggle', 'id': 'toggle-0', 'x': X(869), 'y': Y(115), 'k': round(K * 0.62, 2)})
items.append({'t': 'toggle', 'id': 'toggle-1', 'x': X(815), 'y': Y(408), 'k': round(K * 0.62, 2)})
items.append({'t': 'socket', 'x': X(897), 'y': Y(408), 'k': round(K * 0.62, 2)})
items.append({'t': 'dot', 'x': X(884), 'y': Y(260), 'r': round(5 * K, 1)})
art = {'viewBox': [0, 0, 2600, 1340], 'face': '#4a7cad',
       'source': 'măsurat pe fotografia din 2011 (Turbojet, CC BY-SA 4.0); scalele aparatelor nu se citesc (GHICIT)',
       'items': items}
json.dump(art, open(sys.argv[1], 'w'), ensure_ascii=False, indent=0)
print(len(items), 'items')
