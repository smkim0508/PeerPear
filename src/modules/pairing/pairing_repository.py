from typing import Optional
from services.llm_service.llm_clients.google_genai_client import AsyncGenAITypedClient
from sqlalchemy.orm import Session

class PairingRepository():
    """
    A session-lived repository to hold all global dependencies, to cleanly wrap around flask's g.
    This repository will be used for a pairing request.
    NOTE: currently just db session and llm client.
    """
    def __init__(
        self,
        main_db_session,
        llm_client
    ):
        self.db_session: Session = main_db_session
        self.llm_client: AsyncGenAITypedClient = llm_client