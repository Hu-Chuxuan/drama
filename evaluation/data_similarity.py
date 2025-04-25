import os
import numpy as np
from openai import OpenAI
from prompts import DATA_SIMILARITY, SEPARATE_COLUMNS
from dotenv import load_dotenv
from sklearn.metrics.pairwise import cosine_similarity

def eval_data(df1, df2, task, query_info, column_match = True, method="llm-as-a-judge"):

    if method == "llm-as-a-judge":
        if task == "verification":
            action = "verifying"
            query = query_info["claim"]
        else:
            action = "answering"
            query = query_info["question"]
        
        if column_match:
            return eval_data_llm_column_match(df1, df2, query, action)
        else:
            return eval_data_llm(df1, df2, query, action)
        
    elif method == "embedding":
        if column_match:
            return eval_data_embedding_column_match(df1, df2)
        else:
            return eval_data_embedding(df1, df2)

def eval_data_llm(df1, df2, query, action):
    messages = [
        {
            "role": "user",
            "content": DATA_SIMILARITY.format(query=query, df1_head=df1.head(), df2_head=df2.head(), action=action)
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

def eval_data_llm_column_match(df1, df2, query, action):
    messages = [
        {
            "role": "user",
            "content": SEPARATE_COLUMNS.format(query=query, df1_head=df1.head(), df2_head=df2.head(), action=action)

        }
    ]
    openai_api_key = os.getenv('OPENAI_API_KEY')
    openai_org = os.getenv('OPENAI_ORG')
    client = OpenAI(api_key=openai_api_key, organization=openai_org)

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
    ).choices[0].message.content

    return float(response)

def eval_data_embedding(df1, df2):
    load_dotenv()
    openai_api_key = os.getenv('OPENAI_API_KEY')
    openai_org = os.getenv('OPENAI_ORG')
    client = OpenAI(api_key=openai_api_key, organization=openai_org)

    text1 = f"{df1.head()}"
    text2 = f"{df2.head()}"

    embedding1 = client.embeddings.create(input = [text1], model="text-embedding-3-small").data[0].embedding
    embedding2 = client.embeddings.create(input = [text2], model="text-embedding-3-small").data[0].embedding
    return cosine_similarity([embedding1], [embedding2])[0][0]

def eval_data_embedding_column_match(df1, df2):
    df1_cols = list(df1.columns.values)
    df2_cols = list(df2.columns.values)

    openai_api_key = os.getenv('OPENAI_API_KEY')
    openai_org = os.getenv('OPENAI_ORG')
    client = OpenAI(api_key=openai_api_key, organization=openai_org)

    df1_embeddings = []
    for col in df1_cols:
        embedding = client.embeddings.create(input = [str(df1[col].to_frame())], model="text-embedding-3-small").data[0].embedding
        df1_embeddings.append(embedding)
    df2_embeddings = []
    for col in df2_cols:
        embedding = client.embeddings.create(input = [str(df2[col].to_frame())], model="text-embedding-3-small").data[0].embedding
        df2_embeddings.append(embedding)

    best_similarities = []
    for i in range(len(df1_embeddings)):
        similarities = []
        for j in range(len(df2_embeddings)):
          similarity = cosine_similarity([df1_embeddings[i]], [df2_embeddings[j]])[0][0]
          similarities.append(similarity)
        best_similarities.append(max(similarities))

    avg_similarity = np.mean(best_similarities)
    return avg_similarity