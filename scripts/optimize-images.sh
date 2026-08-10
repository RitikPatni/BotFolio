#!/bin/bash
# Convert PNG/JPG images to WebP at 80% quality
# Usage: ./scripts/optimize-images.sh [quality=80]
set -euo pipefail

QUALITY="${1:-80}"
ASSETS_DIR="src/assets/photography"

if ! command -v cwebp &>/dev/null; then
  echo "ERROR: cwebp not found. Install: apt install webp"
  exit 1
fi

echo "Converting images to WebP (quality: ${QUALITY})..."
COUNT=0
SKIPPED=0
FAILED=0

find "$ASSETS_DIR" -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" \) 2>/dev/null | while read -r file; do
  webp="${file%.*}.webp"
  if [ -f "$webp" ]; then
    echo "  SKIP (exists): ${file#$ASSETS_DIR/}"
    ((SKIPPED++)) || true
    continue
  fi
  echo "  CONVERT: ${file#$ASSETS_DIR/}"
  if cwebp -q "$QUALITY" "$file" -o "$webp" 2>/dev/null; then
    ((COUNT++)) || true
  else
    echo "  FAILED: ${file#$ASSETS_DIR/}"
    ((FAILED++)) || true
  fi
done

echo ""
echo "Done. Converted: ${COUNT:-0}, Skipped: ${SKIPPED:-0}, Failed: ${FAILED:-0}"
