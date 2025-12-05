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
DEMO_CASE = os.getenv("DEMO_CASE", "1")

def create_user_data(session):
    users = [
        UserTable(
            username="gy4937",
            first_name="Gary",
            last_name="Yang",
            phone_number="1234567890",
            email="gy4937@princeton.edu"
        ),
        UserTable(
            username="sk3378",
            first_name="Sungmin",
            last_name="Kim",
            email="sk3378@prineton.edu",
            phone_number="1234567890"
        ),
        UserTable(
            username="ng3922",
            first_name="Nadula",
            last_name="Gardiyehewa",
            phone_number="1234567890",
            email="ng3922@princeton.edu"
        ),
        UserTable(
            username="jc3311",
            first_name="Jaden",
            last_name="Cutinha",
            phone_number="1234567890",
            email="jc3311@princeton.edu"
        ),
        UserTable(
            username="dl2635",
            first_name="Dongkon",
            last_name="Lee",
            phone_number="1234567890",
            email="dl2635@princeton.edu"
        )
    ]

    if DEMO_CASE == "1": # with jocelyn, 6 people
        users.extend([
            # NOTE: id 6 -> student account
            UserTable(
                username="jocelyn",
                first_name="Jocelyn",
                last_name="W",
                phone_number="1234567890",
                email="jocelyn@example.com"
            ),
            # NOTE: id 7 -> org admin account
            UserTable(
                username="cs-jocelyn",
                first_name="Jocelyn 2",
                last_name="W",
                phone_number="1234567890",
                email="cs-jocelyn@example.com"
            )
        ])
    
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
    # Fetch organizations to link with org admins
    organizations = session.query(OrganizationTable).all()
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
        )
    ]

    if DEMO_CASE == "1":
        org_admins.extend([
            OrgAdminTable(
                user_id=7, # jocelyn - org
                organization_id=3, # demo org
                is_owner=True
            ),
        ])
    
    if DEMO_CASE == "2":
        org_admins.extend([
            OrgAdminTable(
                user_id=2, # sungmin
                organization_id=3, # NOTE: Jocelyn's Test Org, simulating as demo org owner
                is_owner=True
            ),
        ])

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
            status=EventStatus.STARTED
        ),
        EventTable( # event id 2
            title="Asian American Students Big Little Family Program",
            description="This is a big little family pairing for new members of the Asian American Students Association.",
            end_date=datetime.now() + timedelta(weeks=52),
            organization_id=1,
            status=EventStatus.STARTED
        ),
        EventTable( # event id 3
            title="Korean Students Big Little Gajok Program",
            description="This is a big little family pairing for new members of the Korean Students Association of Princeton.",
            end_date=datetime.now() + timedelta(weeks=52),
            organization_id=2,
            status=EventStatus.STARTED
        ),
        EventTable( # event id 4
            title="Jocelyn's Test Program",
            description="Demo Test Program for Jocelyn.",
            end_date=datetime.now() + timedelta(weeks=52),
            organization_id=3,
            status=EventStatus.STARTED
        )
    ]
    for event in events:
        session.add(event)
    session.commit()
    print("Dummy events added.")

def create_event_registration_data(session):
    registrations = [
        # demo test event registrations
        EventRegistrationsTable(
            user_id=2, # sungmin
            event_id=4,
            role=EventRole.BIG_SIBLING
        ),
        EventRegistrationsTable(
            user_id=3, # nadula
            event_id=4,
            role=EventRole.LITTLE_SIBLING
        ),
        EventRegistrationsTable(
            user_id=4, # jaden
            event_id=4,
            role=EventRole.LITTLE_SIBLING
        )
    ]

    if DEMO_CASE == "1":
        # if jocelyn's included, gary and dk should be registered
        registrations.extend([
            EventRegistrationsTable(
                user_id=1, # gary
                event_id=4,
                role=EventRole.BIG_SIBLING
            ),
            EventRegistrationsTable(
                user_id=5, # dk
                event_id=4,
                role=EventRole.BIG_SIBLING
            )
        ])

    # if demo case 2, only 3 people are registered

    for registration in registrations:
        session.add(registration)
    session.commit()
    print("Dummy event registrations added.")

def create_user_profile_data(session):
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
            user_id=4, # jaden, NOTE: should be a mix of coding & sport interests
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

    if DEMO_CASE == "1":
        # if jocelyn's included, add her student account to profile
        profiles.extend([
            UserProfileTable(
                user_id=6, # jocelyn - student account
                gender="Female",
                class_year=ClassYear.FRESHMAN,
                major="Computer Science",
                hobbies=["Neural Networks", "Artificial Intelligence", "Deep Learning", "Natural Language Processing"]
            )
        ])

    # in case 2, current suffices

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
            options=["1","2","3","4"],
            event_id=4
        )
    ]

    for question in questions:
        session.add(question)
    session.commit()
    print("Dummy questions added.")

def create_response_data(session):
    """
    As a reminder, the intended pairings are:

    1) (6 students)
    gary - nadula
    sungmin - jocelyn
    dk - jaden

    2) (4 students)
    gary - nadula
    sungmin - jaden
    """
    responses = [
        ResponseTable(
            user_id=2, # sungmin
            question_id=1,
            answer="Sushi"
        ),
        ResponseTable(
            user_id=3, # nadula
            question_id=1,
            answer="Hamburger"
        )
    ]

    if DEMO_CASE == "1":
        # add gary and dk, and encourage jaden to be paired with dk
        responses.extend([
            ResponseTable(
                user_id=1, # gary
                question_id=1, # open-ended question, favorite food?
                answer="Pizza"
            ),
            ResponseTable(
                user_id=5, # dk
                question_id=1,
                answer="Waffles"
            ),
            ResponseTable(
                user_id=4, # jaden
                question_id=1,
                answer="Pancakes"
            )
        ])

    if DEMO_CASE == "2":
        # remove gary and dk, and encourage jaden to be paired with sungmin
        responses.extend([
            ResponseTable(
                user_id=4, # jaden
                question_id=1,
                answer="Sashimi"
            )
        ])

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
        CREATING DUMMY DATA IN MAIN DB IN 3 SEC...
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

    # fill_all_tables(engine)

    # NOTE: script to fill dummy data for singular tables
    # Session = sessionmaker(bind=engine)
    # session = Session()
    # create_event_registration_data(session)
