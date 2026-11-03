#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
"""Verifică desenul unui panou (web/data/art-*.json) față de textura lui.

    python3 tools/check_art.py PANOU.png art.json [--overlay out.png]

Pentru fiecare `line` și pentru laturile fiecărui `rect` se ia câte un punct la 4 px. Un punct
„lovește” dacă în raza de 3 px există un pixel cu luminanța < mediana panoului − 40. Iese cu
cod 1 dacă vreo linie are scorul (puncte lovite / puncte) sub 0,8 și le listează. Liniile marcate
"worn": true (porțiuni tocite pe panoul real, desenate întregi) nu se notează, doar se numără.
`--overlay` desenează liniile (roșu) și textele (Barlow, albastru) peste textura estompată,
redusă la 1000 px.
"""
import json
import math
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

FONT = 'web/fonts/BarlowSemiCondensed-Medium.ttf'
STEP, RADIUS, DARK, MIN_SCORE = 4, 3, 40, 0.8


def segments(art):
    for i, it in enumerate(art['items']):
        if it['t'] == 'line' and not it.get('worn'):
            yield i, (it['x1'], it['y1'], it['x2'], it['y2'])
        elif it['t'] == 'rect':
            x, y, w, h = it['x'], it['y'], it['w'], it['h']
            for s in ((x, y, x + w, y), (x + w, y, x + w, y + h), (x, y + h, x + w, y + h), (x, y, x, y + h)):
                yield i, s


def score(dark, seg):
    x1, y1, x2, y2 = seg
    n = max(1, int(math.hypot(x2 - x1, y2 - y1) // STEP))
    hit = 0
    for k in range(n + 1):
        x = int(round(x1 + (x2 - x1) * k / n))
        y = int(round(y1 + (y2 - y1) * k / n))
        win = dark[max(0, y - RADIUS):y + RADIUS + 1, max(0, x - RADIUS):x + RADIUS + 1]
        hit += bool(win.any())
    return hit / (n + 1)


def overlay(img, art, out):
    vb = art['viewBox']
    base = img.convert('RGB').point(lambda v: 150 + v * 105 // 255)
    d = ImageDraw.Draw(base)
    for _, (x1, y1, x2, y2) in segments(art):
        d.line([x1, y1, x2, y2], fill=(230, 0, 0), width=3)
    for it in art['items']:
        if it['t'] == 'text':
            f = ImageFont.truetype(FONT, int(round(it['s'])))
            w = d.textsize(it['text'], font=f)[0]
            x = it['x'] - {'start': 0, 'middle': w / 2, 'end': w}[it.get('anchor', 'start')]
            asc = f.getmetrics()[0]
            d.text((x, it['y'] - asc), it['text'], font=f, fill=(0, 60, 255))
        elif it['t'] in ('screw', 'dot'):
            r = it.get('r', 12)
            d.ellipse([it['x'] - r, it['y'] - r, it['x'] + r, it['y'] + r], outline=(0, 160, 0), width=3)
    base = base.crop((vb[0], vb[1], vb[0] + vb[2], vb[1] + vb[3]))
    k = 1000 / base.size[0]
    base.resize((1000, int(base.size[1] * k))).save(out)


def main(argv):
    if len(argv) < 3:
        sys.stderr.write(__doc__)
        return 2
    img = Image.open(argv[1])
    with open(argv[2], encoding='utf-8') as f:
        art = json.load(f)
    lum = np.asarray(img.convert('L')).astype(int)
    vb = art['viewBox']
    med = np.median(lum[vb[1]:vb[1] + vb[3], vb[0]:vb[0] + vb[2]])
    dark = lum < med - DARK
    bad = []
    n = 0
    for i, seg in segments(art):
        n += 1
        s = score(dark, seg)
        if s < MIN_SCORE:
            bad.append('item %d %s: scor %.2f' % (i, tuple(round(v) for v in seg), s))
    if '--overlay' in argv:
        overlay(img, art, argv[argv.index('--overlay') + 1])
    if bad:
        print('check_art: %d din %d segmente nu stau pe liniile texturii:\n  %s' % (len(bad), n, '\n  '.join(bad)))
        return 1
    worn = sum(1 for it in art['items'] if it.get('worn'))
    print('check_art: %d segmente, toate pe textură (%d tocite, nenotate)' % (n, worn))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
