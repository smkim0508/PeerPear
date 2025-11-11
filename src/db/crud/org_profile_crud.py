from db.models.organizations import OrganizationTable
from sqlalchemy import select
from api.dependencies import get_db_sessionmaker
from sqlalchemy.exc import SQLAlchemyError
from typing import Optional
from common.types.db_status import DBStatus
from common.types.organization import OrganizationProfile

def get_organization_profile(organization_id: int) -> Optional[OrganizationProfile]:
    db_session = get_db_sessionmaker()

    stmt = select(OrganizationTable).where(OrganizationTable.id == organization_id)
    
    with db_session() as session: 
        result = session.execute(stmt).scalar_one_or_none() 

        if result is None:
            return None
    
        org_profile = OrganizationProfile(
            id=result.id,
            org_name=result.org_name,
            description=result.description
        )

        return org_profile

def update_organization_profile(new_profile: OrganizationProfile) -> Optional[str]:

    db_session = get_db_sessionmaker()

    org_stmt = select(OrganizationTable).where(OrganizationTable.id == new_profile.id)

    # handle organization profile within one SA session
    with db_session() as session: 
        org_profile = session.execute(org_stmt).scalar_one_or_none() 

        if not org_profile:
            return None # NOTE: signals organization not found.

        new_name = new_profile.org_name
        new_description = new_profile.description

        # only updates fields that were passed in, via SQLAlchemy ORM
        if new_name:
            org_profile.org_name = new_name
        if new_description:
            org_profile.description = new_description

        try:
            session.commit()
            return DBStatus.SUCCESS.value
        except SQLAlchemyError as e:
            session.rollback()
            return str(e) # returns error message, to be handled in parent caller
