#!/bin/sh
# SPDX-License-Identifier: AGPL-3.0-or-later
# Descarcă și verifică wasi-sysroot 21 + builtins (wasi-sdk-21) în third_party/wasi/.
# Necesar doar pentru `make wasm`. Nu face nimic dacă third_party/wasi/.ok există.
set -eu
D=third_party/wasi
[ -f "$D/.ok" ] && exit 0
URL=https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-21
mkdir -p "$D"
cd "$D"
cat > SHA256SUMS <<'SUMS'
6aac42fc29474f052ac8fb92f45658a9fedf196857eba2493e14216667fff524  wasi-sysroot-21.0.tar.gz
4cb93ca6cea41f9883656ee2c58e0e4529a317774b12f76d13058dcb4c84014d  libclang_rt.builtins-wasm32-wasi-21.0.tar.gz
SUMS
for f in wasi-sysroot-21.0.tar.gz libclang_rt.builtins-wasm32-wasi-21.0.tar.gz; do
    [ -f "$f" ] || { curl -fsSL -o "$f.part" "$URL/$f" && mv "$f.part" "$f"; }
done
if ! sha256sum -c SHA256SUMS; then
    echo "fetch-wasi: sumă sha256 greșită; șterg arhivele" >&2
    rm -f wasi-sysroot-21.0.tar.gz libclang_rt.builtins-wasm32-wasi-21.0.tar.gz
    exit 1
fi
tar xzf wasi-sysroot-21.0.tar.gz
tar xzf libclang_rt.builtins-wasm32-wasi-21.0.tar.gz
touch .ok
