from flask import Blueprint, request, jsonify
from datetime import datetime
from config import supabase
from gotrue.errors import AuthApiError

auth_bp = Blueprint("auth", __name__)

def _extract_bearer() -> str | None:
    raw = request.headers.get("Authorization", "")
    # debug (short): see if header actually arrives
    print("Auth hdr (first 25):", raw[:25])

    if not raw:
        return None
    # allow case-insensitive "bearer", strip quotes/space
    if raw.lower().startswith("bearer "):
        token = raw[7:]
    else:
        token = raw
    token = token.strip().strip('"').strip("'")
    return token or None

def _get_user_id_from_auth_header() -> str | None:
    token = _extract_bearer()
    if not token:
        return None
    try:
        # be explicit with kwarg; some versions require it
        res = supabase.auth.get_user(jwt=token)
        return res.user.id if res and getattr(res, "user", None) else None
    except AuthApiError as e:
        print("AuthApiError in get_user:", getattr(e, "message", str(e)))
        return None
    except Exception as e:
        print("Unexpected error in get_user:", e)
        return None

@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.json
    try:
        res = supabase.auth.sign_up({
            "email": data["email"],
            "password": data["password"],
            "options": {"data": {"name": data.get("name", "")}}
        })

        user = res.user
        session = res.session

        if not user or not user.id:
            return {"message": "Signup failed, no user returned"}, 400

        if session and session.access_token:
            supabase.postgrest.auth(session.access_token)

        supabase.table("users").insert({
            "id": user.id,
            "email": user.email,
            "name": data.get("name", "")
        }).execute()

        return {
            "message": "Signup successful",
            "user": {"id": user.id, "email": user.email, "name": data.get("name", "")}
        }, 200

    except Exception as e:
        return {"message": "Signup failed", "error": str(e)}, 400


@auth_bp.route("/signin", methods=["POST"])
def signin():
    data = request.json
    try:
        res = supabase.auth.sign_in_with_password({
            "email": data["email"],
            "password": data["password"]
        })

        session = getattr(res, "session", None)
        user = getattr(res, "user", None)

        if session and getattr(session, "access_token", None) and user:
            return {
                "message": "Signin successful",
                "token": session.access_token,
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "name": user.user_metadata.get("name", "")
                }
            }, 200

        return {"message": "Signin failed - no session or user returned"}, 401

    except Exception as e:
        return {"message": "Signin error", "error": str(e)}, 400


@auth_bp.route("/ping", methods=["GET"])
def ping():
    user_id = _get_user_id_from_auth_header()
    if not user_id:
        return jsonify({"error": "Unauthorized", "code": "token_invalid_or_expired"}), 401
    return jsonify({"status": "ok", "user_id": user_id}), 200