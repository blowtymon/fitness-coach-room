from flask import Blueprint, request, jsonify
import uuid
from datetime import datetime
from services.supabase_service import save_message_to_supabase
from config import supabase
from services.auth import get_user_id_from_token

chat_bp = Blueprint("chat", __name__)

# Create a new chat
@chat_bp.route("/create", methods=["POST"])
def create_chat():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    user_id = get_user_id_from_token(token)
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    chat_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    supabase.table("chats").insert({
        "id": chat_id,
        "user_id": user_id,
        "folder_id": data.get("folder_id"),
        "title": data.get("title", "New Chat"),
        "created_at": now,
        "updated_at": now
    }).execute()

    return jsonify({"status": "success", "chat_id": chat_id})

# Get all chats (optionally filtered by folder_id)
@chat_bp.route("/", methods=["GET"])
def get_chats():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    user_id = get_user_id_from_token(token)
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    folder_id = request.args.get("folder_id")

    query = supabase.table("chats").select("*").eq("user_id", user_id)
    if folder_id:
        query = query.eq("folder_id", folder_id)

    res = query.order("created_at", desc=True).execute()
    return jsonify(res.data)

# Get all messages filtered by user_id and chat_id
@chat_bp.route("/messages", methods=["GET"])
def get_messages():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    user_id = get_user_id_from_token(token)
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    chat_id = request.args.get("chat_id")
    if not chat_id:
        return jsonify({"error": "Missing chat_id"}), 400

    res = supabase.table("messages") \
        .select("*") \
        .eq("user_id", user_id) \
        .eq("chat_id", chat_id) \
        .order("timestamp", desc=False) \
        .execute()


    return jsonify(res.data)


@chat_bp.route("/addMessage", methods=["POST"])
def add_message():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    user_id = get_user_id_from_token(token)
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()
    chat_id = data.get("chat_id")
    content = data.get("content")
    role = data.get("role", "user")
    message_id = str(uuid.uuid4())
    print(chat_id, content, role)
    save_message_to_supabase(message_id, chat_id, user_id, role, content)

    return jsonify({"status": "success", "message_id": message_id})


# Update a chat's title
@chat_bp.route("/update/<chat_id>", methods=["PUT"])
def update_chat(chat_id):
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    user_id = get_user_id_from_token(token)
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    updated_at = datetime.utcnow().isoformat()

    supabase.table("chats").update({
        "title": data["title"],
        "updated_at": updated_at
    }).eq("id", chat_id).eq("user_id", user_id).execute()

    return jsonify({"status": "updated", "chat_id": chat_id})

# Delete a chat
@chat_bp.route("/delete/<chat_id>", methods=["DELETE"])
def delete_chat(chat_id):
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    user_id = get_user_id_from_token(token)
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    supabase.table("chats").delete().eq("id", chat_id).eq("user_id", user_id).execute()
    return jsonify({"status": "deleted", "chat_id": chat_id})
