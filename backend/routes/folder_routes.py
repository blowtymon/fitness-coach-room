from flask import Blueprint, request, jsonify
import uuid
from services.auth import get_user_id_from_token
from config import supabase

folder_bp = Blueprint("folder", __name__, url_prefix="/folders")

@folder_bp.route("/create", methods=["POST"])
def create_folder():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    user_id = get_user_id_from_token(token)
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
    
    data = request.json

    folder_id = str(uuid.uuid4())
    supabase.table("folders").insert({
        "id": folder_id,
        "user_id": user_id,
        "name": data["name"]
    }).execute()

    return jsonify({"status": "success", "folder_id": folder_id})


@folder_bp.route("/", methods=["GET"])
def get_folders():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    user_id = get_user_id_from_token(token)
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
    
    res = supabase.table("folders").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    return jsonify(res.data)


@folder_bp.route("/update/<folder_id>", methods=["PUT"])
def update_folder(folder_id):
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    user_id = get_user_id_from_token(token)
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
    
    data = request.json

    supabase.table("folders").update({"name": data["name"]}).eq("id", folder_id).eq("user_id", user_id).execute()
    return jsonify({"status": "updated", "folder_id": folder_id})


@folder_bp.route("/delete/<folder_id>", methods=["DELETE"])
def delete_folder(folder_id):
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    user_id = get_user_id_from_token(token)
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
    
    supabase.table("folders").delete().eq("id", folder_id).eq("user_id", user_id).execute()
    return jsonify({"status": "deleted", "folder_id": folder_id})
