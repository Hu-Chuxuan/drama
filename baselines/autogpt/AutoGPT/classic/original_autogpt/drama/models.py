import ast
from itertools import chain
import json
from json import JSONDecodeError
from pathlib import Path
from typing import Optional, Union

from pydantic import BaseModel, Field


class VerificationAgentResult(BaseModel):
    data: Optional[str] = Field(
        description="The data representing a CSV table",
        default=None,
    )

    code: Optional[str] = Field(
        description="A string representing the Python code to execute on the data",
        default=None
    )

    validity: Optional[bool] = Field(
        description="True if the original claim is correct, False otherwise",
        default=None
    )


class QAAgentResult(BaseModel):
    data: Optional[str] = Field(
        description="The data representing a CSV table",
        default=None
    )

    code: Optional[str] = Field(
        description="A string representing the Python code to execute on the data",
        default=None
    )

    answer: Optional[str] = Field(
        description="A clear and concise answer to the original question",
        default=None
    )


class Tool(BaseModel):
    name: str
    arguments: Optional[dict]

    @classmethod
    def from_json(cls, tool_json) -> "Tool":
        return Tool(
            name=tool_json["name"],
            arguments=tool_json["arguments"]
        )


class Action(BaseModel):
    thoughts: dict
    tool: Tool

    @classmethod
    def from_json(cls, action_json) -> "Action":
        return Action(
            thoughts=action_json["thoughts"],
            tool=Tool.from_json(action_json["use_tool"]),
        )


class ActionHistory(BaseModel):
    actions: list[Action]
    sources: list[str]  # the list of web pages visited by the agent

    @classmethod
    def from_json(cls, history_json) -> "ActionHistory":
        actions = []
        sources = []
        for episode in history_json:
            if episode.get("action") is not None:
                action = episode["action"]
                actions.append(Action.from_json(action))
                if action["use_tool"]["name"] == "google":
                    if episode.get("result") is not None:
                        if episode.get("result").get("outputs") is not None:
                            sources.append(
                                ast.literal_eval(episode["result"]["outputs"])
                            )
                sources_flat = list(set(chain.from_iterable(sources)))
        return ActionHistory(
            actions=actions,
            sources=sources_flat
        )


class VerificationResult(BaseModel):
    index: int
    action_history: Optional[ActionHistory] = Field(default=None)
    result: Optional[VerificationAgentResult] = Field(default=None)
    total_cost: Optional[float] = Field(default=None)
    total_input_tokens: Optional[int] = Field(default=None)
    total_output_tokens: Optional[int] = Field(default=None)
    error: Optional[str] = Field(default=None)

    @classmethod
    def from_json(cls, path: Path, idx: int) -> "VerificationResult":
        try:
            with open(path, "r", encoding="utf-8", errors="replace") as file:
                state_json = json.load(file)
        except FileNotFoundError as e:
            return VerificationResult(index=idx, error=e.__str__())
        except JSONDecodeError as e:
            return VerificationResult(index=idx, error=e.__str__())
        action_history = ActionHistory.from_json(
            state_json["history"]["episodes"]
        )
        last_action = action_history.actions[-1]
        if last_action.tool.name == "finish":
            try:
                result_json = json.loads(
                    last_action.tool.arguments["reason"]
                )
                result = VerificationAgentResult(
                    data=result_json.get("data"),
                    code=result_json.get("code"),
                    validity=result_json.get("validity"),
                    index=idx,
                )
            except JSONDecodeError:
                result = None
        else:
            result = None
        return VerificationResult(
            action_history=ActionHistory.from_json(
                state_json["history"]["episodes"]
            ),
            result=result,
            total_cost=state_json["total_cost"],
            total_input_tokens=state_json["total_input_tokens"],
            total_output_tokens=state_json["total_output_tokens"],
            index=idx,
        )


class QAResult(BaseModel):
    index: int
    action_history: Optional[ActionHistory] = Field(default=None)
    result: Optional[QAAgentResult] = Field(default=None)
    total_cost: Optional[float] = Field(default=None)
    total_input_tokens: Optional[float] = Field(default=None)
    total_output_tokens: Optional[float] = Field(default=None)
    error: Optional[str] = Field(default=None)

    @classmethod
    def from_json(cls, path: Path, idx: int) -> "QAResult":
        try:
            with open(path, "r", encoding="utf-8", errors="replace") as file:
                state_json = json.load(file)
        except FileNotFoundError as e:
            return QAResult(index=idx, error=e.__str__())
        except JSONDecodeError as e:
            return QAResult(index=idx, error=e.__str__())
        action_history = ActionHistory.from_json(
            state_json["history"]["episodes"]
        )
        last_action = action_history.actions[-1]
        if last_action.tool.name == "finish":
            try:
                result_json = json.loads(
                    last_action.tool.arguments["reason"]
                )
                result = QAAgentResult(
                    data=result_json.get("data"),
                    code=result_json.get("code"),
                    answer=result_json.get("answer"),
                    index=idx,
                )
            except JSONDecodeError:
                result = None
            except TypeError:
                result = None
        else:
            result = None
        return QAResult(
            action_history=ActionHistory.from_json(
                state_json["history"]["episodes"]
            ),
            result=result,
            total_cost=state_json["total_cost"],
            total_input_tokens=state_json["total_input_tokens"],
            total_output_tokens=state_json["total_output_tokens"],
            index=idx,
        )
