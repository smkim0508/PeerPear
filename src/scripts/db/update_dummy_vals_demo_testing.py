"""
DEPRECATED: This file has been split into separate case files for better organization.

Please use the following files instead:
- update_dummy_vals_demo_testing_case1.py for DEMO_CASE 1 (6 students with Jocelyn)
- update_dummy_vals_demo_testing_case2.py for DEMO_CASE 2 (4 students with Sungmin as admin)
- update_dummy_vals_demo_testing_case3.py for DEMO_CASE 3 (Kung Fu Tea Pairing, 8 students)

The reset_db.py script now automatically selects the appropriate case file based on the DEMO_CASE environment variable.
"""

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

# NOTE: dummy vals for standardized demos
"""
OVERVIEW:

A. The intended pairings are:

Case 1, (6 students)
gary - nadula
sungmin - jocelyn
dk - jaden

Case 2, (4 students)
gary - nadula
sungmin - jaden
------

B. Simulating in absence of Jocelyn:
- Gary is student version of Jocelyn
- Sungmin is admin owner version of Jocelyn
------

C. Toggle between the two demo cases with the following environmental variable:
`DEMO_CASE=1`: Case 1
`DEMO_CASE=2`: Case 2
"""

# fetch the demo case, default 1 (6 students) 
DEMO_CASE = str(os.getenv("DEMO_CASE", 1))

def create_user_data(session):
    """
    Create user accounts for demo testing.

    DEMO_CASE 1: 6 students + Jocelyn's org admin account
    DEMO_CASE 2: 4 students (no Gary, no DK, Sungmin is org admin)
    """
    if DEMO_CASE == "1":
        # DEMO_CASE 1: 6 students with Jocelyn
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
    else:  # DEMO_CASE == "2"
        # DEMO_CASE 2: 4 students (no Gary, no DK, Sungmin acts as org admin)
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
    organizations = [
        OrganizationTable( # org id 1
            org_name="AASA",
            description="Asian American Student Association"
        ),
        OrganizationTable( # org id 2
            org_name="KSAP",
            description="Korean Student Association"
        ),
        OrganizationTable( # org id 3
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
    Create organization admin relationships.

    DEMO_CASE 1: Jocelyn (user_id=7) owns the demo org (org_id=3)
    DEMO_CASE 2: Sungmin (user_id=2) owns the demo org (org_id=3)
    """
    if DEMO_CASE == "1":
        # DEMO_CASE 1: Jocelyn owns the demo org
        org_admins = [
            OrgAdminTable(
                user_id=1, # gary
                organization_id=1, # AASA
                is_owner=True
            ),
            OrgAdminTable(
                user_id=1, # gary
                organization_id=2 # KSAP
            ),
            OrgAdminTable(
                user_id=2, # sungmin
                organization_id=1, # AASA
                is_owner=True
            ),
            OrgAdminTable(
                user_id=2, # sungmin
                organization_id=2, # KSAP
                is_owner=True
            ),
            OrgAdminTable(
                user_id=3, # nadula
                organization_id=1 # AASA
            ),
            OrgAdminTable(
                user_id=3, # nadula
                organization_id=2 # KSAP
            ),
            OrgAdminTable(
                user_id=4, # jaden
                organization_id=1 # AASA
            ),
            OrgAdminTable(
                user_id=4, # jaden
                organization_id=2 # KSAP
            ),
            OrgAdminTable(
                user_id=5, # dk
                organization_id=1 # AASA
            ),
            OrgAdminTable(
                user_id=5, # dk
                organization_id=2 # KSAP
            ),
            OrgAdminTable(
                user_id=7, # jocelyn - org admin account
                organization_id=3, # Jocelyn's Test Org
                is_owner=True
            )
        ]
    else:  # DEMO_CASE == "2"
        # DEMO_CASE 2: Sungmin owns the demo org (simulating Jocelyn's role)
        org_admins = [
            OrgAdminTable(
                user_id=1, # gary
                organization_id=1, # AASA
                is_owner=True
            ),
            OrgAdminTable(
                user_id=1, # gary
                organization_id=2 # KSAP
            ),
            OrgAdminTable(
                user_id=2, # sungmin
                organization_id=1, # AASA
                is_owner=True
            ),
            OrgAdminTable(
                user_id=2, # sungmin
                organization_id=2, # KSAP
                is_owner=True
            ),
            OrgAdminTable(
                user_id=2, # sungmin
                organization_id=3, # Jocelyn's Test Org (Sungmin simulates demo org owner)
                is_owner=True
            ),
            OrgAdminTable(
                user_id=3, # nadula
                organization_id=1 # AASA
            ),
            OrgAdminTable(
                user_id=3, # nadula
                organization_id=2 # KSAP
            ),
            OrgAdminTable(
                user_id=4, # jaden
                organization_id=1 # AASA
            ),
            OrgAdminTable(
                user_id=4, # jaden
                organization_id=2 # KSAP
            ),
            OrgAdminTable(
                user_id=5, # dk
                organization_id=1 # AASA
            ),
            OrgAdminTable(
                user_id=5, # dk
                organization_id=2 # KSAP
            )
        ]

    for admin in org_admins:
        session.add(admin)
    session.commit()
    print("Dummy org admins added.")

def create_event_data(session):
    events = [
        EventTable( # event id 1
            title="Asian American Students Big Little Family",
            description="This is a big little family pairing for new members of the Asian American Students Association.",
            end_date=datetime.now() + timedelta(weeks=52),
            organization_id=1,
            status=EventStatus.STARTED,
            check_sibling_roles=True
        ),
        EventTable( # event id 2
            title="Asian American Students Big Little Family Program",
            description="This is a big little family pairing for new members of the Asian American Students Association.",
            end_date=datetime.now() + timedelta(weeks=52),
            organization_id=1,
            status=EventStatus.STARTED,
            check_sibling_roles=True
        ),
        EventTable( # event id 3
            title="Korean Students Big Little Gajok Program",
            description="This is a big little family pairing for new members of the Korean Students Association of Princeton.",
            end_date=datetime.now() + timedelta(weeks=52),
            organization_id=2,
            status=EventStatus.STARTED,
            check_sibling_roles=True
        ),
        EventTable( # event id 4
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
    Create event registrations for the demo test event.

    "response_summary" field is populated manually for demo purposes.

    DEMO_CASE 1 (6 students):
    - Gary (BIG) -> pairs with Nadula (LITTLE)
    - Sungmin (BIG) -> pairs with Jocelyn (LITTLE, but Jocelyn not in DB)
    - DK (BIG) -> pairs with Jaden (LITTLE)

    DEMO_CASE 2 (4 students):
    - Gary (BIG) -> pairs with Nadula (LITTLE)
    - Sungmin (BIG) -> pairs with Jaden (LITTLE)
    """
    if DEMO_CASE == "1":
        # DEMO_CASE 1: 6 students registered (Gary, Sungmin, Nadula, Jaden, DK + Jocelyn simulated)
        registrations = [
            EventRegistrationsTable(
                user_id=1, # gary
                event_id=4,
                role=EventRole.BIG_SIBLING,
                valid_registration=True,
                response_summary="Enjoys Pizza and Instagram."
            ),
            EventRegistrationsTable(
                user_id=2, # sungmin
                event_id=4,
                role=EventRole.BIG_SIBLING,
                valid_registration=True,
                response_summary="Enjoys Sushi and Facebook."
            ),
            EventRegistrationsTable(
                user_id=3, # nadula
                event_id=4,
                role=EventRole.LITTLE_SIBLING,
                valid_registration=True,
                response_summary="Enjoys Hamburger and Instagram."
            ),
            EventRegistrationsTable(
                user_id=4, # jaden
                event_id=4,
                role=EventRole.LITTLE_SIBLING,
                valid_registration=True,
                response_summary="Enjoys Pancakes and TikTok."
            ),
            EventRegistrationsTable(
                user_id=5, # dk
                event_id=4,
                role=EventRole.BIG_SIBLING,
                valid_registration=True,
                response_summary="Enjoys Waffles and TikTok."
            )
        ]
    else:  # DEMO_CASE == "2"
        # DEMO_CASE 2: 4 students registered (Sungmin, Nadula, Jaden only, no Gary/DK)
        registrations = [
            EventRegistrationsTable(
                user_id=2, # sungmin
                event_id=4,
                role=EventRole.BIG_SIBLING,
                valid_registration=True,
                response_summary="Enjoys Sushi and Facebook."
            ),
            EventRegistrationsTable(
                user_id=3, # nadula
                event_id=4,
                role=EventRole.LITTLE_SIBLING,
                valid_registration=True,
                response_summary="Enjoys Hamburger and Instagram."
            ),
            EventRegistrationsTable(
                user_id=4, # jaden
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
    Create user profile data.

    DEMO_CASE 1: Gary has profile (6 students total)
    DEMO_CASE 2: Gary doesn't have profile (simulating fewer active participants)
    """
    if DEMO_CASE == "1":
        # DEMO_CASE 1: All 6 students have profiles including Gary
        profiles = [
            UserProfileTable(
                user_id=1, # gary
                gender="Male",
                class_year=ClassYear.JUNIOR,
                major="Art",
                hobbies=["Graphic Design", "Art", "Painting", "Drawing"]
            ),
            UserProfileTable(
                user_id=2, # sungmin
                gender="Male",
                class_year=ClassYear.JUNIOR,
                major="Computer Engineering",
                hobbies=["Machine Learning", "Large Language Models", "Coding", "AI"]
            ),
            UserProfileTable(
                user_id=3, # nadula
                gender="Male",
                class_year=ClassYear.SOPHOMORE,
                major="Design",
                hobbies=["Graphic Design", "Typography", "Product Design"]
            ),
            UserProfileTable(
                user_id=4, # jaden
                gender="Male",
                class_year=ClassYear.SOPHOMORE,
                major="Computer Science",
                hobbies=["Basketball", "Coding Competitions", "Football", "Computer Architecture"]
            ),
            UserProfileTable(
                user_id=5, # dk
                gender="Male",
                class_year=ClassYear.JUNIOR,
                major="Economics",
                hobbies=["Basketball", "Scooter", "Sports Racing", "Soccer"]
            )
        ]
    else:  # DEMO_CASE == "2"
        # DEMO_CASE 2: Gary doesn't have profile (only Sungmin, Nadula, Jaden, DK)
        profiles = [
            UserProfileTable(
                user_id=2, # sungmin
                gender="Male",
                class_year=ClassYear.JUNIOR,
                major="Computer Engineering",
                hobbies=["Machine Learning", "Large Language Models", "Coding", "AI"]
            ),
            UserProfileTable(
                user_id=3, # nadula
                gender="Male",
                class_year=ClassYear.SOPHOMORE,
                major="Design",
                hobbies=["Graphic Design", "Typography", "Product Design"]
            ),
            UserProfileTable(
                user_id=4, # jaden
                gender="Male",
                class_year=ClassYear.SOPHOMORE,
                major="Computer Science",
                hobbies=["Basketball", "Coding Competitions", "Football", "Computer Architecture"]
            ),
            UserProfileTable(
                user_id=5, # dk
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
    questions = [
        QuestionTable(
            # open-ended question
            question="What's your favorite food?",
            event_id=4 # demo event
        ),
        QuestionTable(
            # multiple choice question
            question="What's your favorite social media app?",
            options=["Instagram","Facebook","TikTok","Snapchat"],
            event_id=4
        )
    ]

    for question in questions:
        session.add(question)
    session.commit()
    print("Dummy questions added.")

def create_response_data(session):
    """
    Create questionnaire responses for demo test event.

    Intended pairings:

    DEMO_CASE 1 (6 students):
    - Gary (Pizza, Instagram) -> Nadula (Hamburger, Instagram)
    - Sungmin (Sushi, Facebook) -> Jocelyn (simulated)
    - DK (Waffles, TikTok) -> Jaden (Pancakes, TikTok)

    DEMO_CASE 2 (4 students):
    - Gary -> Nadula (not registered, but Gary simulated by profile)
    - Sungmin (Sushi, Facebook) -> Jaden (Sashimi, Facebook)
    """
    if DEMO_CASE == "1":
        # DEMO_CASE 1: Gary, Sungmin, Nadula, Jaden, DK all respond
        responses = [
            ResponseTable(
                user_id=1, # gary
                question_id=1,
                answer="Pizza"
            ),
            ResponseTable(
                user_id=1, # gary
                question_id=2,
                answer="Instagram"
            ),
            ResponseTable(
                user_id=2, # sungmin
                question_id=1,
                answer="Sushi"
            ),
            ResponseTable(
                user_id=2, # sungmin
                question_id=2,
                answer="Facebook"
            ),
            ResponseTable(
                user_id=3, # nadula
                question_id=1,
                answer="Hamburger"
            ),
            ResponseTable(
                user_id=3, # nadula
                question_id=2,
                answer="Instagram"
            ),
            ResponseTable(
                user_id=4, # jaden
                question_id=1,
                answer="Pancakes"
            ),
            ResponseTable(
                user_id=4, # jaden
                question_id=2,
                answer="TikTok"
            ),
            ResponseTable(
                user_id=5, # dk
                question_id=1,
                answer="Waffles"
            ),
            ResponseTable(
                user_id=5, # dk
                question_id=2,
                answer="TikTok"
            )
        ]
    else:  # DEMO_CASE == "2"
        # DEMO_CASE 2: Only Sungmin, Nadula, Jaden respond (no Gary, no DK)
        # Jaden's answers align with Sungmin to encourage pairing
        responses = [
            ResponseTable(
                user_id=2, # sungmin
                question_id=1,
                answer="Sushi"
            ),
            ResponseTable(
                user_id=2, # sungmin
                question_id=2,
                answer="Facebook"
            ),
            ResponseTable(
                user_id=3, # nadula
                question_id=1,
                answer="Hamburger"
            ),
            ResponseTable(
                user_id=3, # nadula
                question_id=2,
                answer="Instagram"
            ),
            ResponseTable(
                user_id=4, # jaden
                question_id=1,
                answer="Sashimi"
            ),
            ResponseTable(
                user_id=4, # jaden
                question_id=2,
                answer="Facebook"
            )
        ]

    for response in responses:
        session.add(response)
    session.commit()
    print("Dummy responses added.")

def fill_all_tables(engine):

    Session = sessionmaker(bind=engine)
    session = Session()

    # warn users if they don't want to commit this action
    print(
        f"""
        CREATING DUMMY DATA FOR STANDARDIZED DEMO IN MAIN DB IN 3 SEC...
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

    print("Data created successfully!")


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

    # NOTE: script to fill dummy data for singular tables
    # Session = sessionmaker(bind=engine)
    # session = Session()
    # create_event_registration_data(session)
