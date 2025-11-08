from db.models.events import Event, EventStatus, EventRegistrations
from db.models.organizations import Organization
from db.models.user import UserTable
from sqlalchemy import inspect, select, or_
from api.dependencies import get_db_session, get_llm
from app_types.api.response.event_browse_response import EventBrowseResponse, PublishedEvent
from flask import request
from datetime import datetime, timedelta, timezone, date
from sqlalchemy import func

# helper to retrieve all events
# NOTE: filtering is handled in FE


def create_new_event(event: Event):
    db_session = get_db_session()
    db_session.add(event)
    db_session.commit()


def get_all_active_events(user_id: int) -> list[PublishedEvent]:
    """
    Returns all events that are STARTED and not yet past their end_date,
    excluding events the given user is already registered for.
    """
    db_session = get_db_session()

    # Subquery: get all event_ids the user has registered for
    registered_event_ids = (
        db_session.query(EventRegistrations.event_id)
        .filter(EventRegistrations.user_id == user_id)
        .subquery()
    )

    # Main query: only events that are active and not past end_date
    today = date.today()  # compare date only, not time
    rows = (
        db_session.query(Event, Organization)
        .join(Organization, Event.organization_id == Organization.id)
        .filter(Event.status == EventStatus.STARTED)
        .filter(
            or_(
                Event.end_date == None,
                func.date(Event.end_date) >= today # NOTE: compares date only, so any event ending today will be valid.
            )
        )
        .filter(Event.id.notin_(registered_event_ids))
        .all()
    )

    published_events: list[PublishedEvent] = []
    for event, org in rows:
        published_events.append(
            PublishedEvent(
                id=event.id,
                title=event.title or "Untitled Event",
                description=event.description or "",
                organization_name=org.org_name or "Unknown Organization",
                image_url=event.image_url or f"{request.host_url}student_dashboard/static/peerpear_logo.png",
                status=event.status,
                end_date=event.end_date,
            )
        )

    return published_events


def get_organization_events(organization_id: int) -> list[PublishedEvent]:
    db_session = get_db_session()

    stmt = (
        select(Event, Organization)
        .join(Organization, Event.organization_id == Organization.id)
        .where(Event.organization_id == organization_id)
    )

    rows = db_session.execute(stmt).all()

    published_events: list[PublishedEvent] = []

    for event, org in rows:
        published_events.append(
            PublishedEvent(
                id=event.id,
                title=event.title or "Untitled Event",
                description=event.description or "",
                organization_name=org.org_name or "Unknown Organization",
                image_url=event.image_url
                or f"{request.host_url}organization-dashboard/static/peerpear_logo.png",
                end_date=event.end_date or datetime.now(timezone.utc),
                status=event.status
            )
        )

    return published_events


def get_user_events(user_id: int) -> list[PublishedEvent]:

    db_session = get_db_session()

    stmt = (select(Event, Organization)
            .join(EventRegistrations, Event.id == EventRegistrations.event_id)
            .join(Organization, Event.organization_id == Organization.id)
            .where(EventRegistrations.user_id == user_id)
            )

    rows = db_session.execute(stmt).all()

    published_events: list[PublishedEvent] = []

    for event, org in rows:
        published_events.append(
            PublishedEvent(
                id=event.id,
                title=event.title or "Untitled Event",
                description=event.description or "",
                organization_name=org.org_name or "Unknown Organization",
                image_url=f"{request.host_url}student_dashboard/static/peerpear_logo.png",
                status=event.status,
                end_date=event.end_date,
            )
        )

    return published_events


def get_event_by_id(event_id: int) -> PublishedEvent | None:
    db_session = get_db_session()

    stmt = (
        select(Event, Organization)
        .join(Organization, Event.organization_id == Organization.id)
        .where(Event.id == event_id)
    )

    result = db_session.execute(stmt).one_or_none()

    if result:
        event, org = result
        org_name = org.org_name if org else "Unknown Organization"

        return PublishedEvent(
            id=event.id,
            title=event.title or "Untitled Event",
            description=event.description or "",
            organization_name=org_name,
            image_url=event.image_url or f"{request.host_url}student_dashboard/static/peerpear_logo.png",
            end_date=event.end_date or datetime.now(timezone.utc),
            status=event.status
        )

    return None
