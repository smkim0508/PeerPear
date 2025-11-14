from flask import Blueprint, request, jsonify, session
from sqlalchemy.exc import SQLAlchemyError
from api.dependencies import get_db_sessionmaker
from db.models.question import QuestionTable
from db.models.events import EventTable
from db.crud.events_crud import get_event_by_id
from db.crud.questionnaire_crud import get_questions, add_question, remove_question, get_question
from common.error_response import generic_error_response
from common.types.event_enums import EventRole, EventStatus
from sqlalchemy import inspect, select, or_
from db.models.orgadmin import OrgAdminTable
from common.logging import logger



question_management_bp = Blueprint("question_management", __name__)


@question_management_bp.get("/<int:event_id>")
def get_event_questions(event_id):
    questions = get_questions(event_id)

    formatted = [{"id": q.id, "question": q.question, "options": q.options,
                  "event_id": q.event_id} for q in questions]

    return jsonify({"questions": formatted})


@question_management_bp.post("/create-question")
def create_question():
    """
    Create a new question for a specific event.
    Expected JSON:
    {
        "event_id": 3,
        "question": "What's your favorite programming language?",
        "options": ["Python", "Java", "C++", "Other"]  (optional)
    }
    """
    data = request.get_json(silent=True) or {}

    event_id = data.get("event_id")
    question = data.get("question")
    options = data.get("options", [])

    if not isinstance(options, list):
        return jsonify({"error": "options must be a list"}), 400

    if not event_id or not question:
        return jsonify({"error": "event_id and question are required"}), 400

    event = get_event_by_id(event_id)
    if not event:
        return jsonify({"error": "Event not found"}), 404

    result = add_question(event_id, question, options)

    if result == "db_error":
        return jsonify({"error": "Database error"}), 500
    return jsonify({
        "message": "Question created successfully",
        "question_id": result
    }), 200


@question_management_bp.delete("/delete-question/<int:question_id>")
def delete_question(question_id):
    if not question_id:
        return jsonify({"error": "question_id is required to delete"}), 400

    result = remove_question(question_id)

    if result == "not found":
        return jsonify({"error": "question was not found"}), 404
    elif result == "db_error":
        return jsonify({"error": "Database error"}), 500
    return jsonify({"message": "Question deleted succesfully"}), 200


@question_management_bp.get("/get-question/<int:question_id>")
def get_single_question(question_id):
    if not question_id:
        return jsonify({"error": "question_id is required"}), 400

    question = get_question(question_id)

    if not question:
        return jsonify({"error": "no question found"}), 404

    return jsonify({
        "id": question.id,
        "event_id": question.event_id,
        "question": question.question,
        "options": question.options or []
    }), 200


@question_management_bp.patch("/update-question/<int:question_id>")
def update_question(question_id):
    if not question_id:
        return jsonify({"error": "question_id is required"}), 400

    data = request.get_json(silent=True) or {}

    new_question = data.get("question")
    new_options = data.get("options", [])

    if not new_question:
        return jsonify({"error": "question is required"}), 400

    db_session = get_db_sessionmaker()

    try:

        with db_session() as session:

            modify = session.get(QuestionTable, question_id)

            if not modify:
                return jsonify({"error": "Question not found"}), 404

            modify.question = new_question
            modify.options = new_options

            session.commit()
            return jsonify({"message": "Question modified succesfully"}), 200

    except SQLAlchemyError as e:
        print("Database Error", e)
        return jsonify({"error": "Database error"}), 500


@question_management_bp.get("verification/<int:event_id>")
def verify_view(event_id):
    try:
        event_id = int(event_id)
    except:
        return jsonify({"error": "event_id must be an integer"}), 400

    user_id = session.get("user_id")
    if user_id is None:
        return jsonify({"error": "User not authenticated"}), 401

    try:
        db_session = get_db_sessionmaker()
        with db_session() as session_instance:
            event = session_instance.scalar(
                select(EventTable).where(EventTable.id == event_id)
            )

        if not event:
            return jsonify({"error": "Event not found"}), 404
    
        org_admin = session_instance.scalar(
            select(OrgAdminTable).where(OrgAdminTable.user_id == user_id)
        )

        if org_admin is None:
            return jsonify({"canView": False,"canEdit": False }), 200

        organization_id = org_admin.organization_id

        if event.organization_id != organization_id:
            return jsonify({"canView": False,"canEdit": False }), 200
        
        if event.status != EventStatus.NOT_STARTED:
            return jsonify({"canView": True,"canEdit": False }), 200
        return jsonify({"canView": True,"canEdit": True }), 200

    except:
        logger.error(f"Error verifying event")
        return jsonify(generic_error_response), 500
