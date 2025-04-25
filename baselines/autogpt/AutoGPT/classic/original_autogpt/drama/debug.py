import pandas as pd
from ddb.verification import Result, ActionHistory
import json
import ast

test_data = pd.read_json("ddb/test_data/initial_test.json", encoding="utf-8", encoding_errors="replace")
test_data.set_index("id", inplace=True)
test_data["result"] = False
test_data["cost"] = 0.0
test_data["sources"] = [[""]] * len(test_data)
test_data["data"] = None
test_data["code"] = None
test_data["error"] = None

# print(test_data)
BLACKLIST = ["x.com", "twitter.com", "politifact.com", "factcheck.org",
             "reuters.com", "instagram.com", "facebook.com", "guardian.com", "usafacts.org"]

row = test_data.iloc[1]
try:
    result = Result.from_json("data/agents/1/state.json")
    if result.result is not None:
        row["result"] = row["label"] == result.result.validity
        row["data"] = result.result.data
        row["code"] = result.result.code
    else:
        row["result"] = False
        row["data"] = None
        row["code"] = None

    # double check for blacklisted sources
    for source in result.action_history.sources:
        for blacklisted in BLACKLIST:
            if source.startswith(blacklisted):
                row["result"] = False

    row["sources"] = result.action_history.sources
    row["total_cost"] = result.total_cost
    row.to_json("ddb/results/1.json", indent=4, orient="index")
except Exception as e:
    row["result"] = False
    row["data"] = None
    row["code"] = None
    row["sources"] = None
    row["total_cost"] = None
    row["error"] = e.__str__()
    row.to_json("ddb/results/1.json", indent=4, orient="index")
    print(f"An error occured for claim 1: {e}")


# print(row)

# with open("data/agents/0/state.json", "r", encoding="utf-8", errors="replace") as file:
#     state_json = json.load(file)
#     action_history = ActionHistory.from_json(state_json["history"]["episodes"])
#     finish = action_history.actions[-1]
#     # print(type(finish.tool.arguments["reason"]))
#     # result_json = json.loads(finish.tool.arguments["reason"])
#     result = ast.literal_eval(finish.tool.arguments["reason"].strip())
