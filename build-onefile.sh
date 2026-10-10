#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="${1:-$ROOT_DIR/dist}"
mkdir -p "$OUTPUT_DIR/public/assets/characters"

# Phaser is loaded from the CDN by index.html; bundle and minify the game code itself.
npx --yes esbuild "$ROOT_DIR/game.js" \
  --bundle \
  --outfile="$OUTPUT_DIR/game.js" \
  --format=iife \
  --minify \
  --target=es2018

cp "$ROOT_DIR/index.html" "$OUTPUT_DIR/index.html"
cp "$ROOT_DIR"/public/assets/characters/*.svg "$OUTPUT_DIR/public/assets/characters/"
printf 'Static game build written to %s\n' "$OUTPUT_DIR"
