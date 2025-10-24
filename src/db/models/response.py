from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Index
from sqlalchemy.orm import mapped_column, relationship, Mapped
from sqlalchemy.dialects.postgresql import ARRAY
from .base import MainDB_Base
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from sqlalchemy.dialects.postgresql import JSONB

class Response(MainDB_Base):
    __tablename__ = "responses"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True)

    question_id: Mapped[int] = mapped_column(
        ForeignKey("questions.id"), nullable=False, unique=True)
    
    answer: Mapped[dict] = mapped_column(JSONB, nullable=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("user.id"), nullable=False, unique=True)
