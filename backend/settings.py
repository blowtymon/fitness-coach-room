from fastapi import APIRouter
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_TABLE = os.getenv("SUPABASE_TABLE", "logs")
SETTINGS_TABLE = os.getenv("SUPABASE_SETTINGS_TABLE", "settings")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
router = APIRouter()

def get_user_settings():
    """Fetch user settings from Supabase. If not found, fallback to .env values."""
    try:
        response = supabase.table("settings").select("*").single().execute()
        settings = response.data if response.data else {}
    except Exception:
        settings = {}

    return {
        "openai_key": settings.get("openai_key") or os.getenv("OPENAI_API_KEY"),
        "openai_model": settings.get("openai_model") or os.getenv("OPENAI_MODEL", "gpt-4o"),
        "temperature": float(settings.get("temperature") or os.getenv("OPENAI_TEMPERATURE", "0.5")),
        "pinecone_key": settings.get("pinecone_key") or os.getenv("PINECONE_API_KEY"),
        "pinecone_index": settings.get("pinecone_index") or os.getenv("PINECONE_INDEX"),
        "pinecone_env": settings.get("pinecone_env") or os.getenv("PINECONE_ENVIRONMENT")
    }