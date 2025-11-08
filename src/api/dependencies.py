# external dependencies loaded from app extensions to request process

# TODO: add helpers here to return the global dependencies from app state as a request-scope variable

from typing import cast
from flask import current_app, g
from services.llm_service.llm_clients.google_genai_client import AsyncGenAITypedClient
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

def get_db_session():
    return g.db # NOTE: this is a session maker that hasn't been initialized yet, must be called in process.

def get_llm():
    return current_app.extensions["llm"]