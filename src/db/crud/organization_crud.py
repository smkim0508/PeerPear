from db.models.organizations import OrganizationTable
from db.models.orgadmin import OrgAdminTable
from db.models.user import UserTable
from sqlalchemy import inspect, select, or_
from api.dependencies import get_db_sessionmaker
from flask import request, jsonify
from common.utils.dto_orm_conversion import dto_to_orm, orm_to_dto
from common.types.organization import OrganizationProfile, OrgAdminResponse


def get_user_organizations(user_id: int) -> list[OrganizationProfile]:
    db_session = get_db_sessionmaker()

    with db_session() as session_instance:

        stmt = (
            select(OrganizationTable)
            .join(
                OrgAdminTable,
                OrganizationTable.id == OrgAdminTable.organization_id
            )
            .where(OrgAdminTable.user_id == user_id)
        )

        rows = session_instance.scalars(stmt).all()

        organizations: list[OrganizationProfile] = []

        for org in rows:
            organizations.append(OrganizationProfile(
                id=org.id, org_name=org.org_name, description=org.description))

        return organizations


def verify_org_access(user_id: int, organization_id: int):
    db_session = get_db_sessionmaker()

    with db_session() as session_instance:
        org_admin = session_instance.scalar(
            select(OrgAdminTable).where(OrgAdminTable.user_id == user_id).where(
                OrgAdminTable.organization_id == organization_id)
        )

        if org_admin is None:
            return {"error": "Org Admin not found", "status": 404}
        return {"message": "Access to this organization is verified", "status": 200}
