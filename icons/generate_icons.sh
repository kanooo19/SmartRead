#!/bin/bash
# Run once to generate PNG icons from icon.svg
# Requires: rsvg-convert (brew install librsvg) or Inkscape
DIR="$(cd "$(dirname "$0")" && pwd)"

for size in 16 48 128; do
  if command -v rsvg-convert &>/dev/null; then
    rsvg-convert -w $size -h $size "$DIR/icon.svg" -o "$DIR/icon${size}.png"
  elif command -v inkscape &>/dev/null; then
    inkscape --export-png="$DIR/icon${size}.png" -w $size -h $size "$DIR/icon.svg"
  else
    echo "Install librsvg (brew install librsvg) or Inkscape to generate icons."
    exit 1
  fi
  echo "Generated icon${size}.png"
done
