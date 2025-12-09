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

# NOTE: Demo Case 1 - Standardized Demo
"""
OVERVIEW:

Event: "Jocelyn's Test Program" - Demo test program with 6 students
- 6 student participants (Gary, Sungmin, Nadula, Jaden, DK, Jocelyn)
- Jocelyn has separate org admin account (cs-jw5134)

Intended pairings (all size 2):
1. Gary (BIG) + Nadula (LITTLE): Both Instagram users
2. Sungmin (BIG) + Jocelyn (LITTLE): Both Facebook users (Jocelyn simulated)
3. DK (BIG) + Jaden (LITTLE): Both TikTok users
"""

def create_user_data(session):
    """
    Create 7 users total:
    - Gary, Sungmin, Nadula, Jaden, DK (5 students)
    - Jocelyn (student account)
    - Jocelyn 2 (org admin account)
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
        ),
        # NOTE: id 6 -> student account
        UserTable(
            username="jw5134",
            first_name="Jocelyn",
            last_name="Wang",
            email="jw5134@princeton.edu"
        ),
        # NOTE: id 7 -> org admin account
        UserTable(
            username="cs-jw5134",
            first_name="Jocelyn 2",
            last_name="Wang",
            email="cs-jw5134@princeton.edu"
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
    Organization admin relationships for Case 1.

    - Gary, Sungmin, Nadula, Jaden, DK: admins of AASA and KSAP
    - Jocelyn (cs-jw5134, user_id=7): owner of Jocelyn's Test Org
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
        ),
        OrgAdminTable(
            user_id=7,  # jocelyn - org admin account
            organization_id=3,  # Jocelyn's Test Org
            is_owner=True
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
    Register 5 students for the demo test event (event_id=4).

    Participants:
    - Gary (BIG_SIBLING): Pizza, Instagram
    - Sungmin (BIG_SIBLING): Sushi, Facebook
    - Nadula (LITTLE_SIBLING): Hamburger, Instagram
    - Jaden (LITTLE_SIBLING): Pancakes, TikTok
    - DK (BIG_SIBLING): Waffles, TikTok
    """
    registrations = [
        EventRegistrationsTable(
            user_id=1,  # gary
            event_id=4,
            role=EventRole.BIG_SIBLING,
            valid_registration=True,
            response_summary="Enjoys Pizza and Instagram."
        ),
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
            response_summary="Enjoys Pancakes and TikTok."
        ),
        EventRegistrationsTable(
            user_id=5,  # dk
            event_id=4,
            role=EventRole.BIG_SIBLING,
            valid_registration=True,
            response_summary="Enjoys Waffles and TikTok."
        )
    ]

    for registration in registrations:
        session.add(registration)
    session.commit()
    print("Dummy event registrations added.")

def create_user_profile_data(session):
    """
    Create profiles for all 5 active student participants.
    Jocelyn (user_id=6) and org admin (user_id=7) don't have profiles.
    """
    profiles = [
        UserProfileTable(
            user_id=1,  # gary
            gender="Male",
            class_year=ClassYear.JUNIOR,
            major="Art",
            hobbies=["Graphic Design", "Art", "Painting", "Drawing"]
        ),
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
    Create responses for all 5 participants to enable clear pairings:

    Pair 1: Gary + Nadula (both Instagram)
    Pair 2: Sungmin + Jocelyn (both Facebook, Jocelyn simulated)
    Pair 3: DK + Jaden (both TikTok)
    """
    responses = [
        # Gary's responses (BIG)
        ResponseTable(user_id=1, question_id=1, answer="Pizza"),
        ResponseTable(user_id=1, question_id=2, answer="Instagram"),

        # Sungmin's responses (BIG)
        ResponseTable(user_id=2, question_id=1, answer="Sushi"),
        ResponseTable(user_id=2, question_id=2, answer="Facebook"),

        # Nadula's responses (LITTLE) - matches Gary on Instagram
        ResponseTable(user_id=3, question_id=1, answer="Hamburger"),
        ResponseTable(user_id=3, question_id=2, answer="Instagram"),

        # Jaden's responses (LITTLE) - matches DK on TikTok
        ResponseTable(user_id=4, question_id=1, answer="Pancakes"),
        ResponseTable(user_id=4, question_id=2, answer="TikTok"),

        # DK's responses (BIG) - matches Jaden on TikTok
        ResponseTable(user_id=5, question_id=1, answer="Waffles"),
        ResponseTable(user_id=5, question_id=2, answer="TikTok")
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
        CREATING DEMO CASE 1 DATA (6 STUDENTS) IN 3 SEC...
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

    print("Demo Case 1 data created successfully!")


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
