#!/usr/bin/env bash
# Render all JET itinerary templates → PDF + PNG, then combine into one book PDF.
# Usage: scripts/render.sh                        # all pages + combined book
#        scripts/render.sh templates/cover.html   # just one
#
# To skip the confirmations appendix: SKIP_CONFIRMATIONS=1 scripts/render.sh
set -euo pipefail

CHROME="${CHROME:-/opt/pw-browsers/chromium-1194/chrome-linux/chrome}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO="$(cd "$ROOT/.." && pwd)"
OUT="$REPO/samples"
CONFIRMS="$REPO/confirmations"
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

  # Scale factor capped so neither edge exceeds Claude's 2000px many-image
  # limit (1056 × 2 = 2112). 1.5 → 1224 × 1584, near Anthropic's 1568px sweet spot.
  "$CHROME" "${CHROME_FLAGS[@]}" \
    --window-size=816,1056 \
    --force-device-scale-factor=1.5 \
    --screenshot="$OUT/$name.png" \
    "$file_url" 2>&1 | grep -vE "^\[|handshake failed|SSL error|net_error|Fontconfig|Could not|GPU process|libGL|EGL|gpu/" || true
}

# Page order for the combined book.
# Note: know-before.html is for international trips — drop the line for
# domestic / US-only itineraries.
PAGES=(
  templates/cover.html
  templates/note.html
  templates/know-before.html
  templates/overview.html
  templates/lodging.html
  templates/day-01.html
  templates/day-02.html
  templates/day-03.html
  templates/day-04.html
  templates/day-05.html
  templates/day-06.html
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

# Decide whether to include confirmations appendix
APPENDIX_PDFS=()
if [[ -z "${SKIP_CONFIRMATIONS:-}" ]] && compgen -G "$CONFIRMS/*.pdf" > /dev/null; then
  echo "→ confirmations divider"
  render_one "templates/confirmations-divider.html"
  # Sort confirmations alphabetically (so 01-, 02-, ... prefixes order them)
  while IFS= read -r f; do APPENDIX_PDFS+=("$f"); done < <(ls -1 "$CONFIRMS"/*.pdf 2>/dev/null | sort)
  echo "→ appendix: ${#APPENDIX_PDFS[@]} confirmation PDFs"
fi

# Combine all per-page PDFs into one book.pdf using pdfunite (poppler-utils)
if command -v pdfunite >/dev/null 2>&1; then
  echo "→ combining → book.pdf"
  cd "$OUT"
  BOOK_PARTS=(
    cover.pdf note.pdf know-before.pdf overview.pdf lodging.pdf
    day-01.pdf day-02.pdf day-03.pdf day-04.pdf day-05.pdf day-06.pdf
    snapshot.pdf contacts.pdf
  )
  if [[ ${#APPENDIX_PDFS[@]} -gt 0 ]]; then
    BOOK_PARTS+=(confirmations-divider.pdf)
    BOOK_PARTS+=("${APPENDIX_PDFS[@]}")
  fi
  pdfunite "${BOOK_PARTS[@]}" book.pdf
fi

echo "✓ Output → $OUT"
ls -la "$OUT"
