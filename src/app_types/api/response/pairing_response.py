from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime, timezone, timedelta
from common.types.pairing import PairedGroup, PairingResult
from common.types.user import User, UserProfile

class PairingResponse(BaseModel):
    """
    Pairing results for a specific event.
    """
    event_id: int
    pairing_results: PairingResult
    