from flask import Blueprint, request, jsonify
from datetime import datetime
import uuid, json

from services.auth import get_user_id_from_token
from services.pinecone_service import embed_text, upsert_vector, search_similar_vectors
from config import supabase

log_bp = Blueprint("log", __name__)

def flatten_metadata(data: dict, parent_key='', sep='_') -> dict:
    items = []
    for k, v in data.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            items.extend(flatten_metadata(v, new_key, sep=sep).items())
        else:
            items.append((new_key, v))
    return dict(items)


@log_bp.route("/save", methods=["POST"])
def save_log():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    user_id = get_user_id_from_token(token)
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    log_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat()

    supabase.table("logs").insert({
        "id": log_id,
        "user_id": user_id,
        "log_text": data["description"],
        "source": data.get("source", "chat"),
        "timestamp": timestamp,
        "metadata": json.dumps(data.get("structured", {}))
    }).execute()

    structured = data.get("structured", {})
    vector = embed_text(data["description"] + "\n" + json.dumps(structured))
    flat_metadata = {}

    for section, section_data in structured.items():
        if isinstance(section_data, dict):
            for key, value in section_data.items():
                flat_metadata[key] = value
        else:
            flat_metadata[section] = section_data

    metadata = {
        "user_id": user_id,
        "timestamp": timestamp,
        "log_text": data["description"],
        **flat_metadata
    }

    upsert_vector(log_id, vector, metadata)

    return jsonify({"status": "success", "id": log_id})


@log_bp.route("/", methods=["GET"])
def get_logs():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    user_id = get_user_id_from_token(token)
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    limit = int(request.args.get("limit", 50))
    res = supabase.table("logs") \
        .select("*") \
        .eq("user_id", user_id) \
        .order("timestamp", desc=True) \
        .limit(limit) \
        .execute()
    return jsonify(res.data)


@log_bp.route("/filter", methods=["GET"])
def filter_logs():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    user_id = get_user_id_from_token(token)
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    source = request.args.get("source")
    start = request.args.get("start")
    end = request.args.get("end")

    query = supabase.table("logs").select("*").eq("user_id", user_id)
    if source:
        query = query.eq("source", source)
    if start:
        query = query.gte("timestamp", start)
    if end:
        query = query.lte("timestamp", end)

    result = query.order("timestamp", desc=True).execute()
    return jsonify(result.data)


@log_bp.route("/search", methods=["GET"])
def semantic_search_logs():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    user_id = get_user_id_from_token(token)
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
        
    query = request.args.get("q", "")
    top_k = int(request.args.get("top_k", 5))

    result = search_similar_vectors(user_id, query, top_k=top_k)

    logs = []
    for match in result.matches:
        metadata = match.metadata
        logs.append({
            "score": match.score,
            "log_text": metadata.get("description"),
            "timestamp": metadata.get("timestamp")
        })

    return jsonify(logs)


@log_bp.route("/update/<log_id>", methods=["PUT"])
def update_log(log_id):
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    user_id = get_user_id_from_token(token)
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    supabase.table("logs") \
        .update({
            "log_text": data["description"],
            "metadata": json.dumps(data.get("structured", {})),
            "source": data.get("source", "chat")
        }) \
        .eq("id", log_id).eq("user_id", user_id).execute()

    return jsonify({"status": "updated", "log_id": log_id})


@log_bp.route("/delete/<log_id>", methods=["DELETE"])
def delete_log(log_id):
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    user_id = get_user_id_from_token(token)
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
    
    supabase.table("logs").delete().eq("id", log_id).eq("user_id", user_id).execute()
    return jsonify({"status": "deleted", "log_id": log_id})
