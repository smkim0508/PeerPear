from db.models.events import EventTable, EventStatus, EventRegistrationsTable
from db.models.organizations import OrganizationTable
from db.models.orgadmin import OrgAdminTable
from db.models.user import UserTable
from sqlalchemy import inspect, select, or_
from api.dependencies import get_db_sessionmaker, get_llm
from app_types.api.response.event_browse_response import EventBrowseResponse, PublishedEvent
from flask import request, jsonify
from datetime import datetime, timedelta, timezone, date
from sqlalchemy import func
from common.types.pairing_event import PairingEvent
from common.utils.dto_orm_conversion import dto_to_orm, orm_to_dto

# helper to retrieve all events
# NOTE: filtering is handled in FE


def create_new_event(event: PairingEvent) -> PairingEvent:
    db_session = get_db_sessionmaker()
    with db_session() as session:
        db_event = dto_to_orm(event, EventTable)
        session.add(db_event)
        session.commit()

        session.refresh(db_event)  # refreshes DB ORM

        # returns the newly-mapped event DTO
        return PairingEvent.model_validate(db_event)


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
                    # NOTE: compares date only, so any event ending today will be valid.
                    func.date(EventTable.end_date) >= today
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


def get_all_active_events_unfiltered() -> list[PublishedEvent]:
    """
    Returns all events that are STARTED and not yet past their end_date,
    including events the user may already be registered for.
    """
    db_session = get_db_sessionmaker()

    with db_session() as session:
        # Main query: only events that are active and not past end_date
        today = date.today()  # compare date only, not time
        rows = (
            session.query(EventTable, OrganizationTable)
            .join(OrganizationTable, EventTable.organization_id == OrganizationTable.id)
            .filter(EventTable.status == EventStatus.STARTED)
            .filter(
                or_(
                    EventTable.end_date == None,
                    # NOTE: compares date only, so any event ending today will be valid.
                    func.date(EventTable.end_date) >= today
                )
            )
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


def validate_event_and_admin(session, event_id: int, user_id: int):

    event = session.scalar(
        select(EventTable).where(EventTable.id == event_id)
    )

    if not event:
        return None, {"error": "Event not found", "status": 404}

    org_admin = session.scalar(
        select(OrgAdminTable).where(OrgAdminTable.user_id == user_id)
    )

    if org_admin is None:
        return None, {"error": "User is not an organization admin", "status": 403}

    organization_id = org_admin.organization_id

    if event.organization_id != organization_id:
        return None, {"error": "Organization does not own this event", "status": 403}

    return event, None

# Starts an event


def start_event(event_id: int, user_id: int):

    db_session = get_db_sessionmaker()

    with db_session() as session_instance:
        event, error = validate_event_and_admin(
            session_instance, event_id, user_id)

        if error:
            return error

        if event.status != EventStatus.NOT_STARTED:
            return {"error": "Event cannot be started from the current state", "status": 400}

        event.status = EventStatus.STARTED

        session_instance.commit()

        return {"message": "Event started successfully", "event_id": event_id}


def end_event(event_id: int, user_id: int):
    db_session = get_db_sessionmaker()

    with db_session() as session_instance:
        event, error = validate_event_and_admin(
            session_instance, event_id, user_id)

        if error:
            return error
        current_date = date.today()

        if event.status not in [EventStatus.STARTED, EventStatus.NOT_STARTED]:
            return {"error": "Event cannot be ended from the current state", "status": 400}

        if event.status == EventStatus.NOT_STARTED and (not event.end_date or event.end_date.date() > current_date):
            return {"error": "Event has not reached its end date and has not started", "status": 400}

        event.status = EventStatus.TERMINATED

        session_instance.commit()

        return {"message": "Event ended successfully", "event_id": event_id}


def publish_event(event_id: int, user_id: int):
    db_session = get_db_sessionmaker()

    with db_session() as session_instance:
        event, error = validate_event_and_admin(
            session_instance, event_id, user_id)

        if error:
            return error

        if event.status != EventStatus.TERMINATED:
            return {"error": "Event cannot be published from the current state", "status": 400}

        if not event.matches:
            return {"error": "There are no pairings to be published", "status": 400}

        event.status = EventStatus.PAIRING_PUBLISHED

        session_instance.commit()

        return {"message": "Event pairings published successfully", "event_id": event_id}

def auto_terminate(event_id: int):
    db_session = get_db_sessionmaker()

    with db_session() as session_instance:
        event = session_instance.scalar(
            select(EventTable).where(EventTable.id == event_id)
        )

        if not event:
            return   {"error": "Event not found", "status": 404}

        today = date.today()

        if event.status not in [EventStatus.STARTED, EventStatus.NOT_STARTED]:
            return {"message": "Event already terminated", "status": 200}

        if not event.end_date or event.end_date.date() > today:
            return {"message": "Event has not reached its end date yet", "status": 200}

        event.status = EventStatus.TERMINATED

        session_instance.commit()

        return {"message": "Event ended successfully", "event_id": event_id}
