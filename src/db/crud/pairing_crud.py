from db.models.events import EventTable, EventStatus, EventRegistrationsTable
from db.models.organizations import OrganizationTable
from db.models.user import UserTable
from sqlalchemy import inspect, select, or_
from api.dependencies import get_db_sessionmaker, get_llm
from app_types.api.response.event_browse_response import EventBrowseResponse, PublishedEvent
from flask import request
from datetime import datetime, timedelta, timezone, date
from sqlalchemy import func
from common.utils.dto_orm_conversion import dto_to_orm, orm_to_dto
from common.types.db_status import DBStatus
from typing import Optional
from common.types.user import User, UserProfile
from common.types.pairing_event import PairedGroup, PairingResult, PairingEvent

def store_new_pairing(pairing_result: PairingResult, event_id: int):
    # parse the pairing result into a nested list of user ids
    groups_by_ids: list[list[int]] = []
    for group in pairing_result.groups:
        single_group_by_ids: list[int] = []
        for student in group.students:
            single_group_by_ids.append(student.id)
        groups_by_ids.append(single_group_by_ids)

    db_session = get_db_sessionmaker()
    with db_session() as session:
        event = session.get(EventTable, event_id)
        # NOTE: shouldn't happen, since already validated in parent caller, but just in case
        if not event:
            raise ValueError(f"Event {event_id} not found")
        # initially, the llm pairing and user-edited pairing are the same
        event.matches = groups_by_ids
        event.llm_matches = groups_by_ids
        session.add(event)
        session.commit()

# returns an optional error message on fail, and a pairing result
def get_pairings_for_event(event_id: int) -> tuple[Optional[dict], Optional[list[PairedGroup]]]:
    db_session = get_db_sessionmaker()

    with db_session as session:
        event = session.scalar(
            select(EventTable)
            .where(EventTable.id == event_id)
        )

        if not event:
            return {"error": "Event not found", "status": 404}, None

        if not event.matches or len(event.matches) == 0:
            return {"error": "No matches were found", "status": 404}, None

        all_users = set()

        for group in event.matches:
            for userid in group:
                all_users.add(userid)

        users = (
            session.query(UserTable, EventRegistrationsTable)
            .join(EventRegistrationsTable, EventRegistrationsTable.user_id == UserTable.id)
            .filter(
                EventRegistrationsTable.event_id == event_id,
                UserTable.id.in_(all_users)
            )
            .all()
        )

        user_map = {user.id:
            User(
                id=user.id,
                name=f"{user.first_name} {user.last_name}",
                email=user.email,
                role=registration.role
            )
            for user, registration in users
        }

        paired_groups: list[PairedGroup] = []

        for group in event.matches:
            group_users = [user_map[user_id] for user_id in group if user_id in user_map]
            paired_groups.append(PairedGroup(students=group_users))

        return None, paired_groups
