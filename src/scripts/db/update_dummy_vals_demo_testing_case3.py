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

# NOTE: Demo Case 3 - Kung Fu Tea Pairing Event
"""
OVERVIEW:

Event: "Kung Fu Tea Pairing" - AASA boba tea matching event
- 8 participants (4 BIG_SIBLING, 4 LITTLE_SIBLING)
- Sungmin is the org admin
- Gary is already registered as a student

Intended pairings (all size 2):
1. Gary (BIG) + Nadula (LITTLE): Both fruit tea lovers, social toppings/goals
2. DK (BIG) + Jaden (LITTLE): Both milk tea lovers, exploration toppings/goals
3. Alice (BIG) + Brian (LITTLE): Both fruit tea, cultural exchange focus
4. Carol (BIG) + David (LITTLE): Both milk tea, mentorship focus
"""

def create_user_data(session):
    """
    Create 9 users total:
    - Gary, Sungmin, Nadula, Jaden, DK (existing 5)
    - Alice, Brian, Carol, David (new 4)

    Sungmin is org admin, other 8 are event participants
    """
    users = [
        # Existing users
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
            email="sk3378@princeton.edu",
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
        # New users for Demo Case 3
        UserTable(  # user_id=6
            username="ac1234",
            first_name="Alice",
            last_name="Chen",
            email="ac1234@princeton.edu"
        ),
        UserTable(  # user_id=7
            username="bw5678",
            first_name="Brian",
            last_name="Wong",
            email="bw5678@princeton.edu"
        ),
        UserTable(  # user_id=8
            username="cl9012",
            first_name="Carol",
            last_name="Liu",
            email="cl9012@princeton.edu"
        ),
        UserTable(  # user_id=9
            username="dp3456",
            first_name="David",
            last_name="Park",
            email="dp3456@princeton.edu"
        )
    ]

    for user in users:
        session.add(user)
    session.commit()
    print("Dummy users added.")

def create_organization_data(session):
    """Create organizations (same as before)"""
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
    All team members (Gary, Sungmin, Nadula, Jaden, DK) are owners of both AASA and KSAP
    Sungmin manages the Kung Fu Tea event for AASA
    """
    org_admins = [
        # Gary - owner of both orgs
        OrgAdminTable(
            user_id=1,  # gary
            organization_id=1,  # AASA
            is_owner=True
        ),
        OrgAdminTable(
            user_id=1,  # gary
            organization_id=2,  # KSAP
            is_owner=True
        ),
        # Sungmin - owner of both orgs, manages Kung Fu Tea event
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
        # Nadula - owner of both orgs
        OrgAdminTable(
            user_id=3,  # nadula
            organization_id=1,  # AASA
            is_owner=True
        ),
        OrgAdminTable(
            user_id=3,  # nadula
            organization_id=2,  # KSAP
            is_owner=True
        ),
        # Jaden - owner of both orgs
        OrgAdminTable(
            user_id=4,  # jaden
            organization_id=1,  # AASA
            is_owner=True
        ),
        OrgAdminTable(
            user_id=4,  # jaden
            organization_id=2,  # KSAP
            is_owner=True
        ),
        # DK - owner of both orgs
        OrgAdminTable(
            user_id=5,  # dk
            organization_id=1,  # AASA
            is_owner=True
        ),
        OrgAdminTable(
            user_id=5,  # dk
            organization_id=2,  # KSAP
            is_owner=True
        )
    ]

    for admin in org_admins:
        session.add(admin)
    session.commit()
    print("Dummy org admins added.")

def create_event_data(session):
    """
    Create the Kung Fu Tea Pairing event for AASA
    """
    events = [
        EventTable(  # event_id=1
            title="Kung Fu Tea Pairing",
            description="Get paired up for free boba tea with your group!",
            end_date=datetime.now() + timedelta(weeks=4),
            organization_id=1,  # AASA
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
    Register 8 users for the Kung Fu Tea event:
    - 4 BIG_SIBLING: Gary, DK, Alice, Carol
    - 4 LITTLE_SIBLING: Nadula, Jaden, Brian, David

    response_summary reflects their answers to the 3 questions
    """
    registrations = [
        # BIG_SIBLING registrations
        EventRegistrationsTable(
            user_id=1,  # gary
            event_id=1,
            role=EventRole.BIG_SIBLING,
            valid_registration=True,
            response_summary="Likes fruit tea with popping boba and lychee jelly. Wants to make new friends."
        ),
        EventRegistrationsTable(
            user_id=5,  # dk
            event_id=1,
            role=EventRole.BIG_SIBLING,
            valid_registration=True,
            response_summary="Prefers milk tea with boba pearls and pudding. Wants to explore new boba places."
        ),
        EventRegistrationsTable(
            user_id=6,  # alice
            event_id=1,
            role=EventRole.BIG_SIBLING,
            valid_registration=True,
            response_summary="Enjoys fruit tea with aloe vera and grass jelly. Interested in cultural exchange."
        ),
        EventRegistrationsTable(
            user_id=8,  # carol
            event_id=1,
            role=EventRole.BIG_SIBLING,
            valid_registration=True,
            response_summary="Loves milk tea with classic boba. Looking to build mentorship connections."
        ),
        # LITTLE_SIBLING registrations
        EventRegistrationsTable(
            user_id=3,  # nadula
            event_id=1,
            role=EventRole.LITTLE_SIBLING,
            valid_registration=True,
            response_summary="Likes fruit tea with popping boba and lychee. Wants to meet new people."
        ),
        EventRegistrationsTable(
            user_id=4,  # jaden
            event_id=1,
            role=EventRole.LITTLE_SIBLING,
            valid_registration=True,
            response_summary="Prefers milk tea with tapioca and pudding. Wants to try new boba shops."
        ),
        EventRegistrationsTable(
            user_id=7,  # brian
            event_id=1,
            role=EventRole.LITTLE_SIBLING,
            valid_registration=True,
            response_summary="Enjoys fruit tea with grass jelly and aloe. Wants to learn about Asian culture."
        ),
        EventRegistrationsTable(
            user_id=9,  # david
            event_id=1,
            role=EventRole.LITTLE_SIBLING,
            valid_registration=True,
            response_summary="Loves milk tea with regular pearls. Looking to find a mentor."
        )
    ]

    for registration in registrations:
        session.add(registration)
    session.commit()
    print("Dummy event registrations added.")

def create_user_profile_data(session):
    """
    Create profiles for all 8 event participants
    (Sungmin doesn't need a profile as org admin)
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
        ),
        UserProfileTable(
            user_id=6,  # alice
            gender="Female",
            class_year=ClassYear.SOPHOMORE,
            major="Anthropology",
            hobbies=["Cultural Studies", "Photography", "Traveling", "Language Learning"]
        ),
        UserProfileTable(
            user_id=7,  # brian
            gender="Male",
            class_year=ClassYear.FRESHMAN,
            major="East Asian Studies",
            hobbies=["History", "Calligraphy", "Tea Culture", "Reading"]
        ),
        UserProfileTable(
            user_id=8,  # carol
            gender="Female",
            class_year=ClassYear.SENIOR,
            major="Public Policy",
            hobbies=["Community Service", "Mentoring", "Debate", "Writing"]
        ),
        UserProfileTable(
            user_id=9,  # david
            gender="Male",
            class_year=ClassYear.FRESHMAN,
            major="Undecided",
            hobbies=["Exploring Campus", "Meeting People", "Gaming", "Music"]
        )
    ]

    for profile in profiles:
        session.add(profile)
    session.commit()
    print("Dummy user profiles added.")

def create_question_data(session):
    """
    Create 3 questions for the Kung Fu Tea event:
    1. Multiple choice: Which boba tea do you like?
    2. Text: What are your favorite toppings?
    3. Text: What do you hope to get out of this program?
    """
    questions = [
        QuestionTable(
            question="Which boba tea do you like?",
            options=["fruit tea", "milk tea"],
            event_id=1
        ),
        QuestionTable(
            question="What are your favorite toppings?",
            event_id=1
        ),
        QuestionTable(
            question="What do you hope to get out of this program?",
            event_id=1
        )
    ]

    for question in questions:
        session.add(question)
    session.commit()
    print("Dummy questions added.")

def create_response_data(session):
    """
    Create responses for all 8 participants to enable clear pairings:

    Pair 1: Gary + Nadula (fruit tea, similar toppings, social)
    Pair 2: DK + Jaden (milk tea, similar toppings, exploration)
    Pair 3: Alice + Brian (fruit tea, similar toppings, cultural)
    Pair 4: Carol + David (milk tea, classic toppings, mentorship)
    """
    responses = [
        # Gary's responses (BIG)
        ResponseTable(user_id=1, question_id=1, answer="fruit tea"),
        ResponseTable(user_id=1, question_id=2, answer="Popping boba and lychee jelly"),
        ResponseTable(user_id=1, question_id=3, answer="I want to make new friends and enjoy some good boba!"),

        # Nadula's responses (LITTLE) - matches Gary
        ResponseTable(user_id=3, question_id=1, answer="fruit tea"),
        ResponseTable(user_id=3, question_id=2, answer="Popping boba and lychee"),
        ResponseTable(user_id=3, question_id=3, answer="Looking forward to meeting new people over boba tea."),

        # DK's responses (BIG)
        ResponseTable(user_id=5, question_id=1, answer="milk tea"),
        ResponseTable(user_id=5, question_id=2, answer="Boba pearls and pudding"),
        ResponseTable(user_id=5, question_id=3, answer="Want to explore new boba places and make connections."),

        # Jaden's responses (LITTLE) - matches DK
        ResponseTable(user_id=4, question_id=1, answer="milk tea"),
        ResponseTable(user_id=4, question_id=2, answer="Tapioca pearls and pudding"),
        ResponseTable(user_id=4, question_id=3, answer="I'd love to try different boba shops with someone!"),

        # Alice's responses (BIG)
        ResponseTable(user_id=6, question_id=1, answer="fruit tea"),
        ResponseTable(user_id=6, question_id=2, answer="Aloe vera and grass jelly"),
        ResponseTable(user_id=6, question_id=3, answer="Interested in cultural exchange and sharing experiences."),

        # Brian's responses (LITTLE) - matches Alice
        ResponseTable(user_id=7, question_id=1, answer="fruit tea"),
        ResponseTable(user_id=7, question_id=2, answer="Grass jelly and aloe"),
        ResponseTable(user_id=7, question_id=3, answer="I want to learn more about Asian American culture."),

        # Carol's responses (BIG)
        ResponseTable(user_id=8, question_id=1, answer="milk tea"),
        ResponseTable(user_id=8, question_id=2, answer="Classic boba pearls"),
        ResponseTable(user_id=8, question_id=3, answer="Looking to build mentorship connections with younger students."),

        # David's responses (LITTLE) - matches Carol
        ResponseTable(user_id=9, question_id=1, answer="milk tea"),
        ResponseTable(user_id=9, question_id=2, answer="Regular tapioca pearls"),
        ResponseTable(user_id=9, question_id=3, answer="Hoping to find a mentor who can guide me through college.")
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
        CREATING DEMO CASE 3 DATA (KUNG FU TEA PAIRING) IN 3 SEC...
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

    print("Demo Case 3 data created successfully!")


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
