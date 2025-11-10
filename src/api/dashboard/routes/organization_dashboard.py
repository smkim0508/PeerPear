# main landing page for organizations after logging in
from flask import Blueprint, request, send_from_directory, jsonify, g
import os
from api import validate_model
from app_types.api.response.event_browse_response import EventBrowseResponse, PublishedEvent
from db.models.events import EventTable
from db.crud.events_crud import get_organization_events, create_new_event
from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from db.models.organizations import OrganizationTable
from common.types.pairing_event import EventStatus, EventRole

# use blueprint to group routes
org_dashboard_bp = Blueprint("organization_dashboard", __name__)

@org_dashboard_bp.get("/")
def foo():
    return "placeholder"

@org_dashboard_bp.get("/event-browse")
def browse_events():

    organization_id = request.args.get("organization_id")
    print(organization_id)

    if organization_id is None:
        return jsonify({"error": "organization_id is required"}), 400

    try:
        organization_id = int(organization_id)
    except ValueError:
        return jsonify({"error": "organization_id must be an integer"}), 400

    # use helper to retrieve all events for the organization
    published_events = get_organization_events(int(organization_id))
    pairing_event_response = EventBrowseResponse(events=published_events)

    return jsonify(pairing_event_response.model_dump()), 200

# NOTE: NOT DONE
@org_dashboard_bp.patch("/event")
def update_event():
    organization_id = request.args.get("organization_id")
    event_id = request.args.get("event_id")

    if organization_id is None or event_id is None:
        return jsonify({"error": "organization_id and event_id are required"}), 400

    # Check if the event exists and belongs to the organization
    event = g.db.query(EventTable).filter(EventTable.id == event_id).first()

    if event is None:
        return jsonify({"error": "Event not found"}), 404

    elif event.organization_id != organization_id:
        return jsonify({"error": "Event does not belong to the organization"}), 404

    # TODO: actually update the events
    return jsonify({"message": "Event updated successfully"}), 200


# NOTE: by convention, use "-" to split words in routes
@org_dashboard_bp.post("/create-event")
def create_event():
    """
    Create a new event for an organization.
    Expects JSON payload with:
    - organization_id
    - title
    - description
    - image_url (optional)
    - end_date

    defaults:
    - status = NOT_STARTED
    """

    data = request.get_json(silent=True) or {}

    organization_id = data.get("organization_id")

    if not organization_id:
        return jsonify({"error": "organization_id is required"}), 400

    try:
        organization_id = int(organization_id)
    except ValueError:
        return jsonify({"error": "organization_id must be an integer"}), 400

    title = data.get("title", "Untitled Event")
    description = data.get("description", "")
    image_url = data.get(
        "image_url",
        f"{request.host_url}organization-dashboard/static/peerpear_logo.png",
    )

    # NOTE: need to make sure FE integrates properly with the new payload, start_date is removed
    today = datetime.now(timezone.utc)
    today_date = today.date()
    matches = []
    end_date = data.get("end_date")

    # NOTE: try to parse the requested end date into standard datetime
    try:
        end_dt = datetime.fromisoformat(str(end_date))
    except Exception:
        return jsonify({"error": "Invalid date format"}), 400

    if end_dt.date() < today_date:
        return jsonify({"error": "End date cannot be in the past"}), 400

    new_event = EventTable(
        organization_id=organization_id,
        title=title,
        description=description,
        image_url=image_url,
        end_date=end_dt,
        matches=matches,
        status=EventStatus.NOT_STARTED,
    )

    # create the new event in db
    try:
        create_new_event(new_event)  # This already commits
    except SQLAlchemyError as e:
        print(str(e))
        return jsonify({"error": "Database error"}), 500

    return jsonify({"message": "Event created successfully", "event_id": new_event.id}), 200
