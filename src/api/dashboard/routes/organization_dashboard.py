# main landing page for organizations after logging in
from flask import Blueprint, request, send_from_directory, jsonify
import os

import flask
from api import validate_model
from app_types.api.response.event_browse_response import EventBrowseResponse
from db.models.events import Event
import PublishedEvent
from datetime import datetime, timedelta
from flask import g

# use blueprint to group routes
org_dashboard_bp = Blueprint("org_dashboard", __name__)

# TODO: change this to be the actual landing page


@org_dashboard_bp.get("/")
def foo():
    return "something"


@org_dashboard_bp.get("/event-browse")
def browse_events():

    organization_id = flask.request.args.get("organization_id")

    if organization_id is None:
        return flask.jsonify({"error": "organization_id is required"}), 400

    published_events: list[PublishedEvent] = []
    rows = (
        g.db.query(Event)
        .filter(Event.organization_id == organization_id)
        .all()
    )

    for row in rows:
        published_event = PublishedEvent(
            id=row.id,
            title=getattr(row, "title", "Untitled Event"),
            description=getattr(row, "description", ""),

            image_url=getattr(
                row,
                "image_url",
                f"{request.host_url}organization-dashboard/static/peerpear_logo.png",
            ),
            start_date=getattr(row, "created_at", datetime.now()),
            end_date=getattr(row, "ends_at",
                             datetime.now() + timedelta(days=1)),
        )

        published_events.append(published_event)
    pairing_event_response = EventBrowseResponse(events=published_events)

    return jsonify(pairing_event_response.model_dump())

#please look this over
@org_dashboard_bp.patch("/event")
def update_event():
    organization_id = flask.request.args.get("organization_id")
    event_id = flask.request.args.get("event_id")
    
    if organization_id is None or event_id is None:
        return flask.jsonify({"error": "organization_id and event_id are required"}), 400
    
    
    # Check if the event exists and belongs to the organization
    event = g.db.query(Event).filter(Event.id == event_id).first()
    
    if event is None:
        return flask.jsonify({"error": "Event not found"}), 404
    
    elif event.organization_id != organization_id:
        return flask.jsonify({"error": "Event does not belong to the organization"}), 404
    
    # make the required updates, TBD

@org_dashboard_bp.post("/createevent")
def create_event():
    organization_id = flask.request.args.get("organization_id")
    
    if organization_id is None:
        return flask.jsonify({"error": "organization_id is required"}), 400
    
    create_at = datetime.now()
    
    title = flask.request.args.get("title", "Untitled Event")
    description = flask.request.args.get("description", "")
    image_url = flask.request.args.get(
        "image_url",
        f"{request.host_url}organization-dashboard/static/peerpear_logo.png",
    )
    matches = []
    active = True
    days_duration = int(flask.request.args.get("days_duration", 1))
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