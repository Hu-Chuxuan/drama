#!/bin/bash

TASK="$1"

if [[ -z "$TASK" ]]; then
  echo "Error: No task specified."
  echo "Usage: $0 [qa|verification|...]"
  exit 1
fi

# Load environment variables
export $(grep -v '^#' .env | xargs)

# Activate virtual environment
source .venv/Scripts/activate

# Install dependencies
uv pip install -r requirements.txt

# Format input data
python format_data.py "../../drama-bench/$TASK/query.json" "./data/$TASK.jsonl"

# Run the task in the background
nohup python -u run.py \
  --test_file "./data/$TASK.jsonl" \
  --test_task "$TASK" \
  --api_key "$OPENAI_API_KEY" \
  --headless \
  --api_model "gpt-4o-2024-11-20" \
  --max_iter 15 \
  --max_attached_imgs 3 \
  --temperature 1 \
  --fix_box_color \
  --output_dir "results/$TASK" \
  --download_dir downloads \
  --max_workers 10 \
  --seed 42 > "test_tasks_$TASK.log" &

# Deactivate virtual environment
source deactivate