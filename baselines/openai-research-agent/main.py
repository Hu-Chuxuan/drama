import asyncio
import argparse
import pandas as pd
import json

from openai_agents_python.examples.research_bot.manager import ResearchManager

import os
import numpy as np
print("OPENAI_API_KEY =", os.getenv("OPENAI_API_KEY"))


async def main(task, id):
    with open(f"../../drama-bench/{task}/query.json", "r") as file:
        queries = json.load(file)
    query = next((item for item in queries if item["id"] == id), None)

    manager = ResearchManager()
    if task == "verification":
        res, cost, sources = await manager.run(query=f"""
            Verify whether the following claim is true. \n\n
            Claim: {query["claim"]}
        """)
    else:
        res, cost, sources = await manager.run(query=f"""
            Answer the following question. \n\n
            Claim: {query["question"]}
        """)


    def convert_np(obj):
        if isinstance(obj, np.generic):
            return obj.item()
        return obj

    if task == "verification":
        result = convert_np(res.validity)
    else:
        result = convert_np(res.answer)
    output_dict = {
            "result": result,
            "data": convert_np(res.data),
            "code": convert_np(res.code),
            "search_path": convert_np(sources),
            "cost": cost
        }
    report_folder = "./results"
    output_file = f"{report_folder}/{id}.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(output_dict, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--task", type=str, default="verification", choices=["verification", "qa"])
    parser.add_argument("--id", type=int, default=1)
    args = parser.parse_args()
    asyncio.run(main(task = args.task, id=args.id))