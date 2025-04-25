#!/usr/bin/env bash

# Usage: ./run_task.sh [qa|verification|...]

TASK="$1"

if [[ -z "$TASK" ]]; then
  echo "Error: No task specified."
  echo "Usage: $0 [qa|verification|...]"
  exit 1
fi

# Activate the virtual environment
source .venv/Scripts/activate

# Install dependencies
uv pip install -r requirements.txt

# Run the task
python -u main.py \
  --test_file "../../drama-bench/$TASK/query.json" \
  --test_task "$TASK" \
  --output_dir "results/$TASK" \
  --max_workers 10

# Deactivate the virtual environment
deactivate
