from datetime import datetime, time, timedelta
from requests import Session
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import time
import os

from db import session
from db.models.events import Event
from db.models.organizations import Organization
from db.models.user import UserTable
from db.models.user_profile import UserProfileTable
from db.models.question import Question
from db.models.response import Response
from db.models.orgadmin import OrgAdmin


def create_organization_data(session):
    organizations = [
        Organization(
            org_name="AASA",
            description="Asian American Student Association"

        ),
        Organization(
            org_name="KSAP",
            description="Korean Student Association"

        ),
        Organization(
            org_name="CS Club",
            description="Computer Science Club"

        ),
        Organization(
            org_name="Dongkon's Club",
            description="We ride around in electric scooters"

        ),
        Organization(
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
    organizations = session.query(Organization).all()
    org_admins = [
        OrgAdmin(
            username="sungmink",
            first_name="Sungmin",
            last_name="Kim",
            email="sungmink@example.com",
            organization_id=2
        ),
        OrgAdmin(
            username="HenryL",
            first_name="Henry",
            last_name="Li",
            email="henrylee@example.com",
            organization_id=1
        ),
        OrgAdmin(
            username="Sk3378",
            first_name="Sungmin",
            last_name="Kim",
            email="sungminkother@example.com",
            organization_id=5
        ),
        OrgAdmin(
            username="Robert",
            first_name="Rober",
            last_name="Dondero",
            email="rdondero@example.com",
            organization_id=3
        ),
        OrgAdmin(
            username="dkkkkk",
            first_name="Dongkon",
            last_name="Lee",
            email="dkkkkk@example.com",
            organization_id=4
        )

    ]

    for admin in org_admins:
        session.add(admin)
    session.commit()
    print("Dummy org admins added.")


def create_user_data(session):
    users = [
        UserTable(
            username="gy4937",
            first_name="Gary",
            last_name="Yang",
            phone_number="7188441945",
            email="gy4937@example.com",
            events=[1, 2]
        ),

        UserTable(
            username="NadulaG",
            first_name="nadula",
            last_name="G",
            email="nadulag@example.com",
            phone_number="1234567890",
            events=[1, 3]
        ),
        UserTable(
            username="JadenCutinha",
            first_name="Jaden",
            last_name="Cutinha",
            phone_number="553323",
            email="jaden@example.com",
            events=[1]
        ),
        UserTable(
            username="JocelynGradStudent",
            first_name="Jocelyn",
            last_name="GradStudent",
            phone_number="4342462346",
            email="jocelyn@example.com",
            events=[1, 3]
        ),
        UserTable(
            username="Yukihhhh",
            first_name="Yuki",
            last_name="Huang",
            email="yuki@example.com",
            events=[]
        ),
        UserTable(
            username="AliceW",
            first_name="Alice",
            last_name="Wong",
            email="alice@example.com",
            events=[2]
        )]
    for user in users:
        session.add(user)
    session.commit()
    print("Dummy users added.")


def create_event_data(session):
    events = [
        Event(
            title="Welcome Event",
            description="An event to welcome new members.",
            start_date=datetime.now(),
            end_date=datetime.now() + timedelta(days=7),
            organization_id=1,
            active=False,
            matches=[(1, 3), (2, 4)]
        ),
        Event(
            title="Tech Talk",
            description="A talk on how to break into web development.",
            start_date=datetime.now(),
            end_date=datetime.now() + timedelta(days=14),
            organization_id=3,
            active=True,
            matches=[]
        ),
        Event(
            title="Cultural Festival",
            description="Celebrating Korean culture with tons of food.",
            start_date=datetime.now(),
            end_date=datetime.now() + timedelta(days=21),
            organization_id=2,
            active=True,
            matches={}
        )
    ]
    for event in events:
        session.add(event)
    session.commit()
    print("Dummy events added.")

# Why do we have firstname, lastname, email in user profile and user?


def create_user_profile_data(session):
    profiles = [
        UserProfileTable(
            user_id=1,
            gender="Male",
            class_year=2027,
            major="Computer Science",
            hobbies=["gaming", "coding", "photography"]

        ),
        UserProfileTable(
            user_id=2,
            gender="Male",
            class_year=2028,
            major="Computer Science",
            hobbies=["coding", "traveling"]
        ),

        UserProfileTable(
            user_id=3,
            gender="Male",
            class_year=2027,
            major="Computer Science",
            hobbies=["music", "sports", "basketball"]
        ),
        UserProfileTable(
            user_id=4,
            gender="Female",
            class_year=2023,
            major="Computer Science",
            hobbies=["reading", "writing", "grading", "research"]
        ),
        UserProfileTable(
            user_id=5,
            gender="Female",
            class_year=2027,
            major="Economics",
            hobbies=["boba", "sculpting", "graphic design"]
        ),
        UserProfileTable(
            user_id=6,
            gender="Female",
            class_year=2025,
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
        Question(
            question="What is your favorite programming language?",
            options=["Python","Javascript","C++","Java"],
            event_id=2
        ),
        Question(
            question="How many years of coding experience do you have?",
            options=["1","2","3","4","5+"],
            event_id=2
        ),
        Question(
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
        Response(
            user_id=2,
            question_id=1,
            answer="Python"
        ),
        Response(
            user_id=4,
            question_id=1,
            answer="Javascript"
        ),
        Response(
            user_id=2,
            question_id=2,
            answer="2"
        ),
        Response(
            user_id=4,
            question_id=2,
            answer="Java"
        ),
        Response(
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
    create_organization_data(session)
    create_orgadmin_data(session)
    create_user_data(session)
    create_user_profile_data(session)
    create_event_data(session)
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
