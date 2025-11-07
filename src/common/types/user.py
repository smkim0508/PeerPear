# canonical DTO for a user with their preferences
from pydantic import BaseModel
from typing import Optional

class UserProfile(BaseModel):
    """
    Canonical DTO for User Profile, as defined by the updable central profile
    """
    id: int
    user_name: Optional[str] = None
    first_name: str
    last_name: str
    email: str
    phone_number: Optional[str] = None
    gender: Optional[str] = None
    class_year: int
    major: Optional[str] = None
    hobbies: list[str] # NOTE: technically could be NULLable, but right now we defined it as non-nullable