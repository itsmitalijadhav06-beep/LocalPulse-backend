import re
import uuid
from datetime import datetime, timezone

def generate_uuid() -> str:
    """
    Generate a random UUID v4 string.
    """
    return str(uuid.uuid4())

def get_utc_now() -> datetime:
    """
    Return the current datetime in UTC timezone.
    """
    return datetime.now(timezone.utc)

def get_utc_now_iso() -> str:
    """
    Return the current datetime in ISO 8601 format with UTC timezone.
    """
    return get_utc_now().isoformat()

def slugify(text: str) -> str:
    """
    Convert a string into a URL-friendly slug.
    """
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    text = re.sub(r"^-+|-+$", "", text)
    return text
