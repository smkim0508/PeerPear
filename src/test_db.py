from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os

load_dotenv()
MAIN_DB_USER = os.getenv("MAIN_DB_USER")
MAIN_DB_PASSWORD = os.getenv("MAIN_DB_PASSWORD")
MAIN_DB_HOST = os.getenv("MAIN_DB_HOST")
MAIN_DB_PORT = os.getenv("MAIN_DB_PORT")
MAIN_DB_NAME = os.getenv("MAIN_DB_NAME")
db_url = DATABASE_URL = f"postgresql+psycopg2://{MAIN_DB_USER}:{MAIN_DB_PASSWORD}@{MAIN_DB_HOST}:{MAIN_DB_PORT}/{MAIN_DB_NAME}?sslmode=require"

if db_url is None:
    print("❌ MAIN_DB_URL_SYNC is not set")
    exit(1)

print(f"Connecting to {db_url}")

engine = create_engine(db_url, echo=True)

try:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        print("✅ Connection successful, result:", result.scalar())
except Exception as e:
    print("❌ Connection failed:", e)
