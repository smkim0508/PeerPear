from flask import Blueprint, request, jsonify, session
from sqlalchemy import select
from db.models.events import EventTable, EventRegistrationsTable
from db.models.organizations import OrganizationTable
from db.models.question import QuestionTable
from db.models.response import ResponseTable
from db.models.user import UserTable
from common.types.event_enums import EventStatus, EventRole
from api.dependencies import get_db_sessionmaker
from common.logging import logger
from common.error_response import generic_error_response

from db.crud.events_crud import start_event, end_event, publish_event

event_status_bp = Blueprint("event_status", __name__)


@event_status_bp.patch("/start/<int:event_id>")
def route_start_event(event_id):

    try:
        event_id = int(event_id)
    except:
        return jsonify({"error": "event_id must be an integer"}), 400

    user_id = session.get("user_id")

    if user_id is None:
        return jsonify({"error": "User not authenticated"}), 401

    try:
        result = start_event(event_id, user_id)
    except Exception as e:
        logger.error(f"Error starting event: {e}")
        return jsonify(generic_error_response), 500

    if result.get("error"):
        return jsonify(result), result.get("status", 400)

    return jsonify(result), 200


@event_status_bp.patch("/end/<int:event_id>")
def route_end_event(event_id):

    try:
        event_id = int(event_id)
    except:
        return jsonify({"error": "event_id must be an integer"}), 400

    user_id = session.get("user_id")

    if user_id is None:
        return jsonify({"error": "User not authenticated"}), 401

    try:
        result = end_event(event_id, user_id)
    except Exception as e:
        logger.error(f"Error starting event: {e}")
        return jsonify(generic_error_response), 500

    if result.get("error"):
        return jsonify(result), result.get("status", 400)

    return jsonify(result), 200


@event_status_bp.patch("/publish/<int:event_id>")
def route_publish_pairings(event_id):
    try:
        event_id = int(event_id)
    except:
        return jsonify({"error": "event_id must be an integer"}), 400

    user_id = session.get("user_id")

    if user_id is None:
        return jsonify({"error": "User not authenticated"}), 401
    try:
        result = publish_event(event_id, user_id)
    except Exception as e:
        logger.error(f"Error starting event: {e}")
        return jsonify(generic_error_response), 500

    if result.get("error"):
        return jsonify(result), result.get("status", 400)

    return jsonify(result), 200
