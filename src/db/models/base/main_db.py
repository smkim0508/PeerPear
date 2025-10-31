# the main database holding core users, organization, and pairing data
from __future__ import annotations
import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# A dedicated Base for all models that map to tables in the Main database.
class MainDB_Base(DeclarativeBase):
    pass

def create_engine_and_sessionmaker(db_url: str):

    engine = create_engine(
        db_url,
        connect_args={"sslmode": "require"},
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        echo=False,
    )

    SessionLocal = sessionmaker(
        bind=engine,
        autoflush=False,
        autocommit=False,
        expire_on_commit=False,
    )

    return engine, SessionLocal

    # NOTE: deprecated async engine below.
    # engine = create_async_engine(
    #     db_url,
    #     connect_args={"ssl": "require"},
    #     pool_pre_ping=True,
    #     pool_size=10,
    #     max_overflow=20,
    #     echo=False,
    # )
    # SessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    # return engine, SessionLocal