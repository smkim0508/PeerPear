from pydantic import BaseModel
from datetime import datetime, timezone
from common.types.user import User

class PairedGroup(BaseModel):
    """
    Representation for a single paired group.
    Couple be any number of students, represented by ids and names.
    """
    students: list[User]


class PairingResult(BaseModel):
    """
    Canonical representation for pairing results.
    Groups of two or more students.
    """
    groups: list[PairedGroup]


class PairingEvent(BaseModel):
    """
    Canonical representation for an event for group/partner pairing.
    """
    id: int
    organization_id: int
    title: str
    description: str
    organization_name: str
    image_url: str  # TODO: not currently present in DB
    start_date: datetime
    end_date: datetime
    active: bool
    participants: list[int]  # list of user ids
    matches: PairingResult
