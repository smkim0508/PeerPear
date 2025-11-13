# main landing page for organizations after logging in
from flask import Blueprint, request, jsonify, session, g
from app_types.api.response.event_browse_response import EventBrowseResponse
from db.crud.events_crud import get_organization_events, create_new_event
from common.logging import logger
from common.error_response import generic_error_response
from auth.routes.auth import require_auth
from db.models.orgadmin import OrgAdminTable
from api.dependencies import get_db_sessionmaker
from sqlalchemy import select
from datetime import datetime, timezone
from sqlalchemy.exc import SQLAlchemyError
from db.models.events import EventTable
from common.types.pairing_event import PairingEvent, PairingResult
from common.types.event_enums import EventStatus, EventRole

# use blueprint to group routes
org_dashboard_bp = Blueprint("organization_dashboard", __name__)

@org_dashboard_bp.get("/")
def foo():
    return "placeholder"

@org_dashboard_bp.get("/event-browse")
@require_auth
def browse_events():
    # Get user_id from session
    user_id = session.get("user_id")
    
    if user_id is None:
        return jsonify({"error": "User not authenticated"}), 401
    
    # Look up organization_id from orgadmins table
    db_session = get_db_sessionmaker()
    with db_session() as db_session_instance:
        org_admin = db_session_instance.scalar(
            select(OrgAdminTable).where(OrgAdminTable.user_id == user_id)
        )
        
        if org_admin is None:
            return jsonify({"error": "User is not an organization admin"}), 403
        
        organization_id = org_admin.organization_id

    # use helper to retrieve all events for the organization
    try:
        published_events = get_organization_events(organization_id)
    except Exception as e:
        logger.error(f"Error retrieving events: {e}")
        return jsonify(generic_error_response), 500
    
    pairing_event_response = EventBrowseResponse(events=published_events)
    return jsonify(pairing_event_response.model_dump(mode="json")), 200

# NOTE: NOT DONE - should also use CRUD operations with DTO / ORM conversion
@org_dashboard_bp.patch("/event")
@require_auth
def update_event():
    event_id = request.args.get("event_id")

    if event_id is None:
        return jsonify({"error": "event_id is required"}), 400

    # Get user_id from session and look up organization
    user_id = session.get("user_id")
    
    if user_id is None:
        return jsonify({"error": "User not authenticated"}), 401
    
    # Look up organization_id from orgadmins table
    db_session = get_db_sessionmaker()
    with db_session() as db_session_instance:
        org_admin = db_session_instance.scalar(
            select(OrgAdminTable).where(OrgAdminTable.user_id == user_id)
        )
        
        if org_admin is None:
            return jsonify({"error": "User is not an organization admin"}), 403
        
        organization_id = org_admin.organization_id

    # Check if the event exists and belongs to the organization
    event = g.db.query(EventTable).filter(EventTable.id == event_id).first()

    if event is None:
        return jsonify({"error": "Event not found"}), 404

    elif event.organization_id != organization_id:
        return jsonify({"error": "Event does not belong to the organization"}), 404

    # TODO: actually update the events
    return jsonify({"message": "Event updated successfully"}), 200

@org_dashboard_bp.post("/create-event")
@require_auth
def create_event():
    """
    Create a new event for an organization.
    Expects JSON payload with:
    - title
    - description
    - image_url (optional)
    - end_date

    The organization_id is determined from the authenticated user's session.

    defaults:
    - status = NOT_STARTED
    """

    data = request.get_json(silent=True) or {}

    # Get user_id from session and look up organization
    user_id = session.get("user_id")
    
    if user_id is None:
        return jsonify({"error": "User not authenticated"}), 401
    
    # Look up organization_id from orgadmins table
    db_session = get_db_sessionmaker()
    with db_session() as db_session_instance:
        org_admin = db_session_instance.scalar(
            select(OrgAdminTable).where(OrgAdminTable.user_id == user_id)
        )
        
        if org_admin is None:
            return jsonify({"error": "User is not an organization admin"}), 403
        
        organization_id = org_admin.organization_id

    title = data.get("title", "Untitled Event")
    description = data.get("description", "")
    image_url = data.get(
        "image_url",
        f"{request.host_url}organization-dashboard/static/peerpear_logo.png",
    )

    # NOTE: need to make sure FE integrates properly with the new payload, start_date is removed
    today = datetime.now(timezone.utc)
    today_date = today.date()
    end_date = data.get("end_date")

    # NOTE: try to parse the requested end date into standard datetime
    try:
        end_dt = datetime.fromisoformat(str(end_date))
    except Exception:
        return jsonify({"error": "Invalid date format"}), 400

    if end_dt.date() < today_date:
        return jsonify({"error": "End date cannot be in the past"}), 400

    new_event = PairingEvent(
        organization_id=organization_id,
        title=title,
        description=description,
        image_url=image_url,
        end_date=end_dt,
        status=EventStatus.NOT_STARTED
    )

    # create the new event in db
    try:
        updated_event = create_new_event(new_event) # This already commits
        logger.info(f"Event created: {updated_event}")
    except SQLAlchemyError as e:
        logger.error(f"Database error: {e}")
        return jsonify(generic_error_response), 500
    except Exception as e:
        logger.error(f"Unknown error: {e}")
        return jsonify(generic_error_response), 500

    return jsonify({"message": "Event created successfully", "event_id": updated_event.id}), 200
