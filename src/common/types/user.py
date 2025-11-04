# canonical DTO for a user with their preferences
from pydantic import BaseModel

# TODO: build this out based on our intended central user profile
class UserProfile(BaseModel):
    id: int
    name: str
    email: str
    preferences: list[str]

class User(BaseModel):
    """
    Lightweight representation of a single user, which holds just their id and name
    """
    id: int
    name: str