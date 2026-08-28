#!/bin/bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INPUT="${1:-.}"
OUTPUT="${2:-}"
echo "Starte Batch-Reparatur für: $INPUT"
if [[ -n "$OUTPUT" ]]; then python3 "$SCRIPT_DIR/repair_mesh.py" "$INPUT" -o "$OUTPUT"; else python3 "$SCRIPT_DIR/repair_mesh.py" "$INPUT"; fi
echo "Batch abgeschlossen."
