#!/usr/bin/env bash
# Render JET itinerary templates to PDF + high-res PNG using headless Chromium.
# Usage: scripts/render.sh                        # renders all templates
#        scripts/render.sh templates/cover.html   # renders one
set -euo pipefail

CHROME="${CHROME:-/opt/pw-browsers/chromium-1194/chrome-linux/chrome}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$(cd "$ROOT/.." && pwd)/samples"
mkdir -p "$OUT"

CHROME_FLAGS=(
  --headless=new
  --no-sandbox
  --disable-gpu
  --hide-scrollbars
  --no-pdf-header-footer
  --disable-pdf-tagging
  --font-render-hinting=none
  --force-color-profile=srgb
)

render_one() {
  local html="$1"
  local name
  name="$(basename "$html" .html)"
  local file_url="file://$ROOT/$html"

  echo "→ $name (PDF)"
  "$CHROME" "${CHROME_FLAGS[@]}" \
    --print-to-pdf="$OUT/$name.pdf" \
    --print-to-pdf-no-header \
    "$file_url" 2>&1 | grep -vE "^\[|handshake failed|SSL error|net_error|Fontconfig|Could not|GPU process|libGL|EGL|gpu/" || true

  echo "→ $name (PNG @ 2x)"
  "$CHROME" "${CHROME_FLAGS[@]}" \
    --window-size=816,1056 \
    --force-device-scale-factor=2.5 \
    --screenshot="$OUT/$name.png" \
    "$file_url" 2>&1 | grep -vE "^\[|handshake failed|SSL error|net_error|Fontconfig|Could not|GPU process|libGL|EGL|gpu/" || true
}

if [[ $# -gt 0 ]]; then
  render_one "$1"
else
  for tpl in templates/cover.html templates/lodging.html; do
    cd "$ROOT" && render_one "$tpl"
  done
fi

echo "✓ Output → $OUT"
ls -la "$OUT"
