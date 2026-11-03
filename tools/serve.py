#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
"""Servește un director static pe 127.0.0.1, cerând browserului să reverifice fiecare fișier (Cache-Control:
no-cache), ca o pagină reconstruită să nu fie luată din cache. Python 3.6+: python3 tools/serve.py DIR [PORT]"""
import http.server
import os
import sys


class NoCache(http.server.SimpleHTTPRequestHandler):
    extensions_map = dict(http.server.SimpleHTTPRequestHandler.extensions_map, **{'.wasm': 'application/wasm', '.mjs': 'text/javascript', '.js': 'text/javascript'})

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def translate_path(self, path):
        # directorul se citește la fiecare cerere, ca serverul să supraviețuiască unui `make site` (care îl recreează)
        rel = super().translate_path(path)[len(os.getcwd()):]
        return os.path.join(ROOT, rel.lstrip(os.sep))


if __name__ == '__main__':
    ROOT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else '.')
    port = int(sys.argv[2]) if len(sys.argv) > 2 else 8000
    print('servesc %s pe http://127.0.0.1:%d/' % (ROOT, port))
    http.server.HTTPServer(('127.0.0.1', port), NoCache).serve_forever()
