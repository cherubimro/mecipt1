#!/bin/sh
# SPDX-License-Identifier: AGPL-3.0-or-later
# Pupitrul în Chrome fără ecran: tests/web/smoke.html trebuie să scrie „SMOKE OK”; plus o captură
# a paginii în build/pupitru.png. Fără Chrome: SKIP. Se rulează din rădăcina proiectului, după `make site`.
set -u
CHROME=$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)
if [ -z "$CHROME" ]; then echo "SKIP smoke (fără Chrome)"; exit 0; fi
SITE=build/site
mkdir -p "$SITE/test"
cp tests/web/smoke.html "$SITE/test/"
PORT=$(python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1", 0)); print(s.getsockname()[1])')
( cd "$SITE" && exec python3 -m http.server "$PORT" --bind 127.0.0.1 ) >/dev/null 2>&1 &
PID=$!
trap 'kill $PID 2>/dev/null' EXIT INT TERM
PROFILE=$(mktemp -d "${TMPDIR:-/tmp}/pupitru-chrome.XXXXXX")
i=0
while ! python3 -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:$PORT/')" 2>/dev/null; do
    i=$((i + 1)); [ $i -gt 50 ] && { echo "SMOKE FAIL: serverul nu pornește"; exit 1; }
    python3 -c 'import time; time.sleep(0.1)'
done
OUT=$("$CHROME" --headless=new --no-sandbox --disable-gpu --user-data-dir="$PROFILE" \
      --virtual-time-budget=60000 --dump-dom "http://127.0.0.1:$PORT/test/smoke.html" 2>/dev/null)
RES=$(printf '%s' "$OUT" | sed -n 's/.*<p id="result">\([^<]*\)<\/p>.*/\1/p' | head -1)
"$CHROME" --headless=new --no-sandbox --disable-gpu --user-data-dir="$PROFILE" --hide-scrollbars \
      --virtual-time-budget=8000 --window-size=1600,1000 --screenshot=build/pupitru.png \
      "http://127.0.0.1:$PORT/index.html" >/dev/null 2>&1
rm -rf "$PROFILE"
echo "${RES:-SMOKE FAIL: fără rezultat}"
[ "$RES" = "SMOKE OK" ]
