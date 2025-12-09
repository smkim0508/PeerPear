from datetime import datetime, time, timedelta
from requests import Session
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import time
import os

from db import session
from db.models.events import EventTable, EventRegistrationsTable
from db.models.organizations import OrganizationTable
from db.models.user import UserTable
from db.models.user_profile import UserProfileTable
from db.models.question import QuestionTable
from db.models.response import ResponseTable
from db.models.orgadmin import OrgAdminTable
from db.models.orgadmin_requests import OrgAdminRequestTable

from common.types.event_enums import EventStatus, EventRole
from common.types.user import ClassYear

# NOTE: Demo Case 2 - Sungmin as Org Admin
"""
OVERVIEW:

Event: "Jocelyn's Test Program" - Demo test program with 3 registered students
- 3 student participants (Sungmin, Nadula, Jaden) registered for event
- Gary and DK exist in DB but not registered
- Sungmin is org admin simulating Jocelyn's role

Intended pairings (all size 2):
1. Sungmin (BIG) + Jaden (LITTLE): Both Facebook users, similar food preferences (Sushi/Sashimi)
2. Nadula (LITTLE): Unmatched (only 3 registered, 1 big + 2 littles)

Note: Gary doesn't have a user profile in this case
"""

def create_user_data(session):
    """
    Create 5 users total:
    - Gary, Sungmin, Nadula, Jaden, DK

    Note: No Jocelyn accounts in this case
    """
    users = [
        UserTable(
            username="gy4937",
            first_name="Gary",
            last_name="Yang",
            email="gy4937@princeton.edu"
        ),
        UserTable(
            username="sk3378",
            first_name="Sungmin",
            last_name="Kim",
            email="sk3378@prineton.edu",
        ),
        UserTable(
            username="ng3922",
            first_name="Nadula",
            last_name="Gardiyehewa",
            email="ng3922@princeton.edu"
        ),
        UserTable(
            username="jc3311",
            first_name="Jaden",
            last_name="Cutinha",
            email="jc3311@princeton.edu"
        ),
        UserTable(
            username="dl2635",
            first_name="Dongkon",
            last_name="Lee",
            email="dl2635@princeton.edu"
        )
    ]

    for user in users:
        session.add(user)
    session.commit()
    print("Dummy users added.")

def create_organization_data(session):
    """Create 3 organizations"""
    organizations = [
        OrganizationTable(
            org_name="AASA",
            description="Asian American Student Association"
        ),
        OrganizationTable(
            org_name="KSAP",
            description="Korean Student Association"
        ),
        OrganizationTable(
            org_name="Jocelyn's Test Org",
            description="Demo Test Org for Jocelyn."
        )
    ]

    for org in organizations:
        session.add(org)
    session.commit()
    print("Dummy organizations added.")

def create_orgadmin_data(session):
    """
    Organization admin relationships for Case 2.

    - Gary, Sungmin, Nadula, Jaden, DK: admins of AASA and KSAP
    - Sungmin (user_id=2): owner of Jocelyn's Test Org (simulating Jocelyn's role)
    """
    org_admins = [
        OrgAdminTable(
            user_id=1,  # gary
            organization_id=1,  # AASA
            is_owner=True
        ),
        OrgAdminTable(
            user_id=1,  # gary
            organization_id=2  # KSAP
        ),
        OrgAdminTable(
            user_id=2,  # sungmin
            organization_id=1,  # AASA
            is_owner=True
        ),
        OrgAdminTable(
            user_id=2,  # sungmin
            organization_id=2,  # KSAP
            is_owner=True
        ),
        OrgAdminTable(
            user_id=2,  # sungmin
            organization_id=3,  # Jocelyn's Test Org (Sungmin simulates demo org owner)
            is_owner=True
        ),
        OrgAdminTable(
            user_id=3,  # nadula
            organization_id=1  # AASA
        ),
        OrgAdminTable(
            user_id=3,  # nadula
            organization_id=2  # KSAP
        ),
        OrgAdminTable(
            user_id=4,  # jaden
            organization_id=1  # AASA
        ),
        OrgAdminTable(
            user_id=4,  # jaden
            organization_id=2  # KSAP
        ),
        OrgAdminTable(
            user_id=5,  # dk
            organization_id=1  # AASA
        ),
        OrgAdminTable(
            user_id=5,  # dk
            organization_id=2  # KSAP
        )
    ]

    for admin in org_admins:
        session.add(admin)
    session.commit()
    print("Dummy org admins added.")

def create_event_data(session):
    """Create 4 events"""
    events = [
        EventTable(
            title="Asian American Students Big Little Family",
            description="This is a big little family pairing for new members of the Asian American Students Association.",
            end_date=datetime.now() + timedelta(weeks=52),
            organization_id=1,
            status=EventStatus.STARTED,
            check_sibling_roles=True
        ),
        EventTable(
            title="Asian American Students Big Little Family Program",
            description="This is a big little family pairing for new members of the Asian American Students Association.",
            end_date=datetime.now() + timedelta(weeks=52),
            organization_id=1,
            status=EventStatus.STARTED,
            check_sibling_roles=True
        ),
        EventTable(
            title="Korean Students Big Little Gajok Program",
            description="This is a big little family pairing for new members of the Korean Students Association of Princeton.",
            end_date=datetime.now() + timedelta(weeks=52),
            organization_id=2,
            status=EventStatus.STARTED,
            check_sibling_roles=True
        ),
        EventTable(
            title="Jocelyn's Test Program",
            description="Demo Test Program for Jocelyn.",
            end_date=datetime.now() + timedelta(weeks=52),
            organization_id=3,
            status=EventStatus.STARTED,
            check_sibling_roles=True
        )
    ]
    for event in events:
        session.add(event)
    session.commit()
    print("Dummy events added.")

def create_event_registration_data(session):
    """
    Register 3 students for the demo test event (event_id=4).

    Participants:
    - Sungmin (BIG_SIBLING): Sushi, Facebook
    - Nadula (LITTLE_SIBLING): Hamburger, Instagram
    - Jaden (LITTLE_SIBLING): Sashimi, Facebook (matches Sungmin)

    Note: Gary and DK are NOT registered
    """
    registrations = [
        EventRegistrationsTable(
            user_id=2,  # sungmin
            event_id=4,
            role=EventRole.BIG_SIBLING,
            valid_registration=True,
            response_summary="Enjoys Sushi and Facebook."
        ),
        EventRegistrationsTable(
            user_id=3,  # nadula
            event_id=4,
            role=EventRole.LITTLE_SIBLING,
            valid_registration=True,
            response_summary="Enjoys Hamburger and Instagram."
        ),
        EventRegistrationsTable(
            user_id=4,  # jaden
            event_id=4,
            role=EventRole.LITTLE_SIBLING,
            valid_registration=True,
            response_summary="Enjoys Sashimi and Facebook."
        )
    ]

    for registration in registrations:
        session.add(registration)
    session.commit()
    print("Dummy event registrations added.")

def create_user_profile_data(session):
    """
    Create profiles for 4 students.

    Note: Gary (user_id=1) does NOT have a profile in Case 2
    """
    profiles = [
        UserProfileTable(
            user_id=2,  # sungmin
            gender="Male",
            class_year=ClassYear.JUNIOR,
            major="Computer Engineering",
            hobbies=["Machine Learning", "Large Language Models", "Coding", "AI"]
        ),
        UserProfileTable(
            user_id=3,  # nadula
            gender="Male",
            class_year=ClassYear.SOPHOMORE,
            major="Design",
            hobbies=["Graphic Design", "Typography", "Product Design"]
        ),
        UserProfileTable(
            user_id=4,  # jaden
            gender="Male",
            class_year=ClassYear.SOPHOMORE,
            major="Computer Science",
            hobbies=["Basketball", "Coding Competitions", "Football", "Computer Architecture"]
        ),
        UserProfileTable(
            user_id=5,  # dk
            gender="Male",
            class_year=ClassYear.JUNIOR,
            major="Economics",
            hobbies=["Basketball", "Scooter", "Sports Racing", "Soccer"]
        )
    ]

    for profile in profiles:
        session.add(profile)
    session.commit()
    print("Dummy user profiles added.")

def create_question_data(session):
    """
    Create 2 questions for the demo test event:
    1. Text: What's your favorite food?
    2. Multiple choice: What's your favorite social media app?
    """
    questions = [
        QuestionTable(
            question="What's your favorite food?",
            event_id=4
        ),
        QuestionTable(
            question="What's your favorite social media app?",
            options=["Instagram", "Facebook", "TikTok", "Snapchat"],
            event_id=4
        )
    ]

    for question in questions:
        session.add(question)
    session.commit()
    print("Dummy questions added.")

def create_response_data(session):
    """
    Create responses for the 3 registered participants:

    Intended pairing:
    - Sungmin (Sushi, Facebook) + Jaden (Sashimi, Facebook): aligned on Facebook and similar food
    - Nadula (Hamburger, Instagram): unmatched (only 1 big + 2 littles)
    """
    responses = [
        # Sungmin's responses (BIG)
        ResponseTable(user_id=2, question_id=1, answer="Sushi"),
        ResponseTable(user_id=2, question_id=2, answer="Facebook"),

        # Nadula's responses (LITTLE)
        ResponseTable(user_id=3, question_id=1, answer="Hamburger"),
        ResponseTable(user_id=3, question_id=2, answer="Instagram"),

        # Jaden's responses (LITTLE) - matches Sungmin on Facebook
        ResponseTable(user_id=4, question_id=1, answer="Sashimi"),
        ResponseTable(user_id=4, question_id=2, answer="Facebook")
    ]

    for response in responses:
        session.add(response)
    session.commit()
    print("Dummy responses added.")

def fill_all_tables(engine):
    """Execute all data creation functions in correct order"""
    Session = sessionmaker(bind=engine)
    session = Session()

    # Warn users before committing
    print(
        f"""
        CREATING DEMO CASE 2 DATA (4 STUDENTS, SUNGMIN AS ADMIN) IN 3 SEC...
        PLEASE ABORT NOW IF YOU'D LIKE TO STOP!!!
        """
    )
    time.sleep(3)

    # Create data in correct dependency order
    create_user_data(session)
    create_user_profile_data(session)
    create_organization_data(session)
    create_orgadmin_data(session)
    create_event_data(session)
    create_event_registration_data(session)
    create_question_data(session)
    create_response_data(session)

    print("Demo Case 2 data created successfully!")


if __name__ == "__main__":
    load_dotenv()
    MAIN_DB_USER = os.getenv("MAIN_DB_USER")
    MAIN_DB_PASSWORD = os.getenv("MAIN_DB_PASSWORD")
    MAIN_DB_HOST = os.getenv("MAIN_DB_HOST")
    MAIN_DB_PORT = os.getenv("MAIN_DB_PORT")
    MAIN_DB_NAME = os.getenv("MAIN_DB_NAME")

    MAIN_DB_URL = f"postgresql+psycopg2://{MAIN_DB_USER}:{MAIN_DB_PASSWORD}@{MAIN_DB_HOST}:{MAIN_DB_PORT}/{MAIN_DB_NAME}?sslmode=require"

    assert MAIN_DB_URL, "MAIN_DB_URL is not set"

    try:
        engine = create_engine(MAIN_DB_URL)
    except Exception as e:
        print(f"Error connecting to database: {e}")
        exit(1)

    fill_all_tables(engine)
