import argparse
import json
import os
import pandas as pd
import re
import numpy as np

from io import StringIO

from code_similarity import eval_code
from data_similarity import eval_data

BLACKLIST = ["x.com", "twitter.com", "politifact.com", "factcheck.org", "reuters.com", "instagram.com", "facebook.com", "guardian.com", "usafacts.org", "threads.net"]

def eval_end_res(query, result, task):
    if task == "verification":
        return result == query["label"]
    else:
        gt = query["label"]
        match = re.search(r"[-+]?\d*\.\d+|\d+", gt)
        if match:
            try:
                gt_val = float(match.group())
                result_val = float(result)
                return abs(result_val - gt_val) <= 0.1 * gt_val
            except ValueError:
                return result.strip().lower() == gt.strip().lower()
        else:
            return result.strip().lower() == gt.strip().lower()

def evaluation(task, id, report_folder):

    def convert_np(obj):
        if isinstance(obj, np.generic):
            return obj.item()
        return obj
    
    with open(f"../drama-bench/{task}/query.json", "r") as file:
        queries = json.load(file)
    query = next((item for item in queries if item["id"] == id), None)

    with open(f"{report_folder}/{task}/{id}.json", "r", encoding="utf-8") as f:
        report = json.load(f)
    result = report["result"]
    data_valid = True
    try:
        data = pd.read_csv(StringIO(report["data"]))  # Restore DataFrame
    except:
        data = None
        data_valid = False

    code = report["code"]
    search_path = report["search_path"]
    cost = report["cost"]

    print("==========Accuracy==========")
    acc = False
    try:
        if not any(url and any(domain in url for domain in BLACKLIST) for url in search_path):
            acc = eval_end_res(query, result, task)
            acc = acc if isinstance(acc, bool) else False
    except:
        pass
    print("Accuracy: ", acc)

    print("==========Data-grounded Accuracy==========")
    code_exec = True
    local_vars = {'pd': pd}
    try:
        exec(code, globals(), local_vars)
    except Exception as e:
        print("Generated code has error")
        code_exec = False

    dg_acc = False
    try:
        if not any(url and any(domain in url for domain in BLACKLIST) for url in search_path):
            if task == "verification":
                if 'validate_statement' in local_vars:
                    try:
                        result = local_vars['validate_statement'](data)
                        dg_acc = eval_end_res(query, result, task)
                        dg_acc = dg_acc if isinstance(dg_acc, bool) else False
                    except:
                        code_exec = False # separate this out
                else:
                    print("You did not define the validate_statement function in your code")
                    code_exec = False
            else:
                if 'answer_question' in local_vars:
                    try:
                        result = local_vars['answer_question'](data)
                        dg_acc = eval_end_res(query, result, task)
                        dg_acc = dg_acc if isinstance(dg_acc, bool) else False
                    except:
                        code_exec = False
                else:
                    print("You did not define the answer_question function in your code")
                    code_exec = False
    except:
        pass

    print("Correct: ", dg_acc)
    
    print("==========Data Similarity==========")
    try:
        df_gt = pd.read_csv(f"../drama-bench/{task}/ground-truths/{id}/data.csv")
    except:
        df_gt = pd.read_csv(f"../drama-bench/{task}/ground-truths/{id}/data.csv", sep="\t")

    try:
        data_sim1 = eval_data(data, df_gt, task, query, False, "llm-as-a-judge")
    except:
        data_sim1 = 0
    print(f"Sim1: ", data_sim1)

    try:
        data_sim2 = eval_data(data, df_gt, task, query, False, "embedding")
    except:
        data_sim2 = 0
    print(f"Sim2: ", data_sim2)

    try:
        data_sim3 = eval_data(data, df_gt, task, query, True, "llm-as-a-judge")
    except:
        data_sim3 = 0
    print(f"Sim3: ", data_sim3)

    try:
        data_sim4 = eval_data(data, df_gt, task, query, True, "embedding")
    except:
        data_sim4 = 0
    print(f"Sim4: ", data_sim4)

    print("==========Code Similarity==========")

    with open(f"../drama-bench/{task}/ground-truths/{id}/code.py", "r", encoding="utf-8") as f:
        code_gt = f.read()

    try:
        code_sim1 = eval_code(code, code_gt, task, query, False, "llm-as-a-judge")
    except:
        code_sim1 = 0
    print(f"Sim1: ", code_sim1)

    try:
        code_sim2 = eval_code(code, code_gt, task, query, False, "embedding")
    except:
        code_sim2 = 0
    print(f"Sim2: ", code_sim2)

    try:
        code_sim3 = eval_code(code, code_gt, task, query, True, "llm-as-a-judge")
    except:
        code_sim3 = 0
    print(f"Sim3: ", code_sim3)

    try:
        code_sim4 = eval_code(code, code_gt, task, query, True, "embedding")
    except:
        code_sim4 = 0
    print(f"Sim4: ", code_sim4)

    output_file = os.path.join(report_folder, "overall_result.json")

    # Load existing file or start fresh
    if os.path.exists(output_file):
        with open(output_file, "r") as f:
            data = json.load(f)
    else:
        data = {}

    data[str(id)] = {
        "1-acc": acc,
        "2-dg-acc": dg_acc,
        "3-cost": cost,
        "4-data-valid": data_valid,
        "4-data-sim1": convert_np(data_sim1),
        "4-data-sim2": convert_np(data_sim2),
        "4-data-sim3": convert_np(data_sim3),
        "4-data-sim4": convert_np(data_sim4),
        "5-code-exec": code_exec,
        "5-code-sim1": convert_np(code_sim1),
        "5-code-sim2": convert_np(code_sim2),
        "5-code-sim3": convert_np(code_sim3),
        "5-code-sim4": convert_np(code_sim4),
    }

    with open(output_file, "w") as f:
        json.dump(data, f, indent=2)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--task", type=str, default="verification", choices=["verification", "qa"])
    parser.add_argument("--id", type=int, default=1)
    parser.add_argument("--report_folder", type=str, default="../drama-bot/reports")

    args = parser.parse_args()

    evaluation(args.task, args.id, args.report_folder)