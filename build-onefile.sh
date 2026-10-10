#!/bin/bash
cd /home/user/aaaa/BabyCareWorld

# Use esbuild directly to bundle everything into one file
npx esbuild src/main.js \
  --bundle \
  --outfile=dist/game.js \
  --format=iife \
  --global-name=GameApp \
  --minify \
  --loader:.js=js \
  --sourcemap=external \
  --define:global=window \
  2>&1
