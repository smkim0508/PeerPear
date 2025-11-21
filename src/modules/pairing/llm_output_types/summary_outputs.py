# structured LLM outputs for pairing
from pydantic import BaseModel
from typing import Optional

class ResponseSummaryLLMOutput(BaseModel):
    """
    Structured LLM Output for questionnaire response summarization.
    The main summary is simply a string.
    """
    llm_summary: str
    reasoning: str