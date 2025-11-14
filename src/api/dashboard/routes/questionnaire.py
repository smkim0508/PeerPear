from flask import Blueprint, request, send_from_directory, jsonify, g
import os
from api import validate_model
from db.models.events import EventTable
from db.models.response import ResponseTable
from db.models.question import QuestionTable
from datetime import datetime, timedelta
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from db.crud.questionnaire_crud import get_questions, get_user_answers, submit_responses
from common.types.user import UserProfileFull, User, UserProfile
from common.types.questionnaire import Question, Answer
from pydantic import ValidationError
from common.logging import logger
from common.error_response import generic_error_response

questionnaire_bp = Blueprint("questionnaire", __name__)


@questionnaire_bp.get("/<int:event_id>/<int:user_id>")
def get_questionnaire(event_id, user_id):
    if not event_id:
        return jsonify({"error": "event_id is required"}), 400
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    try:
        questions: list[Question] = get_questions(event_id)
    except Exception as e:
        logger.error(f"Error retrieving questions: {e}")
        return jsonify(generic_error_response), 500

    if len(questions) == 0:
        return jsonify({"error": "there are no questions associated with this event"}), 404

    ids = [q.id for q in questions]

    try:
        answers = get_user_answers(ids, user_id)
    except Exception as e:
        logger.error(f"Error retrieving answers: {e}")
        return jsonify(generic_error_response), 500

    # format questions & answers
    return jsonify({"questions": [q.model_dump(mode="json") for q in questions], "answers": [a.model_dump(mode="json") for a in answers]}), 200


@questionnaire_bp.post("/submit")
def submit_questionnaire():
    payload = request.get_json(silent=True)

    logger.info(f"payload: {payload}")
    if not payload:
        return jsonify({"error": "missing required fields"}), 400

    event_id = payload.get("event_id")
    user_id = payload.get("user_id")

    form_responses = payload.get("answers")

    response_list: list[Answer] = []
    for response in form_responses:
        # formats the json response into Pydantic
        response_list.append(
            Answer(
                question_id=response["question_id"],
                answer=response["answer"]
            )
        )

    if not all([event_id, user_id, form_responses]):
        return jsonify({"error": "invalid form responses"}), 400

    if not (isinstance(event_id, int) and isinstance(user_id, int)):
        return jsonify({"error": "event_id and user_id must be integers"}), 400

    logger.info(f"form responses: {form_responses}")

    try:
        result = submit_responses(event_id, user_id, response_list)
    except Exception as e:
        logger.error(f"Error submitting responses: {e}")
        return jsonify(generic_error_response), 500

    if result == "success":
        return jsonify({"message": "Form submitted successfully"}), 200
    if result == "form":
        return jsonify({"error": "Please answer all questions"}), 400
    if result == "no_questions":
        return jsonify({"error": "This event has no questions"}), 404
    if result == "event":
        return jsonify({"error": "There is no event"}), 404
    if result == "status":
        return jsonify({"error": "This event is not active at this time"}), 404
    return jsonify({"error": "Database error while submitting response"}), 500
