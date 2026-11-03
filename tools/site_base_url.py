#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
# Pune adresa publică a site-ului în etichetele de partajare (og:image are nevoie de o adresă completă).
#   python3 tools/site_base_url.py build/site https://exemplu.ro/mecipt/
#   python3 tools/site_base_url.py --selftest
import os, re, sys, tempfile


def apply(site, base):
    if not re.match(r'^https?://[^\s"<>]+/$', base):
        raise ValueError('BASE_URL trebuie să fie o adresă http(s) completă, terminată cu „/”')
    for page in ('index.html', 'doc.html'):
        path = os.path.join(site, page)
        s = open(path, encoding='utf-8').read()
        s = s.replace('<meta property="og:image" content="img/', f'<meta property="og:image" content="{base}img/')
        if 'property="og:url"' not in s:
            s = s.replace('<meta property="og:type"', f'<meta property="og:url" content="{base}{page if page != "index.html" else ""}">\n<meta property="og:type"', 1)
        open(path, 'w', encoding='utf-8').write(s)


def selftest():
    with tempfile.TemporaryDirectory() as d:
        for p in ('index.html', 'doc.html'):
            open(os.path.join(d, p), 'w').write('<meta property="og:type" content="website">\n<meta property="og:image" content="img/mecipt-1.png">\n')
        apply(d, 'https://exemplu.ro/mecipt/')
        s = open(os.path.join(d, 'doc.html')).read()
        ok = 'content="https://exemplu.ro/mecipt/img/mecipt-1.png"' in s and 'og:url" content="https://exemplu.ro/mecipt/doc.html"' in s
        try:
            apply(d, 'exemplu.ro'); ok = False
        except ValueError:
            pass
    print('selftest: OK' if ok else 'selftest: GREȘIT')
    return 0 if ok else 1


if __name__ == '__main__':
    if sys.argv[1:2] == ['--selftest']:
        sys.exit(selftest())
    try:
        apply(sys.argv[1], sys.argv[2])
    except (ValueError, IndexError, OSError) as e:
        print(e, file=sys.stderr); sys.exit(1)
