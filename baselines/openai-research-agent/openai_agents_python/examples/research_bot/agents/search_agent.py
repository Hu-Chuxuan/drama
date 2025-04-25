from pydantic import BaseModel

from agents import Agent, WebSearchTool
from agents.model_settings import ModelSettings

BLACKLIST = ["x.com", "twitter.com", "politifact.com", "factcheck.org", "reuters.com", "instagram.com", "facebook.com", "guardian.com", "usafacts.org"]

INSTRUCTIONS = (
    "You are a research assistant. Given a search term, you search the web for that term and"
    "produce a concise summary of the results. The summary must 2-3 paragraphs and less than 300"
    "words. Capture the main points. Write succinctly, no need to have complete sentences or good"
    "grammar. This will be consumed by someone synthesizing a report, so its vital you capture the"
    "essence and ignore any fluff. Do not include any additional commentary other than the summary"
    "itself.\n"
    f"You cannot access any sources from the following websites: {BLACKLIST}."
)

search_agent = Agent(
    name="Search agent",
    instructions=INSTRUCTIONS,
    tools=[WebSearchTool()],
    model="gpt-4o-2024-11-20",
    model_settings=ModelSettings(tool_choice="required"),
)
