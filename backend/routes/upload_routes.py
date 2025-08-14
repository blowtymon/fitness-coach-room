# routes/upload_routes.py
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
        return jsonify({"success": False, "error": "Unauthorized"}), 401

    file = request.files.get("file")
    if not file or not getattr(file, "filename", ""):
        return jsonify({"success": False, "error": "no file"}), 400

    file_type = request.form.get("file_type", "generic")
    associated_log_id = request.form.get("associated_log_id")

    try:
        file_name = secure_filename(file.filename)
        object_path = f"{user_id}/{uuid.uuid4()}_{file_name}"

        url = upload_file_to_storage("uploads", object_path, file, content_type=file.mimetype)

        file_id = str(uuid.uuid4())
        res = supabase.table("file_uploads").insert({
            "id": file_id,
            "user_id": user_id,
            "file_name": file_name,
            "file_url": url,
            "file_type": file_type,
            "associated_log_id": associated_log_id
        }).execute()

        if hasattr(res, "error") and res.error:
            return jsonify({"success": False, "error": str(res.error)}), 500

        return jsonify({
            "success": True,
            "data": {
                "fileUrl": url,
                "logId": file_id
            }
        }), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
