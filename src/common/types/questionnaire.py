# DTO for questionanire responses
from pydantic import BaseModel

class Question(BaseModel):
    """
    Canonical DTO for a single question
    """
    id: int
    question: str
    options: list[str]
    event_id: int

class Answer(BaseModel):
    question_id: int
    answer: str
