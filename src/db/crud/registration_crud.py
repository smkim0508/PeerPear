from db.models.events import EventTable, EventStatus, EventRegistrationsTable
from db.models.organizations import OrganizationTable
from db.models.user import UserTable
from db.models.user_profile import UserProfileTable
from sqlalchemy import inspect, select, or_
from api.dependencies import get_db_sessionmaker, get_llm
from app_types.api.response.event_browse_response import EventBrowseResponse, PublishedEvent
from flask import request
from datetime import datetime, timedelta, timezone, date
from sqlalchemy import func
from common.types.registration import EventRegistration
from common.utils.dto_orm_conversion import dto_to_orm, orm_to_dto
from common.types.user import UserProfile, UserProfileFull, User
from typing import Optional

def create_new_registration(registration: EventRegistration):
    """
    Adds one new registration to the database.
    """
    db_session = get_db_sessionmaker()
    with db_session() as session:

        db_registration = dto_to_orm(registration, EventRegistrationsTable)
        session.add(db_registration)
        session.commit()

        session.refresh()

        return EventRegistration.model_validate(db_registration)

def get_all_registered_users_for_event(event_id: int) -> Optional[list[UserProfile]]:
    """
    Retrieves all *users* that are registered for a given event id.
    NOTE: not to be mixed with actual registration details.
    - Each user holds minimal user profile info needed for LLM pairing.
    """
    db_session = get_db_sessionmaker()

    stmt = (
        select(EventRegistrationsTable, UserProfileTable, UserTable)
        .join(EventRegistrationsTable, EventRegistrationsTable.user_id == UserProfileTable.user_id)
        .join(UserTable, UserTable.id == UserProfileTable.user_id)
        .where(EventRegistrationsTable.event_id == event_id)
    )

    user_profiles: list[UserProfile] = []

    with db_session() as session:
        registrations = session.execute(stmt).all()

        for reg, profile, user in registrations:
            user_profiles.append(
                UserProfile(
                    id=user.id,
                    name="".join([user.first_name, " ", user.last_name]), # joins first and last name
                    profile_summary=profile.profile_summary or ""
                )
            )

        if user_profiles:
            return user_profiles
        return None
