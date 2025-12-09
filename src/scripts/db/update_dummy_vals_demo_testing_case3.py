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

# NOTE: Demo Case 3 - Two Events: Kung Fu Tea & PPMS Premed Mentorship
"""
OVERVIEW:

Event 1: "Kung Fu Tea Pairing" - AASA boba tea matching event
- 8 participants (4 BIG_SIBLING, 4 LITTLE_SIBLING)
- Sungmin is the org admin
- Gary is already registered as a student

Intended pairings (all size 2):
1. Gary (BIG) + Nadula (LITTLE): Both fruit tea lovers, social toppings/goals
2. DK (BIG) + Jaden (LITTLE): Both milk tea lovers, exploration toppings/goals
3. Alice (BIG) + Brian (LITTLE): Both fruit tea, cultural exchange focus
4. Carol (BIG) + David (LITTLE): Both milk tea, mentorship focus

Event 2: "PPMS Premed Mentorship Program" - PPMS premed mentorship pairing
- 8 participants (same users, 4 BIG_SIBLING, 4 LITTLE_SIBLING)
- Sungmin is the org admin/owner
- Different role assignments and pairing opportunities

Intended pairings (all size 2):
1. Alice (BIG) + Nadula (LITTLE): Both interested in Surgery, Clinical Practice
2. Gary (BIG) + Brian (LITTLE): Both interested in Primary Care/Public Health
3. Carol (BIG) + David (LITTLE): Both interested in Research/Academic Medicine
4. DK (BIG) + Jaden (LITTLE): Both interested in Psychiatry/Mental Health
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
    """Create organizations including PPMS for premed mentorship"""
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
            org_name="PPMS",
            description="Princeton Premedical Society"
        )
    ]

    for org in organizations:
        session.add(org)
    session.commit()
    print("Dummy organizations added.")

def create_orgadmin_data(session):
    """
    All team members (Gary, Sungmin, Nadula, Jaden, DK) are owners of both AASA and KSAP
    Sungmin manages the Kung Fu Tea event for AASA and PPMS Premed Mentorship Program
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
        # Sungmin - owner of AASA, KSAP, and PPMS
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
            organization_id=4,  # PPMS
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
    Create two events:
    1. Kung Fu Tea Pairing for AASA
    2. PPMS Premed Mentorship Program for PPMS
    """
    events = [
        EventTable(  # event_id=1
            title="Kung Fu Tea Pairing",
            description="Get paired up for free boba tea with your group!",
            end_date=datetime.now() + timedelta(weeks=4),
            organization_id=1,  # AASA
            status=EventStatus.STARTED,
            check_sibling_roles=True
        ),
        EventTable(  # event_id=2
            title="PPMS Premed Mentorship Program",
            description="Get paired up with a student mentor to help your premed journey!",
            end_date=datetime.now() + timedelta(weeks=4),
            organization_id=4,  # PPMS
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
    Register 8 users for both events with different role assignments.

    Kung Fu Tea event (event_id=1):
    - 4 BIG_SIBLING: Gary, DK, Alice, Carol
    - 4 LITTLE_SIBLING: Nadula, Jaden, Brian, David

    PPMS Premed Mentorship event (event_id=2):
    - 4 BIG_SIBLING: Alice, Gary, Carol, DK
    - 4 LITTLE_SIBLING: Nadula, Brian, David, Jaden
    """
    registrations = [
        # ===== KUNG FU TEA EVENT (event_id=1) =====
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
        ),

        # ===== PPMS PREMED MENTORSHIP EVENT (event_id=2) =====
        # BIG_SIBLING registrations
        EventRegistrationsTable(
            user_id=6,  # alice
            event_id=2,
            role=EventRole.BIG_SIBLING,
            valid_registration=True,
            response_summary="Interested in Surgery with clinical practice focus. Active in hospital volunteering and anatomy research. Wants to mentor students interested in surgical specialties."
        ),
        EventRegistrationsTable(
            user_id=1,  # gary
            event_id=2,
            role=EventRole.BIG_SIBLING,
            valid_registration=True,
            response_summary="Focused on Primary Care and public health. Volunteers at community clinics. Wants to guide students interested in serving underserved communities."
        ),
        EventRegistrationsTable(
            user_id=8,  # carol
            event_id=2,
            role=EventRole.BIG_SIBLING,
            valid_registration=True,
            response_summary="Passionate about Research and Academic Medicine. Works in immunology lab. Wants to mentor students interested in MD-PhD or research careers."
        ),
        EventRegistrationsTable(
            user_id=5,  # dk
            event_id=2,
            role=EventRole.BIG_SIBLING,
            valid_registration=True,
            response_summary="Interested in Psychiatry and mental health. Volunteers at crisis hotline. Wants to mentor students passionate about behavioral health."
        ),
        # LITTLE_SIBLING registrations
        EventRegistrationsTable(
            user_id=3,  # nadula
            event_id=2,
            role=EventRole.LITTLE_SIBLING,
            valid_registration=True,
            response_summary="Aspiring surgeon interested in clinical practice. Shadowing orthopedic surgeons. Looking for guidance on surgical residency preparation."
        ),
        EventRegistrationsTable(
            user_id=7,  # brian
            event_id=2,
            role=EventRole.LITTLE_SIBLING,
            valid_registration=True,
            response_summary="Interested in Primary Care and global health. Volunteers at free clinic. Wants mentorship on pursuing medicine with public health focus."
        ),
        EventRegistrationsTable(
            user_id=9,  # david
            event_id=2,
            role=EventRole.LITTLE_SIBLING,
            valid_registration=True,
            response_summary="Passionate about research and academic medicine. Working in biochemistry lab. Looking for mentor to guide MD-PhD pathway."
        ),
        EventRegistrationsTable(
            user_id=4,  # jaden
            event_id=2,
            role=EventRole.LITTLE_SIBLING,
            valid_registration=True,
            response_summary="Interested in Psychiatry and mental health. Volunteers at peer counseling center. Seeking guidance on psychiatry residency and mental health career."
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
    Create questions for both events.

    Kung Fu Tea event (3 questions):
    1. Multiple choice: Which boba tea do you like?
    2. Text: What are your favorite toppings?
    3. Text: What do you hope to get out of this program?

    PPMS Premed Mentorship event (5 questions):
    1. Multiple choice: What medical specialty are you most interested in?
    2. Multiple choice: Are you more interested in clinical practice or research?
    3. Text: What are your main pre-med extracurriculars?
    4. Text: What academic subjects do you enjoy most?
    5. Text: What do you hope to gain from this mentorship program?
    """
    questions = [
        # ===== KUNG FU TEA EVENT QUESTIONS (event_id=1) =====
        QuestionTable(  # question_id=1
            question="Which boba tea do you like?",
            options=["fruit tea", "milk tea"],
            event_id=1
        ),
        QuestionTable(  # question_id=2
            question="What are your favorite toppings?",
            event_id=1
        ),
        QuestionTable(  # question_id=3
            question="What do you hope to get out of this program?",
            event_id=1
        ),

        # ===== PPMS PREMED MENTORSHIP EVENT QUESTIONS (event_id=2) =====
        QuestionTable(  # question_id=4
            question="What medical specialty are you most interested in?",
            options=["Primary Care", "Surgery", "Pediatrics", "Psychiatry", "Research/Academic Medicine"],
            event_id=2
        ),
        QuestionTable(  # question_id=5
            question="Are you more interested in clinical practice or research?",
            options=["Clinical Practice", "Research", "Both Equally"],
            event_id=2
        ),
        QuestionTable(  # question_id=6
            question="What are your main pre-med extracurriculars?",
            event_id=2
        ),
        QuestionTable(  # question_id=7
            question="What academic subjects do you enjoy most?",
            event_id=2
        ),
        QuestionTable(  # question_id=8
            question="What do you hope to gain from this mentorship program?",
            event_id=2
        )
    ]

    for question in questions:
        session.add(question)
    session.commit()
    print("Dummy questions added.")

def create_response_data(session):
    """
    Create responses for all 8 participants to enable clear pairings.

    Kung Fu Tea event pairings:
    - Pair 1: Gary + Nadula (fruit tea, similar toppings, social)
    - Pair 2: DK + Jaden (milk tea, similar toppings, exploration)
    - Pair 3: Alice + Brian (fruit tea, similar toppings, cultural)
    - Pair 4: Carol + David (milk tea, classic toppings, mentorship)

    PPMS Premed Mentorship pairings:
    - Pair 1: Alice + Nadula (Surgery, Clinical Practice)
    - Pair 2: Gary + Brian (Primary Care, Public Health)
    - Pair 3: Carol + David (Research/Academic Medicine)
    - Pair 4: DK + Jaden (Psychiatry, Mental Health)
    """
    responses = [
        # ===== KUNG FU TEA EVENT RESPONSES =====
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
        ResponseTable(user_id=9, question_id=3, answer="Hoping to find a mentor who can guide me through college."),

        # ===== PPMS PREMED MENTORSHIP EVENT RESPONSES =====
        # Alice's responses (BIG) - Surgery, Clinical Practice
        ResponseTable(user_id=6, question_id=4, answer="Surgery"),
        ResponseTable(user_id=6, question_id=5, answer="Clinical Practice"),
        ResponseTable(user_id=6, question_id=6, answer="Hospital volunteering, shadowing surgeons, anatomy research assistant"),
        ResponseTable(user_id=6, question_id=7, answer="Anatomy, physiology, and biomechanics"),
        ResponseTable(user_id=6, question_id=8, answer="Looking to mentor students interested in surgical specialties and share my clinical experiences."),

        # Nadula's responses (LITTLE) - matches Alice on Surgery, Clinical Practice
        ResponseTable(user_id=3, question_id=4, answer="Surgery"),
        ResponseTable(user_id=3, question_id=5, answer="Clinical Practice"),
        ResponseTable(user_id=3, question_id=6, answer="Shadowing orthopedic surgeons, ER volunteering"),
        ResponseTable(user_id=3, question_id=7, answer="Anatomy, pathology, and surgical techniques"),
        ResponseTable(user_id=3, question_id=8, answer="Want guidance on preparing for surgical residency and clinical rotations."),

        # Gary's responses (BIG) - Primary Care, Public Health
        ResponseTable(user_id=1, question_id=4, answer="Primary Care"),
        ResponseTable(user_id=1, question_id=5, answer="Clinical Practice"),
        ResponseTable(user_id=1, question_id=6, answer="Community clinic volunteering, health education outreach"),
        ResponseTable(user_id=1, question_id=7, answer="Public health, epidemiology, and community medicine"),
        ResponseTable(user_id=1, question_id=8, answer="Want to guide students interested in serving underserved communities."),

        # Brian's responses (LITTLE) - matches Gary on Primary Care, Public Health
        ResponseTable(user_id=7, question_id=4, answer="Primary Care"),
        ResponseTable(user_id=7, question_id=5, answer="Clinical Practice"),
        ResponseTable(user_id=7, question_id=6, answer="Free clinic volunteering, global health initiatives"),
        ResponseTable(user_id=7, question_id=7, answer="Public health, preventive medicine, and health policy"),
        ResponseTable(user_id=7, question_id=8, answer="Seeking mentorship on pursuing medicine with a public health focus."),

        # Carol's responses (BIG) - Research/Academic Medicine
        ResponseTable(user_id=8, question_id=4, answer="Research/Academic Medicine"),
        ResponseTable(user_id=8, question_id=5, answer="Research"),
        ResponseTable(user_id=8, question_id=6, answer="Immunology lab research, scientific publications"),
        ResponseTable(user_id=8, question_id=7, answer="Molecular biology, immunology, and research methodology"),
        ResponseTable(user_id=8, question_id=8, answer="Want to mentor students interested in MD-PhD programs and research careers."),

        # David's responses (LITTLE) - matches Carol on Research/Academic Medicine
        ResponseTable(user_id=9, question_id=4, answer="Research/Academic Medicine"),
        ResponseTable(user_id=9, question_id=5, answer="Research"),
        ResponseTable(user_id=9, question_id=6, answer="Biochemistry lab work, poster presentations"),
        ResponseTable(user_id=9, question_id=7, answer="Biochemistry, molecular biology, and genetics"),
        ResponseTable(user_id=9, question_id=8, answer="Looking for guidance on the MD-PhD pathway and research opportunities."),

        # DK's responses (BIG) - Psychiatry, Mental Health
        ResponseTable(user_id=5, question_id=4, answer="Psychiatry"),
        ResponseTable(user_id=5, question_id=5, answer="Clinical Practice"),
        ResponseTable(user_id=5, question_id=6, answer="Crisis hotline volunteering, mental health awareness campaigns"),
        ResponseTable(user_id=5, question_id=7, answer="Psychology, neuroscience, and behavioral health"),
        ResponseTable(user_id=5, question_id=8, answer="Want to mentor students passionate about mental health and psychiatry."),

        # Jaden's responses (LITTLE) - matches DK on Psychiatry, Mental Health
        ResponseTable(user_id=4, question_id=4, answer="Psychiatry"),
        ResponseTable(user_id=4, question_id=5, answer="Clinical Practice"),
        ResponseTable(user_id=4, question_id=6, answer="Peer counseling, mental health first aid training"),
        ResponseTable(user_id=4, question_id=7, answer="Psychology, neuroscience, and cognitive science"),
        ResponseTable(user_id=4, question_id=8, answer="Seeking guidance on psychiatry residency and mental health career paths.")
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
        CREATING DEMO CASE 3 DATA (KUNG FU TEA & PPMS PREMED MENTORSHIP) IN 3 SEC...
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
