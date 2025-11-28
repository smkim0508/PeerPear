# central place for pairing prompts
import json
from common.types.user import User, UserProfile, UserPairingInformation
from typing import Optional

class BigLittlePairingPrompts:
    """
    Specialized sets of pairing prompts for big and little sibling pairings.
    Considers the baseline and questionnaire versions with additional context for handling big/little roles when forming groups.
    NOTE: each new specialization of pairing prompt will result in a new class for organization.
    """

    big_little_base_group_pairing_system_prompt = f"""
    
    """

    @staticmethod
    def get_big_little_base_group_pairing_user_prompt(
        group_size: int,
        event_description: str,
        students: list[UserPairingInformation]
    ) -> str:
        return f"""
        pass
        """