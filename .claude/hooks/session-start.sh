#!/bin/bash
# Installs dependencies needed to render JET itineraries in Claude Code on the web:
#   - poppler-utils (provides pdfunite used by renderer/scripts/render.sh)
#   - npm deps for renderer/ (playwright + fontsource packages)
# Idempotent — safe to re-run.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

if ! command -v pdfunite >/dev/null 2>&1; then
  echo "→ installing poppler-utils"
  if command -v sudo >/dev/null 2>&1; then
    sudo apt-get update -y
    sudo apt-get install -y poppler-utils
  else
    apt-get update -y
    apt-get install -y poppler-utils
  fi
fi

echo "→ installing renderer npm dependencies"
cd "$CLAUDE_PROJECT_DIR/renderer"
npm install --no-audit --no-fund
