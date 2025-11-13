from db.models.events import EventTable, EventStatus, EventRegistrationsTable
from db.models.organizations import OrganizationTable
from db.models.user import UserTable
from sqlalchemy import inspect, select, or_
from api.dependencies import get_db_sessionmaker, get_llm
from app_types.api.response.event_browse_response import EventBrowseResponse, PublishedEvent
from flask import request
from datetime import datetime, timedelta, timezone, date
from sqlalchemy import func
from common.types.pairing_event import PairingResult
from common.utils.dto_orm_conversion import dto_to_orm, orm_to_dto

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
        event.matches = groups_by_ids
        session.add(event)
        session.commit()