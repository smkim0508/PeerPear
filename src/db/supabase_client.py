import os
import uuid
from supabase import create_client, Client
from dotenv import load_dotenv

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
    Upload an event image to Supabase Storage and return its public URL.

    Args:
        event_id: ID of the event
        file_bytes: Image bytes
        filename: Original filename
        content_type: MIME type of the image (optional)
        old_image_url: URL of old image to delete (optional)

    Returns:
        Public URL of uploaded image
    """
    bucket = os.environ.get("SUPABASE_BUCKET", "event-images")

    # ensure content_type is a string
    content_type = content_type or "application/octet-stream"

    # deterministic filename
    ext = filename.split('.')[-1]
    file_name = f"event_{event_id}.{ext}"

    # delete old image if exists
    if old_image_url:
        try:
            old_path = old_image_url.split("/")[-1]
            supabase.storage.from_(bucket).remove([old_path])
        except Exception as e:
            print("Failed to delete old image:", e)

    try:
        supabase.storage.from_(bucket).upload(
            path=file_name,
            file=file_bytes,
            file_options={"content-type": content_type}  # no upsert here
        )

        public_url = supabase.storage.from_(bucket).get_public_url(file_name)
        return public_url

    except Exception as e:
        raise RuntimeError(f"Failed to upload image: {e}")