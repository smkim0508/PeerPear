from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Index, UniqueConstraint
from sqlalchemy.orm import mapped_column, relationship, Mapped
from sqlalchemy.dialects.postgresql import ARRAY
from .base import MainDB_Base
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload

class OrgAdminRequestTable(MainDB_Base):
    __tablename__ = "org_admin_requests"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True)

    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "organization_id", name="uq_user_org_request"),
    )
