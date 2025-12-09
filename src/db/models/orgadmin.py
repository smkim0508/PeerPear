from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Index
from sqlalchemy.orm import mapped_column, relationship, Mapped
from sqlalchemy.dialects.postgresql import ARRAY
from .base import MainDB_Base
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload

class OrgAdminTable(MainDB_Base):
    __tablename__ = "orgadmins"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete='CASCADE'),
        nullable=False,
        index=True
    )
    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id", ondelete='CASCADE'),
        nullable=False,
        index=True
    )

    is_owner: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false", # since supabase has defaults too
    )

    # Composite index for faster lookups by user+org combination
    __table_args__ = (
        Index('ix_orgadmins_user_org', 'user_id', 'organization_id'),
    )
 