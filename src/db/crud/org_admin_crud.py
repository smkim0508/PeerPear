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
