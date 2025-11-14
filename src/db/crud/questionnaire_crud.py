# db/crud/questionnaire_crud.py
from db.models.events import EventRegistrationsTable
from db.models.question import QuestionTable
from db.models.response import ResponseTable
from db.models.events import EventTable
from sqlalchemy import select
from api.dependencies import get_db_sessionmaker, get_llm
from sqlalchemy.exc import SQLAlchemyError
from common.types.user import UserProfileFull, User, UserProfile
from common.types.questionnaire import Question, Answer
from common.types.event_enums import EventStatus
from common.logging import logger
from typing import Optional
from modules.pairing.pairing_repository import PairingRepository
from modules.pairing.orchestrator import PairingOrchestrator
from db.crud.events_crud import get_registration_by_user_and_event_id

# TODO: use the pairing orchestrator and repository to create summary, and put it into db

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
        (ResponseTable.user_id == user_id) & (
            ResponseTable.question_id == question_id)
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


def submit_responses(event_id: int, user_id: int, responses: list[Answer]):
    """
    Insert or update responses for a questionnaire.
    Also summarizes all the user responses into a summary field to be used in pairing later.
    """
    db_session = get_db_sessionmaker()
    llm_client = get_llm() # needed for summarization

    # fetch questions
    questions = get_questions(event_id)
    if not questions:
        return "no_questions"
    
    # find the registration id tied to this event and user
    registration_id = get_registration_by_user_and_event_id(event_id, user_id)
    if not registration_id:
        return "no_registration"
    
    # summarize user responses
    pairing_orchestrator = PairingOrchestrator(main_db_session=db_session, llm_client=llm_client)
    response_summary = pairing_orchestrator.summarize_questionnaire_response(responses, questions)

    with db_session() as session:
        # NOTE: temporarily, this forces all questions in form to be answered.
        # Technically, some should be required and some not.
        if any([not r.answer for r in responses]):
            logger.info("form")
            return "form"

        event = session.scalar(
        select(EventTable).where(EventTable.id == event_id)
        )

        if not event:
            logger.info("event")
            return "event"

        if event.status != EventStatus.STARTED:
            logger.info("status")
            return "status"

        for r in responses:
            ans = r.answer
            qid = r.question_id

            existing = session.execute(
                select(ResponseTable).where(
                    (ResponseTable.user_id == user_id) & (
                        ResponseTable.question_id == qid)
                )
            ).scalar_one_or_none()

            if existing:
                existing.answer = ans
            else:
                session.add(ResponseTable(question_id=qid,
                            answer=ans, user_id=user_id))

        # fetch the existing registration via SQLAlchemy
        registration = session.get(EventRegistrationsTable, registration_id)
        if registration is None:
            # NOTE: this is defensive behavior; technically shouldn't happen, but implies the DB state changed between earlier registration_id lookup & now
            logger.info("no_registration")
            return "no_registration"

        registration.response_summary = response_summary # add in summary field
        session.commit()
        logger.info("success")
        return "success"

def add_question(event_id: int, question: str, options: list):
    db_session = get_db_sessionmaker()

    try:
        with db_session() as session:
            new_question = QuestionTable(
                event_id=event_id,
                question=question,
                options=options if isinstance(
                    options, list) else []
            )
            session.add(new_question)
            session.commit()
            session.refresh(new_question)

            return new_question.id
    except SQLAlchemyError as e:
        print(f"Database error in add_question: {e}")
        return "db_error"


def remove_question(question_id: int):
    db_session = get_db_sessionmaker()

    try:
        with db_session() as session:
            question = session.get(QuestionTable, question_id)

            if not question:
                return "not found"

            session.delete(question)
            session.commit()

            return "success"

    except SQLAlchemyError as e:
        print(f"Database error in delete_question: {e}")
        return "db_error"


def get_question(question_id: int):
    db_session = get_db_sessionmaker()

    try:
        with db_session() as session:

            question = session.get(QuestionTable, question_id)

            return question

    except SQLAlchemyError as e:
        print(f"Database error in get_question: {e}")
        return {}
