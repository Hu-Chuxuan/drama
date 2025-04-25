import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.chrome.options import Options
import os
from selenium.common.exceptions import TimeoutException, StaleElementReferenceException
import re
import json
import argparse
from concurrent.futures import ThreadPoolExecutor

BASE_URL = "http://localhost:3000"

def wait_for_report_or_error(driver, timeout=120):
    wait = WebDriverWait(driver, timeout)

    def check(driver):
        try:
            error_elem = driver.find_elements(By.XPATH, "//div[normalize-space()='Agent Error']")
            if error_elem:
                return "error"

            start_button = driver.find_element(By.XPATH, "//button[normalize-space()='Start Deep Research']")
            if start_button.is_displayed():
                return start_button

            return False
        except:
            return False

    return wait.until(check)

def get_latest_report_file(directory):
    files = os.listdir(directory)
    report_files = []

    pattern = re.compile(r'report-(\d+)\.json')

    for filename in files:
        match = pattern.match(filename)
        if match:
            num = int(match.group(1))
            report_files.append((num, filename))

    if not report_files:
        return None

    latest_file = max(report_files, key=lambda x: x[0])[1]
    return os.path.join(directory, latest_file)

def postprocess(value):
    if isinstance(value, str):
        normalized = value.strip().lower()
        if normalized == "true":
            return True
        elif normalized == "false":
            return False
        else:
            return re.sub(r'[$%]', '', value)
    return value

def run_single_task(item, isQa, directory):
    if not os.path.exists(directory):
        os.makedirs(directory)
    chrome_options = Options()
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--disable-dev-shm-usage")
    #chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument("--ignore-certificate-errors")
    chrome_options.add_argument("--allow-insecure-localhost")
    chrome_options.add_argument("--disable-usb")
    chrome_options.add_argument(
        "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    )
    driver = webdriver.Chrome(
        options=chrome_options,
    )
    driver.set_page_load_timeout(20)
    driver.get(BASE_URL)

    claim = item["question"] if isQa else item["claim"]
    data = {
        "id": item["id"],
        "claim": claim,
        "label": item["label"],
        "status": "pending"
    }

    try:
        driver.refresh()
        checkbox_button = driver.find_element(By.ID, "agent-mode")
        if checkbox_button.get_attribute("aria-checked") == "false":
            checkbox_button.click()
        time.sleep(3)
        search_box = driver.find_element(By.XPATH, "//input[@placeholder=\"What would you like to research? (e.g., 'Tesla Q4 2024 financial performance and market impact')\"]")
        search_box.clear()
        search_box.send_keys(claim)

        start_button = driver.find_element(By.XPATH, "//button[normalize-space()='Start Deep Research']")
        start_button.click()

        result = wait_for_report_or_error(driver, timeout=120)
        if result == "error":
            data["status"] = "error"
            driver.refresh()
            time.sleep(5)
        else:
            data["status"] = "success"
            report_file = get_latest_report_file("../output")
            if report_file:
                with open(report_file, 'r', encoding='utf-8') as f:
                    dir_data = json.load(f)
                dir_data["result"] = postprocess(dir_data["result"])
                data.update(dir_data)
            else:
                data["status"] = "error"

    except (TimeoutException, StaleElementReferenceException) as e:
        data["status"] = "error"
        #print("Caught error:", str(e))
        driver.refresh()
        time.sleep(3)
        return

    # Save result
    key = "qa-" + str(item["id"]) if isQa else "verification-" + str(item["id"])
    with open("results/log.json", 'r+') as log_file:
        log = json.load(log_file)
        if key not in log:
            log[key] = {
                "claim": claim,
                "results": [],
                "statuses": []
            }
        log[key]["results"].append(data.get("result", "none"))
        log[key]["statuses"].append(data["status"])
        log_file.seek(0)
        json.dump(log, log_file, indent=4)
        log_file.truncate()

    filename = f"{directory}/{item['id']}.json"
    with open(filename, 'w') as file:
        json.dump(data, file, indent=4)

def run_deep_research(input_data, directory, isQa, max_workers):
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = []
        for item in input_data:
            future = executor.submit(run_single_task, item, isQa, directory)
            futures.append(future)
    
    #wipe directory if needed
    # with os.scandir("../output") as entries:
    #     for entry in entries:
    #         if entry.is_file() and entry.name != "cost.json":
    #             os.unlink(entry.path)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--test_file', type=str, default='input/qa.json')
    parser.add_argument('--test_task', type=str, default='qa')
    parser.add_argument("--output_dir", type=str, default='results/qa')
    parser.add_argument("--max_workers", type=int, default=1)
    args = parser.parse_args()

    with open(args.test_file, 'r',encoding='utf-8') as f:
        input_data = json.load(f)
    run_deep_research(input_data, args.output_dir, args.test_task == "qa", args.max_workers)

if __name__ == "__main__":
    main()