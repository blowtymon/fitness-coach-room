from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
import os

from routes.log_routes import log_bp
from routes.folder_routes import folder_bp
from routes.chat_routes import chat_bp
from routes.auth_routes import auth_bp
from routes.upload_routes import upload_bp
from routes.chatgpt_routes import chatgpt_bp
from routes.settings_routes import settings_bp

# ALLOWED_ORIGINS = ["http://localhost:8080"]
ALLOWED_ORIGINS = ["http://18.234.185.87:8080"]

BUILD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend/dist"))

app = Flask(__name__, static_folder=BUILD_DIR, static_url_path="/")
CORS(app, resources={r"/api/*": {"origins": ALLOWED_ORIGINS}}, supports_credentials=True)

# ---- API routes (mounted under /api) ----
app.register_blueprint(log_bp,      url_prefix="/api/log")
app.register_blueprint(folder_bp,   url_prefix="/api/folder")
app.register_blueprint(chat_bp,     url_prefix="/api/chats")
app.register_blueprint(auth_bp,     url_prefix="/api/auth")
app.register_blueprint(upload_bp,   url_prefix="/api/upload")
app.register_blueprint(chatgpt_bp,  url_prefix="/api/chatgpt")
app.register_blueprint(settings_bp, url_prefix="/api/settings")

@app.route("/api/health")
def health():
    return jsonify(status="✅ Running")

@app.route("/assets/<path:filename>")
def assets(filename):
    return send_from_directory(os.path.join(app.static_folder, "assets"), filename)

@app.route("/favicon.ico")
def favicon():
    return send_from_directory(app.static_folder, "favicon.ico")

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def spa(path):
    candidate = os.path.join(app.static_folder, path)
    if path and os.path.exists(candidate):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, "index.html")

@app.errorhandler(404)
def not_found(_):
    return send_from_directory(app.static_folder, "index.html")

if __name__ == "__main__":
    print(app.url_map)
    app.run(host="0.0.0.0", port=5000, debug=True, use_reloader=False)
