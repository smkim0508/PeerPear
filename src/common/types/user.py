# canonical DTO for a user with their preferences
from pydantic import BaseModel

# TODO: build this out based on our intended central user profile
class UserProfile(BaseModel):
    name: str
    email: str
    preferneces: list[str]