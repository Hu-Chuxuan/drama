from __future__ import annotations

import asyncio
import tiktoken

from rich.console import Console
from itertools import chain

from agents import Runner, custom_span, gen_trace_id, trace

from .agents.planner_agent import WebSearchItem, WebSearchPlan, planner_agent
from .agents.search_agent import search_agent
from .agents.writer_agent import ReportDataQA, ReportDataVerification, writer_agent
from .printer import Printer

O3_MINI_COST_PER_INPUT_TOKEN = 1.10e-6
O3_MINI_COST_PER_OUTPUT_TOKEN = 4.40e-6
GPT_4O_COST_PER_INPUT_TOKEN = 2.5e-6
GPT_4O_COST_PER_OUTPUT_TOKEN = 10e-6
SEARCH_COST_PER_CALL = 35 / 1000
O200K_BASE = tiktoken.get_encoding("o200k_base")
CL100K_BASE = tiktoken.get_encoding("cl100k_base")
O3_ENCODING = tiktoken.encoding_for_model("o3-mini")


class ResearchManager:
    def __init__(self):
        self.console = Console()
        self.printer = Printer(self.console)

    async def run(self, query: str) -> tuple[ReportDataVerification, float, list[str]]:
        cost = 0
        trace_id = gen_trace_id()
        with trace("Research trace", trace_id=trace_id):
            self.printer.update_item(
                "trace_id",
                f"View trace: https://platform.openai.com/traces/{trace_id}",
                is_done=True,
                hide_checkmark=True,
            )

            self.printer.update_item(
                "starting",
                "Starting research...",
                is_done=True,
                hide_checkmark=True,
            )
            
            search_plan, planner_input_tokens, planner_output_tokens  = await self._plan_searches(query)
            cost += planner_input_tokens * GPT_4O_COST_PER_INPUT_TOKEN + planner_output_tokens * GPT_4O_COST_PER_OUTPUT_TOKEN + SEARCH_COST_PER_CALL * len(search_plan.searches)
            search_results_wrap = await self._perform_searches(search_plan)

            search_results = [search_result[0] for search_result in search_results_wrap]
            url_lists = [search_result[1] for search_result in search_results_wrap]
            sources = list(chain.from_iterable(url_lists))
            input_tokens = [search_result[2] for search_result in search_results_wrap]
            output_tokens = [search_result[3] for search_result in search_results_wrap]
            searcher_input_tokens = sum(input_tokens)
            searcher_output_tokens = sum(output_tokens)
            cost += searcher_input_tokens * GPT_4O_COST_PER_INPUT_TOKEN + searcher_output_tokens * GPT_4O_COST_PER_OUTPUT_TOKEN
            
            report, writer_input_tokens, writer_output_tokens = await self._write_report(query, search_results)
            cost += writer_input_tokens * O3_MINI_COST_PER_INPUT_TOKEN + writer_output_tokens * O3_MINI_COST_PER_OUTPUT_TOKEN

            self.printer.end()
        return (report, cost, sources)

    async def _plan_searches(self, query: str) -> WebSearchPlan:
        self.printer.update_item("planning", "Planning searches...")
        result = await Runner.run(
            planner_agent,
            f"Query: {query}",
        )
        self.printer.update_item(
            "planning",
            f"Will perform {len(result.final_output.searches)} searches",
            is_done=True,
        )
        input_tokens = 0
        output_tokens = 0
        for model_response in result.raw_responses:
            input_tokens += model_response.usage.input_tokens
            output_tokens += model_response.usage.output_tokens
        return result.final_output_as(WebSearchPlan), input_tokens, output_tokens

    async def _perform_searches(self, search_plan: WebSearchPlan) -> list[tuple[str, str]]:
        with custom_span("Search the web"):
            self.printer.update_item("searching", "Searching...")
            num_completed = 0
            tasks = [asyncio.create_task(self._search(item)) for item in search_plan.searches]
            results = []
            for task in asyncio.as_completed(tasks):
                result = await task
                if result is not None:
                    results.append(result)
                num_completed += 1
                self.printer.update_item(
                    "searching", f"Searching... {num_completed}/{len(tasks)} completed"
                )
            self.printer.mark_item_done("searching")
            return results

    async def _search(self, item: WebSearchItem) -> tuple[str | None, str]:
        input = f"Search term: {item.query}\nReason for searching: {item.reason}"
        # try:
        result = await Runner.run(
            search_agent,
            input,
        )
        # print("RESSSSSSSS:", result.raw_responses)
        annotations = []
        for model_response in result.raw_responses:
            for output in model_response.output:
                if hasattr(output, "content"):  # make sure it's a ResponseOutputMessage
                    for content in output.content:
                        if hasattr(content, "annotations"):
                            for annotation in content.annotations:
                                annotations.append(annotation.url)
        # print("RESSSSSSSS:", annotations)
        input_tokens = 0
        output_tokens = 0
        for model_response in result.raw_responses:
            input_tokens += model_response.usage.input_tokens
            output_tokens += model_response.usage.output_tokens
        return (str(result.final_output), annotations, input_tokens, output_tokens)
        # except Exception:
        #     return None

    async def _write_report(self, query: str, search_results: list[Summary]) -> ReportDataVerification:
        self.printer.update_item("writing", "Thinking about report...")
        input = f"Original claim: {query}\nSummarized search results: {search_results}"
        result = await Runner.run(
            writer_agent,
            input,
        )
        # update_messages = [
        #     "Thinking about report...",
        #     "Planning report structure...",
        #     "Writing outline...",
        #     "Creating sections...",
        #     "Cleaning up formatting...",
        #     "Finalizing report...",
        #     "Finishing report...",
        # ]

        # last_update = time.time()
        # next_message = 0
        # async for _ in result.stream_events():
        #     if time.time() - last_update > 5 and next_message < len(update_messages):
        #         self.printer.update_item("writing", update_messages[next_message])
        #         next_message += 1
        #         last_update = time.time()

        # self.printer.mark_item_done("writing")
        input_tokens = 0
        output_tokens = 0
        for model_response in result.raw_responses:
            input_tokens += model_response.usage.input_tokens
            output_tokens += model_response.usage.output_tokens
        return result.final_output_as(ReportDataVerification), input_tokens, output_tokens
