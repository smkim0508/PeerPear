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

def delete_all_tables_ordered(engine):
    """Delete tables in dependency order"""
    print("WARNING: Deleting all tables in 5 seconds...")
    time.sleep(5)
    
    # drop in reverse dependency order (children first, parents last)
    tables_in_order = [
        "responses", # depends on questions & users
        "questions", # depends on events
        "event_registrations", # depends on events & users
        "events", # depends on organizations
        "user_profiles", # depends on users
        "orgadmins", # depends on users & organizations
        "org_admin_requests", # depends on users & organizations
        "users", # referenced by many tables
        "organizations", # referenced by events
    ]
    
    for table_name in tables_in_order:
        try:
            print(f"Dropping {table_name}...")
            table = MainDB_Base.metadata.tables[table_name]
            table.drop(engine, checkfirst=True)
            print(f"SUCCESS: Dropped {table_name}")
        except Exception as e:
            print(f"WARNING: Error dropping {table_name}: {e}")

# helper to delete all tables
def delete_all_tables(engine):
    print(list(MainDB_Base.metadata.tables.keys()))
    print(f"WARNING: THIS WILL DELETE **ALL** TABLES IN THE MAIN DB IN 5 SECONDS, PLEASE DOUBLE CHECK!!")
    time.sleep(5)
    print(f"Dropping all tables now...")

    # Set statement timeout to prevent hanging
    with engine.connect() as conn:
        conn.execute(text("SET statement_timeout = '30s';"))
        conn.commit()

    try:
        MainDB_Base.metadata.drop_all(engine, checkfirst=True)
    except Exception as e:
        print(f"Error: {e}")
        print("Trying alternative method...")
        
        # Fallback: drop each table individually with CASCADE
        for table_name in reversed(list(MainDB_Base.metadata.tables.keys())):
            try:
                with engine.connect() as conn:
                    conn.execute(text(f"DROP TABLE IF EXISTS {table_name} CASCADE;"))
                    conn.commit()
                print(f"SUCCESS: Dropped {table_name}")
            except Exception as e2:
                print(f"WARNING: Error dropping {table_name}: {e2}")

# helper to delete a single table
def delete_table(table_name, engine):
    print(f"WARNING: THIS WILL DELETE TABLE *{table_name}* IN THE MAIN DB IN 5 SECONDS, PLEASE DOUBLE CHECK!!")
    time.sleep(5)
    
    try:
        print(f"Dropping table {table_name} now...")
        table = MainDB_Base.metadata.tables[table_name]
    except KeyError:
        raise ValueError(f"Table '{table_name}' not found in metadata")

    table.drop(engine)
    print(f"Dropped table {table_name}")

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
    # delete_table("event_registrations", engine)
    # delete_table("orgadmins", engine)
    # delete_table("users", engine)
    # delete_table("user_profiles", engine)
    # delete_table("organizations", engine)
    # delete_table("org_admin_requests", engine)
    # delete_table("questions", engine)
    # delete_table("responses", engine)
    # delete_table("events", engine)
