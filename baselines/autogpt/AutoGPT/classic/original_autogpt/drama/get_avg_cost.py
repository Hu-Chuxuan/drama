import glob
import os
import pandas as pd
import json

verification_path = "ddb/results/verification/"
qa_path = "ddb/results/qa/"
verification_files = glob.glob(os.path.join(verification_path, '*.json'))
qa_files = glob.glob(os.path.join(qa_path, '*.json'))

verification_list = []
for file in verification_files:
    with open(file, 'r') as f:
        verification_list.append(json.load(f))

qa_list = []
for file in qa_files:
    with open(file, 'r') as f:
        qa_list.append(json.load(f))

verification = pd.DataFrame(verification_list)
qa = pd.DataFrame(qa_list)

print(verification)
print(qa)
verification_input_cost = verification["total_input_tokens"].sum(skipna=True) * 2.5e-6
verification_output_cost = verification["total_output_tokens"].sum(skipna=True) * 10e-6
qa_input_cost = qa["total_input_tokens"].sum(skipna=True) * 2.5e-6
qa_output_cost = qa["total_output_tokens"].sum(skipna=True) * 10e-6

total_input_cost = verification_input_cost + qa_input_cost
total_output_cost = verification_output_cost + qa_output_cost

print((total_input_cost + total_output_cost) / (len(verification) + len(qa)))
print((verification_input_cost + verification_output_cost) / len(verification))
print((qa_input_cost + qa_output_cost) / len(qa))
print(verification["result"].sum() / len(verification))
