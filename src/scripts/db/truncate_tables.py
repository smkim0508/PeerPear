from db.models.base import MainDB_Base
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import time
from db.models.events import EventTable, EventRegistrationsTable
from db.models.organizations import OrganizationTable
from db.models.user import UserTable
from db.models.user_profile import UserProfileTable
from db.models.question import QuestionTable
from db.models.response import ResponseTable
from db.models.orgadmin import OrgAdminTable
from db.models.orgadmin_requests import OrgAdminRequestTable

from dotenv import load_dotenv
import os

def truncate_all_tables(engine):
    """
    NOTE: this trunscates all data while preserving schema. 
    This is much faster than complete deletion and recreation of tables.
    """
    print(f"WARNING: THIS WILL TRUNCATE/RESET **ALL** TABLES IN THE MAIN DB IN 5 SECONDS, PLEASE DOUBLE CHECK!!")
    time.sleep(5)
    print(f"Resetting all tables now...")

    table_names = [table.name for table in MainDB_Base.metadata.sorted_tables]
    tables_csv = ", ".join(table_names)

    stmt = text(f"TRUNCATE TABLE {tables_csv} RESTART IDENTITY CASCADE")

    with engine.begin() as conn:
        conn.execute(stmt)
