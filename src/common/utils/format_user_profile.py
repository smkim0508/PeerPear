# universal helper to easily format user profile to the DTO object
from pydantic import BaseModel
from typing import TypeVar, Generic, Optional
from common.types.user import UserProfile, UserPairingInformation, User

def format_user_profile_summary(
    major: str,
    hobbies: list[str],
    general_profile_summary: Optional[str] = None
) -> str:
    """
    Converts user profile information into a templated-filled string.
    Major and hobbies should be provided, but the general profile summary is optional.
    """

    profile_information = f"""
    This user's hobbies are:
    {", ".join(hobbies)}
    This user's university major is:
    {major}
    """

    # if profile summary exists, then append it
    if general_profile_summary:
        profile_information += f"""
        This user's general profile summary is: {general_profile_summary}
        """

    return profile_information
