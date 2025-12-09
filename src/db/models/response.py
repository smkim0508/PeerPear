from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Index
from sqlalchemy.orm import mapped_column, relationship, Mapped
from sqlalchemy.dialects.postgresql import ARRAY
from .base import MainDB_Base
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from sqlalchemy.dialects.postgresql import JSONB

class ResponseTable(MainDB_Base):
    __tablename__ = "responses"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True)

    question_id: Mapped[int] = mapped_column(
        ForeignKey("questions.id", ondelete='CASCADE'),
        nullable=False,
        index=True
    )

    answer: Mapped[str] = mapped_column(String, nullable=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete='CASCADE'),
        nullable=False,
        index=True
    )

    # Composite index for faster lookups by user+question combination
    __table_args__ = (
        Index('ix_responses_user_question', 'user_id', 'question_id'),
    )
