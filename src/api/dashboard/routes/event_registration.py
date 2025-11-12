from flask import Blueprint, request, jsonify
from sqlalchemy import select
from db.models.events import EventRegistrationsTable, EventTable
from db.models.question import QuestionTable
from db.crud.registration_crud import create_new_registration, get_registration_status, mark_valid
from common.types.registration import EventRegistration
from common.error_response import generic_error_response
from common.logging import logger
from api.dependencies import get_db_sessionmaker
from pydantic import ValidationError

event_registration_bp = Blueprint("event_registration", __name__)


def validate_int_inputs(event_id, user_id=None):
    try:
        event_id = int(event_id)
    except (ValueError, TypeError):
        return jsonify({"error": "event_id must be an integer"}), 400

    if user_id is not None:
        try:
            user_id = int(user_id)
        except (ValueError, TypeError):
            return jsonify({"error": "user_id must be an integer"}), 400

    return None


@event_registration_bp.post("/register")
def register_for_event():

    payload = request.get_json(silent=True) or {}
    logger.info(f"Received registration payload: {payload}")

    event_id = payload.get("event_id")
    user_id = payload.get("user_id")

    if not user_id or not event_id:
        return jsonify({"error": "user_id and event_id are required"}), 400

    error = validate_int_inputs(event_id, user_id)
    if error:
        return error

    try:
        result = create_new_registration(event_id=event_id, user_id=user_id)
    except Exception as e:
        logger.error(f"Error registering user: {e}")
        return jsonify({"error": "Internal server error"}), 500

    if result.get("error"):
        return jsonify(result), result.get("status", 400)

    return jsonify(result), 201


@event_registration_bp.get("/status/<int:event_id>/<int:user_id>")
def get_registration_status_route(event_id, user_id):

    if not event_id or not user_id:
        return jsonify({"error": "event_id and user_id are required"}), 400
    error = validate_int_inputs(event_id, user_id)
    if error:
        return error

    try:
        result = get_registration_status(event_id, user_id)
    except Exception as e:
        logger.error(f"Error getting registration status of user: {e}")
        return jsonify({"error": "Internal server error"}), 500

    if result.get("error"):
        return jsonify(result), result.get("status", 400)

    return jsonify(result), 200


@event_registration_bp.patch("/mark-valid")
def mark_valid_registration():
    payload = request.get_json(silent=True) or {}
    logger.info(f"Received registration payload: {payload}")

    event_id = payload.get("event_id")
    user_id = payload.get("user_id")

    error = validate_int_inputs(event_id, user_id)
    if error:
        return error

    try:
        result = mark_valid(event_id, user_id)
    except Exception as e:
        logger.error(f"Error marking registration valid: {e}")
        return jsonify({"error": "Internal server error"}), 500

    if result.get("error"):
        return jsonify(result), result.get("status", 400)

    return jsonify(result), 200
