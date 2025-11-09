from db.models.user import UserTable
from db.models.user_profile import UserProfileTable
from typing import Optional

from db.models.organizations import Organization
from db.models.user import UserTable
from sqlalchemy import inspect, select
from api.dependencies import get_db_sessionmaker, get_llm
from app_types.api.response.event_browse_response import EventBrowseResponse, PublishedEvent
from flask import request
from datetime import datetime, timedelta
from common.types.user import UserProfile

# returns a row from the UserProfileTable given a user id
def get_user_profile(user_id: int) -> UserProfileTable | None:
    db_session = get_db_sessionmaker()

    stmt = (
        select(UserProfileTable)
        .where(UserProfileTable.user_id == user_id)
    )

    with db_session() as session:
        result = session.execute(stmt).one_or_none()

    return result

def create_user_profile(user_id: int, gender: Optional[str], class_year: int, major: Optional[str], hobbies=list[str]):
    db_session = get_db_sessionmaker()

    # NOTE: SQLAlchemy handles None mapped to NULL
    new_profile = UserProfileTable(
        user_id=user_id,
        gender=gender,
        class_year=class_year,
        major=major,
        hobbies=hobbies
    )

    with db_session() as session:
        session.add(new_profile)
        session.commit()
        session.refresh(new_profile)
    
    return new_profile

def update_user_profile(user_profile: UserProfile):
    db_session = get_db_sessionmaker()

    # retrieves the user profile from db, updates it locally in Python and re-enters to db
    profile = get_user_profile(user_profile.id)

    for key, value in user_profile.model_dump(exclude_unset=True).items():
        setattr(profile, key, value)

    with db_session() as session:
        session.commit()
        session.refresh(profile) # re-retrieves the updated profile

    return profile
