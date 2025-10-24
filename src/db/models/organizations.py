from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Index
from sqlalchemy.orm import mapped_column, relationship, Mapped
from sqlalchemy.dialects.postgresql import ARRAY
from .base import MainDB_Base
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload




class Organization(MainDB_Base):
    __tablename__ = "organizations"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True)

    orgname: Mapped[str] = mapped_column(String, nullable=False)
    
    description: Mapped[str] = mapped_column(String, nullable=False)

    


