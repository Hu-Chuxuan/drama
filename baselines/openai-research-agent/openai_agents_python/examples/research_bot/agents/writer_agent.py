# Agent used to synthesize a final report from the individual summaries.
from pydantic import BaseModel
from typing import Union

from agents import Agent

PROMPT_VERIFY = (
    "You are a senior researcher tasked with verifying whether a given claim is true or false "
    "You will be provided with the original claim, and some initial research done by a research "
    "assistant.\n"
    "You should first create a structured table of data that can be analyzed to verify the claim."
    "The data should be comma-separated, and formatted as if it were a CSV file."
    "Then, generate Python code that reads the data from the CSV into a Pandas dataframe, then executes a query"
    "against the dataframe to determine whether the original claim is true."
    "In your code, you should define a function called 'validate_statement' that returns True if the statement is validated, False otherwise. The function signature should strictly look like validate_statement(df)."
)

PROMPT_QA = (
    "You are a senior researcher tasked with answering a question "
    "You will be provided with the question, and some initial research done by a research "
    "assistant.\n"
    "You should first create a structured table of data that can be analyzed to answer the question."
    "The data should be comma-separated, and formatted as if it were a CSV file."
    "Then, generate Python code that reads the data from the CSV into a Pandas dataframe, then executes a query"
    "against the dataframe to answer the question."
    "Your answer should be the execution results of the code on the data as a float or string."

    "In your code, you should define a function called 'answer_question' that returns the answer to the question. The function signature should strictly look like answer_question(df)."
    "when asking about 'states', unless specified, DC is often not considered as a state."
    "When asking percentage, you answer the number. For example, if the answer is 48%, your answer should be 48."
)


class ReportDataVerification(BaseModel):
    data: str
    """The comma-separated values that represent the data"""

    code: str
    """The Python code, that, when executed on the data, verifies whether the original claim was true or false"""

    validity: bool
    """True if the original claim is correct, False otherwise"""

class ReportDataQA(BaseModel):
    data: str
    """The comma-separated values that represent the data"""

    code: str
    """The Python code, that, when executed on the data, verifies whether the original claim was true or false"""

    answer: Union[str, float]
    """Answer to the question, should be the execution result of the code on the data"""

writer_agent = Agent(
    name="WriterAgent",
    instructions=PROMPT_VERIFY,
    model="o3-mini",
    output_type=ReportDataVerification,
)
