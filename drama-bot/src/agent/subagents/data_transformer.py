from pdf2image import convert_from_path
from io import BytesIO, StringIO

import os
import re
import pandas as pd
import json
import base64
import requests
import fnmatch
import PyPDF2
import pytesseract
import logging

from agent.prompts import RETRIEVER_FILE_SELECTION_TASK_DESC, RETRIEVER_JOIN_TABLE_TASK_DESC, RETRIEVER_PDF_TASK_DESC, RETRIEVER_PLAN_TASK_DESC
from agent.utils import COST_DICT

class DataTransformer:
    def __init__(self, task, api_key, api_model, org, output_path, client):
        self.task = task
        self.client = client
        self.api_model = api_model
        self.output_path = output_path
        self.api_key = api_key
        self.org = org
        self.checked_files = []
    
    def run(self, query):
        all_files = os.listdir(self.output_path)
        filtered_files = [
            f for f in all_files
            if os.path.isfile(os.path.join(self.output_path, f)) and not fnmatch.fnmatch(f, "screenshot*.png") and f != "output.json"
        ]
        while len(self.checked_files) != len(filtered_files):
            res1, res2 = self.check_enough_info(query)
            if res1 == "True":
                return True, res2
            file = self.file_selection(query, res2)

            if file.endswith(".pdf"):
                self.pdf_analyzer(query, file, res2)
            elif file.endswith(".csv") or file.endswith(".tsv"):
                self.csv_converter(query, file, res2)
            elif file.endswith(".xlsx") or file.endswith(".xlsx"):
                self.excel_converter(query, file, res2)
            self.checked_files.append(file)
    
    def jointables(self, query, df1, df2, missing_info):
        if self.task == "verification":
            action = "verify"
        else:
            action = "answer"

        prompt = RETRIEVER_JOIN_TABLE_TASK_DESC.format(action=action, query=query, df1_columns=df1.columns, df1_head=df1.head(), df2_columns=df2.columns, df2_head=df2.head(), missing_info=missing_info)

        response = self.client.chat.completions.create(
            model=self.api_model,
            messages=[
                {"role": "system", "content": "You are a Python code generator specializing in Pandas. Provide only raw Python code without any markdown formatting."},
                {"role": "user", "content": prompt}
            ]
        )

        cost = response.usage.prompt_tokens * COST_DICT[self.api_model]["cost_per_input_token"] + response.usage.completion_tokens * COST_DICT[self.api_model]["cost_per_output_token"]
        output_file = os.path.join(self.output_path, "output.json")
        with open(output_file, "r") as f:
            data = json.load(f)
        data["trace"].append(response.choices[0].message.content.strip())
        if len(data["cost"]) == 0:
            data["cost"].append(cost) 
        else:
            data["cost"].append(cost + data["cost"][-1])
        with open(output_file, "w") as f:
            json.dump(data, f, indent=2)
        
        pandas_code = response.choices[0].message.content.strip()
        
        pandas_code = re.sub(r'```python\n|```', '', pandas_code)
        
        logging.info(f"jointable code: \n\n{pandas_code}")

        exec_globals = {"df1": df1, "df2": df2, "pd": pd, "result_table": 0}
        exec(pandas_code, exec_globals)

        return exec_globals["result_table"]
    
    def check_enough_info(self, query):
        if os.path.exists(f"{self.output_path}/data.csv"):
            df = pd.read_csv(f"{self.output_path}/data.csv")
            existing_columns = df.columns
            df_head = df.head()
        else:
            existing_columns = []
            df_head = []
        
        if self.task == "verification":
            action = "verify"
        else:
            action = "answer"
        
        def planner():
            messages = [
                {
                    "role": "user",
                    "content": RETRIEVER_PLAN_TASK_DESC.format(action=action, query=query, existing_columns=existing_columns, df_head = df_head)
                }
            ]

            response = self.client.chat.completions.create(
                model=self.api_model,
                messages=messages,
            )
            response_content = response.choices[0].message.content
            ls = response_content.split('#')
            res1 = ls[0]
            res2 = ls[1]

            cost = response.usage.prompt_tokens * COST_DICT[self.api_model]["cost_per_input_token"] + response.usage.completion_tokens * COST_DICT[self.api_model]["cost_per_output_token"]
            output_file = os.path.join(self.output_path, "output.json")
            with open(output_file, "r") as f:
                data = json.load(f)
            data["trace"].append(response_content)
            if len(data["cost"]) == 0:
                data["cost"].append(cost) 
            else:
                data["cost"].append(cost + data["cost"][-1])
            with open(output_file, "w") as f:
                json.dump(data, f, indent=2)
                return res1, res2
        return planner()
    
    def file_selection(self, query, missing_info):
        all_files = os.listdir(self.output_path)  # List all files in the directory
        filtered_files = [
            f for f in all_files
            if os.path.isfile(os.path.join(self.output_path, f)) and not fnmatch.fnmatch(f, "screenshot*.png") and f != "output.json"
        ]

        if len(filtered_files) == 1:
            return filtered_files[0]
        
        readme_files = [f for f in filtered_files if "readme" in f.lower()]
        readme_content = ""

        # Process readme files
        for readme_file in readme_files:
            file_path = os.path.join(self.output_path, readme_file)
            
            # Handle .txt files
            if readme_file.lower().endswith(".txt"):
                with open(file_path, "r", encoding="utf-8") as f:
                    readme_content += f"\n\n--- {readme_file} ---\n\n" + f.read()

            # Handle .pdf files (extract text via OCR)
            elif readme_file.lower().endswith(".pdf"):
                try:
                    # Attempt direct text extraction from PDF
                    with open(file_path, "rb") as pdf_file:
                        pdf_reader = PyPDF2.PdfReader(pdf_file)
                        pdf_text = ""
                        for page in pdf_reader.pages:
                            pdf_text += page.extract_text() or ""  # Extract text or empty string if none
                        
                        if pdf_text.strip():  # If text extraction was successful
                            readme_content += f"\n\n--- {readme_file} (PDF extracted text) ---\n\n" + pdf_text
                        else:
                            # If no text was extracted, use OCR
                            images = convert_from_path(file_path)
                            ocr_text = ""
                            for img in images:
                                ocr_text += pytesseract.image_to_string(img) + "\n"
                            
                            readme_content += f"\n\n--- {readme_file} (OCR extracted text) ---\n\n" + ocr_text
                except Exception as e:
                    logging.error(f"Error processing {readme_file}: {e}")
        
        if len(readme_content) > 0:
            readme_content = "Here are the contents of readme file for your reference: " + readme_content
        
        if self.task == "verification":
            action = "verify"
        else:
            action = "answer"

        prompt = RETRIEVER_FILE_SELECTION_TASK_DESC.format(action=action, query=query, filtered_files=filtered_files, missing_info=missing_info, readme_content=readme_content)

        response = self.client.chat.completions.create(
            model=self.api_model,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        filename = response.choices[0].message.content.strip()

        logging.info(f"Selected file: {filename}")

        cost = response.usage.prompt_tokens * COST_DICT[self.api_model]["cost_per_input_token"] + response.usage.completion_tokens * COST_DICT[self.api_model]["cost_per_output_token"]
        output_file = os.path.join(self.output_path, "output.json")
        with open(output_file, "r") as f:
            data = json.load(f)
        data["trace"].append(filename)
        if len(data["cost"]) == 0:
            data["cost"].append(cost) 
        else:
            data["cost"].append(cost + data["cost"][-1])
        with open(output_file, "w") as f:
            json.dump(data, f, indent=2)

        return filename

    def pdf_analyzer(self, query, pdf_file, missing_info):
        def encode_image(image):
            buffer = BytesIO()
            image.save(buffer, format="JPEG")
            return base64.b64encode(buffer.getvalue()).decode('utf-8')

        # Initialize headers
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
            "OpenAI-Organization": self.org
        }

        if self.task == "verification":
            action = "verify"
        else:
            action = "answer"

        respond = ""
        images = convert_from_path(f"{self.output_path}/{pdf_file}")
        page = 0

        cost = 0
        trace = ""
        while page < len(images):
            image = images[page]
            base64_image = encode_image(image)

            payload = {
                "model": "gpt-4o",
                "messages": [
                {
                    "role": "user",
                    "content": [
                    {
                        "type": "text",
                        "text": RETRIEVER_PDF_TASK_DESC.format(action=action, query=query, respond=respond, missing_info=missing_info),
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                        "url": f"data:image/jpeg;base64,{base64_image}"
                        }
                    }
                    ]
                }
                ],
                "max_tokens": 4096
            }

            response = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
            response_json = response.json()

            respond = response_json['choices'][0]['message']['content']
            trace += "\n" + respond
            cost += response_json["usage"]["prompt_tokens"] * COST_DICT["gpt-4o-2024-08-06"]["cost_per_input_token"] + response_json["usage"]["completion_tokens"] * COST_DICT["gpt-4o-2024-08-06"]["cost_per_output_token"]

            if respond[-1] == "#":
                break

        match = re.search(r"```csv\n(.*?)\n```", respond, re.DOTALL)
        if match:
            csv_content = match.group(1)  # Extract content between the triple backticks

            # Convert CSV string to a DataFrame
            df_new = pd.read_csv(StringIO(csv_content))
            df_new["file"] = pdf_file

            # Define output file path
            existing_csv_path = os.path.join(self.output_path, "data.csv")
            if os.path.exists(existing_csv_path):
                df_existing = pd.read_csv(existing_csv_path)
                merged_df = self.jointables(query, df_existing, df_new, missing_info)
                merged_df.to_csv(existing_csv_path, index=False)
            else:
                df_new.to_csv(existing_csv_path, index=False)
        else:
            logging.info("No CSV content found in the input text.")
        
        output_file = os.path.join(self.output_path, "output.json")
        with open(output_file, "r") as f:
            data = json.load(f)
        data["trace"].append(trace)
        if len(data["cost"]) == 0:
            data["cost"].append(cost) 
        else:
            data["cost"].append(cost + data["cost"][-1])
        with open(output_file, "w") as f:
            json.dump(data, f, indent=2)
        
    def csv_converter(self, query, file, missing_info):
        file_path = os.path.join(self.output_path, file)
        df_new = pd.read_csv(file_path, sep="\t" if file.endswith(".tsv") else ",")
        os.remove(file_path)
        df_new["file"] = file
        existing_csv_path = os.path.join(self.output_path, "data.csv")
        if os.path.exists(existing_csv_path):
            df_existing = pd.read_csv(existing_csv_path)
            merged_df = self.jointables(query, df_existing, df_new, missing_info)
            merged_df.to_csv(existing_csv_path, index=False)
        else:
            df_new.to_csv(existing_csv_path, index=False)

    def excel_converter(self, query, file, missing_info):
        file_path = os.path.join(self.output_path, file)
        existing_csv_path = os.path.join(self.output_path, "data.csv")
        try:
            xls = pd.ExcelFile(file_path)  # Load Excel file
            existing_df = None
            if os.path.exists(existing_csv_path):
                existing_df = pd.read_csv(existing_csv_path)

            for sheet_name in xls.sheet_names:
                try:
                    df = pd.read_excel(xls, sheet_name=sheet_name)

                    if df.empty:
                        continue 

                    df["sheet_name"] = sheet_name
                    df["file"] = file

                    if existing_df is not None:
                        existing_df = self.jointables(query, existing_df, df, missing_info)
                    else:
                        existing_df = df

                except Exception as e:
                    logging.info(f"Skipping sheet '{sheet_name}' in {file} due to error: {e}")

            if existing_df is not None:
                existing_df.to_csv(existing_csv_path, index=False)

        except Exception as e:
            logging.error(f"Failed to process {file}: {e}")