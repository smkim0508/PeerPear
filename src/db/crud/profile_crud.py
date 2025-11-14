from db.models.user import UserTable
from db.models.user_profile import UserProfileTable
from typing import Optional, List
from db.models.organizations import OrganizationTable
from db.models.user import UserTable
from sqlalchemy import inspect, select, update
from api.dependencies import get_db_sessionmaker, get_llm
from app_types.api.response.event_browse_response import EventBrowseResponse, PublishedEvent
from flask import request
from datetime import datetime, timedelta
from common.types.user import UserProfile, UserProfileFull, User, ClassYear

# returns a row from the UserProfileTable given a user id
def get_user_profile(user_id: int) -> Optional[UserProfileFull]:
    db_session = get_db_sessionmaker()

    stmt = (
        select(
            UserTable.id,
            UserTable.first_name,
            UserTable.last_name,
            UserTable.email,
            UserTable.phone_number,
            UserTable.username,
            UserProfileTable.gender,
            UserProfileTable.class_year,
            UserProfileTable.major,
            UserProfileTable.hobbies,
            UserProfileTable.profile_summary
        )
        .join(UserProfileTable, UserTable.id == UserProfileTable.user_id)
        .where(UserTable.id == user_id)
    )

    with db_session() as session:
        result = session.execute(stmt).one_or_none()

    if not result:
        return None

    user_profile = UserProfileFull(
        id=result.id,
        first_name=result.first_name,
        last_name=result.last_name,
        email=result.email,
        user_name=result.username,
        phone_number=result.phone_number,
        gender=result.gender,
        class_year=result.class_year,
        major=result.major,
        hobbies=result.hobbies,
        profile_summary=result.profile_summary
    )

    return user_profile

def create_user_profile(
        user_id: int,
        gender: Optional[str],
        class_year: ClassYear,
        major: Optional[str],
        hobbies: Optional[List[str]] = None):
    db_session = get_db_sessionmaker()

    # NOTE: SQLAlchemy handles None mapped to NULL
    hobbies = hobbies or []
    major_value = major or ""

    new_profile = UserProfileTable(
        user_id=user_id,
        gender=gender,
        class_year=class_year,
        major=major_value,
        hobbies=hobbies
    )

    with db_session() as session:
        session.add(new_profile)
        session.commit()
        session.refresh(new_profile)
    
    return new_profile

def update_user_profile(user_profile: UserProfileFull):
    db_session = get_db_sessionmaker()

    # only update fields that the caller actually sent
    payload = user_profile.model_dump(exclude_unset=True)

    # parse payload into user table and user profile
    user_fields = {"first_name", "last_name", "email", "phone_number", "username"}
    profile_fields = {"gender", "class_year", "major", "hobbies"} # profile summary is only generated, not input

    user_values = {k: v for k, v in payload.items() if k in user_fields}
    profile_values = {k: v for k, v in payload.items() if k in profile_fields}

    # execute update on both tables
    with db_session() as session:
        existing_profile = session.execute(
            select(UserProfileTable).where(UserProfileTable.user_id == user_profile.id)
        ).scalar_one_or_none()

        if user_values:
            session.execute(
                update(UserTable)
                .where(UserTable.id == user_profile.id)
                .values(**user_values)
            )

        if existing_profile:
            if profile_values:
                session.execute(
                    update(UserProfileTable)
                    .where(UserProfileTable.user_id == user_profile.id)
                    .values(**profile_values)
                )
        else:
            session.add(
                UserProfileTable(
                    user_id=user_profile.id,
                    gender=user_profile.gender,
                    class_year=user_profile.class_year,
                    major=user_profile.major or "",
                    hobbies=user_profile.hobbies or [],
                )
            )

        session.commit()

    # NOTE: optionally, we can load the newly updated profile back with get_user_profile()
    return user_profile