#!/bin/bash

# Usage:
# ./run_batch.sh verification
# ./run_batch.sh qa

set -e  # Exit on error

TASK="$1"

if [[ -z "$TASK" ]]; then
  echo "Error: No task specified."
  echo "Usage: $0 [verification|qa]"
  exit 1
fi

for id in {1..100}; do
  echo "Running $TASK for ID $id"
  uv run main.py --task "$TASK" --id "$id"
done