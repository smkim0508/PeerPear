import os
import time
from supabase import create_client, Client
from dotenv import load_dotenv
import uuid

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError("Supabase environment variables are not set!")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

def upload_event_image(
    event_id: int,
    file_bytes: bytes,
    filename: str,
    content_type: str | None = None,
    old_image_url: str | None = None
) -> str:
    """
    Upload an event image to Supabase Storage and return its public URL
    (with cache-busting to force refresh).
    """

    bucket = os.environ.get("SUPABASE_BUCKET", "event-images")

    # Ensure MIME type
    content_type = content_type or "application/octet-stream"

    # Deterministic filename
    ext = filename.split(".")[-1]
    file_name = f"event_{event_id}.{ext}"

    # 1. Delete existing file BEFORE upload
    try:
        supabase.storage.from_(bucket).remove([file_name])
    except Exception as e:
        print("No existing file to delete or error deleting:", e)

    # 2. Upload file normally (no upsert)
    try:
        supabase.storage.from_(bucket).upload(
            path=file_name,
            file=file_bytes,
            file_options={"content-type": content_type}
        )

        # 3. Add cache-busting timestamp
        public_url = supabase.storage.from_(bucket).get_public_url(file_name)
        public_url = f"{public_url}?t={int(time.time())}"

        return public_url

    except Exception as e:
        raise RuntimeError(f"Failed to upload image: {e}")

def upload_new_image(file_bytes: bytes, filename: str, content_type: str) -> str:
    bucket = os.environ.get("SUPABASE_BUCKET", "event-images")

    # Ensure unique filename
    ext = filename.split('.')[-1]
    unique_name = f"{uuid.uuid4()}.{ext}"

    try:
        res = supabase.storage.from_(bucket).upload(
            path=unique_name,
            file=file_bytes,
            file_options={
                "content-type": content_type,
                "upsert": "true"
            }
        )

        public_url = supabase.storage.from_(bucket).get_public_url(unique_name)
        return public_url

    except Exception as e:
        raise RuntimeError(f"Failed to upload image: {e}")
