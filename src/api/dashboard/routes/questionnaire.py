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

    answers = get_user_answers(ids, user_id)
    return jsonify({"questions": questions, "answers": answers}), 200

@questionnaire_bp.put("/submit")
def submit_questionnaire():
    data = request.get_json(silent=True) or {}
    event_id = data.get("event_id")
    user_id = data.get("user_id")
    form_responses = data.get("responses")

    if not all([event_id, user_id, form_responses]):
        return jsonify({"error": "missing required fields"}), 400
    
    if not(isinstance(event_id, int) and isinstance(user_id, int)):
        return jsonify({"error": "event_id and user_id must be integers"}), 400
    
    if not(isinstance(form_responses, dict)):
        return jsonify({"error": "responses must be a dictionary"}), 400

    result = submit_responses(event_id, user_id, form_responses)
    if result == "success":
        return jsonify({"message": "Form submitted successfully"}), 200
    if result == "form":
        return jsonify({"error": "Please answer all questions"}), 400
    if result == "no_questions":
        return jsonify({"error": "This event has no questions"}), 404
    return jsonify({"error": "Database error while submitting response"}), 500
