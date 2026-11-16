#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
engine="${GODOT_BIN:-godot}"
log_file="$(mktemp)"
trap 'rm -f "$log_file"' EXIT
"$engine" --headless --path godot --editor --import --quit > "$log_file" 2>&1
if grep -En 'SCRIPT ERROR|ERROR:' "$log_file"; then
  cat "$log_file"
  exit 1
fi
"$engine" --headless --path godot --fixed-fps 60 --script res://tests/test_game.gd 2>&1 | tee "$log_file"
if grep -En 'SCRIPT ERROR|ERROR:' "$log_file"; then
  exit 1
fi
