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

def create_user_data(session):
    users = [
        UserTable(
            username="gy4937",
            first_name="Gary",
            last_name="Yang",
            phone_number="7188441945",
            email="gy4937@example.com"
        ),
        UserTable(
            username="NadulaG",
            first_name="nadula",
            last_name="G",
            email="nadulag@example.com",
            phone_number="1234567890"
        ),
        UserTable(
            username="JadenCutinha",
            first_name="Jaden",
            last_name="Cutinha",
            phone_number="553323",
            email="jaden@example.com"
        ),
        UserTable(
            username="JocelynGradStudent",
            first_name="Jocelyn",
            last_name="GradStudent",
            phone_number="4342462346",
            email="jocelyn@example.com"
        ),
        UserTable(
            username="Yukihhhh",
            first_name="Yuki",
            last_name="Huang",
            email="yuki@example.com"
        ),
        UserTable(
            username="AliceW",
            first_name="Alice",
            last_name="Wong",
            email="alice@example.com"
        )]
    for user in users:
        session.add(user)
    session.commit()
    print("Dummy users added.")

def create_organization_data(session):
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
            org_name="CS Club",
            description="Computer Science Club"

        ),
        OrganizationTable(
            org_name="Dongkon's Club",
            description="We ride around in electric scooters"

        ),
        OrganizationTable(
            org_name="Sungmins's Club",
            description="We cook delicious food!"
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
            user_id=1,
            organization_id=1
        ),
        OrgAdminTable(
            user_id=2,
            organization_id=1
        ),
        OrgAdminTable(
            user_id=3,
            organization_id=5
        ),
        OrgAdminTable(
            user_id=4,
            organization_id=3
        ),
        OrgAdminTable(
            user_id=5,
            organization_id=4
        )
    ]

    for admin in org_admins:
        session.add(admin)
    session.commit()
    print("Dummy org admins added.")

def create_event_data(session):
    events = [
        EventTable( # event id 1
            title="Welcome Event",
            description="An event to welcome new members.",
            end_date=datetime.now() + timedelta(days=7),
            organization_id=1,
            status=EventStatus.NOT_STARTED,
            matches=[(1, 3), (2, 4)]
        ),
        EventTable( # event id 2
            title="Tech Talk",
            description="*This event started* A talk on how to break into web development.",
            end_date=datetime.now() + timedelta(days=14),
            organization_id=3,
            status=EventStatus.STARTED
        ),
        EventTable( # event id 3
            title="Cultural Festival",
            description="Celebrating Korean culture with tons of food.",
            end_date=datetime.now() + timedelta(days=21),
            organization_id=2,
            status=EventStatus.TERMINATED
        ),
        EventTable( # event id 4
            title="PeerPear main event",
            description="This event has been published.",
            end_date=datetime.now() + timedelta(days=21),
            organization_id=2,
            status=EventStatus.PAIRING_PUBLISHED
        ),
        EventTable( # event id 5
            title="PeerPear main event 2 - started",
            description="This event has been published.",
            end_date=datetime.now() + timedelta(days=21),
            organization_id=1,
            status=EventStatus.STARTED
        ),
        EventTable( # event id 6
            title="PeerPear main event 3 - not started",
            description="This event has been published.",
            end_date=datetime.now() + timedelta(days=21),
            organization_id=1,
            status=EventStatus.NOT_STARTED
        )
    ]
    for event in events:
        session.add(event)
    session.commit()
    print("Dummy events added.")

def create_event_registration_data(session):
    registrations = [
        # event 1 with 4 registrations
        EventRegistrationsTable(
            user_id=1,
            event_id=1,
            role=EventRole.BIG_SIBLING
        ),
        EventRegistrationsTable(
            user_id=2,
            event_id=1,
            role=EventRole.LITTLE_SIBLING
        ),
        EventRegistrationsTable(
            user_id=3,
            event_id=1,
            role=EventRole.BIG_SIBLING
        ),
        EventRegistrationsTable(
            user_id=4,
            event_id=1,
            role=EventRole.LITTLE_SIBLING
        ),
        # event 2 with 5 registrations
        EventRegistrationsTable(
            user_id=1,
            event_id=2,
            role=EventRole.BIG_SIBLING,
            valid_registration=True
        ),
        EventRegistrationsTable(
            user_id=2,
            event_id=2,
            role=EventRole.LITTLE_SIBLING,
            valid_registration=True
        ),
        EventRegistrationsTable(
            user_id=3,
            event_id=2,
            role=EventRole.BIG_SIBLING,
            valid_registration=True
        ),
        EventRegistrationsTable(
            user_id=4,
            event_id=2,
            role=EventRole.LITTLE_SIBLING,
            valid_registration=True
        ),
        EventRegistrationsTable(
            user_id=5,
            event_id=2,
            role=EventRole.BIG_SIBLING,
            valid_registration=True
        )
    ]
    for registration in registrations:
        session.add(registration)
    session.commit()
    print("Dummy event registrations added.")

def create_user_profile_data(session):
    profiles = [
        UserProfileTable(
            user_id=1,
            gender="Male",
            class_year=ClassYear.JUNIOR,
            major="Computer Science",
            hobbies=["gaming", "coding", "photography"]
        ),
        UserProfileTable(
            user_id=2,
            gender="Male",
            class_year=ClassYear.SOPHOMORE,
            major="Computer Science",
            hobbies=["coding", "traveling"]
        ),
        UserProfileTable(
            user_id=3,
            gender="Male",
            class_year=ClassYear.FRESHMAN,
            major="Computer Science",
            hobbies=["music", "sports", "basketball"]
        ),
        UserProfileTable(
            user_id=4,
            gender="Female",
            class_year=ClassYear.ALUMNI,
            major="Computer Science",
            hobbies=["reading", "writing", "grading", "research"]
        ),
        UserProfileTable(
            user_id=5,
            gender="Female",
            class_year=ClassYear.PROFESSOR,
            major="Economics",
            hobbies=["boba", "sculpting", "graphic design"]
        ),
        UserProfileTable(
            user_id=6,
            gender="Female",
            class_year=ClassYear.SENIOR,
            major="Economics",
            hobbies=["art", "traveling", "music"]
        )
    ]

    for profile in profiles:
        session.add(profile)
    session.commit()
    print("Dummy user profiles added.")

def create_question_data(session):
    questions = [
        QuestionTable(
            question="What is your favorite programming language?",
            options=["Python","Javascript","C++","Java"],
            event_id=2
        ),
        QuestionTable(
            question="How many years of coding experience do you have?",
            options=["1","2","3","4","5+"],
            event_id=2
        ),
        QuestionTable(
            question="What is your favorite Asian food?:",
            event_id=1
        )
    ]
    for question in questions:
        session.add(question)
    session.commit()
    print("Dummy questions added.")

def create_response_data(session):
    responses = [
        ResponseTable(
            user_id=2,
            question_id=1,
            answer="Python"
        ),
        ResponseTable(
            user_id=4,
            question_id=1,
            answer="Javascript"
        ),
        ResponseTable(
            user_id=2,
            question_id=2,
            answer="2"
        ),
        ResponseTable(
            user_id=4,
            question_id=2,
            answer="Java"
        ),
        ResponseTable(
            user_id=1,
            question_id=3,
            answer="Noodles"
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
