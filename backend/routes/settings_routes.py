from fastapi import APIRouter
from typing import Optional
from supabase import create_client
from datetime import datetime
import os
import uuid
from dotenv import load_dotenv
from flask import Blueprint, request, jsonify
from services.auth import get_user_id_from_token

settings_bp = Blueprint("settings", __name__, url_prefix="/settings")

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_TABLE = os.getenv("SUPABASE_TABLE", "logs")
SETTINGS_TABLE = os.getenv("SUPABASE_SETTINGS_TABLE", "settings")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
router = APIRouter()

@router.get("/logs")
def get_logs(user_id: str,
             type: Optional[str] = None,
             date: Optional[str] = None,
             keyword: Optional[str] = None):
    query = supabase.table(SUPABASE_TABLE).select("*").eq("user_id", user_id)

    if type and type != "All Types":
        query = query.eq("log_type", type)

    if date:
        try:
            date_obj = datetime.strptime(date, "%m/%d/%Y")
            start = date_obj.replace(hour=0, minute=0, second=0).isoformat()
            end = date_obj.replace(hour=23, minute=59, second=59).isoformat()
            query = query.gte("timestamp", start).lte("timestamp", end)
        except:
            return {"error": "Invalid date format. Use mm/dd/yyyy"}

    if keyword:
        query = query.ilike("log_text", f"%{keyword}%")

    logs = query.order("timestamp", desc=True).execute().data
    return {"logs": logs}

@settings_bp.route("/setSettings", methods=["POST"])
def save_settings():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    user_id = get_user_id_from_token(token)
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
    
    data = request.get_json()
    openai_key = data.get("openai_key")
    pinecone_key = data.get("pinecone_key")
    pinecone_env = data.get("pinecone_env")
    pinecone_index = data.get("pinecone_index")
    openai_model = data.get("openai_model")
    temperature = data.get("temperature")

    record = {
        "id": str(uuid.uuid4()),
        # "user_id": user_id,
        "openai_key": openai_key,
        "pinecone_key": pinecone_key,
        "pinecone_env": pinecone_env,
        "pinecone_index": pinecone_index,
        # "tavily_key": tavily_key,
        # "memory_depth": memory_depth,
        "openai_model": openai_model,
        "temperature": temperature,
        "updated_at": datetime.utcnow().isoformat()
    }

    supabase.table(SETTINGS_TABLE).upsert(record).execute()
    return {"status": "settings saved"}
