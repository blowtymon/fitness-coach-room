from flask import Flask
from flask_cors import CORS

from routes.log_routes import log_bp
from routes.folder_routes import folder_bp
from routes.chat_routes import chat_bp
from routes.auth_routes import auth_bp
from routes.upload_routes import upload_bp
from routes.chatgpt_routes import chatgpt_bp
from routes.settings_routes import settings_bp

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:8080"}}, supports_credentials=True)
app.register_blueprint(log_bp)
app.register_blueprint(folder_bp)
app.register_blueprint(chat_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(upload_bp)
app.register_blueprint(chatgpt_bp)
app.register_blueprint(settings_bp)

@app.route("/")
def health():
    return {"status": "✅ Running"}

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True, use_reloader=False)