from agent.prompts import RETRIEVER_WEBSEARCH_VERIFICATION, RETRIEVER_WEBSEARCH_QA
from agent.utils import COST_DICT

import os
import json

class WebAugmenter:
    def __init__(self, task, client, output_path):
        self.task = task
        self.client = client
        self.output_path = output_path

    def run(self, query):

        if self.task == "verification":
            prompt = RETRIEVER_WEBSEARCH_VERIFICATION.format(query=query)
        else:
            prompt = RETRIEVER_WEBSEARCH_QA.format(query=query)

        completion = self.client.chat.completions.create(
            model="gpt-4o-search-preview",
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
        )
        trace = "Annotations:\n" + str(completion.choices[0].message.annotations) + "\n\nMessage Content:\n" + completion.choices[0].message.content
        cost = completion.usage.prompt_tokens * COST_DICT["gpt-4o-search-preview"]["cost_per_input_token"] + completion.usage.completion_tokens * COST_DICT["gpt-4o-search-preview"]["cost_per_output_token"]
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

        search_path = []
        for citation in completion.choices[0].message.annotations:
            search_path.append(citation["url_citation"]["url"])
        return completion.choices[0].message.content, search_path