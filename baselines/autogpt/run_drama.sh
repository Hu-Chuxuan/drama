#!/bin/bash

# Usage:
# ./run_task.sh qa
# ./run_task.sh verification

set -e  # Exit on error

TASK="$1"

if [[ -z "$TASK" ]]; then
  echo "Error: No task specified."
  echo "Usage: $0 [qa|verification]"
  exit 1
fi

# Determine script path based on task
case "$TASK" in
  qa)
    SCRIPT_PATH="./drama/qa.py"
    ;;
  verification)
    SCRIPT_PATH="./drama/verification.py"
    ;;
  *)
    echo "Error: Unknown task '$TASK'. Supported tasks are 'qa' and 'verification'."
    exit 1
    ;;
esac

# Save current directory
ORIG_DIR=$(pwd)

# Navigate to target directory
cd autogpt/AutoGPT/classic/original_autogpt

# Run the Python script
poetry run python "$SCRIPT_PATH"

# Return to original directory
cd "$ORIG_DIR"