#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
"""Pozițiile becurilor și comutatoarelor pupitrului, proiectate din modelul 3D pe texturi.

    python3 tools/dae_layout.py [--dae MODEL.dae] [--out web/data/positions.json] [--overlay DIR]

Modelul (Sketchfab „MECIPT-1”, marius0198, 2020, CC BY 4.0) are toate nodurile la rădăcină,
cu matrice-lume. Poziția fiecărui obiect se aduce în coordonatele locale ale planului panoului,
se găsește triunghiul planului care o conține, iar UV-ul interpolat dă pixelul de textură
(2048 × 2048, ca în surse/3d/panouri-indreptate/). Se oprește cu cod 1 dacă vreun grup nu are
numărul de elemente al pupitrului.
"""
import json
import sys
import xml.etree.ElementTree as ET

NS = {'c': 'http://www.collada.org/2005/11/COLLADASchema'}
TEX = 2048
DAE = 'surse/3d/original-dae/source/extras/MECIPT-1_V4.dae'
OUT = 'web/data/positions.json'
PANELS = {'right': 'Right', 'left': 'Left'}
TEXTURES = {'right': 'surse/3d/panouri-indreptate/panou-drept.png',
            'left': 'surse/3d/panouri-indreptate/panou-stang.png'}

# (grup, tip, regiune (x0, x1, y0, y1), număr, ordine). Ordinea: 'x' = x crescător; 'y' = y crescător;
# 'grid' = rânduri după y (3 × 19), apoi x.
INF = 1e9
B = (1320, 1460)  # rândul grupurilor de jos de pe panoul drept
GROUPS = {
    'right': [
        ('M', 'lamps', 'LED', (-INF, INF, 610, 670), 31, 'x'),
        ('M', 'switches', 'Switch', (-INF, INF, 675, 725), 31, 'x'),
        ('RI', 'lamps', 'LED', (-INF, INF, 840, 890), 15, 'x'),
        ('R1', 'lamps', 'LED', (-INF, 1000, 900, 950), 7, 'x'),
        ('RA', 'lamps', 'LED', (1000, INF, 900, 950), 10, 'x'),
        ('RAI', 'lamps', 'LED', (-INF, 850, 1060, 1120), 10, 'x'),
        ('RAI', 'switches', 'Switch', (-INF, 850, 1125, 1175), 10, 'x'),
        ('instr', 'lamps', 'LED', (850, 1120, 1060, 1120), 4, 'x'),
        ('instr', 'switches', 'Switch', (850, 1120, 1125, 1175), 4, 'x'),
        ('commands', 'switches', 'Switch', (1120, INF, 1060, 1120), 8, 'x'),
        ('memory', 'lamps', 'LED', (500, 680) + B, 2, 'x'),
        ('memory', 'switches', 'Switch', (500, 680) + B, 2, 'x'),
        ('pulses', 'lamps', 'LED', (680, 860) + B, 2, 'y'),
        ('pulses', 'switches', 'Switch', (680, 860) + B, 1, 'x'),
        ('overflow', 'lamps', 'LED', (860, 1080) + B, 2, 'x'),
        ('overflow', 'switches', 'Switch', (860, 1080) + B, 2, 'x'),
        ('indicators', 'lamps', 'LED', (1080, 1370) + B, 3, 'x'),
        ('compute', 'lamps', 'LED', (1370, INF) + B, 2, 'x'),
        ('compute', 'switches', 'Switch', (1370, INF) + B, 2, 'x'),
    ],
    'left': [
        ('uop', 'lamps', 'LED', (-INF, INF, 600, 860), 57, 'grid'),
        ('pilot', 'lamps', 'LED', (-INF, INF, 1090, 1140), 3, 'x'),
        ('generator', 'lamps', 'LED', (-INF, INF, 1190, 1240), 6, 'x'),
        ('generator', 'switches', 'Switch', (-INF, INF, 1050, 1100), 2, 'x'),
        ('generator', 'switches', 'Switch', (-INF, INF, 1190, 1240), 1, 'x'),
        ('generator', 'knob', 'Input_BIG', (-INF, INF, -INF, INF), 1, 'x'),
        ('R2', 'lamps', 'LED', (-INF, INF, 1320, 1380), 7, 'x'),
    ],
}
TOTALS = {'right': (88, 60), 'left': (73, 3)}


def affine_inverse(m):
    a = [m[0:3], m[4:7], m[8:11]]
    t = [m[3], m[7], m[11]]
    det = (a[0][0] * (a[1][1] * a[2][2] - a[1][2] * a[2][1])
           - a[0][1] * (a[1][0] * a[2][2] - a[1][2] * a[2][0])
           + a[0][2] * (a[1][0] * a[2][1] - a[1][1] * a[2][0]))
    c = [[0.0] * 3 for _ in range(3)]
    for i in range(3):
        for j in range(3):
            i1, i2 = [k for k in range(3) if k != j]
            j1, j2 = [k for k in range(3) if k != i]
            c[i][j] = ((-1) ** (i + j)) * (a[i1][j1] * a[i2][j2] - a[i1][j2] * a[i2][j1]) / det
    return lambda p: [sum(c[i][k] * (p[k] - t[k]) for k in range(3)) for i in range(3)]


def load(dae):
    root = ET.parse(dae).getroot()
    nodes = {}
    for n in root.find('.//c:visual_scene', NS).findall('c:node', NS):
        mt, ig = n.find('c:matrix', NS), n.find('c:instance_geometry', NS)
        if mt is None or ig is None:
            continue
        nodes[n.get('name')] = ([float(x) for x in mt.text.split()], ig.get('url')[1:])
    return root, nodes


def plane(root, nodes, name):
    m, gid = nodes[name]
    g = root.find(".//c:geometry[@id='%s']" % gid, NS)
    tri = g.find('.//c:triangles', NS)
    inputs = tri.findall('c:input', NS)
    offs = {i.get('semantic'): int(i.get('offset')) for i in inputs}
    srcs = {i.get('semantic'): i.get('source')[1:] for i in inputs}
    arrays = {s.get('id'): [float(x) for x in s.find('c:float_array', NS).text.split()]
              for s in g.findall('.//c:source', NS)}
    vin = g.find('.//c:vertices', NS)
    pos = arrays[vin.find('c:input', NS).get('source')[1:]] if srcs['VERTEX'] == vin.get('id') else arrays[srcs['VERTEX']]
    uv = arrays[srcs['TEXCOORD']]
    st = len(inputs)
    p = [int(x) for x in tri.find('c:p', NS).text.split()]
    tris = []
    for k in range(0, len(p), 3 * st):
        vs = []
        for v in range(3):
            vi, ti = p[k + v * st + offs['VERTEX']], p[k + v * st + offs['TEXCOORD']]
            vs.append((pos[3 * vi:3 * vi + 3], uv[2 * ti:2 * ti + 2]))
        tris.append(vs)
    return affine_inverse(m), tris


def to_texture(inv, tris, world):
    q = inv(world)
    best = None
    for (a, ua), (b, ub), (c, uc) in tris:
        d = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1])
        if d == 0:
            continue
        l1 = ((b[1] - c[1]) * (q[0] - c[0]) + (c[0] - b[0]) * (q[1] - c[1])) / d
        l2 = ((c[1] - a[1]) * (q[0] - c[0]) + (a[0] - c[0]) * (q[1] - c[1])) / d
        l3 = 1 - l1 - l2
        mn = min(l1, l2, l3)
        if best is None or mn > best[0]:
            best = (mn, [l1 * ua[i] + l2 * ub[i] + l3 * uc[i] for i in range(2)])
    u, v = best[1]
    return round(u * TEX, 1), round((1 - v) * TEX, 1), q[2]


def project(dae):
    root, nodes = load(dae)
    found = {}
    for side, pname in PANELS.items():
        inv, tris = plane(root, nodes, pname)
        items = []
        for name, (m, _) in nodes.items():
            if name in PANELS.values():
                continue
            x, y, z = to_texture(inv, tris, [m[3], m[7], m[11]])
            if abs(z) < 0.3 and -50 <= x <= 2100 and -50 <= y <= 2100:
                items.append((name.split('.')[0], x, y, name))
        found[side] = items
    return found


def classify(found):
    out = {'source': 'MECIPT-1_V4.dae (Sketchfab „MECIPT-1”, marius0198, 2020, CC BY 4.0), '
                     'proiectat de tools/dae_layout.py',
           'space': 'texture px 2048x2048', 'right': {}, 'left': {}, 'objects': {}}
    errors = []
    for side, table in GROUPS.items():
        for group, key, typ, (x0, x1, y0, y1), n, order in table:
            sel = [it for it in found[side] if it[0] == typ and x0 <= it[1] < x1 and y0 <= it[2] < y1]
            if len(sel) != n:
                errors.append('%s.%s.%s (%s): găsite %d, așteptate %d: %s' % (
                    side, group, key, typ, len(sel), n, [(round(s[1]), round(s[2]), s[3]) for s in sel]))
                continue
            if order == 'x':
                sel.sort(key=lambda s: s[1])
            elif order == 'y':
                sel.sort(key=lambda s: s[2])
            else:
                sel.sort(key=lambda s: s[2])
                rows = [sorted(sel[r * 19:(r + 1) * 19], key=lambda s: s[1]) for r in range(3)]
                sel = rows[0] + rows[1] + rows[2]
            grp = out[side].setdefault(group, {})
            if key == 'knob':
                grp['knob'] = [sel[0][1], sel[0][2]]
                out['objects']['%s.knob' % group] = sel[0][3]
                continue
            lst = grp.setdefault(key, [])
            for s in sel:
                out['objects']['%s.%s.%d' % (group, key, len(lst))] = s[3]
                lst.append([s[1], s[2]])
    for side, (nl, ns) in TOTALS.items():
        tl = sum(len(g.get('lamps', [])) for g in out[side].values())
        ts = sum(len(g.get('switches', [])) for g in out[side].values())
        if (tl, ts) != (nl, ns):
            errors.append('%s: %d becuri / %d comutatoare, așteptate %d / %d' % (side, tl, ts, nl, ns))
    return out, errors


def overlay(pos, outdir):
    from PIL import Image, ImageDraw
    for side, tex in TEXTURES.items():
        im = Image.open(tex).convert('RGB')
        d = ImageDraw.Draw(im)
        for grp in pos[side].values():
            for key, col in (('lamps', (255, 0, 255)), ('switches', (0, 160, 255))):
                for x, y in grp.get(key, []):
                    d.ellipse([x - 14, y - 14, x + 14, y + 14], outline=col, width=5)
            if 'knob' in grp:
                x, y = grp['knob']
                d.rectangle([x - 20, y - 20, x + 20, y + 20], outline=(255, 120, 0), width=5)
        im.resize((1000, 1000)).save('%s/overlay-pozitii-%s.png' % (outdir.rstrip('/'), side))


def main(argv):
    dae, outp, ovl = DAE, OUT, None
    i = 1
    while i < len(argv):
        if argv[i] == '--dae':
            dae = argv[i + 1]; i += 1
        elif argv[i] == '--out':
            outp = argv[i + 1]; i += 1
        elif argv[i] == '--overlay':
            ovl = argv[i + 1]; i += 1
        else:
            sys.stderr.write(__doc__)
            return 2
        i += 1
    pos, errors = classify(project(dae))
    if errors:
        sys.stderr.write('dae_layout: grupurile nu se potrivesc cu pupitrul:\n  ' + '\n  '.join(errors) + '\n')
        return 1
    with open(outp, 'w', encoding='utf-8') as f:
        json.dump(pos, f, ensure_ascii=False, indent=1)
        f.write('\n')
    if ovl:
        overlay(pos, ovl)
    print('dae_layout: %s scris' % outp)
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
