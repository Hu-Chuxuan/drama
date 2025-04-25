DATA_SIMILARITY = """
You job is to evaluate the semantic similarity between df1 and df2 in terms of {action} the query: {query}.

Here's the results of df1.head(): {df1_head}
Here's the results of df2.head(): {df2_head}

Specifically, look at column names and its values. Similar column names should result in higher score.
Make sure to look at columns and its values together. Values that are similar also have to have similar column names for it to gain higher score. 
Words don't have to be in the same order.
Words with similar meaning should be considered the same.
Meaning of the content superceded format. Meaning, if the csv conveys similar information, then give higher score even if the format is different.
You may use preprocessing tactics like stemming or fuzzy matching to assess similarity.

Your output should only be a value between 0 and 1. You should NOT output any additional reasoning texts.
"""

SEPARATE_COLUMNS = """
You job is to separate columns from given dataframes df1 and df2.

Here's the results of df1.head(): {df1_head}
Here's the results of df2.head(): {df2_head}

First, you need to separate each data frame into columns. 

Since you are given Python Pandas dataframe, use Pandas to separate each columns.

After you separate each columns, embed each columns into vector space using OpenAI's embedding model. Use consine similarity to evaluate the similarity between columns of df1 and df2. 

For each column in df1, calculate the consine similarity between all columns in df2.
Match each of the columns from df1 and df2 based on the closest cosine similarity.
Make sure all columns from df1 and df2 are used.
Do not match columns from the same data frame.

Inspect the list of all columns from df1 and df2.
Inspect the matched column names and their similarity scores again.
Make sure the matched columns are the best similarity score.
Then give me the average similarity score of all the pairs.

You should NOT output any additional reasoning texts or code. Just give me the average similarity score.
Again, no other text, just give me the number.
"""
CODE_SIMILARITY = """
You job is to evaluate the semantic similarity between code snippet 1 and code snippet 2 in terms of {action} the query: {query}.

code snippet 1: {code1}
code snippet 2: {code2}

Your output should only be a value between 0 and 1. You should NOT output any additional reasoning texts.
"""