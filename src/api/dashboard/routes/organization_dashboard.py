# main landing page for organizations after logging in
from flask import Blueprint, request, send_from_directory, jsonify, g
import os
from api import validate_model
from app_types.api.response.event_browse_response import EventBrowseResponse, PublishedEvent
from db.models.events import Event
from db.crud.events_crud import get_organization_events
from datetime import datetime, timedelta
from sqlalchemy import select
from db.models.organizations import Organization

# use blueprint to group routes
org_dashboard_bp = Blueprint("org_dashboard", __name__)

@org_dashboard_bp.get("/")
def foo():
    return "something"

@org_dashboard_bp.get("/event-browse")
def browse_events():

    organization_id = request.args.get("organization_id")

    if organization_id is None:
        return jsonify({"error": "organization_id is required"}), 400
    # use helper to retrieve all events for the organization
    published_events = get_organization_events(int(organization_id))
    pairing_event_response = EventBrowseResponse(events=published_events)

    return jsonify(pairing_event_response.model_dump()), 200

#please look this over
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

@org_dashboard_bp.post("/create-event") # NOTE: by convention, use "-" to split words in routes
def create_event():
    organization_id = request.args.get("organization_id")
    
    if organization_id is None:
        return jsonify({"error": "organization_id is required"}), 400
    
    create_at = datetime.now()
    
    title = request.args.get("title", "Untitled Event")
    description = request.args.get("description", "")
    image_url = request.args.get(
        "image_url",
        f"{request.host_url}organization-dashboard/static/peerpear_logo.png",
    )
    matches = []
    active = True
    days_duration = int(request.args.get("days_duration", 1))
    ends_at = create_at + timedelta(days=days_duration)
    
    new_event = Event(
        organization_id=organization_id,
        title=title,
        description=description,
        image_url=image_url,
        created_at=create_at,
        ends_at=ends_at,
        matches=matches,
        active=active,
    )
    g.db.add(new_event)
    g.db.commit()

    # NOTE: all routes should return some error/success message and HTTP status
    return jsonify({"message": "Event created successfully"}), 200