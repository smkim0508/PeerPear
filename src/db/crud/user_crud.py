from sqlalchemy import select
from db.models.user import UserTable
from api.dependencies import get_db_sessionmaker
from typing import Optional


def get_user_by_username(username: str) -> Optional[UserTable]:
    """Get a user by their username."""
    db_session = get_db_sessionmaker()
    
    stmt = select(UserTable).where(UserTable.username == username)

    with db_session() as session:
        result = session.execute(stmt).scalar_one_or_none()
    
    return result

def get_user_by_id(user_id: int) -> Optional[UserTable]:
    """Get a user by their ID."""
    db_session = get_db_sessionmaker()
    
    stmt = select(UserTable).where(UserTable.id == user_id)

    with db_session() as session:
        result = session.execute(stmt).scalar_one_or_none()
    
    return result

def create_user(username: str, first_name: str, last_name: str, email: str, phone_number: Optional[str] = None) -> UserTable:
    """Create a new user in the database."""
    db_session = get_db_sessionmaker()
    
    new_user = UserTable(
        username=username,
        first_name=first_name,
        last_name=last_name,
        email=email,
        phone_number=phone_number,
        events=[]  # Initialize with empty events array
    )
    
    with db_session() as session:
        session.add(new_user)
        session.commit()
        session.refresh(new_user)
        return new_user

def get_or_create_user(username: str, first_name: str, last_name: str, email: str, phone_number: Optional[str] = None) -> UserTable:
    """Get existing user or create a new one if they don't exist."""
    existing_user = get_user_by_username(username)
    
    if existing_user:
        return existing_user
    
    # if user doesn't exist, create new one
    return create_user(username, first_name, last_name, email, phone_number)
