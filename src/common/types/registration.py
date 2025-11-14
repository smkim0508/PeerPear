from pydantic import BaseModel
from datetime import datetime, timezone
from enum import Enum
from common.types.user import User
from common.types.event_enums import EventStatus, EventRole

# enums to represent event status
class EventRegistration(BaseModel):
    id: int
    event_id: int
    user_id: int
    created_at: datetime
    role: EventRole | None = None
    valid_registration: bool