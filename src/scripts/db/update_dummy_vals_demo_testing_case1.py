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

Three test programs for graders:
1. "Jocelyn's Test Program" - Demo test program with 5 students
2. "Bob's Test Program" - Demo test program with 5 students
3. "Oyu's Test Program" - Demo test program with 5 students

- 5 student participants per event (Gary, Sungmin, Nadula, Jaden, DK)
- Each grader has separate student and org admin accounts:
  - Jocelyn: jw5134 (student), cs-jw5134 (org admin)
  - Bob: rdondero (student), cs-rdondero (org admin)
  - Oyu: oe7583 (student), cs-oe7583 (org admin)

NOTE: Reflects the grader's guide.

Intended pairings (all size 2, same for all three events):
1. Gary (BIG) + Nadula (LITTLE): Both Instagram users
2. Sungmin (BIG) + Grader (LITTLE): Both Facebook users (Grader simulated)
3. DK (BIG) + Jaden (LITTLE): Both TikTok users
"""

def create_user_data(session):
    """
    Create 11 users total:
    - Gary, Sungmin, Nadula, Jaden, DK (5 students)
    - Jocelyn (student account + org admin account)
    - Bob (student account + org admin account)
    - Oyu (student account + org admin account)
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
        # NOTE: id 6 -> Jocelyn student account
        UserTable(
            username="jw5134",
            first_name="Jocelyn",
            last_name="Wang",
            email="jw5134@princeton.edu"
        ),
        # NOTE: id 7 -> Jocelyn org admin account
        UserTable(
            username="cs-jw5134",
            first_name="Jocelyn 2",
            last_name="Wang",
            email="cs-jw5134@princeton.edu"
        ),
        # NOTE: id 8 -> Bob student account
        UserTable(
            username="rdondero",
            first_name="Bob",
            last_name="Dondero",
            email="rdondero@princeton.edu"
        ),
        # NOTE: id 9 -> Bob org admin account
        UserTable(
            username="cs-rdondero",
            first_name="Bob 2",
            last_name="Dondero",
            email="cs-rdondero@princeton.edu"
        ),
        # NOTE: id 10 -> Oyu student account
        UserTable(
            username="oe7583",
            first_name="Oyu",
            last_name="Enkhbold",
            email="oe7583@princeton.edu"
        ),
        # NOTE: id 11 -> Oyu org admin account
        UserTable(
            username="cs-oe7583",
            first_name="Oyu 2",
            last_name="Enkhbold",
            email="cs-oe7583@princeton.edu"
        )
    ]

    for user in users:
        session.add(user)
    session.commit()
    print("Dummy users added.")

def create_organization_data(session):
    """
    Create 5 organizations.
    - 2 for default testing (AASA, KSAP)
    - 3 for graders (Jocelyn, Bob, Oyu)
    """
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
        ),
        OrganizationTable(
            org_name="Bob's Test Org",
            description="Demo Test Org for Bob."
        ),
        OrganizationTable(
            org_name="Oyu's Test Org",
            description="Demo Test Org for Oyu."
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
    - Bob (cs-rdondero, user_id=9): owner of Bob's Test Org
    - Oyu (cs-oe7583, user_id=11): owner of Oyu's Test Org
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
        ),
        OrgAdminTable(
            user_id=9,  # bob - org admin account
            organization_id=4,  # Bob's Test Org
            is_owner=True
        ),
        OrgAdminTable(
            user_id=11,  # oyu - org admin account
            organization_id=5,  # Oyu's Test Org
            is_owner=True
        )
    ]

    for admin in org_admins:
        session.add(admin)
    session.commit()
    print("Dummy org admins added.")

def create_event_data(session):
    """
    Create 6 events:
    - 3 for default testing (AASA #1, AASA #2, KSAP)
    - 3 for graders (Jocelyn, Bob, Oyu)
    """
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
        ),
        EventTable(
            title="Bob's Test Program",
            description="Demo Test Program for Bob.",
            end_date=datetime.now() + timedelta(weeks=52),
            organization_id=4,
            status=EventStatus.STARTED,
            check_sibling_roles=True
        ),
        EventTable(
            title="Oyu's Test Program",
            description="Demo Test Program for Oyu.",
            end_date=datetime.now() + timedelta(weeks=52),
            organization_id=5,
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
    Register 5 students for all three demo test events (event_id=4, 5, 6).

    Participants (same for all three events):
    - Gary (BIG_SIBLING): Pizza, Instagram
    - Sungmin (BIG_SIBLING): Sushi, Facebook
    - Nadula (LITTLE_SIBLING): Hamburger, Instagram
    - Jaden (LITTLE_SIBLING): Pancakes, TikTok
    - DK (BIG_SIBLING): Waffles, TikTok
    """
    registrations = [
        # ===== JOCELYN'S TEST PROGRAM (event_id=4) =====
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
        ),

        # ===== BOB'S TEST PROGRAM (event_id=5) =====
        EventRegistrationsTable(
            user_id=1,  # gary
            event_id=5,
            role=EventRole.BIG_SIBLING,
            valid_registration=True,
            response_summary="Enjoys Pizza and Instagram."
        ),
        EventRegistrationsTable(
            user_id=2,  # sungmin
            event_id=5,
            role=EventRole.BIG_SIBLING,
            valid_registration=True,
            response_summary="Enjoys Sushi and Facebook."
        ),
        EventRegistrationsTable(
            user_id=3,  # nadula
            event_id=5,
            role=EventRole.LITTLE_SIBLING,
            valid_registration=True,
            response_summary="Enjoys Hamburger and Instagram."
        ),
        EventRegistrationsTable(
            user_id=4,  # jaden
            event_id=5,
            role=EventRole.LITTLE_SIBLING,
            valid_registration=True,
            response_summary="Enjoys Pancakes and TikTok."
        ),
        EventRegistrationsTable(
            user_id=5,  # dk
            event_id=5,
            role=EventRole.BIG_SIBLING,
            valid_registration=True,
            response_summary="Enjoys Waffles and TikTok."
        ),

        # ===== OYU'S TEST PROGRAM (event_id=6) =====
        EventRegistrationsTable(
            user_id=1,  # gary
            event_id=6,
            role=EventRole.BIG_SIBLING,
            valid_registration=True,
            response_summary="Enjoys Pizza and Instagram."
        ),
        EventRegistrationsTable(
            user_id=2,  # sungmin
            event_id=6,
            role=EventRole.BIG_SIBLING,
            valid_registration=True,
            response_summary="Enjoys Sushi and Facebook."
        ),
        EventRegistrationsTable(
            user_id=3,  # nadula
            event_id=6,
            role=EventRole.LITTLE_SIBLING,
            valid_registration=True,
            response_summary="Enjoys Hamburger and Instagram."
        ),
        EventRegistrationsTable(
            user_id=4,  # jaden
            event_id=6,
            role=EventRole.LITTLE_SIBLING,
            valid_registration=True,
            response_summary="Enjoys Pancakes and TikTok."
        ),
        EventRegistrationsTable(
            user_id=5,  # dk
            event_id=6,
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
    Create 2 questions for each demo test event (events 4, 5, 6):
    1. Text: What's your favorite food?
    2. Multiple choice: What's your favorite social media app?
    """
    questions = [
        # ===== JOCELYN'S TEST PROGRAM (event_id=4) =====
        QuestionTable(
            question="What's your favorite food?",
            event_id=4
        ),
        QuestionTable(
            question="What's your favorite social media app?",
            options=["Instagram", "Facebook", "TikTok", "Snapchat"],
            event_id=4
        ),

        # ===== BOB'S TEST PROGRAM (event_id=5) =====
        QuestionTable(
            question="What's your favorite food?",
            event_id=5
        ),
        QuestionTable(
            question="What's your favorite social media app?",
            options=["Instagram", "Facebook", "TikTok", "Snapchat"],
            event_id=5
        ),

        # ===== OYU'S TEST PROGRAM (event_id=6) =====
        QuestionTable(
            question="What's your favorite food?",
            event_id=6
        ),
        QuestionTable(
            question="What's your favorite social media app?",
            options=["Instagram", "Facebook", "TikTok", "Snapchat"],
            event_id=6
        )
    ]

    for question in questions:
        session.add(question)
    session.commit()
    print("Dummy questions added.")

def create_response_data(session):
    """
    Create responses for all 5 participants to enable clear pairings:

    Intended pairings (same for all three events):
    - Pair 1: Gary + Nadula (both Instagram)
    - Pair 2: Sungmin + Grader (both Facebook, Grader simulated)
    - Pair 3: DK + Jaden (both TikTok)
    """
    responses = [
        # ===== JOCELYN'S TEST PROGRAM (event_id=4, question_id=1,2) =====
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
        ResponseTable(user_id=5, question_id=2, answer="TikTok"),

        # ===== BOB'S TEST PROGRAM (event_id=5, question_id=3,4) =====
        # Gary's responses (BIG)
        ResponseTable(user_id=1, question_id=3, answer="Pizza"),
        ResponseTable(user_id=1, question_id=4, answer="Instagram"),

        # Sungmin's responses (BIG)
        ResponseTable(user_id=2, question_id=3, answer="Sushi"),
        ResponseTable(user_id=2, question_id=4, answer="Facebook"),

        # Nadula's responses (LITTLE) - matches Gary on Instagram
        ResponseTable(user_id=3, question_id=3, answer="Hamburger"),
        ResponseTable(user_id=3, question_id=4, answer="Instagram"),

        # Jaden's responses (LITTLE) - matches DK on TikTok
        ResponseTable(user_id=4, question_id=3, answer="Pancakes"),
        ResponseTable(user_id=4, question_id=4, answer="TikTok"),

        # DK's responses (BIG) - matches Jaden on TikTok
        ResponseTable(user_id=5, question_id=3, answer="Waffles"),
        ResponseTable(user_id=5, question_id=4, answer="TikTok"),

        # ===== OYU'S TEST PROGRAM (event_id=6, question_id=5,6) =====
        # Gary's responses (BIG)
        ResponseTable(user_id=1, question_id=5, answer="Pizza"),
        ResponseTable(user_id=1, question_id=6, answer="Instagram"),

        # Sungmin's responses (BIG)
        ResponseTable(user_id=2, question_id=5, answer="Sushi"),
        ResponseTable(user_id=2, question_id=6, answer="Facebook"),

        # Nadula's responses (LITTLE) - matches Gary on Instagram
        ResponseTable(user_id=3, question_id=5, answer="Hamburger"),
        ResponseTable(user_id=3, question_id=6, answer="Instagram"),

        # Jaden's responses (LITTLE) - matches DK on TikTok
        ResponseTable(user_id=4, question_id=5, answer="Pancakes"),
        ResponseTable(user_id=4, question_id=6, answer="TikTok"),

        # DK's responses (BIG) - matches Jaden on TikTok
        ResponseTable(user_id=5, question_id=5, answer="Waffles"),
        ResponseTable(user_id=5, question_id=6, answer="TikTok")
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
        CREATING DEMO CASE 1 DATA (11 USERS, 3 GRADER TEST PROGRAMS) IN 3 SEC...
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
