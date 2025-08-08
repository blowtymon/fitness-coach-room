from flask import Blueprint, request, jsonify, redirect, url_for
from config import supabase
from datetime import datetime

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.json
    try:
        res = supabase.auth.sign_up({
            "email": data["email"],
            "password": data["password"],
            "options": {
                "data": {
                    "name": data.get("name", "")
                }
            }
        })

        user = res.user

        if user and user.id:
            supabase.table("users").insert({
                "id": user.id,
                "email": user.email,
                "name": data.get("name", ""),
                "created_at": datetime.utcnow().isoformat()
            }).execute()

            return {
                "message": "Signup successful",
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "name": data.get("name", "")
                }
            }, 200
        else:
            return {"message": "Signup failed, no user returned"}, 400

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


