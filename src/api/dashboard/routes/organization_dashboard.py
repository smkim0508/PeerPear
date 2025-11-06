# main landing page for organizations after logging in
from flask import Blueprint, request, send_from_directory, jsonify, g
import os
from api import validate_model
from app_types.api.response.event_browse_response import EventBrowseResponse, PublishedEvent
from db.models.events import Event
from db.crud.events_crud import get_organization_events
from datetime import datetime, timedelta
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from db.models.organizations import Organization

# use blueprint to group routes
org_dashboard_bp = Blueprint("organization_dashboard", __name__)


@org_dashboard_bp.get("/")
def foo():
    return "something"


@org_dashboard_bp.get("/event-browse")
def browse_events():

    organization_id = request.args.get("organization_id")
    print(organization_id)

    if organization_id is None:
        return jsonify({"error": "organization_id is required"}), 400
    # use helper to retrieve all events for the organization
    published_events = get_organization_events(int(organization_id))
    pairing_event_response = EventBrowseResponse(events=published_events)

    return jsonify(pairing_event_response.model_dump()), 200

# please look this over


@org_dashboard_bp.patch("/event")
def update_event():
    organization_id = request.args.get("organization_id")
    event_id = request.args.get("event_id")

    if organization_id is None or event_id is None:
        return jsonify({"error": "organization_id and event_id are required"}), 400

    # Check if the event exists and belongs to the organization
    event = g.db.query(Event).filter(Event.id == event_id).first()

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
    - start_date
    - end_date
    """

    data = request.get_json(silent=True) or {}

    organization_id = data.get("organization_id")

    if not organization_id:
        return jsonify({"error": "organization_id is required"}), 400

    title = data.get("title", "Untitled Event")
    description = data.get("description", "")
    image_url = data.get(
        "image_url",
        f"{request.host_url}organization-dashboard/static/peerpear_logo.png",
    )

    today = datetime.now()
    today_date = today.date()
    matches = {}
    start_date = data.get("start_date")
    end_date = data.get("end_date")

    try:
        start_dt = datetime.fromisoformat(start_date)
        end_dt = datetime.fromisoformat(end_date)
    except Exception:
        return jsonify({"error": "Invalid date format"}), 400

    if end_dt < start_dt:
        return jsonify({"error": "End date must be after start date"}), 400

    if start_dt < datetime.now():
        return jsonify({"error": "Start date cannot be in the past"}), 400

    active = start_dt.date() == today_date
    new_event = Event(
        organization_id=organization_id,
        title=title,
        description=description,

        # image_url=image_url,
        start_date=start_dt,
        ends_at=end_dt,
        matches=matches,
        active=active,
    )
    try:
        g.db.add(new_event)
        g.db.commit()
    except SQLAlchemyError as e:
        g.db.rollback()
        print(str(e))
        return jsonify({"error": f"Database error"}), 500
    # NOTE: all routes should return some error/success message and HTTP status
    return jsonify({"message": "Event created successfully"}), 200
