# canonical DTO for a user with their preferences
from pydantic import BaseModel

# TODO: build this out based on our intended central user profile

class UserProfileFull(BaseModel):
    """
    Full user profile with all relevant information, mapped 1-to-1 with the form responses.
    TODO: add more fields as we build the form.
    """
    id: int
    name: str
    email: str
    phone_number: str
    preferences: list[str]
    major: str # maybe store major as an enum to validate
    profile_summary: str

class UserProfile(BaseModel):
    """
    User profile carrying basic information and semantically-parsed profile summary
    """
    id: int
    name: str
    profile_summary: str

class User(BaseModel):
    """
    Lightweight representation of a single user, which holds just their id and name
    """
    id: int
    name: str