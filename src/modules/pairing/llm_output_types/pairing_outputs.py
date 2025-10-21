# structured LLM outputs for pairing
from pydantic import BaseModel
from typing import Optional

class PairingOutput(BaseModel):
    """
    implement more pairing outputs for each specific use case, following this general format
    make specific Pydantic types to auto validate LLM outputs, since the LLM client will use "strict" settings to output exact JSON structure
    NOTE: use Optional to mark optional fields; LLMs can parse 'Optional' to directly output None
    """
    pass # TODO: to be implemented once we get to LLM outputs