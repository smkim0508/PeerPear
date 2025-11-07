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
from db.crud.events_crud import get_user_events
# use blueprint to group routes
my_events_bp = Blueprint("my_events", __name__)

# TODO: change this to be the actual landing page


@my_events_bp.get("/")
def foo():
    return "something"


@my_events_bp.get("/static/<path:filename>")
def static_files(filename):
    print(f"filename: {filename}")
    return send_from_directory("assets/images", filename)


@my_events_bp.get("/my-event-browse")
def browse_events():
    user_id = request.args.get("user_id")
    if user_id is None:
        return jsonify({"error": "user_id is required"}), 400
    # use helper to retrieve all events
    published_events = get_user_events(int(user_id))

    # format events to responses
    pairing_event_response = EventBrowseResponse(events=published_events)

    return jsonify(pairing_event_response.model_dump()), 200
