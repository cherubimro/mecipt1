#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
# Verifică site-ul static construit (make site) înainte de publicare:
#   - fiecare fișier la care trimit paginile, stilurile și modulele JS există (căi relative);
#   - nicio cale absolută „/…” (site-ul trebuie să meargă și dintr-un subfolder, de ex. …/mecipt/);
#   - nicio resursă încărcată de pe alt server (legăturile <a> spre surse sunt permise);
#   - fiecare program din catalog există; dimensiunea totală.
#   python3 tools/check_site.py build/site       0 = bun; altfel listează problemele
#   python3 tools/check_site.py --selftest       un site stricat trebuie respins
import json, os, re, sys, tempfile

REF = [
    (r'<(?:link|script|img|source|iframe)\b[^>]*?\b(?:href|src)="([^"]+)"', 'load'),
    (r'<a\b[^>]*?\bhref="([^"]+)"', 'link'),
    (r'url\(\s*["\']?([^)"\']+)["\']?\s*\)', 'load'),
    (r'(?:^|\n)\s*import\b[^\'"]*?from\s*["\']([^"\']+)["\']', 'load'),
    (r'\bimport\(\s*["\']([^"\']+)["\']\s*\)', 'load'),
    (r'\b(?:fetch|fetchOk|getJson|getText)\(\s*["\']([^"\']+)["\']', 'load-root'),
]


def problems(site):
    out = []
    total = 0
    for dirpath, _, files in os.walk(site):
        for name in files:
            path = os.path.join(dirpath, name)
            total += os.path.getsize(path)
            if not name.endswith(('.html', '.css', '.js')):
                continue
            rel = os.path.relpath(path, site)
            text = open(path, encoding='utf-8', errors='replace').read()
            for pattern, kind in REF:
                for ref in re.findall(pattern, text):
                    if ref.startswith(('#', 'mailto:', 'data:', 'javascript:')) or '${' in ref:
                        continue
                    if re.match(r'^[a-z]+://', ref) or ref.startswith('//'):
                        if kind != 'link':
                            out.append(f'{rel}: resursă de pe alt server: {ref}')
                        continue
                    if ref.startswith('/'):
                        out.append(f'{rel}: cale absolută (nu merge dintr-un subfolder): {ref}')
                        continue
                    target = ref.split('#')[0].split('?')[0]
                    if not target:
                        continue
                    # fetch-urile pornesc de la pagină: modulele din js/ sunt încărcate de paginile din rădăcină
                    base = site if kind == 'load-root' and name.endswith('.js') else dirpath
                    if not os.path.exists(os.path.normpath(os.path.join(base, target))):
                        out.append(f'{rel}: lipsește {ref}')
    catalog = os.path.join(site, 'programs', 'catalog.json')
    if os.path.exists(catalog):
        for p in json.load(open(catalog, encoding='utf-8')):
            for f in (p.get('file'), p.get('tape')):
                if f and not os.path.exists(os.path.join(site, 'programs', f)):
                    out.append(f'catalog: lipsește programs/{f}')
    else:
        out.append('lipsește programs/catalog.json')
    return out, total


def selftest():
    with tempfile.TemporaryDirectory() as d:
        os.makedirs(os.path.join(d, 'programs'))
        json.dump([{'id': 'x', 'file': 'x.mec', 'tape': None}], open(os.path.join(d, 'programs', 'catalog.json'), 'w'))
        open(os.path.join(d, 'index.html'), 'w').write(
            '<link rel="stylesheet" href="css/lipsa.css"><script src="/abs.js"></script>'
            '<script src="https://cdn.example.org/x.js"></script><a href="https://ro.wikipedia.org/">ok</a>')
        found, _ = problems(d)
        want = ['lipsește css/lipsa.css', 'cale absolută', 'resursă de pe alt server', 'lipsește programs/x.mec']
        missing = [w for w in want if not any(w in f for f in found)]
        extra = [f for f in found if 'wikipedia' in f]
        if missing or extra:
            print('selftest: nu prinde', missing, 'sau prinde greșit', extra)
            return 1
    print('selftest: OK')
    return 0


def main(argv):
    if argv[:1] == ['--selftest']:
        return selftest()
    site = argv[0] if argv else 'build/site'
    found, total = problems(site)
    for f in found:
        print(f)
    print(f'{site}: {total / 1e6:.1f} MB, {len(found)} probleme')
    return 1 if found else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
