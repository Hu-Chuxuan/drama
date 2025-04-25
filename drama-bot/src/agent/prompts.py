RETRIEVER_SEARCH_TERM_DESC = """
Your task is to extract the search term needed to {action} the query: "{query}"
If there is a specific source mentioned in the claim, you should include that source as part of your search term.
You should directly return the search term. The search term should NOT include and quote symbols like ". 
You should only return one search term.
Without specification, the data refers to that in USA.
"""

RETRIEVER_BROWSE_SYSTEM_PROMPT = """Imagine you are a robot browsing the web, just like humans. Now you need to complete a task. In each iteration, you will receive an Observation that includes a screenshot of a webpage and some texts. This screenshot will feature Numerical Labels placed in the TOP LEFT corner of each Web Element.
Carefully analyze the visual information to identify the Numerical Label corresponding to the Web Element that requires interaction, then follow the guidelines and choose one of the following actions:
1. Click a Web Element.
2. Delete existing content in a textbox and then type content. 
3. Scroll up or down. Multiple scrolls are allowed to browse the webpage. Pay attention!! The default scroll is the whole window. If the scroll widget is located in a certain area of the webpage, then you have to specify a Web Element in that area. I would hover the mouse there and then scroll.
4. Wait. Typically used to wait for unfinished webpage processes, with a duration of 5 seconds.
5. Go back, returning to the previous webpage. You have to choose this for other sources if you saw a verification page.
6. Google, directly jump to the Google search page. When you can't find information in some websites, try starting over with Google.
7. Get data. This action should only be chosen when you find the necessary data to {action} the query directly from the webpage; you should return the data in csv format as ```csv ``` (this formatting is mandatory). You should return the minimal information you need, and name the column names very straightforward. Your first column should always be Source, with each row being the source website.
The numeric values should always be a number rather than a string, you can specify the units (e.g., %) in the column names.
For example, ```csv Year,Net Increase (%)
2024, 30
```
Do NOT add commas (,) in the numeric values in the csv, and for strings, including the column names, remember to quote using " for strings that contains commas (",") in order to not messing up with the csv formatting.
The data can appear in a chart with no exact labels, in such cases you return an estimation to the accuracy level as in the claim to be verified.
8. Download. This action checks whether the download process has properly started. YOU HAVE TO CHOOSE THIS ACTION immediately after you think you have clicked a download link.
9. Check the Web Element. You should always choose this action BEFORE you select 10 (Get the Link of an Element): if the link directs to a file, you should choose 'Get the Link of an Element'.
10. Get the Link of an Element. You should NOT choose this if the link does not point to a file like .pdf, .csv, .zip, .xlsx, etc. If the checked link does NOT include a file extension, you should NOT choose this action. This action should only be chosen when you believe you have found the download link and return from the task. This action should only be chosen when you ARE SURE that the link points to a file after executing 9 (Check the Web Element). Before this you should always check the link of the web element first. This action won't bring any difference to the screenshot.

Correspondingly, Action should STRICTLY follow the format:
- Click [Numerical_Label]
- Type [Numerical_Label]; [Content]
- Scroll [Numerical_Label or WINDOW]; [up or down]
- Wait
- GoBack
- Google
- GetData; [content]
- Download
- CheckLink [Numerical_Label]
- GetLink [Numerical_Label]

Key Guidelines You MUST follow:
* Action guidelines *
0) You should ALWAYS scroll up and down to view the entire webpage before you decide to go to other pages. When you click sth and it doesn't respond, scroll down or explore other items.
1) To input text, NO need to click textbox first, directly type content. After typing, the system automatically hits `ENTER` key. Sometimes you should click the search button to apply search filters. Try to use simple language when searching.  
2) You must distinguish between textbox and search button, don't type content into the button! If no textbox is found, you may need to click the search button first before the textbox is displayed. 
3) Execute only one action per iteration. 
4) STRICTLY Avoid repeating the same action if the webpage remains unchanged. You may have selected the wrong web element or numerical label. Continuous use of the Wait is also NOT allowed.
5) Double check the formatting requirements in the task when GetData. 
6) You should ALWAYS get data that are from official websites; i.e., You should NOT use data from news websites like Reuter.
7) You HAVE to wrap CSV contents into ```csv ```.
8) You should always get the file if you do not find all information at hand.
9) You are CANNOT access these domains: {blacklist}.
10) If clicking the element does not direct you to a new page, your next action have to be checking the link of the SAME element.
11) You should NOT get the link of an element that points to a file that's already inspected in the previous run.

* Web Browsing Guidelines *
1) Don't interact with useless web elements like Login, Sign-in, donation that appear in Webpages. Pay attention to Key Web Elements like search textbox and menu.
2) Vsit video websites like YouTube is allowed BUT you can't play videos. Clicking to download PDF is allowed and will be analyzed by the Assistant API.
3) Focus on the numerical labels in the TOP LEFT corner of each rectangle (element). Ensure you don't mix them up with other numbers (e.g. Calendar) on the page.
4) Focus on the date in task, you must look for results that match the date. It may be necessary to find the correct year, month and day at calendar.
5) Pay attention to the filter and sort functions on the page, which, combined with scroll, can help you solve conditions like 'highest', 'cheapest', 'lowest', 'earliest', etc. Try your best to find the answer that best fits the task.
6) When there are no data from a specific year, try getting the nearest data before that.

Your reply should strictly follow the format:
Thought: Your brief thoughts (briefly summarize the info that will help collecting data)
Action: One Action format you choose

Then the User will provide:
Observation: A labeled screenshot Given by User"""

RETRIEVER_FIND_WEBSITE_TASK_DESC = """
Your task is to find the for the data required to {action} the query: "{query}". 
You should start by search for the initial term: "{search_term}"
Your return value can either be (1) a download link; in this case, when you think you find the link, you should return it by calling the get_link tool. The final download link should be the last link you get.
or (2) the raw data appearing in CSV format.
Without specification, the data refers to that in USA.
Note: when asking about "states", unless specified, DC is often not considered as a state.
"""

RETRIEVER_PLAN_TASK_DESC = """
Your task is to check if you have enough information to {action} the query: "{query}"
You are provided with a dataframe with the following columns: "{existing_columns}"
The first few lines of the data (df.head()): "{df_head}"
If you already have enough information (i.e., your output is "True"), you should output the code you will execute on the data to inspect the query;
If you don't have enough information (i.e., your output is "False"), you should output a list of additional information needed to inspect the query.
Your output format can ONLY be "True"/"False" + "#" + "code/additional information"
Hint: as long as the data file is not empty, you should likely return True.
Without specification, the data refers to that in USA.
"""

RETRIEVER_PDF_TASK_DESC = '''You are given an image that is part of a document. Your task is to extract the necessary data to {action} the query: "{query}".
The answer should be a relation table, where the column names are entities and rows are values, wrapped with ```csv ```, and you should integrate with the previous responses {respond} to form a new csv.
The numeric values should always be a number rather than a string, you can specify the units (e.g., %) in the column names.
You currently missing these information: {missing_info}.
If this page does not contain additional info, just return the previous response.
Append "#" at the end of your response (outside of ```csv```) as soon as you think you don't need to go over the rest of the doc and have already get adequate data to verify the query.
If you want to view more pages, DONT append the "#". Do NOT add commas (,) in the numeric values in the csv, and for strings remember to quote in order to not messing up with the csv formatting.
If you feel that you can't get any useful information from this document, you should also append the "#" and dont put anything as a csv.
Without specification, the data refers to that in USA.
'''

RETRIEVER_FILE_SELECTION_TASK_DESC = """
To {action} the query "{query}", you are provided with the following files: {filtered_files}.
Your job is to identify which ONE file contains the data to answer the query.
You currently missing these information: {missing_info}.
{readme_content}
You should output and only output the file name.
Without specification, the data refers to that in USA.
"""

RETRIEVER_JOIN_TABLE_TASK_DESC = """
You job is to come up with a python code snippet to join the two tables df1 and df2 to be able to {action} the query: {query}.

Columns of df1: {df1_columns}
Here's the results of df1.head(): {df1_head}

Columns of df2: {df2_columns}
Here's the results of df2.head(): {df2_head}

You currently missing these information: {missing_info}.

The code should:
1. Use the existing DataFrames df1 and df2, which are named as they are.
2. Use Pandas to process the data
3. You should preserve and only preserve the necessary columns. This said, it is possible that one of the two tables is fully discarded. If df1 has a column that has the same name with one of df2's column, you can safely assume that they represent the same meaning (i.e., they should be merged into a single column).
4. You should strictly follow the data values.
5. The input parameter names should match EXACTLY THE SAME as df1 and df2.
6. The final result (the joined table) should be assigned to the variable `result_table`.

Provide only the Python code without any explanations or markdown formatting.
"""

RETRIEVER_WEBSEARCH_VERIFICATION = '''You should answer whether the claim "{query}" is True or False.
Your response should consist of the following **3** components:
(1) True/False of the claim;
(2) data.csv file content that supports your decision wrapped as ```csv ``; Do NOT add commas (,) in the numeric values in the csv, and for strings remember to quote in order to not messing up with the csv formatting.
(3) the code you used to analyze the data (with return values being True or False) as ```python ```. 
In your code, you should define a function called 'validate_statement' that returns True if the statement is validated, False otherwise. The function signature should strictly look like validate_statement(df).
Note: when asking about "states", unless specified, DC is often not considered as a state.
You SHOULD NOT rely on webpages with domains from the following: "x.com", "twitter.com", "politifact.com", "factcheck.org", "reuters.com", "instagram.com", "facebook.com", "guardian.com", "usafacts.org" as direct data sources.'''

RETRIEVER_WEBSEARCH_QA = '''You should answer the question "{query}", with your response STRICTLT following the template answer to the question + "#" + rest of your response.
Your response should consist of the following **3** components:
(1) answer to the question;
(2) data.csv file content that supports your answer wrapped as ```csv ``; Do NOT add commas (,) in the numeric values in the csv, and for strings remember to quote in order to not messing up with the csv formatting.
(3) the code you used to analyze the data (with return values being the answer) as ```python ```.
In your code, you should define a function called 'answer_question' that returns the answer to the question. The function signature should strictly look like answer_question(df).
Note: when asking about "states", unless specified, DC is often not considered as a state.
You SHOULD NOT rely on webpages with domains from the following: "x.com", "twitter.com", "politifact.com", "factcheck.org", "reuters.com", "instagram.com", "facebook.com", "guardian.com", "usafacts.org" as direct data sources.'''

RETRIEVER_WEBSITE_RANK = ''''
Your task is to extract and rank a list of websites with available data from most reliable/relevant to the least to {action} the query: "{query}".
You are given the following preliminary response with candidate websites as annotations: {prelim_response}.
Your response template should strictly follow the following template: [website list as python lists] + "#" + your reasoning
'''

ANALYZER_CODE_GEN_VERIFICATION_TASK_DESC = """
Generate Python code using Pandas to validate the following user statement:
{query}

Use only these columns: {df_columns}

Here's the results of df.head(): {df_head}

The code should:
1. Use the existing DataFrames
2. Use Pandas to process the data. If you use any libraries besides pd, you should import it in the function.
3. Define a function called 'validate_statement' that returns True if the statement is validated, False otherwise. The function signature should strictly look like validate_statement(df).
4. You should strictly follow the data values in df.head().
5. The input parameter names should match EXACTLY THE SAME as the dataframe names.
6. When you encounter expressions like "about", be sure to expand the range. You should make the range no smaller than 10%. If the number is something ends with 5 or 10, you should consider all rounding ranges (-2.5, +2.5). 
However, if the claim does not have an "about", it means exact comparison.
7. When the column contains numbers but in the form of strings, you should first convert it back to numbers.
8. When comparing whether one candidate "wins", you should compare the number of both candidates.
9. When you have statistics about different states, but are asked about an overall statitics in the country, you should first aggregate the state stats (using mean or sum based on contexts).

Note: when asking about "states", unless specified, DC is often not considered as a state. When there are no specific date, choose the available data from most recent date.

Provide only the Python code without any explanations or markdown formatting.
"""

ANALYZER_CODE_GEN_QA_TASK_DESC = """
Generate Python code using Pandas to answer the following question:
{query}

Use only these columns: {df_columns}

Here's the results of df.head(): {df_head}

The code should:
1. Use the existing DataFrames
2. Use Pandas to process the data. If you use any libraries besides pd, you should import it in the function.
3. Define a function called 'answer_question' that returns the answer to the question. The function signature should strictly look like answer_question(df).
4. You should strictly follow the data values in df.head().
5. The input parameter names should match EXACTLY THE SAME as the dataframe names.
6. When you encounter expressions like "about", be sure to expand the range.
7. When the column contains numbers but in the form of strings, you should first convert it back to numbers.
8. When asking percentage, you answer the number. For example, if the answer is 48%, your answer should be 48.
9. When you have statistics about different states, but are asked about an overall statitics in the country, you should first aggregate the state stats (using mean or sum based on contexts).
10. When the problem doesn't specify million/billion, you shouldn't assume it is - output the raw number. So if you have 2 million, you should output 2000000. If it's already an average value you should not divide it by the length of the year.

Note: when asking about "states", unless specified, DC is often not considered as a state. When there are no specific date, choose the available data from most recent date.

Provide only the Python code without any explanations or markdown formatting.
"""