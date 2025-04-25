#!/bin/bash

TASK="$1"

if [[ -z "$TASK" ]]; then
  echo "Error: No task specified."
  echo "Usage: $0 [qa|verification]"
  exit 1
fi

for ID in {1..100}; do
  echo "Running $TASK for ID $ID..."
  poetry run test-drama-bench \
    --model "gpt-4o-2024-11-20" \
    --id "$ID" \
    --task "$TASK" \
    --report_folder reports
done
