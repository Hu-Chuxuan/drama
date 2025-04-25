import glob
import multiprocessing
import os
import shutil
import argparse
from pathlib import Path
import subprocess

BLACKLIST = ["x.com", "twitter.com", "politifact.com", "factcheck.org",
             "reuters.com", "instagram.com", "facebook.com", "guardian.com", "usafacts.org"]

VERIFICATION_SAVE_PATH = Path("ddb/results/verification/")
VERIFICATION_TEST_PATH = Path("../../drama-bench/verification/query.json")
QA_SAVE_PATH = Path("ddb/results/qa/")
QA_TEST_PATH = Path("../../drama-bench/qa/query.json")
AGENT_DATA_PATH = Path("data/agents/")


def run_autogpt(task: str, idx: str, role: str, blacklist=BLACKLIST):
    try:
        subprocess.call([
            "autogpt.bat", "run",
            "--ai-task", task,
            "--skip-reprompt",
            "--continuous",
            "--continuous-limit", "15",
            "--skip-news",
            "--ai-role", role,
            "--ai-name", str(idx),
            "--constraint", f"You may not access any sources from the following list: {blacklist}",
        ])
    except Exception as e:
        print(f"An error occured for claim {idx}: {e}")


def clean(path: str):
    for dir_path in glob.glob(path):
        if os.path.isdir(dir_path):
            shutil.rmtree(dir_path)
        elif os.path.isfile(dir_path):
            os.remove(dir_path)


def find_last_file(path):
    files = [f for f in os.listdir(path) if '-' not in f]
    numbers = [int(file.split(".")[0]) for file in files]
    return max(numbers)


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--append",
        action="store_true",
        help="Option to not clean the results and data folder and"
        " instead continue from last left off"
    )
    parser.add_argument(
        "--no-agpt",
        action="store_true",
        help="Option to skip the process of"
        " creating the state.json files. Assuming"
        " this process is done separately."
    )
    parser.add_argument(
        "--input",
        type=Path,
        help="The path to the test data",
    )
    parser.add_argument(
        "--results-dir",
        type=Path,
        help="The path to the folder to save results in",
    )
    parser.add_argument(
        "--procs",
        type=int,
        default=multiprocessing.cpu_count(),
        help="The number of processes to use for multiprocessing",
    )
    parser.add_argument(
        "--agent-data-dir",
        type=Path,
        default=AGENT_DATA_PATH,
        help="The path to the directory containing the state.json files",
    )
    parser.add_argument(
        "--clean",
        action="store_true",
        help="Option to clean the agent data and results directory",
    )
    parser.add_argument(
        "--from",
        type=int,
        default=1,
        dest="_from",
        help="The starting index",
    )
    parser.add_argument(
        "--to",
        type=int,
        default=100,
        help="The ending index",
    )
    parser.add_argument(
        "--single",
        type=int,
        help="Option to run a single file",
    )
    return parser.parse_args()
