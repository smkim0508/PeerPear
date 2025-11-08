from db.models.events import Event, EventStatus
from db.models.organizations import Organization
from db.models.user import UserTable
from sqlalchemy import inspect, select, or_
from api.dependencies import get_db_session, get_llm
from app_types.api.response.event_browse_response import EventBrowseResponse, PublishedEvent
from flask import request
from datetime import datetime, timedelta, timezone

# helper to retrieve all events
# NOTE: filtering is handled in FE

def get_all_active_events() -> list[PublishedEvent]:
    # inits the global db session
    db_sesion = get_db_session()

    # should be only events that are active
    rows = (
        db_sesion.query(Event, Organization)
        .join(Organization, Event.organization_id == Organization.id)
        .where(Event.status==EventStatus.STARTED)
        .where(
            or_(
                Event.end_date == None,
                Event.end_date > datetime.now(timezone.utc) # use utc for comparison
            )
        )
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
                organization_name=getattr(
                    org, "org_name", "Unknown Organization"),
                image_url=getattr(
                    event,
                    "image_url",
                    f"{request.host_url}student_dashboard/static/peerpear_logo.png",
                ),
                start_date=getattr(event, "start_date", datetime.now(timezone.utc)),
                end_date=getattr(event, "end_date",
                    datetime.now(timezone.utc) + timedelta(days=1)
                ),
            )
        )

    return published_events


def get_organization_events(organization_id: int) -> list[PublishedEvent]:
    db_session = get_db_session()

    published_events: list[PublishedEvent] = []

    stmt = (
        select(Event, Organization)
        .join(Organization, Event.organization_id == Organization.id)
        .where(Event.organization_id == organization_id)
    )

    rows = db_session.execute(stmt).all()

    for event, org in rows:
        published_event = PublishedEvent(
            id=event.id,
            title=event.title or "Untitled Event",
            description=event.description or "",
            organization_name=org.org_name or "Unknown Organization",
            image_url=f"{request.host_url}organization-dashboard/static/peerpear_logo.png",
            start_date=event.start_date or datetime.now(),
            end_date=event.end_date or datetime.now() + timedelta(days=1),
        )
        published_events.append(published_event)
    return published_events


def get_user_events(user_id: int) -> list[PublishedEvent]:

    db_session = get_db_session()

    published_events: list[PublishedEvent] = []

    stmt = (
        select(UserTable)
        .where(UserTable.id == user_id)
    )

    user = db_session.execute(stmt).scalar_one_or_none()

    if user:
        for event_id in user.events:
            event = get_event_by_id(event_id)
            if event:
                published_events.append(event)

    return published_events


def get_event_by_id(event_id: int) -> PublishedEvent | None:
    db_session = get_db_session()

    stmt = (
        select(Event)
        .where(Event.id == event_id)
    )

    result = db_session.execute(stmt).one_or_none()

    if result:
        event = result[0]

        org = db_session.query(Organization).filter_by(
            id=event.organization_id).first()
        org_name = org.org_name if org else "Unknown Organization"

        published_event = PublishedEvent(
            id=event.id,
            title=getattr(event, "title", "Untitled Event"),
            description=getattr(event, "description", ""),
            organization_name=org_name,
            image_url=getattr(
                event,
                "image_url",
                f"{request.host_url}student_dashboard/static/peerpear_logo.png",
            ),
            start_date=getattr(event, "start_date", datetime.now()),
            end_date=getattr(event, "end_date",
                             datetime.now() + timedelta(days=1)),
        )

        return published_event
