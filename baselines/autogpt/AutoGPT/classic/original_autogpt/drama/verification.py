from itertools import repeat
from pathlib import Path
import pandas as pd
import multiprocessing

from ddb.models import VerificationResult, VerificationAgentResult
from ddb.util import (
    VERIFICATION_SAVE_PATH,
    VERIFICATION_TEST_PATH,
    parse_args,
    clean,
    find_last_file,
    run_autogpt
)
from tqdm import tqdm

ROLE = (
    "You are an expert fact checker. You are given a claim"
    " that may be true or false. Your task is to verify the"
    " validity of the claim. Strictly follow these steps:"
    " First, search the web using the"
    " given Google custom search engine to gather a table of structured"
    " data that can be used to check the validity of the claim."
    " Then, write a Python script that"
    " loads the data into a Pandas dataframe, and executes a"
    " query against the dataframe that confirms or denies the claim."
    " Do not attempt to execute the Python script. Having a"
    " string that, if in a .py file, would execute, is enough."
    " In the Python script, define a function called \'validate_statement\'"
    " that returns True if the statement is validated, False otherwise."
    " The function signature should strictly look like validate_statement(df)."
    " Finally, based off the results of the code, verify"
    " whether the original claim was true or false."
    " Your final answer should strictly follow the provided JSON schema,"
    " with no other words or punctuation."
    " You answer should be able to be decoded by a JSON decoder,"
    " so make sure it strictly adheres to the format. Remember that"
    " JSON format requires double quotes. Your answer (in the schema)"
    " should be in the \"reason\" field when you use the \"finish\" tool."
    f" Schema: {VerificationAgentResult.model_json_schema()}"
)


def save_result(
        result: VerificationResult | None, save_path: Path, row: pd.Series,
        idx: int):
    if result is None:
        row["result"] = False
        row["data"] = None
        row["code"] = None
        row["sources"] = None
        row["total_cost"] = None
        row["total_input_tokens"] = None
        row["total_output_tokens"] = None
        row["error"] = None
        row.to_json(save_path / f"{str(idx)}.json", orient="index", indent=4)
        return

    if result.result is not None:
        row["result"] = (
            (row["label"] == result.result.validity)
            and (result.result.data != "")
            and (result.result.code != "")
            and (result.result.data is not None)
            and (result.result.code is not None)
        )
        row["data"] = result.result.data
        row["code"] = result.result.code
    else:
        row["result"] = False
        row["data"] = None
        row["code"] = None
    if result.action_history is not None:
        row["sources"] = result.action_history.sources
    else:
        row["sources"] = None
    row["total_cost"] = result.total_cost
    row["total_input_tokens"] = result.total_input_tokens
    row["total_output_tokens"] = result.total_output_tokens
    row["error"] = result.error

    row.to_json(save_path / f"{result.index}.json", orient="index", indent=4)


def main(args):

    input_path = (VERIFICATION_TEST_PATH
                  if args.input is None
                  else args.input)
    save_path = (VERIFICATION_SAVE_PATH
                 if args.results_dir is None
                 else args.results_dir)

    if args.clean:
        clean(f"{str(save_path)}/*")
        clean(f"{str(args.agent_data_dir)}/*")

    test_data = pd.read_json(
        input_path,
        encoding="utf-8",
        encoding_errors="replace"
    )
    test_data.set_index("id", inplace=True)
    test_data["result"] = False
    test_data["cost"] = 0.0
    test_data["sources"] = [[""]] * len(test_data)
    test_data["data"] = ""
    test_data["code"] = ""
    test_data["error"] = None

    test_data = test_data.iloc[args._from - 1: args.to]

    if args.append:
        last_file = find_last_file(args.agent_data_dir)
        test_data = test_data.iloc[last_file:]

    if args.single:
        idx = args.single
        test_data = test_data.iloc[args.single - 1]
        claim = f"Claim: {test_data["claim"]}"
        run_autogpt(
            claim,
            idx,
            ROLE
        )
        result = VerificationResult.from_json(
            args.agent_data_dir / str(idx) / "state.json", idx=idx)
        save_result(
            result=result,
            save_path=save_path,
            row=test_data,
            idx=idx,
        )
        return

    claims = test_data["claim"].apply(lambda claim: f"Claim: {claim}")

    if not args.no_agpt:
        if args.procs > 1:
            with multiprocessing.Pool(args.procs) as pool:
                if not args.no_agpt:
                    pool.starmap(
                        run_autogpt,
                        zip(
                            claims,
                            test_data.index,
                            repeat(ROLE)
                        )
                    )
        else:
            for idx, row in test_data.iterrows():
                run_autogpt(row["claim"], idx, ROLE)
    for idx, row in tqdm(test_data.iterrows()):
        result = VerificationResult.from_json(
            path=Path(args.agent_data_dir / str(idx) / "state.json"),
            idx=idx,
        )
        save_result(
            result=result,
            save_path=save_path,
            row=row,
            idx=idx,
        )


if __name__ == "__main__":
    args = parse_args()
    main(args)
