# db/crud/questionnaire_crud.py
from db.models.question import Question
from db.models.response import Response
from sqlalchemy import select
from api.dependencies import get_db_session
from sqlalchemy.exc import SQLAlchemyError


def get_questions(event_id: int):
    """Fetch all questions for a given event."""
    try:
        with get_db_session() as session:
            stmt = select(Question).where(Question.event_id == event_id)
            result = session.execute(stmt).scalars().all()
            return result
    except SQLAlchemyError as e:
        print(f"Database error in get_questions: {e}")
        return []


def get_answer(question_id: int, user_id: int, session):
    """Fetch a single answer for a given question/user pair."""
    stmt = select(Response.answer).where(
        (Response.user_id == user_id) & (Response.question_id == question_id)
    )
    result = session.execute(stmt).scalar_one_or_none()
    return result


def get_user_answers(question_ids: list[int], user_id: int):
    """Fetch all answers for a user's responses to given questions."""
    try:
        with get_db_session() as session:
            answers = {}
            for q_id in question_ids:
                answer = get_answer(q_id, user_id, session)
                if answer:
                    answers[q_id] = answer
            return answers
    except SQLAlchemyError as e:
        print(f"Database error in get_user_answers: {e}")
        return {}
