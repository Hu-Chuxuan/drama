from agent.prompts import ANALYZER_CODE_GEN_VERIFICATION_TASK_DESC, ANALYZER_CODE_GEN_QA_TASK_DESC
from agent.utils import COST_DICT

import os
import pandas as pd
import re
import json
import logging

from openai import OpenAI

class DataAnalyzer:
    def __init__(self, task, api_key, api_model, org, output_path):
        self.task = task
        self.client = OpenAI(api_key=api_key, organization=org)
        self.api_model = api_model
        self.output_path = output_path
        self.api_key = api_key
        self.org = org

    def run(self, query):

        file_path = f"{self.output_path}/data.csv"

        if os.path.exists(file_path):
            df = pd.read_csv(file_path)
            code = self.code_gen(df, query)
            try:
                return self.code_exec(df, code)
            except:
                return None, df, code
        
        else:
            if self.task == "verification":
                return False, "", ""
            return None, None, None
    
    def code_gen(self, df, query):
        if self.task == "verification":
            prompt = ANALYZER_CODE_GEN_VERIFICATION_TASK_DESC.format(query=query, df_columns=df.columns, df_head=df.head())
        else:
            prompt = ANALYZER_CODE_GEN_QA_TASK_DESC.format(query=query, df_columns=df.columns, df_head=df.head())

        response = self.client.chat.completions.create(
            model=self.api_model,
            messages=[
                {"role": "system", "content": "You are a Python code generator specializing in Pandas. Provide only raw Python code without any markdown formatting."},
                {"role": "user", "content": prompt}
            ]
        )
        
        pandas_code = response.choices[0].message.content.strip()
        pandas_code = re.sub(r'```python\n|```', '', pandas_code)

        cost = response.usage.prompt_tokens * COST_DICT[self.api_model]["cost_per_input_token"] + response.usage.completion_tokens * COST_DICT[self.api_model]["cost_per_output_token"]
        output_file = os.path.join(self.output_path, "output.json")
        with open(output_file, "r") as f:
            data = json.load(f)
        data["trace"].append(pandas_code)
        if len(data["cost"]) == 0:
            data["cost"].append(cost) 
        else:
            data["cost"].append(cost + data["cost"][-1])
        with open(output_file, "w") as f:
            json.dump(data, f, indent=2)

        return pandas_code
    
    def code_exec(self, df, code):

        local_vars = {'pd': pd}
        
        try:
            exec(code, globals(), local_vars)
        except Exception as e:
            logging.info(f"Error executing generated code: {e}")
            logging.info(f"Generated code: {code}")
            return None, df, code
        
        if self.task == "verification":
            if 'validate_statement' in local_vars:
                result = local_vars['validate_statement'](df)
                return result, df, code
            else:
                logging.info(f"Error executing generated code: {e}")
                logging.info(f"Generated code: {code}")
                return None, df, code
        else:
            if 'answer_question' in local_vars:
                result = local_vars['answer_question'](df)
                return result, df, code
            else:
                logging.info(f"Error executing generated code: {e}")
                logging.info(f"Generated code: {code}")
                return None, df, code