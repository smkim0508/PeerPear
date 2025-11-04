from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Index
from sqlalchemy.orm import mapped_column, relationship, Mapped
from sqlalchemy.dialects.postgresql import ARRAY
from .base import MainDB_Base
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload

# example user profile in main db, to be expanded as we add to our central user profile
# NOTE: user maps to many hobbies

# ** by convention, ORM mapped tables should be named ___Table
class UserProfileTable(MainDB_Base):
    __tablename__ = "user_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"),nullable = False, unique = True)
    gender: Mapped[str] = mapped_column(String,nullable = True)
    class_year: Mapped[int] = mapped_column(Integer,nullable = False)
    major: Mapped[str] = mapped_column(String,nullable = False)

    hobbies: Mapped[list[str]] = mapped_column(
        ARRAY(String),
        nullable=False,
        default=list,
    )