from sqlalchemy import select, not_, and_, func
from api.dependencies import get_db_sessionmaker
from db.models.organizations import OrganizationTable
from db.models.orgadmin import OrgAdminTable
from db.models.user import UserTable
from db.models.orgadmin_requests import OrgAdminRequestTable
from common.types.organization import OrganizationProfile
from common.types.organization import AdminProfile

# helper function to verify owner access


def verify_org_owner_access(user_id: int, organization_id: int):
    db_session = get_db_sessionmaker()

    with db_session() as session_instance:
        owner = session_instance.scalar(
            select(OrgAdminTable).where(
                OrgAdminTable.user_id == user_id,
                OrgAdminTable.organization_id == organization_id,
                OrgAdminTable.is_owner == True,
            )
        )

        if owner is None:
            return {"error": "Org owner not found", "status": 403}

        return {"message": "Owner access verified", "status": 200}


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
                not_(OrganizationTable.id.in_(admin_already)),
                not_(OrganizationTable.id.in_(request_already))
            )
            .all()
        )

        return [OrganizationProfile(
            id=org.id,
            org_name=org.org_name,
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
        stmt = (
            select(
                OrgAdminRequestTable.id,
                OrgAdminRequestTable.user_id,
                UserTable.first_name,
                UserTable.last_name,
                UserTable.email,
            )
            .join(UserTable, UserTable.id == OrgAdminRequestTable.user_id)
            .where(OrgAdminRequestTable.organization_id == organization_id)
        )

        rows = session_instance.execute(stmt).all()

        # Return list of objects (or dicts)
        requests = []
        for row in rows:
            request_id, user_id, first_name, last_name, email = row
            requests.append({
                "id": request_id,
                "user_id": user_id,
                "first_name": first_name,
                "last_name": last_name,
                "email": email,
            })

        return requests


def accept_request(request_id: int):
    db_session = get_db_sessionmaker()

    with db_session() as session_instance:

        request = session_instance.get(OrgAdminRequestTable, request_id)

        if not request:
            return {"error": "No request exists", "status": 404}

        existing_admin = session_instance.scalar(
            select(OrgAdminTable).where(
                and_(
                    OrgAdminTable.user_id == request.user_id,
                    OrgAdminTable.organization_id == request.organization_id
                )
            )
        )

        if existing_admin:
            return {"error": "User is already an admin of the organization", "status": 404}

        new_admin = OrgAdminTable(
            user_id=request.user_id,
            organization_id=request.organization_id,
            is_owner=False,
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
            return {"error": "No request exists", "status": 404}

        session_instance.delete(request)
        session_instance.commit()

        return {"message": "Request rejected"}


def get_admins_for_org(organization_id: int) -> list[AdminProfile]:
    db_session = get_db_sessionmaker()

    with db_session() as session_instance:
        stmt = (
            select(
                OrgAdminTable.user_id,
                OrgAdminTable.is_owner,
                UserTable.first_name,
                UserTable.last_name,
                UserTable.email,
            )
            .select_from(OrgAdminTable)
            .join(UserTable, UserTable.id == OrgAdminTable.user_id)
            .where(OrgAdminTable.organization_id == organization_id)
        )

        rows = session_instance.execute(stmt).all()

        admins = []
        for row in rows:
            user_id, is_owner, first_name, last_name, email = row
            admins.append(AdminProfile(
                id=user_id,
                first_name=first_name,
                last_name=last_name,
                owner=is_owner,
                email=email
            ))

        return admins


def promote_admin_to_owner(target_user_id: int, organization_id: int):
    db_session = get_db_sessionmaker()

    with db_session() as session_instance:

        # Fetch admin entry
        admin_entry = session_instance.scalar(
            select(OrgAdminTable).where(
                and_(
                    OrgAdminTable.user_id == target_user_id,
                    OrgAdminTable.organization_id == organization_id
                )
            )
        )

        if not admin_entry:
            return {"error": "User is not an admin of this organization", "status": 404}

        if admin_entry.is_owner:
            return {"error": "User is already an owner", "status": 400}

        # Promote
        admin_entry.is_owner = True
        session_instance.commit()
        session_instance.refresh(admin_entry)

        return {"message": "User promoted to owner successfully"}


def remove_admin_from_org(target_user_id: int, organization_id: int):
    db_session = get_db_sessionmaker()

    with db_session() as session_instance:

        # Fetch admin row
        admin_entry = session_instance.scalar(
            select(OrgAdminTable).where(
                and_(
                    OrgAdminTable.user_id == target_user_id,
                    OrgAdminTable.organization_id == organization_id
                )
            )
        )

        if not admin_entry:
            return {"error": "User is not an admin of this organization", "status": 404}

        # If the admin is an OWNER, check if they’re the last owner
        if admin_entry.is_owner:
            return {
                "error": "Cannot remove an owner.",
                "status": 400
            }

            if owner_count <= 1:
                return {
                    "error": "Cannot remove the last remaining owner of the organization",
                    "status": 400
                }

        # Perform deletion
        session_instance.delete(admin_entry)
        session_instance.commit()

        return {"message": "Admin removed successfully"}


def leave_organization(user_id: int, organization_id: int):
    db_session = get_db_sessionmaker()

    with db_session() as session_instance:

        admin_entry = session_instance.scalar(
            select(OrgAdminTable).where(
                and_(
                    OrgAdminTable.user_id == user_id,
                    OrgAdminTable.organization_id == organization_id
                )
            )
        )

        if not admin_entry:
            return {"error": "User is not an admin of this organization", "status": 404}

        # If owner, ensure they're not the last one
        if admin_entry.is_owner:
            owner_count = session_instance.scalar(
                select(func.count())
                .select_from(OrgAdminTable)
                .where(
                    and_(
                        OrgAdminTable.organization_id == organization_id,
                        OrgAdminTable.is_owner == True
                    )
                )
            )

            if owner_count <= 1:
                return {
                    "error": "You are the last owner. Transfer ownership before leaving.",
                    "status": 400
                }

        # Safe to leave
        session_instance.delete(admin_entry)
        session_instance.commit()

        return {"message": "Successfully left organization"}
