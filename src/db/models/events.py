from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Index, DateTime
# to not get confused with actual Enum class
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import mapped_column, relationship, Mapped
from sqlalchemy.dialects.postgresql import ARRAY
from .base import MainDB_Base
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from datetime import datetime
from sqlalchemy.dialects.postgresql import JSONB
from db.models.organizations import OrganizationTable
from enum import Enum
from common.types.event_enums import EventStatus, EventRole

# main event table, representing each event


class EventTable(MainDB_Base):
    """
    The SA ORM mapping for the event table.
    Status of an event is represented with enum values.
    At creation, it will default to NOT_STARTED, and an end date will be provided.

    When an event is "NOT_STARTED", custom questions can safely be added.
    -> Once an event is anything but NOT_STARTED, questions will not be editable.

    When an event is "STARTED" AND the current date is before the end date, users can register.

    When an event is "TERMINATED", no more registrations can be made.
    NOTE: when an event "times out" (i.e. the end date is passed), the event is still left as "STARTED".
    - This status represents a manual termination of the event.

    When an event is "PAIRING_PUBLISHED", the event is over and the results have been made public to attendees (users).
    """
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True)
    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id"), nullable=False)

    # NOTE: start date is now deprecated
    end_date: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    # sets the status as enum in db, with NOT_STARTED as default
    status: Mapped[EventStatus] = mapped_column(
        SAEnum(EventStatus, name="event_status_enum"),
        nullable=False,
        default=EventStatus.NOT_STARTED
    )

    image_url: Mapped[str] = mapped_column(String, nullable=True)

    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=False)
    # NOTE: matches in DB is a 2D array of integer user ids. At each query, the user info is retrieved from DB.
    matches: Mapped[list[list[int]]] = mapped_column(ARRAY(Integer, dimensions=2), nullable=True)
    organization: Mapped[OrganizationTable] = relationship("OrganizationTable")

# table representing each unique user + event pair, which is defined as a registration
# NOTE: allows for easily querying users attending events.


class EventRegistrationsTable(MainDB_Base):
    __tablename__ = "event_registrations"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False)
    event_id: Mapped[int] = mapped_column(
        ForeignKey("events.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now(), nullable=False
    )
    # optional field that represents the user's role in the event, whether big / little
    role: Mapped[EventRole] = mapped_column(
        SAEnum(EventRole, name="event_role_enum"),
        nullable=True,
        default=None
    )
    valid_registration: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
