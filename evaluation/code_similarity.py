import pandas as pd
import numpy as np
import torch
import ast
import os
import sympy

from transformers import AutoModel, AutoTokenizer
from sklearn.metrics.pairwise import cosine_similarity
from dotenv import load_dotenv
from openai import OpenAI
from prompts import CODE_SIMILARITY

def eval_code(code1, code2, task, query_info, normalize = True, method="llm-as-a-judge"):
    
    if normalize:
        code1 = normalize_code(code1)
        code2 = normalize_code(code2)

    if method == "llm-as-a-judge":
        if task == "verification":
            action = "verifying"
            query = query_info["claim"]
        else:
            action = "answering"
            query = query_info["question"]
        return eval_code_llm(code1, code2, query, action)
    elif method == "embedding":
        return eval_code_embedding(code1, code2)

def eval_code_llm(code1, code2, query, action):
    messages = [
        {
            "role": "user",
            "content": CODE_SIMILARITY.format(query=query, code1=code1, code2=code2, action=action)
        }
    ]
    load_dotenv()
    openai_api_key = os.getenv('OPENAI_API_KEY')
    openai_org = os.getenv('OPENAI_ORG')
    client = OpenAI(api_key=openai_api_key, organization=openai_org)

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
    ).choices[0].message.content

    return float(response)

# Uses CodeBERT model, a transformer based model pre-trained on natural language and source code,
# which makes it pretty well suited for understanding code semantics. 
# Unlike regular text embeddings, CodeBERT understands:
# - Functional equivalence despite different syntax
# - Code context and structure
# - Constructs such as loops, conditionals, and function definitions
# This code uses these embeddings to compute cosine similarity between the two code segements.
def eval_code_embedding(code1, code2):
    CODEBERT_MODEL_NAME = "microsoft/codebert-base"
    codebert_tokenizer = AutoTokenizer.from_pretrained(CODEBERT_MODEL_NAME)
    codebert_model = AutoModel.from_pretrained(CODEBERT_MODEL_NAME)

    inputs1 = codebert_tokenizer(code1, return_tensors="pt", truncation=True, max_length=512)
    inputs2 = codebert_tokenizer(code2, return_tensors="pt", truncation=True, max_length=512)
    with torch.no_grad():
        emb1 = codebert_model(**inputs1).last_hidden_state.mean(dim=1).squeeze().numpy()
        emb2 = codebert_model(**inputs2).last_hidden_state.mean(dim=1).squeeze().numpy()
    similarity = np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2))
    return similarity

# Normalizing Code:
# Uses Abstract Syntax Trees to preserve the logic, structure, and semantics of code while 
# normalizing variable names and expanding mathematical expression so that expressions like 
# "x = (a + b) * (a + b)" and "x = (a + b) ** 2" both expand out to "a**2 + 2*a*b + b**2",
# We want to normalize the code prior to comparison just so that things like different variable names and 
# different ways of writing the same mathematical expression do not affect our results.

def normalize_code(code):
    try:
        tree = ast.parse(code)
        tree = AlphaRenamer().visit(tree)
        tree = MathNormalizer().visit(tree)
        ast.fix_missing_locations(tree)
        normalized = ast.unparse(tree)
        return normalized.strip()
    except Exception as e:
        print("Normalization failed:", e)
        return code.strip()

class AlphaRenamer(ast.NodeTransformer):
    def __init__(self):
        self.name_mapping = {}
        self.counter = 0
        self.builtins = set(dir(__builtins__))

    def get_new_name(self, original):
        if original not in self.name_mapping:
            self.name_mapping[original] = f"var_{self.counter}"
            self.counter += 1
        return self.name_mapping[original]

    def visit_Assign(self, node):
        for target in node.targets:
            if isinstance(target, ast.Name) and target.id not in self.builtins:
                target.id = self.get_new_name(target.id)
        self.generic_visit(node)
        return node

    def visit_Name(self, node):
        if isinstance(node.ctx, ast.Load) and node.id in self.name_mapping:
            node.id = self.name_mapping[node.id]
        return node

class MathNormalizer(ast.NodeTransformer):
    def visit_BinOp(self, node):
        self.generic_visit(node)
        try:
            expr = ast.unparse(node)
            simplified = str(sympy.expand(expr))
            simplified_ast = ast.parse(simplified, mode='eval').body
            return simplified_ast
        except Exception:
            return node

    def visit_Expr(self, node):
        if isinstance(node.value, ast.BinOp):
            return ast.Expr(value=self.visit_BinOp(node.value))
        return node