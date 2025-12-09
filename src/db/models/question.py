from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Index
from sqlalchemy.orm import mapped_column, relationship, Mapped
from sqlalchemy.dialects.postgresql import ARRAY
from .base import MainDB_Base
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from sqlalchemy.dialects.postgresql import JSONB

class QuestionTable(MainDB_Base):
    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True)

    question: Mapped[str] = mapped_column(String, nullable=False)

    # list of string or None for open-ended questions
    options: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)

    event_id: Mapped[int] = mapped_column(
        ForeignKey("events.id", ondelete='CASCADE'),
        nullable=False,
        index=True
    )