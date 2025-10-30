from pydantic import BaseModel
from datetime import datetime, timezone

class PairingResult(BaseModel):
    """
    Canonical representation for pairing results.
    Groups of two or more students by ids.
    """
    groups: list[list[int]]

class PairingEvent(BaseModel):
    """
    Canonical representation for an event for group/partner pairing.
    """
    id: int
    organization_id: int
    title: str
    description: str
    image_url: str # TODO: not currently present in DB
    start_date: datetime
    end_date: datetime
    is_active: bool
    participants: list[int] # list of user ids
    matches: PairingResult