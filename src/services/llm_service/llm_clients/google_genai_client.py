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
        # Store the API key instead of creating the client in __init__
        # This prevents sharing HTTP connections across event loops, but can be overhead
        # NOTE: when migrating to ASGI FastAPI set up, global client initialization SHOULD create a shared client, not create new one with each acreate call
        self.api_key = api_key
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

        # Create a fresh client in this event loop to avoid sharing HTTP connections
        client = genai.Client(api_key=self.api_key)

        last_exception = None
        attempt_count = 0

        async for attempt in self.retryer:
            attempt_count += 1
            with attempt: # let tenacity see context of each attempt instead of swallowing until the last
                try:
                    resp = await client.aio.models.generate_content(
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

        Always runs the async coroutine in a dedicated thread with its own event loop to avoid issues
        with the Google GenAI client caching stale event loop references across requests in thread pools.
        """
        coro = self.acreate(
            response_model=response_model,
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            **kwargs,
        )

        # Always run in a fresh thread with its own event loop to avoid
        # issues with the Google GenAI client sharing HTTP connections across event loops
        def _run():
            # Create a completely fresh event loop in this thread
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                return loop.run_until_complete(coro)
            finally:
                try:
                    # Cancel any pending tasks
                    pending = asyncio.all_tasks(loop)
                    for task in pending:
                        task.cancel()
                    # Let tasks finish cancellation
                    if pending:
                        loop.run_until_complete(asyncio.gather(*pending, return_exceptions=True))
                except Exception:
                    pass
                finally:
                    loop.close()
                    asyncio.set_event_loop(None)

        with ThreadPoolExecutor(max_workers=1) as ex:
            future = ex.submit(_run)
            return future.result()
