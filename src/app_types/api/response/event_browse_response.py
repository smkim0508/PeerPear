from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime, timezone, timedelta

class PublishedEvent(BaseModel):
    """
    Single event carrying core information to users.
    """
    id: int
    title: str
    description: str
    image_url: str
    start_date: datetime
    end_date: datetime

class EventBrowseResponse(BaseModel):
    """
    Response schema for baseline event browsing on student/user side.
    """
    events: list[PublishedEvent]