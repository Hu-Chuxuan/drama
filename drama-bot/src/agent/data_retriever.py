from agent.prompts import RETRIEVER_WEBSITE_RANK
from agent.utils import BLACKLIST
from .subagents import WebBrowser, DataTransformer, WebAugmenter

from io import StringIO
from openai import OpenAI

import os
import re
import pandas as pd
import ast
import logging

class DataRetriever:
    def __init__(self, task, api_key, api_model, org, output_path):
        self.task = task
        self.output_path = output_path
        self.api_model = api_model
        self.client = OpenAI(api_key=api_key, organization=org)
        self.api_key = api_key
        self.org = org

        # initialization of subagents
        self.web_browser = WebBrowser(
            api_key=api_key,
            api_model=api_model,
            output_dir=self.output_path,
            org=org,
            task=task
        )
        self.data_transformer = DataTransformer(
            api_key=api_key,
            api_model=api_model,
            output_path=self.output_path,
            org=org,
            task=task,
            client=self.client
        )
        self.web_augmenter = WebAugmenter(task=task, client=self.client, output_path=output_path)

    def run(self, query):
        search_path = []
        file_path = f"{self.output_path}/data.csv"

        # Iteration 1 of Stages 1->2
        logging.info("🪄 Web Browser Starts")
        try:
            search_path += self.web_browser.run(query) 
        except:
            pass

        logging.info("🪄 Data Transformer Starts")
        try:
            self.data_transformer.run(query) 
        except:
            pass

        # check if there is enough information
        extracted = True
        if os.path.exists(file_path):
            df = pd.read_csv(file_path)
            if df.empty:
                extracted = False
        else:
            extracted = False
        
        if extracted:
            return search_path
        
        # Iteration 2 of Stages 1->2
        logging.info("🪄 Web Augmenter Starts")
        augment_data_res, augment_data_path = self.web_augmenter.run(query) # call web augmenter
        # check if web augmenter is reliable
        if not any(
            url and any(domain in url for domain in BLACKLIST)
            for url in augment_data_path
        ):
            pattern_csv = r"```csv\s*([\s\S]+?)\s*```" 
            csv_blocks = re.findall(pattern_csv, augment_data_res)
            data_string = csv_blocks[0] if csv_blocks else None
            if data_string and data_string.strip():
                data = pd.read_csv(StringIO(data_string))
                if not data.empty:
                    data.to_csv(file_path, index=False)
                    return search_path + augment_data_path
        
        # Iterations [3, n] of Stages 1->2
        try:
            websites = self.rank_website(query, augment_data_res)
        except:
            return search_path
        for website in websites:
            try:
                logging.info("🪄 Web Browser Starts")
                _search_path = self.web_browser.run(query, website)

                logging.info("🪄 Data Transformer Starts")
                self.data_transformer.run(query)
            except:
                return search_path
            extracted = True
            if os.path.exists(file_path):
                df = pd.read_csv(file_path)
                if df.empty:
                    extracted = False
            else:
                extracted = False
            
            if extracted:
                search_path += _search_path
                return search_path
            
        return search_path
    
    def rank_website(self, query, augment_data_res):
        if self.task == "verification":
            action = "verify"
        else:
            action = "answer"

        response = self.client.chat.completions.create(
            model=self.api_model,
            messages=[
                {"role": "user", "content": RETRIEVER_WEBSITE_RANK.format(action=action, query=query, prelim_response=augment_data_res)}
            ]
        )

        split_parts = response.choices[0].message.content.split("#", 1)
        response_content = split_parts[0].strip()
        match = re.search(r"\[.*?\]", response_content, re.DOTALL)
        if match:
            response_content = match.group(0)
        else:
            return []
        augment_data_path = ast.literal_eval(response_content)

        website_ranks = [
            url for url in augment_data_path
            if not any(domain in url for domain in BLACKLIST)
        ]

        return website_ranks
            
