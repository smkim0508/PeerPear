from db.models.base import MainDB_Base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import time
from db.models.events import EventTable
from db.models.organizations import OrganizationTable
from db.models.user import UserTable
from db.models.user_profile import UserProfileTable
from db.models.question import QuestionTable
from db.models.response import ResponseTable
from db.models.orgadmin import OrgAdminTable
from db.models.orgadmin_requests import OrgAdminRequestTable

from dotenv import load_dotenv
import os

def create_all_tables(engine):
    # warn users if they don't want to commit this action
    print(
        f"""
        CREATING ALL TABLES WITH FOR MAIN DB IN 3 SEC...
        PLEASE ABORT NOW IF YOU'D LIKE TO STOP!!!
        """
    )
    time.sleep(3)

    MainDB_Base.metadata.create_all(engine, checkfirst=True)
    print("Tables created successfully!")

def create_table(table_name, engine):
    print(f"WARNING: THIS WILL CREATE TABLE *{table_name}* IN THE MAIN DB (IF IT DOESN'T EXIST ALREADY) IN 3 SECONDS, PLEASE DOUBLE CHECK!!")
    time.sleep(3)
    
    try:
        table = MainDB_Base.metadata.tables[table_name]
    except KeyError:
        raise ValueError(f"Table '{table_name}' not found in metadata")

    table.create(engine, checkfirst=True)
    print(f"Created table {table_name}")
    
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

    # create_all_tables(engine)
    create_table("org_admin_requests", engine)
