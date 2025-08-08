from flask import Blueprint, request, jsonify, Response, stream_with_context
from datetime import datetime
import uuid
import json
import openai

from config import supabase
from services.auth import get_user_id_from_token
from services.pinecone_service import embed_text, upsert_vector, retrieve_all_logs_from_pinecone
from services.supabase_service import save_log_to_supabase, get_recent_logs, save_message_to_supabase
from settings import get_user_settings

chatgpt_bp = Blueprint("chatgpt", __name__)

@chatgpt_bp.route("/chat", methods=["POST"])
def chat_with_gpt():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    user_id = get_user_id_from_token(token)
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    chat_id = data.get("chat_id")
    user_message = data.get("message")

    if not user_message or not chat_id:
        return jsonify({"error": "Missing fields"}), 400

    settings = get_user_settings()
    openai.api_key = settings["openai_key"]
    # Save user message
    user_msg_id = str(uuid.uuid4())
    assistant_msg_id = str(uuid.uuid4())
    save_message_to_supabase(user_msg_id, chat_id, user_id, "user", user_message)

    # === Retrieve context ===
    # context = retrieve_all_logs_from_pinecone(user_id)
    context = get_recent_logs(user_id)
    # context = "\n\n".join([log["log_text"] for log in logs]) if logs else ""

    # print("context----------------")
    # print(context)
    # === System prompt for all-in-one GPT call ===
    system_prompt = """
    You are Ori's science-backed bodybuilding coach.

    Your tasks:
    1. If the user's message is a **fitness log**, extract a structured `json:` block (no backticks). Format:
        {
            "type": "log",
            "structured": {
                "nutrition": {...},
                "bodyMeasurements": {...},
                "recovery": {...},
                "workout": {
                "exercises": [
                    {"name": "squat", "sets": 3, "reps": 10, "weight": 100},
                    {"name": "bench press", "sets": 3, "reps": 8, "weight": 80}
                ]
                }
            },
            "note": "...",
            "description": "..."
        }

    2. If it's a question and the **user history is provided**, use it to answer accurately. The history comes from the user's fitness logs stored in the system.
       If the user asks about their past logs, summarize or extract directly from the provided context. Do not hallucinate. The log history is provided in full.


    3. If it's a general question unrelated to past logs, answer clearly in **Notion-style markdown** with bold headings, bullet points, and code blocks.

    - Only include `json:` block for logs.
    - Never guess or hallucinate data.
    """

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"The following is the user's past log history from our database:\n\n{context}\n\nNow answer this message:\n{user_message}"}
    ]

    # print("messages--------------------------------")
    # print(messages)
    def generate():
        full_response = ""
        collected_text = ""

        try:
            stream = openai.chat.completions.create(
                model=settings["openai_model"],
                messages=messages,
                stream=True,
                temperature=settings["temperature"],
            )

            for chunk in stream:
                token = getattr(chunk.choices[0].delta, "content", None)
                if token:
                    full_response += token
                    collected_text += token
                    yield token

            # Save GPT assistant reply
            save_message_to_supabase(assistant_msg_id, chat_id, user_id, "assistant", full_response)

            # === Try to parse structured log JSON ===
            if "json:" in collected_text:
                try:
                    json_part = collected_text.split("json:")[1].strip()
                    json_str = json_part.split("```")[0].strip()  # avoid code block wrap
                    parsed = json.loads(json_str)
                    # print("parsed--------------------")
                    # print(parsed)
                    if parsed.get("type") == "log":
                        log_id = str(uuid.uuid4())
                        timestamp = datetime.utcnow().isoformat()

                        save_log_to_supabase(
                            log_id=log_id,
                            user_id=user_id,
                            log_text=user_message,
                            timestamp=timestamp,
                            metadata=parsed.get("structured", {})
                        )

                        # # Vector for log content
                        # vector = embed_text(user_message)
                        # upsert_vector(log_id, vector, {
                        #     "user_id": user_id,
                        #     "timestamp": timestamp,
                        #     "log_text": user_message
                        # })
                except Exception as parse_error:
                    print("[Warning] Failed to parse structured log JSON:")
                    print(parse_error)

            # === Save chat + response to Pinecone ===
            # embedding = embed_text(user_message + " " + full_response)
            # upsert_vector(assistant_msg_id, embedding, {
            #     "user_id": user_id,
            #     "chat_id": chat_id,
            #     "message": full_response,
            #     "source": "pinecone" if used_context else "recent"
            # })

        except Exception as e:
            yield f"\n\n[Error]: {str(e)}"

    return Response(stream_with_context(generate()), mimetype="text/plain")
