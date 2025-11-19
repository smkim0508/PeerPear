# universal helper to easily format user profile to the DTO object
from pydantic import BaseModel
from typing import TypeVar, Generic, Optional
from common.types.user import UserProfile, UserProfileFull, User

def format_user_profile(
    major: str,
    hobbies: list[str],
    profile_summary: Optional[str] = None
) -> str:
    """
    Converts user profile information into a templated-filled string.
    Major and hobbies should be provided, but profile summary is optional.
    """

    profile_information = f"""
    This user's hobbies are:
    {", ".join(hobbies)}
    This user's university major is:
    {major}
    """

    # if profile summary exists, then append it
    if profile_summary:
        profile_information += f"""
        This user's general profile summary is: {profile_summary}
        """

    return profile_information
