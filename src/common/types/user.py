# canonical DTO for a user with their preferences
from pydantic import BaseModel
from typing import Optional
from enum import Enum

# internal mapping for class year, including grad, alum, prof for future uses.
class ClassYear(Enum):
    FRESHMAN = "Freshman"
    SOPHOMORE = "Sophomore"
    JUNIOR = "Junior"
    SENIOR = "Senior"
    GRADUATE = "Graduate"
    ALUMNI = "Alumni"
    PROFESSOR = "Professor"

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
    class_year: ClassYear
    major: Optional[str] = None
    hobbies: list[str] # NOTE: technically could be NULLable, but right now we defined it as non-nullable