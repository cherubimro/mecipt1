#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
# Scoate reflexia blițului din textura panoului drept al modelului 3D (marius0198, CC BY 4.0; modificare semnalată
# în LICENSE-CONTINUT). Fotografia panoului are o pată albă largă la mijloc-jos (sus, în model), care în vederea 3D
# pare o lumină venită de nicăieri și nu se mișcă oricum ar fi rotit pupitrul.
#
# Metoda: lumina panoului variază lin; inscripțiile sunt detalii fine. Se estimează iluminarea locală (luminozitatea
# netezită) și o iluminare de fond fără bliț (o suprafață de gradul 2 potrivită robust, fără zonele cele mai
# luminoase); surplusul netezit (pata) se scade din fiecare pixel, egal pe cele trei canale (lumina blițului e albă).
# Inscripțiile și culoarea panoului rămân.
#   python3 tools/model3d_deglare.py SURSĂ.png IEȘIRE.jpg      (implicit: surse/3d/textures → web/model3d/textures)
#   python3 tools/model3d_deglare.py --selftest
import sys
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, median_filter

PANEL_ROWS = (336, 1675)      # panoul în textura 2048×2048; deasupra și dedesubt e alb
SIGMA = 28                    # netezirea (px): mai mare decât grosimea literelor, mai mică decât pata
KEEP = 0.012                  # surplus sub care nu se atinge nimic (variații fireşti ale vopselei)
MEDIAN = 9                    # fereastra medianului, în pixeli ai imaginii micșorate (36 px în textură)


def baseline(lum, mask):
    """Suprafața de gradul 2 potrivită pe luminozitatea netezită, ignorând iterativ punctele prea luminoase."""
    h, w = lum.shape
    yy, xx = np.mgrid[0:h, 0:w]
    x = xx / w - 0.5
    y = yy / h - 0.5
    terms = np.stack([np.ones_like(x), x, y, x * x, x * y, y * y], -1)
    sel = mask.copy()
    for _ in range(6):
        a, *_ = np.linalg.lstsq(terms[sel], lum[sel], rcond=None)
        fit = terms @ a
        resid = lum - fit
        sel = mask & (resid < np.percentile(resid[mask], 60))
    return fit


def background(chan):
    """Fondul local al unui canal, fără inscripții: median pe imaginea micșorată de 4 ori (literele subțiri
    și întunecate nu-l trag în jos), apoi netezit și mărit la loc."""
    h, w = chan.shape
    small = chan[: h - h % 4, : w - w % 4].reshape(h // 4, 4, w // 4, 4).mean((1, 3))
    small = gaussian_filter(median_filter(small, MEDIAN), 1.5)
    big = np.repeat(np.repeat(small, 4, 0), 4, 1)
    out = np.empty_like(chan)
    out[: big.shape[0], : big.shape[1]] = big
    out[big.shape[0]:] = big[-1:]
    out[:, big.shape[1]:] = out[:, big.shape[1] - 1: big.shape[1]]
    return out


def deglare(rgb):
    """rgb: float 0..1, H×W×3 → aceeași formă, fără pată. Fiecare canal se corectează separat, ca panoul
    să-și recapete și culoarea (lumina blițului e albă și spală verdele)."""
    out = rgb.copy()
    r0, r1 = PANEL_ROWS
    panel = rgb[r0:r1]
    lum_fit = None
    peak = 0.0
    for c in range(3):
        bg = background(panel[..., c])
        fit = baseline(gaussian_filter(bg, SIGMA), np.ones(bg.shape, bool))
        excess = gaussian_filter(np.clip(bg - fit - KEEP, 0, None), 2)
        out[r0:r1, :, c] = np.clip(panel[..., c] - excess, 0, 1)
        peak = max(peak, float(excess.max()))
    return out, peak


def selftest():
    rng = np.random.default_rng(1)
    h = w = 2048
    base = np.full((h, w, 3), [0.47, 0.50, 0.44])
    base[:PANEL_ROWS[0]] = 1
    base[PANEL_ROWS[1]:] = 1
    base[800:1500:40, 200:1800] = 0.1                   # „inscripții”: linii fine
    yy, xx = np.mgrid[0:h, 0:w]
    spot = 0.25 * np.exp(-(((xx - 1000) / 160) ** 2 + ((yy - 1300) / 220) ** 2))
    img = np.clip(base + spot[..., None] + rng.normal(0, 0.005, base.shape), 0, 1)
    out, _ = deglare(img)
    clean = abs(out[1300, 1000].mean() - 0.47) < 0.04 and abs(out[1300, 300].mean() - 0.47) < 0.04
    lines = out[1280, 1000].mean() < 0.2 and out[1280, 300].mean() < 0.2
    white = np.array_equal(out[:PANEL_ROWS[0]], img[:PANEL_ROWS[0]])     # în afara panoului: neatins
    if not (clean and lines and white):
        print('selftest: pata', out[1300, 1000].mean(), 'linia', out[1280, 1000].mean(), 'alb', out[100, 1000].mean())
        return 1
    print('selftest: OK')
    return 0


def main(argv):
    if argv[:1] == ['--selftest']:
        return selftest()
    src = argv[0] if argv else 'surse/3d/textures/Right_Screen_baseColor.png'
    dst = argv[1] if len(argv) > 1 else 'web/model3d/textures/Right_Screen_baseColor.jpg'
    rgb = np.asarray(Image.open(src).convert('RGB')).astype(float) / 255
    out, peak = deglare(rgb)
    Image.fromarray((out * 255 + 0.5).astype(np.uint8)).save(dst, quality=88, optimize=True)
    print(f'{dst}: pata scăzută (cel mult {peak:.3f})')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
