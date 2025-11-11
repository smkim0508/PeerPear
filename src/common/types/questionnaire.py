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
