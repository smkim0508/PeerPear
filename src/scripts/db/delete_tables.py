from db.models.base import MainDB_Base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import time
from db.models.events import EventTable, EventRegistrationsTable
from db.models.organizations import OrganizationTable
from db.models.user import UserTable
from db.models.user_profile import UserProfileTable
from db.models.question import QuestionTable
from db.models.response import ResponseTable
from db.models.orgadmin import OrgAdminTable

from dotenv import load_dotenv
import os

# helper to delete all tables
def delete_all_tables(engine):
    print(list(MainDB_Base.metadata.tables.keys()))
    print(f"WARNING: THIS WILL DELETE ALL TABLES IN THE MAIN DB IN 5 SECONDS, PLEASE DOUBLE CHECK!!")
    time.sleep(5)
    MainDB_Base.metadata.drop_all(engine)

# helper to delete a single table
def delete_table(table_name, engine):
    print(f"WARNING: THIS WILL DELETE TABLE {table_name} IN THE MAIN DB IN 5 SECONDS, PLEASE DOUBLE CHECK!!")
    time.sleep(5)
    table = getattr(MainDB_Base, table_name)
    table.__table__.drop(engine)

if __name__ == "__main__":
    # one-off script to create tables
    load_dotenv()
    MAIN_DB_USER = os.getenv("MAIN_DB_USER")
    MAIN_DB_PASSWORD = os.getenv("MAIN_DB_PASSWORD")
    MAIN_DB_HOST = os.getenv("MAIN_DB_HOST")
    MAIN_DB_PORT = os.getenv("MAIN_DB_PORT")
    MAIN_DB_NAME = os.getenv("MAIN_DB_NAME")

    # (postgresql+asyncpg...) in the future for truly async application
    # MAIN_DB_URL = f"postgresql+psycopg2://{MAIN_DB_USER}:{MAIN_DB_PASSWORD}@{MAIN_DB_HOST}:{MAIN_DB_PORT}/{MAIN_DB_NAME}"
    MAIN_DB_URL = f"postgresql+psycopg2://{MAIN_DB_USER}:{MAIN_DB_PASSWORD}@{MAIN_DB_HOST}:{MAIN_DB_PORT}/{MAIN_DB_NAME}?sslmode=require"

    assert MAIN_DB_URL, "MAIN_DB_URL is not set"

    try:
        engine = create_engine(MAIN_DB_URL)
    except Exception as e:
        print(f"Error connecting to database: {e}")
        exit(1)

    # NOTE: change below to determine which table(s) to delete
    delete_all_tables(engine)
    # delete_table("user", engine)