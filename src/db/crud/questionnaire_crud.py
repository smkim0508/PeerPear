# db/crud/questionnaire_crud.py
from db.models.question import Question
from db.models.response import Response
from sqlalchemy import select
from api.dependencies import get_db_sessionmaker
from sqlalchemy.exc import SQLAlchemyError
from common.types.user import UserProfileFull, User, UserProfile

def get_questions(event_id: int):
    """Fetch all questions for a given event."""
    db_session = get_db_sessionmaker()

    try:
        with db_session() as session:
            stmt = select(Question).where(Question.event_id == event_id)
            result = session.execute(stmt).scalars().all()
            return result
    except SQLAlchemyError as e:
        print(f"Database error in get_questions: {e}")
        return []

def _get_answer(question_id: int, user_id: int, session):
    """
    Fetch a single answer for a given question/user pair.
    Receives the db session from parent caller to preserve mapping.
    """
    stmt = select(Response.answer).where(
        (Response.user_id == user_id) & (Response.question_id == question_id)
    )
    result = session.execute(stmt).scalar_one_or_none()
    return result

def get_user_answers(question_ids: list[int], user_id: int):
    """Fetch all answers for a user's responses to given questions."""
    db_session = get_db_sessionmaker()

    try:
        with db_session() as session:
            answers = {}
            for q_id in question_ids:
                answer = _get_answer(q_id, user_id, session)
                if answer:
                    answers[q_id] = answer
            return answers
    except SQLAlchemyError as e:
        print(f"Database error in get_user_answers: {e}")
        return {}

def submit_responses(event_id: int, user_id: int, responses: dict):
    """Insert or update responses for a questionnaire."""
    db_session = get_db_sessionmaker()
    questions = get_questions(event_id)

    if not questions:
        return "no_questions"

    try:
        with db_session() as session:
            response_map = {r["question_id"]: r["answer"] for r in responses}
            
            if any(response_map.get(q.id) is None for q in questions):
                return "form"
            
            for q in questions:
                qid = q.id
                ans = response_map.get(qid)
               
                existing = session.execute(
                    select(Response).where(
                        (Response.user_id == user_id) & (Response.question_id == qid)
                    )
                ).scalar_one_or_none()

                if existing:
                    existing.answer = ans
                else:
                    session.add(Response(question_id=qid, answer=ans, user_id=user_id))

            session.commit()
            return "success"

    except SQLAlchemyError as e:
        print(f"Database error in submit_responses: {e}")
        return "db_error"
