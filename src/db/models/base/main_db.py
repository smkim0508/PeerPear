# the main database holding core users, organization, and pairing data
from sqlalchemy.orm import declarative_base

# A dedicated Base for all models that map to tables in the Main database.
MainDB_Base = declarative_base()