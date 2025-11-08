# main landing page for students after logging in
from flask import Blueprint, request, send_from_directory, jsonify, g
from common.types.events import PairingEvent, PairingResult
from datetime import datetime, timezone, timedelta
from api import validate_model
from app_types.api.response.event_browse_response import EventBrowseResponse, PublishedEvent
from db.models.events import Event
from db.models.organizations import Organization
from sqlalchemy import inspect
from api.dependencies import get_db_session, get_llm
from db.crud.events_crud import get_all_active_events

# use blueprint to group routes
student_dashboard_bp = Blueprint("student_dashboard", __name__)

# TODO: change this to be the actual landing page


@student_dashboard_bp.get("/")
def foo():
    return "something"


@student_dashboard_bp.get("/static/<path:filename>")
def static_files(filename):
    print(f"filename: {filename}")
    return send_from_directory("assets/images", filename)


@student_dashboard_bp.get("/event-browse")
def browse_events():
    user_id = request.args.get("user_id", type=int)
    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400

    published_events = get_all_active_events(user_id)

    response = EventBrowseResponse(events=published_events)
    return jsonify(response.model_dump()), 200
