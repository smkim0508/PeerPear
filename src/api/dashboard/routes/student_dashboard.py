# main landing page for students after logging in
from flask import Blueprint, send_from_directory, jsonify, session
from app_types.api.response.event_browse_response import EventBrowseResponse
from db.crud.events_crud import get_all_active_events_unfiltered
from common.logging import logger
from common.error_response import generic_error_response
from auth.routes.auth import require_auth

# use blueprint to group routes
student_dashboard_bp = Blueprint("student_dashboard", __name__)

# TODO: this endpoint needs to be changed?
@student_dashboard_bp.get("/")
def foo():
    return "something"

# NOTE: temporary endpoint for serving static image
@student_dashboard_bp.get("/static/<path:filename>")
def static_files(filename):
    print(f"filename: {filename}")
    return send_from_directory("assets/images", filename)

@student_dashboard_bp.get("/event-browse")
@require_auth
def browse_events():
    # No need for user_id since we're showing all active events
    # Authentication is still required to access the dashboard
    
    try:
        published_events = get_all_active_events_unfiltered()
    except Exception as e:
        logger.error(f"Error retrieving events: {e}")
        return jsonify(generic_error_response), 500

    response = EventBrowseResponse(events=published_events)
    return jsonify(response.model_dump(mode="json")), 200
