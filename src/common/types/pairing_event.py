from pydantic import BaseModel
from datetime import datetime, timezone
from enum import Enum
from common.types.user import User
from common.types.organization import OrganizationProfile
from typing import Optional

# enums to represent event status
class EventStatus(Enum):
    NOT_STARTED = "NOT_STARTED"
    STARTED = "STARTED"
    TERMINATED = "TERMINATED"
    PAIRING_PUBLISHED = "PAIRING_PUBLISHED"

# enums to represent event roles, currently big and little siblings
class EventRole(Enum):
    BIG_SIBLING = "BIG_SIBLING"
    LITTLE_SIBLING = "LITTLE_SIBLING"

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
    llm_reasoning: Optional[str] = None

class PairingEvent(BaseModel):
    """
    Canonical DTO representation for an event w/ group/partner pairing.
    """
    id: Optional[int] = None # missing at creation time since db autoincrements
    organization_id: int
    title: str
    description: str
    # organization: Optional[OrganizationProfile] = None
    image_url: Optional[str] = None  # TODO: not currently present in DB
    end_date: datetime
    status: EventStatus
    participants: Optional[list[int]] = None # list of user ids
    matches: Optional[PairingResult] = None
