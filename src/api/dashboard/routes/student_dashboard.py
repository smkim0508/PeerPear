# main landing page for students after logging in
from flask import Blueprint, request, send_from_directory, jsonify, g
from common.types.events import PairingEvent, PairingResult
from datetime import datetime, timezone, timedelta
from api import validate_model
from app_types.api.response.event_browse_response import EventBrowseResponse, PublishedEvent
from db.models.events import Event
from db.models.organizations import Organization
from sqlalchemy import inspect

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
    # TODO: connect w/ db to return real events
    rows = (
        g.db.query(Event, Organization)
        .join(Organization, Event.organization_id == Organization.id)
        .filter(Event.active == True)
        .all()
    )

    # convert SQL alchemy mapping to Pydantic
    published_events: list[PublishedEvent] = []
    for event, org in rows:
        published_events.append(
            PublishedEvent(
                id=event.id,
                title=getattr(event, "title", "Untitled Event"),
                description=getattr(event, "description", ""),
                organization_name=getattr(org, "org_name", "Unknown Organization"),
                image_url=getattr(
                    event,
                    "image_url",
                    f"{request.host_url}student-dashboard/static/peerpear_logo.png",
                ),
                start_date=getattr(event, "created_at", datetime.now()),
                end_date=getattr(event, "ends_at", datetime.now() + timedelta(days=1)),
            )
        )

    # dummy events below, to integrate FE w/ BE.
    pairing_event: PairingEvent = PairingEvent(
        id=1,
        organization_id=1,
        title="PeerPear Big-Sib Little-Sib",
        description="The annual mentorship program for PeerPear!",
        # static right now
        image_url=f"{request.host_url}student-dashboard/static/peerpear_logo.png",
        organization_name="PeerPear Org",
        start_date=datetime.now(timezone.utc),
        end_date=datetime.now(timezone.utc) +
        timedelta(days=1),  # set to tomorrow
        is_active=True,
        participants=[1, 2, 3, 4],
        matches=PairingResult(groups=[[1, 2], [3, 4]]),
    )

    dummy_event_1 = PublishedEvent(**pairing_event.model_dump())

    dummy_event_2 = PublishedEvent(
        id=2,
        title="TigerFam pairings",
        description="The OG TigerFam pairing!",
        # static
        organization_name="Sungmin",
        image_url=f"{request.host_url}student-dashboard/static/peerpear_logo.png",
        start_date=datetime.now(timezone.utc),
        end_date=datetime.now(timezone.utc) +
        timedelta(weeks=3),  # set to 3 weeks
    )
    
    # pairing_event_response = EventBrowseResponse(events=[dummy_event_1, dummy_event_2])
    
    pairing_event_response = EventBrowseResponse(events=published_events)

    return jsonify(pairing_event_response.model_dump())
