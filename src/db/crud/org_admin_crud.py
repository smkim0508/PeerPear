from sqlalchemy import select, not_, and_
from api.dependencies import get_db_sessionmaker
from db.models.organizations import OrganizationTable
from db.models.orgadmin import OrgAdminTable
from db.models.orgadmin_requests import OrgAdminRequestTable
from common.types.organization import OrganizationProfile


def get_request_table(user_id: int) -> list[OrganizationProfile]:
    db_session = get_db_sessionmaker()

    with db_session() as session_instance:

        admin_already = select(
            OrgAdminTable.organization_id
        ).where(
            OrgAdminTable.user_id == user_id
        )

        request_already = select(
            OrgAdminRequestTable.organization_id
        ).where(
            OrgAdminRequestTable.user_id == user_id
        )

        organizations = (
            session_instance.query(
                OrganizationTable
            ).filter(
                not (OrganizationTable.id.in_(admin_already),
                     not (OrganizationTable.id.in_(request_already))
                     )
            )
            .all()
        )

        return [OrganizationProfile(
            id=org.id,
            org_name=org.name,
            description=org.description

        ) for org in organizations]


def create_org_admin_request(user_id: int, organization_id: int):
    db_session = get_db_sessionmaker()

    with db_session() as session_instance:

        existing_admin = session_instance.scalar(
            select(OrgAdminTable).where(
                and_(
                    OrgAdminTable.user_id == user_id,
                    OrgAdminTable.organization_id == organization_id
                )
            )
        )

        if existing_admin:
            return None, {"error": "User is already an admin for this organization"}

        existing_request = session_instance.scalar(
            select(OrgAdminRequestTable).where(
                and_(
                    OrgAdminRequestTable.user_id == user_id,
                    OrgAdminRequestTable.organization_id == organization_id
                )
            )
        )

        if existing_request:
            return None, {"error": "There is already a pending request for this organization"}
        req = OrgAdminRequestTable(
            user_id=user_id,
            organization_id=organization_id
        )

        session_instance.add(req)
        session_instance.commit()
        session_instance.refresh(req)
        return req, None


def admin_requests_for_org(organization_id: int):
    db_session = get_db_sessionmaker()

    with db_session() as session_instance:

        rows = session_instance.scalars(select(OrgAdminRequestTable).where(
            OrgAdminRequestTable.organization_id == organization_id
        )).all()

        return rows


def accept_request(request_id: int):
    db_session = get_db_sessionmaker()

    with db_session() as session_instance:

        request = session_instance.get(OrgAdminRequestTable, request_id)

        if not request:
            return {"error": "No request exists", "status": "404"}

        existing_admin = session_instance.scalar(
            select(OrgAdminTable).where(
                and_(
                    OrgAdminTable.user_id == request.user_id,
                    OrgAdminTable.organization_id == request.organization_id
                )
            )
        )

        if existing_admin:
            return {"error": "User is already an admin of the organization", "status": "404"}

        new_admin = OrgAdminTable(
            user_id=request.user_id,
            organization_id=request.organization_id
        )
        session_instance.add(new_admin)

        # Remove request (only active requests exist)
        session_instance.delete(request)
        session_instance.commit()

        return {"message": "Request approved"}


def reject_request(request_id: int):
    db_session = get_db_sessionmaker()

    with db_session() as session_instance:

        request = session_instance.get(OrgAdminRequestTable, request_id)

        if not request:
            return {"error": "No request exists", "status": "404"}

        session_instance.delete(request)
        session_instance.commit()

        return {"message": "Request rejected"}
