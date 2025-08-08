from flask import Blueprint, request, jsonify
import uuid
from werkzeug.utils import secure_filename
from services.auth import get_user_id_from_token
from services.storage_service import upload_file_to_storage
from config import supabase

upload_bp = Blueprint("upload", __name__)

@upload_bp.route("/file", methods=["POST"])
def upload_file():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    user_id = get_user_id_from_token(token)
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
        
    file = request.files["file"]
    file_type = request.form.get("file_type", "generic")
    associated_log_id = request.form.get("associated_log_id")

    if file:
        file_name = secure_filename(file.filename)
        path = f"{user_id}/{uuid.uuid4()}_{file_name}"
        url = upload_file_to_storage("uploads", path, file)

        file_id = str(uuid.uuid4())
        supabase.table("file_uploads").insert({
            "id": file_id,
            "user_id": user_id,
            "file_name": file_name,
            "file_url": url,
            "file_type": file_type,
            "associated_log_id": associated_log_id
        }).execute()

        return jsonify({"status": "uploaded", "file_id": file_id, "url": url})

    return jsonify({"error": "no file"}), 400