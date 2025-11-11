# db/crud/questionnaire_crud.py
from db.models.question import QuestionTable
from db.models.response import ResponseTable
from sqlalchemy import select
from api.dependencies import get_db_sessionmaker
from sqlalchemy.exc import SQLAlchemyError
from common.types.user import UserProfileFull, User, UserProfile
from common.types.questionnaire import Question, Answer
from common.logging import logger
from typing import Optional

def get_questions(event_id: int) -> list[Question]:
    """Fetch all questions for a given event."""
    db_session = get_db_sessionmaker()

    with db_session() as session:
        stmt = select(QuestionTable).where(QuestionTable.event_id == event_id)
        result = session.execute(stmt).scalars().all()

        questions = []
        for q in result:
            questions.append(
                Question(
                    id=q.id,
                    question=q.question,
                    options=q.options,
                    event_id=q.event_id
                )
            )
        return questions

def _get_answer(question_id: int, user_id: int, session) -> Optional[Answer]:
    """
    Fetch a single answer for a given question/user pair.
    Receives the db session from parent caller to preserve mapping.
    NOTE: only used internally.
    """
    stmt = select(ResponseTable.answer).where(
        (ResponseTable.user_id == user_id) & (ResponseTable.question_id == question_id)
    )
    result = session.execute(stmt).scalar_one_or_none()

    if not result:
        return None
    
    answer = Answer(
        question_id=question_id,
        answer=result
    )
    return answer

def get_user_answers(question_ids: list[int], user_id: int) -> list[Answer]:
    """Fetch all answers for a user's responses to given questions."""
    db_session = get_db_sessionmaker()

    with db_session() as session:
        answers = []
        for q_id in question_ids:
            answer = _get_answer(q_id, user_id, session)
            if answer:
                answers.append(answer)
        return answers

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
                    select(ResponseTable).where(
                        (ResponseTable.user_id == user_id) & (ResponseTable.question_id == qid)
                    )
                ).scalar_one_or_none()

                if existing:
                    existing.answer = ans
                else:
                    session.add(ResponseTable(question_id=qid, answer=ans, user_id=user_id))

            session.commit()
            return "success"

    except SQLAlchemyError as e:
        print(f"Database error in submit_responses: {e}")
        return "db_error"
