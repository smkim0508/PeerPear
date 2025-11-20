from db.models.events import EventTable, EventStatus, EventRegistrationsTable
from db.models.organizations import OrganizationTable
from db.models.user import UserTable
from db.models.user_profile import UserProfileTable
from db.models.question import QuestionTable
from sqlalchemy import inspect, select, or_
from api.dependencies import get_db_sessionmaker, get_llm
from app_types.api.response.event_browse_response import EventBrowseResponse, PublishedEvent
from flask import request
from datetime import datetime, timedelta, timezone, date
from sqlalchemy import func
from common.types.registration import EventRegistration
from common.utils.dto_orm_conversion import dto_to_orm, orm_to_dto
from common.types.user import UserProfile, UserPairingInformation, User
from typing import Optional
from common.types.event_enums import EventStatus, EventRole
from common.types.user import ClassYear
from common.utils.format_user_profile import format_user_profile_summary


def create_new_registration(event_id: int, user_id: int):
    """
    1. Confirms event exists
    2. Checks for existing registration
    3. Checks if event has questions
    4. Check if the user is a big or little
    5. Creates a new registration with correct valid_registration flag
    """
    db_session = get_db_sessionmaker()

    with db_session() as session:

        # Check that the event exists
        event = session.scalar(
            select(EventTable).where(EventTable.id == event_id))

        if not event:
            return {"error": "Event not found", "status": 404}

        # Check if there is an existing registration
        exists = session.scalar(select(EventRegistrationsTable)
                                .where(EventRegistrationsTable.user_id == user_id)
                                .where(EventRegistrationsTable.event_id == event_id))
        if exists:
            return {"error": "This user is already registered for this event",
                    "status": 400}

        # Check if event has questions
        has_questions = session.scalar(
            select(QuestionTable)
            .where(QuestionTable.event_id == event_id)
            .limit(1)
        ) is not None

        user = session.scalar(
            select(UserTable).where(UserTable.id == user_id)
        )

        if not user:
            return {"error": "User not found", "status": 404}

        user_fields = ["first_name", "last_name", "phone_number"]

        for field in user_fields:
            if not getattr(user, field, None):
                return {"error": "You must first finish your profile", "status": 400}

        # Get user profile to determine role
        user_profile = session.scalar(
            select(UserProfileTable).where(UserProfileTable.user_id == user_id)
        )

        if not user_profile:
            return {"error": "User profile not found", "status": 404}

        required_fields = [
            "class_year",
            "major",
            "hobbies",
        ]
        for field in required_fields:
            if not getattr(user_profile, field, None):
                return {"error": "You must first finish your profile", "status": 400}

        if user_profile.class_year in [ClassYear.FRESHMAN, ClassYear.SOPHOMORE]:
            role = EventRole.LITTLE_SIBLING
        else:
            role = EventRole.BIG_SIBLING

        db_registration = EventRegistrationsTable(
            user_id=user_id,
            event_id=event_id,
            created_at=datetime.now(),
            role=role,
            valid_registration=not has_questions,
        )

        session.add(db_registration)
        session.commit()

        session.refresh(db_registration)

        reg_dto = orm_to_dto(db_registration, EventRegistration)
        return reg_dto.model_dump(mode="json")


def get_all_registered_users_for_event(event_id: int) -> Optional[list[UserPairingInformation]]:
    """
    Retrieves all *users* that are registered for a given event id.
    NOTE: not to be confused with retrieving actual registration details.
    - Each user holds minimal user profile info needed for LLM pairing.
    - Some users may be "registered", but their registration status might be incomplete, which we filter.
    """
    db_session = get_db_sessionmaker()

    stmt = (
        select(EventRegistrationsTable, UserProfileTable, UserTable)
        .join(EventRegistrationsTable, EventRegistrationsTable.user_id == UserProfileTable.user_id)
        .join(UserTable, UserTable.id == UserProfileTable.user_id)
        .where(EventRegistrationsTable.event_id == event_id)
        # verifies if registration is complete
        .where(EventRegistrationsTable.valid_registration == True)
    )

    user_profiles: list[UserPairingInformation] = []

    with db_session() as session:
        registrations = session.execute(stmt).all()
        for reg, profile, user in registrations:
            # use helper to format profile summary for LLM
            profile_summary = format_user_profile_summary(
                major=profile.major or "no current major",
                hobbies=profile.hobbies, # not nullable
                general_profile_summary=profile.profile_summary or None # this is the pre-computed, general summary, if exists
            )
            user_profiles.append(
                UserPairingInformation(
                    id=user.id,
                    # joins first and last name
                    name="".join([user.first_name, " ", user.last_name]),
                    email=user.email,
                    role=reg.role,
                    profile_summary=profile_summary # contains info about hobbies, major, and general summary
                )
            )

        if user_profiles:
            return user_profiles
        return None


def get_registration_status(event_id: int, user_id: int):
    db_session = get_db_sessionmaker()

    with db_session() as session:

        # Check that the event exists
        event = session.scalar(
            select(EventTable).where(EventTable.id == event_id))

        if not event:
            return {"error": "Event not found", "status": 404}

        # Check if there is an existing registration
        registration = session.scalar(select(EventRegistrationsTable)
                                      .where(EventRegistrationsTable.user_id == user_id)
                                      .where(EventRegistrationsTable.event_id == event_id))

        if not registration:
            return {"registered": False}
        print(registration.role)

        reg_dto = EventRegistration.model_validate(
            registration, from_attributes=True)

        return {
            "registered": True,
            "valid_registration": reg_dto.valid_registration,
            "role": reg_dto.role.value if reg_dto.role else None,
            "registration": reg_dto.model_dump(mode="json")
        }


def mark_valid(event_id: int, user_id: int):
    db_session = get_db_sessionmaker()

    with db_session() as session:

        # Check that the event exists
        event = session.scalar(
            select(EventTable).where(EventTable.id == event_id))

        if not event:
            return {"error": "Event not found", "status": 404}

        # Check if there is an existing registration
        registration = session.scalar(select(EventRegistrationsTable)
                                      .where(EventRegistrationsTable.user_id == user_id)
                                      .where(EventRegistrationsTable.event_id == event_id))

        if not registration:
            return {"error": "Registration not found", "status": 404}

        registration.valid_registration = True
        session.commit()
        session.refresh(registration)

        reg_dto = orm_to_dto(registration, EventRegistration)
        return reg_dto.model_dump(mode="json")
