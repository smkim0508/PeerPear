from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Index
from sqlalchemy.orm import mapped_column, relationship, Mapped
from sqlalchemy.dialects.postgresql import ARRAY
from .base import MainDB_Base
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload




class OrgAdmin(MainDB_Base):
    __tablename__ = "orgadmins"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True)

    username: Mapped[str] = mapped_column(String, nullable=False)
    first_name: Mapped[str] = mapped_column(String, nullable=False)
    last_name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False)
    
    organization_id: Mapped[int] = mapped_column(ForeignKey("organizations.id"),nullable = False, unique = True)
 