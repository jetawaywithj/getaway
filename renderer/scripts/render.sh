#!/usr/bin/env bash
# Render all JET itinerary templates → PDF + PNG, then combine into one book PDF.
# Usage: scripts/render.sh                        # render trip "yates" (default)
#        scripts/render.sh greece                 # render trip data/greece.json
#        scripts/render.sh templates/cover.html   # just one HTML file
#
# To skip the confirmations appendix: SKIP_CONFIRMATIONS=1 scripts/render.sh
set -euo pipefail

CHROME="${CHROME:-/opt/pw-browsers/chromium-1194/chrome-linux/chrome}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO="$(cd "$ROOT/.." && pwd)"

# If first arg looks like a slug (no "templates/" or ".html"), treat it as the trip slug.
TRIP="yates"
SINGLE=""
if [[ $# -gt 0 ]]; then
  if [[ "$1" == templates/* || "$1" == *.html ]]; then
    SINGLE="$1"
  else
    TRIP="$1"
  fi
fi

OUT="$REPO/samples/$TRIP"
CONFIRMS="$REPO/confirmations/$TRIP"
# Fall back to top-level confirmations dir if no per-trip subdir exists.
if [[ ! -d "$CONFIRMS" ]]; then CONFIRMS="$REPO/confirmations"; fi
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

if [[ -n "$SINGLE" ]]; then
  cd "$ROOT" && render_one "$SINGLE"
  echo "✓ Output → $OUT"
  exit 0
fi

# Regenerate all templates from data/<trip>.json
echo "→ build trip \"$TRIP\" from data/$TRIP.json"
node "$ROOT/scripts/build.mjs" "$TRIP"

cd "$ROOT"

# Page order for the combined book. Day pages discovered dynamically so this
# works for trips of any length. know-before / lodging are skipped if the
# build step didn't emit them (e.g. domestic trip with no KBYG block).
PAGES=(templates/cover.html templates/note.html)
[[ -f templates/know-before.html ]] && PAGES+=(templates/know-before.html)
PAGES+=(templates/overview.html)
[[ -f templates/lodging.html ]] && PAGES+=(templates/lodging.html)
while IFS= read -r d; do PAGES+=("$d"); done < <(ls -1 templates/day-*.html 2>/dev/null | sort)
PAGES+=(templates/snapshot.html)
[[ -f templates/hotel-directory.html ]] && PAGES+=(templates/hotel-directory.html)
PAGES+=(templates/contacts.html)

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
  BOOK_PARTS=(cover.pdf note.pdf)
  [[ -f know-before.pdf ]] && BOOK_PARTS+=(know-before.pdf)
  BOOK_PARTS+=(overview.pdf)
  [[ -f lodging.pdf ]] && BOOK_PARTS+=(lodging.pdf)
  while IFS= read -r d; do BOOK_PARTS+=("$d"); done < <(ls -1 day-*.pdf 2>/dev/null | sort)
  BOOK_PARTS+=(snapshot.pdf)
  [[ -f hotel-directory.pdf ]] && BOOK_PARTS+=(hotel-directory.pdf)
  BOOK_PARTS+=(contacts.pdf)
  if [[ ${#APPENDIX_PDFS[@]} -gt 0 ]]; then
    BOOK_PARTS+=(confirmations-divider.pdf)
    BOOK_PARTS+=("${APPENDIX_PDFS[@]}")
  fi
  pdfunite "${BOOK_PARTS[@]}" book.pdf
fi

echo "✓ Output → $OUT"
ls -la "$OUT"
