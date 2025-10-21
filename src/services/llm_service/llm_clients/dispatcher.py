# dispatcher for LLM clients, currently only Google Vertex AI, but scalable to other LLM providers

from enum import Enum, auto
from typing import Type, TypeVar
from pydantic import BaseModel
from .protocols import TypedLLMProtocol

PydanticModel = TypeVar("PydanticModel", bound=BaseModel)

class LLMProvider(Enum):
    VERTEX = auto()

class TypedLLMClient:
    def __init__(self, provider: LLMProvider, client: TypedLLMProtocol):
        self.provider = provider
        self.client = client

    async def acreate(
        self,
        response_model: Type[PydanticModel],
        system_prompt: str,
        user_prompt: str,
        **kwargs
    ) -> PydanticModel:
        return await self.client.acreate(
            response_model=response_model,
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            **kwargs
        )