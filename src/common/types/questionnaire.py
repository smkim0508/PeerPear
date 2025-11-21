# DTO for questionanire responses
from pydantic import BaseModel
from typing import Optional

class Question(BaseModel):
    """
    Canonical DTO for a single question
    """
    id: int
    question: str
    options: Optional[list[str]] = None
    event_id: int

class Answer(BaseModel):
    """
    Canonical DTO for a single answer mapped to question id
    """
    question_id: int
    answer: str

class QuestionAnswerPair(BaseModel):
    """
    Represents a single question/answer pair that simply has the question string and answer string.
    Used for LLM parsing and summarization.
    """
    question: str
    answer: str