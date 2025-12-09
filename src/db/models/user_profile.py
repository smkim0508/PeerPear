from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Index
from sqlalchemy.orm import mapped_column, relationship, Mapped
from sqlalchemy.dialects.postgresql import ARRAY
from .base import MainDB_Base
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from enum import Enum
from common.types.user import ClassYear
from sqlalchemy import Enum as SAEnum

# example user profile in main db, to be expanded as we add to our central user profile
# NOTE: user maps to many hobbies

# ** by convention, ORM mapped tables should be named ___Table
class UserProfileTable(MainDB_Base):
    __tablename__ = "user_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete='CASCADE'),
        nullable=False,
        unique=True,
        index=True
    )
    gender: Mapped[str] = mapped_column(String,nullable = True)
    class_year: Mapped[ClassYear] = mapped_column(
        SAEnum(ClassYear, name="class_year_enum"),
        nullable = True
    )
    major: Mapped[str] = mapped_column(String,nullable = True)

    hobbies: Mapped[list[str]] = mapped_column(
        ARRAY(String),
        nullable=False,
        default=list,
    )

    profile_summary: Mapped[str] = mapped_column(String,nullable = True)