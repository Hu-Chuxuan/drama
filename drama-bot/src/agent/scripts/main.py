import argparse
import json
import os
import logging
import pandas as pd
import numpy as np

from agent.drama_bot import DramaBot

def drama_bot_pipeline(model, task, id, output_path, report_folder):
    def convert_np(obj):
        if isinstance(obj, np.generic):
            return obj.item()
        return obj
    
    with open(f"../drama-bench/{task}/query.json", "r") as file:
        queries = json.load(file)
    query_info = next((item for item in queries if item["id"] == id), None)
    if task == "verification":
        query = query_info["claim"]
    else:
        query = query_info["question"]
    drama_bot = DramaBot(task, output_path, model)
    result, data, code, search_path = drama_bot.run(query)

    with open(f"{output_path}/output.json", "r", encoding="utf-8") as f:
        agent_trace_data = json.load(f)
    cost = agent_trace_data["cost"][-1]

    data_csv_str = data.to_csv(index=False) if isinstance(data, pd.DataFrame) else ""
    output_dict = {
        "result": convert_np(result),
        "data": convert_np(data_csv_str),
        "code": convert_np(code),
        "search_path": convert_np(search_path),
        "cost": cost
    }
    output_file = f"{report_folder}/{id}.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(output_dict, f, indent=2, ensure_ascii=False)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", type=str, default="gpt-4o-2024-11-20")
    parser.add_argument("--task", type=str, default="verification", choices=["verification", "qa"])
    parser.add_argument("--id", type=int, default=1)
    parser.add_argument("--report_folder", type=str, default="reports")
    args = parser.parse_args()

    output_path = f"traces-{args.task}/{args.id}"
    report_folder = f"{args.report_folder}/{args.task}"
    os.makedirs(report_folder, exist_ok=True)

    logging.basicConfig(
        format="%(asctime)s - %(levelname)s - %(message)s",
        level=logging.INFO
    )
    logging.info(f"🎭 DramaBot starts {args.task}-{args.id}")

    drama_bot_pipeline(model=args.model, task=args.task, id=args.id, output_path=output_path, report_folder=report_folder)

    logging.info(f"🎭 DramaBot finishes {args.task}-{args.id}")