from db.models.events import EventTable, EventStatus, EventRegistrationsTable
from db.models.organizations import OrganizationTable
from db.models.user import UserTable
from sqlalchemy import inspect, select, or_
from api.dependencies import get_db_sessionmaker, get_llm
from app_types.api.response.event_browse_response import EventBrowseResponse, PublishedEvent
from flask import request
from datetime import datetime, timedelta, timezone, date
from sqlalchemy import func

# helper to retrieve all events
# NOTE: filtering is handled in FE

def create_new_event(event: EventTable):
    db_session = get_db_sessionmaker()
    with db_session() as session:
        session.add(event)
        session.commit()

def get_all_active_events(user_id: int) -> list[PublishedEvent]:
    """
    Returns all events that are STARTED and not yet past their end_date,
    excluding events the given user is already registered for.
    """
    db_session = get_db_sessionmaker()

    with db_session() as session:
        # Subquery: get all event_ids the user has registered for
        registered_event_ids = (
            session.query(EventRegistrationsTable.event_id)
            .filter(EventRegistrationsTable.user_id == user_id)
            .subquery()
        )

        # Main query: only events that are active and not past end_date
        today = date.today()  # compare date only, not time
        rows = (
            session.query(EventTable, OrganizationTable)
            .join(OrganizationTable, EventTable.organization_id == OrganizationTable.id)
            .filter(EventTable.status == EventStatus.STARTED)
            .filter(
                or_(
                    EventTable.end_date == None,
                    func.date(EventTable.end_date) >= today # NOTE: compares date only, so any event ending today will be valid.
                )
            )
            .filter(EventTable.id.notin_(registered_event_ids))
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
    db_session = get_db_sessionmaker()

    stmt = (
        select(EventTable, OrganizationTable)
        .join(OrganizationTable, EventTable.organization_id == OrganizationTable.id)
        .where(EventTable.organization_id == organization_id)
    )

    with db_session() as session:
        rows = session.execute(stmt).all()

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

    db_session = get_db_sessionmaker()

    stmt = (select(EventTable, OrganizationTable)
            .join(EventRegistrationsTable, EventTable.id == EventRegistrationsTable.event_id)
            .join(OrganizationTable, EventTable.organization_id == OrganizationTable.id)
            .where(EventRegistrationsTable.user_id == user_id)
            )

    with db_session() as session:
        rows = session.execute(stmt).all()

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
    db_session = get_db_sessionmaker()

    stmt = (
        select(EventTable, OrganizationTable)
        .join(OrganizationTable, EventTable.organization_id == OrganizationTable.id)
        .where(EventTable.id == event_id)
    )

    with db_session() as session:
        result = session.execute(stmt).one_or_none()

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
