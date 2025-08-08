from fastapi import APIRouter
from typing import Optional
from supabase import create_client
from datetime import datetime
import os
import uuid
from dotenv import load_dotenv
from flask import Blueprint, request, jsonify
from services.auth import get_user_id_from_token

settings_bp = Blueprint("settings", __name__)

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

    data = request.get_json() or {}

    existing = supabase.table(SETTINGS_TABLE).select("*").limit(1).single().execute()
    existing_row = existing.data if hasattr(existing, "data") else None

    def present(v):
        return v is not None and v != "" 

    fields = [
        "openai_key",
        "pinecone_key",
        "pinecone_env",
        "pinecone_index",
        "openai_model",
        "temperature",
    ]

    updates = {k: v for k, v in ((f, data.get(f)) for f in fields) if present(v)}
    updates["updated_at"] = datetime.utcnow().isoformat()

    if existing_row:
        supabase.table(SETTINGS_TABLE).update(updates).eq("id", existing_row["id"]).execute()
    else:
        record = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            **updates,
        }
        supabase.table(SETTINGS_TABLE).insert(record).execute()

    return {"status": "settings saved"}
