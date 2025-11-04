# structured LLM outputs for pairing
from pydantic import BaseModel
from typing import Optional

"""
TODO: Implement more pairing outputs for each specific use case, following this general format.
- Make specific Pydantic types to auto validate LLM outputs, since the LLM client will use "strict" settings to output exact JSON structure
NOTE: Use Optional to mark optional fields; LLMs can parse 'Optional' to directly output None
"""

class PairingLLMOutput(BaseModel):
    """
    Structured LLM Output for Pairing.
    This will include a nested list of integer student ids, where inner list represents one valid group.
    """
    groups: list[list[int]]
    reasoning: str