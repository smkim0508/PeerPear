# The core async set up for Google's GenAI LLM client
# NOTE: Can be swapped for different LLM providers if necessary

from typing import Type
from pydantic import BaseModel, ValidationError
# use tenacity to retry when desired
from tenacity import AsyncRetrying, stop_after_attempt, wait_fixed, retry_if_exception_type

from google import genai  # officially recommended import path

from .protocols import PydanticModel, TypedLLMProtocol, ProvidesProviderInfo
from .protocols import RateLimitProvider
import asyncio
from concurrent.futures import ThreadPoolExecutor

# NOTE: this uses the public Gemini API with an API key, not Vertex AI.
# Set up this client with API key during app initialization
# TODO: "strict" JSON/Pydantic output is only supported for Vertex AI clients; set up manual validation to catch malformed JSON outputs before crashing Pydantic validation, or loosen validation.
class AsyncGenAITypedClient(TypedLLMProtocol, ProvidesProviderInfo):
    def __init__(
        self,
        model_name: str = "gemini-2.0-flash", # given from documentation, could be swapped depending on rate limits / pricing
        *,
        api_key: str | None = None, 
        retry_attempts: int = 2,
        retry_wait: float = 0.1,
        retry_on: type[Exception] = ValidationError, # only retry when LLM fails to meet Pydantic validation
    ):
        self.client = genai.Client(api_key=api_key)
        self.model_name = model_name
        # Provider metadata for reporting
        self.provider = RateLimitProvider.GOOGLE
        self.model = model_name
        self.retryer = AsyncRetrying(
            stop=stop_after_attempt(retry_attempts),
            wait=wait_fixed(retry_wait),
            retry=retry_if_exception_type(retry_on),
            reraise=True,
        )

    async def acreate(
        self,
        response_model: Type[PydanticModel],
        system_prompt: str,
        user_prompt: str,
        **kwargs,
    ) -> PydanticModel:
        prompt = f"{system_prompt}\n\n{user_prompt}"
        
        last_exception = None
        attempt_count = 0

        async for attempt in self.retryer:
            attempt_count += 1
            with attempt: # let tenacity see context of each attempt instead of swallowing until the last
                try:
                    resp = await self.client.aio.models.generate_content(
                        model=self.model_name,
                        contents=prompt,
                        config={
                            "response_mime_type": "application/json",
                            "response_schema": response_model,
                        },
                        **kwargs,
                    )
                    parsed = getattr(resp, "parsed", None)
                    if parsed is not None:
                        return parsed  # type: ignore[return-value]
                    
                    text = getattr(resp, "text", None)
                    if isinstance(text, str) and text.strip():
                        return response_model.model_validate_json(text)

                    # Force a retryable failure when output is empty/invalid
                    raise ValueError("LLM response was empty or not parseable to JSON.")
                
                except ValidationError as e:
                    last_exception = e
                    # Let tenacity handle retry/terminal re-raise
                    raise
                except Exception as e:
                    last_exception = e
                    # Let tenacity handle retry/terminal re-raise
                    raise
        
        # This should never be reached, but if it is, provide better error info
        # NOTE: **IMPORTANT** If we get here, the loop ran zero times (misconfigured retryer) or exited cleanly without return.
        raise RuntimeError(
            f"acreate() reached unexpected fallthrough after {attempt_count} attempts; "
            f"retryer likely yielded no final exception and no success. last_exc={type(last_exception).__name__ if last_exception else None}"
        )
    
    def create_sync(
        self,
        response_model: Type[PydanticModel],
        system_prompt: str,
        user_prompt: str,
        **kwargs,
    ) -> PydanticModel:
        """
        Synchronous wrapper around acreate(), to be compatible with WSGI Flask endpoints (temporarily until ASGI FastAPI)

        1) If no event loop is running in this thread: uses asyncio.run(coro).
        2) If an event loop is running, runs the coroutine in a dedicated background thread with its own loop.
        """
        coro = self.acreate(
            response_model=response_model,
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            **kwargs,
        )

        try:
            # Case 1: no loop running in this thread
            asyncio.get_running_loop() # will raise RuntimeError if none
        except RuntimeError:
            return asyncio.run(coro)

        # Case 2: a loop is already running in this thread -> run in a fresh loop on a worker thread
        def _run():
            return asyncio.run(coro)

        with ThreadPoolExecutor(max_workers=1) as ex:
            future = ex.submit(_run)
            return future.result()