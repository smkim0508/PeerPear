# main landing page for students after logging in
from flask import Blueprint, send_from_directory, jsonify, session
from app_types.api.response.event_browse_response import EventBrowseResponse
from db.crud.events_crud import get_user_events
from common.logging import logger
from common.error_response import generic_error_response
from auth.routes.auth import require_auth

# use blueprint to group routes
my_events_bp = Blueprint("my_events", __name__)

@my_events_bp.get("/")
def foo():
    return "something"


@my_events_bp.get("/static/<path:filename>")
def static_files(filename):
    print(f"filename: {filename}")
    return send_from_directory("assets/images", filename)


@my_events_bp.get("/my-event-browse")
@require_auth
def browse_events():
    # Get user_id from session instead of query parameter
    user_id = session.get("user_id")
    
    if user_id is None:
        return jsonify({"error": "User not authenticated or user_id not found in session"}), 401
    
    # use helper to retrieve all events
    try:
        published_events = get_user_events(int(user_id))
    except Exception as e:
        logger.error(f"Error retrieving events: {e}")
        return jsonify(generic_error_response), 500

    # format events to responses
    pairing_event_response = EventBrowseResponse(events=published_events)

    return jsonify(pairing_event_response.model_dump(mode="json")), 200
