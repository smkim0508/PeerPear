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

# NOTE: Demo Case 3 - Four Events with Multiple Pairing Scenarios
"""
OVERVIEW:

Event 1: "Kung Fu Tea Pairing" - AASA boba tea matching event
- 8 participants (4 BIG_SIBLING, 4 LITTLE_SIBLING)
- Sungmin is the org admin
- Group size: 2 (4 groups total)

Intended pairings (all size 2):
1. Gary (BIG) + Nadula (LITTLE): Both fruit tea lovers, social toppings/goals
2. DK (BIG) + Jaden (LITTLE): Both milk tea lovers, exploration toppings/goals
3. Alice (BIG) + Brian (LITTLE): Both fruit tea, cultural exchange focus
4. Carol (BIG) + David (LITTLE): Both milk tea, mentorship focus

Event 2: "PPMS Premed Mentorship Program" - PPMS premed mentorship pairing
- 8 participants (same users as Event 1, 4 BIG_SIBLING, 4 LITTLE_SIBLING)
- Sungmin is the org admin/owner
- Group size: 2 (4 groups total)

Intended pairings (all size 2):
1. Alice (BIG) + Nadula (LITTLE): Both interested in Surgery, Clinical Practice
2. Gary (BIG) + Brian (LITTLE): Both interested in Primary Care/Public Health
3. Carol (BIG) + David (LITTLE): Both interested in Research/Academic Medicine
4. DK (BIG) + Jaden (LITTLE): Both interested in Psychiatry/Mental Health

Event 3: "KSAP Gajok Pairing 2026 Spring" - KSAP Korean culture pairing
- 12 new participants (6 BIG_SIBLING, 6 LITTLE_SIBLING)
- Sungmin is the org admin (already owner of KSAP)
- Group size: 4 (3 groups total, each with 2 bigs + 2 littles)

Intended pairings (all size 4):
1. Group 1: K-pop and Korean food enthusiasts
2. Group 2: K-drama and traditional culture fans
3. Group 3: Mixed cultural interests

Event 4: "PSV Mentorship Program" - Princeton Student Ventures investing mentorship
- 6 new participants (3 BIG_SIBLING, 3 LITTLE_SIBLING)
- Sungmin is the org admin/owner
- Group size: 3 (2 groups total)

Intended pairings (all size 3):
1. Group 1: VC/startup investing focus
2. Group 2: Public markets/hedge fund focus
"""

def create_user_data(session):
    """
    Create 27 users total:
    - Gary, Sungmin, Nadula, Jaden, DK (existing 5)
    - Alice, Brian, Carol, David (4 for Events 1&2)
    - 12 new users for KSAP event (user_id 10-21)
    - 6 new users for PSV event (user_id 22-27)

    Sungmin is org admin for all events
    """
    users = [
        # ===== EXISTING USERS (1-9) =====
        UserTable(  # user_id=1
            username="gy4937",
            first_name="Gary",
            last_name="Yang",
            email="gy4937@princeton.edu"
        ),
        UserTable(  # user_id=2
            username="sk3378",
            first_name="Sungmin",
            last_name="Kim",
            email="sk3378@princeton.edu",
        ),
        UserTable(  # user_id=3
            username="ng3922",
            first_name="Nadula",
            last_name="Gardiyehewa",
            email="ng3922@princeton.edu"
        ),
        UserTable(  # user_id=4
            username="jc3311",
            first_name="Jaden",
            last_name="Cutinha",
            email="jc3311@princeton.edu"
        ),
        UserTable(  # user_id=5
            username="dl2635",
            first_name="Dongkon",
            last_name="Lee",
            email="dl2635@princeton.edu"
        ),
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
        ),

        # ===== KSAP EVENT USERS (10-21) =====
        UserTable(  # user_id=10
            username="sk1111",
            first_name="Seojin",
            last_name="Kim",
            email="sk1111@princeton.edu"
        ),
        UserTable(  # user_id=11
            username="jl2222",
            first_name="Jiwoo",
            last_name="Lee",
            email="jl2222@princeton.edu"
        ),
        UserTable(  # user_id=12
            username="mp3333",
            first_name="Minho",
            last_name="Park",
            email="mp3333@princeton.edu"
        ),
        UserTable(  # user_id=13
            username="yc4444",
            first_name="Yuna",
            last_name="Choi",
            email="yc4444@princeton.edu"
        ),
        UserTable(  # user_id=14
            username="hk5555",
            first_name="Hyunwoo",
            last_name="Kang",
            email="hk5555@princeton.edu"
        ),
        UserTable(  # user_id=15
            username="sj6666",
            first_name="Suyeon",
            last_name="Jung",
            email="sj6666@princeton.edu"
        ),
        UserTable(  # user_id=16
            username="dl7777",
            first_name="Daeho",
            last_name="Lim",
            email="dl7777@princeton.edu"
        ),
        UserTable(  # user_id=17
            username="eh8888",
            first_name="Eunji",
            last_name="Han",
            email="eh8888@princeton.edu"
        ),
        UserTable(  # user_id=18
            username="js9999",
            first_name="Jaemin",
            last_name="Shin",
            email="js9999@princeton.edu"
        ),
        UserTable(  # user_id=19
            username="nk0000",
            first_name="Nari",
            last_name="Kwon",
            email="nk0000@princeton.edu"
        ),
        UserTable(  # user_id=20
            username="sw1212",
            first_name="Sunho",
            last_name="Woo",
            email="sw1212@princeton.edu"
        ),
        UserTable(  # user_id=21
            username="ab3434",
            first_name="Areum",
            last_name="Baek",
            email="ab3434@princeton.edu"
        ),

        # ===== PSV EVENT USERS (22-27) =====
        UserTable(  # user_id=22
            username="mc5656",
            first_name="Michael",
            last_name="Chen",
            email="mc5656@princeton.edu"
        ),
        UserTable(  # user_id=23
            username="er7878",
            first_name="Emma",
            last_name="Rodriguez",
            email="er7878@princeton.edu"
        ),
        UserTable(  # user_id=24
            username="jp9090",
            first_name="James",
            last_name="Peterson",
            email="jp9090@princeton.edu"
        ),
        UserTable(  # user_id=25
            username="st1313",
            first_name="Sarah",
            last_name="Thompson",
            email="st1313@princeton.edu"
        ),
        UserTable(  # user_id=26
            username="rp2424",
            first_name="Ryan",
            last_name="Patel",
            email="rp2424@princeton.edu"
        ),
        UserTable(  # user_id=27
            username="om3535",
            first_name="Olivia",
            last_name="Martinez",
            email="om3535@princeton.edu"
        )
    ]

    for user in users:
        session.add(user)
    session.commit()
    print("Dummy users added.")

def create_organization_data(session):
    """Create organizations including PPMS and PSV"""
    organizations = [
        OrganizationTable(  # org_id=1
            org_name="AASA",
            description="Asian American Student Association"
        ),
        OrganizationTable(  # org_id=2
            org_name="KSAP",
            description="Korean Student Association"
        ),
        OrganizationTable(  # org_id=3
            org_name="Jocelyn's Test Org",
            description="Demo Test Org for Jocelyn."
        ),
        OrganizationTable(  # org_id=4
            org_name="PPMS",
            description="Princeton Premedical Society"
        ),
        OrganizationTable(  # org_id=5
            org_name="PSV",
            description="Princeton Student Ventures"
        )
    ]

    for org in organizations:
        session.add(org)
    session.commit()
    print("Dummy organizations added.")

def create_orgadmin_data(session):
    """
    All team members (Gary, Sungmin, Nadula, Jaden, DK) are owners of both AASA and KSAP
    Sungmin manages all events: Kung Fu Tea, PPMS, KSAP Gajok, and PSV
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
        # Sungmin - owner of AASA, KSAP, PPMS, and PSV
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
        OrgAdminTable(
            user_id=2,  # sungmin
            organization_id=5,  # PSV
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
    Create four events:
    1. Kung Fu Tea Pairing for AASA
    2. PPMS Premed Mentorship Program for PPMS
    3. KSAP Gajok Pairing 2026 Spring for KSAP
    4. PSV Mentorship Program for PSV
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
        ),
        EventTable(  # event_id=3
            title="KSAP Gajok Pairing 2026 Spring",
            description="KSAP Gajok Pairing 2026 Spring",
            end_date=datetime.now() + timedelta(weeks=4),
            organization_id=2,  # KSAP
            status=EventStatus.STARTED,
            check_sibling_roles=True
        ),
        EventTable(  # event_id=4
            title="PSV Mentorship Program",
            description="PSV Mentorship Program",
            end_date=datetime.now() + timedelta(weeks=4),
            organization_id=5,  # PSV
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
    Register users for all four events with different role assignments.

    Kung Fu Tea event (event_id=1):
    - 4 BIG_SIBLING: Gary, DK, Alice, Carol
    - 4 LITTLE_SIBLING: Nadula, Jaden, Brian, David

    PPMS Premed Mentorship event (event_id=2):
    - 4 BIG_SIBLING: Alice, Gary, Carol, DK
    - 4 LITTLE_SIBLING: Nadula, Brian, David, Jaden

    KSAP Gajok Pairing event (event_id=3):
    - 6 BIG_SIBLING: Seojin, Minho, Hyunwoo, Daeho, Jaemin, Sunho (users 10, 12, 14, 16, 18, 20)
    - 6 LITTLE_SIBLING: Jiwoo, Yuna, Suyeon, Eunji, Nari, Areum (users 11, 13, 15, 17, 19, 21)

    PSV Mentorship event (event_id=4):
    - 3 BIG_SIBLING: Michael, James, Ryan (users 22, 24, 26)
    - 3 LITTLE_SIBLING: Emma, Sarah, Olivia (users 23, 25, 27)
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
        ),

        # ===== KSAP GAJOK PAIRING EVENT (event_id=3) =====
        # BIG_SIBLING registrations
        EventRegistrationsTable(
            user_id=10,  # seojin
            event_id=3,
            role=EventRole.BIG_SIBLING,
            valid_registration=True,
            response_summary="Loves Kimchi and Korean BBQ. Enjoys BTS and IU. Watched Squid Game and Crash Landing on You. Wants to meet friends who share Korean cultural interests."
        ),
        EventRegistrationsTable(
            user_id=12,  # minho
            event_id=3,
            role=EventRole.BIG_SIBLING,
            valid_registration=True,
            response_summary="Favorite food is Tteokbokki and Korean fried chicken. Listens to Blackpink and Seventeen. Loves K-dramas like Itaewon Class. Looking to build a Korean community at Princeton."
        ),
        EventRegistrationsTable(
            user_id=14,  # hyunwoo
            event_id=3,
            role=EventRole.BIG_SIBLING,
            valid_registration=True,
            response_summary="Enjoys traditional Korean dishes like Bibimbap. Fan of classic K-pop and ballads. Watched Reply 1988 and My Mister. Wants to share Korean culture and traditions with others."
        ),
        EventRegistrationsTable(
            user_id=16,  # daeho
            event_id=3,
            role=EventRole.BIG_SIBLING,
            valid_registration=True,
            response_summary="Loves Bulgogi and Korean stews. Enjoys traditional Korean music and trot. Fan of historical dramas like Kingdom and Mr. Sunshine. Looking to preserve Korean heritage."
        ),
        EventRegistrationsTable(
            user_id=18,  # jaemin
            event_id=3,
            role=EventRole.BIG_SIBLING,
            valid_registration=True,
            response_summary="Enjoys variety of Korean foods from street food to fine dining. Listens to diverse Korean music. Watched both classic and modern dramas. Wants to explore all aspects of Korean culture."
        ),
        EventRegistrationsTable(
            user_id=20,  # sunho
            event_id=3,
            role=EventRole.BIG_SIBLING,
            valid_registration=True,
            response_summary="Loves Korean fusion and modern cuisine. Enjoys indie Korean music and hip-hop. Watched variety shows and web dramas. Looking to connect with Korean American identity."
        ),
        # LITTLE_SIBLING registrations
        EventRegistrationsTable(
            user_id=11,  # jiwoo
            event_id=3,
            role=EventRole.LITTLE_SIBLING,
            valid_registration=True,
            response_summary="Loves Kimchi jjigae and Korean BBQ. Big fan of BTS and Stray Kids. Watched Squid Game and Business Proposal. Want to learn more about Korean culture and make Korean friends."
        ),
        EventRegistrationsTable(
            user_id=13,  # yuna
            event_id=3,
            role=EventRole.LITTLE_SIBLING,
            valid_registration=True,
            response_summary="Favorite is Korean fried chicken and Tteokbokki. Loves Blackpink and NewJeans. Watched True Beauty and All of Us Are Dead. Looking for Korean community and cultural connection."
        ),
        EventRegistrationsTable(
            user_id=15,  # suyeon
            event_id=3,
            role=EventRole.LITTLE_SIBLING,
            valid_registration=True,
            response_summary="Enjoys traditional Korean foods and home cooking. Likes Korean OSTs and ballads. Watched Reply 1988 and Hospital Playlist. Want to connect with Korean roots and traditions."
        ),
        EventRegistrationsTable(
            user_id=17,  # eunji
            event_id=3,
            role=EventRole.LITTLE_SIBLING,
            valid_registration=True,
            response_summary="Loves Korean comfort food and traditional dishes. Enjoys classic K-dramas and Korean films. Watched Parasite and historical dramas. Looking to learn about Korean heritage."
        ),
        EventRegistrationsTable(
            user_id=19,  # nari
            event_id=3,
            role=EventRole.LITTLE_SIBLING,
            valid_registration=True,
            response_summary="Enjoys mix of Korean street food and restaurant dining. Listens to various K-pop groups. Watched both dramas and variety shows. Want to explore Korean culture with peers."
        ),
        EventRegistrationsTable(
            user_id=21,  # areum
            event_id=3,
            role=EventRole.LITTLE_SIBLING,
            valid_registration=True,
            response_summary="Loves Korean cafe culture and modern cuisine. Fan of K-pop and Korean indie music. Watched Netflix Korean series and web content. Looking for Korean American community."
        ),

        # ===== PSV MENTORSHIP EVENT (event_id=4) =====
        # BIG_SIBLING registrations
        EventRegistrationsTable(
            user_id=22,  # michael
            event_id=4,
            role=EventRole.BIG_SIBLING,
            valid_registration=True,
            response_summary="Interested in VC and startup investing. Career goal is to work at a venture capital firm. Has experience with startup pitch competitions and angel investing research. Wants to mentor students interested in entrepreneurship and early-stage investing."
        ),
        EventRegistrationsTable(
            user_id=24,  # james
            event_id=4,
            role=EventRole.BIG_SIBLING,
            valid_registration=True,
            response_summary="Focused on venture capital and tech startups. Aspires to be a VC partner. Has interned at a seed-stage fund. Looking to guide students passionate about startup ecosystems and innovation."
        ),
        EventRegistrationsTable(
            user_id=26,  # ryan
            event_id=4,
            role=EventRole.BIG_SIBLING,
            valid_registration=True,
            response_summary="Interested in public markets and hedge fund strategies. Career goal is quantitative trading or hedge fund analyst. Has experience with stock research and portfolio management simulations. Wants to mentor on public equity investing."
        ),
        # LITTLE_SIBLING registrations
        EventRegistrationsTable(
            user_id=23,  # emma
            event_id=4,
            role=EventRole.LITTLE_SIBLING,
            valid_registration=True,
            response_summary="Very interested in startup investing and venture capital. Want to learn about early-stage funding and evaluating startups. Career goal is to work in VC or start my own company someday."
        ),
        EventRegistrationsTable(
            user_id=25,  # sarah
            event_id=4,
            role=EventRole.LITTLE_SIBLING,
            valid_registration=True,
            response_summary="Interested in public markets and hedge funds. Want to learn about equity research and portfolio management. Career goal is to become a buy-side analyst or portfolio manager."
        ),
        EventRegistrationsTable(
            user_id=27,  # olivia
            event_id=4,
            role=EventRole.LITTLE_SIBLING,
            valid_registration=True,
            response_summary="Interested in hedge fund strategies and public equity investing. Want to learn about fundamental analysis and trading strategies. Aspiring to work at a hedge fund or asset management firm."
        )
    ]

    for registration in registrations:
        session.add(registration)
    session.commit()
    print("Dummy event registrations added.")

def create_user_profile_data(session):
    """
    Create profiles for all participants (26 users total)
    (Sungmin doesn't need a profile as org admin)
    """
    profiles = [
        # ===== KUNG FU TEA & PPMS EVENT PARTICIPANTS (1, 3-9) =====
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
        ),

        # ===== KSAP EVENT PARTICIPANTS (10-21) =====
        UserProfileTable(
            user_id=10,  # seojin
            gender="Female",
            class_year=ClassYear.JUNIOR,
            major="Korean Studies",
            hobbies=["K-pop Dancing", "Korean Cooking", "Korean Language", "Cultural Exchange"]
        ),
        UserProfileTable(
            user_id=11,  # jiwoo
            gender="Female",
            class_year=ClassYear.FRESHMAN,
            major="East Asian Studies",
            hobbies=["K-pop", "Korean Beauty", "Korean Dramas", "Korean Food"]
        ),
        UserProfileTable(
            user_id=12,  # minho
            gender="Male",
            class_year=ClassYear.SOPHOMORE,
            major="Psychology",
            hobbies=["Korean Music", "Korean Variety Shows", "Korean Street Food", "Photography"]
        ),
        UserProfileTable(
            user_id=13,  # yuna
            gender="Female",
            class_year=ClassYear.FRESHMAN,
            major="Business",
            hobbies=["K-pop Dance Covers", "Korean Fashion", "Korean Cafe Culture", "Social Media"]
        ),
        UserProfileTable(
            user_id=14,  # hyunwoo
            gender="Male",
            class_year=ClassYear.SENIOR,
            major="History",
            hobbies=["Korean History", "Traditional Korean Music", "Korean Literature", "Cultural Preservation"]
        ),
        UserProfileTable(
            user_id=15,  # suyeon
            gender="Female",
            class_year=ClassYear.SOPHOMORE,
            major="Music",
            hobbies=["Korean OSTs", "Korean Ballads", "Korean Home Cooking", "Korean Films"]
        ),
        UserProfileTable(
            user_id=16,  # daeho
            gender="Male",
            class_year=ClassYear.SENIOR,
            major="Anthropology",
            hobbies=["Korean Traditional Arts", "Korean Heritage", "Historical K-dramas", "Korean Philosophy"]
        ),
        UserProfileTable(
            user_id=17,  # eunji
            gender="Female",
            class_year=ClassYear.SOPHOMORE,
            major="Film Studies",
            hobbies=["Korean Cinema", "K-dramas", "Korean Directors", "Korean Cultural Analysis"]
        ),
        UserProfileTable(
            user_id=18,  # jaemin
            gender="Male",
            class_year=ClassYear.JUNIOR,
            major="Sociology",
            hobbies=["Korean Culture", "Korean Food Tours", "Korean Music Exploration", "Korean American Identity"]
        ),
        UserProfileTable(
            user_id=19,  # nari
            gender="Female",
            class_year=ClassYear.FRESHMAN,
            major="Communications",
            hobbies=["K-pop", "Korean Variety Shows", "Korean Social Media", "Korean Pop Culture"]
        ),
        UserProfileTable(
            user_id=20,  # sunho
            gender="Male",
            class_year=ClassYear.SOPHOMORE,
            major="Computer Science",
            hobbies=["Korean Hip-hop", "Korean Indie Music", "Korean Web Content", "Korean Gaming"]
        ),
        UserProfileTable(
            user_id=21,  # areum
            gender="Female",
            class_year=ClassYear.FRESHMAN,
            major="Marketing",
            hobbies=["Korean Cafe Culture", "K-pop", "Korean Netflix Series", "Korean Aesthetics"]
        ),

        # ===== PSV EVENT PARTICIPANTS (22-27) =====
        UserProfileTable(
            user_id=22,  # michael
            gender="Male",
            class_year=ClassYear.JUNIOR,
            major="Economics",
            hobbies=["Startup Pitch Competitions", "Tech Trends", "Entrepreneurship", "Venture Capital Research"]
        ),
        UserProfileTable(
            user_id=23,  # emma
            gender="Female",
            class_year=ClassYear.SOPHOMORE,
            major="Computer Science",
            hobbies=["Tech Startups", "Product Development", "Innovation", "Entrepreneurship"]
        ),
        UserProfileTable(
            user_id=24,  # james
            gender="Male",
            class_year=ClassYear.SENIOR,
            major="Finance",
            hobbies=["VC Industry Analysis", "Startup Ecosystems", "Angel Investing", "Technology Investing"]
        ),
        UserProfileTable(
            user_id=25,  # sarah
            gender="Female",
            class_year=ClassYear.SOPHOMORE,
            major="Economics",
            hobbies=["Stock Market Analysis", "Equity Research", "Financial Modeling", "Investment Banking"]
        ),
        UserProfileTable(
            user_id=26,  # ryan
            gender="Male",
            class_year=ClassYear.JUNIOR,
            major="Mathematics",
            hobbies=["Quantitative Trading", "Market Analysis", "Hedge Fund Strategies", "Financial Engineering"]
        ),
        UserProfileTable(
            user_id=27,  # olivia
            gender="Female",
            class_year=ClassYear.FRESHMAN,
            major="Finance",
            hobbies=["Public Markets", "Portfolio Management", "Value Investing", "Financial Markets"]
        )
    ]

    for profile in profiles:
        session.add(profile)
    session.commit()
    print("Dummy user profiles added.")

def create_question_data(session):
    """
    Create questions for all four events.

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

    KSAP Gajok Pairing event (4 questions):
    1. Multiple choice: What's your favorite type of Korean food?
    2. Multiple choice: What K-pop groups or Korean music do you enjoy?
    3. Text: What K-dramas have you watched or are you interested in?
    4. Text: What do you hope to get out of joining KSAP?

    PSV Mentorship event (4 questions):
    1. Multiple choice: What area of investing are you most interested in?
    2. Multiple choice: What are your career goals in finance/investing?
    3. Text: What's your experience level with investing?
    4. Text: What specific investing topics would you like to learn more about?
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
        ),

        # ===== KSAP GAJOK PAIRING EVENT QUESTIONS (event_id=3) =====
        QuestionTable(  # question_id=9
            question="What's your favorite type of Korean food?",
            options=["Korean BBQ", "Kimchi and Korean stews", "Tteokbokki and Korean fried chicken", "Bibimbap and traditional dishes", "Korean street food", "Korean fusion and modern cuisine"],
            event_id=3
        ),
        QuestionTable(  # question_id=10
            question="What K-pop groups or Korean music do you enjoy?",
            options=["BTS and IU", "Blackpink and Seventeen", "Traditional K-pop and ballads", "Korean OSTs and ballads", "Korean indie and hip-hop", "Variety of K-pop groups"],
            event_id=3
        ),
        QuestionTable(  # question_id=11
            question="What K-dramas have you watched or are you interested in?",
            event_id=3
        ),
        QuestionTable(  # question_id=12
            question="What do you hope to get out of joining KSAP?",
            event_id=3
        ),

        # ===== PSV MENTORSHIP EVENT QUESTIONS (event_id=4) =====
        QuestionTable(  # question_id=13
            question="What area of investing are you most interested in?",
            options=["Venture Capital and Startups", "Public Markets and Equities", "Hedge Funds", "Private Equity", "Real Estate", "Cryptocurrency and Alternative Assets"],
            event_id=4
        ),
        QuestionTable(  # question_id=14
            question="What are your career goals in finance/investing?",
            options=["Work at a venture capital firm", "Become a hedge fund analyst/PM", "Start my own company", "Work in investment banking", "Pursue quantitative trading", "Asset management"],
            event_id=4
        ),
        QuestionTable(  # question_id=15
            question="What's your experience level with investing?",
            event_id=4
        ),
        QuestionTable(  # question_id=16
            question="What specific investing topics would you like to learn more about?",
            event_id=4
        )
    ]

    for question in questions:
        session.add(question)
    session.commit()
    print("Dummy questions added.")

def create_response_data(session):
    """
    Create responses for all participants to enable clear pairings.

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

    KSAP Gajok Pairing pairings (groups of 4 with 2 bigs + 2 littles):
    - Group 1: Seojin (BIG) + Minho (BIG) + Jiwoo (LITTLE) + Yuna (LITTLE) - K-pop and Korean food enthusiasts
    - Group 2: Hyunwoo (BIG) + Daeho (BIG) + Suyeon (LITTLE) + Eunji (LITTLE) - K-drama and traditional culture fans
    - Group 3: Jaemin (BIG) + Sunho (BIG) + Nari (LITTLE) + Areum (LITTLE) - Mixed cultural interests

    PSV Mentorship pairings (groups of 3):
    - Group 1: Michael (BIG) + James (BIG) + Emma (LITTLE) - VC/startup investing focus
    - Group 2: Ryan (BIG) + Sarah (LITTLE) + Olivia (LITTLE) - Public markets/hedge fund focus
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
        ResponseTable(user_id=4, question_id=8, answer="Seeking guidance on psychiatry residency and mental health career paths."),

        # ===== KSAP GAJOK PAIRING EVENT RESPONSES =====
        # Group 1: K-pop and Korean food enthusiasts
        # Seojin's responses (BIG, user 10)
        ResponseTable(user_id=10, question_id=9, answer="Korean BBQ"),
        ResponseTable(user_id=10, question_id=10, answer="BTS and IU"),
        ResponseTable(user_id=10, question_id=11, answer="Squid Game, Crash Landing on You, The Glory"),
        ResponseTable(user_id=10, question_id=12, answer="I want to meet friends who share my love for Korean culture and K-pop!"),

        # Minho's responses (BIG, user 12)
        ResponseTable(user_id=12, question_id=9, answer="Tteokbokki and Korean fried chicken"),
        ResponseTable(user_id=12, question_id=10, answer="Blackpink and Seventeen"),
        ResponseTable(user_id=12, question_id=11, answer="Itaewon Class, Extraordinary Attorney Woo, Business Proposal"),
        ResponseTable(user_id=12, question_id=12, answer="Looking to build a strong Korean community at Princeton and share our culture."),

        # Jiwoo's responses (LITTLE, user 11)
        ResponseTable(user_id=11, question_id=9, answer="Korean BBQ"),
        ResponseTable(user_id=11, question_id=10, answer="BTS and IU"),
        ResponseTable(user_id=11, question_id=11, answer="Squid Game, Business Proposal, Vincenzo"),
        ResponseTable(user_id=11, question_id=12, answer="Want to learn more about Korean culture and make Korean friends who love K-pop!"),

        # Yuna's responses (LITTLE, user 13)
        ResponseTable(user_id=13, question_id=9, answer="Tteokbokki and Korean fried chicken"),
        ResponseTable(user_id=13, question_id=10, answer="Blackpink and Seventeen"),
        ResponseTable(user_id=13, question_id=11, answer="True Beauty, All of Us Are Dead, Twenty-Five Twenty-One"),
        ResponseTable(user_id=13, question_id=12, answer="Looking for Korean community and people who share my passion for K-pop and Korean food!"),

        # Group 2: K-drama and traditional culture fans
        # Hyunwoo's responses (BIG, user 14)
        ResponseTable(user_id=14, question_id=9, answer="Bibimbap and traditional dishes"),
        ResponseTable(user_id=14, question_id=10, answer="Traditional K-pop and ballads"),
        ResponseTable(user_id=14, question_id=11, answer="Reply 1988, My Mister, Guardian: The Lonely and Great God"),
        ResponseTable(user_id=14, question_id=12, answer="Want to share Korean culture and traditions with others and preserve our heritage."),

        # Daeho's responses (BIG, user 16)
        ResponseTable(user_id=16, question_id=9, answer="Kimchi and Korean stews"),
        ResponseTable(user_id=16, question_id=10, answer="Traditional K-pop and ballads"),
        ResponseTable(user_id=16, question_id=11, answer="Kingdom, Mr. Sunshine, The Red Sleeve"),
        ResponseTable(user_id=16, question_id=12, answer="Looking to preserve Korean heritage and connect with others interested in traditional culture."),

        # Suyeon's responses (LITTLE, user 15)
        ResponseTable(user_id=15, question_id=9, answer="Bibimbap and traditional dishes"),
        ResponseTable(user_id=15, question_id=10, answer="Korean OSTs and ballads"),
        ResponseTable(user_id=15, question_id=11, answer="Reply 1988, Hospital Playlist, When the Camellia Blooms"),
        ResponseTable(user_id=15, question_id=12, answer="Want to connect with my Korean roots and learn about traditional Korean culture."),

        # Eunji's responses (LITTLE, user 17)
        ResponseTable(user_id=17, question_id=9, answer="Kimchi and Korean stews"),
        ResponseTable(user_id=17, question_id=10, answer="Korean OSTs and ballads"),
        ResponseTable(user_id=17, question_id=11, answer="Parasite, Burning, The Handmaiden, historical dramas"),
        ResponseTable(user_id=17, question_id=12, answer="Looking to learn about Korean heritage and connect with Korean culture through film and drama."),

        # Group 3: Mixed cultural interests
        # Jaemin's responses (BIG, user 18)
        ResponseTable(user_id=18, question_id=9, answer="Korean street food"),
        ResponseTable(user_id=18, question_id=10, answer="Variety of K-pop groups"),
        ResponseTable(user_id=18, question_id=11, answer="Mix of everything - from classics like Reply 1988 to modern shows like Squid Game"),
        ResponseTable(user_id=18, question_id=12, answer="Want to explore all aspects of Korean culture with open-minded peers."),

        # Sunho's responses (BIG, user 20)
        ResponseTable(user_id=20, question_id=9, answer="Korean fusion and modern cuisine"),
        ResponseTable(user_id=20, question_id=10, answer="Korean indie and hip-hop"),
        ResponseTable(user_id=20, question_id=11, answer="Variety shows, web dramas, Netflix Korean series"),
        ResponseTable(user_id=20, question_id=12, answer="Looking to connect with my Korean American identity and explore modern Korean culture."),

        # Nari's responses (LITTLE, user 19)
        ResponseTable(user_id=19, question_id=9, answer="Korean street food"),
        ResponseTable(user_id=19, question_id=10, answer="Variety of K-pop groups"),
        ResponseTable(user_id=19, question_id=11, answer="Watch various dramas and variety shows - love exploring different genres!"),
        ResponseTable(user_id=19, question_id=12, answer="Want to explore Korean culture with peers and try everything Korean has to offer!"),

        # Areum's responses (LITTLE, user 21)
        ResponseTable(user_id=21, question_id=9, answer="Korean fusion and modern cuisine"),
        ResponseTable(user_id=21, question_id=10, answer="Korean indie and hip-hop"),
        ResponseTable(user_id=21, question_id=11, answer="Netflix Korean series, web content, and modern K-dramas"),
        ResponseTable(user_id=21, question_id=12, answer="Looking for Korean American community and people interested in contemporary Korean culture."),

        # ===== PSV MENTORSHIP EVENT RESPONSES =====
        # Group 1: VC/startup investing focus
        # Michael's responses (BIG, user 22)
        ResponseTable(user_id=22, question_id=13, answer="Venture Capital and Startups"),
        ResponseTable(user_id=22, question_id=14, answer="Work at a venture capital firm"),
        ResponseTable(user_id=22, question_id=15, answer="Participated in startup pitch competitions and conducted angel investing research. Analyzed early-stage companies and their business models."),
        ResponseTable(user_id=22, question_id=16, answer="Early-stage valuation, due diligence processes, startup ecosystem dynamics, and venture capital fund structures."),

        # James's responses (BIG, user 24)
        ResponseTable(user_id=24, question_id=13, answer="Venture Capital and Startups"),
        ResponseTable(user_id=24, question_id=14, answer="Work at a venture capital firm"),
        ResponseTable(user_id=24, question_id=15, answer="Interned at a seed-stage fund. Evaluated startup pitches and conducted market research on emerging technologies."),
        ResponseTable(user_id=24, question_id=16, answer="VC deal sourcing, startup pitch evaluation, portfolio management, and emerging tech trends in AI and biotech."),

        # Emma's responses (LITTLE, user 23)
        ResponseTable(user_id=23, question_id=13, answer="Venture Capital and Startups"),
        ResponseTable(user_id=23, question_id=14, answer="Start my own company"),
        ResponseTable(user_id=23, question_id=15, answer="Very interested in learning about startup investing. Read startup case studies and follow VC news. Want to understand how VCs evaluate companies."),
        ResponseTable(user_id=23, question_id=16, answer="How to evaluate early-stage startups, understanding term sheets, fundraising strategies, and building relationships with VCs."),

        # Group 2: Public markets/hedge fund focus
        # Ryan's responses (BIG, user 26)
        ResponseTable(user_id=26, question_id=13, answer="Hedge Funds"),
        ResponseTable(user_id=26, question_id=14, answer="Pursue quantitative trading"),
        ResponseTable(user_id=26, question_id=15, answer="Experience with stock research and portfolio management simulations. Built quantitative models and analyzed market data."),
        ResponseTable(user_id=26, question_id=16, answer="Quantitative strategies, risk management, portfolio optimization, and systematic trading approaches."),

        # Sarah's responses (LITTLE, user 25)
        ResponseTable(user_id=25, question_id=13, answer="Public Markets and Equities"),
        ResponseTable(user_id=25, question_id=14, answer="Become a hedge fund analyst/PM"),
        ResponseTable(user_id=25, question_id=15, answer="Learning about equity research and fundamental analysis. Follow public markets and practice stock valuation methods."),
        ResponseTable(user_id=25, question_id=16, answer="Equity research methodologies, fundamental analysis, portfolio management, and how to build investment theses."),

        # Olivia's responses (LITTLE, user 27)
        ResponseTable(user_id=27, question_id=13, answer="Hedge Funds"),
        ResponseTable(user_id=27, question_id=14, answer="Become a hedge fund analyst/PM"),
        ResponseTable(user_id=27, question_id=15, answer="Interested in hedge fund strategies and public equity investing. Read investment research and follow market trends."),
        ResponseTable(user_id=27, question_id=16, answer="Fundamental analysis, trading strategies, market indicators, and understanding different hedge fund strategies like long/short equity.")
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
        CREATING DEMO CASE 3 DATA (4 EVENTS: KUNG FU TEA, PPMS, KSAP, PSV) IN 3 SEC...
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
