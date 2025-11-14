from dotenv import load_dotenv
import os
import time
from services.llm_service.llm_clients import __all__
from services.llm_service.llm_clients.google_genai_client import AsyncGenAITypedClient
from pydantic import BaseModel
import asyncio

# a simple pydantic schema to test response enforcement for LLM client
class IntegerResponse(BaseModel):
    answer: int
    reasoning: str
   
if __name__ == "__main__":
    load_dotenv()

    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
              
    assert GOOGLE_API_KEY is not None, "GOOGLE_API_KEY is not set"

    google_client = AsyncGenAITypedClient(api_key=GOOGLE_API_KEY)

    # sample system + user prompts for testing
    system_prompt = f"""
    You are a helpful assistant specializing in elementary-school mathematics.
    You will be given a simple addition problem and your task is to solve it.
    Please output the answer as a integer and your explanation as a string.
    """
    user_prompt = f"""
    I want you to solve a simple addition problem. What is 2 + 2?
    """

    time_start = time.time()
    try:
        llm_result: IntegerResponse = google_client.create_sync(
            response_model=IntegerResponse,
            system_prompt=system_prompt,
            user_prompt=user_prompt,
        )
    except Exception as e:
        print(f"Failed to retrieve proper results from LLM for reason: {e}")
        raise
    time_end = time.time()

    print(f"Successfully retrieved results from LLM in {time_end - time_start:.2f} seconds!")
    print(f"Answer: {llm_result.answer}, Reasoning: {llm_result.reasoning}")