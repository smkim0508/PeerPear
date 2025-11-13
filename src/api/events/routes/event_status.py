from flask import Blueprint, request, jsonify
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


@event_status_bp.patch("/start")
def route_start_event():

    payload = request.get_json(silent=True) or {}
    logger.info(f"Received event payload: {payload}")

    event_id = payload.get("event_id")

    if not event_id:
        return jsonify({"error": "event_id is required"}), 400

    try:
        event_id = int(event_id)
    except:
        return jsonify({"error":"event_id must be an integer"}), 400

    organization_id = payload.get("organization_id")

    if not organization_id:
        return jsonify({"error": "organization_id is required"}), 400

    try:
        organization_id = int(organization_id)
    except:
        return jsonify({"error":"organization_id must be an integer"}), 400

    try:
        result = start_event(event_id, organization_id)
    except Exception as e:
        logger.error(f"Error starting event: {e}")
        return jsonify(generic_error_response), 500

    if result.get("error"):
        return jsonify(result), result.get("status", 400)

    return jsonify(result), 200


@event_status_bp.patch("/end")
def route_end_event():

    payload = request.get_json(silent=True) or {}
    logger.info(f"Received event payload: {payload}")

    event_id = payload.get("event_id")

    if not event_id:
        return jsonify({"error": "event_id is required"}), 400

    try:
        event_id = int(event_id)
    except:
        return jsonify({"error":"event_id must be an integer"}), 400

    organization_id = payload.get("organization_id")

    if not organization_id:
        return jsonify({"error": "organization_id is required"}), 400

    try:
        organization_id = int(organization_id)
    except:
        return jsonify({"error":"organization_id must be an integer"}), 400

    try:
        result = end_event(event_id, organization_id)
    except Exception as e:
        logger.error(f"Error starting event: {e}")
        return jsonify(generic_error_response), 500

    if result.get("error"):
        return jsonify(result), result.get("status", 400)

    return jsonify(result), 200


@event_status_bp.patch("/publish")
def route_publish_pairings():
    payload = request.get_json(silent=True) or {}
    logger.info(f"Received event payload: {payload}")

    event_id = payload.get("event_id")

    if not event_id:
        return jsonify({"error": "event_id is required"}), 400
    try:
        event_id = int(event_id)
    except:
        return jsonify({"error":"event_id must be an integer"}), 400

    organization_id = payload.get("organization_id")

    if not organization_id:
        return jsonify({"error": "organization_id is required"}), 400

    try:
        organization_id = int(organization_id)
    except:
        return jsonify({"error":"organization_id must be an integer"}), 400

    try:
        result = publish_event(event_id, organization_id)
    except Exception as e:
        logger.error(f"Error starting event: {e}")
        return jsonify(generic_error_response), 500

    if result.get("error"):
        return jsonify(result), result.get("status", 400)

    return jsonify(result), 200
