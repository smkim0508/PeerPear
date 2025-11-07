from db.models.organizations import Organization
from sqlalchemy import select
from api.dependencies import get_db_session
from sqlalchemy.exc import SQLAlchemyError


def get_organization_profile(organization_id: int) -> Organization | None:
    db_session = get_db_session()

    stmt = select(Organization).where(Organization.id == organization_id)
    result = db_session.execute(stmt).scalar_one_or_none() 
    return result


def update_organization_profile(data: dict) -> str:
    organization_id = data.get("organization_id")
    if not organization_id:
        return "error: missing organization_id"

    db_session = get_db_session()
    org = get_organization_profile(organization_id)

    if not org:
        return "onf"

    new_name = data.get("org_name")
    new_description = data.get("description")

    if new_name:
        org.org_name = new_name
    if new_description:
        org.description = new_description

    try:
        db_session.commit()
        return "success"
    except SQLAlchemyError as e:
        db_session.rollback()
        return f"error: {str(e)}"
