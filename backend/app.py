from flask import Flask, send_from_directory
from flask_cors import CORS
import os

from routes.log_routes import log_bp
from routes.folder_routes import folder_bp
from routes.chat_routes import chat_bp
from routes.auth_routes import auth_bp
from routes.upload_routes import upload_bp
from routes.chatgpt_routes import chatgpt_bp
from routes.settings_routes import settings_bp

# url = "http://localhost:8080"
url = "http://172.31.89.40:8080"

app = Flask(__name__, static_folder="../frontend/dist", static_url_path="/")
CORS(app, resources={r"/*": {"origins": url}}, supports_credentials=True)

# Register your API blueprints
app.register_blueprint(log_bp)
app.register_blueprint(folder_bp)
app.register_blueprint(chat_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(upload_bp)
app.register_blueprint(chatgpt_bp)
app.register_blueprint(settings_bp)

# Health check
@app.route("/api/health")
def health():
    return {"status": "✅ Running"}

# Catch-all: serve React index.html for frontend routes
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, "index.html")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True, use_reloader=False)
