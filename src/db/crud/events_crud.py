from db.models.events import EventTable, EventStatus, EventRegistrationsTable
from db.models.organizations import OrganizationTable
from db.models.orgadmin import OrgAdminTable
from db.models.user import UserTable
from sqlalchemy import inspect, select, or_
from api.dependencies import get_db_sessionmaker, get_llm
from app_types.api.response.event_browse_response import EventBrowseResponse, PublishedEvent
from flask import request, jsonify, current_app
from datetime import datetime, timedelta, timezone, date
from sqlalchemy import func
from common.types.pairing_event import PairingEvent
from common.utils.dto_orm_conversion import dto_to_orm, orm_to_dto
from typing import Optional
from common.logging import logger

def create_new_event(event: PairingEvent) -> PairingEvent:
    db_session = get_db_sessionmaker()
    with db_session() as session:
        db_event = dto_to_orm(event, EventTable)
        session.add(db_event)
        session.commit()

        session.refresh(db_event)  # refreshes DB ORM

        # returns the newly-mapped event DTO
        return PairingEvent.model_validate(db_event)

# helper to retrieve all events
# NOTE: filtering is handled in FE
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

        # get default image from buckets
        media_url = current_app.config.get("MEDIA_URL", None)
        if media_url is None:
            default_image_url = f"{request.host_url}static/peerpear_logo.png"
        else:
            default_image_url = f"{media_url}/peerpear_logo.png"

        for event, org in rows:
            published_events.append(
                PublishedEvent(
                    id=event.id,
                    title=event.title or "Untitled Event",
                    description=event.description or "",
                    organization_name=org.org_name or "Unknown Organization",
                    image_url=event.image_url or default_image_url,
                    # image_url=event.image_url or f"{request.host_url}static/peerpear_logo.png",
                    status=event.status,
                    end_date=event.end_date
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

        # get default image from buckets
        media_url = current_app.config.get("MEDIA_URL", None)
        if media_url is None:
            default_image_url = f"{request.host_url}static/peerpear_logo.png"
        else:
            default_image_url = f"{media_url}/peerpear_logo.png"

        published_events: list[PublishedEvent] = []
        for event, org in rows:
            published_events.append(
                PublishedEvent(
                    id=event.id,
                    title=event.title or "Untitled Event",
                    description=event.description or "",
                    organization_name=org.org_name or "Unknown Organization",
                    image_url=event.image_url or default_image_url,
                    # image_url=event.image_url or f"{request.host_url}static/peerpear_logo.png",
                    status=event.status,
                    end_date=event.end_date
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
        
        # get default image from buckets
        media_url = current_app.config.get("MEDIA_URL", None)
        if media_url is None:
            default_image_url = f"{request.host_url}static/peerpear_logo.png"
        else:
            default_image_url = f"{media_url}/peerpear_logo.png"

        for event, org in rows:
            published_events.append(
                PublishedEvent(
                    id=event.id,
                    title=event.title or "Untitled Event",
                    description=event.description or "",
                    organization_name=org.org_name or "Unknown Organization",
                    image_url=event.image_url or default_image_url,
                    # image_url=event.image_url or f"{request.host_url}static/peerpear_logo.png",
                    end_date=event.end_date or datetime.now(timezone.utc),
                    status=event.status
                )
            )

    return published_events

def get_user_events(user_id: int) -> list[PublishedEvent]:

    db_session = get_db_sessionmaker()

    stmt = (
        select(EventTable, OrganizationTable)
        .select_from(EventTable) # explicitly states left join
        .join(EventRegistrationsTable, EventTable.id == EventRegistrationsTable.event_id)
        .join(OrganizationTable, EventTable.organization_id == OrganizationTable.id)
        .where(EventRegistrationsTable.user_id == user_id)
    )

    with db_session() as session:
        rows = session.execute(stmt).all()

        published_events: list[PublishedEvent] = []

        # get default image from buckets
        media_url = current_app.config.get("MEDIA_URL", None)
        if media_url is None:
            default_image_url = f"{request.host_url}static/peerpear_logo.png"
        else:
            default_image_url = f"{media_url}/peerpear_logo.png"
        
        for event, org in rows:
            published_events.append(
                PublishedEvent(
                    id=event.id,
                    title=event.title or "Untitled Event",
                    description=event.description or "",
                    organization_name=org.org_name or "Unknown Organization",
                    image_url=event.image_url or default_image_url,
                    # image_url=event.image_url or f"{request.host_url}static/peerpear_logo.png",
                    status=event.status,
                    end_date=event.end_date
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

            # get default image from buckets
            media_url = current_app.config.get("MEDIA_URL", None)
            if media_url is None:
                default_image_url = f"{request.host_url}static/peerpear_logo.png"
            else:
                default_image_url = f"{media_url}/peerpear_logo.png"
                
            return PublishedEvent(
                id=event.id,
                title=event.title or "Untitled Event",
                description=event.description or "",
                organization_name=org_name,
                image_url=event.image_url or default_image_url,
                # image_url=event.image_url or f"{request.host_url}static/peerpear_logo.png",
                end_date=event.end_date or datetime.now(timezone.utc),
                status=event.status
            )
    return None

def validate_event_and_admin(session, event_id: int, user_id: int):

    event = session.scalar(
        select(EventTable).where(EventTable.id == event_id)
    )

    if not event:
        logger.info("Event not found")
        return None, {"error": "Event not found", "status": 404}

    org_admins = session.scalars(
        select(OrgAdminTable).where(OrgAdminTable.user_id == user_id)
    ).all()

    if not org_admins:
        logger.info("User is not an organization admin")
        return None, {"error": "User is not an organization admin", "status": 403}

    organization_ids = [org_admin.organization_id for org_admin in org_admins]

    if event.organization_id not in organization_ids:
        logger.info(f"Organization does not own this event, event org id: {event.organization_id}, admin org ids: {organization_ids}")
        return None, {"error": "Organization does not own this event", "status": 403}

    return event, None

def validate_event_and_user(session, event_id: int, user_id: int):
    event = session.scalar(
        select(EventTable).where(EventTable.id == event_id)
    )

    if not event:
        return None, {"error": "Event not found", "status": 404}

    user = session.scalar(select(UserTable).where(UserTable.id == user_id))

    if user is None:
        return None, {"error": "User not found", "status": 404}

    if event.status == EventStatus.NOT_STARTED:
        return None, {"error": "Event has not started.", "status": 403}

    if event.status == EventStatus.STARTED:
        return event, None

    registration = session.scalar(select(EventRegistrationsTable).where(
        EventRegistrationsTable.event_id == event_id).where(EventRegistrationsTable.user_id == user_id))

    if not registration:
        return None, {"error": "You do not have view access to this event.", "status": 403}

    return event, None


def verify_access(event_id: int, user_id: int, user_type: str):

    db_session = get_db_sessionmaker()

    with db_session() as session_instance:
        if user_type == "organization":
            event, error = validate_event_and_admin(
                session_instance, event_id, user_id)

        else:
            event, error = validate_event_and_user(
                session_instance, event_id, user_id)

        if error:
            return error

        return {"message": "Access to this event is verified", "status": 200}

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
            return {"error": "Event not found", "status": 404}

        today = date.today()

        if event.status not in [EventStatus.STARTED, EventStatus.NOT_STARTED]:
            return {"message": "Event already terminated", "status": 200}

        if not event.end_date or event.end_date.date() > today:
            return {"message": "Event has not reached its end date yet", "status": 200}

        event.status = EventStatus.TERMINATED

        session_instance.commit()

        return {"message": "Event ended successfully", "event_id": event_id}

def get_registration_by_user_and_event_id(event_id: int, user_id: int) -> Optional[int]:
    """
    Retrieves the unique registration tied to an event id and user id.
    """
    db_session = get_db_sessionmaker()

    with db_session() as session:

        stmt = (
            select(EventRegistrationsTable.id)
            .where(EventRegistrationsTable.user_id == user_id)
            .where(EventRegistrationsTable.event_id == event_id)
        )

        registration_id = session.execute(stmt).scalar_one_or_none()
        return registration_id

def check_if_sibling_role_considered(event_id: int) -> bool:
    """
    helper to retrieve a bool about whether this event requires use of sibling roles or not.
    """
    db_session = get_db_sessionmaker()

    with db_session() as session:
        stmt = (
            select(EventTable.check_sibling_roles)
            .where(EventTable.id == event_id)
        )

        check_sibling_roles = session.execute(stmt).scalar_one_or_none()

        if isinstance(check_sibling_roles, bool):
            return check_sibling_roles
        # if for any reason the value is not a bool, log and default to false
        logger.warning(f"Invalid value for check_sibling_roles: {check_sibling_roles}, defaulting to False")
        return False

def update_event_image(event_id: int, new_image_url: str):
    db_session = get_db_sessionmaker()

    with db_session() as session:
        event = session.scalar(select(EventTable).where(EventTable.id == event_id))
        if not event:
            return {"error": "Event not found", "status": 404}
        event.image_url = new_image_url
        session.commit()
        return {"message": "Event image updated", "status": 200}
