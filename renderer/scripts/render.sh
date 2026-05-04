#!/usr/bin/env bash
# Render all JET itinerary templates → PDF + PNG, then combine into one book PDF.
# Usage: scripts/render.sh                        # all pages + combined book
#        scripts/render.sh templates/cover.html   # just one
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

  echo "→ $name"
  "$CHROME" "${CHROME_FLAGS[@]}" \
    --print-to-pdf="$OUT/$name.pdf" \
    --print-to-pdf-no-header \
    "$file_url" 2>&1 | grep -vE "^\[|handshake failed|SSL error|net_error|Fontconfig|Could not|GPU process|libGL|EGL|gpu/" || true

  "$CHROME" "${CHROME_FLAGS[@]}" \
    --window-size=816,1056 \
    --force-device-scale-factor=2 \
    --screenshot="$OUT/$name.png" \
    "$file_url" 2>&1 | grep -vE "^\[|handshake failed|SSL error|net_error|Fontconfig|Could not|GPU process|libGL|EGL|gpu/" || true
}

# Page order for the combined book
PAGES=(
  templates/cover.html
  templates/note.html
  templates/overview.html
  templates/day-01.html
  templates/day-02.html
  templates/day-03.html
  templates/day-04.html
  templates/day-05.html
  templates/day-06.html
  templates/lodging.html
  templates/snapshot.html
  templates/contacts.html
)

if [[ $# -gt 0 ]]; then
  cd "$ROOT" && render_one "$1"
  echo "✓ Output → $OUT"
  exit 0
fi

# Regenerate day templates from data/yates.json each run
echo "→ build-days from data/yates.json"
node "$ROOT/scripts/build-days.mjs"

cd "$ROOT"
for tpl in "${PAGES[@]}"; do
  render_one "$tpl"
done

# Combine all per-page PDFs into one book.pdf using pdfunite (poppler-utils)
if command -v pdfunite >/dev/null 2>&1; then
  echo "→ combining → book.pdf"
  cd "$OUT"
  pdfunite \
    cover.pdf note.pdf overview.pdf \
    day-01.pdf day-02.pdf day-03.pdf day-04.pdf day-05.pdf day-06.pdf \
    lodging.pdf snapshot.pdf contacts.pdf \
    book.pdf
fi

echo "✓ Output → $OUT"
ls -la "$OUT"
