from datetime import datetime, time, timedelta
from requests import Session
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import time
import os

from db.models.events import EventTable, EventRegistrationsTable
from db.models.organizations import OrganizationTable
from db.models.user import UserTable
from db.models.user_profile import UserProfileTable
from db.models.question import QuestionTable
from db.models.response import ResponseTable
from db.models.orgadmin import OrgAdminTable
from db.models.orgadmin_requests import OrgAdminRequestTable

from scripts.db.create_tables import create_all_tables
from scripts.db.delete_tables import delete_all_tables, delete_table, delete_all_tables_ordered

if __name__ == "__main__":
    load_dotenv()
    MAIN_DB_USER = os.getenv("MAIN_DB_USER")
    MAIN_DB_PASSWORD = os.getenv("MAIN_DB_PASSWORD")
    MAIN_DB_HOST = os.getenv("MAIN_DB_HOST")
    MAIN_DB_PORT = os.getenv("MAIN_DB_PORT")
    MAIN_DB_NAME = os.getenv("MAIN_DB_NAME")

    # Get DEMO_CASE environment variable (defaults to "1")
    DEMO_CASE = str(os.getenv("DEMO_CASE", "1"))

    # Import the appropriate demo testing module based on DEMO_CASE
    if DEMO_CASE == "1":
        from scripts.db.update_dummy_vals_demo_testing_case1 import fill_all_tables
        print("Using DEMO_CASE 1: 6 students with Jocelyn")
    elif DEMO_CASE == "2":
        from scripts.db.update_dummy_vals_demo_testing_case2 import fill_all_tables
        print("Using DEMO_CASE 2: 4 students with Sungmin as admin")
    elif DEMO_CASE == "3":
        from scripts.db.update_dummy_vals_demo_testing_case3 import fill_all_tables
        print("Using DEMO_CASE 3: Kung Fu Tea Pairing & PPMS Premed Mentorship (8 students, 2 events)")
    else:
        print(f"Invalid DEMO_CASE value: {DEMO_CASE}. Defaulting to DEMO_CASE 1.")
        from scripts.db.update_dummy_vals_demo_testing_case1 import fill_all_tables

    MAIN_DB_URL = f"postgresql+psycopg2://{MAIN_DB_USER}:{MAIN_DB_PASSWORD}@{MAIN_DB_HOST}:{MAIN_DB_PORT}/{MAIN_DB_NAME}?sslmode=require"

    assert MAIN_DB_URL, "MAIN_DB_URL is not set"

    try:
        engine = create_engine(MAIN_DB_URL)
    except Exception as e:
        print(f"Error connecting to database: {e}")
        exit(1)

    # NOTE: this scripts resets db by deleting, creating, and filling in dummy values
    # delete_all_tables_ordered(engine)
    delete_all_tables(engine)
    create_all_tables(engine)
    fill_all_tables(engine)
