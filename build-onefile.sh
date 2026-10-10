#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_DIR="${1:-$ROOT/dist}"
mkdir -p "$OUT_DIR"

# Phaser is loaded from the CDN; esbuild bundles and minifies the game code.
npx --yes esbuild "$ROOT/game.js" \
  --bundle \
  --outfile="$OUT_DIR/game.js" \
  --format=iife \
  --minify

cp "$ROOT/index.html" "$OUT_DIR/index.html"
mkdir -p "$OUT_DIR/public"
cp -R "$ROOT/public/assets" "$OUT_DIR/public/"

echo "Static game build written to: $OUT_DIR"
