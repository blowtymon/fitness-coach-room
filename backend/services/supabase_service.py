from config import supabase
from datetime import datetime
import uuid
import json

def save_log_to_supabase(log_id, user_id, log_text, source="chat", timestamp=None, metadata={}):
    supabase.table("logs").insert({
        "id": log_id,
        "user_id": user_id,
        "log_text": log_text,
        "source": source,
        "timestamp": timestamp or datetime.utcnow().isoformat(),
        "metadata": json.dumps(metadata)
    }).execute()

def save_message_to_supabase(message_id, chat_id, user_id, role, content):
    supabase.table("messages").insert({
        "id": message_id,
        "chat_id": chat_id,
        "user_id": user_id,
        "role": role,
        "content": content,
        "timestamp": datetime.utcnow().isoformat()
    }).execute()

def get_recent_logs(user_id, limit=500):
    res = supabase.table("logs") \
        .select("*") \
        .eq("user_id", user_id) \
        .order("timestamp", desc=True) \
        .limit(limit) \
        .execute()
    return res.data
