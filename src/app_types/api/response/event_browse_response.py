from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime, timezone, timedelta
from common.types.events import EventStatus


class PublishedEvent(BaseModel):
    """
    Single event carrying core information to users.
    """
    id: int
    title: str
    description: str
    image_url: str
    organization_name: str
    end_date: datetime
    status: EventStatus

    class Config:
        use_enum_values = True  


class EventBrowseResponse(BaseModel):
    """
    Response schema for baseline event browsing on student/user side.
    """
    events: list[PublishedEvent]
