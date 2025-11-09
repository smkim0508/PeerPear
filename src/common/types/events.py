from pydantic import BaseModel
from datetime import datetime, timezone
from enum import Enum

# enums to represent event status


class EventStatus(Enum):
    NOT_STARTED = "NOT_STARTED"
    STARTED = "STARTED"
    TERMINATED = "TERMINATED"
    PAIRING_PUBLISHED = "PAIRING_PUBLISHED"


# enums to represent event roles, currently big and little siblings
class EventRole(Enum):
    BIG_SIBLING = "big_sibling"
    LITTLE_SIBLING = "little_sibling"


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
    organization_name: str
    image_url: str  # TODO: not currently present in DB
    end_date: datetime
    status: EventStatus
    participants: list[int]  # list of user ids
    matches: PairingResult
