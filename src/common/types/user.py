# canonical DTO for a user with their preferences
from pydantic import BaseModel
from typing import Optional
from enum import Enum
from common.types.event_enums import EventStatus, EventRole

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
    Full user profile with all relevant information, mapped 1-to-1 with the form responses (except for summary).
    TODO: add more fields as we build the form.
    """
    id: int
    user_name: Optional[str] = None
    first_name: str
    last_name: str
    email: str
    phone_number: Optional[str] = None
    gender: Optional[str] = None
    class_year: ClassYear | None = None
    major: Optional[str] = None
    hobbies: list[str] # NOTE: technically could be nullable but right now we define it as non-nullable
    profile_summary: Optional[str] = None

class UserPairingInformation(BaseModel):
    """
    User profile carrying basic information and semantically-parsed profile summary.
    NOTE: this is the actual user profile that will be given to LLM as context.
    """
    id: int
    name: str
    email: str
    role: Optional[EventRole] = None
    profile_summary: str # main information used for pairing
    questionniare_response_summary: Optional[str] = None # supplementary information, if available

class User(BaseModel):
    """
    Lightweight representation of a single user, which holds just their id, name, email.
    NOTE: this is technically a shallow copy of the UserPairingInformation class without summary.
    """
    id: int
    name: str
    email: str
    role: Optional[EventRole] = None
