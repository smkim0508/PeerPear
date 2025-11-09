from db.models.organizations import Organization
from sqlalchemy import select
from api.dependencies import get_db_sessionmaker
from sqlalchemy.exc import SQLAlchemyError
from typing import Optional
from common.types.db_status import DBStatus

def get_organization_profile(organization_id: int) -> Optional[Organization]:
    db_session = get_db_sessionmaker()

    stmt = select(Organization).where(Organization.id == organization_id)
    
    with db_session() as session: 
        result = db_session.execute(stmt).scalar_one_or_none() 

    return result

def update_organization_profile(data: dict) -> Optional[str]:
    organization_id = data.get("organization_id")
    if not organization_id:
        return "error: missing organization_id"

    db_session = get_db_sessionmaker()

    org_stmt = select(Organization).where(Organization.id == organization_id)

    # handle organization profile within one SA session
    with db_session() as session: 
        org_profile = session.execute(org_stmt).scalar_one_or_none() 

        if not org_profile:
            return None # NOTE: signals organization not found.
    
        new_name = data.get("org_name")
        new_description = data.get("description")

        if new_name:
            org_profile.org_name = new_name
        if new_description:
            org_profile.description = new_description

        try:
            session.commit()
            return DBStatus.SUCCESS.value
        except SQLAlchemyError as e:
            session.rollback()
            return f"error: {str(e)}"
