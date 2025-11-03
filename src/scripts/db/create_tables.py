from db.models.base import MainDB_Base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import time

from dotenv import load_dotenv
import os

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

    # warn users if they don't want to commit this action
    print(
        f"""
        CREATING ALL TABLES WITH FOR MAIN DB IN 3 SEC...
        PLEASE ABORT NOW IF YOU'D LIKE TO STOP!!!
        """
    )
    time.sleep(3)

    MainDB_Base.metadata.create_all(engine)
    print("Tables created successfully!")