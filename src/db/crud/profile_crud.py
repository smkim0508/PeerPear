from db.models.user import UserTable
from db.models.user_profile import UserProfileTable

from db.models.organizations import Organization
from db.models.user import UserTable
from sqlalchemy import inspect, select
from api.dependencies import get_db_session, get_llm
from app_types.api.response.event_browse_response import EventBrowseResponse, PublishedEvent
from flask import request
from datetime import datetime, timedelta


# returns a row from the UserProfileTable given a user id
def get_user_profile(user_id: int) -> UserProfileTable | None:
    db_session = get_db_session()

    stmt = (
        select(UserProfileTable)
        .where(UserProfileTable.user_id == user_id)
    )

    result = db_session.execute(stmt).one_or_none()

    return result


def create_user_profile(user_id: int, gender: str | None = None, class_year: int, major: str | None = None, hobbies=list[str]):
    db_session = get_db_session()

    new_profile = UserProfileTable(
        user_id=user_id,
        gender=gender,
        class_year=class_year,
        major=major,
        hobbies=hobbies
    )

    db_session.add(new_profile)
    db_session.commit()
    db_session.refresh(new_profile)
    return new_profile
