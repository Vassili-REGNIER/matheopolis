#!/bin/sh
# Polls source files and runs a full clean rebuild on change.
# More reliable than `tsc -w` on Docker/WSL bind mounts where transient
# "file not found" errors can permanently stop incremental emit (noEmitOnError).

set -eu

MARKER="public/dist/.watch-marker"
POLL_SEC="${WATCH_POLL_INTERVAL:-0.5}"
DEBOUNCE_SEC="${WATCH_DEBOUNCE_SEC:-0.4}"

rebuild() {
  echo "[watch-rebuild] Rebuilding at $(date -u +%H:%M:%S)..."
  if npm run build; then
    mkdir -p public/dist
    touch "$MARKER"
    echo "[watch-rebuild] OK"
    return 0
  fi

  echo "[watch-rebuild] FAILED — fix TypeScript errors; dist stays at last good build"
  return 1
}

has_pending_changes() {
  if [ ! -f "$MARKER" ]; then
    return 0
  fi

  find src -type f -name '*.ts' -newer "$MARKER" -print -quit 2>/dev/null | grep -q .
}

rebuild || true

while true; do
  if has_pending_changes; then
    sleep "$DEBOUNCE_SEC"
    rebuild || true
  fi
  sleep "$POLL_SEC"
done
