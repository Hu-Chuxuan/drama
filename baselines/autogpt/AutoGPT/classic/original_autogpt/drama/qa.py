from itertools import repeat
import multiprocessing
from pathlib import Path
import pandas as pd
from tqdm import tqdm

from ddb.models import QAResult, QAAgentResult
from ddb.util import (
    QA_SAVE_PATH,
    QA_TEST_PATH,
    parse_args,
    clean,
    find_last_file,
    run_autogpt
)


ROLE = (
    "You are an expert researcher. You are given a question from the user."
    " Your task is to answer the question in a clear and concise way."
    " Strictly follow these steps:"
    " First, search the web using the"
    " given Google custom search engine to gather a table of structured"
    " data that can be used to answer the question."
    " Then, write a Python script that"
    " loads the data into a Pandas dataframe, and executes a"
    " query against the dataframe that yields an answer to the question."
    " Do not attempt to execute the Python script. Having a"
    " string that, if in a .py file, would execute, is enough."
    " In the Python script, define a function called \'answer_question\'"
    " that returns the answer to the question."
    " The function signature should strictly look like answer_question(df)."
    " Finally, based off the results of the code, provide a concise"
    " answer to the question."
    " Your final answer should strictly follow the provided JSON schema,"
    " with no other words or punctuation. Your answer should be"
    " able to be decoded by a JSON decoder, so make sure it strictly"
    " adheres to the format. Remember that JSON formattting requires double quotes."
    ". Your answer (in the schema)"
    " should be in the \"reason\" field when you use the \"finish\" tool."
    f" Schema: {QAAgentResult.model_json_schema()}"
)


def save_result(result: QAResult, save_path: Path, row: pd.Series, idx: int):
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
        row["result"] = result.result.answer
        row["data"] = result.result.data
        row["code"] = result.result.code
    else:
        row["result"] = None
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

    input_path = (QA_TEST_PATH
                  if args.input is None
                  else args.input)
    save_path = (QA_SAVE_PATH
                 if args.results_dir is None
                 else args.results_dir)

    if (not args.append) and (not args.no_agpt) and (not args.no_clean):
        clean("ddb/results/qa/*")
        clean("data/agents/*")

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

    if args.append:
        last_file = find_last_file(args.agent_data_dir)
        test_data = test_data.iloc[last_file:]

    questions = test_data["question"]

    with multiprocessing.Pool(args.procs) as pool:
        if not args.no_agpt:
            pool.starmap(
                run_autogpt,
                zip(
                    questions,
                    test_data.index,
                    repeat(ROLE),
                )
            )
        for idx, row in tqdm(test_data.iterrows()):
            result = QAResult.from_json(
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
