from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Index, DateTime
from sqlalchemy.orm import mapped_column, relationship, Mapped
from sqlalchemy.dialects.postgresql import ARRAY
from .base import MainDB_Base
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from datetime import datetime
from sqlalchemy.dialects.postgresql import JSONB
from db.models.organizations import Organization

# main event table, representing each event
class Event(MainDB_Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True)
    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id"), nullable=False)
    start_date: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now(), nullable=False
    )
    end_date: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=True)
    description: Mapped[str] = mapped_column(String, nullable=True)
    matches: Mapped[dict] = mapped_column(JSONB, nullable=True)
    organization: Mapped[Organization] = relationship("Organization")

# table representing each unique user + event pair, which is defined as a registration
# NOTE: allows for easily querying users attending events.
class EventRegistrations(MainDB_Base):
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
    status: Mapped[str] = mapped_column(String, nullable=False) # TODO: make enums
    role: Mapped[str] = mapped_column(String, nullable=False) # TODO: make enums
