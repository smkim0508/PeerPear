from db.models.events import Event
from db.models.organizations import Organization
from sqlalchemy import inspect, select
from api.dependencies import get_db_session, get_llm
from app_types.api.response.event_browse_response import EventBrowseResponse, PublishedEvent
from flask import request
from datetime import datetime, timedelta

# helper to retrieve all events
# NOTE: filtering is handled in FE
def get_all_events() -> list[PublishedEvent]:
    # inits the global db session
    db_sesion = get_db_session()

    rows = (
        db_sesion.query(Event, Organization)
        .join(Organization, Event.organization_id == Organization.id)
        .filter(Event.active == True)
        .all()
    )

    # convert SQL alchemy mapping to Pydantic model
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
    
    return published_events