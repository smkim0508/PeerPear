from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Index, DateTime
from sqlalchemy.orm import mapped_column, relationship, Mapped
from sqlalchemy.dialects.postgresql import ARRAY
from .base import MainDB_Base
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from datetime import datetime
from sqlalchemy.dialects.postgresql import JSONB

class Event(MainDB_Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey("organizations.id"),nullable = False, unique = True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    ends_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=True)
    description: Mapped[str] = mapped_column(String, nullable=True)
    matches: Mapped[dict] = mapped_column(JSONB, nullable=True)