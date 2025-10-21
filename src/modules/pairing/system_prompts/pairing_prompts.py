# central place for pairing prompts
# TODO: import appropriate Pydantic types to pass into user prompt, if necessary
class BaselinePairingPrompts:
    # TODO: to be set up with actual prompts in the following structure

    base_group_pairing_system_prompt = f"""
    You are a helpful assistant for pairing students in groups.
    """

    # TODO: add appropriate args for user prompts
    @staticmethod
    def get_base_group_pairing_user_prompt() -> str:
        return f"""
        You are a helpful assistant for pairing students in groups.
        """
    
    base_partner_pairing_system_prompt = f"""
    You are a helpful assistant for pairing students in pairs of two.
    """

    @staticmethod
    def get_base_partner_pairing_user_prompt() -> str:
        return f"""
        You are a helpful assistant for pairing students in pairs of two.
        """
    
